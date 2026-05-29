'use client'
import { useState, useEffect, useRef } from 'react'

export default function NotesPanel({ videoId, notes: initialNotes, currentTime }) {
  const [notes, setNotes] = useState(initialNotes || [])
  const [draft, setDraft] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    setNotes(initialNotes || [])
  }, [initialNotes])

  function formatTime(secs) {
    if (!secs && secs !== 0) return '0:00'
    const s = Math.floor(secs)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
    return `${m}:${String(s % 60).padStart(2,'0')}`
  }

  async function handleAdd() {
    if (!draft.trim()) return
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        note: {
          text: draft.trim(),
          timestamp_seconds: currentTime,
          timestampLabel: formatTime(currentTime),
        },
      }),
    })
    if (!res.ok) return
    const data = await res.json()
    setNotes(data.notes || [])
    setDraft('')
    textareaRef.current?.focus()
  }

  async function handleDelete(noteId) {
    const res = await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, noteId }),
    })
    if (!res.ok) return
    const data = await res.json()
    setNotes(data.notes || [])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Notes</span>
        {notes.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-overlay)', borderRadius: 10, padding: '1px 7px', border: '0.5px solid var(--border)' }}>
            {notes.length}
          </span>
        )}
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {notes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.7 }}>
            No notes yet.<br />Add your first note below.
          </div>
        )}
        {[...notes].sort((a, b) => (a.timestamp_seconds || 0) - (b.timestamp_seconds || 0)).map(note => (
          <NoteItem key={note.id} note={note} videoId={videoId} onDelete={() => handleDelete(note.id)} />
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--border)' }}>
        <div style={{ background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {currentTime > 0 && (
            <div style={{ padding: '6px 10px 0', fontSize: 10, color: 'var(--gold)' }}>
              at {formatTime(currentTime)}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note... (⌘+Enter to save)"
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 12, padding: '8px 10px',
              fontFamily: 'var(--font-body)', resize: 'none', lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px 8px' }}>
            <button
              onClick={handleAdd}
              disabled={!draft.trim()}
              style={{
                background: draft.trim() ? 'var(--gold-bg)' : 'var(--bg-overlay)',
                border: `0.5px solid ${draft.trim() ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                fontSize: 11, color: draft.trim() ? 'var(--gold)' : 'var(--text-muted)',
                cursor: draft.trim() ? 'pointer' : 'default',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
            >
              Save note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoteItem({ note, onDelete, videoId }) {
  const [hovered, setHovered] = useState(false)
  const time = Math.floor(note.timestamp_seconds || 0)
  const href = `/watch/${videoId}?t=${time}`

  function handleTimestampClick(e) {
    if (typeof window === 'undefined') return
    // If already on the same watch page, seek in-place via event
    if (window.location.pathname === `/watch/${videoId}`) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('ff:seek', { detail: { time, videoId } }))
    }
    // Otherwise allow navigation to watch page with ?t param
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: 8, marginBottom: 10, position: 'relative' }}
    >
      {note.timestampLabel && (
        <a
          href={href}
          onClick={handleTimestampClick}
          style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 600, minWidth: 36, paddingTop: 1, cursor: 'pointer', flexShrink: 0, textDecoration: 'none' }}
        >
          {note.timestampLabel}
        </a>
      )}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, flex: 1 }}>
        {note.text}
      </div>
      {hovered && (
        <button
          onClick={onDelete}
          style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// Keep this component state in sync with incoming props.
