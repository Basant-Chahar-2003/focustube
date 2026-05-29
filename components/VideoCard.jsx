'use client'
import { useState } from 'react'

export default function VideoCard({ video, progress, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const pct = progress?.completed ? 100 : (progress?.percent || 0)
  const badge = progress?.completed
    ? { label: 'Done', bg: '#0f1f0f', color: '#5a9e5a', border: '#1a3a1a' }
    : progress?.percent > 0
      ? { label: `${progress.percent}% watched`, bg: 'var(--bg-raised)', color: 'var(--text-primary)', border: 'var(--border)' }
      : { label: 'Not started', bg: 'var(--bg-raised)', color: 'var(--text-muted)', border: 'var(--border)' }

  function handleRemove(e) {
    e.preventDefault()
    e.stopPropagation()
    onRemove?.(video.id)
  }

  return (
    <a
      href={`/watch/${video.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', background: 'var(--bg-surface)',
        border: `0.5px solid ${hovered ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        textDecoration: 'none', transition: 'border-color 0.2s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none', position: 'relative',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-raised)', overflow: 'hidden' }}>
        {video.thumbnail && (
          <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        {/* Overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(212,168,67,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0b" style={{ marginLeft: 2 }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        </div>
        {/* Duration */}
        {video.duration && (
          <div style={{
            position: 'absolute', bottom: 6, right: 6,
            background: 'rgba(0,0,0,0.8)', borderRadius: 4,
            padding: '2px 6px', fontSize: 10, color: '#ddd', fontWeight: 500,
          }}>{video.duration}</div>
        )}
        {/* Progress bar */}
        {pct > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--border)' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gold)' }} />
          </div>
        )}
        {/* Remove button */}
        {hovered && (
          <button
            onClick={handleRemove}
            title="Remove from library"
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)', border: '0.5px solid rgba(255,255,255,0.15)',
              color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
            onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
          lineHeight: 1.45, marginBottom: 7,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {video.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {video.channel}
          </div>
          <div style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
            background: badge.bg, color: badge.color, border: `0.5px solid ${badge.border}`,
            whiteSpace: 'nowrap',
          }}>
            {badge.label}
          </div>
        </div>
      </div>
    </a>
  )
}
