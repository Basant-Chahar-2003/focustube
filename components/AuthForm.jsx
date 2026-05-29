'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthForm({ mode }) {
  const router = useRouter()
  const isLogin = mode === 'login'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const body = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      router.push('/library')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 40 }}>
        <span style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: '50%' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>FocusTube</span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-surface)', border: '0.5px solid var(--border-mid)',
        borderRadius: 16, padding: '36px 32px',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6, color: 'var(--text-primary)' }}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
          {isLogin ? 'Sign in to your library and notes.' : 'Start learning without distractions.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <Field label="Your name" type="text" value={form.name} onChange={set('name')} placeholder="Ada Lovelace" required />
          )}
          <Field label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="ada@example.com" required />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
            required
          />

          {error && (
            <div style={{ background: 'rgba(227,75,75,0.1)', border: '0.5px solid rgba(227,75,75,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#e34b4b' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, padding: '12px', borderRadius: 10, fontSize: 14,
              background: loading ? 'var(--bg-overlay)' : 'var(--gold)',
              border: 'none', color: loading ? 'var(--text-muted)' : '#0a0a0b',
              fontWeight: 600, fontFamily: 'var(--font-display)', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', letterSpacing: '-0.2px',
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign in →' : 'Create account →'}
          </button>
        </form>
      </div>

      {/* Toggle */}
      <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <Link href={isLogin ? '/signup' : '/login'} style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
          {isLogin ? 'Sign up free' : 'Sign in'}
        </Link>
      </div>

      {/* Back */}
      <Link href="/" style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
        ← Back to home
      </Link>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          background: 'var(--bg-raised)', border: '0.5px solid var(--border-mid)',
          borderRadius: 8, padding: '10px 12px', fontSize: 14,
          color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
      />
    </div>
  )
}
