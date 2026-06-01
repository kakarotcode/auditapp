import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const dynamic = 'force-dynamic'

function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION ?? 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const report = await db.report.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    if (report.status !== 'READY') {
      return NextResponse.json(
        { error: 'Report is not ready yet', code: 'REPORT_NOT_READY', status: report.status },
        { status: 409 }
      )
    }

    if (!report.s3Key) {
      return NextResponse.json(
        { error: 'Report file not available', code: 'NO_FILE' },
        { status: 404 }
      )
    }

    const bucket = process.env.AWS_S3_BUCKET
    if (!bucket) {
      return NextResponse.json(
        { error: 'Storage not configured', code: 'STORAGE_NOT_CONFIGURED' },
        { status: 500 }
      )
    }

    const s3 = getS3Client()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: report.s3Key,
      ResponseContentDisposition: `attachment; filename="${report.title.replace(/[^a-z0-9\s-]/gi, '')}.pdf"`,
      ResponseContentType: 'application/pdf',
    })

    // 7-day presigned URL
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 7 * 24 * 60 * 60 })

    // Update the report's downloadUrl and log audit event
    await Promise.all([
      db.report.update({
        where: { id: params.id },
        data: { downloadUrl },
      }),
      db.auditEvent.create({
        data: {
          orgId: session.user.orgId,
          userId: session.user.id,
          action: 'REPORT_DOWNLOADED',
          resource: 'Report',
          resourceId: params.id,
          metadata: { reportType: report.type, title: report.title },
        },
      }),
    ])

    return NextResponse.json({ downloadUrl })
  } catch (error) {
    console.error('[reports/[id]/download GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
