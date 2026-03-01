import { WalletError } from '@solana/wallet-adapter-base';

export class ZeroWalletNotInstalledError extends WalletError {
    name = 'ZeroWalletNotInstalledError';
}

export class ZeroWalletConnectionError extends WalletError {
    name = 'ZeroWalletConnectionError';
}

export class ZeroWalletUserRejectionError extends WalletError {
    name = 'ZeroWalletUserRejectionError';
}

export class ZeroWalletSignTransactionError extends WalletError {
    name = 'ZeroWalletSignTransactionError';
}

export class ZeroWalletSignMessageError extends WalletError {
    name = 'ZeroWalletSignMessageError';
}

export class ZeroWalletTimeoutError extends WalletError {
    name = 'ZeroWalletTimeoutError';
}
