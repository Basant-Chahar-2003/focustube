import { NextResponse } from 'next/server'
import { addStreakDate, getUserStreak, getUserLibrary, getUserStats, ensureUserStats } from '../../../lib/serverStorage'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifyToken } from '../../../lib/auth'

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

export async function GET() {
  const userId = await getUserIdFromCookies()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // try cached stats first; compute and cache if missing
  let stats = await getUserStats(userId)
  if (!stats) stats = await ensureUserStats(userId)
  return NextResponse.json({ saved: stats.saved || 0, completed: stats.completed || 0, streak: stats.streak || 0, dates: stats.dates || [] })
}

export async function POST(req) {
  const userId = await getUserIdFromCookies()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // accept optional action in body: 'login' or 'played'
  let body = {}
  try { body = await req.json() } catch (e) { body = {} }
  const action = body.action || null
  const today = new Date().toISOString().slice(0, 10)

  if (action === 'login' || action === 'played') {
    const res = await (await import('../../../lib/serverStorage')).updateDailyActivity(userId, today, action)
    const stats = await ensureUserStats(userId)
    return NextResponse.json({ activity: res.activity || {}, both: res.both, stats })
  }

  // legacy: if no action provided, behave as before and add streak date
  const dates = await addStreakDate(userId, today)
  const stats = await ensureUserStats(userId)
  return NextResponse.json({ dates, stats })
}
