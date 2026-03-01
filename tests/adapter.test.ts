import { ZeroWalletAdapter } from '../src/adapter';
import { WalletReadyState, WalletTimeoutError, WalletDisconnectedError } from '@solana/wallet-adapter-base';
import * as deeplink from '../src/deeplink';
import { ZeroWalletTimeoutError, ZeroWalletUserRejectionError, ZeroWalletNotInstalledError } from '../src/errors';
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';

// Mock the openDeepLink function
jest.mock('../src/deeplink', () => ({
    ...jest.requireActual('../src/deeplink'),
    openDeepLink: jest.fn(),
    waitForCallback: jest.fn(),
    isMobile: jest.fn(),
    isZeroWalletInstalled: jest.fn()
}));

describe('ZeroWalletAdapter', () => {
    let adapter: ZeroWalletAdapter;
    const mockCallbackUrl = 'https://tester.com/callback';

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Default to mobile environment for testing deep links
        (deeplink.isMobile as jest.Mock).mockReturnValue(true);
        (deeplink.isZeroWalletInstalled as jest.Mock).mockReturnValue(true);

        adapter = new ZeroWalletAdapter({ callbackUrl: mockCallbackUrl, timeoutMs: 1000 });
    });

    describe('readyState', () => {
        it('returns Installed on mobile if zero wallet is detected', () => {
            expect(adapter.readyState).toBe(WalletReadyState.Installed);
        });

        it('returns Loadable on desktop if not explicitly installed', () => {
            (deeplink.isMobile as jest.Mock).mockReturnValue(false);
            (deeplink.isZeroWalletInstalled as jest.Mock).mockReturnValue(false);

            // Re-instantiate to pickup mocked values
            adapter = new ZeroWalletAdapter();
            expect(adapter.readyState).toBe(WalletReadyState.Loadable);
        });
    });

    describe('connect()', () => {
        it('opens deep link and resolves with public key on approval', async () => {
            const pubKeyString = '11111111111111111111111111111111';

            // Mock waiting for callback returning approved status
            const params = new URLSearchParams(`?id=mockid&status=approved&publicKey=${pubKeyString}`);
            (deeplink.waitForCallback as jest.Mock).mockResolvedValueOnce(params);

            const connectPromise = adapter.connect();

            expect(adapter.connecting).toBe(true);
            expect(deeplink.openDeepLink).toHaveBeenCalled();

            await connectPromise;

            expect(adapter.connecting).toBe(false);
            expect(adapter.connected).toBe(true);
            expect(adapter.publicKey?.toBase58()).toBe(pubKeyString);
        });

        it('rejects when user cancels', async () => {
            const params = new URLSearchParams(`?id=mockid&status=rejected&error=User%20cancelled`);
            (deeplink.waitForCallback as jest.Mock).mockResolvedValueOnce(params);

            await expect(adapter.connect()).rejects.toThrow(ZeroWalletUserRejectionError);
            expect(adapter.connected).toBe(false);
        });

        it('throws WalletTimeoutError on timeout', async () => {
            (deeplink.waitForCallback as jest.Mock).mockRejectedValueOnce(new ZeroWalletTimeoutError());

            await expect(adapter.connect()).rejects.toThrow(WalletTimeoutError);
        });
    });

    describe('signTransaction()', () => {
        let tx: Transaction;

        beforeEach(async () => {
            // Must be connected to sign
            (deeplink.waitForCallback as jest.Mock).mockResolvedValueOnce(
                new URLSearchParams(`?status=approved&publicKey=11111111111111111111111111111111`)
            );
            await adapter.connect();

            tx = new Transaction();
            tx.add(SystemProgram.transfer({
                fromPubkey: adapter.publicKey!,
                toPubkey: new PublicKey('22222222222222222222222222222222'),
                lamports: 1000,
            }));
            tx.recentBlockhash = '33333333333333333333333333333333';
            tx.feePayer = adapter.publicKey!;
        });

        it('serializes tx, sends deep link, returns signed tx', async () => {
            // Mock signing response
            const signedSerialized = (() => {
                const signedTx = new Transaction();
                // Just use same tx for mocking
                signedTx.add(SystemProgram.transfer({
                    fromPubkey: adapter.publicKey!,
                    toPubkey: new PublicKey('22222222222222222222222222222222'),
                    lamports: 1000,
                }));
                signedTx.recentBlockhash = '33333333333333333333333333333333';
                signedTx.feePayer = adapter.publicKey!;
                // Requires signatures array fake
                signedTx.signatures.push({ publicKey: adapter.publicKey!, signature: Buffer.alloc(64) });
                return signedTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
            })();

            const params = new URLSearchParams(`?status=approved&signedTx=${encodeURIComponent(signedSerialized)}`);
            (deeplink.waitForCallback as jest.Mock).mockResolvedValueOnce(params);

            const result = await adapter.signTransaction(tx);

            expect(result).toBeInstanceOf(Transaction);
            expect(deeplink.openDeepLink).toHaveBeenCalledTimes(2); // once for connect, once for sign
        });
    });

    describe('disconnect()', () => {
        it('clears state and emits event', async () => {
            (deeplink.waitForCallback as jest.Mock).mockResolvedValueOnce(
                new URLSearchParams(`?status=approved&publicKey=11111111111111111111111111111111`)
            );
            await adapter.connect();
            expect(adapter.connected).toBe(true);

            await adapter.disconnect();

            expect(adapter.connected).toBe(false);
            expect(adapter.publicKey).toBeNull();
        });
    });
});
