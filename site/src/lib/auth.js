import { SPIN_AUTH_PREFIX } from '../constants'

/**
 * Hash a password with SHA-256 for local storage (not secure against determined attackers; use a backend for real auth).
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function getAuthKey(username) {
  return SPIN_AUTH_PREFIX + username
}

export function getStoredHash(username) {
  try {
    const raw = localStorage.getItem(getAuthKey(username))
    if (!raw) return null
    const data = JSON.parse(raw)
    return data?.passwordHash ?? null
  } catch {
    return null
  }
}

export function setStoredHash(username, passwordHash) {
  try {
    localStorage.setItem(getAuthKey(username), JSON.stringify({ passwordHash }))
  } catch (_) {}
}

export async function createAccount(username, password) {
  const hash = await hashPassword(password)
  setStoredHash(username, hash)
}

export async function verifyPassword(username, password) {
  const stored = getStoredHash(username)
  if (!stored) return false
  const hash = await hashPassword(password)
  return hash === stored
}
