import * as common from "./Common";
import * as proxy from "./ProxyRejectedError";
import * as files from "./FileErrors";
import * as base from "./RPCBaseErrors";
import * as list from "./RPCErrorList";
import * as aliases from "./aliases";

type Exports = typeof common & typeof proxy & typeof files & typeof base & typeof list & typeof aliases;

type ErrorClassName = {
    [K in keyof Exports]: Exports[K] extends abstract new (...args: never[]) => Error ? K : never;
}[keyof Exports];

type ErrorOf<K extends ErrorClassName> = Exports[K] extends abstract new (...args: never[]) => infer E ? E : never;

export type ErrorHandlers<R> = {
    [K in ErrorClassName]?: (error: ErrorOf<K>) => R | Promise<R>;
};

type Handler<R> = (error: never) => R | Promise<R>;

const classes: Record<string, unknown> = { ...common, ...proxy, ...files, ...base, ...list, ...aliases };

export async function match<R>(error: unknown, handlers: ErrorHandlers<R>): Promise<R> {
    const byPrototype = new Map<object, Handler<R>>();
    for (const [name, handler] of Object.entries(handlers) as [string, Handler<R> | undefined][]) {
        const cls = classes[name];
        if (handler && typeof cls === "function") byPrototype.set(cls.prototype, handler);
    }
    let prototype: object | null = error !== null && typeof error === "object" ? Object.getPrototypeOf(error) : null;
    for (; prototype; prototype = Object.getPrototypeOf(prototype)) {
        const handler = byPrototype.get(prototype);
        if (handler) return handler(error as never);
    }
    throw error;
}

export function handle<R>(handlers: ErrorHandlers<R>): (error: unknown) => Promise<R> {
    return (error) => match(error, handlers);
}
