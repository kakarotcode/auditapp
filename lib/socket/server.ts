import { logger } from '@/lib/logger'
import { Server, type Socket } from 'socket.io'
import http from 'http'
import IORedis from 'ioredis'
import { db } from '@/lib/db'

// ─── Singleton IO instance ───────────────────────────────────────────────────

let io: Server | null = null

// ─── Redis pub/sub clients ───────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

// Publisher used by emitToOrg (also used in workers)
const publisher = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

publisher.on('error', (err: Error) => {
  logger.error('[Socket] Redis publisher error:', err.message)
})

// ─── Socket handshake auth shape ─────────────────────────────────────────────

interface SocketAuthData {
  orgId?: string
  userId?: string
  sessionToken?: string
}

// ─── Socket server setup ─────────────────────────────────────────────────────

export function setupSocketServer(httpServer: http.Server): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL ?? '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Authentication middleware — validates session token against NextAuth sessions table
  io.use(async (socket: Socket, next) => {
    try {
      const auth = socket.handshake.auth as SocketAuthData

      const sessionToken = auth.sessionToken

      if (!sessionToken) {
        return next(new Error('Authentication: session token required'))
      }

      // Look up the active session in the database
      const session = await db.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            select: { id: true, orgId: true, isActive: true },
          },
        },
      })

      if (!session) {
        return next(new Error('Authentication: session not found'))
      }

      if (session.expires < new Date()) {
        return next(new Error('Authentication: session expired'))
      }

      if (!session.user.isActive) {
        return next(new Error('Authentication: user is inactive'))
      }

      // Verify org still exists
      const org = await db.organisation.findUnique({
        where: { id: session.user.orgId },
        select: { id: true },
      })
      if (!org) {
        return next(new Error('Authentication: organisation not found'))
      }

      // Attach to socket for later use
      socket.data.orgId = session.user.orgId
      socket.data.userId = session.user.id

      next()
    } catch (err) {
      logger.error('[Socket] Auth middleware error:', err)
      next(new Error('Internal authentication error'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const orgId = socket.data.orgId as string
    const userId = socket.data.userId as string

    logger.info(`[Socket] Client connected: userId=${userId} orgId=${orgId} id=${socket.id}`)

    // Join org room
    void socket.join(orgId)

    socket.on('disconnect', (reason: string) => {
      logger.info(`[Socket] Client disconnected: id=${socket.id} reason=${reason}`)
    })

    socket.on('error', (err: Error) => {
      logger.error(`[Socket] Socket error for id=${socket.id}:`, err.message)
    })
  })

  // Subscribe to Redis pub/sub channel and forward to room
  const subscriber = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  subscriber.on('error', (err: Error) => {
    logger.error('[Socket] Redis subscriber error:', err.message)
  })

  void subscriber.psubscribe('socket:*', (err) => {
    if (err) logger.error('[Socket] psubscribe error:', err)
  })

  subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
    // channel format: socket:{orgId}:{event}
    const parts = channel.split(':')
    if (parts.length < 3) return

    const orgId = parts[1]
    const event = parts.slice(2).join(':')

    let data: unknown
    try {
      data = JSON.parse(message)
    } catch {
      data = message
    }

    if (io) {
      io.to(orgId).emit(event, data)
    }
  })

  logger.info('[Socket] Socket.IO server initialised')
  return io
}

// ─── emitToOrg ───────────────────────────────────────────────────────────────
// Called from worker processes — publishes to Redis so the socket server
// can forward to the appropriate room.

export function emitToOrg(orgId: string, event: string, data: unknown): void {
  const channel = `socket:${orgId}:${event}`
  const message = JSON.stringify(data)

  publisher.publish(channel, message).catch((err: Error) => {
    logger.error(`[Socket] Failed to publish to ${channel}:`, err.message)
  })
}
