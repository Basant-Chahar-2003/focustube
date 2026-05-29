'use client'
import { useState, useEffect, useRef } from 'react'
import { saveVideo, isInLibrary } from '../lib/storage'

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('video') // 'video' | 'playlist'
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState({})
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setSaved({}); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Re-search when type tab changes (if there's already a query)
  useEffect(() => {
    if (query.length >= 2) doSearch(query, type)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.length < 2) { setResults([]); return }
    timerRef.current = setTimeout(() => doSearch(query, type), 450)
  }, [query])

  async function doSearch(q, t) {
    setLoading(true)
    setResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${t}`)
      const data = await res.json()
      setResults(data.items || [])
      const s = {}
      data.items?.forEach(v => { s[v.id] = isInLibrary(v.id) })
      setSaved(s)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  function handleSave(item) {
    saveVideo({
      id: item.id,
      type: item.type,
      title: item.title,
      channel: item.channel,
      thumbnail: item.thumbnail,
      duration: item.duration,
      videoCount: item.videoCount || null,
    })
    setSaved(p => ({ ...p, [item.id]: true }))
    window.dispatchEvent(new Event('ff:update'))
  }

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: 'var(--bg-surface)', border: '0.5px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '0.5px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={type === 'video' ? 'Search for videos...' : 'Search for playlists...'}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, padding: '16px 12px', fontFamily: 'var(--font-body)' }}
          />
          {loading && <Spinner />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer', fontSize: 11 }}>ESC</button>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid var(--border)', padding: '0 16px' }}>
          {[
            { key: 'video', label: '🎬 Videos', desc: 'Shorts excluded' },
            { key: 'playlist', label: '📚 Playlists', desc: 'Full courses' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              style={{
                padding: '10px 14px 9px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: type === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: type === tab.key ? '1.5px solid var(--gold)' : '1.5px solid transparent',
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
              <span style={{ fontSize: 10, color: type === tab.key ? 'var(--gold)' : 'var(--text-muted)', background: type === tab.key ? 'var(--gold-bg)' : 'var(--bg-raised)', borderRadius: 8, padding: '1px 6px', border: `0.5px solid ${type === tab.key ? 'rgba(212,168,67,0.3)' : 'var(--border)'}` }}>
                {tab.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 440, overflowY: 'auto' }}>
          {results.length === 0 && query.length >= 2 && !loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No {type === 'video' ? 'videos' : 'playlists'} found
            </div>
          )}

          {results.length === 0 && query.length < 2 && (
            <div style={{ padding: '20px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 10 }}>
                {type === 'video' ? '🎬 Search tips for videos' : '📚 Search tips for playlists'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(type === 'video'
                  ? ['JavaScript async await', 'React hooks tutorial', 'Python for beginners', 'System design interview', 'CSS grid layout']
                  : ['Full React course', 'Data structures course', 'Machine learning full course', 'Node.js complete guide']
                ).map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    style={{ padding: '5px 10px', background: 'var(--bg-raised)', border: '0.5px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {type === 'video' && (
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)', padding: '8px 10px', background: 'var(--bg-raised)', borderRadius: 8, border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✂️</span>
                  <span>YouTube Shorts are automatically excluded from results</span>
                </div>
              )}
            </div>
          )}

          {results.map(item => (
            <ResultRow key={item.id} item={item} saved={saved[item.id]} onSave={() => handleSave(item)} onClose={onClose} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ResultRow({ item, saved, onSave, onClose }) {
  const isPlaylist = item.type === 'playlist'
  const watchHref = isPlaylist
    ? `https://www.youtube.com/playlist?list=${item.id}`
    : `/watch/${item.id}`

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid var(--border)', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={item.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4 }} />
        {isPlaylist && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', align: 'center', gap: 6 }}>
          <span>{item.channel}</span>
          {item.duration && <><span>·</span><span style={{ color: isPlaylist ? 'var(--gold)' : 'inherit' }}>{item.duration}</span></>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <a
          href={watchHref}
          onClick={isPlaylist ? undefined : onClose}
          target={isPlaylist ? '_blank' : undefined}
          rel={isPlaylist ? 'noopener noreferrer' : undefined}
          style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, background: 'var(--bg-overlay)', border: '0.5px solid var(--border-mid)', color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          {isPlaylist ? 'Open ↗' : 'Watch'}
        </a>
        <button
          onClick={onSave}
          disabled={saved}
          style={{
            padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11,
            background: saved ? 'var(--green-bg)' : 'var(--gold-bg)',
            border: `0.5px solid ${saved ? '#1a3a1a' : 'var(--gold)'}`,
            color: saved ? 'var(--green)' : 'var(--gold)',
            cursor: saved ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          {saved ? '✓ Saved' : '+ Save'}
        </button>
      </div>
    </div>
  )
}

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)
