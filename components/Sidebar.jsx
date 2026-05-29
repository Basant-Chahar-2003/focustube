'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getStats, getLast7Days } from '../lib/storage'

const NavItem = ({ href, icon, label, active }) => (
  <a href={href} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 'var(--radius-md)',
    fontSize: 13, color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: active ? 'var(--bg-overlay)' : 'transparent',
    textDecoration: 'none', transition: 'all 0.15s',
  }}>
    {icon}
    {label}
  </a>
)

export default function Sidebar() {
  const pathname = usePathname()
  const [stats, setStats] = useState({ saved: 0, completed: 0, streak: 0 })
  const [days, setDays] = useState([])

  useEffect(() => {
    // Try to load server-side stats (user-specific). Fallback to local stats.
    async function loadStats() {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats({ saved: data.saved || 0, completed: data.completed || 0, streak: data.streak || 0 })
          // build last 7 days view from returned dates
          const s = data.dates || []
          const result = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().slice(0, 10)
            result.push({ date: dateStr, done: s.includes(dateStr), isToday: i === 0 })
          }
          setDays(result)
          return
        }
      } catch (e) {
        // ignore and fallback
      }

      // fallback
      setStats(getStats())
      setDays(getLast7Days())
    }

    async function refreshLibraryCount() {
      try {
        const res = await fetch('/api/library')
        if (!res.ok) return
        const data = await res.json()
        setStats(prev => ({ ...prev, saved: data.library?.length ?? prev.saved }))
      } catch {
        // keep local stats if API fails
      }
    }

    loadStats()
    refreshLibraryCount()

    const handler = () => {
      setStats(getStats())
      setDays(getLast7Days())
      refreshLibraryCount()
    }
    window.addEventListener('ff:update', handler)
    return () => window.removeEventListener('ff:update', handler)
  }, [])

  return (
    <aside style={{
      width: 240, background: 'var(--bg-surface)', borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
      position: 'sticky', top: '57px', height: 'calc(100vh - 57px)', overflowY: 'auto',
    }}>
      {/* Nav */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
        <NavItem href="/library" active={pathname === '/library'} label="Library" icon={<GridIcon />} />
        <NavItem href="/completed" active={pathname === '/completed'} label="Completed" icon={<CheckIcon />} />
        <NavItem href="/notes" active={pathname === '/notes'} label="All notes" icon={<NotesIcon />} />
      </div>

      {/* Stats */}
      <div style={{ padding: '0 16px', marginBottom: 24, borderTop: '0.5px solid var(--border)', paddingTop: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '1.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
          Your stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatCard label="Saved" value={stats.saved} />
          <StatCard label="Done" value={stats.completed} />
        </div>
      </div>

      {/* Streak */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: 10, letterSpacing: '1.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          7-day streak
          <span style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 0, textTransform: 'none', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            {stats.streak}🔥
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {days.map(d => (
            <div key={d.date} title={d.date} style={{
              flex: 1, height: 24, borderRadius: 4,
              background: d.done ? 'var(--gold)' : d.isToday ? 'var(--gold-bg)' : 'var(--bg-overlay)',
              border: d.isToday && !d.done ? '1px solid var(--gold)' : 'none',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <span key={i} style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{d}</span>
          ))}
        </div>
      </div>

      {/* Focus tip */}
      <div style={{ margin: '24px 16px 0', padding: '12px', background: 'var(--bg-raised)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 500, marginBottom: 4 }}>💡 Focus tip</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          All videos play without recommendations, comments or autoplay.
        </div>
      </div>
    </aside>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{value}</div>
    </div>
  )
}

const GridIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>
const NotesIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
