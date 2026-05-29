'use client'
import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import VideoCard from '../../components/VideoCard'
import { getAllProgress } from '../../lib/storage'

export default function CompletedPage() {
  const [videos, setVideos] = useState([])
  const [progress, setProgress] = useState({})

  async function load() {
    try {
      const res = await fetch('/api/library')
      const data = await res.json()
      const lib = data.library || []
      const prog = getAllProgress()
      setVideos(lib.filter(v => prog[v.id]?.completed))
      setProgress(prog)
    } catch {
      setVideos([])
      setProgress(getAllProgress())
    }
  }

  useEffect(() => { load(); window.addEventListener('ff:update', load); return () => window.removeEventListener('ff:update', load) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: 4 }}>Completed</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{videos.length} video{videos.length !== 1 ? 's' : ''} finished</p>
          {videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)', fontSize: 13 }}>
              No completed videos yet. Mark videos as complete while watching.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {videos.map(v => <VideoCard key={v.id} video={v} progress={progress[v.id]} onRemove={() => load()} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
