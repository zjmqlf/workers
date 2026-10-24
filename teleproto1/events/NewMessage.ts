import {
    _intoIdSet,
    DefaultEventInterface,
    EventBuilder,
    EventCommon,
} from "./common";
import type { Entity, EntityLike } from "../define";
import type { TelegramClient } from "../client/TelegramClient";
import { Api } from "../tl";
import bigInt from "big-integer";

export interface NewMessageInterface extends DefaultEventInterface {
    func?: { (event: NewMessageEvent): boolean };
    incoming?: boolean;
    outgoing?: boolean;
    fromUsers?: EntityLike[];
    forwards?: boolean;
    pattern?: RegExp;
}

export class NewMessage extends EventBuilder {
    func?: { (event: NewMessageEvent): boolean };
    incoming?: boolean;
    outgoing?: boolean;
    fromUsers?: EntityLike[];
    forwards?: boolean;
    pattern?: RegExp;
    private readonly _noCheck: boolean;

    constructor(newMessageParams: NewMessageInterface = {}) {
        let {
            chats,
            func,
            incoming,
            outgoing,
            fromUsers,
            forwards,
            pattern,
            blacklistChats = false,
        } = newMessageParams;
        if (incoming && outgoing) {
            incoming = outgoing = undefined;
        } else if (incoming != undefined && outgoing == undefined) {
            outgoing = !incoming;
        } else if (outgoing != undefined && incoming == undefined) {
            incoming = !outgoing;
        } else if (outgoing == false && incoming == false) {
            throw new Error(
                "Don't create an event handler if you don't want neither incoming nor outgoing!"
            );
        }
        super({ chats, blacklistChats, func });
        this.incoming = incoming;
        this.outgoing = outgoing;
        this.fromUsers = fromUsers;
        this.forwards = forwards;
        this.pattern = pattern;
        this._noCheck = [
            incoming,
            outgoing,
            chats,
            pattern,
            fromUsers,
            forwards,
            func,
        ].every((v) => v == undefined);
    }

    async _resolve(client: TelegramClient) {
        await super._resolve(client);
        this.fromUsers = await _intoIdSet(client, this.fromUsers);
    }

    build(
        update: Api.TypeUpdate | Api.TypeUpdates,
        callback: undefined,
        selfId: bigInt.BigInteger
    ) {
        if (
            update instanceof Api.UpdateNewMessage ||
            update instanceof Api.UpdateNewChannelMessage
        ) {
            if (!(update.message instanceof Api.Message)) {
                return undefined;
            }
            const event = new NewMessageEvent(update.message, update);
            this.addAttributes(event);
            return event;
        } else if (update instanceof Api.UpdateShortMessage) {
            return new NewMessageEvent(
                new Api.Message({
                    out: update.out,
                    mentioned: update.mentioned,
                    mediaUnread: update.mediaUnread,
                    silent: update.silent,
                    id: update.id,
                    peerId: new Api.PeerUser({ userId: update.userId }),
                    fromId: new Api.PeerUser({
                        userId: update.out ? selfId : update.userId,
                    }),
                    message: update.message,
                    date: update.date,
                    fwdFrom: update.fwdFrom,
                    viaBotId: update.viaBotId,
                    replyTo: update.replyTo,
                    entities: update.entities,
                    ttlPeriod: update.ttlPeriod,
                }),
                update
            );
        } else if (update instanceof Api.UpdateShortChatMessage) {
            return new NewMessageEvent(
                new Api.Message({
                    out: update.out,
                    mentioned: update.mentioned,
                    mediaUnread: update.mediaUnread,
                    silent: update.silent,
                    id: update.id,
                    peerId: new Api.PeerChat({ chatId: update.chatId }),
                    fromId: new Api.PeerUser({
                        userId: update.out ? selfId : update.fromId,
                    }),
                    message: update.message,
                    date: update.date,
                    fwdFrom: update.fwdFrom,
                    viaBotId: update.viaBotId,
                    replyTo: update.replyTo,
                    entities: update.entities,
                    ttlPeriod: update.ttlPeriod,
                }),
                update
            );
        }
    }

    filter(event: NewMessageEvent) {
        if (this._noCheck) {
            return event;
        }
        if (this.incoming && event.message.out) {
            return;
        }
        if (this.outgoing && !event.message.out) {
            return;
        }
        if (this.forwards != undefined) {
            if (this.forwards != !!event.message.fwdFrom) {
                return;
            }
        }

        if (this.fromUsers != undefined) {
            if (
                !event.message.senderId ||
                !this.fromUsers.includes(event.message.senderId.toString())
            ) {
                return;
            }
        }

        if (this.pattern) {
            const match = event.message.message?.match(this.pattern);
            if (!match) {
                return;
            }
            event.message.patternMatch = match;
        }
        return super.filter(event);
    }

    addAttributes(update: any) {
    }
}

export class NewMessageEvent extends EventCommon {
    message: Api.Message;
    originalUpdate: (Api.TypeUpdate | Api.TypeUpdates) & {
        _entities?: Map<number, Entity>;
    };

    constructor(
        message: Api.Message,
        originalUpdate: Api.TypeUpdate | Api.TypeUpdates
    ) {
        super({
            msgId: message.id,
            chatPeer: message.peerId,
            broadcast: message.post,
        });
        this.originalUpdate = originalUpdate;
        this.message = message;
    }

    _setClient(client: TelegramClient) {
        super._setClient(client);
        const m = this.message;
        try {
            m._finishInit(
                client,
                this.originalUpdate._entities || new Map(),
                undefined
            );
        } catch (e) {
            client._log.error(
                "Got error while trying to finish init message with id " + m.id,
                e
            );
            if (client._errorHandler) {
                client._errorHandler(e as Error);
            }
        }
    }

    get patternMatch(): RegExpMatchArray | undefined {
        return this.message.patternMatch;
    }

    async reply(params: {
        message?: string;
        parseMode?: any;
        formattingEntities?: Api.TypeMessageEntity[];
        file?: any;
        linkPreview?: boolean;
        silent?: boolean;
    }): Promise<Api.Message | undefined> {
        if (!this._client) return undefined;
        return this._client.sendMessage(this.message.peerId!, {
            message: params.message,
            parseMode: params.parseMode,
            formattingEntities: params.formattingEntities,
            file: params.file,
            linkPreview: params.linkPreview,
            silent: params.silent,
            replyTo: this.message.id,
        });
    }

    async respond(params: {
        message?: string;
        parseMode?: any;
        formattingEntities?: Api.TypeMessageEntity[];
        file?: any;
        linkPreview?: boolean;
        silent?: boolean;
    }): Promise<Api.Message | undefined> {
        if (!this._client) return undefined;
        return this._client.sendMessage(this.message.peerId!, {
            message: params.message,
            parseMode: params.parseMode,
            formattingEntities: params.formattingEntities,
            file: params.file,
            linkPreview: params.linkPreview,
            silent: params.silent,
        });
    }

    async delete(params: { revoke?: boolean } = {}): Promise<Api.messages.AffectedMessages[] | undefined> {
        if (!this._client) return undefined;
        return this._client.deleteMessages(
            this.message.peerId!,
            [this.message.id],
            params
        );
    }

    async forward(chat: EntityLike): Promise<Api.Message[] | undefined> {
        if (!this._client) return undefined;
        return this._client.forwardMessages(chat, {
            messages: [this.message.id],
            fromPeer: this.message.peerId!,
        });
    }

    async edit(params: {
        message?: string;
        parseMode?: any;
        formattingEntities?: Api.TypeMessageEntity[];
        file?: any;
    }): Promise<Api.Message | undefined> {
        if (!this._client) return undefined;
        return this._client.editMessage(this.message.peerId!, {
            message: this.message.id,
            text: params.message,
            parseMode: params.parseMode,
            formattingEntities: params.formattingEntities,
            file: params.file,
        });
    }

    async markRead(): Promise<boolean | undefined> {
        if (!this._client) return undefined;
        return this._client.markAsRead(this.message.peerId!, this.message.id);
    }

    async pin(params?: { notify?: boolean; pmOneside?: boolean }): Promise<Api.Message | undefined> {
        if (!this._client) return undefined;
        return this._client.pinMessage(this.message.peerId!, this.message.id, params);
    }

    async unpin(): Promise<void> {
        if (!this._client) return undefined;
        await this._client.unpinMessage(this.message.peerId!, this.message.id);
    }
}
