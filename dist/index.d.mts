import * as _solana_wallet_adapter_base from '@solana/wallet-adapter-base';
import { BaseMessageSignerWalletAdapter, WalletName, WalletReadyState, WalletError } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { SolanaSignTransactionFeature, SolanaSignAndSendTransactionFeature, SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import { WalletAccount, Wallet, WalletIcon } from '@wallet-standard/core';
import { StandardConnectFeature, StandardDisconnectFeature, StandardEventsFeature } from '@wallet-standard/features';

interface ZeroWalletWindow extends Window {
    zerowallet?: {
        isZeroWallet?: boolean;
    };
}
interface ConnectResponse {
    publicKey: string;
}
interface SignTransactionResponse {
    signedTransaction: string;
}
interface SignAllTransactionsResponse {
    signedTransactions: string[];
}
interface SignMessageResponse {
    signature: string;
}
interface DeepLinkCallbackParams {
    id: string;
    status: 'approved' | 'rejected';
    error?: string;
}
interface ConnectCallbackParams extends DeepLinkCallbackParams {
    publicKey?: string;
}
interface SignCallbackParams extends DeepLinkCallbackParams {
    signedTx?: string;
    signedTxs?: string[];
    signature?: string;
}
interface ZeroWalletAdapterConfig {
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

declare const ZeroWalletName: WalletName<"Zero Wallet">;
declare const ZeroWalletIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTE2LjUgNy41QzE2Ljc1IDcuNSA5IDIwIDkuNSAyMEw3LjUgMTYuNUM3LjI1IDE2LjUgMTUgNCAxNC41IDRMMTYuNSA3LjVaIiBmaWxsPSJibGFjayIvPjwvc3ZnPg==";
interface ZeroWalletAdapterEvents {
    connect(publicKey: PublicKey): void;
    disconnect(): void;
    error(error: any): void;
}
declare class ZeroWalletAdapter extends BaseMessageSignerWalletAdapter {
    name: WalletName<"Zero Wallet">;
    url: string;
    icon: string;
    supportedTransactionVersions: Set<0 | "legacy">;
    private _connecting;
    private _wallet;
    private _publicKey;
    private _readyState;
    private _config;
    constructor(config?: ZeroWalletAdapterConfig);
    get publicKey(): PublicKey | null;
    get connecting(): boolean;
    get readyState(): WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
}

/**
 * Builds the URL to connect to the Zero Wallet mobile app deep link.
 */
declare function buildConnectUrl(callbackUrl: string, id: string): string;
/**
 * Builds the deep link URL to request signing a single transaction.
 */
declare function buildSignTransactionUrl(serializedTxBase64: string, callbackUrl: string, id: string, network?: string): string;
/**
 * Builds the deep link URL to request signing multiple transactions.
 */
declare function buildSignAllUrl(serializedTxsBase64: string[], callbackUrl: string, id: string, network?: string): string;
/**
 * Builds the deep link URL to request signing a raw message.
 */
declare function buildSignMessageUrl(messageBase64: string, callbackUrl: string, id: string): string;
/**
 * Attempts to open the deep link using window.location.href.
 */
declare function openDeepLink(url: string): void;
/**
 * Detects if the current user agent is mobile.
 */
declare function isMobile(): boolean;
/**
 * Checks for the presence of the Zero Wallet browser extension (or injected provider wrapper if present).
 * Currently always returns false conceptually via deep links, but standardizes the check.
 */
declare function isZeroWalletInstalled(): boolean;
/**
 * Waits for a callback matching the provided request ID.
 * Since redirect callbacks typically reload the page, if you are a SPA you must register this listener
 * or catch it on boot in the adapter itself.
 *
 * For in-app browser or local state preservation, we listen to the hashchange/search params.
 */
declare function waitForCallback(expectedId: string, timeoutMs?: number): Promise<URLSearchParams>;
/**
 * Parses callback URL SearchParams into typed parameters.
 */
declare function parseCallbackParams(params: URLSearchParams): ConnectCallbackParams | SignCallbackParams;

declare class ZeroWalletNotInstalledError extends WalletError {
    name: string;
}
declare class ZeroWalletConnectionError extends WalletError {
    name: string;
}
declare class ZeroWalletUserRejectionError extends WalletError {
    name: string;
}
declare class ZeroWalletSignTransactionError extends WalletError {
    name: string;
}
declare class ZeroWalletSignMessageError extends WalletError {
    name: string;
}
declare class ZeroWalletTimeoutError extends WalletError {
    name: string;
}

/**
 * Serializes a transaction (legacy or versioned) to a base64 encoded string.
 */
declare function serializeTransaction(tx: Transaction | VersionedTransaction): string;
/**
 * Deserializes a base64 encoded transaction back into a Transaction or VersionedTransaction.
 */
declare function deserializeTransaction(serializedTxBase64: string): Transaction | VersionedTransaction;
/**
 * Serializes a raw message Uint8Array to base64.
 */
declare function serializeMessage(message: Uint8Array): string;
/**
 * Deserializes a base64 signature back to Uint8Array.
 */
declare function deserializeSignature(signatureBase64: string): Uint8Array;
/**
 * Converts a Uint8Array to a base64 string.
 */
declare function encodeBase64(data: Uint8Array): string;
/**
 * Converts a base64 string to a Uint8Array.
 */
declare function decodeBase64(data: string): Uint8Array;
/**
 * Generates a unique 16 character hex string for tracking deep link requests.
 */
declare function generateCallbackId(): string;
/**
 * Detects if the current environment is a mobile device via User-Agent.
 */
declare function isMobileDevice(): boolean;
declare function isIOS(): boolean;
declare function isAndroid(): boolean;

interface ZeroWalletWindowStandard extends Window {
    zerowallet?: {
        isZeroWallet?: boolean;
    };
}
type ZeroWalletFeature = StandardConnectFeature & StandardDisconnectFeature & StandardEventsFeature & SolanaSignTransactionFeature & SolanaSignAndSendTransactionFeature & SolanaSignMessageFeature;
declare class ZeroWalletStandardWallet implements Wallet {
    #private;
    get version(): "1.0.0";
    get name(): _solana_wallet_adapter_base.WalletName<"Zero Wallet">;
    get icon(): WalletIcon;
    get chains(): readonly ["solana:mainnet", "solana:devnet", "solana:testnet"];
    get features(): ZeroWalletFeature;
    get accounts(): ZeroWalletStandardAccount[];
    constructor(adapter: ZeroWalletAdapter);
}
declare class ZeroWalletStandardAccount implements WalletAccount {
    #private;
    get address(): string;
    get publicKey(): Uint8Array<ArrayBufferLike>;
    get chains(): readonly ["solana:mainnet", "solana:devnet", "solana:testnet"];
    get features(): readonly ["solana:signTransaction", "solana:signAndSendTransaction", "solana:signMessage"];
    constructor(publicKey: PublicKey);
}
/**
 * Registers the ZeroWallet in the Wallet Standard modal ecosystem.
 */
declare function registerWalletStandard(adapter: ZeroWalletAdapter): void;

export { type ConnectCallbackParams, type ConnectResponse, type DeepLinkCallbackParams, type SignAllTransactionsResponse, type SignCallbackParams, type SignMessageResponse, type SignTransactionResponse, ZeroWalletAdapter, type ZeroWalletAdapterConfig, type ZeroWalletAdapterEvents, ZeroWalletConnectionError, type ZeroWalletFeature, ZeroWalletIcon, ZeroWalletName, ZeroWalletNotInstalledError, ZeroWalletSignMessageError, ZeroWalletSignTransactionError, ZeroWalletStandardAccount, ZeroWalletStandardWallet, ZeroWalletTimeoutError, ZeroWalletUserRejectionError, type ZeroWalletWindow, type ZeroWalletWindowStandard, buildConnectUrl, buildSignAllUrl, buildSignMessageUrl, buildSignTransactionUrl, decodeBase64, deserializeSignature, deserializeTransaction, encodeBase64, generateCallbackId, isAndroid, isIOS, isMobile, isMobileDevice, isZeroWalletInstalled, openDeepLink, parseCallbackParams, registerWalletStandard, serializeMessage, serializeTransaction, waitForCallback };
