import { MTProtoSender } from "./MTProtoSender";
import { Logger } from "../extensions";

export type SenderSlotState =
    | "idle"
    | "connecting"
    | "ready"
    | "dead";

export type SenderSlotDeathReason =
    | "auth-broken"
    | "manual"
    | "pool-closed";

export interface SenderSlotOptions {
    dcId: number;
    idleTimeoutMs: number;
    log: Logger;
    connect: (slot: SenderSlot) => Promise<MTProtoSender>;
}

export class SlotRemovedError extends Error {
    constructor(reason: SenderSlotDeathReason) {
        super(`sender slot removed: ${reason}`);
        this.name = "SlotRemovedError";
    }
}

export class SenderSlot {
    readonly dcId: number;
    state: SenderSlotState = "idle";

    private _sender?: MTProtoSender;
    private _connectPromise?: Promise<MTProtoSender>;
    private _idleTimer?: ReturnType<typeof setTimeout>;
    private _deathListeners = new Set<(reason: SenderSlotDeathReason) => void>();
    private _active = 0;
    private readonly _opts: SenderSlotOptions;

    constructor(opts: SenderSlotOptions) {
        this.dcId = opts.dcId;
        this._opts = opts;
    }

    get sender(): MTProtoSender | undefined {
        return this._sender;
    }

    async ensureConnected(): Promise<MTProtoSender> {
        if (this.state === "dead") {
            throw new SlotRemovedError("manual");
        }
        if (this._sender && this._sender.isConnected() && this.state === "ready") {
            return this._sender;
        }
        if (this._connectPromise) {
            return this._connectPromise;
        }
        this.state = "connecting";
        // this._clearIdle();
        this._connectPromise = (async () => {
            try {
                const sender = await this._opts.connect(this);
                if ((this.state as SenderSlotState) === "dead") {
                    try { await sender.disconnect(); } catch {}
                    throw new SlotRemovedError("manual");
                }
                this._sender = sender;
                this.state = "ready";
                // if (this._active === 0) this._armIdle();
                return sender;
            } catch (err) {
                if ((this.state as SenderSlotState) !== "dead") this.state = "idle";
                throw err;
            } finally {
                this._connectPromise = undefined;
            }
        })();
        return this._connectPromise;
    }

    enter(): void {
        this._active++;
        // this._clearIdle();
    }

    leave(): void {
        if (this._active > 0) this._active--;
        // if (this._active === 0 && this.state === "ready") this._armIdle();
    }

    onDeath(listener: (reason: SenderSlotDeathReason) => void): () => void {
        if (this.state === "dead") {
            listener("manual");
            return () => {};
        }
        this._deathListeners.add(listener);
        return () => this._deathListeners.delete(listener);
    }

    async markDead(reason: SenderSlotDeathReason): Promise<void> {
        if (this.state === "dead") return;
        this.state = "dead";
        // this._clearIdle();
        for (const listener of this._deathListeners) {
            try { listener(reason); } catch {}
        }
        this._deathListeners.clear();
        const s = this._sender;
        this._sender = undefined;
        if (s) {
            try { await s.disconnect(); } catch {}
        }
    }

    // private _clearIdle(): void {
    //     if (this._idleTimer) {
    //         clearTimeout(this._idleTimer);
    //         this._idleTimer = undefined;
    //     }
    // }

    // private _armIdle(): void {
    //     if (this.state !== "ready") return;
    //     this._clearIdle();
    //     if (this._opts.idleTimeoutMs <= 0) return;
    //     this._idleTimer = setTimeout(() => {
    //         this._idleTimer = undefined;
    //         this._idleTick();
    //     }, this._opts.idleTimeoutMs);
    // }

    private _idleTick(): void {
        if (this.state !== "ready" || this._active > 0) return;
        const s = this._sender;
        this._sender = undefined;
        this.state = "idle";
        if (s) {
            s.disconnect().catch(() => {});
        }
    }
}
