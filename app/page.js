import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_NAME, verifyToken } from '../lib/auth'

export const metadata = {
  title: 'FocusTube',
}

export default async function LandingPage() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (token) {
    const user = await verifyToken(token)
    if (user) redirect('/library')
  }
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        borderBottom: '0.5px solid var(--border)', position: 'sticky', top: 0,
        background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(12px)', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: 'var(--gold)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>FocusTube</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{ padding: '7px 18px', borderRadius: 20, fontSize: 13, border: '0.5px solid var(--border-mid)', color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ padding: '7px 18px', borderRadius: 20, fontSize: 13, background: 'var(--gold-bg)', border: '0.5px solid var(--gold)', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--gold-bg)', border: '0.5px solid rgba(212,168,67,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%' }} />
          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>No recommendations. No comments. No rabbit holes.</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24 }}>
          FocusTube for people<br /><span style={{ color: 'var(--gold)' }}>who wants to learn</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 540, margin: '0 auto 44px', fontWeight: 300 }}>
          Save videos, watch them distraction-free, take timestamped notes, and track what you have learned — without the algorithm pulling you away.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/signup" style={{ padding: '13px 32px', borderRadius: 12, fontSize: 15, background: 'var(--gold)', color: '#0a0a0b', textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.2px' }}>Start learning for free →</Link>
          <Link href="/login" style={{ padding: '13px 28px', borderRadius: 12, fontSize: 15, background: 'var(--bg-surface)', border: '0.5px solid var(--border-mid)', color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </section>

      {/* App Preview */}
      <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {['#3a3a3a','#3a3a3a','#3a3a3a'].map((c,i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            <div style={{ flex: 1, margin: '0 12px', background: 'var(--bg-raised)', borderRadius: 6, padding: '4px 12px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>localhost:3000/watch/dQw4w9WgXcQ</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}>
            <div style={{ background: '#070709', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '0.5px solid var(--border)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,168,67,0.15)', border: '0.5px solid rgba(212,168,67,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gold)" style={{ marginLeft: 3 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>PLAYING NOW</div>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Notes</div>
              {[['2:14','O(n) means linear time — scales with input'],['8:40','Hash maps are O(1) lookup, keep in mind'],['14:22','Space-time tradeoff is key for interviews']].map(([ts,text]) => (
                <div key={ts} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 600, minWidth: 32 }}>{ts}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 16px', background: '#0d0e09', borderTop: '0.5px solid #1f2010', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Focus mode <span style={{ color: 'var(--gold)' }}>on</span> — no recommendations, no comments</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>24:13</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-1px', textAlign: 'center', marginBottom: 12 }}>Everything you need to learn deeply</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, marginBottom: 52 }}>Built for people who use YouTube as a classroom, not entertainment.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: '🎯', title: 'Distraction-free player', desc: 'YouTube embedded without sidebar, comments, or autoplay recommendations.' },
            { icon: '📝', title: 'Timestamped notes', desc: 'Notes are pinned to the exact moment in the video. Click to jump back.' },
            { icon: '✅', title: 'Progress tracking', desc: 'Mark videos complete. See what is finished, in progress, and what is next.' },
            { icon: '🔥', title: 'Daily streak', desc: 'Build a learning habit with a 7-day streak tracker.' },
            { icon: '🔍', title: 'YouTube search built in', desc: 'Search YouTube from inside FocusTube and save videos in one click.' },
            { icon: '💾', title: 'Saved locally', desc: 'Everything lives in your browser. No cloud, no data harvesting.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '22px 20px' }}>
              <div style={{ fontSize: 22, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: 7 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{ maxWidth: 680, margin: '0 auto 100px', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, letterSpacing: '-1px', textAlign: 'center', marginBottom: 52 }}>Three steps to focused learning</h2>
        {[
          { title: 'Search and save', desc: 'Use the built-in YouTube search to find any tutorial or lecture. Save it to your library with one click.' },
          { title: 'Watch without distractions', desc: 'Open any saved video in the clean player. No recommendations, no comments, no autoplay.' },
          { title: 'Take notes and mark complete', desc: 'Jot down timestamped notes as you watch. Mark it complete when done — it counts toward your streak.' },
        ].map((step, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: 24, paddingBottom: i < arr.length - 1 ? 0 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-bg)', border: '0.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{i + 1}</div>
              {i < arr.length - 1 && <div style={{ width: 1, height: 48, background: 'var(--border)', margin: '8px 0' }} />}
            </div>
            <div style={{ paddingTop: 6, paddingBottom: i < arr.length - 1 ? 0 : 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: i < arr.length - 1 ? 40 : 0 }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 580, margin: '0 auto 120px', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-mid)', borderRadius: 20, padding: '56px 40px' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Free forever</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 14 }}>Ready to stop getting distracted?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.65 }}>Your library, notes, and progress are saved locally. No subscription required.</p>
          <Link href="/signup" style={{ display: 'inline-block', padding: '13px 36px', borderRadius: 12, background: 'var(--gold)', color: '#0a0a0b', textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 15 }}>Create your free account →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '0.5px solid var(--border)', padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>FocusTube</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Built for learners. No distractions, no tracking.</div>
      </footer>
    </div>
  )
}
