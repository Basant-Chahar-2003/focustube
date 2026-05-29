import { getDb } from './mongo'
import { ObjectId } from 'mongodb'

export async function getUserLibrary(userId) {
  const db = await getDb()
  const rows = await db.collection('videos').find({ user_id: userId }).sort({ added_at: -1 }).toArray()
  return rows.map(r => ({
    id: r.video_id,
    title: r.video_title,
    link: r.video_link,
    channel: r.video_channel,
    thumbnail: r.video_thumbnail,
    duration: r.video_duration,
    completion_status: r.completion_status,
    completed_percentage: r.completed_percentage,
    added_at: r.added_at,
  }))
}

export async function addVideoToLibrary(userId, video) {
  const db = await getDb()
  await db.collection('videos').updateOne(
    { user_id: userId, video_id: video.id },
    {
      $set: {
        video_title: video.title || null,
        video_link: video.link || null,
        video_channel: video.channel || null,
        video_thumbnail: video.thumbnail || null,
        video_duration: video.duration || null,
        completion_status: video.completion_status || null,
        completed_percentage: video.completed_percentage || null,
      },
      $setOnInsert: {
        user_id: userId,
        video_id: video.id,
        added_at: Date.now(),
      }
    },
    { upsert: true }
  )
  // Refresh cached aggregated stats for fast reads
  try { await ensureUserStats(userId) } catch (e) { /* ignore */ }
  return getUserLibrary(userId)
}

export async function removeVideoFromLibrary(userId, videoId) {
  const db = await getDb()
  await db.collection('videos').deleteOne({ user_id: userId, video_id: videoId })
  // Refresh cached aggregated stats for fast reads
  try { await ensureUserStats(userId) } catch (e) { /* ignore */ }
  return getUserLibrary(userId)
}

export async function getUserNotes(userId, videoId) {
  const db = await getDb()
  const filter = { user_id: userId }
  if (videoId) filter.video_id = videoId
  const rows = await db.collection('notes').find(filter).sort({ created_at: 1 }).toArray()
  return rows.map(r => ({
    id: r._id.toString(),
    video_id: r.video_id,
    text: r.note_text,
    timestamp_seconds: r.timestamp_seconds,
    timestampLabel: r.timestamp_label,
    created_at: r.created_at,
  }))
}

export async function addNote(userId, videoId, note) {
  const db = await getDb()
  const doc = {
    user_id: userId,
    video_id: videoId,
    note_text: note.text || note.note || '',
    timestamp_seconds: note.timestamp_seconds || note.timestamp || 0,
    timestamp_label: note.timestampLabel || note.timestamp_label || null,
    created_at: Date.now(),
  }
  await db.collection('notes').insertOne(doc)
  return getUserNotes(userId, videoId)
}

export async function deleteNote(userId, videoId, noteId) {
  const db = await getDb()
  await db.collection('notes').deleteOne({ _id: new ObjectId(noteId), user_id: userId, video_id: videoId })
  return getUserNotes(userId, videoId)
}

export async function getUserStreak(userId) {
  const db = await getDb()
  const doc = await db.collection('streaks').findOne({ user_id: userId })
  return doc?.dates || []
}

export async function addStreakDate(userId, dateStr) {
  const db = await getDb()
  const col = db.collection('streaks')
  const doc = await col.findOne({ user_id: userId })
  const dates = doc?.dates || []
  if (dates.includes(dateStr)) return dates
  dates.push(dateStr)
  // keep only last 30 days
  const newDates = dates.slice(-30)
  await col.updateOne(
    { user_id: userId },
    { $set: { dates: newDates, updated_at: Date.now() } },
    { upsert: true }
  )
  return newDates
}

export async function updateDailyActivity(userId, dateStr, action) {
  const db = await getDb()
  const col = db.collection('daily_activity')
  const update = {}
  if (action === 'login') update.loggedIn = true
  if (action === 'played') update.played = true

  await col.updateOne(
    { user_id: userId, date: dateStr },
    { $set: { ...update, updated_at: Date.now() }, $setOnInsert: { created_at: Date.now() } },
    { upsert: true }
  )

  const doc = await col.findOne({ user_id: userId, date: dateStr })
  const both = doc && doc.loggedIn && doc.played
  if (both) {
    // mark streak (idempotent)
    await addStreakDate(userId, dateStr)
    // refresh cached stats
    try { await ensureUserStats(userId) } catch (e) { /* ignore */ }
  }
  return { activity: doc || {}, both }
}

export async function getUserStats(userId) {
  const db = await getDb()
  const doc = await db.collection('stats').findOne({ user_id: userId })
  return doc || null
}

export async function upsertUserStats(userId, data) {
  const db = await getDb()
  await db.collection('stats').updateOne(
    { user_id: userId },
    { $set: { ...data, updated_at: Date.now(), user_id: userId } },
    { upsert: true }
  )
  return getUserStats(userId)
}

function calculateStreakFromDates(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...dates].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  if (sorted[0] !== today) return 0
  let count = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (prev - curr) / (1000 * 60 * 60 * 24)
    if (diff === 1) count++
    else break
  }
  return count
}

export async function ensureUserStats(userId) {
  const db = await getDb()
  const saved = await db.collection('videos').countDocuments({ user_id: userId })
  const completed = await db.collection('videos').countDocuments({ user_id: userId, $or: [ { completion_status: 'done' }, { completed_percentage: 100 } ] })
  const streakDoc = await db.collection('streaks').findOne({ user_id: userId })
  const dates = streakDoc?.dates || []
  const streak = calculateStreakFromDates(dates)
  await upsertUserStats(userId, { saved, completed, streak, dates })
  return getUserStats(userId)
}

export async function getUserProgress(userId, videoId) {
  const db = await getDb()
  const doc = await db.collection('progress').findOne({ user_id: userId, video_id: videoId })
  if (!doc) return null
  return {
    lastTime: doc.last_time || 0,
    percent: doc.percent || 0,
    completed: !!doc.completed,
    watchedAt: doc.watched_at || null,
  }
}

export async function saveUserProgress(userId, videoId, update) {
  const db = await getDb()
  const set = {}
  if (typeof update.lastTime !== 'undefined') set.last_time = update.lastTime
  if (typeof update.percent !== 'undefined') set.percent = update.percent
  if (typeof update.completed !== 'undefined') set.completed = update.completed
  if (typeof update.watchedAt !== 'undefined') set.watched_at = update.watchedAt

  await db.collection('progress').updateOne(
    { user_id: userId, video_id: videoId },
    { $set: { ...set, updated_at: Date.now() }, $setOnInsert: { user_id: userId, video_id: videoId, created_at: Date.now() } },
    { upsert: true }
  )

  return getUserProgress(userId, videoId)
}
