import { useState, useEffect } from 'react'
import { Client, Wallet, xrpToDrops } from 'xrpl'
import { DESTINATION_STORAGE_KEY } from '../constants'
import { addWalletBalances } from '../lib/walletBalances'
import styles from './SendXRP.module.css'

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233'
const FRANKFURTER_LATEST = 'https://api.frankfurter.app/latest?from=CAD&to=USD'
const COINGECKO_XRP_USD = 'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd'

function getStoredDestination() {
  try {
    return localStorage.getItem(DESTINATION_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export default function SendXRP() {
  const [cadAmount, setCadAmount] = useState('')
  const [secret, setSecret] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [output, setOutput] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [cadToUsd, setCadToUsd] = useState(null) // 1 CAD = X USD
  const [xrpUsd, setXrpUsd] = useState(null)    // 1 XRP = X USD
  const [ratesError, setRatesError] = useState(null)

  const storedDestination = getStoredDestination()

  useEffect(() => {
    let cancelled = false
    setRatesError(null)
    Promise.all([
      fetch(FRANKFURTER_LATEST).then((r) => r.json()),
      fetch(COINGECKO_XRP_USD).then((r) => r.json()),
    ])
      .then(([frank, cg]) => {
        if (cancelled) return
        const usd = frank?.rates?.USD
        const xrp = cg?.ripple?.usd
        if (typeof usd === 'number' && usd > 0) setCadToUsd(usd)
        if (typeof xrp === 'number' && xrp > 0) setXrpUsd(xrp)
        if (typeof usd !== 'number' || usd <= 0 || typeof xrp !== 'number' || xrp <= 0) {
          setRatesError('Exchange rates unavailable')
        }
      })
      .catch((err) => {
        if (!cancelled) setRatesError(err?.message ?? 'Could not load exchange rates')
      })
    return () => { cancelled = true }
  }, [])

  const cadNum = parseFloat(cadAmount)
  const validCad = !Number.isNaN(cadNum) && cadNum > 0
  const usdEquivalent = (cadToUsd != null && validCad) ? cadNum * cadToUsd : null

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')
    setOutput(null)
    setStatus('sending')

    const rawDest = getStoredDestination().trim()
    const dest = rawDest.toLowerCase() === 'spin' ? '' : rawDest
    if (!dest) {
      setStatus('error')
      setErrorMessage(rawDest.toLowerCase() === 'spin' ? 'Destination "spin" opens the Spin menu. Set a valid XRP address in Settings to send.' : 'Set your default destination address in Settings first.')
      return
    }
    if (!validCad) {
      setStatus('error')
      setErrorMessage('Please enter a valid amount in Canadian dollars.')
      return
    }
    if (cadToUsd == null || xrpUsd == null || ratesError) {
      setStatus('error')
      setErrorMessage('Exchange rates are not available. Try again in a moment.')
      return
    }
    if (!secret.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your wallet secret (seed) to sign the transaction.')
      return
    }

    const usdValue = cadNum * cadToUsd
    const xrpAmount = usdValue / xrpUsd
    if (xrpAmount <= 0) {
      setStatus('error')
      setErrorMessage('Computed XRP amount is invalid.')
      return
    }
    // XRP allows at most 6 decimal places; round to avoid xrpToDrops error
    const xrpRounded = Number(xrpAmount.toFixed(6))

    let client
    try {
      client = new Client(TESTNET_URL)
      await client.connect()

      const wallet = Wallet.fromSeed(secret.trim())
      const drops = xrpToDrops(xrpRounded.toString())

      const tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: dest,
        Amount: drops,
      }

      const prepared = await client.autofill(tx)
      const signed = wallet.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)

      const success = result.result.meta.TransactionResult === 'tesSUCCESS'
      if (success) {
        addWalletBalances(wallet.address, usdValue, cadNum)
      }
      setOutput({
        success,
        txHash: result.result.hash,
        ledgerIndex: result.result.ledger_index,
        account: wallet.address,
        destination: dest,
        amount: xrpRounded,
        cadValue: cadNum,
        usdValue,
        result: result.result.meta?.TransactionResult ?? result.result.meta?.engine_result ?? 'unknown',
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
        <h2 className={styles.cardTitle}>Insuring Value</h2>
        <p className={styles.cardNote}>
          Uses XRP Ledger <strong>Testnet</strong>. Get test XRP at{' '}
          <a href="https://faucet.altnet.rippletest.net/" target="_blank" rel="noopener noreferrer" className={styles.link}>
            faucet.altnet.rippletest.net
          </a>
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.cardNote}>
            {storedDestination.trim().toLowerCase() === 'spin'
              ? <>Destination is <strong>spin</strong> — opens the Spin menu. Set a valid XRP address in Settings to send.</>
              : storedDestination.trim()
                ? <>Sends to: <span className={styles.mono}>{storedDestination.trim()}</span> (change in Settings)</>
                : <>No destination set. Set your default address in the <strong>Settings</strong> tab.</>}
          </p>
          <label className={styles.label}>
            Value (CAD)
            <input
              type="text"
              inputMode="decimal"
              className={styles.input}
              placeholder="100"
              value={cadAmount}
              onChange={(e) => setCadAmount(e.target.value)}
              disabled={status === 'sending'}
            />
            <span className={styles.usdEquivalent}>
              {ratesError && 'Unable to load rates.'}
              {!ratesError && cadToUsd == null && 'Loading rates…'}
              {!ratesError && cadToUsd != null && !validCad && cadAmount.trim() !== '' && 'Enter a valid amount.'}
              {!ratesError && cadToUsd != null && validCad && `≈ ${usdEquivalent.toFixed(2)} USD`}
            </span>
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
            disabled={status === 'sending' || cadToUsd == null || xrpUsd == null || !!ratesError}
          >
{status === 'sending' ? (
                <>
                  <span className={styles.spinner} /> Insuring…
              </>
            ) : (
              'Insure value'
            )}
          </button>
        </form>
      </div>

      {(status === 'error' && errorMessage) && (
        <div className={styles.outputCard + ' ' + styles.error}>
          <h3 className={styles.outputTitle}>Error</h3>
          <p className={styles.outputText}>{errorMessage}</p>
          {output?.error && (
            <pre className={styles.pre}>{output.error}</pre>
          )}
        </div>
      )}

      {status === 'success' && output && (
        <div className={styles.outputCard + ' ' + styles.success}>
          <h3 className={styles.outputTitle}>
            {output.success ? 'Transaction successful' : 'Transaction result'}
          </h3>
          <dl className={styles.outputList}>
            <dt>Transaction hash</dt>
            <dd className={styles.mono}>{output.txHash}</dd>
            <dt>From</dt>
            <dd className={styles.mono}>{output.account}</dd>
            <dt>To</dt>
            <dd className={styles.mono}>{output.destination}</dd>
            <dt>Value</dt>
            <dd>{output.cadValue?.toFixed(2)} CAD ≈ {output.usdValue?.toFixed(2)} USD</dd>
            <dt>Amount sent</dt>
            <dd>{typeof output.amount === 'number' ? output.amount.toFixed(4) : output.amount} XRP</dd>
            {output.ledgerIndex != null && (
              <>
                <dt>Ledger index</dt>
                <dd>{output.ledgerIndex}</dd>
              </>
            )}
            <dt>Result</dt>
            <dd className={styles.resultCode}>{output.result}</dd>
          </dl>
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
