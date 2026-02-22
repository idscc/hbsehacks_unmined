import { useState, useEffect, useRef } from 'react'
import { Wallet } from 'xrpl'
import { runSpin } from '../lib/spinConfig'
import { createAccount, verifyPassword, getStoredHash } from '../lib/auth'
import {
  SPIN_USER_KEY,
  SPIN_SAVED_PREFIX,
  SPIN_BALANCE_PREFIX,
  SPIN_BACKDOOR_USER,
  SPIN_BACKDOOR_AMOUNT,
  XRP_PER_SPIN,
} from '../constants'
import ShapeImage from './ShapeImage'
import BlackjackGame from './BlackjackGame'
import PlinkoGame from './PlinkoGame'
import styles from './SpinPage.module.css'

const SAVED_MAX = 8
const SPIN_ANIMATION_MS = 2400

function loadUser() {
  try {
    return localStorage.getItem(SPIN_USER_KEY) || null
  } catch {
    return null
  }
}

function loadSaved(username) {
  if (!username) return []
  try {
    const raw = localStorage.getItem(SPIN_SAVED_PREFIX + username)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(0, SAVED_MAX) : []
  } catch {
    return []
  }
}

function saveSaved(username, items) {
  if (!username) return
  try {
    localStorage.setItem(SPIN_SAVED_PREFIX + username, JSON.stringify(items.slice(0, SAVED_MAX)))
  } catch (_) {}
}

function getEffectiveBalance(username, balance) {
  if (username === SPIN_BACKDOOR_USER) return SPIN_BACKDOOR_AMOUNT
  return balance
}

function loadBalance(username) {
  if (username === SPIN_BACKDOOR_USER) return SPIN_BACKDOOR_AMOUNT
  try {
    const raw = localStorage.getItem(SPIN_BALANCE_PREFIX + username)
    if (raw == null) return 0
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function saveBalance(username, amount) {
  if (username === SPIN_BACKDOOR_USER) return
  try {
    localStorage.setItem(SPIN_BALANCE_PREFIX + username, String(Math.max(0, Math.floor(amount))))
  } catch (_) {}
}

export default function SpinPage({ onBack }) {
  const [results, setResults] = useState([])
  const [user, setUser] = useState(null)
  const [savedItems, setSavedItems] = useState([])
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [revealIndex, setRevealIndex] = useState(null) // null = not revealing; 0..length-1 = showing that result
  const [buyXrpInput, setBuyXrpInput] = useState('')
  const [buyWalletSecret, setBuyWalletSecret] = useState('')
  const [buyWalletError, setBuyWalletError] = useState('')
  const spinTimeoutRef = useRef(null)

  useEffect(() => {
    const u = loadUser()
    setUser(u)
    setSavedItems(u ? loadSaved(u) : [])
    setBalance(u ? loadBalance(u) : 0)
  }, [])

  useEffect(() => {
    if (user) saveSaved(user, savedItems)
  }, [user, savedItems])

  useEffect(() => {
    if (user && user !== SPIN_BACKDOOR_USER) saveBalance(user, balance)
  }, [user, balance])

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current)
    }
  }, [])

  const effectiveBalance = user ? getEffectiveBalance(user, balance) : 0

  function handleSpin(count) {
    if (!user) return
    if (effectiveBalance < count) return
    if (isSpinning) return
    setIsSpinning(true)
    if (user !== SPIN_BACKDOOR_USER) {
      setBalance((b) => Math.max(0, b - count))
      saveBalance(user, balance - count)
    }
    spinTimeoutRef.current = setTimeout(() => {
      const next = Array.from({ length: count }, () => runSpin())
      setResults(next)
      setIsSpinning(false)
      setRevealIndex(0) // start one-at-a-time reveal
    }, SPIN_ANIMATION_MS)
  }

  function handleBuySpins(e) {
    e.preventDefault()
    setBuyWalletError('')
    const seed = buyWalletSecret.trim()
    if (!seed) {
      setBuyWalletError('Enter your XRP wallet secret to buy spins.')
      return
    }
    let wallet
    try {
      wallet = Wallet.fromSeed(seed)
    } catch (err) {
      setBuyWalletError('Invalid XRP wallet secret.')
      return
    }
    const xrp = parseFloat(buyXrpInput)
    if (!Number.isFinite(xrp) || xrp <= 0 || !user) return
    const spins = Math.floor(xrp / XRP_PER_SPIN)
    if (spins <= 0) return
    if (user === SPIN_BACKDOOR_USER) return
    setBalance((b) => b + spins)
    saveBalance(user, balance + spins)
    setBuyXrpInput('')
    setBuyWalletSecret('')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    const name = usernameInput.trim()
    const password = passwordInput
    setAuthError('')
    if (!name) {
      setAuthError('Enter a username.')
      return
    }
    if (!password) {
      setAuthError('Enter a password.')
      return
    }
    setAuthLoading(true)
    try {
      const existingHash = getStoredHash(name)
      if (existingHash) {
        const ok = await verifyPassword(name, password)
        if (!ok) {
          setAuthError('Wrong password.')
          setAuthLoading(false)
          return
        }
      } else {
        await createAccount(name, password)
      }
      setUser(name)
      setSavedItems(loadSaved(name))
      setBalance(loadBalance(name))
      setUsernameInput('')
      setPasswordInput('')
    } catch (err) {
      setAuthError(err?.message ?? 'Sign in failed.')
    }
    setAuthLoading(false)
  }

  function handleSignOut() {
    setUser(null)
    setSavedItems([])
    setBalance(0)
    setRevealIndex(null)
    try {
      localStorage.removeItem(SPIN_USER_KEY)
    } catch (_) {}
  }

  function handleRevealClick() {
    if (revealIndex == null || results.length === 0) return
    if (revealIndex < results.length - 1) {
      setRevealIndex(revealIndex + 1)
    } else {
      setRevealIndex(null)
    }
  }

  function handleSaveResult(r) {
    if (!user) return
    if (savedItems.length >= SAVED_MAX) return
    const item = { shape: r.shape, color: r.color }
    setSavedItems((prev) => [...prev, item])
  }

  function handleRemoveSaved(index) {
    setSavedItems((prev) => prev.filter((_, i) => i !== index))
  }

  function persistUser() {
    if (user) {
      try {
        localStorage.setItem(SPIN_USER_KEY, user)
      } catch (_) {}
    }
  }

  useEffect(() => {
    persistUser()
  }, [user])

  const canSave = user && savedItems.length < SAVED_MAX

  function handleSpinsChange(delta) {
    if (!user) return
    setBalance((b) => Math.max(0, b + delta))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h1 className={styles.title}>Spin</h1>
        <span />
      </header>

      <div className={styles.mainGrid}>
        <aside className={styles.sideColumn}>
          {user ? (
            <BlackjackGame spinBalance={effectiveBalance} onSpinsChange={handleSpinsChange} />
          ) : (
            <div className={styles.placeholderCard}>
              <p className={styles.authMessage}>Sign in to play Blackjack with spins.</p>
            </div>
          )}
        </aside>

        <div className={styles.centerColumn}>
      <div className={styles.card}>
        <div className={styles.authBar}>
          {user ? (
            <>
              <p className={styles.authMessage}>Signed in as <strong>{user}</strong>. Progress is saved.</p>
              <button type="button" className={`${styles.authButton} ${styles.secondary}`} onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className={styles.authMessage}>Sign in or create an account (username + password).</p>
              <form className={styles.authForm} onSubmit={handleSignIn}>
                <input
                  type="text"
                  className={styles.authInput}
                  placeholder="Username"
                  value={usernameInput}
                  onChange={(e) => { setUsernameInput(e.target.value); setAuthError(''); }}
                  autoComplete="username"
                />
                <input
                  type="password"
                  className={styles.authInput}
                  placeholder="Password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setAuthError(''); }}
                  autoComplete="current-password"
                />
                <button type="submit" className={styles.authButton} disabled={authLoading}>
                  {authLoading ? '…' : 'Sign in'}
                </button>
              </form>
              {authError && <p className={styles.authError}>{authError}</p>}
            </>
          )}
        </div>

        {user && (
          <div className={styles.balanceBar}>
            <span className={styles.balanceLabel}>Spins:</span>
            <span className={styles.balanceValue}>{effectiveBalance.toLocaleString()}</span>
            <span className={styles.rateNote}>{XRP_PER_SPIN} XRP = 1 spin</span>
          </div>
        )}

        {user && (
          <form className={styles.buyBar} onSubmit={handleBuySpins}>
            <label className={styles.buyLabel}>
              Buy spins with XRP (XRP wallet required)
              <span className={styles.rateNote}>1 XRP = {Math.floor(1 / XRP_PER_SPIN)} spins</span>
            </label>
            <input
              type="password"
              className={styles.buyWalletInput}
              placeholder="XRP wallet secret (seed)"
              value={buyWalletSecret}
              onChange={(e) => { setBuyWalletSecret(e.target.value); setBuyWalletError(''); }}
              disabled={user === SPIN_BACKDOOR_USER}
              autoComplete="off"
            />
            <div className={styles.buyRow}>
              <input
                type="number"
                step="any"
                min="0"
                className={styles.buyInput}
                placeholder="XRP amount"
                value={buyXrpInput}
                onChange={(e) => setBuyXrpInput(e.target.value)}
                disabled={user === SPIN_BACKDOOR_USER}
              />
              <button type="submit" className={styles.authButton} disabled={!buyXrpInput.trim() || !buyWalletSecret.trim() || user === SPIN_BACKDOOR_USER}>
                Get spins
              </button>
            </div>
            {buyWalletError && <p className={styles.authError}>{buyWalletError}</p>}
          </form>
        )}

        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.spinButton}
            onClick={() => handleSpin(1)}
            disabled={!user || effectiveBalance < 1 || isSpinning}
          >
            Spin 1
          </button>
          <button
            type="button"
            className={styles.spinButton}
            onClick={() => handleSpin(10)}
            disabled={!user || effectiveBalance < 10 || isSpinning}
          >
            Spin 10
          </button>
        </div>

        {!user && (
          <p className={styles.authMessage}>Sign in to spin. Buy spins with XRP at {XRP_PER_SPIN} XRP per spin.</p>
        )}

        {results.length > 0 && revealIndex === null && (
          <section className={styles.resultsSection} aria-label="Spin results">
            <h2 className={styles.resultsTitle}>
              Results {canSave && <span className={styles.authMessage}>(click to save)</span>}
            </h2>
            <ul className={styles.resultList}>
              {results.map((r, i) => (
                <li
                  key={i}
                  className={`${styles.resultItem} ${canSave ? styles.clickable : ''}`}
                  style={{ borderColor: r.color.hex }}
                  onClick={canSave ? () => handleSaveResult(r) : undefined}
                  onKeyDown={canSave ? (e) => e.key === 'Enter' && handleSaveResult(r) : undefined}
                  role={canSave ? 'button' : undefined}
                  tabIndex={canSave ? 0 : undefined}
                >
                  <span className={styles.resultItemShape}>{r.shape.name}</span>
                  <span
                    className={styles.resultItemColor}
                    style={{
                      backgroundColor: r.color.hex,
                      color: r.color.id === 'gray' || r.color.id === 'yellow' ? '#1a1a1a' : '#fff',
                    }}
                  >
                    {r.color.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.savedSection} aria-label="Saved shapes">
          <h2 className={styles.savedTitle}>Saved shapes ({savedItems.length}/{SAVED_MAX})</h2>
          <div className={styles.savedSlots}>
            {Array.from({ length: SAVED_MAX }, (_, i) => {
              const item = savedItems[i]
              const filled = !!item
              return (
                <div
                  key={i}
                  className={`${styles.savedSlot} ${filled ? styles.filled : ''} ${filled && user ? styles.clickable : ''}`}
                  onClick={filled && user ? () => handleRemoveSaved(i) : undefined}
                  onKeyDown={filled && user ? (e) => e.key === 'Enter' && handleRemoveSaved(i) : undefined}
                  role={filled && user ? 'button' : undefined}
                  tabIndex={filled && user ? 0 : undefined}
                  title={filled && user ? 'Click to remove' : (filled ? '' : 'Empty slot')}
                >
                  {item ? (
                    <>
                      <span className={styles.savedSlotShape}>{item.shape.name}</span>
                      <span
                        className={styles.savedSlotColor}
                        style={{
                          backgroundColor: item.color.hex,
                          color: item.color.id === 'gray' || item.color.id === 'yellow' ? '#1a1a1a' : '#fff',
                        }}
                      >
                        {item.color.name}
                      </span>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
        </div>

        <aside className={styles.sideColumn}>
          {user ? (
            <PlinkoGame spinBalance={effectiveBalance} onSpinsChange={handleSpinsChange} />
          ) : (
            <div className={styles.placeholderCard}>
              <p className={styles.authMessage}>Sign in to play Plinko with spins.</p>
            </div>
          )}
        </aside>
      </div>

      {isSpinning && (
        <div className={styles.spinOverlay} aria-hidden="true">
          <div className={styles.spinOverlayBg} />
          <div className={styles.spinWheel} />
          <div className={styles.spinRays} />
          <div className={styles.spinParticles}>
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className={styles.spinParticle} style={{ '--i': i }} />
            ))}
          </div>
          <p className={styles.spinText}>SPINNING...</p>
          <p className={styles.spinSubtext}>✨</p>
        </div>
      )}

      {revealIndex !== null && results[revealIndex] && (
        <div
          className={styles.revealOverlay}
          onClick={handleRevealClick}
          onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handleRevealClick() : null}
          role="button"
          tabIndex={0}
          aria-label="Click to continue"
        >
          {results.length > 1 && (
            <span className={styles.revealCount}>
              {revealIndex + 1} / {results.length}
            </span>
          )}
          <div className={styles.revealShapeWrap}>
            <ShapeImage
              shapeId={results[revealIndex].shape.id}
              colorHex={results[revealIndex].color.hex}
              size={280}
            />
          </div>
          <p className={styles.revealName}>{results[revealIndex].shape.name}</p>
          <p className={styles.revealColor}>{results[revealIndex].color.name}</p>
          <p className={styles.revealHint}>Click to continue</p>
        </div>
      )}
    </div>
  )
}
