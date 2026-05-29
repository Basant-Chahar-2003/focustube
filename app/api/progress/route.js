import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifyToken } from '../../../lib/auth'
import { getUserProgress, saveUserProgress } from '../../../lib/serverStorage'

async function getUserFromCookie() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return await verifyToken(token)
}

export async function GET(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const videoId = url.searchParams.get('videoId')
  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  const progress = await getUserProgress(user.id, videoId)
  return NextResponse.json({ progress: progress || {} })
}

export async function POST(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { videoId, progress } = body
  if (!videoId || !progress) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const saved = await saveUserProgress(user.id, videoId, progress)
  return NextResponse.json({ progress: saved || {} })
}
