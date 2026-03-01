import { ZeroWalletTimeoutError } from './errors';
import { ConnectCallbackParams, SignCallbackParams } from './types';
import { generateCallbackId, isMobileDevice } from './utils';

const ZERO_WALLET_SCHEME = 'zerowallet://';

/**
 * Builds the URL to connect to the Zero Wallet mobile app deep link.
 */
export function buildConnectUrl(callbackUrl: string, id: string): string {
    return `${ZERO_WALLET_SCHEME}connect?callback=${encodeURIComponent(callbackUrl)}&id=${id}`;
}

/**
 * Builds the deep link URL to request signing a single transaction.
 */
export function buildSignTransactionUrl(serializedTxBase64: string, callbackUrl: string, id: string, network: string = 'mainnet-beta'): string {
    return `${ZERO_WALLET_SCHEME}sign?tx=${encodeURIComponent(serializedTxBase64)}&callback=${encodeURIComponent(callbackUrl)}&id=${id}&network=${network}`;
}

/**
 * Builds the deep link URL to request signing multiple transactions.
 */
export function buildSignAllUrl(serializedTxsBase64: string[], callbackUrl: string, id: string, network: string = 'mainnet-beta'): string {
    const serializedPayload = JSON.stringify(serializedTxsBase64); // JSON array of base64 strings
    return `${ZERO_WALLET_SCHEME}signAll?txs=${encodeURIComponent(serializedPayload)}&callback=${encodeURIComponent(callbackUrl)}&id=${id}&network=${network}`;
}

/**
 * Builds the deep link URL to request signing a raw message.
 */
export function buildSignMessageUrl(messageBase64: string, callbackUrl: string, id: string): string {
    return `${ZERO_WALLET_SCHEME}signMessage?msg=${encodeURIComponent(messageBase64)}&callback=${encodeURIComponent(callbackUrl)}&id=${id}`;
}

/**
 * Attempts to open the deep link using window.location.href.
 */
export function openDeepLink(url: string): void {
    if (typeof window !== 'undefined') {
        window.location.href = url;
    }
}

/**
 * Detects if the current user agent is mobile.
 */
export function isMobile(): boolean {
    return isMobileDevice();
}

/**
 * Checks for the presence of the Zero Wallet browser extension (or injected provider wrapper if present).
 * Currently always returns false conceptually via deep links, but standardizes the check.
 */
export function isZeroWalletInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).zerowallet?.isZeroWallet;
}

/**
 * Waits for a callback matching the provided request ID.
 * Since redirect callbacks typically reload the page, if you are a SPA you must register this listener
 * or catch it on boot in the adapter itself.
 * 
 * For in-app browser or local state preservation, we listen to the hashchange/search params.
 */
export function waitForCallback(
    expectedId: string,
    timeoutMs: number = 120000
): Promise<URLSearchParams> {
    return new Promise((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;

        // Note: For deep links, true "waiting" like this only works if the dApp is in a container
        // that handles the URL return without reloading, or uses a specific communication bridge.
        // For external browsers, the return callback will act as a page navigation to the dApp's callback URL.
        const checkUrl = () => {
            if (typeof window === 'undefined') return;
            const params = new URLSearchParams(window.location.search);
            if (params.get('id') === expectedId) {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
                resolve(params);
            }
        };

        const intervalId = setInterval(checkUrl, 1000); // Check every second
        checkUrl(); // check initially

        timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            reject(new ZeroWalletTimeoutError('Deep link response timed out.'));
        }, timeoutMs);
    });
}

/**
 * Parses callback URL SearchParams into typed parameters.
 */
export function parseCallbackParams(params: URLSearchParams): ConnectCallbackParams | SignCallbackParams {
    const id = params.get('id') || '';
    const status = (params.get('status') as 'approved' | 'rejected') || 'rejected';
    const error = params.get('error') || undefined;

    // Connect Params
    const publicKey = params.get('publicKey') || undefined;

    // Sign Params
    const signedTx = params.get('signedTx') || undefined;
    let signedTxs: string[] | undefined;
    try {
        const rawTxs = params.get('signedTxs');
        if (rawTxs) {
            signedTxs = JSON.parse(decodeURIComponent(rawTxs));
        }
    } catch (e) {
        console.error('Failed to parse signedTxs array', e);
    }
    const signature = params.get('signature') || undefined;

    return {
        id,
        status,
        error,
        publicKey,
        signedTx,
        signedTxs,
        signature
    };
}
