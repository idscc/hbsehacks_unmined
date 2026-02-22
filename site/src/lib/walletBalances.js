import { WALLET_BALANCES_KEY } from '../constants'

function loadAll() {
  try {
    const raw = localStorage.getItem(WALLET_BALANCES_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return typeof data === 'object' && data !== null ? data : {}
  } catch {
    return {}
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(WALLET_BALANCES_KEY, JSON.stringify(data))
  } catch (_) {}
}

/**
 * Get stored USD and CAD balances for a wallet address.
 * @param {string} address - XRP Ledger address (r...)
 * @returns {{ usd: number, cad: number }}
 */
export function getWalletBalances(address) {
  if (!address) return { usd: 0, cad: 0 }
  const all = loadAll()
  const entry = all[address]
  if (!entry || typeof entry !== 'object') return { usd: 0, cad: 0 }
  return {
    usd: Number(entry.usd) || 0,
    cad: Number(entry.cad) || 0,
  }
}

/**
 * Add USD and CAD amounts to a wallet's stored balances (e.g. after a completed send).
 * Uses the values at time of send.
 * @param {string} address - Wallet address (r...)
 * @param {number} usd - USD amount to add
 * @param {number} cad - CAD amount to add
 */
export function addWalletBalances(address, usd, cad) {
  if (!address) return
  const all = loadAll()
  const current = getWalletBalances(address)
  all[address] = {
    usd: current.usd + (Number(usd) || 0),
    cad: current.cad + (Number(cad) || 0),
  }
  saveAll(all)
}
