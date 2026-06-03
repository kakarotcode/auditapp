import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { UserRole } from '@prisma/client'

// ---------------------------------------------------------------------------
// Module augmentation — extend NextAuth types with orgId and role
// ---------------------------------------------------------------------------

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      orgId: string
      role: UserRole
    } & DefaultSession['user']
  }

  interface User {
    orgId?: string
    role?: UserRole
  }
}


// ---------------------------------------------------------------------------
// Credentials input schema
// ---------------------------------------------------------------------------

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// ---------------------------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------------------------

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // ------------------------------------------------------------------
    // Email + Password (Credentials)
    // ------------------------------------------------------------------
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            orgId: true,
            isActive: true,
            avatarUrl: true,
          },
        })

        if (!user || !user.passwordHash || !user.isActive) return null

        const passwordValid = await bcrypt.compare(password, user.passwordHash)
        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? null,
          orgId: user.orgId,
          role: user.role,
        }
      },
    }),

    // ------------------------------------------------------------------
    // Google OAuth
    // ------------------------------------------------------------------
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
      // Also request read-only Gmail access + a refresh token, so "Scan my
      // Gmail" can read recent emails. access_type=offline + prompt=consent
      // ensure Google returns a refresh_token.
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    // ------------------------------------------------------------------
    // signIn — update lastLoginAt and enforce active status
    // ------------------------------------------------------------------
    async signIn({ user, account }) {
      if (!user.email) return false

      // For OAuth sign-ins, look up the existing user to check isActive
      if (account?.provider !== 'credentials') {
        const dbUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { isActive: true, orgId: true, role: true },
        })

        if (dbUser && !dbUser.isActive) return false

        // Attach orgId / role for new OAuth users who already have a DB record
        if (dbUser) {
          user.orgId = dbUser.orgId
          user.role = dbUser.role
        }
      }

      // Update lastLoginAt
      try {
        await db.user.update({
          where: { email: user.email.toLowerCase() },
          data: { lastLoginAt: new Date() },
        })
      } catch {
        // User may not exist yet (first OAuth sign-in) — adapter will create them
      }

      return true
    },

    // ------------------------------------------------------------------
    // jwt — persist orgId and role in the token
    // ------------------------------------------------------------------
    async jwt({ token, user, trigger, session }) {
      const appToken = token as typeof token & {
        orgId?: string
        role?: UserRole
      }
      // First sign-in: user object is populated
      if (user) {
        appToken.sub = user.id
        appToken.orgId = user.orgId
        appToken.role = user.role
      }

      // Session update (e.g. role change by admin)
      if (trigger === 'update' && session) {
        if (session.orgId) appToken.orgId = session.orgId as string
        if (session.role) appToken.role = session.role as UserRole
      }

      // For an existing session (no fresh `user` object), verify the user
      // still exists and refresh orgId/role from the DB (the source of truth).
      // If the user record is gone — e.g. the database was re-seeded, which
      // regenerates all IDs — invalidate the session by returning null so the
      // client is forced to log in again. This prevents the confusing state
      // where a stale cookie points at a non-existent org and the dashboard
      // silently renders empty defaults (score 100, 0 incidents).
      if (appToken.sub && !user) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: appToken.sub },
            select: { orgId: true, role: true },
          })
          if (!dbUser) return null // stale session → force re-authentication
          appToken.orgId = dbUser.orgId
          appToken.role = dbUser.role
        } catch {
          // DB transiently unavailable — keep the existing token rather than
          // logging the user out on a temporary error.
        }
      }

      return appToken
    },

    // ------------------------------------------------------------------
    // session — expose orgId and role on the session object
    // ------------------------------------------------------------------
    async session({ session, token }) {
      const appToken = token as typeof token & {
        orgId?: string
        role?: UserRole
      }
      if (token.sub) {
        session.user.id = token.sub
      }
      if (appToken.orgId) {
        session.user.orgId = appToken.orgId as string
      }
      if (appToken.role) {
        session.user.role = appToken.role as UserRole
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
