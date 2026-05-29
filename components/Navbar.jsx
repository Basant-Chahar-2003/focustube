"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SearchModal from './SearchModal'

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    let mounted = true
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setUser(data.user || null)
        // notify server we've logged in today for streak tracking
        try {
          await fetch('/api/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login' }) })
        } catch (e) { /* ignore */ }
      } catch {
        // ignore
      }
    }
    fetchUser()
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => { mounted = false; window.removeEventListener('click', onClick) }
  }, [])

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: '57px',
        background: 'var(--bg-surface)', borderBottom: '0.5px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <a href="/library" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>FocusTube</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)',
              borderRadius: 20, padding: '7px 16px',
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search YouTube...
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-overlay)', borderRadius: 4, padding: '1px 5px', border: '0.5px solid var(--border)' }}>⌘K</span>
          </button>
          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(s => !s)}
                title={user.name || user.email}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: '0.5px solid var(--border-mid)',
                  background: 'var(--bg-raised)', color: 'var(--text-primary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                }}
              >
                {user.name ? user.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : (user.email || 'U')[0].toUpperCase()}
              </button>

              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 220, background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                  <div style={{ padding: 12, borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name || 'User'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{user.email}</div>
                  </div>
                  <div style={{ padding: 10 }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)', color: 'var(--text-muted)', textDecoration: 'none' }}>Log in</a>
          )}
        </div>
      </nav>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
