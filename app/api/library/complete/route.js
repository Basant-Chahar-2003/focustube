import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifyToken } from '../../../../lib/auth'
import { getDb } from '../../../../lib/mongo'
import { ensureUserStats } from '../../../../lib/serverStorage'

async function getUserIdFromCookies() {
  const c = cookies()
  const token = c.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const data = await verifyToken(token)
    return data?.id || null
  } catch {
    return null
  }
}

export async function POST(req) {
  const userId = await getUserIdFromCookies()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { videoId, completion_status, completed_percentage } = body
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

  const db = await getDb()
  await db.collection('videos').updateOne(
    { user_id: userId, video_id: videoId },
    { $set: { completion_status: completion_status || null, completed_percentage: completed_percentage ?? null } }
  )

  try { await ensureUserStats(userId) } catch (e) { /* ignore */ }

  return NextResponse.json({ ok: true })
}
