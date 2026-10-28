import timers from "node:timers";

export interface SleepOptions {
    signal?: AbortSignal;
    ref?: boolean;
}

function abortError(signal: AbortSignal): Error {
    return Object.assign(new Error("The operation was aborted"), { name: "AbortError", code: "ABORT_ERR", cause: signal.reason });
}

export function setTimeout(callback: () => void, ms: number): ReturnType<typeof timers.setTimeout> {
    return timers.setTimeout(callback, ms);
}

export function clearTimeout(timer: ReturnType<typeof timers.setTimeout>): void {
    return timers.clearTimeout(timer);
}

export function setInterval(callback: () => void, ms: number): ReturnType<typeof timers.setInterval> {
    return timers.setInterval(callback, ms);
}

export function setImmediate(callback: () => void, args): ReturnType<typeof timers.setImmediate> {
    return timers.setImmediate(callback, args);
}

export function sleep(ms: number, options: SleepOptions = {}): Promise<void> {
    const { signal, ref = true } = options;
    if (signal?.aborted) return Promise.reject(abortError(signal));
    return new Promise((resolve, reject) => {
        const abort = () => {
            clearTimeout(timer);
            reject(abortError(signal!));
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
        }, ms);
        if (!ref) (timer as { unref?: () => void }).unref?.();
        signal?.addEventListener("abort", abort, { once: true });
    });
}
