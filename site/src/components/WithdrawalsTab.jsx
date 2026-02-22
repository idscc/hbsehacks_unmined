import { useState } from 'react'
import styles from './WithdrawalsTab.module.css'

// Token → value mapping will be configured later. For now we only collect the token and show a placeholder.
const TOKENS_CONFIGURED = false

export default function WithdrawalsTab() {
  const [token, setToken] = useState('')
  const [submittedToken, setSubmittedToken] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const t = token.trim()
    if (!t) return
    setSubmittedToken(t)
  }

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Value withdrawals</h2>
        <p className={styles.cardNote}>
          Enter a token to receive the value associated with it. You can configure tokens and their values later.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Token
            <input
              type="text"
              className={styles.input}
              placeholder="Paste or enter your token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            className={styles.submit}
            disabled={!token.trim()}
          >
            Withdraw value
          </button>
        </form>
      </div>

      {submittedToken != null && (
        <div className={styles.resultCard}>
          <h3 className={styles.resultTitle}>Token received</h3>
          <p className={styles.resultText}>
            Token: <span className={styles.tokenDisplay}>{submittedToken}</span>
          </p>
          <div className={styles.valuePlaceholder}>
            {TOKENS_CONFIGURED
              ? 'Value will be sent here once token is validated.'
              : 'Token configuration is not set up yet. Once you configure tokens and their values, entering a token here will send you the associated value.'}
          </div>
        </div>
      )}
    </section>
  )
}
