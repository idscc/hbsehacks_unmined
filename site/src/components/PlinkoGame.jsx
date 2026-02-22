import { useState } from 'react'
import styles from './PlinkoGame.module.css'

// 9 slots: multipliers from left to right (0x to 5x in a pyramid pattern)
const SLOT_MULTIPLIERS = [0, 0.5, 1, 2, 5, 2, 1, 0.5, 0]

export default function PlinkoGame({ spinBalance, onSpinsChange }) {
  const [bet, setBet] = useState(1)
  const [lastSlot, setLastSlot] = useState(null)
  const [lastWin, setLastWin] = useState(null)
  const [isDropping, setIsDropping] = useState(false)

  const canDrop = spinBalance >= 1 && !isDropping

  function handleDrop() {
    const b = Math.floor(Number(bet)) || 1
    if (b < 1 || b > spinBalance) return
    setIsDropping(true)
    onSpinsChange(-b)
    setLastSlot(null)
    setLastWin(null)
    // Simulate drop: random slot (weighted or uniform - using uniform for simplicity)
    const slotIndex = Math.floor(Math.random() * SLOT_MULTIPLIERS.length)
    const mult = SLOT_MULTIPLIERS[slotIndex]
    const win = Math.floor(b * mult)
    setTimeout(() => {
      setLastSlot(slotIndex)
      setLastWin(win)
      if (win > 0) onSpinsChange(win)
      setIsDropping(false)
    }, 600)
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Plinko</h2>
      <p className={styles.sectionTitle}>Spins: {spinBalance}</p>

      <div className={styles.betRow}>
        <label>
          Bet: <input
            type="number"
            min={1}
            max={spinBalance}
            className={styles.betInput}
            value={bet}
            onChange={(e) => setBet(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          />
        </label>
        <button type="button" className={styles.btn} onClick={handleDrop} disabled={!canDrop}>
          {isDropping ? '…' : 'Drop'}
        </button>
      </div>

      <p className={styles.sectionTitle}>Slots (multiplier)</p>
      <div className={styles.slots}>
        {SLOT_MULTIPLIERS.map((m, i) => (
          <span
            key={i}
            className={`${styles.slot} ${lastSlot === i ? styles.win : ''}`}
          >
            {m}×
          </span>
        ))}
      </div>

      {lastWin !== null && (
        <p className={`${styles.result} ${lastWin > 0 ? styles.win : styles.lose}`}>
          {lastWin > 0 ? `+${lastWin} spins!` : 'No win'}
        </p>
      )}
    </div>
  )
}
