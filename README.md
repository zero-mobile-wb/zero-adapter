# @zerowallet/adapter

[![npm version](https://img.shields.io/npm/v/@zerowallet/adapter.svg)](https://www.npmjs.com/package/@zerowallet/adapter)

Zero Wallet Adapter is the official Solana Wallet Adapter SDK for **Zero Wallet**, a self-custody mobile wallet native to Solana. 

This adapter allows any Solana dApp using `@solana/wallet-adapter-react` to instantly connect to the Zero Wallet mobile app, enabling secure mobile transaction signing via deep links.

---

## What is Zero Wallet?
Zero Wallet gives users true self-custody mobile access to Solana. Instead of storing private keys in browser extensions or adapter layers, **Zero Wallet keeps your keys safely encrypted on your mobile device**.

When a user connects a dApp or signs a transaction, the `@zerowallet/adapter` passes the request to the Zero Wallet app via secure OS-level deep links (`zerowallet://`), entirely offloading the private key operations to the mobile application.

## Installation

Add the package via your preferred package manager:

```bash
npm install @zerowallet/adapter @solana/wallet-adapter-base @solana/web3.js
# or
yarn add @zerowallet/adapter @solana/wallet-adapter-base @solana/web3.js
# or
pnpm add @zerowallet/adapter @solana/wallet-adapter-base @solana/web3.js
```

## Quick Start

Integrating Zero Wallet works exactly like integrating Phantom or Solflare in the standard Solana wallet adapter ecosystem.

```tsx
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ZeroWalletAdapter } from '@zerowallet/adapter';
import '@solana/wallet-adapter-react-ui/styles.css';

export const Wallet = ({ children }) => {
    // Determine your network
    const endpoint = 'https://api.mainnet-beta.solana.com';

    const wallets = useMemo(
        () => [
            new ZeroWalletAdapter({
                network: 'mainnet-beta', // or 'devnet', 'testnet'
                // Optional: Hardcode the callback URL if you are not running in a browser environment
                // callbackUrl: 'https://my-dapp.com/callback'
            }),
            // ... other wallets like new PhantomWalletAdapter()
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletMultiButton />
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
```

## Deep Link Flow

When a user initiates an action from your dApp, the flow is as follows:

1. **Adapter serializes payload**: The adapter encodes the payload (e.g., connection request, serialized transaction) into Base64.
2. **Deep link dispatched**: The adapter calls `window.location.href = 'zerowallet://...'`.
3. **OS opens Zero Wallet**: The mobile device triggers the Zero Wallet app and passes the payload.
4. **User approves in app**: The user sees the transaction UI in Zero Wallet and taps "Approve" (signing securely with local keys).
5. **App redirects back**: Zero Wallet constructs the callback URL passed by the dApp, appending the signed data or public key, and opens it.
6. **Adapter resolves**: The adapter code waiting for the callback completes the Promise and hands the signed data back to the dApp.

## Deep Link URL Scheme (For App Developers)

If you are developing the mobile app side of Zero Wallet, you must intercept the `zerowallet://` scheme and handle these routes:

### Connect
```
zerowallet://connect?callback=<callback_url>&id=<unique_id>
```
**Response Format (Appended to Callback URL):**
* Success: `<callback_url>?id=<id>&status=approved&publicKey=<base58>`
* Failure: `<callback_url>?id=<id>&status=rejected&error=User%20Cancelled`

### Sign Transaction
```
zerowallet://sign?tx=<base64_serialized_tx>&callback=<callback_url>&id=<id>&network=<mainnet-beta|devnet>
```
**Response Format:**
* Success: `<callback_url>?id=<id>&status=approved&signedTx=<base64_signed_tx>`

### Sign All Transactions
```
zerowallet://signAll?txs=<base64_array_of_txs>&callback=<callback_url>&id=<id>
```
**Response Format:**
* Success: `<callback_url>?id=<id>&status=approved&signedTxs=<base64_array_of_signed_txs>`

### Sign Message
```
zerowallet://signMessage?msg=<base64_message>&callback=<callback_url>&id=<id>
```
**Response Format:**
* Success: `<callback_url>?id=<id>&status=approved&signature=<base64_signature>`

## Troubleshooting

### Deep Links are not opening
* Ensure you are testing on a mobile device where Zero Wallet is installed. Desktop browsers without an extension wrapper will trigger a timeout.
* Check that your dApp's callback URL is valid and does not drop URL parameters on reload (often happens with heavily cached SPAs).

### Callback times out
* The default timeout is 120 seconds. If the user takes longer to approve within the app, the adapter will throw a `WalletTimeoutError`. Catch this error and prompt the user to try again.

## License

MIT
