import { Api } from "../tl";
import type { TelegramClient } from "../client/TelegramClient";
import type { Entity, EntityLike } from "../define";
import { EventBuilder, EventCommon, _intoIdSet } from "./common";
import bigInt from "big-integer";

export interface MessageReadInterface {
    chats?: EntityLike[];
    blacklistChats?: boolean;
    inbox?: boolean;
    func?: CallableFunction;
}

type ReadUpdateType =
    | Api.UpdateReadHistoryInbox
    | Api.UpdateReadHistoryOutbox
    | Api.UpdateReadChannelInbox
    | Api.UpdateReadChannelOutbox
    | Api.UpdateReadMessagesContents
    | Api.UpdateChannelReadMessagesContents;

export class MessageRead extends EventBuilder {
    private _inbox?: boolean;

    constructor(params: MessageReadInterface = {}) {
        super({
            chats: params.chats,
            blacklistChats: params.blacklistChats,
            func: params.func,
        });
        this._inbox = params.inbox;
    }

    async _resolve(client: TelegramClient) {
        await super._resolve(client);
    }

    build(update: Api.TypeUpdate): MessageReadEvent | undefined {
        if (
            update instanceof Api.UpdateReadHistoryInbox ||
            update instanceof Api.UpdateReadHistoryOutbox ||
            update instanceof Api.UpdateReadChannelInbox ||
            update instanceof Api.UpdateReadChannelOutbox ||
            update instanceof Api.UpdateReadMessagesContents ||
            update instanceof Api.UpdateChannelReadMessagesContents
        ) {
            return new MessageReadEvent(update);
        }
        return undefined;
    }

    filter(event: MessageReadEvent): MessageReadEvent | undefined {
        if (this._inbox !== undefined) {
            if (this._inbox !== event.inbox) {
                return undefined;
            }
        }

        if (this.chats !== undefined && event.chatId) {
            const chatIdStr = event.chatId.toString();
            const inside = this.chats.includes(chatIdStr);
            if (inside === this.blacklistChats) {
                return undefined;
            }
        }

        if (this.func && !this.func(event)) {
            return undefined;
        }

        return event;
    }
}

export class MessageReadEvent extends EventCommon {
    _eventName = "MessageRead";

    originalUpdate: ReadUpdateType & { _entities?: Map<string, Entity> };
    private _outbox: boolean;
    private _contents: boolean;
    private _maxId: number;
    private _messageIds: number[];

    constructor(update: ReadUpdateType) {
        let chatPeer: Api.TypePeer | undefined;
        let isOutbox = false;
        let isContents = false;
        let maxId = 0;
        let messageIds: number[] = [];

        if (update instanceof Api.UpdateReadHistoryInbox) {
            chatPeer = update.peer;
            isOutbox = false;
            maxId = update.maxId;
        } else if (update instanceof Api.UpdateReadHistoryOutbox) {
            chatPeer = update.peer;
            isOutbox = true;
            maxId = update.maxId;
        } else if (update instanceof Api.UpdateReadChannelInbox) {
            chatPeer = new Api.PeerChannel({ channelId: update.channelId });
            isOutbox = false;
            maxId = update.maxId;
        } else if (update instanceof Api.UpdateReadChannelOutbox) {
            chatPeer = new Api.PeerChannel({ channelId: update.channelId });
            isOutbox = true;
            maxId = update.maxId;
        } else if (update instanceof Api.UpdateReadMessagesContents) {
            isContents = true;
            messageIds = update.messages;
            maxId = messageIds.length > 0 ? Math.max(...messageIds) : 0;
        } else if (update instanceof Api.UpdateChannelReadMessagesContents) {
            chatPeer = new Api.PeerChannel({ channelId: update.channelId });
            isContents = true;
            messageIds = update.messages;
            maxId = messageIds.length > 0 ? Math.max(...messageIds) : 0;
        }

        super({ chatPeer });

        this.originalUpdate = update;
        this._outbox = isOutbox;
        this._contents = isContents;
        this._maxId = maxId;
        this._messageIds = messageIds;
    }

    get maxId(): number {
        return this._maxId;
    }

    get outbox(): boolean {
        return this._outbox;
    }

    get inbox(): boolean {
        return !this._outbox;
    }

    get contents(): boolean {
        return this._contents;
    }

    get messageIds(): number[] {
        return this._messageIds;
    }

    get isRead(): boolean {
        return this._maxId > 0 || this._messageIds.length > 0;
    }

    async getMessages(): Promise<Api.Message[] | undefined> {
        if (!this._client || this._messageIds.length === 0) {
            return undefined;
        }
        if (!this.chatId) {
            return undefined;
        }
        try {
            return await this._client.getMessages(this.chatId, {
                ids: this._messageIds,
            });
        } catch {
            return undefined;
        }
    }
}
