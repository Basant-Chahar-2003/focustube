import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifyToken } from '../../../lib/auth'
import { getUserNotes, addNote, deleteNote } from '../../../lib/serverStorage'

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
  const rows = await getUserNotes(user.id, videoId)
  if (videoId) {
    return NextResponse.json({ notes: rows })
  }

  const grouped = rows.reduce((acc, note) => {
    if (!acc[note.video_id]) acc[note.video_id] = []
    acc[note.video_id].push(note)
    return acc
  }, {})

  return NextResponse.json({ notes: grouped })
}

export async function POST(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { videoId, note } = body
  if (!videoId || !note) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const notes = await addNote(user.id, videoId, note)
  return NextResponse.json({ notes })
}

export async function DELETE(request) {
  const user = await getUserFromCookie()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { videoId, noteId } = body
  if (!videoId || !noteId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const notes = await deleteNote(user.id, videoId, noteId)
  return NextResponse.json({ notes })
}
