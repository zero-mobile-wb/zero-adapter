import { WalletError, BaseMessageSignerWalletAdapter, WalletReadyState, WalletTimeoutError, WalletDisconnectedError, WalletSignTransactionError, WalletSignMessageError } from '@solana/wallet-adapter-base';
import { VersionedTransaction, Transaction, PublicKey } from '@solana/web3.js';

var __typeError = (msg) => {
  throw TypeError(msg);
};
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var ZeroWalletNotInstalledError = class extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "ZeroWalletNotInstalledError";
  }
};
var ZeroWalletConnectionError = class extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "ZeroWalletConnectionError";
  }
};
var ZeroWalletUserRejectionError = class extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "ZeroWalletUserRejectionError";
  }
};
var ZeroWalletSignTransactionError = class extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "ZeroWalletSignTransactionError";
  }
};
var ZeroWalletSignMessageError = class extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "ZeroWalletSignMessageError";
  }
};
var ZeroWalletTimeoutError = class extends WalletError {
  constructor() {
    super(...arguments);
    this.name = "ZeroWalletTimeoutError";
  }
};
function serializeTransaction(tx) {
  if ("version" in tx) {
    return encodeBase64(tx.serialize());
  } else {
    return encodeBase64(tx.serialize({ requireAllSignatures: false }));
  }
}
function deserializeTransaction(serializedTxBase64) {
  const buffer = decodeBase64(serializedTxBase64);
  try {
    return VersionedTransaction.deserialize(buffer);
  } catch (e) {
    return Transaction.from(buffer);
  }
}
function serializeMessage(message) {
  return encodeBase64(message);
}
function deserializeSignature(signatureBase64) {
  return decodeBase64(signatureBase64);
}
function encodeBase64(data) {
  if (typeof btoa !== "undefined") {
    const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
  }
  const BufferLocal = typeof globalThis !== "undefined" ? globalThis : global;
  return BufferLocal.Buffer.from(data).toString("base64");
}
function decodeBase64(data) {
  if (typeof atob !== "undefined") {
    const binString = atob(data);
    return new Uint8Array(binString.split("").map((char) => char.charCodeAt(0)));
  }
  const BufferLocal = typeof globalThis !== "undefined" ? globalThis : global;
  return new Uint8Array(BufferLocal.Buffer.from(data, "base64"));
}
function generateCallbackId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function isMobileDevice() {
  if (typeof navigator === "undefined" || !navigator.userAgent) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
function isIOS() {
  if (typeof navigator === "undefined" || !navigator.userAgent) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isAndroid() {
  if (typeof navigator === "undefined" || !navigator.userAgent) return false;
  return /Android/i.test(navigator.userAgent);
}

// src/deeplink.ts
var ZERO_WALLET_SCHEME = "zerowallet://";
function buildConnectUrl(callbackUrl, id, scheme = ZERO_WALLET_SCHEME) {
  return `${scheme}connect?callback=${encodeURIComponent(callbackUrl)}&id=${id}`;
}
function buildSignTransactionUrl(serializedTxBase64, callbackUrl, id, network = "mainnet-beta", scheme = ZERO_WALLET_SCHEME) {
  return `${scheme}sign?tx=${encodeURIComponent(serializedTxBase64)}&callback=${encodeURIComponent(callbackUrl)}&id=${id}&network=${network}`;
}
function buildSignAllUrl(serializedTxsBase64, callbackUrl, id, network = "mainnet-beta", scheme = ZERO_WALLET_SCHEME) {
  const serializedPayload = JSON.stringify(serializedTxsBase64);
  return `${scheme}signAll?txs=${encodeURIComponent(serializedPayload)}&callback=${encodeURIComponent(callbackUrl)}&id=${id}&network=${network}`;
}
function buildSignMessageUrl(messageBase64, callbackUrl, id, scheme = ZERO_WALLET_SCHEME) {
  return `${scheme}signMessage?msg=${encodeURIComponent(messageBase64)}&callback=${encodeURIComponent(callbackUrl)}&id=${id}`;
}
function openDeepLink(url) {
  if (typeof window !== "undefined") {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "deeplink", url }));
    } else {
      window.location.href = url;
    }
  }
}
function isMobile() {
  return isMobileDevice();
}
function isZeroWalletInstalled() {
  if (typeof window === "undefined") return false;
  return !!window.zerowallet?.isZeroWallet;
}
function waitForCallback(expectedId, timeoutMs = 12e4) {
  return new Promise((resolve, reject) => {
    let timeoutId;
    let intervalId;
    const handleCustomEvent = (event) => {
      const customEvent = event;
      const detail = customEvent.detail;
      if (detail && detail.id === expectedId) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        if (typeof window !== "undefined") {
          window.removeEventListener("zerowallet_callback", handleCustomEvent);
        }
        const params = new URLSearchParams();
        for (const key in detail) {
          if (detail[key] !== void 0 && detail[key] !== null) {
            params.append(key, detail[key]);
          }
        }
        resolve(params);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("zerowallet_callback", handleCustomEvent);
    }
    const checkUrl = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("id") === expectedId) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        if (typeof window !== "undefined") {
          window.removeEventListener("zerowallet_callback", handleCustomEvent);
        }
        resolve(params);
      }
    };
    intervalId = setInterval(checkUrl, 1e3);
    checkUrl();
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (typeof window !== "undefined") {
        window.removeEventListener("zerowallet_callback", handleCustomEvent);
      }
      reject(new ZeroWalletTimeoutError("Deep link response timed out."));
    }, timeoutMs);
  });
}
function parseCallbackParams(params) {
  const id = params.get("id") || "";
  const status = params.get("status") || "rejected";
  const error = params.get("error") || void 0;
  const publicKey = params.get("publicKey") || void 0;
  const signedTx = params.get("signedTx") || void 0;
  let signedTxs;
  try {
    const rawTxs = params.get("signedTxs");
    if (rawTxs) {
      signedTxs = JSON.parse(decodeURIComponent(rawTxs));
    }
  } catch (e) {
    console.error("Failed to parse signedTxs array", e);
  }
  const signature = params.get("signature") || void 0;
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

// src/adapter.ts
var ZeroWalletName = "Zero Wallet";
var ZeroWalletIcon = "https://i.ibb.co/wxHdJgv/applogo.jpg";
var ZeroWalletAdapter = class extends BaseMessageSignerWalletAdapter {
  constructor(config = {}) {
    super();
    this.name = ZeroWalletName;
    this.url = "https://zerowallet.app";
    this.icon = ZeroWalletIcon;
    this.supportedTransactionVersions = /* @__PURE__ */ new Set(["legacy", 0]);
    this._config = {
      network: config.network || "mainnet-beta",
      timeoutMs: config.timeoutMs || 12e4,
      callbackUrl: config.callbackUrl || (typeof window !== "undefined" ? window.location.href : "")
    };
    this._connecting = false;
    this._wallet = null;
    this._publicKey = null;
    this._readyState = WalletReadyState.Unsupported;
    if (typeof window !== "undefined") {
      if (isMobile()) {
        this._readyState = isZeroWalletInstalled() ? WalletReadyState.Installed : WalletReadyState.Loadable;
      } else if (isZeroWalletInstalled()) {
        this._readyState = WalletReadyState.Installed;
      } else {
        this._readyState = WalletReadyState.Loadable;
      }
    }
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        const returnedPubKey = params.get("publicKey");
        if (status === "approved" && returnedPubKey) {
          this._publicKey = new PublicKey(returnedPubKey);
          localStorage.setItem("zerowallet_pubkey", returnedPubKey);
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          setTimeout(() => {
            if (this._publicKey) {
              this.emit("connect", this._publicKey);
            }
          }, 0);
        }
      } catch (e) {
      }
    }
  }
  get publicKey() {
    return this._publicKey;
  }
  get connecting() {
    return this._connecting;
  }
  get readyState() {
    return this._readyState;
  }
  async connect() {
    try {
      if (this.connected || this.connecting) return;
      if (this._readyState !== WalletReadyState.Installed && this._readyState !== WalletReadyState.Loadable) {
        throw new ZeroWalletNotInstalledError();
      }
      this._connecting = true;
      const id = generateCallbackId();
      const deepLinkUrl = buildConnectUrl(this._config.callbackUrl, id);
      openDeepLink(deepLinkUrl);
      try {
        const params = await waitForCallback(id, this._config.timeoutMs);
        const parsed = parseCallbackParams(params);
        if (parsed.status === "rejected") {
          throw new ZeroWalletUserRejectionError(parsed.error || "User rejected the connection request.");
        }
        if (!parsed.publicKey) {
          throw new ZeroWalletConnectionError("No public key returned from wallet.");
        }
        this._publicKey = new PublicKey(parsed.publicKey);
        if (typeof window !== "undefined") {
          localStorage.setItem("zerowallet_pubkey", this._publicKey.toBase58());
        }
        this.emit("connect", this._publicKey);
      } catch (e) {
        if (e instanceof ZeroWalletTimeoutError) {
          throw new WalletTimeoutError(e?.message, e);
        }
        throw e;
      }
    } catch (error) {
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }
  async disconnect() {
    this._publicKey = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("zerowallet_pubkey");
    }
    this.emit("disconnect");
  }
  async signTransaction(transaction) {
    try {
      if (!this.connected) throw new WalletDisconnectedError();
      const id = generateCallbackId();
      const serialized = serializeTransaction(transaction);
      const url = buildSignTransactionUrl(serialized, this._config.callbackUrl, id, this._config.network);
      openDeepLink(url);
      const params = await waitForCallback(id, this._config.timeoutMs);
      const parsed = parseCallbackParams(params);
      if (parsed.status === "rejected") {
        throw new ZeroWalletUserRejectionError(parsed.error || "User rejected signature.");
      }
      if (!parsed.signedTx) {
        throw new ZeroWalletSignTransactionError("No signed transaction returned.");
      }
      return deserializeTransaction(parsed.signedTx);
    } catch (error) {
      this.emit("error", error);
      if (error instanceof ZeroWalletTimeoutError) {
        throw new WalletTimeoutError(error?.message, error);
      }
      throw new WalletSignTransactionError(error?.message, error);
    }
  }
  async signAllTransactions(transactions) {
    try {
      if (!this.connected) throw new WalletDisconnectedError();
      const id = generateCallbackId();
      const serializedTxs = transactions.map((t) => serializeTransaction(t));
      const url = buildSignAllUrl(serializedTxs, this._config.callbackUrl, id, this._config.network);
      openDeepLink(url);
      const params = await waitForCallback(id, this._config.timeoutMs);
      const parsed = parseCallbackParams(params);
      if (parsed.status === "rejected") {
        throw new ZeroWalletUserRejectionError(parsed.error || "User rejected signature.");
      }
      if (!parsed.signedTxs || parsed.signedTxs.length !== transactions.length) {
        throw new ZeroWalletSignTransactionError("Invalid number of signed transactions returned.");
      }
      return parsed.signedTxs.map((t) => deserializeTransaction(t));
    } catch (error) {
      this.emit("error", error);
      if (error instanceof ZeroWalletTimeoutError) {
        throw new WalletTimeoutError(error?.message, error);
      }
      throw new WalletSignTransactionError(error?.message, error);
    }
  }
  async signMessage(message) {
    try {
      if (!this.connected || !this.publicKey) throw new WalletDisconnectedError();
      const id = generateCallbackId();
      const serializedMessage = serializeMessage(message);
      const url = buildSignMessageUrl(serializedMessage, this._config.callbackUrl, id);
      openDeepLink(url);
      const params = await waitForCallback(id, this._config.timeoutMs);
      const parsed = parseCallbackParams(params);
      if (parsed.status === "rejected") {
        throw new ZeroWalletUserRejectionError(parsed.error || "User rejected signature.");
      }
      if (!parsed.signature) {
        throw new ZeroWalletSignMessageError("No signature returned.");
      }
      return deserializeSignature(parsed.signature);
    } catch (error) {
      this.emit("error", error);
      if (error instanceof ZeroWalletTimeoutError) {
        throw new WalletTimeoutError(error?.message, error);
      }
      throw new WalletSignMessageError(error?.message, error);
    }
  }
};
var _adapter, _listeners, _version, _connect, _disconnect, _on, _ZeroWalletStandardWallet_instances, emit_fn, off_fn, _signTransaction, _signAndSendTransaction, _signMessage;
var ZeroWalletStandardWallet = class {
  constructor(adapter) {
    __privateAdd(this, _ZeroWalletStandardWallet_instances);
    __privateAdd(this, _adapter);
    __privateAdd(this, _listeners, {});
    __privateAdd(this, _version, "1.0.0");
    __privateAdd(this, _connect, async ({ silent } = {}) => {
      if (!__privateGet(this, _adapter).connected) {
        await __privateGet(this, _adapter).connect();
      }
      return { accounts: this.accounts };
    });
    __privateAdd(this, _disconnect, async () => {
      await __privateGet(this, _adapter).disconnect();
    });
    __privateAdd(this, _on, (event, listener) => {
      __privateGet(this, _listeners)[event]?.push(listener) || (__privateGet(this, _listeners)[event] = [listener]);
      return () => __privateMethod(this, _ZeroWalletStandardWallet_instances, off_fn).call(this, event, listener);
    });
    __privateAdd(this, _signTransaction, async (...inputs) => {
      if (!__privateGet(this, _adapter).connected) throw new Error("Not connected");
      const signedTxs = [];
      for (const input of inputs) {
        const tx = Transaction.from(input.transaction);
        const signed = await __privateGet(this, _adapter).signTransaction(tx);
        signedTxs.push({ signedTransaction: signed.serialize() });
      }
      return signedTxs;
    });
    __privateAdd(this, _signAndSendTransaction, async (...inputs) => {
      if (!__privateGet(this, _adapter).connected) throw new Error("Not connected");
      throw new Error("signAndSendTransaction not fully implemented in standard adapter wrapper for Zero Wallet deep link yet.");
    });
    __privateAdd(this, _signMessage, async (...inputs) => {
      if (!__privateGet(this, _adapter).connected) throw new Error("Not connected");
      const signatures = [];
      for (const input of inputs) {
        const signature = await __privateGet(this, _adapter).signMessage(input.message);
        signatures.push({ signedMessage: input.message, signature });
      }
      return signatures;
    });
    __privateSet(this, _adapter, adapter);
    __privateGet(this, _adapter).on("connect", __privateMethod(this, _ZeroWalletStandardWallet_instances, emit_fn).bind(this, "change", { accounts: this.accounts }));
    __privateGet(this, _adapter).on("disconnect", __privateMethod(this, _ZeroWalletStandardWallet_instances, emit_fn).bind(this, "change", { accounts: this.accounts }));
  }
  get version() {
    return __privateGet(this, _version);
  }
  get name() {
    return ZeroWalletName;
  }
  get icon() {
    return ZeroWalletIcon;
  }
  get chains() {
    return ["solana:mainnet", "solana:devnet", "solana:testnet"];
  }
  get features() {
    return {
      "standard:connect": {
        version: "1.0.0",
        connect: __privateGet(this, _connect)
      },
      "standard:disconnect": {
        version: "1.0.0",
        disconnect: __privateGet(this, _disconnect)
      },
      "standard:events": {
        version: "1.0.0",
        on: __privateGet(this, _on)
      },
      "solana:signTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: __privateGet(this, _signTransaction)
      },
      "solana:signAndSendTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: __privateGet(this, _signAndSendTransaction)
      },
      "solana:signMessage": {
        version: "1.0.0",
        signMessage: __privateGet(this, _signMessage)
      }
    };
  }
  get accounts() {
    return __privateGet(this, _adapter).publicKey ? [new ZeroWalletStandardAccount(__privateGet(this, _adapter).publicKey)] : [];
  }
};
_adapter = new WeakMap();
_listeners = new WeakMap();
_version = new WeakMap();
_connect = new WeakMap();
_disconnect = new WeakMap();
_on = new WeakMap();
_ZeroWalletStandardWallet_instances = new WeakSet();
emit_fn = function(event, ...args) {
  __privateGet(this, _listeners)[event]?.forEach((listener) => listener.apply(null, args));
};
off_fn = function(event, listener) {
  __privateGet(this, _listeners)[event] = __privateGet(this, _listeners)[event]?.filter((existingListener) => listener !== existingListener);
};
_signTransaction = new WeakMap();
_signAndSendTransaction = new WeakMap();
_signMessage = new WeakMap();
var _publicKey;
var ZeroWalletStandardAccount = class {
  constructor(publicKey) {
    __privateAdd(this, _publicKey);
    __privateSet(this, _publicKey, publicKey);
  }
  get address() {
    return __privateGet(this, _publicKey).toBase58();
  }
  get publicKey() {
    return __privateGet(this, _publicKey).toBytes();
  }
  get chains() {
    return ["solana:mainnet", "solana:devnet", "solana:testnet"];
  }
  get features() {
    return ["solana:signTransaction", "solana:signAndSendTransaction", "solana:signMessage"];
  }
};
_publicKey = new WeakMap();
function registerWalletStandard(adapter) {
  if (typeof window === "undefined") return;
  try {
    const wallet = new ZeroWalletStandardWallet(adapter);
    const { registerWallet } = __require("@wallet-standard/wallet");
    registerWallet(wallet);
  } catch (error) {
    console.error("ZeroWallet: Failed to register wallet standard", error);
  }
}

export { ZeroWalletAdapter, ZeroWalletConnectionError, ZeroWalletIcon, ZeroWalletName, ZeroWalletNotInstalledError, ZeroWalletSignMessageError, ZeroWalletSignTransactionError, ZeroWalletStandardAccount, ZeroWalletStandardWallet, ZeroWalletTimeoutError, ZeroWalletUserRejectionError, buildConnectUrl, buildSignAllUrl, buildSignMessageUrl, buildSignTransactionUrl, decodeBase64, deserializeSignature, deserializeTransaction, encodeBase64, generateCallbackId, isAndroid, isIOS, isMobile, isMobileDevice, isZeroWalletInstalled, openDeepLink, parseCallbackParams, registerWalletStandard, serializeMessage, serializeTransaction, waitForCallback };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map