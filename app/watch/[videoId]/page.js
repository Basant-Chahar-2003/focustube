'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../../../components/Navbar'
import NotesPanel from '../../../components/NotesPanel'
import { getProgress, saveProgress, markComplete, unmarkComplete } from '../../../lib/storage'

export default function WatchPage({ params }) {
  const { videoId } = params
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([])
  const [progress, setProgress] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [watchPercent, setWatchPercent] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [focusTime, setFocusTime] = useState(0)
  const [inLibrary, setInLibrary] = useState(false)
  const [playedSent, setPlayedSent] = useState(false)
  const iframeRef = useRef(null)
  const playerReadyRef = useRef(false)
  const queuedSeekRef = useRef(null)
  const initialSeekRef = useRef(null)
  const focusTimerRef = useRef(null)
  const playerRef = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => {
    async function fetchData() {
      if (typeof window !== 'undefined') {
        const t = new URL(window.location.href).searchParams.get('t')
        if (t !== null) initialSeekRef.current = Number(t)
      }
      const fetchVideoPromise = fetch(`/api/video?id=${videoId}`).then(res => res.json()).catch(() => ({ id: videoId, title: 'Video', channel: '' }))
      const fetchNotesPromise = fetch(`/api/notes?videoId=${videoId}`).then(async res => {
        if (!res.ok) return { notes: [] }
        return res.json()
      }).catch(() => ({ notes: [] }))
      const fetchLibraryPromise = fetch('/api/library').then(async res => {
        if (!res.ok) return { library: [] }
        return res.json()
      }).catch(() => ({ library: [] }))

      const [videoData, notesData, libData] = await Promise.all([fetchVideoPromise, fetchNotesPromise, fetchLibraryPromise])
      setVideo(videoData)
      setNotes(notesData.notes || [])
      setInLibrary((libData.library || []).some(v => v.id === videoId))
      setLoading(false)
    }

    fetchData()
    const storedProgress = getProgress(videoId)
    setProgress(storedProgress)
    setWatchPercent(storedProgress.percent || 0)
    // If there's no explicit ?t= param, resume from stored lastTime
    if (initialSeekRef.current == null && storedProgress?.lastTime) {
      initialSeekRef.current = Number(storedProgress.lastTime)
    }
    // Try to fetch server-side saved progress for logged-in users and prefer the latest timestamp
    ;(async () => {
      try {
        const res = await fetch(`/api/progress?videoId=${videoId}`)
        if (res.ok) {
          const data = await res.json()
          const serverProgress = data.progress || {}
          const serverLast = Number(serverProgress.lastTime || 0)
          const storedLast = Number(storedProgress?.lastTime || 0)
          if (initialSeekRef.current == null) {
            initialSeekRef.current = serverLast || storedLast || null
          } else {
            // If we have an initial seek (from ?t=), do nothing; otherwise prefer the larger timestamp
            if (serverLast > storedLast && (storedProgress == null || serverLast > Number(storedProgress.lastTime || 0))) {
              initialSeekRef.current = serverLast
            }
          }
          // Merge server percent/completed into UI progress if it's newer
          if (serverProgress && serverProgress.percent > (storedProgress?.percent || 0)) {
            setProgress(prev => ({ ...prev, percent: serverProgress.percent, completed: serverProgress.completed }))
            setWatchPercent(serverProgress.percent || 0)
          }
        }
      } catch (e) {
        // ignore network/auth errors
      }
    })()
    setDurationSeconds(0)

    // Focus timer
    focusTimerRef.current = setInterval(() => setFocusTime(t => t + 1), 1000)
    return () => clearInterval(focusTimerRef.current)
  }, [videoId])

  useEffect(() => {
    completedRef.current = !!progress?.completed
  }, [progress])

  useEffect(() => {
    if (durationSeconds > 0) {
      const percent = Math.min(100, Math.round((currentTime / durationSeconds) * 100))
      setWatchPercent(percent)
        const currentProgress = getProgress(videoId)
        if (percent > 0 && percent > (currentProgress.percent || 0) && !currentProgress.completed) {
          saveProgress(videoId, { percent, watchedAt: Date.now(), lastTime: currentTime })
          // also try to persist to server (no-op if not logged in)
          ;(async () => {
            try {
              await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, progress: { lastTime: currentTime, percent, watchedAt: Date.now() } }) })
            } catch (e) { /* ignore */ }
          })()
          setProgress(prev => ({ ...prev, percent }))
          window.dispatchEvent(new Event('ff:update'))
        }
        if (percent >= 100 && !completedRef.current) {
          markComplete(videoId)
          setProgress({ completed: true, percent: 100 })
          window.dispatchEvent(new Event('ff:update'))
          if (inLibrary) {
            fetch('/api/library/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoId, completion_status: 'done', completed_percentage: 100 })
            }).catch(() => {})
          }
        }
      }
    }, [currentTime, durationSeconds, videoId, inLibrary])

  useEffect(() => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        events: {
          onReady: () => {
            playerReadyRef.current = true
            if (playerRef.current?.getDuration) {
              const duration = playerRef.current.getDuration()
              if (duration > 0) setDurationSeconds(duration)
            }
            if (initialSeekRef.current != null && playerRef.current?.seekTo) {
              playerRef.current.seekTo(initialSeekRef.current, true)
              initialSeekRef.current = null
            }
            if (queuedSeekRef.current != null && playerRef.current?.seekTo) {
              playerRef.current.seekTo(queuedSeekRef.current, true)
              queuedSeekRef.current = null
            }
          },
          onStateChange: (e) => {
            if (e.data === 1) { // playing
              if (!playedSent) {
                setPlayedSent(true)
                ;(async () => {
                  try {
                    await fetch('/api/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'played' }) })
                  } catch (e) {
                    // ignore network errors
                  }
                })()
              }
              const interval = setInterval(() => {
                if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
                  const now = playerRef.current.getCurrentTime()
                  const duration = playerRef.current.getDuration() || durationSeconds
                  setCurrentTime(now)
                  if (duration > 0) {
                    setDurationSeconds(duration)
                    const percent = Math.min(100, Math.round((now / duration) * 100))
                    setWatchPercent(percent)
                    const currentProgress = getProgress(videoId)
                    if (percent > 0 && percent > (currentProgress.percent || 0) && !currentProgress.completed) {
                      saveProgress(videoId, { percent, watchedAt: Date.now(), lastTime: now })
                      ;(async () => {
                        try {
                          await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, progress: { lastTime: now, percent, watchedAt: Date.now() } }) })
                        } catch (e) { /* ignore */ }
                      })()
                      setProgress(prev => ({ ...prev, percent }))
                      window.dispatchEvent(new Event('ff:update'))
                    }
                    if (percent >= 100 && !completedRef.current) {
                      markComplete(videoId)
                      setProgress({ completed: true, percent: 100 })
                      window.dispatchEvent(new Event('ff:update'))
                      if (inLibrary) {
                        fetch('/api/library/complete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ videoId, completion_status: 'done', completed_percentage: 100 })
                        }).catch(() => {})
                      }
                    }
                  }
                }
              }, 1000)
              playerRef.current._timeInterval = interval
            } else {
              clearInterval(playerRef.current._timeInterval)
            }
          }
        }
      })
    }

    return () => {
      if (playerRef.current?._timeInterval) clearInterval(playerRef.current._timeInterval)
    }
  }, [])

  // Listen for in-page seek events
  useEffect(() => {
    function handler(e) {
      const time = e?.detail?.time
      const vid = e?.detail?.videoId
      if (time === undefined || time === null) return
      if (vid && vid !== videoId) {
        // navigate to other video with time param
        window.location.href = `/watch/${vid}?t=${time}`
        return
      }
      if (playerRef.current && playerReadyRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(time, true)
      } else {
        queuedSeekRef.current = time
      }
    }
    window.addEventListener('ff:seek', handler)
    return () => window.removeEventListener('ff:seek', handler)
  }, [videoId])

  // Persist lastTime when leaving or hiding the page
  useEffect(() => {
    function persist() {
      try {
        const last = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : currentTime
        saveProgress(videoId, { lastTime: last, watchedAt: Date.now(), percent: watchPercent })
        ;(async () => {
          try {
            await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, progress: { lastTime: last, percent: watchPercent, watchedAt: Date.now() } }) })
          } catch (e) { /* ignore */ }
        })()
      } catch (e) {
        // ignore
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') persist()
    }

    window.addEventListener('beforeunload', persist)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', persist)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [videoId, currentTime, watchPercent])

  function toggleComplete() {
    if (progress?.completed) {
      unmarkComplete(videoId)
      setProgress({ completed: false, percent: 0 })
    } else {
      markComplete(videoId)
      setProgress({ completed: true, percent: 100 })
      if (inLibrary) {
        fetch('/api/library/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId, completion_status: 'done', completed_percentage: 100 })
        }).catch(() => {})
      }
    }
    window.dispatchEvent(new Event('ff:update'))
  }

  async function handleSaveToLibrary() {
    if (!video) return
    await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video: {
          id: video.id,
          title: video.title,
          channel: video.channel,
          thumbnail: video.thumbnail,
          duration: video.duration,
        },
      }),
    })
    setInLibrary(true)
    window.dispatchEvent(new Event('ff:update'))
  }

  function formatFocusTime(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&color=white&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      {/* Focus banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 24px', background: '#0d0e09',
        borderBottom: '0.5px solid #1f2010',
      }}>
        <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 0 3px rgba(212,168,67,0.12)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Focus mode on</span> — no recommendations, no comments, no distractions
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: 'rgba(255, 255, 255, 0.06)', border: '0.5px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: 11 }}>
            <span>{watchPercent}% watched</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: progress?.completed ? 'var(--green)' : 'var(--gold)' }} />
          </div>
          <button
            onClick={toggleComplete}
            style={{
              padding: '6px 12px', borderRadius: '999px', background: progress?.completed ? 'var(--green-bg)' : 'var(--gold-bg)',
              border: `0.5px solid ${progress?.completed ? '#1a3a1a' : 'var(--gold)'}`,
              color: progress?.completed ? 'var(--green)' : 'var(--gold)', cursor: 'pointer', fontSize: 11,
              fontFamily: 'var(--font-body)', fontWeight: 600,
            }}
          >
            {progress?.completed ? '✓ Completed' : 'Mark complete'}
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.5px' }}>
            {formatFocusTime(focusTime)}
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>
        {/* Left: Video + info */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Player */}
          <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', width: '100%' }}>
            <iframe
              id="yt-player"
              ref={iframeRef}
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '95%', border: 'none', display: 'block' }}
              title={video?.title || 'Video'}
            />
          </div>

          {/* Video info + actions */}
          <div style={{ padding: '16px 24px', borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, overflowY: 'auto' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
                color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 5,
              }}>
                {loading ? 'Loading...' : video?.title}
              </h1>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {video?.channel && <span>{video.channel}</span>}
                {video?.duration && <><span>·</span><span>{video.duration}</span></>}
                <span>·</span>
                <span>{watchPercent}% watched</span>
              </div>
              <div style={{ marginTop: 10, width: '100%', height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ width: `${watchPercent}%`, height: '100%', background: progress?.completed ? 'var(--green)' : 'var(--gold)', transition: 'width 0.2s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <a
                href="/"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)',
                  fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none',
                }}
              >
                ← Library
              </a>
              {!inLibrary && (
                <button onClick={handleSaveToLibrary} style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-md)', fontSize: 12,
                  background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  + Save to library
                </button>
              )}
              <button
                onClick={toggleComplete}
                style={{
                  padding: '7px 16px', borderRadius: 'var(--radius-md)', fontSize: 12,
                  background: progress?.completed ? 'var(--green-bg)' : 'var(--gold-bg)',
                  border: `0.5px solid ${progress?.completed ? '#1a3a1a' : 'var(--gold)'}`,
                  color: progress?.completed ? 'var(--green)' : 'var(--gold)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {progress?.completed ? '✓ Completed' : '○ Mark complete'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Notes */}
        <div style={{ borderLeft: '0.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <NotesPanel videoId={videoId} notes={notes} currentTime={currentTime} />
        </div>
      </div>
    </div>
  )
}
