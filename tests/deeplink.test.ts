import {
    buildConnectUrl,
    buildSignTransactionUrl,
    buildSignAllUrl,
    buildSignMessageUrl,
    waitForCallback,
    isMobile,
    parseCallbackParams
} from '../src/deeplink';
import { ZeroWalletTimeoutError } from '../src/errors';

describe('deeplink', () => {
    const callbackUrl = 'https://my-dapp.com/callback';
    const id = '1234567890abcdef';

    describe('URL Builders', () => {
        it('buildConnectUrl returns correct URL format', () => {
            const url = buildConnectUrl(callbackUrl, id);
            expect(url).toBe(`zerowallet://connect?callback=https%3A%2F%2Fmy-dapp.com%2Fcallback&id=${id}`);
        });

        it('buildSignTransactionUrl encodes transaction correctly', () => {
            const txBase64 = 'aGVsbG8='; // hello
            const url = buildSignTransactionUrl(txBase64, callbackUrl, id, 'devnet');
            expect(url).toBe(`zerowallet://sign?tx=aGVsbG8%3D&callback=https%3A%2F%2Fmy-dapp.com%2Fcallback&id=${id}&network=devnet`);
        });

        it('buildSignAllUrl encodes array correctly', () => {
            const txs = ['tx1', 'tx2'];
            const url = buildSignAllUrl(txs, callbackUrl, id);
            const expectedPayload = encodeURIComponent(JSON.stringify(txs));
            expect(url).toBe(`zerowallet://signAll?txs=${expectedPayload}&callback=https%3A%2F%2Fmy-dapp.com%2Fcallback&id=${id}&network=mainnet-beta`);
        });

        it('buildSignMessageUrl encodes message correctly', () => {
            const url = buildSignMessageUrl('bXNn', callbackUrl, id);
            expect(url).toBe(`zerowallet://signMessage?msg=bXNn&callback=https%3A%2F%2Fmy-dapp.com%2Fcallback&id=${id}`);
        });
    });

    describe('waitForCallback', () => {
        let originalWindow: any;

        beforeEach(() => {
            jest.useFakeTimers();
            originalWindow = global.window;
            global.window = {
                location: {
                    search: ''
                }
            } as any;
        });

        afterEach(() => {
            jest.useRealTimers();
            global.window = originalWindow;
        });

        it('resolves when callback received', async () => {
            const waitPromise = waitForCallback(id, 5000);

            // Advance time a bit and set the window search
            jest.advanceTimersByTime(1500);
            global.window.location.search = `?id=${id}&status=approved`;

            // trigger next check
            jest.advanceTimersByTime(1000);

            const params = await waitPromise;
            expect(params.get('id')).toBe(id);
            expect(params.get('status')).toBe('approved');
        });

        it('rejects on timeout', async () => {
            const waitPromise = waitForCallback(id, 2000);

            // Advance time past timeout without ever setting window search
            jest.advanceTimersByTime(2500);

            await expect(waitPromise).rejects.toThrow(ZeroWalletTimeoutError);
        });
    });

    describe('parseCallbackParams', () => {
        it('parses connect approved', () => {
            const params = new URLSearchParams(`?id=${id}&status=approved&publicKey=1111`);
            const parsed = parseCallbackParams(params);

            expect(parsed.id).toBe(id);
            expect(parsed.status).toBe('approved');
            expect(parsed.publicKey).toBe('1111');
        });

        it('parses rejection', () => {
            const params = new URLSearchParams(`?id=${id}&status=rejected&error=User%20cancelled`);
            const parsed = parseCallbackParams(params);

            expect(parsed.id).toBe(id);
            expect(parsed.status).toBe('rejected');
            expect(parsed.error).toBe('User cancelled');
        });
    });
});
