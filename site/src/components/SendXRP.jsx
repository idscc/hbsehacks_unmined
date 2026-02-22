import { useState, useEffect } from 'react'
import { Wallet, xrpToDrops } from 'xrpl'
import Client from '../lib/Client.js'
import { DESTINATION_STORAGE_KEY, DEFAULT_DESTINATION_ADDRESS } from '../constants'
import { addWalletBalances } from '../lib/walletBalances'
import { setTransactionReceipt } from '../lib/transactionReceipts'
import styles from './SendXRP.module.css'

const FRANKFURTER_LATEST = 'https://api.frankfurter.app/latest?from=CAD&to=USD'
const COINGECKO_XRP_USD = 'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd'
const ISSUANCE_API_URL = 'https://api.unmined.ca/iss'
const RECEIPT_POLL_INTERVAL_MS = 2000
const RECEIPT_POLL_TIMEOUT_MS = 60000

function isReceiptMptZero(receiptString) {
  if (!receiptString || typeof receiptString !== 'string') return false
  try {
    const parsed = JSON.parse(receiptString.trim())
    return parsed != null && typeof parsed === 'object' && parsed.mpt === 0
  } catch {
    return false
  }
}

function getStoredDestination() {
  try {
    const stored = localStorage.getItem(DESTINATION_STORAGE_KEY)
    return stored && stored.trim() ? stored.trim() : DEFAULT_DESTINATION_ADDRESS
  } catch {
    return DEFAULT_DESTINATION_ADDRESS
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
  const [mptIssuanceId, setMptIssuanceId] = useState(null)

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

    const rawDest = getStoredDestination()
    const dest = rawDest.toLowerCase() === 'spin' ? DEFAULT_DESTINATION_ADDRESS : (rawDest || DEFAULT_DESTINATION_ADDRESS)
    if (!dest) {
      setStatus('error')
      setErrorMessage('Invalid destination address.')
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
      const wallet = Wallet.fromSeed(secret.trim())
      const clientId = wallet.address
      const drops = xrpToDrops(xrpRounded.toString())

      // Initialize Client.js (connects to XRPL)
      client = new Client(secret.trim())

      // 1) Send XRP first via Client.js
      const txHash = await client.sendXrp(dest, drops)

      // Get transaction result to check success
      const txResult = await client.getTxn(txHash)
      const success = txResult.meta?.TransactionResult === 'tesSUCCESS'

      // 2) Poll issuance API until receipt is something other than {"mpt":0}, then show results
      let issuanceId = null
      let receiptString = null
      let receiptError = null
      let gotValidReceipt = false
      const issUrl = `${ISSUANCE_API_URL}?iss_id=${encodeURIComponent(clientId)}`
      const pollDeadline = Date.now() + RECEIPT_POLL_TIMEOUT_MS

      while (Date.now() < pollDeadline) {
        try {
          const apiResponse = await fetch(issUrl, { method: 'GET' })
          if (apiResponse.ok) {
            receiptString = await apiResponse.text()
            if (receiptString && txHash) {
              setTransactionReceipt(txHash, receiptString)
            }
            if (!isReceiptMptZero(receiptString)) {
              try {
                const apiData = JSON.parse(receiptString)
                issuanceId = apiData.mpt
                setMptIssuanceId(issuanceId)
                if (issuanceId) {
                  await client.allowMpt(issuanceId)
                }
              } catch (parseError) {
                console.error('Failed to parse API response as JSON:', parseError)
              }
              gotValidReceipt = true
              break
            }
          }
        } catch (apiError) {
          console.error('Issuance API poll error:', apiError)
        }
        await new Promise((r) => setTimeout(r, RECEIPT_POLL_INTERVAL_MS))
      }

      if (!gotValidReceipt) {
        receiptError = 'Transaction receipt not yet available (no MPT issuance).'
        receiptString = null
      }

      if (success) {
        addWalletBalances(clientId, usdValue, cadNum)
      }

      setOutput({
        success,
        issuanceId,
        txHash,
        ledgerIndex: txResult.ledger_index ?? txResult.validated_ledger_index ?? null,
        account: clientId,
        destination: dest,
        amount: xrpRounded,
        cadValue: cadNum,
        usdValue,
        result: txResult.meta?.TransactionResult ?? txResult.meta?.engine_result ?? txResult.engine_result ?? 'unknown',
        mptIssuanceId: issuanceId,
        receipt: receiptString,
        receiptError,
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
              : <>Sends to: <span className={styles.mono}>{storedDestination}</span> (change in Settings)</>}
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
              {!ratesError && cadToUsd != null && validCad && usdEquivalent != null && `≈ ${usdEquivalent.toFixed(2)} USD`}
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
            <dt>Issuance ID</dt>
            <dd className={styles.mono}>{output.issuanceId}</dd>
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
            {output.mptIssuanceId && (
              <>
                <dt>MPT Issuance ID</dt>
                <dd className={styles.mono}>{output.mptIssuanceId}</dd>
              </>
            )}
            {(output.receipt != null || output.receiptError) && (
              <>
                <dt>Transaction Receipt</dt>
                <dd>
                  {output.receiptError ? (
                    <span className={styles.receiptError}>{output.receiptError}</span>
                  ) : (
                    <span className={styles.mono} style={{ whiteSpace: 'nowrap', overflowX: 'auto' }}>{output.receipt}</span>
                  )}
                </dd>
              </>
            )}
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
