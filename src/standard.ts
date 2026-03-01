import { SolanaSignAndSendTransactionFeature, SolanaSignAndSendTransactionMethod, SolanaSignMessageFeature, SolanaSignMessageMethod, SolanaSignTransactionFeature, SolanaSignTransactionMethod } from '@solana/wallet-standard-features';
import { Wallet, WalletAccount, WalletIcon } from '@wallet-standard/core';
import { ZeroWalletAdapter, ZeroWalletIcon, ZeroWalletName } from './adapter';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { StandardConnectFeature, StandardConnectMethod, StandardDisconnectFeature, StandardDisconnectMethod, StandardEventsFeature, StandardEventsListeners, StandardEventsNames, StandardEventsOnMethod } from '@wallet-standard/features';

export interface ZeroWalletWindowStandard extends Window {
    zerowallet?: {
        isZeroWallet?: boolean;
    };
}

export type ZeroWalletFeature = StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SolanaSignTransactionFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignMessageFeature;

export class ZeroWalletStandardWallet implements Wallet {
    readonly #adapter: ZeroWalletAdapter;
    readonly #listeners: { [E in StandardEventsNames]?: StandardEventsListeners[E][] } = {};
    readonly #version = '1.0.0' as const;

    get version() {
        return this.#version;
    }

    get name() {
        return ZeroWalletName;
    }

    get icon(): WalletIcon {
        return ZeroWalletIcon as WalletIcon;
    }

    get chains() {
        return ['solana:mainnet', 'solana:devnet', 'solana:testnet'] as const;
    }

    get features(): ZeroWalletFeature {
        return {
            'standard:connect': {
                version: '1.0.0',
                connect: this.#connect,
            },
            'standard:disconnect': {
                version: '1.0.0',
                disconnect: this.#disconnect,
            },
            'standard:events': {
                version: '1.0.0',
                on: this.#on,
            },
            'solana:signTransaction': {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signTransaction: this.#signTransaction,
            },
            'solana:signAndSendTransaction': {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: this.#signAndSendTransaction,
            },
            'solana:signMessage': {
                version: '1.0.0',
                signMessage: this.#signMessage,
            },
        };
    }

    get accounts() {
        return this.#adapter.publicKey ? [new ZeroWalletStandardAccount(this.#adapter.publicKey)] : [];
    }

    constructor(adapter: ZeroWalletAdapter) {
        this.#adapter = adapter;
        this.#adapter.on('connect', this.#emit.bind(this, 'change', { accounts: this.accounts }));
        this.#adapter.on('disconnect', this.#emit.bind(this, 'change', { accounts: this.accounts }));
    }

    #connect: StandardConnectMethod = async ({ silent } = {}) => {
        if (!this.#adapter.connected) {
            await this.#adapter.connect();
        }
        return { accounts: this.accounts };
    };

    #disconnect: StandardDisconnectMethod = async () => {
        await this.#adapter.disconnect();
    };

    #on: StandardEventsOnMethod = (event, listener) => {
        this.#listeners[event]?.push(listener) || (this.#listeners[event] = [listener]);
        return (): void => this.#off(event, listener);
    };

    #emit<E extends StandardEventsNames>(event: E, ...args: Parameters<StandardEventsListeners[E]>): void {
        // eslint-disable-next-line prefer-spread
        this.#listeners[event]?.forEach((listener) => listener.apply(null, args));
    }

    #off<E extends StandardEventsNames>(event: E, listener: StandardEventsListeners[E]): void {
        this.#listeners[event] = this.#listeners[event]?.filter((existingListener) => listener !== existingListener);
    }

    #signTransaction: SolanaSignTransactionMethod = async (...inputs) => {
        if (!this.#adapter.connected) throw new Error('Not connected');
        const signedTxs = [];
        for (const input of inputs) {
            const tx = Transaction.from(input.transaction); // Using legacy for simplicity in standard adapter interface as fallback
            const signed = await this.#adapter.signTransaction(tx);
            signedTxs.push({ signedTransaction: signed.serialize() });
        }
        return signedTxs;
    };

    #signAndSendTransaction: SolanaSignAndSendTransactionMethod = async (...inputs) => {
        if (!this.#adapter.connected) throw new Error('Not connected');
        throw new Error('signAndSendTransaction not fully implemented in standard adapter wrapper for Zero Wallet deep link yet.');
    };

    #signMessage: SolanaSignMessageMethod = async (...inputs) => {
        if (!this.#adapter.connected) throw new Error('Not connected');
        const signatures = [];
        for (const input of inputs) {
            const signature = await this.#adapter.signMessage(input.message);
            signatures.push({ signedMessage: input.message, signature });
        }
        return signatures;
    };
}

export class ZeroWalletStandardAccount implements WalletAccount {
    readonly #publicKey: PublicKey;

    get address() {
        return this.#publicKey.toBase58();
    }

    get publicKey() {
        return this.#publicKey.toBytes();
    }

    get chains() {
        return ['solana:mainnet', 'solana:devnet', 'solana:testnet'] as const;
    }

    get features() {
        return ['solana:signTransaction', 'solana:signAndSendTransaction', 'solana:signMessage'] as const;
    }

    constructor(publicKey: PublicKey) {
        this.#publicKey = publicKey;
    }
}

/**
 * Registers the ZeroWallet in the Wallet Standard modal ecosystem.
 */
export function registerWalletStandard(adapter: ZeroWalletAdapter): void {
    if (typeof window === 'undefined') return;

    try {
        const wallet = new ZeroWalletStandardWallet(adapter);
        const { registerWallet } = require('@wallet-standard/wallet') as typeof import('@wallet-standard/wallet');
        registerWallet(wallet);
    } catch (error) {
        console.error('ZeroWallet: Failed to register wallet standard', error);
    }
}
