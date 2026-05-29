'use client'
import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'

export default function NotesPage() {
  const [allNotes, setAllNotes] = useState([])

  useEffect(() => {
    async function load() {
      const [libRes, notesRes] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/notes'),
      ])

      const libData = libRes.ok ? await libRes.json() : { library: [] }
      const notesData = notesRes.ok ? await notesRes.json() : { notes: {} }
      const library = libData.library || []
      const notesByVideo = notesData.notes || {}

      const result = library.reduce((acc, video) => {
        const notes = (notesByVideo[video.id] || []).sort((a, b) => (a.timestamp_seconds || 0) - (b.timestamp_seconds || 0))
        if (notes.length > 0) acc.push({ video, notes })
        return acc
      }, [])

      setAllNotes(result)
    }

    load()
  }, [])

  const total = allNotes.reduce((s, x) => s + x.notes.length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: 4 }}>All Notes</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{total} note{total !== 1 ? 's' : ''} across {allNotes.length} video{allNotes.length !== 1 ? 's' : ''}</p>

          {allNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)', fontSize: 13 }}>No notes yet. Add notes while watching a video.</div>
          ) : allNotes.map(({ video, notes }) => (
            <div key={video.id} style={{ marginBottom: 28 }}>
              <a href={`/watch/${video.id}`} style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                textDecoration: 'none',
              }}>
                {video.thumbnail && <img src={video.thumbnail} alt="" style={{ width: 56, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{video.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{video.channel} · {notes.length} note{notes.length !== 1 ? 's' : ''}</div>
                </div>
              </a>
              <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.map(note => (
                  <div key={note.id} style={{ display: 'flex', gap: 12 }}>
                    {note.timestampLabel && (
                      <a href={`/watch/${video.id}?t=${Math.floor(note.timestamp_seconds || 0)}`} style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 600, minWidth: 36, flexShrink: 0, textDecoration: 'none' }}>
                        {note.timestampLabel}
                      </a>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{note.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}
