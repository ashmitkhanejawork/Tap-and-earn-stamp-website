'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ─────────────────────────────────────────────────────────────────

type PageState = 'LOCKED' | 'NFC_VALID' | 'STAMPED' | 'REDEEMABLE'
type GlowState = '' | 'nfc' | 'reward'
interface ToastItem { id: number; msg: string; kind: string }
interface StaffSession { email: string; password: string; role: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const BEAN_AND_BREW = {
  id:             'bean-and-brew',
  name:           'Bean & Brew',
  tagline:        'Speciality coffee · Acton W3',
  logoInitials:   'B&B',
  stampsRequired: 10,
  rewardText:     'Free flat white of your choice',
  stampEmoji:     '☕',
  poweredBy:      'Tap & Earn',
}

const STAFF_CREDENTIALS: StaffSession[] = [
  { email: 'ashmitkhanejawork@gmail.com', password: 'TEST1',  role: 'admin' },
  { email: 'staff@beanandbrewcafe.co.uk',  password: 'STAFF1', role: 'staff' },
]

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateCode() {
  const tail = Array.from({ length: 4 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('')
  return 'BB-' + tail
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconLock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function IconEye({ size = 18, off = false }: { size?: number; off?: boolean }) {
  if (off) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 6.1A10 10 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-3 3.8" />
        <path d="M6 8.2A16 16 0 0 0 3 12s3.5 6 9 6c1.4 0 2.7-.4 3.9-1" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  )
}

// ─── Header ─────────────────────────────────────────────────────────────────

function Header({ merchant }: { merchant: typeof BEAN_AND_BREW }) {
  return (
    <header className="s-hdr">
      <div className="s-hdr-mark" aria-hidden="true">{merchant.logoInitials}</div>
      <div className="s-hdr-name">{merchant.name}</div>
      <div className="s-hdr-credit">Powered by <b>{merchant.poweredBy}</b></div>
    </header>
  )
}

// ─── Floating coffee background ──────────────────────────────────────────────

function CoffeeBackground({ density = 8, intensity = 0.16 }: { density?: number; intensity?: number }) {
  const items = useMemo(() => {
    const out = []
    for (let i = 0; i < density; i++) {
      out.push({
        left: 5 + Math.random() * 85,
        size: 16 + Math.round(Math.random() * 12),
        delay: (i * 0.9).toFixed(2),
        dur:   (7 + Math.random() * 2).toFixed(2),
      })
    }
    return out
  }, [density])

  return (
    <div className="s-bg" aria-hidden="true">
      <style>{`
        @keyframes sCoffeeFloatDynamic {
          0%   { transform: translateY(0) rotate(-5deg); opacity: 0; }
          10%  { opacity: ${intensity}; }
          85%  { opacity: ${intensity}; }
          100% { transform: translateY(-110vh) rotate(8deg); opacity: 0; }
        }
        .s-bg span { animation-name: sCoffeeFloatDynamic !important; }
      `}</style>
      {items.map((it, i) => (
        <span key={i} style={{
          left: it.left + '%',
          fontSize: it.size + 'px',
          animationDelay: it.delay + 's',
          animationDuration: it.dur + 's',
        }}>☕</span>
      ))}
    </div>
  )
}

// ─── Stamp Card ─────────────────────────────────────────────────────────────

function StampCard({
  merchant, count, popIndex, glow, breathing, showValid, rewardStyle,
}: {
  merchant: typeof BEAN_AND_BREW
  count: number
  popIndex: number
  glow: GlowState
  breathing: boolean
  showValid: boolean
  rewardStyle: boolean
}) {
  const total = merchant.stampsRequired
  const slots = Array.from({ length: total })
  const isReward = count >= total

  return (
    <div className="s-card-wrap" data-breathe={breathing ? 'on' : 'off'}>
      <div className="s-breathe" />
      <div className="s-card" data-glow={glow}>
        {showValid && (
          <div className="s-valid-badge">
            <IconCheck size={11} /> Valid tap
          </div>
        )}
        <div className="s-card-brand">{merchant.name}</div>
        <div className="s-card-label">
          {isReward
            ? 'REWARD UNLOCKED'
            : `COFFEE LOYALTY · ${total} STAMPS FOR A FREE FLAT WHITE`}
        </div>
        <div className="s-grid" role="list" aria-label={`${count} of ${total} stamps`}>
          {slots.map((_, i) => {
            const filled = i < count
            const isPop  = i === popIndex
            const cls = [
              's-slot',
              filled
                ? (isReward && rewardStyle ? 's-slot--reward' : 's-slot--filled')
                : 's-slot--empty',
              isPop ? 's-slot--pop' : '',
            ].filter(Boolean).join(' ')
            return (
              <div key={i} className={cls} role="listitem"
                aria-label={filled ? 'Stamp collected' : 'Empty'}>
                {filled ? merchant.stampEmoji : null}
              </div>
            )
          })}
        </div>
        <div className="s-card-foot">Free flat white</div>
      </div>
    </div>
  )
}

// ─── Countdown ───────────────────────────────────────────────────────────────

function Countdown({ count, total }: { count: number; total: number }) {
  if (count <= 0) {
    return <div className="s-countdown start">Tap the puck to start earning. ☕</div>
  }
  if (count >= total) {
    return <div className="s-countdown reward">Your free coffee is ready. ☕</div>
  }
  const away = total - count
  return (
    <div className="s-countdown">
      You are <span className="s-num">{away}</span>{' '}
      {away === 1 ? 'coffee' : 'coffees'} away from your free flat white
    </div>
  )
}

// ─── Reward block ────────────────────────────────────────────────────────────

function RewardBlock({ code }: { code: string }) {
  return (
    <>
      <div className="s-reward-msg">Your free flat white is ready. ☕</div>
      <div className="s-code-box" role="region" aria-label="Redemption code">
        <div className="s-code">{code}</div>
        <div className="s-hint">Show this to your barista</div>
      </div>
    </>
  )
}

// ─── Toaster ─────────────────────────────────────────────────────────────────

function Toaster({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="s-toaster" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`s-toast ${t.kind || ''}`}>{t.msg}</div>
      ))}
    </div>
  )
}

// ─── Redemption overlay ───────────────────────────────────────────────────────

function RedeemOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="s-redeem-overlay" role="dialog" aria-label="Reward redeemed">
      <div className="s-inner">
        <div className="s-cup">☕</div>
        <h2>Enjoy your coffee!</h2>
        <p>See you next time.</p>
      </div>
    </div>
  )
}

// ─── Celebration overlay (auto-plays the moment the card is completed) ─────────

function CelebrateOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="s-celebrate-overlay" role="status" aria-live="polite">
      <div className="s-inner">
        <div className="s-cup">🎉</div>
        <h2>Congratulations!</h2>
        <p>Your free drink can be collected.</p>
      </div>
    </div>
  )
}

// ─── Staff dialog ─────────────────────────────────────────────────────────────

function StaffDialog({
  onClose, onSuccess,
}: {
  onClose: () => void
  onSuccess: (session: StaffSession) => void
}) {
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [show, setShow]   = useState(false)
  const [err, setErr]     = useState(false)
  const [busy, setBusy]   = useState(false)
  const emailRef          = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 80)
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(false)
    setTimeout(() => {
      const match = STAFF_CREDENTIALS.find(
        c => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === pw
      )
      if (match) {
        onSuccess(match)
      } else {
        setErr(true)
        setBusy(false)
      }
    }, 350)
  }

  return (
    <div className="s-modal-veil"
      onClick={(e) => { if ((e.target as HTMLElement).classList.contains('s-modal-veil')) onClose() }}>
      <form className="s-modal" onSubmit={submit}>
        <h3>Staff Access</h3>
        <p className="s-sub">Enter credentials to stamp or redeem manually.</p>

        <div className={`s-field${err ? ' error' : ''}`}>
          <label htmlFor="staff-email">Email</label>
          <div className="s-input-wrap">
            <input ref={emailRef} id="staff-email" type="email" autoComplete="username"
              placeholder="your@email.com"
              value={email} onChange={(e) => { setEmail(e.target.value); setErr(false) }} />
          </div>
        </div>

        <div className={`s-field${err ? ' error' : ''}`}>
          <label htmlFor="staff-pw">Password</label>
          <div className="s-input-wrap">
            <input id="staff-pw" type={show ? 'text' : 'password'} autoComplete="current-password"
              placeholder="••••••••"
              value={pw} onChange={(e) => { setPw(e.target.value); setErr(false) }} />
            <button type="button" className="s-eye-btn"
              onClick={() => setShow(s => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}>
              <IconEye off={show} />
            </button>
          </div>
        </div>

        {err && <div className="s-err-line">Incorrect credentials.</div>}

        <button type="submit" className="s-btn s-btn--primary" disabled={busy}
          style={{ marginTop: 6 }}>
          {busy ? 'Signing in…' : <><span>Sign in</span> <IconArrow /></>}
        </button>

        <div className="s-modal-foot">
          <button type="button" className="s-link-btn" onClick={onClose}>Cancel</button>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Staff only</div>
        </div>
      </form>
    </div>
  )
}

// ─── Demo bar ─────────────────────────────────────────────────────────────────

function DemoBar({
  pageState, count, total, staffSession,
  onSimulateNfc, onOpenStaffLogin, onGiveStamp, onRedeem, onReset, onSignOut,
}: {
  pageState: PageState
  count: number
  total: number
  staffSession: StaffSession | null
  onSimulateNfc: () => void
  onOpenStaffLogin: () => void
  onGiveStamp: () => void
  onRedeem: () => void
  onReset: () => void
  onSignOut: () => void
}) {
  const nfcDisabled = pageState !== 'LOCKED'
  const canRedeem   = count >= total

  if (staffSession) {
    return (
      <div className="s-demo-bar" role="toolbar" aria-label="Staff demo controls">
        <div className="s-demo-meta">
          <span className="s-demo-badge staff">Staff</span>
          <span className="s-demo-who">{staffSession.email}</span>
          <button className="s-demo-signout" onClick={onSignOut}>Sign out</button>
        </div>
        <div className="s-demo-actions">
          <button className="s-demo-btn s-demo-btn--stamp"
            onClick={onGiveStamp} disabled={count >= total}>
            ☕ Give stamp
          </button>
          <div className="s-demo-count">
            <b>{count}</b> / {total}
          </div>
          <button
            className="s-demo-btn s-demo-btn--redeem"
            aria-disabled={!canRedeem ? 'true' : undefined}
            onClick={canRedeem ? onRedeem : undefined}
          >
            ✓ Redeem
          </button>
          <button className="s-demo-btn--reset" onClick={onReset} title="Reset to 0 stamps">
            ↺
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="s-demo-bar" role="toolbar" aria-label="Demo controls">
      <div className="s-demo-meta">
        <span className="s-demo-badge">Demo</span>
        <span className="s-demo-who">Showing customer view</span>
      </div>
      <div className="s-demo-actions">
        <button
          className="s-demo-btn s-demo-btn--nfc"
          disabled={nfcDisabled}
          title={nfcDisabled
            ? 'NFC already active — collect the stamp first'
            : 'Simulates the customer tapping the NFC puck'}
          onClick={onSimulateNfc}
        >
          📡 Simulate NFC tap
        </button>
        <button className="s-demo-btn s-demo-btn--login" onClick={onOpenStaffLogin}>
          Staff Login →
        </button>
      </div>
    </div>
  )
}

// ─── Main app (needs useSearchParams, wrapped in Suspense by page.tsx) ────────

export function StampApp() {
  const searchParams = useSearchParams()
  const merchant     = BEAN_AND_BREW

  // localStorage keys (per merchant) for persisting a customer's progress
  const STORAGE_KEY = `tap_and_earn_stamps_${merchant.id}`
  const REDEEM_KEY  = `tap_and_earn_redeemed_${merchant.id}`

  // ── Core state ──────────────────────────────────────────────────────────
  const [state, setState]           = useState<PageState>('LOCKED')
  const [count, setCount]           = useState(0) // fresh device starts at 0; overridden by saved value on mount
  const skipPersist                 = useRef(false)
  const [popIndex, setPopIndex]     = useState(-1)
  const [glow, setGlow]             = useState<GlowState>('')
  const [showValid, setShowValid]   = useState(false)
  const [shimmer, setShimmer]       = useState(false)
  const [code]                      = useState(() => generateCode())
  const [redeemOverlay, setRedeemOverlay] = useState(false)
  const [celebrate, setCelebrate]   = useState(false)
  const [adding, setAdding]         = useState(false)
  const [showStampToast, setShowStampToast] = useState(false)

  // ── Toasts ──────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((msg: string, kind = '', dur = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, msg, kind }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), dur)
  }, [])

  // ── Staff ────────────────────────────────────────────────────────────────
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [staffSession, setStaffSession]       = useState<StaffSession | null>(null)

  // ── NFC URL handling ─────────────────────────────────────────────────────
  // Depend on [searchParams] (not []) so this runs again once Next.js populates
  // the params after hydration in the production build. The ref guard ensures we
  // only ever act on the tap once.
  const nfcHandled = useRef(false)
  useEffect(() => {
    if (nfcHandled.current) return
    const nfcParam = searchParams.get('nfc')
    const tsParam  = searchParams.get('ts')
    if (nfcParam === 'true') {
      nfcHandled.current = true
      const tsRaw      = parseInt(tsParam || '0', 10)
      const ageSeconds = Math.floor(Date.now() / 1000) - tsRaw
      const expired    = !tsRaw || ageSeconds > 900 || ageSeconds < -60
      if (expired) {
        pushToast('This tap has expired — please tap the puck again', 'warn', 4200)
      } else {
        enterNfcValid()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function enterNfcValid() {
    setState('NFC_VALID')
    setGlow('nfc')
    setShowValid(true)
    setShimmer(true)
    setTimeout(() => setGlow(''), 700)
    setTimeout(() => setShimmer(false), 1200)
  }

  // ── Persist progress in localStorage ──────────────────────────────────────
  // Load any saved stamp count on mount (overrides the demo default of 3).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        const n = parseInt(saved, 10)
        if (Number.isFinite(n)) setCount(n)
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save the stamp count whenever it changes (skipped right after a redemption).
  useEffect(() => {
    if (skipPersist.current) { skipPersist.current = false; return }
    try { window.localStorage.setItem(STORAGE_KEY, String(count)) } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  // ── Stamp logic ──────────────────────────────────────────────────────────
  function addStamp({ silent = false } = {}) {
    if (count >= merchant.stampsRequired) return
    setAdding(true)
    setTimeout(() => {
      setAdding(false)
      const next = count + 1
      setCount(next)
      setPopIndex(next - 1)
      setShowValid(false)

      // Clean NFC params from URL
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.has('nfc') || url.searchParams.has('ts')) {
          url.searchParams.delete('nfc')
          url.searchParams.delete('ts')
          window.history.replaceState({}, '', url.pathname + (url.search || '') + url.hash)
        }
      } catch { /* ignore */ }

      if (next >= merchant.stampsRequired) {
        setState('STAMPED')
        setTimeout(() => {
          setState('REDEEMABLE')
          setGlow('reward')
          // Auto-play the congratulations animation the moment the card is full.
          setCelebrate(true)
          setTimeout(() => setCelebrate(false), 2800)
        }, 850)
      } else {
        setState('STAMPED')
        if (!silent) {
          setShowStampToast(true)
          setTimeout(() => setShowStampToast(false), 2000)
        }
      }
      setTimeout(() => setPopIndex(-1), 900)
    }, 300)
  }

  // ── Staff flows ──────────────────────────────────────────────────────────
  function onStaffSuccess(session: StaffSession) {
    setStaffSession(session)
    setStaffDialogOpen(false)
    pushToast('✓ Staff access granted', 'ok', 2400)
  }
  function triggerRedeem() {
    setRedeemOverlay(true)
    setTimeout(() => {
      setRedeemOverlay(false)
      // Reward consumed: clear saved progress so the card starts fresh.
      skipPersist.current = true
      try {
        window.localStorage.removeItem(STORAGE_KEY)
        window.localStorage.removeItem(REDEEM_KEY)
      } catch { /* ignore */ }
      setCount(0)
      setState('LOCKED')
      setGlow('')
      setShowValid(false)
      setPopIndex(-1)
    }, 2500)
  }
  function resetStamps() {
    setCount(0)
    setState('LOCKED')
    setGlow('')
    setShowValid(false)
    setPopIndex(-1)
  }

  // ── CTA renderer ─────────────────────────────────────────────────────────
  function renderCta() {
    if (state === 'REDEEMABLE') {
      return (
        <button className="s-btn s-btn--gold" onClick={triggerRedeem}>
          <span>Claim my free coffee</span> <span style={{ fontSize: 17 }}>☕</span>
        </button>
      )
    }
    if (state === 'LOCKED') {
      return (
        <div className="s-tooltip" data-tip="Hold your phone to the wooden puck at the counter">
          <button className="s-btn s-btn--locked" disabled>
            <IconLock /> Tap the puck to earn your stamp
          </button>
        </div>
      )
    }
    if (state === 'NFC_VALID') {
      return (
        <button className="s-btn s-btn--primary"
          data-shimmer={shimmer ? 'on' : 'off'}
          onClick={() => addStamp()} disabled={adding}>
          {adding
            ? 'Adding stamp…'
            : <><span>Collect my stamp</span> <span style={{ fontSize: 17 }}>☕</span></>}
          <span className="s-shimmer" />
        </button>
      )
    }
    // STAMPED
    return (
      <button className="s-btn s-btn--ghost" aria-disabled="true"
        onClick={(e) => e.preventDefault()}>
        See you next time ☕
      </button>
    )
  }

  const breathing = state === 'LOCKED'
  const isReward  = state === 'REDEEMABLE'

  return (
    <div className="stamp-root">
      <CoffeeBackground density={8} intensity={0.16} />

      <div className="stamp-app" data-state={state}>
        <Header merchant={merchant} />

        <div className="s-stage">
          <StampCard
            merchant={merchant}
            count={count}
            popIndex={popIndex}
            glow={glow}
            breathing={breathing}
            showValid={showValid}
            rewardStyle={isReward}
          />

          <Countdown count={count} total={merchant.stampsRequired} />

          {isReward && <RewardBlock code={code} />}

          {state === 'STAMPED' && count < merchant.stampsRequired && (
            <>
              <div className={`s-toast-mini${showStampToast ? ' show' : ''}`}>
                Stamp added ✓
              </div>
              <div className="s-come-back">Come back soon.</div>
            </>
          )}

          <div className="s-spacer" />

          <div style={{ marginTop: 24 }}>
            {renderCta()}
          </div>
        </div>
      </div>

      <DemoBar
        pageState={state}
        count={count}
        total={merchant.stampsRequired}
        staffSession={staffSession}
        onSimulateNfc={enterNfcValid}
        onOpenStaffLogin={() => setStaffDialogOpen(true)}
        onGiveStamp={() => { addStamp({ silent: true }); pushToast('Stamp given manually', 'ok', 2200) }}
        onRedeem={triggerRedeem}
        onReset={resetStamps}
        onSignOut={() => setStaffSession(null)}
      />

      {staffDialogOpen && (
        <StaffDialog onClose={() => setStaffDialogOpen(false)} onSuccess={onStaffSuccess} />
      )}

      <Toaster toasts={toasts} />
      <CelebrateOverlay visible={celebrate} />
      <RedeemOverlay visible={redeemOverlay} />
    </div>
  )
}
