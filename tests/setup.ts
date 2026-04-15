// Jest setup file: polyfill TextEncoder/TextDecoder for JSDOM + @solana/web3.js compatibility
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder as any;
}
