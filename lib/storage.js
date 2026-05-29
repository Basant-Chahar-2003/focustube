const KEYS = {
  LIBRARY: 'ff_library',
  PROGRESS: 'ff_progress',
  NOTES: 'ff_notes',
  STREAK: 'ff_streak',
}

function get(key) {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function set(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Library ──────────────────────────────────────────────
export function getLibrary() {
  return get(KEYS.LIBRARY) || []
}

export function saveVideo(video) {
  const lib = getLibrary()
  if (lib.find(v => v.id === video.id)) return
  lib.unshift({ ...video, addedAt: Date.now() })
  set(KEYS.LIBRARY, lib)
}

export function removeVideo(videoId) {
  const lib = getLibrary().filter(v => v.id !== videoId)
  set(KEYS.LIBRARY, lib)
}

export function isInLibrary(videoId) {
  return getLibrary().some(v => v.id === videoId)
}

// ── Progress ─────────────────────────────────────────────
export function getProgress(videoId) {
  const all = get(KEYS.PROGRESS) || {}
  const progress = all[videoId] || {}
  return { completed: false, watchedAt: null, percent: 0, lastTime: 0, ...progress }
}

export function saveProgress(videoId, progressUpdate) {
  const all = get(KEYS.PROGRESS) || {}
  const current = all[videoId] || { completed: false, watchedAt: null, percent: 0, lastTime: 0 }
  const updated = { ...current, ...progressUpdate }
  all[videoId] = updated
  set(KEYS.PROGRESS, all)
  return updated
}

export function markComplete(videoId) {
  const progress = saveProgress(videoId, { completed: true, watchedAt: Date.now(), percent: 100 })
  updateStreak()
  // If user is logged in, notify server to record streak for this user.
  if (typeof window !== 'undefined') {
    ;(async () => {
      try {
        await fetch('/api/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'played' }) })
      } catch (e) {
        // ignore network errors and keep local streak as fallback
      }
    })()
  }
  return progress
}

export function unmarkComplete(videoId) {
  const progress = saveProgress(videoId, { completed: false, watchedAt: null, percent: 0 })
  return progress
}

export function getAllProgress() {
  return get(KEYS.PROGRESS) || {}
}

// ── Notes ────────────────────────────────────────────────
export function getNotes(videoId) {
  const all = get(KEYS.NOTES) || {}
  return all[videoId] || []
}

export function saveNote(videoId, note) {
  const all = get(KEYS.NOTES) || {}
  const notes = all[videoId] || []
  notes.push({ ...note, id: Date.now() })
  all[videoId] = notes
  set(KEYS.NOTES, all)
  return notes
}

export function deleteNote(videoId, noteId) {
  const all = get(KEYS.NOTES) || {}
  all[videoId] = (all[videoId] || []).filter(n => n.id !== noteId)
  set(KEYS.NOTES, all)
  return all[videoId]
}

export function updateNote(videoId, noteId, text) {
  const all = get(KEYS.NOTES) || {}
  all[videoId] = (all[videoId] || []).map(n => n.id === noteId ? { ...n, text } : n)
  set(KEYS.NOTES, all)
  return all[videoId]
}

// ── Streak ───────────────────────────────────────────────
export function getStreak() {
  return get(KEYS.STREAK) || { dates: [] }
}

function updateStreak() {
  const streak = getStreak()
  const today = new Date().toISOString().slice(0, 10)
  if (!streak.dates.includes(today)) {
    streak.dates.push(today)
    // keep only last 30 days
    streak.dates = streak.dates.slice(-30)
    set(KEYS.STREAK, streak)
  }
}

export function getLast7Days() {
  const streak = getStreak()
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    result.push({ date: dateStr, done: streak.dates.includes(dateStr), isToday: i === 0 })
  }
  return result
}

export function getStats() {
  const library = getLibrary()
  const progress = getAllProgress()
  const completed = library.filter(v => progress[v.id]?.completed).length
  const streak = getStreak()
  return {
    saved: library.length,
    completed,
    streak: calculateCurrentStreak(streak.dates),
  }
}

function calculateCurrentStreak(dates) {
  if (!dates.length) return 0
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
