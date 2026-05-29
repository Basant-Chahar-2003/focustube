'use client'
import { useState, useEffect, useRef } from 'react'

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState({})
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (!open) onClose() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); setSaved({}); return }
    timerRef.current = setTimeout(() => doSearch(query), 500)
  }, [query])

  async function getSavedIds() {
    try {
      const res = await fetch('/api/library')
      if (!res.ok) return {}
      const data = await res.json()
      const ids = {}
      data.library?.forEach(video => { ids[video.id] = true })
      return ids
    } catch {
      return {}
    }
  }

  async function doSearch(q) {
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const libraryIds = await getSavedIds()
      setResults(data.items || [])
      const s = {}
      data.items?.forEach(v => { s[v.id] = Boolean(libraryIds[v.id]) })
      setSaved(s)
    } catch {
      setResults([])
      setSaved({})
    } finally { setLoading(false) }
  }

  async function handleSave(video) {
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(p => ({ ...p, [video.id]: true }))
      window.dispatchEvent(new Event('ff:update'))
    } catch (error) {
      console.error('Unable to save video', error)
    }
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640, background: 'var(--bg-surface)',
          border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-lg)',
          overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '0.5px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search YouTube to add to your library..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 15, padding: '16px 12px',
              fontFamily: 'var(--font-body)',
            }}
          />
          {loading && <Spinner />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer', fontSize: 11 }}>ESC</button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {results.length === 0 && query.length >= 2 && !loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No results found</div>
          )}
          {results.length === 0 && query.length < 2 && (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>Search tips</div>
              Try: "JavaScript tutorial", "React hooks explained", "Python for beginners"
            </div>
          )}
          {results.map(video => (
            <div key={video.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid var(--border)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img src={video.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {video.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{video.channel} {video.duration && `· ${video.duration}`}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <a href={`/watch/${video.id}`} onClick={onClose} style={{
                  padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11,
                  background: 'var(--bg-overlay)', border: '0.5px solid var(--border-mid)',
                  color: 'var(--text-secondary)', textDecoration: 'none',
                }}>Watch</a>
                <button
                  onClick={() => handleSave(video)}
                  disabled={saved[video.id]}
                  style={{
                    padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11,
                    background: saved[video.id] ? 'var(--green-bg)' : 'var(--gold-bg)',
                    border: `0.5px solid ${saved[video.id] ? '#1a3a1a' : 'var(--gold)'}`,
                    color: saved[video.id] ? 'var(--green)' : 'var(--gold)',
                    cursor: saved[video.id] ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  {saved[video.id] ? '✓ Saved' : '+ Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)
