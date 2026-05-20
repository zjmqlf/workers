import bigInt from "big-integer";
import { Api } from "../tl";
import { SenderSlot, SlotRemovedError } from "./SenderSlot";
import {
    FileMigrateError,
    FloodWaitError,
    FloodTestPhoneWaitError,
} from "../errors";
import { AuthKey } from "../crypto/AuthKey";
import { sleep } from "../Helpers";
import type { TelegramBaseClient } from "../client/telegramBaseClient";
import type { MTProtoSender } from "./MTProtoSender";

const ONE_MB = 1024 * 1024;
const MIN_CHUNK = 4096;

export interface FilePoolOptions {
    sessions: number;
    inflightPerDc: number;
    partSize: number;
    idleTimeoutMs: number;
    requestRetries: number;
    cdnSupported: boolean;
    sessionStartupDelayMs: number;
}

export const DEFAULT_FILE_POOL_OPTIONS: FilePoolOptions = {
    sessions: 1,
    inflightPerDc: 8,
    partSize: 512 * 1024,
    idleTimeoutMs: 60_000,
    requestRetries: 5,
    cdnSupported: false,
    sessionStartupDelayMs: 800,
};

export class CdnRedirectError extends Error {
    constructor(public readonly redirect: Api.upload.FileCdnRedirect) {
        super("upload.fileCdnRedirect");
        this.name = "CdnRedirectError";
    }
}

export class FilePoolClosedError extends Error {
    constructor() {
        super("FilePool is closed");
        this.name = "FilePoolClosedError";
    }
}

export class FilePoolAbortError extends Error {
    constructor() {
        super("FilePool operation aborted");
        this.name = "FilePoolAbortError";
    }
}

class DcPool {
    readonly slots: SenderSlot[] = [];
    private readonly _waiters: Array<() => void> = [];
    private _available: number;
    private _floodWaitUntil = 0;
    private _next = 0;
    private _closed = false;
    private readonly _authKey: AuthKey;
    private _connectChain: Promise<unknown> = Promise.resolve();
    private _lastConnectAt = 0;

    constructor(
        readonly dcId: number,
        private readonly _pool: FilePool,
    ) {
        this._available = _pool.opts.inflightPerDc;
        const existing = _pool.client.session.getAuthKey(dcId);
        this._authKey = existing ?? new AuthKey();
        for (let i = 0; i < _pool.opts.sessions; i++) {
            this.slots.push(this._mkSlot());
        }
    }

    setFloodWait(seconds: number): void {
        const until = Date.now() + Math.max(1, seconds) * 1000;
        if (until > this._floodWaitUntil) this._floodWaitUntil = until;
    }

    async run<T>(
        work: (slot: SenderSlot) => Promise<T>,
        signal?: AbortSignal,
    ): Promise<T> {
        await this._acquireInflight(signal);
        let slot: SenderSlot | undefined;
        try {
            while (true) {
                if (this._closed) throw new FilePoolClosedError();
                if (signal?.aborted) throw new FilePoolAbortError();
                const wait = this._floodWaitUntil - Date.now();
                if (wait <= 0) break;
                await sleepOrAbort(Math.min(wait, 1000), signal);
            }
            slot = this._pickSlot();
            slot.enter();
            return await work(slot);
        } finally {
            if (slot) slot.leave();
            this._releaseInflight();
        }
    }

    private _pickSlot(): SenderSlot {
        const n = this.slots.length;
        for (let i = 0; i < n; i++) {
            const idx = (this._next + i) % n;
            const s = this.slots[idx];
            if (s.state !== "dead") {
                this._next = (idx + 1) % n;
                return s;
            }
        }
        const idx = this._next % n;
        const replacement = this._mkSlot();
        this.slots[idx] = replacement;
        this._next = (idx + 1) % n;
        return replacement;
    }

    private _mkSlot(): SenderSlot {
        const opts = this._pool.opts;
        const dc = this.dcId;
        const slot: SenderSlot = new SenderSlot({
            dcId: dc,
            idleTimeoutMs: opts.idleTimeoutMs,
            log: this._pool.client._log,
            connect: async () => {
                const ours = this._connectChain.then(() => this._gatedConnect(slot));
                this._connectChain = ours.catch(() => {});
                return ours;
            },
        });
        return slot;
    }

    private async _gatedConnect(slot: SenderSlot): Promise<MTProtoSender> {
        const gap = this._pool.opts.sessionStartupDelayMs;
        if (gap > 0 && this._lastConnectAt > 0) {
            const wait = gap - (Date.now() - this._lastConnectAt);
            if (wait > 0) await sleep(wait);
        }
        try {
            return await this._openSession(slot);
        } finally {
            this._lastConnectAt = Date.now();
        }
    }

    private _openSession(slot: SenderSlot): Promise<MTProtoSender> {
        const sender = this._pool.client._makeSender(
            this.dcId,
            () => this._onSenderBreak(slot),
            this._authKey,
        );
        return this._pool.client._connectSender(sender, this.dcId);
    }

    private _onSenderBreak(_slot: SenderSlot): void {
        this._authKey.setKey(undefined).catch(() => {});
        this._pool.client.session.setAuthKey(undefined, this.dcId);
        this._connectChain = Promise.resolve();
        this._lastConnectAt = 0;
        const dying = this.slots.splice(0);
        for (let i = 0; i < this._pool.opts.sessions; i++) {
            this.slots.push(this._mkSlot());
        }
        this._wakeAll();
        for (const s of dying) {
            s.markDead("auth-broken").catch(() => {});
        }
    }

    private _acquireInflight(signal?: AbortSignal): Promise<void> {
        if (this._closed) return Promise.reject(new FilePoolClosedError());
        if (signal?.aborted) return Promise.reject(new FilePoolAbortError());
        if (this._available > 0) {
            this._available--;
            return Promise.resolve();
        }
        return new Promise<void>((resolve, reject) => {
            const ticket = () => {
                if (signal) signal.removeEventListener("abort", onAbort);
                if (this._closed) {
                    reject(new FilePoolClosedError());
                    return;
                }
                this._available--;
                resolve();
            };
            const onAbort = () => {
                const i = this._waiters.indexOf(ticket);
                if (i >= 0) this._waiters.splice(i, 1);
                reject(new FilePoolAbortError());
            };
            if (signal) {
                if (signal.aborted) return reject(new FilePoolAbortError());
                signal.addEventListener("abort", onAbort, { once: true });
            }
            this._waiters.push(ticket);
        });
    }

    private _releaseInflight(): void {
        this._available++;
        const next = this._waiters.shift();
        if (next) next();
    }

    private _wakeAll(): void {
        for (const w of this._waiters.splice(0)) w();
    }

    async purge(reason: "manual" | "auth-broken"): Promise<void> {
        const dying = this.slots.splice(0);
        for (let i = 0; i < this._pool.opts.sessions; i++) {
            this.slots.push(this._mkSlot());
        }
        this._wakeAll();
        await Promise.all(dying.map((s) => s.markDead(reason).catch(() => {})));
    }

    async close(): Promise<void> {
        this._closed = true;
        const dying = this.slots.splice(0);
        this._wakeAll();
        await Promise.all(dying.map((s) => s.markDead("pool-closed").catch(() => {})));
    }
}

export class FilePool {
    readonly opts: FilePoolOptions;
    readonly client: TelegramBaseClient;
    private readonly _dcs = new Map<number, DcPool>();
    private _closed = false;

    constructor(client: TelegramBaseClient, opts?: Partial<FilePoolOptions>) {
        this.client = client;
        this.opts = { ...DEFAULT_FILE_POOL_OPTIONS, ...(opts || {}) };
        if (this.opts.partSize > ONE_MB) this.opts.partSize = ONE_MB;
        if (this.opts.partSize % MIN_CHUNK !== 0) {
            throw new Error("FilePool.partSize must be a multiple of 4096");
        }
        if (this.opts.sessions < 1) this.opts.sessions = 1;
        if (this.opts.inflightPerDc < 1) this.opts.inflightPerDc = 1;
        if (this.opts.requestRetries < 1) this.opts.requestRetries = 1;
    }

    private _dc(dcId: number): DcPool {
        let dc = this._dcs.get(dcId);
        if (!dc) {
            dc = new DcPool(dcId, this);
            this._dcs.set(dcId, dc);
        }
        return dc;
    }

    async getFile(
        dcId: number,
        location: Api.TypeInputFileLocation,
        offset: bigInt.BigInteger,
        limit: number,
        signal?: AbortSignal,
    ): Promise<Buffer> {
        if (this._closed) throw new FilePoolClosedError();
        let currentDc = dcId;
        let lastErr: any;
        for (let attempt = 0; attempt < this.opts.requestRetries; attempt++) {
            if (signal?.aborted) throw new FilePoolAbortError();
            const dc = this._dc(currentDc);
            try {
                return await dc.run(
                    (slot) => this._invokeOnSlot(slot, location, offset, limit, signal),
                    signal,
                );
            } catch (err: any) {
                lastErr = err;
                if (err instanceof FilePoolAbortError) throw err;
                if (err instanceof FilePoolClosedError) throw err;
                if (err instanceof CdnRedirectError) throw err;
                if (err instanceof SlotRemovedError) {
                    continue;
                }
                if (err instanceof FileMigrateError) {
                    currentDc = err.newDc;
                    continue;
                }
                if (
                    err instanceof FloodWaitError ||
                    err instanceof FloodTestPhoneWaitError ||
                    err?.errorMessage?.startsWith?.("FLOOD_PREMIUM_WAIT_") ||
                    err?.errorMessage?.startsWith?.("FLOOD_WAIT_")
                ) {
                    dc.setFloodWait(parseFloodWait(err));
                    continue;
                }
                if (err?.errorMessage === "TIMEOUT") {
                    continue;
                }
                throw err;
            }
        }
        throw lastErr ?? new Error("FilePool retries exhausted");
    }

    private async _invokeOnSlot(
        slot: SenderSlot,
        location: Api.TypeInputFileLocation,
        offset: bigInt.BigInteger,
        limit: number,
        signal?: AbortSignal,
    ): Promise<Buffer> {
        const sender = await slot.ensureConnected();
        let unsubDeath: (() => void) | undefined;
        let abortHandler: (() => void) | undefined;
        const deathPromise = new Promise<never>((_, reject) => {
            unsubDeath = slot.onDeath((reason) => reject(new SlotRemovedError(reason)));
        });
        const abortPromise = signal
            ? new Promise<never>((_, reject) => {
                  if (signal.aborted) {
                      reject(new FilePoolAbortError());
                      return;
                  }
                  abortHandler = () => reject(new FilePoolAbortError());
                  signal.addEventListener("abort", abortHandler, { once: true });
              })
            : null;
        try {
            const req = (this.client as any).invokeWithSender(
                new Api.upload.GetFile({
                    location,
                    offset,
                    limit,
                    precise: false,
                    cdnSupported: this.opts.cdnSupported,
                }),
                sender,
            );
            const races: Promise<any>[] = [req, deathPromise];
            if (abortPromise) races.push(abortPromise);
            const result = await Promise.race(races);
            if (result instanceof Api.upload.FileCdnRedirect) {
                throw new CdnRedirectError(result);
            }
            return result.bytes;
        } finally {
            unsubDeath?.();
            if (signal && abortHandler) {
                signal.removeEventListener("abort", abortHandler);
            }
        }
    }

    async purge(dcId?: number): Promise<void> {
        if (dcId !== undefined) {
            const dc = this._dcs.get(dcId);
            if (dc) await dc.purge("manual");
            return;
        }
        await Promise.all([...this._dcs.values()].map((dc) => dc.purge("manual")));
    }

    async close(opts: { waitMs: number } = { waitMs: 5000 }): Promise<void> {
        this._closed = true;
        const dcs = [...this._dcs.values()];
        this._dcs.clear();
        const drained = Promise.all(dcs.map((dc) => dc.close()));
        await Promise.race([
            drained,
            new Promise<void>((resolve) => setTimeout(resolve, opts.waitMs)),
        ]);
    }
}

function parseFloodWait(err: any): number {
    if (typeof err?.seconds === "number") return err.seconds;
    const tail = err?.errorMessage?.split?.("_")?.pop?.();
    const n = Number(tail);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

async function sleepOrAbort(ms: number, signal?: AbortSignal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        let onAbort: (() => void) | undefined;
        const t = setTimeout(() => {
            if (signal && onAbort) signal.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        onAbort = () => {
            clearTimeout(t);
            reject(new FilePoolAbortError());
        };
        if (signal) {
            if (signal.aborted) {
                clearTimeout(t);
                reject(new FilePoolAbortError());
                return;
            }
            signal.addEventListener("abort", onAbort, { once: true });
        }
    });
}
