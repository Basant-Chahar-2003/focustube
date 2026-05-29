import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifyToken } from '../../../lib/auth'
import { getUserLibrary, addVideoToLibrary, removeVideoFromLibrary } from '../../../lib/serverStorage'

async function getUserFromCookie() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return await verifyToken(token)
}

export async function GET(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const lib = await getUserLibrary(user.id)
  return NextResponse.json({ library: lib })
}

export async function POST(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { video } = body
  if (!video?.id) return NextResponse.json({ error: 'Invalid video' }, { status: 400 })
  const lib = await addVideoToLibrary(user.id, video)
  return NextResponse.json({ library: lib })
}

export async function DELETE(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const videoId = url.searchParams.get('videoId')
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  const lib = await removeVideoFromLibrary(user.id, videoId)
  return NextResponse.json({ library: lib })
}
