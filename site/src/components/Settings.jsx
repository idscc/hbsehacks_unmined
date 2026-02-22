import { useState, useEffect } from 'react'
import { DESTINATION_STORAGE_KEY, DEFAULT_DESTINATION_ADDRESS } from '../constants'
import styles from './Settings.module.css'

export default function Settings({ onOpenSpin }) {
  const [destination, setDestination] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(DESTINATION_STORAGE_KEY)
    setDestination(stored && stored.trim() ? stored.trim() : DEFAULT_DESTINATION_ADDRESS)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const value = destination.trim()
    localStorage.setItem(DESTINATION_STORAGE_KEY, value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (value.toLowerCase() === 'spin' && typeof onOpenSpin === 'function') {
      onOpenSpin()
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Settings</h2>
        <p className={styles.cardNote}>
          Insuring Value always sends to the address below. Set it here and it will be used on the Insuring Value tab.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Default destination address
            <input
              type="text"
              className={styles.input}
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button type="submit" className={styles.submit}>
            Save destination
          </button>
          {saved && <p className={styles.saved}>Saved.</p>}
        </form>
      </div>
    </section>
  )
}
