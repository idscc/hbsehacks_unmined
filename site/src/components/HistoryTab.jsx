import { useState } from 'react'
import { Client, Wallet, dropsToXrp } from 'xrpl'
import { XRPL_TESTNET_URL } from '../constants'
import styles from './HistoryTab.module.css'

const TESTNET_EXPLORER = 'https://testnet.xrpl.org/transactions/'
const LIMIT = 20

function formatDate(rippleEpochSeconds) {
  if (rippleEpochSeconds == null) return '—'
  // Ripple epoch is Jan 1, 2000 00:00 UTC
  const date = new Date((rippleEpochSeconds + 946684800) * 1000)
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function parseAmount(tx, myAddress) {
  const type = tx.TransactionType
  if (type === 'Payment' && typeof tx.Amount === 'string') {
    const xrp = Number(dropsToXrp(tx.Amount))
    const sent = tx.Account === myAddress
    return { text: `${sent ? '−' : '+'}${xrp.toFixed(4)} XRP`, sent }
  }
  if (type === 'Payment' && typeof tx.Amount === 'object') {
    return { text: tx.Amount.value + ' ' + (tx.Amount.currency || ''), sent: tx.Account === myAddress }
  }
  return { text: type, sent: false }
}

export default function HistoryTab() {
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [transactions, setTransactions] = useState([])
  const [myAddress, setMyAddress] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const seed = secret.trim()
    if (!seed) {
      setErrorMessage('Enter your wallet secret (seed).')
      return
    }
    setErrorMessage('')
    setTransactions([])
    setMyAddress(null)
    setStatus('loading')

    let client
    try {
      const wallet = Wallet.fromSeed(seed)
      setMyAddress(wallet.address)

      client = new Client(XRPL_TESTNET_URL)
      await client.connect()

      const resp = await client.request({
        command: 'account_tx',
        account: wallet.address,
        limit: LIMIT,
      })

      const txs = resp.result?.transactions ?? []
      setTransactions(txs)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err?.message || err?.data?.error_message || String(err))
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
        <h2 className={styles.cardTitle}>Transaction History</h2>
        <p className={styles.cardNote}>
          Enter your wallet secret (seed) to load your recent transactions on the <strong>Testnet</strong>.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Wallet secret (seed)
            <input
              type="password"
              className={styles.input}
              placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={status === 'loading'}
              autoComplete="off"
            />
          </label>
          <button type="submit" className={styles.submit} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading…' : 'Load history'}
          </button>
        </form>

        {status === 'success' && (
          <>
            {transactions.length === 0 ? (
              <p className={styles.empty}>No recent transactions.</p>
            ) : (
              <ul className={styles.list} aria-label="Transaction history">
                {transactions.map((item, i) => {
                  const tx = item.tx || item
                  const hash = tx.hash
                  const amountInfo = parseAmount(tx, myAddress)
                  return (
                    <li key={hash || i} className={styles.txItem}>
                      <div className={styles.txRow}>
                        <span className={styles.txType}>{tx.TransactionType}</span>
                        {amountInfo.text && (
                          <span className={styles.txAmount}>{amountInfo.text}</span>
                        )}
                        <span className={styles.txDate}>{formatDate(tx.date)}</span>
                      </div>
                      {hash && (
                        <a
                          href={TESTNET_EXPLORER + hash}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.txLink}
                        >
                          View on Explorer →
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {status === 'error' && errorMessage && (
          <div className={styles.error}>{errorMessage}</div>
        )}
      </div>
    </section>
  )
}
