export interface ZeroWalletWindow extends Window {
    zerowallet?: {
        isZeroWallet?: boolean;
    };
}

export interface ConnectResponse {
    publicKey: string;
}

export interface SignTransactionResponse {
    signedTransaction: string;
}

export interface SignAllTransactionsResponse {
    signedTransactions: string[];
}

export interface SignMessageResponse {
    signature: string;
}

// Params attached to the callback URL by the mobile app
export interface DeepLinkCallbackParams {
    id: string;
    status: 'approved' | 'rejected';
    error?: string; // Set when status is rejected
}

export interface ConnectCallbackParams extends DeepLinkCallbackParams {
    publicKey?: string; // Base58 encoded pulic key string (on success)
}

export interface SignCallbackParams extends DeepLinkCallbackParams {
    signedTx?: string; // Base64 encoded signed transaction
    signedTxs?: string[]; // Array of base64 encoded signed transactions
    signature?: string; // Base64 encoded signature
}

export interface ZeroWalletAdapterConfig {
    /**
     * Network cluster.
     */
    network?: 'mainnet-beta' | 'devnet' | 'testnet';
    /**
     * Timeout for deep link callbacks in milliseconds. Defaults to 120000 (2 minutes).
     */
    timeoutMs?: number;
    /**
     * The callback scheme/host your dApp is listening on. e.g., "my-dapp://callback"
     */
    callbackUrl?: string;
}
