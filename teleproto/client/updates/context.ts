import type { TelegramClient } from "../TelegramClient";
import type { Entity } from "../../define";
import { EventCommon } from "../../events/common";
import { getPeer } from "../../Utils";
import bigInt from "big-integer";

export class UpdateContext extends EventCommon {
    private pendingChat?: Promise<Entity | undefined>;

    constructor(client: TelegramClient, peerId?: string, entities?: Map<string, Entity>) {
        super({ chatPeer: peerId === undefined ? undefined : getPeer(bigInt(peerId)) });
        this._entities = entities ?? new Map();
        this._setClient(client);
    }

    get peers(): ReadonlyMap<string, Entity> {
        return this._entities;
    }

    async getChat(): Promise<Entity | undefined> {
        if (!this.pendingChat) {
            this.pendingChat = super.getChat();
        }
        const pending = this.pendingChat;
        try {
            return await pending;
        } finally {
            if (this.pendingChat === pending) this.pendingChat = undefined;
        }
    }
}

export type WithUpdateContext<T> = T & { readonly context: UpdateContext };
