import { serializeTransaction, deserializeTransaction, encodeBase64, decodeBase64, isMobileDevice, isIOS, isAndroid } from '../src/utils';
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';

describe('utils', () => {

    describe('Base64 Encoding/Decoding', () => {
        it('encodeBase64 and decodeBase64 are inverse operations', () => {
            const originalData = new Uint8Array([1, 2, 3, 255, 128, 0, 42]);
            const encoded = encodeBase64(originalData);
            expect(typeof encoded).toBe('string');

            const decoded = decodeBase64(encoded);
            expect(decoded).toEqual(originalData);
        });

        it('handles strings properly', () => {
            const str = 'hello world';
            const bytes = new Uint8Array(Buffer.from(str));
            const encoded = encodeBase64(bytes);
            expect(encoded).toBe('aGVsbG8gd29ybGQ=');

            const decoded = decodeBase64(encoded);
            expect(Buffer.from(decoded).toString()).toBe(str);
        });
    });

    describe('Transaction Serialization', () => {
        it('serializeTransaction generates a base64 string for legacy tx', () => {
            const tx = new Transaction();
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey('11111111111111111111111111111111'),
                    toPubkey: new PublicKey('22222222222222222222222222222222'),
                    lamports: 1000,
                })
            );
            tx.recentBlockhash = '11111111111111111111111111111111';
            tx.feePayer = new PublicKey('11111111111111111111111111111111');

            const serialized = serializeTransaction(tx);
            expect(typeof serialized).toBe('string');
            expect(serialized.length).toBeGreaterThan(0);
        });

        it('deserializeTransaction round-trips correctly for legacy tx', () => {
            const tx = new Transaction();
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey('11111111111111111111111111111111'),
                    toPubkey: new PublicKey('22222222222222222222222222222222'),
                    lamports: 5000,
                })
            );
            tx.recentBlockhash = '11111111111111111111111111111111';
            tx.feePayer = new PublicKey('11111111111111111111111111111111');

            const serialized = serializeTransaction(tx);
            const deserialized = deserializeTransaction(serialized) as Transaction;

            expect(deserialized).toBeInstanceOf(Transaction);
            expect(deserialized.feePayer?.toBase58()).toBe(tx.feePayer?.toBase58());
            expect(deserialized.recentBlockhash).toBe(tx.recentBlockhash);
            expect(deserialized.instructions.length).toBe(1);
        });
    });

});
