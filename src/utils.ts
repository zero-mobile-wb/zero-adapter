import { Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Serializes a transaction (legacy or versioned) to a base64 encoded string.
 */
export function serializeTransaction(tx: Transaction | VersionedTransaction): string {
    if ('version' in tx) {
        // Versioned transaction
        return encodeBase64(tx.serialize());
    } else {
        // Legacy transaction.
        // Needs recentBlockhash and feePayer before serialize, but typically dApp provides this
        // Use requireAllSignatures: false if the wallet still needs to add signatures
        return encodeBase64(tx.serialize({ requireAllSignatures: false }));
    }
}

/**
 * Deserializes a base64 encoded transaction back into a Transaction or VersionedTransaction.
 */
export function deserializeTransaction(serializedTxBase64: string): Transaction | VersionedTransaction {
    const buffer = decodeBase64(serializedTxBase64);
    try {
        // Attempt versioned transaction parsing
        return VersionedTransaction.deserialize(buffer);
    } catch (e) {
        // Fallback to legacy
        return Transaction.from(buffer);
    }
}

/**
 * Serializes a raw message Uint8Array to base64.
 */
export function serializeMessage(message: Uint8Array): string {
    return encodeBase64(message);
}

/**
 * Deserializes a base64 signature back to Uint8Array.
 */
export function deserializeSignature(signatureBase64: string): Uint8Array {
    return decodeBase64(signatureBase64);
}

/**
 * Converts a Uint8Array to a base64 string.
 */
export function encodeBase64(data: Uint8Array): string {
    if (typeof btoa !== 'undefined') {
        const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join('');
        return btoa(binString);
    }
    const BufferLocal = (typeof globalThis !== 'undefined' ? globalThis : global) as any;
    return BufferLocal.Buffer.from(data).toString('base64');
}

/**
 * Converts a base64 string to a Uint8Array.
 */
export function decodeBase64(data: string): Uint8Array {
    if (typeof atob !== 'undefined') {
        const binString = atob(data);
        return new Uint8Array(binString.split('').map((char) => char.charCodeAt(0)));
    }
    const BufferLocal = (typeof globalThis !== 'undefined' ? globalThis : global) as any;
    return new Uint8Array(BufferLocal.Buffer.from(data, 'base64'));
}

/**
 * Generates a unique 16 character hex string for tracking deep link requests.
 */
export function generateCallbackId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Detects if the current environment is a mobile device via User-Agent.
 */
export function isMobileDevice(): boolean {
    if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
    if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
    if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
    return /Android/i.test(navigator.userAgent);
}
