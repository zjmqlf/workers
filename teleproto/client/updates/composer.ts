import bigInt from "big-integer";
import { setMaxListeners } from "events";
import { Api } from "../../tl";
import type { EntityLike } from "../../define";
import type { TelegramClient } from "../TelegramClient";
import type { EventBuilder } from "../../events/common";
import { _intoIdSet } from "../../events/common";
import { getPeerId } from "../../Utils";
import { isArrayLike } from "../../Helpers";
import type { UpdateState, ChannelPollingState } from "./manager";
import { UpdateConnectionState } from "../../network";
import { UpdateContext, type WithUpdateContext } from "./context";

export type NextFn = () => Promise<void>;

export type UpdateMiddleware<T = any> = (
    update: WithUpdateContext<T>,
    next: NextFn,
) => unknown | Promise<unknown>;

export type Unsubscribe = () => void;

type BareUpdateName<K extends string> = K extends `Update${infer Rest}`
    ? Uncapitalize<Rest>
    : never;

export type UpdateByName = {
    [K in Api.TypeUpdate["className"]as BareUpdateName<K>]: Extract<
        Api.TypeUpdate,
        { className: K }
    >;
};

export type UpdateName = (keyof UpdateByName & string) | "connectionState";

export type AnyUpdate = Api.TypeUpdate | UpdateConnectionState;

type UpdateFields = {
    className?: string;
    channelId?: bigInt.BigInteger;
    chatId?: bigInt.BigInteger;
    userId?: bigInt.BigInteger;
    peer?: Api.TypePeer | Api.TypeDialogPeer | Api.TypeNotifyPeer;
    message?: { peerId?: Api.TypePeer };
    _entities?: Map<string, Api.TypeUser | Api.TypeChat>;
    state?: Record<string, unknown>;
};

const fieldsOf = (update: unknown): UpdateFields => (update ?? {}) as UpdateFields;

export type UpdateOf<Name extends UpdateName> = WithUpdateContext<
    Name extends keyof UpdateByName ? UpdateByName[Name] : UpdateConnectionState
>;

interface WatchEntry {
    chats: EntityLike[];
    channels: Set<string>;
    stopped: boolean;
    arming?: Promise<void>;
    controller: AbortController;
    retryTimer?: ReturnType<typeof setTimeout>;
    retryDelay: number;
}

export interface WatchOptions {
    events?: UpdateName | UpdateName[] | EventBuilder;
    func?: (update: WithUpdateContext<AnyUpdate>) => unknown | Promise<unknown>;
}

export interface OnOptions {
    chats?: EntityLike | EntityLike[];
    blacklistChats?: boolean;
    func?: (update: WithUpdateContext<AnyUpdate>) => unknown | Promise<unknown>;
}

function nameOf(update: unknown): UpdateName | undefined {
    const className = fieldsOf(update).className;
    if (!className) {
        return update instanceof UpdateConnectionState
            ? "connectionState"
            : undefined;
    }
    const bare = className.startsWith("Update")
        ? className.slice("Update".length)
        : className;
    return (bare.charAt(0).toLowerCase() + bare.slice(1)) as UpdateName;
}

function expandShortMessage(
    update: unknown,
    selfId?: bigInt.BigInteger,
): Api.UpdateNewMessage | undefined {
    const short =
        update instanceof Api.UpdateShortMessage ||
        update instanceof Api.UpdateShortChatMessage;
    if (!short) return undefined;
    const peerId =
        update instanceof Api.UpdateShortMessage
            ? new Api.PeerUser({ userId: update.userId })
            : new Api.PeerChat({ chatId: update.chatId });
    const fromUser =
        update instanceof Api.UpdateShortMessage ? update.userId : update.fromId;
    return new Api.UpdateNewMessage({
        message: new Api.Message({
            out: update.out,
            mentioned: update.mentioned,
            mediaUnread: update.mediaUnread,
            silent: update.silent,
            id: update.id,
            peerId,
            fromId: new Api.PeerUser({
                userId: update.out && selfId ? selfId : fromUser,
            }),
            message: update.message,
            date: update.date,
            fwdFrom: update.fwdFrom,
            viaBotId: update.viaBotId,
            replyTo: update.replyTo,
            entities: update.entities,
            ttlPeriod: update.ttlPeriod,
        }),
        pts: update.pts,
        ptsCount: update.ptsCount,
    });
}

function peerOf(update: unknown): string | undefined {
    const fields = fieldsOf(update);
    if (
        fields.peer instanceof Api.DialogPeerCommunity ||
        fields.peer instanceof Api.NotifyCommunity
    ) {
        return getPeerId(new Api.PeerChannel({ channelId: fields.peer.communityId }));
    }
    const peer =
        fields.message?.peerId ??
        (fields.peer instanceof Api.DialogPeer || fields.peer instanceof Api.NotifyPeer
            ? fields.peer.peer : undefined) ??
        (fields.peer instanceof Api.PeerUser ||
            fields.peer instanceof Api.PeerChat ||
            fields.peer instanceof Api.PeerChannel
            ? fields.peer
            : undefined);
    if (peer) return getPeerId(peer);
    if (fields.channelId) {
        return getPeerId(new Api.PeerChannel({ channelId: fields.channelId }));
    }
    if (fields.chatId) {
        return getPeerId(new Api.PeerChat({ chatId: fields.chatId }));
    }
    if (fields.userId) {
        return getPeerId(new Api.PeerUser({ userId: fields.userId }));
    }
    return undefined;
}

export class ClientUpdates {
    private readonly client: TelegramClient;
    private readonly chain: UpdateMiddleware[] = [];
    private readonly registrations = new Map<UpdateMiddleware, UpdateMiddleware[]>();
    private readonly watches = new Set<WatchEntry>();
    private onError?: (error: Error, update?: AnyUpdate) => unknown;
    private blockedAuthorization?: Error;

    constructor(client: TelegramClient) {
        this.client = client;
    }

    use<T = any>(middleware: UpdateMiddleware<T>): Unsubscribe {
        if (typeof middleware !== "function") {
            throw new TypeError("Update middleware must be a function");
        }
        this.chain.push(middleware as UpdateMiddleware);
        return () => this.remove(middleware as UpdateMiddleware);
    }

    on<Name extends UpdateName>(
        names: Name | Name[],
        handler:
            | UpdateMiddleware<UpdateOf<Name>>
            | UpdateMiddleware<UpdateOf<Name>>[],
        options?: OnOptions,
    ): Unsubscribe;
    on<T = any>(
        builder: EventBuilder,
        handler: UpdateMiddleware<T> | UpdateMiddleware<T>[],
        options?: OnOptions,
    ): Unsubscribe;
    on(
        target: UpdateName | UpdateName[] | EventBuilder,
        handler: UpdateMiddleware | UpdateMiddleware[],
        options: OnOptions = {},
    ): Unsubscribe {
        const run = compose(handler);
        if (typeof target !== "string" && !Array.isArray(target)) {
            return this.register(this.builderMiddleware(target, run, options), handler);
        }
        const names = new Set(
            (Array.isArray(target) ? target : [target]).map((name) =>
                name.charAt(0).toLowerCase() + name.slice(1),
            ),
        );
        const matchesChat = this.chatMatcher(options);
        return this.register(async (update, next) => {
            const name = nameOf(update);
            if (!name || !names.has(name)) return next();
            if (!(await matchesChat(update))) return next();
            if (options.func && !(await options.func(update))) return next();
            await run(update, next);
        }, handler);
    }

    watch(
        chats: EntityLike | EntityLike[],
        handler?: UpdateMiddleware<UpdateOf<"newMessage" | "newChannelMessage">> | UpdateMiddleware<UpdateOf<"newMessage" | "newChannelMessage">>[],
        options?: WatchOptions & { events?: undefined },
    ): Unsubscribe;
    watch<Name extends UpdateName>(
        chats: EntityLike | EntityLike[],
        handler: UpdateMiddleware<UpdateOf<Name>> | UpdateMiddleware<UpdateOf<Name>>[],
        options: WatchOptions & { events: Name | Name[] },
    ): Unsubscribe;
    watch<T = any>(
        chats: EntityLike | EntityLike[],
        handler?: UpdateMiddleware<T> | UpdateMiddleware<T>[],
        options?: WatchOptions,
    ): Unsubscribe;
    watch(
        chats: EntityLike | EntityLike[],
        handler?: UpdateMiddleware | UpdateMiddleware[],
        options: WatchOptions = {},
    ): Unsubscribe {
        const wanted = isArrayLike(chats)
            ? (chats as EntityLike[])
            : [chats as EntityLike];
        let offHandler: Unsubscribe | undefined;
        if (handler) {
            const events = options.events ?? ["newMessage", "newChannelMessage"];
            offHandler =
                typeof events === "string" || Array.isArray(events)
                    ? this.on(events as UpdateName[], handler as UpdateMiddleware, {
                        chats: wanted,
                        func: options.func,
                    })
                    : this.on(events, handler as UpdateMiddleware, {
                        chats: wanted,
                        func: options.func,
                    });
        }

        const entry: WatchEntry = {
            chats: wanted,
            channels: new Set(),
            stopped: false,
            controller: watchController(),
            retryDelay: 1000,
        };
        this.watches.add(entry);
        void this.arm(entry);

        return () => {
            if (entry.stopped) return;
            entry.stopped = true;
            this.watches.delete(entry);
            offHandler?.();
            entry.controller.abort();
            if (entry.retryTimer) clearTimeout(entry.retryTimer);
            entry.channels.clear();
        };
    }

    private async arm(entry: WatchEntry): Promise<void> {
        if (entry.stopped || entry.arming || this.blockedAuthorization || !this.client.updateManager.isRunning) return;
        const controller = entry.controller;
        const active = () => !controller.signal.aborted && !entry.stopped;
        const task = (async () => {
            await this.client._connectedDeferred.promise;
            if (!active() || !this.client.updateManager.isRunning) return;
            let retry = false;
            const pending: Promise<void>[] = [];
            const pendingChannels = new Set<string>();
            const failed = async (error: unknown) => {
                if (!active()) return;
                if (this._suspendAuthorization(error)) return;
                const code = (error as { errorMessage?: string }).errorMessage;
                retry ||= !(error instanceof TypeError || error instanceof RangeError) &&
                    !["CHANNEL_PRIVATE", "CHANNEL_INVALID", "USERNAME_INVALID", "USERNAME_NOT_OCCUPIED", "PEER_ID_INVALID"].includes(code ?? "");
                await this.reportError(error as Error, undefined);
            };
            for (const chat of entry.chats) {
                if (!active()) return;
                try {
                    const input = await this.client.getInputEntity(chat);
                    if (!active()) return;
                    if (!(input instanceof Api.InputPeerChannel)) continue;
                    const channelId = input.channelId.toString();
                    if (entry.channels.has(channelId) || pendingChannels.has(channelId)) continue;
                    pendingChannels.add(channelId);
                    const subscription = this.client.updateManager.watchChannel(
                        channelId,
                        new Api.InputChannel({
                            channelId: input.channelId,
                            accessHash: input.accessHash,
                        }),
                        controller.signal,
                    );
                    pending.push(subscription.then(() => {
                        if (active()) entry.channels.add(channelId);
                    }).catch(failed));
                } catch (error) {
                    await failed(error);
                }
            }
            await Promise.all(pending);
            if (retry && active()) {
                entry.retryTimer = setTimeout(() => {
                    entry.retryTimer = undefined;
                    void this.arm(entry);
                }, entry.retryDelay);
                entry.retryTimer.unref?.();
                entry.retryDelay = Math.min(entry.retryDelay * 2, 64000);
            } else {
                entry.retryDelay = 1000;
            }
        })();
        entry.arming = task;
        try {
            await task;
        } catch (error) {
            this.client._log.error(`Error arming channel watch: ${error}`);
        } finally {
            if (entry.arming === task) entry.arming = undefined;
        }
    }

    _pause(): void {
        for (const entry of this.watches) {
            entry.controller.abort();
            entry.controller = watchController();
            entry.channels.clear();
            entry.arming = undefined;
            if (entry.retryTimer) clearTimeout(entry.retryTimer);
            entry.retryTimer = undefined;
        }
    }

    _resume(): void {
        if (this.blockedAuthorization) return;
        const alive = new Set(this.client.updateManager.watchedChannelIds());
        for (const entry of this.watches) {
            if (entry.stopped) continue;
            for (const channelId of [...entry.channels]) {
                if (!alive.has(channelId)) entry.channels.delete(channelId);
            }
            if (entry.retryTimer) clearTimeout(entry.retryTimer);
            entry.retryTimer = undefined;
            if (entry.channels.size < entry.chats.length) void this.arm(entry);
        }
    }

    get authorizationError(): Error | undefined {
        return this.blockedAuthorization;
    }

    _suspendAuthorization(error: unknown): boolean {
        const code = (error as { errorMessage?: string })?.errorMessage;
        if (![
            "AUTH_KEY_UNREGISTERED", "AUTH_KEY_INVALID", "AUTH_KEY_DUPLICATED",
            "SESSION_REVOKED", "SESSION_EXPIRED", "USER_DEACTIVATED", "USER_DEACTIVATED_BAN",
        ].includes(code ?? "")) return false;
        if (!this.blockedAuthorization) {
            this.blockedAuthorization = error as Error;
            this._pause();
            void this.reportError(error as Error);
        }
        return true;
    }

    _resumeAuthorization(): void {
        if (!this.blockedAuthorization || this.client._destroyed) return;
        this.blockedAuthorization = undefined;
        this._resume();
        void this.client.updateManager.catchUp();
    }

    get watched(): string[] {
        return this.client.updateManager.watchedChannelIds();
    }

    get polling(): ChannelPollingState {
        return this.client.updateManager.polling;
    }

    off(middleware: UpdateMiddleware): void {
        this.remove(middleware);
        for (const [registered, handlers] of this.registrations) {
            if (handlers.includes(middleware)) this.remove(registered);
        }
    }

    catch(handler: (error: Error, update?: AnyUpdate) => unknown): this {
        this.onError = handler;
        return this;
    }

    get handlers(): readonly UpdateMiddleware[] {
        return [...this.chain];
    }

    _destroy(): void {
        for (const entry of this.watches) {
            entry.stopped = true;
            entry.controller.abort();
            if (entry.retryTimer) clearTimeout(entry.retryTimer);
            entry.channels.clear();
        }
        this.watches.clear();
        this.chain.length = 0;
        this.registrations.clear();
        this.onError = undefined;
        this.blockedAuthorization = undefined;
    }

    get state(): UpdateState | undefined {
        const state = this.client.updateManager.state;
        return state ? { ...state } : undefined;
    }

    async catchUp(): Promise<void> {
        await this.client.updateManager.catchUp();
    }

    async _dispatch(update: AnyUpdate): Promise<void> {
        if (
            update instanceof UpdateConnectionState &&
            update.state === UpdateConnectionState.connected
        ) {
            this._resume();
        }
        if (!this.chain.length) return;
        const expanded = expandShortMessage(
            update,
            this.client._selfInputPeer?.userId,
        );
        if (expanded) {
            fieldsOf(expanded)._entities = fieldsOf(update)._entities;
            update = expanded;
        }
        if (update && typeof update === "object" && !("state" in update)) {
            Object.defineProperty(update, "state", {
                value: {},
                enumerable: false,
                writable: true,
            });
        }
        this.attachContext(update);
        const chain = [...this.chain];
        try {
            await runChain(chain, update, async () => {});
        } catch (e) {
            await this.reportError(e as Error, update);
        }
    }

    private attachContext(event: object, update: AnyUpdate = event as AnyUpdate): void {
        if ("context" in event) return;
        let context: UpdateContext | undefined;
        Object.defineProperty(event, "context", {
            get: () => context ??= new UpdateContext(
                this.client, peerOf(update), fieldsOf(update)._entities,
            ),
            enumerable: false,
        });
    }

    private register(
        middleware: UpdateMiddleware,
        handler: UpdateMiddleware | UpdateMiddleware[],
    ): Unsubscribe {
        this.registrations.set(middleware, Array.isArray(handler) ? handler.slice() : [handler]);
        return this.use(middleware);
    }

    private remove(middleware: UpdateMiddleware): void {
        this.registrations.delete(middleware);
        const index = this.chain.indexOf(middleware);
        if (index >= 0) this.chain.splice(index, 1);
    }

    private async reportError(error: Error, update?: AnyUpdate): Promise<void> {
        if (this.onError) {
            try {
                await this.onError(error, update);
                return;
            } catch (e) {
                error = e as Error;
            }
        }
        if (this.client._errorHandler) {
            try {
                await this.client._errorHandler(error);
                return;
            } catch (handlerError) {
                error = handlerError as Error;
            }
        }
        this.client._log.error(`Error in the update chain: ${error}`);
    }

    private chatMatcher(
        options: OnOptions,
    ): (update: AnyUpdate) => Promise<boolean> {
        if (options.chats === undefined) return async () => true;
        let ids: Set<string> | undefined;
        const wanted = isArrayLike(options.chats)
            ? (options.chats as EntityLike[])
            : [options.chats as EntityLike];
        return async (update: AnyUpdate) => {
            if (!ids) {
                ids = new Set((await _intoIdSet(this.client, wanted)) ?? []);
            }
            const peer = peerOf(update);
            const listed = peer !== undefined && ids.has(peer);
            return options.blacklistChats ? !listed : listed;
        };
    }

    private builderMiddleware(
        builder: EventBuilder,
        run: UpdateMiddleware,
        options: OnOptions,
    ): UpdateMiddleware {
        const matchesChat = this.chatMatcher(options);
        builder.client = this.client;
        return async (update, next) => {
            if (!builder.resolved) await builder.resolve(this.client);
            let event = builder.build(
                update,
                undefined,
                this.client._selfInputPeer
                    ? this.client._selfInputPeer.userId
                    : undefined,
            );
            if (!event) return next();
            event._client = this.client;
            if ("_eventName" in event) {
                event.originalUpdate = update;
                event._entities = update._entities ?? new Map();
                event._setClient(this.client);
            }
            this.attachContext(event, update);
            if (!(await builder.filter(event))) return next();
            if (!(await matchesChat(update))) return next();
            if (options.func && !(await options.func(update))) return next();
            await run(event, next);
        };
    }
}

function compose(handler: UpdateMiddleware | UpdateMiddleware[]): UpdateMiddleware {
    if (!Array.isArray(handler)) {
        if (typeof handler !== "function") {
            throw new TypeError("Update handler must be a function");
        }
        return handler;
    }
    const handlers = handler.slice();
    for (const item of handlers) {
        if (typeof item !== "function") {
            throw new TypeError("Update handler must be a function");
        }
    }
    return (update, next) => runChain(handlers, update, next);
}

async function runChain(
    handlers: readonly UpdateMiddleware[],
    update: AnyUpdate,
    next: NextFn,
): Promise<void> {
    let last = -1;
    const run = async (index: number): Promise<void> => {
        if (index <= last) throw new Error("next() called multiple times");
        last = index;
        if (index >= handlers.length) return next();
        await handlers[index]!(update, () => run(index + 1));
    };
    await run(0);
}

function watchController(): AbortController {
    const controller = new AbortController();
    setMaxListeners(0, controller.signal);
    return controller;
}
