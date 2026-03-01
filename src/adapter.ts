import {
    BaseMessageSignerWalletAdapter,
    EventEmitter,
    WalletName,
    WalletReadyState,
    WalletSignTransactionError,
    WalletSignMessageError,
    WalletConnectionError,
    WalletDisconnectedError,
    WalletTimeoutError
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import {
    ZeroWalletAdapterConfig,
    ConnectCallbackParams,
    SignCallbackParams
} from './types';
import {
    ZeroWalletNotInstalledError,
    ZeroWalletConnectionError,
    ZeroWalletUserRejectionError,
    ZeroWalletSignTransactionError,
    ZeroWalletSignMessageError,
    ZeroWalletTimeoutError
} from './errors';
import {
    buildConnectUrl,
    buildSignMessageUrl,
    buildSignTransactionUrl,
    buildSignAllUrl,
    isMobile,
    isZeroWalletInstalled,
    openDeepLink,
    waitForCallback,
    parseCallbackParams
} from './deeplink';
import {
    generateCallbackId,
    serializeTransaction,
    deserializeTransaction,
    serializeMessage,
    deserializeSignature
} from './utils';
import bs58 from 'bs58';

export const ZeroWalletName = 'Zero Wallet' as WalletName<'Zero Wallet'>;

// Simple clean SVG icon base64 encoded
export const ZeroWalletIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTE2LjUgNy41QzE2Ljc1IDcuNSA5IDIwIDkuNSAyMEw3LjUgMTYuNUM3LjI1IDE2LjUgMTUgNCAxNC41IDRMMTYuNSA3LjVaIiBmaWxsPSJibGFjayIvPjwvc3ZnPg==';

export interface ZeroWalletAdapterEvents {
    connect(publicKey: PublicKey): void;
    disconnect(): void;
    error(error: any): void;
}

export class ZeroWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = ZeroWalletName;
    url = 'https://zerowallet.app';
    icon = ZeroWalletIcon;
    supportedTransactionVersions = new Set(['legacy', 0] as const);

    private _connecting: boolean;
    private _wallet: any | null; // For standard injected wallet if applicable
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState;
    private _config: ZeroWalletAdapterConfig;

    constructor(config: ZeroWalletAdapterConfig = {}) {
        super();
        this._config = {
            network: config.network || 'mainnet-beta',
            timeoutMs: config.timeoutMs || 120000,
            callbackUrl: config.callbackUrl || (typeof window !== 'undefined' ? window.location.href : '')
        };
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        this._readyState = WalletReadyState.Unsupported;

        // Determine ready state
        if (typeof window !== 'undefined') {
            if (isMobile()) {
                // On mobile we consider it installed/loadable via deep links
                this._readyState = isZeroWalletInstalled() ? WalletReadyState.Installed : WalletReadyState.Loadable;
            } else if (isZeroWalletInstalled()) {
                this._readyState = WalletReadyState.Installed;
            } else {
                this._readyState = WalletReadyState.Loadable; // Fallback to QR / WalletConnect eventually
            }
        }

        // Try to recover session from local storage
        if (typeof window !== 'undefined') {
            try {
                const storedKey = localStorage.getItem('zerowallet_pubkey');
                if (storedKey) {
                    this._publicKey = new PublicKey(storedKey);
                    // Emit connect on next tick so listeners have time to attach
                    setTimeout(() => {
                        if (this._publicKey) this.emit('connect', this._publicKey);
                    }, 0);
                }
            } catch (e) {
                // Ignore storage errors
            }
        }
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get connecting(): boolean {
        return this._connecting;
    }

    get readyState(): WalletReadyState {
        return this._readyState;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;

            if (this._readyState !== WalletReadyState.Installed && this._readyState !== WalletReadyState.Loadable) {
                throw new ZeroWalletNotInstalledError();
            }

            this._connecting = true;

            const id = generateCallbackId();
            const deepLinkUrl = buildConnectUrl(this._config.callbackUrl!, id);

            openDeepLink(deepLinkUrl);

            try {
                // Wait for the app to redirect back with the params
                const params = await waitForCallback(id, this._config.timeoutMs);
                const parsed = parseCallbackParams(params) as ConnectCallbackParams;

                if (parsed.status === 'rejected') {
                    throw new ZeroWalletUserRejectionError(parsed.error || 'User rejected the connection request.');
                }

                if (!parsed.publicKey) {
                    throw new ZeroWalletConnectionError('No public key returned from wallet.');
                }

                this._publicKey = new PublicKey(parsed.publicKey);

                // Save session
                if (typeof window !== 'undefined') {
                    localStorage.setItem('zerowallet_pubkey', this._publicKey.toBase58());
                }

                this.emit('connect', this._publicKey);
            } catch (e: any) {
                if (e instanceof ZeroWalletTimeoutError) {
                    throw new WalletTimeoutError(e?.message, e);
                }
                throw e; // rethrow mapping error
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        this._publicKey = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('zerowallet_pubkey');
        }
        this.emit('disconnect');
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        try {
            if (!this.connected) throw new WalletDisconnectedError();

            const id = generateCallbackId();
            const serialized = serializeTransaction(transaction);
            const url = buildSignTransactionUrl(serialized, this._config.callbackUrl!, id, this._config.network);

            openDeepLink(url);

            const params = await waitForCallback(id, this._config.timeoutMs);
            const parsed = parseCallbackParams(params) as SignCallbackParams;

            if (parsed.status === 'rejected') {
                throw new ZeroWalletUserRejectionError(parsed.error || 'User rejected signature.');
            }

            if (!parsed.signedTx) {
                throw new ZeroWalletSignTransactionError('No signed transaction returned.');
            }

            return deserializeTransaction(parsed.signedTx) as T;
        } catch (error: any) {
            this.emit('error', error);
            if (error instanceof ZeroWalletTimeoutError) {
                throw new WalletTimeoutError(error?.message, error);
            }
            throw new WalletSignTransactionError(error?.message, error);
        }
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        try {
            if (!this.connected) throw new WalletDisconnectedError();

            const id = generateCallbackId();
            const serializedTxs = transactions.map((t: T) => serializeTransaction(t));
            const url = buildSignAllUrl(serializedTxs, this._config.callbackUrl!, id, this._config.network);

            openDeepLink(url);

            const params = await waitForCallback(id, this._config.timeoutMs);
            const parsed = parseCallbackParams(params) as SignCallbackParams;

            if (parsed.status === 'rejected') {
                throw new ZeroWalletUserRejectionError(parsed.error || 'User rejected signature.');
            }

            if (!parsed.signedTxs || parsed.signedTxs.length !== transactions.length) {
                throw new ZeroWalletSignTransactionError('Invalid number of signed transactions returned.');
            }

            return parsed.signedTxs.map(t => deserializeTransaction(t) as T);
        } catch (error: any) {
            this.emit('error', error);
            if (error instanceof ZeroWalletTimeoutError) {
                throw new WalletTimeoutError(error?.message, error);
            }
            throw new WalletSignTransactionError(error?.message, error);
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            if (!this.connected || !this.publicKey) throw new WalletDisconnectedError();

            const id = generateCallbackId();
            const serializedMessage = serializeMessage(message);
            const url = buildSignMessageUrl(serializedMessage, this._config.callbackUrl!, id);

            openDeepLink(url);

            const params = await waitForCallback(id, this._config.timeoutMs);
            const parsed = parseCallbackParams(params) as SignCallbackParams;

            if (parsed.status === 'rejected') {
                throw new ZeroWalletUserRejectionError(parsed.error || 'User rejected signature.');
            }

            if (!parsed.signature) {
                throw new ZeroWalletSignMessageError('No signature returned.');
            }

            return deserializeSignature(parsed.signature);
        } catch (error: any) {
            this.emit('error', error);
            if (error instanceof ZeroWalletTimeoutError) {
                throw new WalletTimeoutError(error?.message, error);
            }
            throw new WalletSignMessageError(error?.message, error);
        }
    }
}
