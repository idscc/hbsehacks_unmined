import { useState } from 'react'
import Client from '../lib/Client.js'
import { DEFAULT_DESTINATION_ADDRESS } from '../constants'
import styles from './WithdrawalsTab.module.css'

export default function WithdrawalsTab() {
  const [token, setToken] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [output, setOutput] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')
    setOutput(null)
    const code = token.trim()
    if (!code) return
    const qty = quantity.trim() || '1'
    if (!secret.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your wallet secret (seed) to sign the transaction.')
      return
    }

    setStatus('sending')
    let client
    try {
      client = new Client(secret.trim())
      const txHash = await client.sendHold(DEFAULT_DESTINATION_ADDRESS, code, qty)
      setOutput({
        success: true,
        txHash,
        token: code,
        quantity: qty,
        receiver: DEFAULT_DESTINATION_ADDRESS,
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err?.message || err?.data?.error_message || String(err))
      setOutput({
        success: false,
        error: err?.message || err?.data?.error_message || String(err),
      })
    } finally {
      if (client) {
        try {
          await client.disconnect()
        } catch (_) {}
      }
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Value withdrawals</h2>
        <p className={styles.cardNote}>
          Enter your token (MPT Issuance ID) to send it to the server via the ledger. The hold will be sent to the default destination.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Token (MPT Issuance ID)
            <input
              type="text"
              className={styles.input}
              placeholder="Paste or enter your token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              disabled={status === 'sending'}
            />
          </label>
          <label className={styles.label}>
            Quantity
            <input
              type="text"
              className={styles.input}
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoComplete="off"
              disabled={status === 'sending'}
            />
          </label>
          <label className={styles.label}>
            Wallet secret (seed)
            <input
              type="password"
              className={styles.input}
              placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={status === 'sending'}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            className={styles.submit}
            disabled={!token.trim() || status === 'sending'}
          >
            {status === 'sending' ? (
              <>
                <span className={styles.spinner} /> Sending…
              </>
            ) : (
              'Withdraw value'
            )}
          </button>
        </form>
      </div>

      {status === 'error' && errorMessage && (
        <div className={styles.resultCard}>
          <h3 className={styles.resultTitle}>Error</h3>
          <p className={styles.resultText}>{errorMessage}</p>
          {output?.error && (
            <pre className={styles.valuePlaceholder}>{output.error}</pre>
          )}
        </div>
      )}

      {status === 'success' && output?.success && (
        <div className={styles.resultCard}>
          <h3 className={styles.resultTitle}>Withdrawal sent</h3>
          <p className={styles.resultText}>
            Token (issuance): <span className={styles.tokenDisplay}>{output.token}</span>
          </p>
          <p className={styles.resultText}>
            Quantity: <span className={styles.tokenDisplay}>{output.quantity}</span>
          </p>
          <p className={styles.resultText}>
            Transaction hash: <span className={styles.tokenDisplay}>{output.txHash}</span>
          </p>
          <a
            href={`https://testnet.xrpl.org/transactions/${output.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.explorerLink}
          >
            View on XRPL Testnet Explorer →
          </a>
        </div>
      )}
    </section>
  )
}
