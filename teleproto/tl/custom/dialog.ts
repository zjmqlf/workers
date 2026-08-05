import type { TelegramClient } from "../../client/TelegramClient";
import { Api } from "../api";
import type { Entity } from "../../define";
import { getDisplayName, getInputPeer, getPeerId } from "../../Utils";
import { Draft } from "./draft";
import { returnBigInt } from "../../Helpers";
import bigInt from "big-integer";
import type { SendMessageParams } from "../../client/messages";
import type { DeleteHistoryParams } from "../../client/chats";

export class Dialog {
    _client: TelegramClient;
    dialog: Api.Dialog;
    pinned: boolean;
    folderId?: number;
    archived: boolean;
    message?: Api.Message;
    date?: number;
    entity?: Entity;
    inputEntity: Api.TypeInputPeer;
    id?: bigInt.BigInteger;
    name?: string;
    title?: string;
    unreadCount: number;
    unreadMentionsCount: number;
    draft: Draft;
    isUser: boolean;
    isGroup: boolean;
    isChannel: boolean;

    constructor(
        client: TelegramClient,
        dialog: Api.Dialog,
        entities: Map<string, Entity>,
        message?: Api.Message
    ) {
        this._client = client;
        this.dialog = dialog;
        this.pinned = !!dialog.pinned;
        this.folderId = dialog.folderId;
        this.archived = dialog.folderId != undefined;
        this.message = message;
        this.date = this.message?.date;
        this.entity = entities.get(getPeerId(dialog.peer));
        this.inputEntity = getInputPeer(this.entity);
        if (this.entity) {
            this.id = returnBigInt(getPeerId(this.entity));
            this.name = this.title = getDisplayName(this.entity);
        }

        this.unreadCount = dialog.unreadCount;
        this.unreadMentionsCount = dialog.unreadMentionsCount;
        if (!this.entity) {
            throw new Error("Entity not found for dialog");
        }
        this.draft = new Draft(client, this.entity, this.dialog.draft);
        this.isUser = this.entity instanceof Api.User;
        this.isGroup = !!(
            this.entity instanceof Api.Chat ||
            this.entity instanceof Api.ChatForbidden ||
            (this.entity instanceof Api.Channel && this.entity.megagroup)
        );
        this.isChannel = this.entity instanceof Api.Channel;
    }

    async send(params: string | SendMessageParams) {
        return this._client.sendMessage(
            this.inputEntity,
            typeof params === "string" ? { message: params } : params
        );
    }

    async markAsRead(params?: { clearMentions?: boolean }) {
        return this._client.markAsRead(this.inputEntity, undefined, params);
    }

    async archive() {
        this.archived = true;
        this.folderId = 1;
        return this._client.editPeerFolders(this.inputEntity, 1);
    }

    async unarchive() {
        this.archived = false;
        this.folderId = 0;
        return this._client.editPeerFolders(this.inputEntity, 0);
    }

    async pin(pinned: boolean = true) {
        this.pinned = pinned;
        return this._client.invoke(
            new Api.messages.ToggleDialogPin({
                peer: new Api.InputDialogPeer({
                    peer: this.inputEntity,
                }) as unknown as Api.TypeEntityLike,
                pinned: pinned || undefined,
            })
        );
    }

    async unpin() {
        return this.pin(false);
    }

    async delete(params?: DeleteHistoryParams) {
        if (this.isChannel) {
            return this._client.leaveChannel(this.inputEntity);
        }
        return this._client.deleteHistory(this.inputEntity, params);
    }
}
