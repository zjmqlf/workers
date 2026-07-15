import { Api } from "../tl";
import type { TelegramClient } from "../client/TelegramClient";
import type { Entity, EntityLike } from "../define";
import { EventBuilder, EventCommon, _intoIdSet } from "./common";
import bigInt from "big-integer";

export interface ChatActionInterface {
    chats?: EntityLike[];
    blacklistChats?: boolean;
    func?: CallableFunction;
}

type ChatActionUpdate =
    | Api.UpdateChatParticipantAdd
    | Api.UpdateChatParticipantDelete
    | Api.UpdateChatParticipant
    | Api.UpdateChannelParticipant
    | Api.UpdatePinnedMessages
    | Api.UpdatePinnedChannelMessages
    | Api.UpdateNewMessage
    | Api.UpdateNewChannelMessage;

export class ChatAction extends EventBuilder {
    constructor(params: ChatActionInterface = {}) {
        super({
            chats: params.chats,
            blacklistChats: params.blacklistChats,
            func: params.func,
        });
    }

    build(update: Api.TypeUpdate): ChatActionEvent | undefined {
        if (
            update instanceof Api.UpdateChatParticipantAdd ||
            update instanceof Api.UpdateChatParticipantDelete ||
            update instanceof Api.UpdateChatParticipant ||
            update instanceof Api.UpdateChannelParticipant
        ) {
            return new ChatActionEvent(update);
        }

        if (
            update instanceof Api.UpdatePinnedMessages ||
            update instanceof Api.UpdatePinnedChannelMessages
        ) {
            return new ChatActionEvent(update);
        }

        if (
            update instanceof Api.UpdateNewMessage ||
            update instanceof Api.UpdateNewChannelMessage
        ) {
            const msg = update.message;
            if (msg instanceof Api.MessageService && msg.action) {
                if (
                    msg.action instanceof Api.MessageActionChatCreate ||
                    msg.action instanceof Api.MessageActionChannelCreate ||
                    msg.action instanceof Api.MessageActionChatEditTitle ||
                    msg.action instanceof Api.MessageActionChatEditPhoto ||
                    msg.action instanceof Api.MessageActionChatDeletePhoto ||
                    msg.action instanceof Api.MessageActionChatAddUser ||
                    msg.action instanceof Api.MessageActionChatDeleteUser ||
                    msg.action instanceof Api.MessageActionChatJoinedByLink ||
                    msg.action instanceof Api.MessageActionPinMessage ||
                    msg.action instanceof Api.MessageActionChatJoinedByRequest
                ) {
                    return new ChatActionEvent(update, msg);
                }
            }
        }

        return undefined;
    }
}

export class ChatActionEvent extends EventCommon {
    _eventName = "ChatAction";

    originalUpdate: ChatActionUpdate & { _entities?: Map<string, Entity> };
    private _actionMessage?: Api.MessageService;
    private _addedBy?: bigInt.BigInteger;
    private _kickedBy?: bigInt.BigInteger;
    private _userIds: bigInt.BigInteger[];
    private _newTitle?: string;
    private _newPhoto?: Api.TypePhoto;
    private _pinnedIds: number[];
    private _pinned: boolean;
    private _created: boolean;

    constructor(update: ChatActionUpdate, actionMessage?: Api.MessageService) {
        let chatPeer: Api.TypePeer | undefined;

        if (update instanceof Api.UpdateChatParticipantAdd) {
            chatPeer = new Api.PeerChat({ chatId: update.chatId });
        } else if (update instanceof Api.UpdateChatParticipantDelete) {
            chatPeer = new Api.PeerChat({ chatId: update.chatId });
        } else if (update instanceof Api.UpdateChatParticipant) {
            chatPeer = new Api.PeerChat({ chatId: update.chatId });
        } else if (update instanceof Api.UpdateChannelParticipant) {
            chatPeer = new Api.PeerChannel({ channelId: update.channelId });
        } else if (update instanceof Api.UpdatePinnedMessages) {
            chatPeer = update.peer;
        } else if (update instanceof Api.UpdatePinnedChannelMessages) {
            chatPeer = new Api.PeerChannel({ channelId: update.channelId });
        } else if (actionMessage) {
            chatPeer = actionMessage.peerId;
        }

        super({ chatPeer });

        this.originalUpdate = update;
        this._actionMessage = actionMessage;
        this._userIds = [];
        this._pinnedIds = [];
        this._pinned = false;
        this._created = false;

        this._parseUpdate(update, actionMessage);
    }

    private _parseUpdate(update: ChatActionUpdate, actionMessage?: Api.MessageService) {
        if (update instanceof Api.UpdateChatParticipantAdd) {
            this._userIds = [update.userId];
            this._addedBy = update.inviterId;
        } else if (update instanceof Api.UpdateChatParticipantDelete) {
            this._userIds = [update.userId];
        } else if (update instanceof Api.UpdateChatParticipant) {
            this._userIds = [update.userId];
            if (update.newParticipant && !update.prevParticipant) {
                this._addedBy = update.actorId;
            } else if (!update.newParticipant && update.prevParticipant) {
                this._kickedBy = update.actorId;
            }
        } else if (update instanceof Api.UpdateChannelParticipant) {
            this._userIds = [update.userId];
            if (update.newParticipant && !update.prevParticipant) {
                this._addedBy = update.actorId;
            } else if (!update.newParticipant && update.prevParticipant) {
                this._kickedBy = update.actorId;
            }
        }

        if (update instanceof Api.UpdatePinnedMessages) {
            this._pinnedIds = update.messages;
            this._pinned = update.pinned ?? true;
        } else if (update instanceof Api.UpdatePinnedChannelMessages) {
            this._pinnedIds = update.messages;
            this._pinned = update.pinned ?? true;
        }

        if (actionMessage?.action) {
            const action = actionMessage.action;

            if (action instanceof Api.MessageActionChatCreate) {
                this._created = true;
                this._newTitle = action.title;
                this._userIds = action.users;
            } else if (action instanceof Api.MessageActionChannelCreate) {
                this._created = true;
                this._newTitle = action.title;
            } else if (action instanceof Api.MessageActionChatEditTitle) {
                this._newTitle = action.title;
            } else if (action instanceof Api.MessageActionChatEditPhoto) {
                this._newPhoto = action.photo;
            } else if (action instanceof Api.MessageActionChatAddUser) {
                this._userIds = action.users;
                if (actionMessage.fromId instanceof Api.PeerUser) {
                    this._addedBy = actionMessage.fromId.userId;
                }
            } else if (action instanceof Api.MessageActionChatDeleteUser) {
                this._userIds = [action.userId];
                if (actionMessage.fromId instanceof Api.PeerUser) {
                    if (!action.userId.eq(actionMessage.fromId.userId)) {
                        this._kickedBy = actionMessage.fromId.userId;
                    }
                }
            } else if (action instanceof Api.MessageActionChatJoinedByLink) {
                if (actionMessage.fromId instanceof Api.PeerUser) {
                    this._userIds = [actionMessage.fromId.userId];
                }
                this._addedBy = action.inviterId;
            } else if (action instanceof Api.MessageActionChatJoinedByRequest) {
                if (actionMessage.fromId instanceof Api.PeerUser) {
                    this._userIds = [actionMessage.fromId.userId];
                }
            } else if (action instanceof Api.MessageActionPinMessage) {
                if (actionMessage.replyTo instanceof Api.MessageReplyHeader && actionMessage.replyTo.replyToMsgId !== undefined) {
                    this._pinnedIds = [actionMessage.replyTo.replyToMsgId];
                }
                this._pinned = true;
            }
        }
    }

    get actionMessage(): Api.MessageService | undefined {
        return this._actionMessage;
    }

    get userJoined(): boolean {
        const action = this._actionMessage?.action;
        return (
            action instanceof Api.MessageActionChatJoinedByLink ||
            action instanceof Api.MessageActionChatJoinedByRequest ||
            (this.originalUpdate instanceof Api.UpdateChatParticipant &&
                !!this.originalUpdate.newParticipant &&
                !this.originalUpdate.prevParticipant) ||
            (this.originalUpdate instanceof Api.UpdateChannelParticipant &&
                !!this.originalUpdate.newParticipant &&
                !this.originalUpdate.prevParticipant)
        );
    }

    get userAdded(): boolean {
        return (
            this._actionMessage?.action instanceof Api.MessageActionChatAddUser ||
            this.originalUpdate instanceof Api.UpdateChatParticipantAdd
        );
    }

    get userLeft(): boolean {
        const action = this._actionMessage?.action;
        if (action instanceof Api.MessageActionChatDeleteUser) {
            if (this._actionMessage?.fromId instanceof Api.PeerUser) {
                return action.userId.eq(this._actionMessage.fromId.userId);
            }
        }
        if (
            this.originalUpdate instanceof Api.UpdateChatParticipant ||
            this.originalUpdate instanceof Api.UpdateChannelParticipant
        ) {
            return (
                !this.originalUpdate.newParticipant &&
                !!this.originalUpdate.prevParticipant &&
                this.originalUpdate.userId.eq(this.originalUpdate.actorId)
            );
        }
        return false;
    }

    get userKicked(): boolean {
        const action = this._actionMessage?.action;
        if (action instanceof Api.MessageActionChatDeleteUser) {
            if (this._actionMessage?.fromId instanceof Api.PeerUser) {
                return !action.userId.eq(this._actionMessage.fromId.userId);
            }
        }
        if (
            this.originalUpdate instanceof Api.UpdateChatParticipant ||
            this.originalUpdate instanceof Api.UpdateChannelParticipant
        ) {
            return (
                !this.originalUpdate.newParticipant &&
                !!this.originalUpdate.prevParticipant &&
                !this.originalUpdate.userId.eq(this.originalUpdate.actorId)
            );
        }
        return this.originalUpdate instanceof Api.UpdateChatParticipantDelete;
    }

    get userIds(): bigInt.BigInteger[] {
        return this._userIds;
    }

    get userId(): bigInt.BigInteger | undefined {
        return this._userIds.length > 0 ? this._userIds[0] : undefined;
    }

    get addedBy(): bigInt.BigInteger | undefined {
        return this._addedBy;
    }

    get kickedBy(): bigInt.BigInteger | undefined {
        return this._kickedBy;
    }

    get created(): boolean {
        return this._created;
    }

    get newTitle(): string | undefined {
        return this._newTitle;
    }

    get newPhoto(): boolean {
        return (
            this._newPhoto !== undefined ||
            this._actionMessage?.action instanceof Api.MessageActionChatEditPhoto
        );
    }

    get photoDeleted(): boolean {
        return this._actionMessage?.action instanceof Api.MessageActionChatDeletePhoto;
    }

    get photo(): Api.TypePhoto | undefined {
        return this._newPhoto;
    }

    get newPin(): boolean {
        return this._pinned && this._pinnedIds.length > 0;
    }

    get unpin(): boolean {
        return !this._pinned && this._pinnedIds.length > 0;
    }

    get pinnedMessageIds(): number[] {
        return this._pinnedIds;
    }

    get pinnedMessageId(): number | undefined {
        return this._pinnedIds.length > 0 ? this._pinnedIds[0] : undefined;
    }

    async getPinnedMessages(): Promise<Api.Message[] | undefined> {
        if (!this._client || this._pinnedIds.length === 0 || !this.chatId) {
            return undefined;
        }
        try {
            return await this._client.getMessages(this.chatId, {
                ids: this._pinnedIds,
            });
        } catch {
            return undefined;
        }
    }

    async getPinnedMessage(): Promise<Api.Message | undefined> {
        const messages = await this.getPinnedMessages();
        return messages && messages.length > 0 ? messages[0] : undefined;
    }

    async getUsers(): Promise<Api.User[] | undefined> {
        if (!this._client || this._userIds.length === 0) {
            return undefined;
        }
        try {
            const users: Api.User[] = [];
            for (const userId of this._userIds) {
                const entity = await this._client.getEntity(
                    new Api.PeerUser({ userId })
                );
                if (entity instanceof Api.User) {
                    users.push(entity);
                }
            }
            return users.length > 0 ? users : undefined;
        } catch {
            return undefined;
        }
    }

    async getUser(): Promise<Api.User | undefined> {
        const users = await this.getUsers();
        return users && users.length > 0 ? users[0] : undefined;
    }

    async respond(params: {
        message?: string;
        parseMode?: any;
        file?: any;
        silent?: boolean;
    }): Promise<Api.Message | undefined> {
        if (!this._client || !this.chatId) return undefined;
        return this._client.sendMessage(this.chatId, params);
    }
}
