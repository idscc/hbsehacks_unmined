import { useState } from 'react'
import { Client, Wallet } from 'xrpl'
import { XRPL_TESTNET_URL } from '../constants'
import { getWalletBalances } from '../lib/walletBalances'
import styles from './BalanceTab.module.css'

export default function BalanceTab() {
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [balance, setBalance] = useState(null)
  const [address, setAddress] = useState(null)
  const [storedBalances, setStoredBalances] = useState(null) // { usd, cad } from completed sends
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const seed = secret.trim()
    if (!seed) {
      setErrorMessage('Enter your wallet secret (seed).')
      return
    }
    setErrorMessage('')
    setBalance(null)
    setAddress(null)
    setStoredBalances(null)
    setStatus('loading')

    let client
    try {
      const wallet = Wallet.fromSeed(seed)
      setAddress(wallet.address)

      client = new Client(XRPL_TESTNET_URL)
      await client.connect()
      const xrpBalance = await client.getXrpBalance(wallet.address)
      setBalance(xrpBalance)
      setStoredBalances(getWalletBalances(wallet.address))
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
        <h2 className={styles.cardTitle}>Balance</h2>
        <p className={styles.cardNote}>
          Enter your wallet secret (seed) to view your XRP balance on the <strong>Testnet</strong>.
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
            {status === 'loading' ? 'Loading…' : 'Load balance'}
          </button>
        </form>

        {status === 'success' && balance != null && address && (
          <div className={styles.result}>
            <p className={styles.resultTitle}>XRP balance (Testnet)</p>
            <p className={styles.balanceValue}>{Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP</p>
            {storedBalances && (storedBalances.usd > 0 || storedBalances.cad > 0) && (
              <>
                <p className={styles.resultTitle}>Total stored value</p>
                <p className={styles.balanceRow}>
                  <span className={styles.balanceLabel}>USD</span>
                  <span className={styles.balanceValueSmall}>{storedBalances.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
                <p className={styles.balanceRow}>
                  <span className={styles.balanceLabel}>CAD</span>
                  <span className={styles.balanceValueSmall}>{storedBalances.cad.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </>
            )}
            <p className={styles.address}>Address: {address}</p>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className={styles.error}>{errorMessage}</div>
        )}
      </div>
    </section>
  )
}
