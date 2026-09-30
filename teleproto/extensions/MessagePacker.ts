import { packRequestBatch } from "../network/packing";
import type { MTProtoState } from "../network/MTProtoState";
import type { RequestState } from "../network/RequestState";
const USE_INVOKE_AFTER_WITH = new Set([
    "messages.SendMessage",
    "messages.SendMedia",
    "messages.SendMultiMedia",
    "messages.ForwardMessages",
    "messages.SendInlineBotResult",
]);
import { Buffer } from "node:buffer";

export class MessagePacker {
    private _state: MTProtoState;
    public _pendingStates: RequestState[];
    private _queue: any[];
    private _ready: Promise<unknown>;
    private setReady: ((value?: any) => void) | undefined;
    private _log: any;

    constructor(state: MTProtoState, logger: any) {
        this._state = state;
        this._queue = [];
        this._pendingStates = [];
        this._ready = new Promise((resolve) => {
            this.setReady = resolve;
        });
        this._log = logger;
    }

    values() {
        return this._queue;
    }

    get length() {
        return this._queue.length + this._pendingStates.length;
    }

    append(state?: RequestState, setReady = true, atStart = false) {
        if (state && USE_INVOKE_AFTER_WITH.has(state.request.className)) {
            if (atStart) {
                for (let i = 0; i < this._queue.length; i++) {
                    if (
                        USE_INVOKE_AFTER_WITH.has(
                            this._queue[i]?.request.className
                        )
                    ) {
                        this._queue[i].after = state;
                        break;
                    }
                }
            } else {
                for (let i = this._queue.length - 1; i >= 0; i--) {
                    if (
                        USE_INVOKE_AFTER_WITH.has(
                            this._queue[i]?.request.className
                        )
                    ) {
                        state.after = this._queue[i];
                        break;
                    }
                }
            }
        }
        if (atStart) {
            this._queue.unshift(state);
        } else {
            this._queue.push(state);
        }
        if (setReady && this.setReady) {
            this.setReady(true);
        }
        if (state && state.request.CONSTRUCTOR_ID !== 1658238041) {
            this._pendingStates.push(state);
            state
                .promise!
                .catch((err) => {})
                .finally(() => {
                    this._pendingStates = this._pendingStates.filter(
                        (s) => s !== state
                    );
                });
        }
    }

    prepend(states: RequestState[]) {
        states.reverse().forEach((state) => {
            this.append(state, false, true);
        });
        if (this.setReady) {
            this.setReady(true);
        }
    }

    extend(states: RequestState[]) {
        states.forEach((state) => {
            this.append(state, false);
        });
        if (this.setReady) {
            this.setReady(true);
        }
    }
    clear() {
        this._queue = [];
        this.append(undefined);
    }

    async wait() {
        if (!this._queue.length) {
            this._ready = new Promise((resolve) => {
                this.setReady = resolve;
            });
            await this._ready;
        }
    }

    async get() {
        if (!this._queue[this._queue.length - 1]) {
            this._queue = this._queue.filter(Boolean);
            return undefined;
        }

        this._queue = this._queue.filter(Boolean);
        return packRequestBatch(this._state, this._queue, this._log);
    }
}
