import { TRANSACTION_RECEIPTS_KEY } from '../constants'

function loadAll() {
  try {
    const raw = localStorage.getItem(TRANSACTION_RECEIPTS_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return typeof data === 'object' && data !== null ? data : {}
  } catch {
    return {}
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(TRANSACTION_RECEIPTS_KEY, JSON.stringify(data))
  } catch (_) {}
}

/**
 * Get stored transaction receipt for a transaction hash.
 * @param {string} txHash - Transaction hash
 * @returns {string|null} - Receipt string or null if not found
 */
export function getTransactionReceipt(txHash) {
  if (!txHash) return null
  const all = loadAll()
  return all[txHash] || null
}

/**
 * Store a transaction receipt for a transaction hash.
 * @param {string} txHash - Transaction hash
 * @param {string} receipt - Receipt string from API
 */
export function setTransactionReceipt(txHash, receipt) {
  if (!txHash || !receipt) return
  const all = loadAll()
  all[txHash] = receipt
  saveAll(all)
}

/**
 * Get all transaction receipts.
 * @returns {{ [txHash]: string }}
 */
export function getAllTransactionReceipts() {
  return loadAll()
}
