/** localStorage key for the fixed destination address (Insuring Value sends always to this address). */
export const DESTINATION_STORAGE_KEY = 'unmined_destination'

/** Default destination address for all transactions */
export const DEFAULT_DESTINATION_ADDRESS = 'rnLDsmcYdsFiP9iad1dmaFJwy2VLRPsHNa'

/** localStorage key for the signed-in spin user (username). */
export const SPIN_USER_KEY = 'unmined_spin_user'

/** localStorage key prefix for saved spin items per user: unmined_spin_saved_${username} */
export const SPIN_SAVED_PREFIX = 'unmined_spin_saved_'

/** localStorage key prefix for spin balance per user: unmined_spin_balance_${username} */
export const SPIN_BALANCE_PREFIX = 'unmined_spin_balance_'

/** localStorage key prefix for auth (password hash) per user: unmined_spin_auth_${username} */
export const SPIN_AUTH_PREFIX = 'unmined_spin_auth_'

/** Backdoor: this account gets unlimited spins */
export const SPIN_BACKDOOR_USER = 'tyspn'
export const SPIN_BACKDOOR_AMOUNT = 999999999

/** Rate: XRP per spin (e.g. 0.1 = 1 XRP buys 10 spins) */
export const XRP_PER_SPIN = 0.1

/** XRP Ledger Testnet WebSocket URL (used by SendXRP, Balance, History) */
export const XRPL_TESTNET_URL = 'wss://s.altnet.rippletest.net:51233'

/** localStorage key for per-wallet USD/CAD balances: { [address]: { usd: number, cad: number } } */
export const WALLET_BALANCES_KEY = 'unmined_wallet_balances'

/** localStorage key for transaction receipts: { [txHash]: receiptString } */
export const TRANSACTION_RECEIPTS_KEY = 'unmined_transaction_receipts'
