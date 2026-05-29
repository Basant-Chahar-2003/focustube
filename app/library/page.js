'use client'
import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import VideoCard from '../../components/VideoCard'
import { getAllProgress } from '../../lib/storage'

export default function LibraryPage() {
  const [videos, setVideos] = useState([])
  const [progress, setProgress] = useState({})
  const [filter, setFilter] = useState('all')

  async function load() {
    try {
      const res = await fetch('/api/library')
      const data = await res.json()
      setVideos(data.library || [])
    } catch {
      setVideos([])
    }
    setProgress(getAllProgress())
  }

  useEffect(() => {
    load()
    window.addEventListener('ff:update', load)
    return () => window.removeEventListener('ff:update', load)
  }, [])

  async function handleRemove(videoId) {
    await fetch(`/api/library?videoId=${encodeURIComponent(videoId)}`, { method: 'DELETE' })
    load()
  }

  const filtered = videos.filter(v => {
    if (filter === 'completed') return progress[v.id]?.completed
    if (filter === 'in-progress') return !progress[v.id]?.completed
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Your Library</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{videos.length} video{videos.length !== 1 ? 's' : ''} saved</p>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-raised)', border: '0.5px solid var(--border)', borderRadius: 20, padding: 3 }}>
              {['all', 'in-progress', 'completed'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                  background: filter === f ? 'var(--bg-overlay)' : 'transparent',
                  border: filter === f ? '0.5px solid var(--border-bright)' : 'none',
                  color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                }}>
                  {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          {videos.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-raised)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="3"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Library is empty</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Search YouTube above to save videos and watch them distraction-free.</div>
              </div>
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {filtered.map(video => {
                const savedProgress = progress[video.id] || {}
                const progressProps = {
                  completed: savedProgress.completed ?? (video.completion_status === 'done' || video.completed_percentage === 100),
                  percent: savedProgress.percent ?? video.completed_percentage ?? 0,
                }
                return <VideoCard key={video.id} video={video} progress={progressProps} onRemove={handleRemove} />
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
