import { Api } from "../tl";
import type { TelegramClient } from "../client/TelegramClient";
import type { Entity, EntityLike } from "../define";
import { EventBuilder, EventCommonSender, _intoIdSet } from "./common";
import bigInt from "big-integer";

export interface UserUpdateInterface {
    chats?: EntityLike[];
    blacklistChats?: boolean;
    func?: CallableFunction;
}

type TypingUpdate =
    | Api.UpdateUserTyping
    | Api.UpdateChatUserTyping
    | Api.UpdateChannelUserTyping;

type UserUpdateType = Api.UpdateUserStatus | TypingUpdate;

export class UserUpdate extends EventBuilder {
    constructor(params: UserUpdateInterface = {}) {
        super({
            chats: params.chats,
            blacklistChats: params.blacklistChats,
            func: params.func,
        });
    }

    async _resolve(client: TelegramClient) {
        this.chats = await _intoIdSet(client, this.chats);
    }

    build(update: Api.TypeUpdate): UserUpdateEvent | undefined {
        if (update instanceof Api.UpdateUserStatus) {
            return new UserUpdateEvent(update);
        }
        if (
            update instanceof Api.UpdateUserTyping ||
            update instanceof Api.UpdateChatUserTyping ||
            update instanceof Api.UpdateChannelUserTyping
        ) {
            return new UserUpdateEvent(update);
        }
        return undefined;
    }

    filter(event: UserUpdateEvent): UserUpdateEvent | undefined {
        if (this.chats != undefined) {
            const userId = event.userId?.toString();
            if (!userId || !this.chats.includes(userId)) {
                if (!this.blacklistChats) {
                    return undefined;
                }
            } else if (this.blacklistChats) {
                return undefined;
            }
        }
        if (this.func && !this.func(event)) {
            return undefined;
        }
        return event;
    }
}

export class UserUpdateEvent extends EventCommonSender {
    _eventName = "UserUpdate";

    originalUpdate: (UserUpdateType) & { _entities?: Map<string, Entity> };
    private _status?: Api.TypeUserStatus;
    private _action?: Api.TypeSendMessageAction;
    private _userId: bigInt.BigInteger;
    private _chatId?: bigInt.BigInteger;

    constructor(update: UserUpdateType) {
        let chatPeer: Api.TypePeer | undefined;
        let userId: bigInt.BigInteger;

        if (update instanceof Api.UpdateUserStatus) {
            userId = update.userId;
            chatPeer = new Api.PeerUser({ userId: update.userId });
        } else if (update instanceof Api.UpdateUserTyping) {
            userId = update.userId;
            chatPeer = new Api.PeerUser({ userId: update.userId });
        } else if (update instanceof Api.UpdateChatUserTyping) {
            userId = update.fromId instanceof Api.PeerUser
                ? update.fromId.userId
                : bigInt.zero;
            chatPeer = new Api.PeerChat({ chatId: update.chatId });
        } else {
            userId = update.fromId instanceof Api.PeerUser
                ? update.fromId.userId
                : bigInt.zero;
            chatPeer = new Api.PeerChannel({ channelId: update.channelId });
        }

        super({ chatPeer });

        this.originalUpdate = update;
        this._userId = userId;

        if (update instanceof Api.UpdateUserStatus) {
            this._status = update.status;
        } else {
            this._action = update.action;
            if (update instanceof Api.UpdateChatUserTyping) {
                this._chatId = update.chatId;
            } else if (update instanceof Api.UpdateChannelUserTyping) {
                this._chatId = update.channelId;
            }
        }
    }

    get userId(): bigInt.BigInteger {
        return this._userId;
    }

    get status(): Api.TypeUserStatus | undefined {
        return this._status;
    }

    get action(): Api.TypeSendMessageAction | undefined {
        return this._action;
    }

    get online(): boolean | undefined {
        if (!this._status) return undefined;
        return this._status instanceof Api.UserStatusOnline;
    }

    get offline(): boolean | undefined {
        if (!this._status) return undefined;
        return this._status instanceof Api.UserStatusOffline;
    }

    get until(): Date | undefined {
        if (this._status instanceof Api.UserStatusOnline) {
            return new Date(this._status.expires * 1000);
        }
        return undefined;
    }

    get lastSeen(): Date | undefined {
        if (this._status instanceof Api.UserStatusOffline) {
            return new Date(this._status.wasOnline * 1000);
        }
        return undefined;
    }

    get recently(): boolean | undefined {
        if (!this._status) return undefined;
        return this._status instanceof Api.UserStatusRecently;
    }

    get withinWeeks(): boolean | undefined {
        if (!this._status) return undefined;
        return this._status instanceof Api.UserStatusLastWeek;
    }

    get withinMonths(): boolean | undefined {
        if (!this._status) return undefined;
        return this._status instanceof Api.UserStatusLastMonth;
    }

    get typing(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageTypingAction;
    }

    get cancel(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageCancelAction;
    }

    get recording(): boolean | undefined {
        if (!this._action) return undefined;
        return (
            this._action instanceof Api.SendMessageRecordVideoAction ||
            this._action instanceof Api.SendMessageRecordAudioAction ||
            this._action instanceof Api.SendMessageRecordRoundAction
        );
    }

    get uploading(): boolean | undefined {
        if (!this._action) return undefined;
        return (
            this._action instanceof Api.SendMessageUploadVideoAction ||
            this._action instanceof Api.SendMessageUploadAudioAction ||
            this._action instanceof Api.SendMessageUploadPhotoAction ||
            this._action instanceof Api.SendMessageUploadDocumentAction ||
            this._action instanceof Api.SendMessageUploadRoundAction
        );
    }

    get audio(): boolean | undefined {
        if (!this._action) return undefined;
        return (
            this._action instanceof Api.SendMessageRecordAudioAction ||
            this._action instanceof Api.SendMessageUploadAudioAction
        );
    }

    get video(): boolean | undefined {
        if (!this._action) return undefined;
        return (
            this._action instanceof Api.SendMessageRecordVideoAction ||
            this._action instanceof Api.SendMessageUploadVideoAction
        );
    }

    get round(): boolean | undefined {
        if (!this._action) return undefined;
        return (
            this._action instanceof Api.SendMessageRecordRoundAction ||
            this._action instanceof Api.SendMessageUploadRoundAction
        );
    }

    get photo(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageUploadPhotoAction;
    }

    get document(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageUploadDocumentAction;
    }

    get geo(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageGeoLocationAction;
    }

    get contact(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageChooseContactAction;
    }

    get playing(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageGamePlayAction;
    }

    get sticker(): boolean | undefined {
        if (!this._action) return undefined;
        return this._action instanceof Api.SendMessageChooseStickerAction;
    }

    get uploadProgress(): number | undefined {
        if (
            this._action instanceof Api.SendMessageUploadVideoAction ||
            this._action instanceof Api.SendMessageUploadAudioAction ||
            this._action instanceof Api.SendMessageUploadPhotoAction ||
            this._action instanceof Api.SendMessageUploadDocumentAction ||
            this._action instanceof Api.SendMessageUploadRoundAction
        ) {
            return this._action.progress;
        }
        return undefined;
    }

    async getUser(): Promise<Api.User | undefined> {
        if (!this._client) return undefined;
        try {
            const result = await this._client.getEntity(
                new Api.PeerUser({ userId: this._userId })
            );
            if (result instanceof Api.User) {
                return result;
            }
        } catch {
            return undefined;
        }
        return undefined;
    }

    async getInputUser(): Promise<Api.InputUser | Api.InputPeerUser | undefined> {
        if (!this._client) return undefined;
        try {
            return await this._client.getInputEntity(
                new Api.PeerUser({ userId: this._userId })
            ) as Api.InputUser | Api.InputPeerUser;
        } catch {
            return undefined;
        }
    }
}
