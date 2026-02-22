# XRP Wallet

A React web app for insuring value (XRP/Ripple) on the **XRP Ledger Testnet**. It includes a tabbed UI with space for History, Balance, and Settings.

## Features

- **Insuring Value** – Enter destination address, amount, and wallet secret to submit a Payment transaction.
- **Transaction output** – Shows tx hash, from/to, amount, ledger index, and a link to the testnet explorer.
- **Tabs** – Insuring Value, History, Balance, and Settings (placeholder content for future features).
- Dark, modern UI with Outfit and JetBrains Mono fonts.

## Setup

```bash
cd xrp-wallet
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Testnet

The app uses **Testnet** by default (`wss://s.altnet.rippletest.net:51233`). Get test XRP from the [XRPL Testnet Faucet](https://faucet.altnet.rippletest.net/). Never use mainnet secrets in this app.

## Testing transactions

1. **Get test XRP**
   - Go to the [XRPL Testnet Faucet](https://faucet.altnet.rippletest.net/).
   - Enter a **destination address** (your testnet XRP address, e.g. `rXXXX...`).
   - Request test XRP. The faucet will send you 1,000 XRP on testnet (no real value).

2. **Get a wallet secret (seed)**
   - If you don’t have one, use the faucet’s “Generate test credentials” (or similar) to get an address and secret.
   - Or create a wallet with [Xumm](https://xumm.app/) or another tool and use **testnet** credentials only.

3. **Set the destination in the app**
   - Open the **Settings** tab.
   - Enter the **destination address** that should receive the value (where you want test XRP to go).
   - Click **Save destination**.

4. **Send a test payment**
   - Open the **Insuring Value** tab.
   - Enter a **Value (CAD)** amount (e.g. `10`). The app converts this to XRP using current rates and sends that much XRP.
   - Enter your **Wallet secret (seed)** for the account that holds test XRP.
   - Click **Insure value**. After a few seconds you should see a success message and a link to the transaction on the testnet explorer.

5. **Verify**
   - Use the **View on XRPL Testnet Explorer** link on the success card, or go to [testnet.xrpl.org](https://testnet.xrpl.org) and look up your address or the transaction hash.

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build
