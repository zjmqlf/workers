import { Api } from "../tl";
import type {
    DateLike,
    EntityLike,
    FileLike,
    MarkupLike,
    MessageIDLike,
    MessageLike,
} from "../define";
import { RequestIter } from "../requestIter";
import {
    _EntityType,
    _entityType,
    TotalList,
    isArrayLike,
    groupBy,
    generateRandomBigInt,
} from "../Helpers";
import { getInputMedia, getMessageId, getPeerId, parseID } from "../Utils";
import type { TelegramClient } from "./TelegramClient";
import * as utils from "../Utils";
import { _parseMessageText } from "./messageParse";
import { _getPeer } from "./users";
import bigInt, { BigInteger } from "big-integer";
import {
    _fileToMedia,
    _toQuickReplyShortcut,
    _toReplyObject,
    SendFileInterface,
} from "./uploads";
import { Buffer } from "node:buffer";

const _MAX_CHUNK_SIZE = 100;

interface MessageIterParams {
    entity: EntityLike;
    offsetId: number;
    minId: number;
    maxId: number;
    fromUser?: EntityLike;
    offsetDate: DateLike;
    addOffset: number;
    filter: any;
    search: string;
    replyTo: MessageIDLike;
    topMsgId?: number;
    savedPeerId?: EntityLike;
}

export class _MessagesIter extends RequestIter {
    entity?: Api.TypeInputPeer;
    request?:
        | Api.messages.SearchGlobal
        | Api.messages.GetReplies
        | Api.messages.GetHistory
        | Api.messages.Search;
    addOffset?: number;
    maxId?: number;
    minId?: number;
    lastId?: number;

    async _init({
        entity,
        offsetId,
        minId,
        maxId,
        fromUser,
        offsetDate,
        addOffset,
        filter,
        search,
        replyTo,
        topMsgId,
        savedPeerId,
    }: MessageIterParams) {
        if (entity) {
            this.entity = await this.client.getInputEntity(entity);
        } else {
            this.entity = undefined;
            if (this.reverse) {
                throw new Error("Cannot reverse global search");
            }
        }
        if (this.reverse) {
            offsetId = Math.max(offsetId, minId);
            if (offsetId && maxId) {
                if (maxId - offsetId <= 1) {
                    return false;
                }
            }
            if (!maxId) {
                maxId = Number.MAX_SAFE_INTEGER;
            }
        } else {
            offsetId = Math.max(offsetId, maxId);
            if (offsetId && minId) {
                if (offsetId - minId <= 1) {
                    return false;
                }
            }
        }
        if (this.reverse) {
            if (offsetId) {
                offsetId += 1;
            } else if (!offsetDate) {
                offsetId = 1;
            }
        }
        if (fromUser) {
            fromUser = await this.client.getInputEntity(fromUser);
        }
        if (!this.entity && fromUser) {
            this.entity = new Api.InputPeerEmpty();
        }
        if (!filter) {
            filter = new Api.InputMessagesFilterEmpty();
        }
        if (!this.entity) {
            this.request = new Api.messages.SearchGlobal({
                q: search || "",
                filter: filter,
                minDate: 0,
                maxDate: offsetDate ?? 0,
                offsetRate: 0,
                offsetPeer: new Api.InputPeerEmpty(),
                offsetId: offsetId,
                limit: 1,
            });
        } else if (replyTo !== undefined) {
            this.request = new Api.messages.GetReplies({
                peer: this.entity,
                msgId: replyTo,
                offsetId: offsetId,
                offsetDate: offsetDate ?? 0,
                addOffset: addOffset,
                limit: 0,
                maxId: 0,
                minId: 0,
                hash: bigInt.zero,
            });
        } else if (
            search !== undefined ||
            !(filter instanceof Api.InputMessagesFilterEmpty) ||
            fromUser !== undefined ||
            topMsgId !== undefined ||
            savedPeerId !== undefined
        ) {
            this.request = new Api.messages.Search({
                peer: this.entity,
                q: search || "",
                filter: typeof filter === "function" ? new filter() : filter,
                minDate: 0,
                maxDate: offsetDate ?? 0,
                offsetId: offsetId,
                addOffset: addOffset,
                limit: 0,
                maxId: 0,
                minId: 0,
                hash: generateRandomBigInt(),
                fromId: fromUser,
                topMsgId: topMsgId,
                savedPeerId: savedPeerId
                    ? await this.client.getInputEntity(savedPeerId)
                    : undefined,
            });
            if (
                !(filter instanceof Api.InputMessagesFilterEmpty) &&
                offsetDate &&
                !search &&
                !offsetId
            ) {
                for await (const m of this.client.iterMessages(this.entity, {
                    limit: 1,
                    offsetDate: offsetDate,
                })) {
                    this.request.offsetId = m.id + 1;
                }
            }
        } else {
            this.request = new Api.messages.GetHistory({
                peer: this.entity,
                limit: 1,
                offsetDate: offsetDate ?? 0,
                offsetId: offsetId,
                minId: 0,
                maxId: 0,
                addOffset: addOffset,
                hash: bigInt.zero,
            });
        }
        if (this.limit <= 0) {
            const result = await this.client.invoke(this.request);
            if (result instanceof Api.messages.MessagesNotModified) {
                this.total = result.count;
            } else {
                if ("count" in result) {
                    this.total = result.count;
                } else {
                    this.total = result.messages.length;
                }
            }
            return false;
        }
        if (!this.waitTime) {
            this.waitTime = this.limit > 3000 ? 1 : 0;
        }
        if (
            this.reverse &&
            !(this.request instanceof Api.messages.SearchGlobal)
        ) {
            this.request.addOffset -= _MAX_CHUNK_SIZE;
        }
        this.addOffset = addOffset;
        this.maxId = maxId;
        this.minId = minId;
        this.lastId = this.reverse ? 0 : Number.MAX_SAFE_INTEGER;
    }

    async _loadNextChunk() {
        if (!this.request) {
            throw new Error("Request not set yet");
        }
        this.request.limit = Math.min(this.left, _MAX_CHUNK_SIZE);
        if (this.reverse && this.request.limit != _MAX_CHUNK_SIZE) {
            if (!(this.request instanceof Api.messages.SearchGlobal)) {
                this.request.addOffset = this.addOffset! - this.request.limit;
            }
        }
        const r = await this.client.invoke(this.request);
        if (r instanceof Api.messages.MessagesNotModified) {
            return true;
        }
        if ("count" in r) {
            this.total = r.count;
        } else {
            this.total = r.messages.length;
        }
        const entities = new Map();
        for (const x of [...r.users, ...r.chats]) {
            entities.set(getPeerId(x), x);
        }
        const messages: Api.Message[] = this.reverse
            ? (r.messages.reverse() as unknown as Api.Message[])
            : (r.messages as unknown as Api.Message[]);
        for (const message of messages) {
            if (!this._messageInRange(message)) {
                return true;
            }
            this.lastId = message.id;
            try {
                message._finishInit(this.client, entities, this.entity);
            } catch (e) {}
            message._entities = entities;
            this.buffer?.push(message);
        }
        if (r.messages.length < this.request.limit) {
            return true;
        }
        if (this.buffer) {
            this._updateOffset(this.buffer[this.buffer.length - 1], r);
        } else {
            return true;
        }
    }

    _messageInRange(message: Api.Message) {
        if (this.entity) {
            if (this.reverse) {
                if (message.id <= this.lastId! || message.id >= this.maxId!) {
                    return false;
                }
            } else {
                if (message.id >= this.lastId! || message.id <= this.minId!) {
                    return false;
                }
            }
        }
        return true;
    }

    [Symbol.asyncIterator](): AsyncIterator<Api.Message, any, undefined> {
        return super[Symbol.asyncIterator]();
    }

    _updateOffset(lastMessage: Api.Message, response: any) {
        if (!this.request) {
            throw new Error("Request not set yet");
        }
        this.request.offsetId = Number(lastMessage.id);
        if (this.reverse) {
            this.request.offsetId += 1;
        }
        if (this.request instanceof Api.messages.Search) {
            this.request.maxDate = -1;
        } else {
            if (!(this.request instanceof Api.messages.SearchGlobal)) {
                this.request.offsetDate = lastMessage.date!;
            }
        }
        if (this.request instanceof Api.messages.SearchGlobal) {
            if (lastMessage.inputChat) {
                this.request.offsetPeer = lastMessage.inputChat;
            } else {
                this.request.offsetPeer = new Api.InputPeerEmpty();
            }
            this.request.offsetRate = response.nextRate;
        }
    }
}

interface IDsIterInterface {
    entity: EntityLike;
    ids: Api.TypeInputMessage[];
}

export class _IDsIter extends RequestIter {
    _ids?: Api.TypeInputMessage[];
    _offset?: number;
    _ty: number | undefined;
    private _entity: Api.TypeInputPeer | undefined;

    async _init({ entity, ids }: IDsIterInterface) {
        this.total = ids.length;
        this._ids = this.reverse ? ids.reverse() : ids;
        this._offset = 0;
        this._entity = entity
            ? await this.client.getInputEntity(entity)
            : undefined;
        this._ty = this._entity ? _entityType(this._entity) : undefined;
        if (!this.waitTime) {
            this.waitTime = this.limit > 300 ? 10 : 0;
        }
    }

    [Symbol.asyncIterator](): AsyncIterator<Api.Message, any, undefined> {
        return super[Symbol.asyncIterator]();
    }

    async _loadNextChunk() {
        const ids = this._ids!.slice(
            this._offset,
            this._offset! + _MAX_CHUNK_SIZE
        );
        if (!ids.length) {
            return false;
        }
        this._offset! += _MAX_CHUNK_SIZE;
        let fromId;
        let r;
        if (this._ty == _EntityType.CHANNEL) {
            try {
                r = await this.client.invoke(
                    new Api.channels.GetMessages({
                        channel: this._entity,
                        id: ids,
                    })
                );
            } catch (e: any) {
                if (e.errorMessage == "MESSAGE_IDS_EMPTY") {
                    r = new Api.messages.MessagesNotModified({
                        count: ids.length,
                    });
                } else {
                    throw e;
                }
            }
        } else {
            r = await this.client.invoke(
                new Api.messages.GetMessages({
                    id: ids,
                })
            );
            if (this._entity) {
                fromId = await _getPeer(this.client, this._entity);
            }
        }
        if (r instanceof Api.messages.MessagesNotModified) {
            this.buffer?.push(...Array(ids.length));
            return;
        }
        const entities = new Map();
        for (const entity of [...r.users, ...r.chats]) {
            entities.set(utils.getPeerId(entity), entity);
        }
        let message: Api.TypeMessage;
        for (message of r.messages) {
            if (
                message instanceof Api.MessageEmpty ||
                (fromId &&
                    utils.getPeerId(message.peerId) != utils.getPeerId(fromId))
            ) {
                this.buffer?.push(undefined);
            } else {
                const temp: Api.Message = message as unknown as Api.Message;
                temp._finishInit(this.client, entities, this._entity);
                temp._entities = entities;
                this.buffer?.push(temp);
            }
        }
    }
}

export interface IterMessagesParams {
    limit?: number;
    offsetDate?: DateLike;
    offsetId: number;
    maxId: number;
    minId: number;
    addOffset: number;
    search?: string;
    filter?: Api.TypeMessagesFilter | Api.TypeMessagesFilter[];
    fromUser?: EntityLike;
    waitTime?: number;
    ids?: number | number[] | Api.TypeInputMessage | Api.TypeInputMessage[];
    reverse?: boolean;
    replyTo?: number;
    scheduled: boolean;
    topMsgId?: number;
    savedPeerId?: EntityLike;
}

const IterMessagesDefaults: IterMessagesParams = {
    limit: undefined,
    offsetDate: undefined,
    offsetId: 0,
    maxId: 0,
    minId: 0,
    addOffset: 0,
    search: undefined,
    filter: undefined,
    fromUser: undefined,
    waitTime: undefined,
    ids: undefined,
    reverse: false,
    replyTo: undefined,
    scheduled: false,
    topMsgId: undefined,
    savedPeerId: undefined,
};

export interface SendMessageParams {
    message?: MessageLike;
    replyTo?: number | Api.Message | Api.TypeInputReplyTo;
    quoteText?: string;
    quoteEntities?: Api.TypeMessageEntity[];
    quoteOffset?: number;
    replyToPeerId?: EntityLike;
    attributes?: Api.TypeDocumentAttribute[];
    parseMode?: any;
    formattingEntities?: Api.TypeMessageEntity[];
    linkPreview?: boolean;
    file?: FileLike | FileLike[];
    thumb?: FileLike;
    forceDocument?: boolean;
    clearDraft?: boolean;
    buttons?: MarkupLike;
    silent?: boolean;
    supportStreaming?: boolean;
    schedule?: DateLike;
    noforwards?: boolean;
    commentTo?: number | Api.Message;
    topMsgId?: number | Api.Message;
    sendAs?: EntityLike;
    effect?: BigInteger;
    invertMedia?: boolean;
    background?: boolean;
    updateStickersetsOrder?: boolean;
    allowPaidFloodskip?: boolean;
    allowPaidStars?: BigInteger;
    scheduleRepeatPeriod?: number;
    quickReplyShortcut?: string | number | Api.TypeInputQuickReplyShortcut;
    suggestedPost?: Api.TypeSuggestedPost;
    richMessage?: Api.TypeInputRichMessage;
}

export interface ForwardMessagesParams {
    messages: MessageIDLike | MessageIDLike[];
    fromPeer: EntityLike;
    silent?: boolean;
    schedule?: DateLike;
    dropAuthor?: boolean;
    noforwards?: boolean;
    topMsgId?: number | Api.Message;
    sendAs?: EntityLike;
    effect?: BigInteger;
    dropMediaCaptions?: boolean;
    withMyScore?: boolean;
    background?: boolean;
    allowPaidFloodskip?: boolean;
    allowPaidStars?: BigInteger;
    videoTimestamp?: number;
    scheduleRepeatPeriod?: number;
    quickReplyShortcut?: string | number | Api.TypeInputQuickReplyShortcut;
    suggestedPost?: Api.TypeSuggestedPost;
    replyTo?: number | Api.Message | Api.TypeInputReplyTo;
}

export interface EditMessageParams {
    message: Api.Message | number;
    text?: string;
    parseMode?: any;
    formattingEntities?: Api.TypeMessageEntity[];
    linkPreview?: boolean;
    file?: FileLike;
    forceDocument?: boolean;
    buttons?: MarkupLike;
    schedule?: DateLike;
    invertMedia?: boolean;
    scheduleRepeatPeriod?: number;
    quickReplyShortcutId?: number;
    richMessage?: Api.TypeInputRichMessage;
}

export interface UpdatePinMessageParams {
    notify?: boolean;
    pmOneSide?: boolean;
    topMsgId?: number;
    savedPeerId?: EntityLike;
}

export interface MarkAsReadParams {
    maxId?: number;
    clearMentions?: boolean;
    topMsgId?: number;
}

export function iterMessages(
    client: TelegramClient,
    entity: EntityLike | undefined,
    options: Partial<IterMessagesParams>
) {
    const {
        limit,
        offsetDate,
        offsetId,
        maxId,
        minId,
        addOffset,
        search,
        filter,
        fromUser,
        waitTime,
        ids,
        reverse,
        replyTo,
        topMsgId,
        savedPeerId,
    } = { ...IterMessagesDefaults, ...options };
    if (ids) {
        let idsArray;
        if (!isArrayLike(ids)) {
            idsArray = [ids];
        } else {
            idsArray = ids;
        }
        return new _IDsIter(
            client,
            idsArray.length,
            {
                reverse: reverse,
                waitTime: waitTime,
            },
            {
                entity: entity,
                ids: idsArray,
            }
        );
    }
    return new _MessagesIter(
        client,
        limit,
        {
            waitTime: waitTime,
            reverse: reverse,
        },
        {
            entity: entity,
            offsetId: offsetId,
            minId: minId,
            maxId: maxId,
            fromUser: fromUser,
            offsetDate: offsetDate,
            addOffset: addOffset,
            filter: filter,
            search: search,
            replyTo: replyTo,
            topMsgId: topMsgId,
            savedPeerId: savedPeerId,
        }
    );
}

export async function getMessages(
    client: TelegramClient,
    entity: EntityLike | undefined,
    params: Partial<IterMessagesParams>
): Promise<TotalList<Api.Message>> {
    if (Object.keys(params).length == 1 && params.limit === undefined) {
        if (params.minId === undefined && params.maxId === undefined) {
            params.limit = undefined;
        } else {
            params.limit = 1;
        }
    }

    const it = client.iterMessages(entity, params);
    const ids = params.ids;
    if (ids && !isArrayLike(ids)) {
        for await (const message of it) {
            return [message];
        }
        return [];
    }
    return (await it.collect()) as TotalList<Api.Message>;
}

export async function sendMessage(
    client: TelegramClient,
    entity: EntityLike,
    {
        message,
        replyTo,
        attributes,
        parseMode,
        formattingEntities,
        linkPreview = true,
        file,
        thumb,
        forceDocument,
        clearDraft,
        buttons,
        silent,
        supportStreaming,
        schedule,
        noforwards,
        commentTo,
        topMsgId,
        sendAs,
        effect,
        invertMedia,
        background,
        updateStickersetsOrder,
        allowPaidFloodskip,
        allowPaidStars,
        scheduleRepeatPeriod,
        quickReplyShortcut,
        suggestedPost,
        richMessage,
        quoteText,
        quoteEntities,
        quoteOffset,
        replyToPeerId,
    }: SendMessageParams = {}
) {
    if (file) {
        return client.sendFile(entity, {
            file: file,
            caption: message
                ? typeof message == "string"
                    ? message
                    : message.message
                : "",
            forceDocument: forceDocument,
            clearDraft: clearDraft,
            replyTo: replyTo,
            attributes: attributes,
            thumb: thumb,
            supportsStreaming: supportStreaming,
            parseMode: parseMode,
            formattingEntities: formattingEntities,
            silent: silent,
            scheduleDate: schedule,
            buttons: buttons,
            noforwards: noforwards,
            commentTo: commentTo,
            topMsgId: topMsgId,
            sendAs: sendAs,
            effect: effect,
            invertMedia: invertMedia,
            background: background,
            updateStickersetsOrder: updateStickersetsOrder,
            allowPaidFloodskip: allowPaidFloodskip,
            allowPaidStars: allowPaidStars,
            scheduleRepeatPeriod: scheduleRepeatPeriod,
            quickReplyShortcut: quickReplyShortcut,
            suggestedPost: suggestedPost,
            quoteText: quoteText,
            quoteEntities: quoteEntities,
            quoteOffset: quoteOffset,
            replyToPeerId: replyToPeerId,
        });
    }
    entity = await client.getInputEntity(entity);
    if (commentTo != undefined) {
        const discussionData = await getCommentData(client, entity, commentTo);
        entity = discussionData.entity;
        replyTo = discussionData.replyTo;
    }
    let markup, request;
    const replyObject = await _toReplyObject(client, replyTo, topMsgId, {
        quoteText,
        quoteEntities,
        quoteOffset,
        replyToPeerId,
    });

    if (message && message instanceof Api.Message) {
        if (buttons == undefined) {
            markup = message.replyMarkup;
        } else {
            markup = client.buildReplyMarkup(buttons);
        }
        if (silent == undefined) {
            silent = message.silent;
        }

        if (
            message.media &&
            !(message.media instanceof Api.MessageMediaWebPage)
        ) {
            return client.sendFile(entity, {
                file: message.media,
                caption: message.message,
                silent: silent,
                replyTo: replyTo,
                buttons: markup,
                formattingEntities: message.entities,
                scheduleDate: schedule,
                clearDraft: clearDraft,
                noforwards: noforwards,
                topMsgId: topMsgId,
                sendAs: sendAs,
                effect: effect,
                invertMedia: invertMedia,
                background: background,
                allowPaidStars: allowPaidStars,
                quoteText: quoteText,
                quoteEntities: quoteEntities,
                quoteOffset: quoteOffset,
                replyToPeerId: replyToPeerId,
            });
        }
        request = new Api.messages.SendMessage({
            peer: entity,
            message: message.message || "",
            silent: silent,
            replyTo: replyObject,
            replyMarkup: markup,
            entities: message.entities,
            clearDraft: clearDraft,
            noWebpage: !(message.media instanceof Api.MessageMediaWebPage),
            scheduleDate: schedule,
            scheduleRepeatPeriod: scheduleRepeatPeriod,
            noforwards: noforwards,
            background: background,
            updateStickersetsOrder: updateStickersetsOrder,
            allowPaidFloodskip: allowPaidFloodskip,
            allowPaidStars: allowPaidStars,
            quickReplyShortcut: _toQuickReplyShortcut(quickReplyShortcut),
            suggestedPost: suggestedPost,
            richMessage: richMessage,
            sendAs: sendAs
                ? await client.getInputEntity(sendAs)
                : undefined,
            effect: effect,
            invertMedia: invertMedia,
        });
        message = message.message;
    } else {
        if (formattingEntities == undefined) {
            [message, formattingEntities] = await _parseMessageText(
                client,
                message || "",
                parseMode
            );
        }
        if (!message && !richMessage) {
            throw new Error(
                "The message cannot be empty unless a file is provided"
            );
        }

        request = new Api.messages.SendMessage({
            peer: entity,
            message: message ? message.toString() : "",
            entities: formattingEntities,
            noWebpage: !linkPreview,
            replyTo: replyObject,
            clearDraft: clearDraft,
            silent: silent,
            replyMarkup: client.buildReplyMarkup(buttons),
            scheduleDate: schedule,
            scheduleRepeatPeriod: scheduleRepeatPeriod,
            noforwards: noforwards,
            background: background,
            updateStickersetsOrder: updateStickersetsOrder,
            allowPaidFloodskip: allowPaidFloodskip,
            allowPaidStars: allowPaidStars,
            quickReplyShortcut: _toQuickReplyShortcut(quickReplyShortcut),
            suggestedPost: suggestedPost,
            richMessage: richMessage,
            sendAs: sendAs
                ? await client.getInputEntity(sendAs)
                : undefined,
            effect: effect,
            invertMedia: invertMedia,
        });
    }
    const result = await client.invoke(request);
    if (result instanceof Api.UpdateShortSentMessage) {
        const msg = new Api.Message({
            id: result.id,
            peerId: await _getPeer(client, entity),
            message: message,
            date: result.date,
            out: result.out,
            media: result.media,
            entities: result.entities,
            replyMarkup: request.replyMarkup,
            ttlPeriod: result.ttlPeriod,
        });
        msg._finishInit(client, new Map(), entity);
        return msg;
    }
    return client._getResponseMessage(request, result, entity) as Api.Message;
}

export async function forwardMessages(
    client: TelegramClient,
    entity: EntityLike,
    {
        messages,
        fromPeer,
        silent,
        schedule,
        noforwards,
        dropAuthor,
        topMsgId,
        sendAs,
        effect,
        dropMediaCaptions,
        withMyScore,
        background,
        allowPaidFloodskip,
        allowPaidStars,
        videoTimestamp,
        scheduleRepeatPeriod,
        quickReplyShortcut,
        suggestedPost,
        replyTo,
    }: ForwardMessagesParams & { topMsgId?: number | Api.Message }
) {
    if (!isArrayLike(messages)) {
        messages = [messages];
    }

    entity = await client.getInputEntity(entity);

    let fromPeerId: string | undefined;
    if (fromPeer) {
        fromPeer = await client.getInputEntity(fromPeer);
        fromPeerId = await client.getPeerId(fromPeer);
    }

    const getKey = (m: string | Api.Message) => {
        if (m instanceof Api.Message) {
            return m.chatId;
        }
        let msgId = parseID(m);
        if (msgId) {
            if (fromPeerId !== undefined) return fromPeerId;
            throw new Error("fromPeer must be given if integer IDs are used");
        } else {
            throw new Error(`Cannot forward ${m}`);
        }
    };

    const sent: Api.Message[] = [];

    for (let [chatId, chunk] of groupBy(messages, getKey) as Map<
        number,
        Api.Message[] | number[]
    >) {
        let chat;
        let numbers: number[] = [];
        if (typeof chunk[0] == "number") {
            chat = fromPeer;
            numbers = chunk as number[];
        } else {
            chat = await (chunk as Api.Message[])[0].getInputChat();
            numbers = (chunk as Api.Message[]).map((m: Api.Message) => m.id);
        }

        const request = new Api.messages.ForwardMessages({
            fromPeer: chat,
            id: numbers,
            toPeer: entity,
            silent: silent,
            scheduleDate: schedule,
            scheduleRepeatPeriod: scheduleRepeatPeriod,
            noforwards: noforwards,
            dropAuthor: dropAuthor,
            topMsgId: topMsgId ? getMessageId(topMsgId) : undefined,
            replyTo: await _toReplyObject(client, replyTo, undefined),
            sendAs: sendAs
                ? await client.getInputEntity(sendAs)
                : undefined,
            effect: effect,
            dropMediaCaptions: dropMediaCaptions,
            withMyScore: withMyScore,
            background: background,
            allowPaidFloodskip: allowPaidFloodskip,
            allowPaidStars: allowPaidStars,
            videoTimestamp: videoTimestamp,
            quickReplyShortcut: _toQuickReplyShortcut(quickReplyShortcut),
            suggestedPost: suggestedPost,
        });

        const result = await client.invoke(request);
        sent.push(
            client._getResponseMessage(request, result, entity) as Api.Message
        );
    }

    return sent;
}

export async function editMessage(
    client: TelegramClient,
    entity: EntityLike,
    {
        message,
        text,
        parseMode,
        formattingEntities,
        linkPreview = true,
        file,
        forceDocument,
        buttons,
        schedule,
        invertMedia,
        scheduleRepeatPeriod,
        quickReplyShortcutId,
        richMessage,
    }: EditMessageParams
) {
    if (
        typeof message === "number" &&
        typeof text === "undefined" &&
        !file &&
        !schedule &&
        !richMessage
    ) {
        throw Error(
            "You have to provide either file or text or schedule property."
        );
    }
    entity = await client.getInputEntity(entity);
    let id: number | undefined;
    let markup: Api.TypeReplyMarkup | undefined;
    let entities: Api.TypeMessageEntity[] | undefined;
    let inputMedia: Api.TypeInputMedia | undefined;
    if (file) {
        const { fileHandle, media, image } = await _fileToMedia(client, {
            file,
            forceDocument,
        });
        inputMedia = media;
    }
    if (message instanceof Api.Message) {
        id = getMessageId(message);
        text = message.message;
        entities = message.entities;
        if (buttons == undefined) {
            markup = message.replyMarkup;
        } else {
            markup = client.buildReplyMarkup(buttons);
        }
        if (message.media) {
            inputMedia = getInputMedia(message.media, { forceDocument });
        }
    } else {
        if (typeof message !== "number") {
            throw Error(
                "editMessageParams.message must be either a number or a Api.Message type"
            );
        }
        id = message;
        if (formattingEntities == undefined) {
            [text, entities] = await _parseMessageText(
                client,
                text || "",
                parseMode
            );
        } else {
            entities = formattingEntities;
        }
        markup = client.buildReplyMarkup(buttons);
    }
    const request = new Api.messages.EditMessage({
        peer: entity,
        id,
        message: text,
        noWebpage: !linkPreview,
        entities,
        media: inputMedia,
        replyMarkup: markup,
        scheduleDate: schedule,
        scheduleRepeatPeriod: scheduleRepeatPeriod,
        quickReplyShortcutId: quickReplyShortcutId,
        richMessage: richMessage,
        invertMedia: invertMedia,
    });
    const result = await client.invoke(request);
    return client._getResponseMessage(request, result, entity) as Api.Message;
}

export async function deleteMessages(
    client: TelegramClient,
    entity: EntityLike | undefined,
    messageIds: MessageIDLike[],
    { revoke = true }
) {
    let ty = _EntityType.USER;
    if (entity) {
        entity = await client.getInputEntity(entity);
        ty = _entityType(entity);
    }
    const ids: number[] = [];
    for (const messageId of messageIds) {
        if (
            messageId instanceof Api.Message ||
            messageId instanceof Api.MessageService ||
            messageId instanceof Api.MessageEmpty
        ) {
            ids.push(messageId.id);
        } else if (typeof messageId === "number") {
            ids.push(messageId);
        } else {
            throw new Error(`Cannot convert ${messageId} to an integer`);
        }
    }
    const results = [];

    if (ty == _EntityType.CHANNEL) {
        for (const chunk of utils.chunks(ids)) {
            results.push(
                client.api.channels.deleteMessages({
                    channel: entity!,
                    id: chunk,
                })
            );
        }
    } else {
        for (const chunk of utils.chunks(ids)) {
            results.push(
                client.api.messages.deleteMessages({
                    id: chunk,
                    revoke: revoke,
                })
            );
        }
    }
    return Promise.all(results);
}

export async function pinMessage(
    client: TelegramClient,
    entity: EntityLike,
    message?: MessageIDLike,
    pinMessageParams?: UpdatePinMessageParams
) {
    return await _pin(
        client,
        entity,
        message,
        false,
        pinMessageParams?.notify,
        pinMessageParams?.pmOneSide,
        pinMessageParams
    );
}

export async function unpinMessage(
    client: TelegramClient,
    entity: EntityLike,
    message?: MessageIDLike,
    unpinMessageParams?: UpdatePinMessageParams
) {
    return await _pin(
        client,
        entity,
        message,
        true,
        unpinMessageParams?.notify,
        unpinMessageParams?.pmOneSide,
        unpinMessageParams
    );
}

export async function _pin(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike | undefined,
    unpin: boolean,
    notify: boolean = false,
    pmOneSide: boolean = false,
    params?: UpdatePinMessageParams
) {
    message = utils.getMessageId(message) || 0;

    if (message === 0) {
        return await client.api.messages.unpinAllMessages({
            peer: entity,
            topMsgId: params?.topMsgId,
            savedPeerId: params?.savedPeerId
                ? await client.getInputEntity(params.savedPeerId)
                : undefined,
        });
    }

    entity = await client.getInputEntity(entity);

    const request = new Api.messages.UpdatePinnedMessage({
        silent: !notify,
        unpin,
        pmOneside: pmOneSide,
        peer: entity,
        id: message,
    });
    const result = await client.invoke(request);

    if (
        unpin ||
        !("updates" in result) ||
        ("updates" in result && !result.updates)
    ) {
        return;
    }

    return client._getResponseMessage(request, result, entity) as Api.Message;
}

export async function markAsRead(
    client: TelegramClient,
    entity: EntityLike,
    message?: MessageIDLike | MessageIDLike[],
    markAsReadParams?: MarkAsReadParams
): Promise<boolean> {
    let maxId: number = markAsReadParams?.maxId || 0;
    const maxIdIsUndefined = markAsReadParams?.maxId === undefined;
    if (maxIdIsUndefined) {
        if (message) {
            if (Array.isArray(message)) {
                maxId = Math.max(
                    ...message.map((v) => utils.getMessageId(v) as number)
                );
            } else {
                maxId = utils.getMessageId(message) as number;
            }
        }
    }

    entity = await client.getInputEntity(entity);
    if (markAsReadParams && markAsReadParams.clearMentions) {
        await client.invoke(
            new Api.messages.ReadMentions({
                peer: entity,
                topMsgId: markAsReadParams.topMsgId,
            })
        );
        if (maxIdIsUndefined && message === undefined) {
            return true;
        }
    }

    if (_entityType(entity) === _EntityType.CHANNEL) {
        return await client.api.channels.readHistory({
            channel: entity,
            maxId,
        });
    } else {
        await client.api.messages.readHistory({ peer: entity, maxId });
        return true;
    }
}

export async function getCommentData(
    client: TelegramClient,
    entity: EntityLike,
    message: number | Api.Message
) {
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    const result = await client.api.messages.getDiscussionMessage({
        peer: entity,
        msgId,
    });
    const relevantMessage = result.messages.reduce(
        (p: Api.TypeMessage, c: Api.TypeMessage) => (p && p.id < c.id ? p : c)
    );
    let chat;
    for (const c of result.chats) {
        if (
            relevantMessage.peerId instanceof Api.PeerChannel &&
            c.id.eq(relevantMessage.peerId.channelId)
        ) {
            chat = c;
            break;
        }
    }
    return {
        entity: utils.getInputPeer(chat),
        replyTo: relevantMessage.id,
    };
}

export async function sendReaction(
    client: TelegramClient,
    entity: EntityLike,
    messageId: number,
    reaction?: Api.TypeReaction[],
    big?: boolean,
    addToRecent?: boolean
) {
    return client.invoke(
        new Api.messages.SendReaction({
            peer: entity,
            msgId: messageId,
            reaction: reaction || [],
            big: big,
            addToRecent: addToRecent,
        })
    );
}

export async function getReactionUsers(
    client: TelegramClient,
    entity: EntityLike,
    messageId: number,
    params?: {
        reaction?: string | Api.TypeReaction;
        limit?: number;
        offset?: string;
    }
) {
    const { reaction, limit = 100, offset = "" } = params || {};
    return client.invoke(
        new Api.messages.GetMessageReactionsList({
            peer: entity,
            id: messageId,
            limit: limit,
            offset: offset,
            reaction:
                typeof reaction === "string"
                    ? new Api.ReactionEmoji({ emoticon: reaction })
                    : reaction,
        })
    );
}

export interface SendPollParams {
    question: string;
    answers: string[];
    multipleChoice?: boolean;
    quiz?: boolean;
    correctAnswers?: number | number[];
    publicVoters?: boolean;
    closePeriod?: number;
    closeDate?: DateLike;
    solution?: string;
    solutionEntities?: Api.TypeMessageEntity[];
    solutionMedia?: Api.TypeInputMedia;
    attachedMedia?: Api.TypeInputMedia;
    openAnswers?: boolean;
    shuffleAnswers?: boolean;
    hideResultsUntilClose?: boolean;
    revotingDisabled?: boolean;
    subscribersOnly?: boolean;
    countriesIso2?: string[];
    parseMode?: any;
}

async function _pollText(
    client: TelegramClient,
    text: string,
    parseMode: any
): Promise<Api.TextWithEntities> {
    const [parsed, entities] = await _parseMessageText(client, text, parseMode);
    return new Api.TextWithEntities({ text: parsed, entities: entities });
}

export async function sendPoll(
    client: TelegramClient,
    entity: EntityLike,
    poll: SendPollParams,
    params: Omit<SendFileInterface, "file" | "caption"> = {}
) {
    let solution: string | undefined;
    let solutionEntities = poll.solutionEntities;
    if (poll.solution != undefined) {
        if (solutionEntities == undefined) {
            [solution, solutionEntities] = await _parseMessageText(
                client,
                poll.solution,
                poll.parseMode
            );
        } else {
            solution = poll.solution;
        }
    }
    const correctAnswers =
        poll.correctAnswers == undefined
            ? undefined
            : Array.isArray(poll.correctAnswers)
            ? poll.correctAnswers
            : [poll.correctAnswers];
    const media = new Api.InputMediaPoll({
        poll: new Api.Poll({
            id: bigInt.zero,
            question: await _pollText(client, poll.question, poll.parseMode),
            answers: await Promise.all(
                poll.answers.map(
                    async (answer, i) =>
                        new Api.PollAnswer({
                            text: await _pollText(
                                client,
                                answer,
                                poll.parseMode
                            ),
                            option: Buffer.from([48 + i]),
                        })
                )
            ),
            multipleChoice: poll.multipleChoice,
            quiz: poll.quiz,
            publicVoters: poll.publicVoters,
            closePeriod: poll.closePeriod,
            closeDate: poll.closeDate as number | undefined,
            openAnswers: poll.openAnswers,
            shuffleAnswers: poll.shuffleAnswers,
            hideResultsUntilClose: poll.hideResultsUntilClose,
            revotingDisabled: poll.revotingDisabled,
            subscribersOnly: poll.subscribersOnly,
            countriesIso2: poll.countriesIso2,
            hash: bigInt.zero,
        }),
        correctAnswers: correctAnswers,
        solution: solution,
        solutionEntities: solution != undefined ? solutionEntities : undefined,
        solutionMedia: poll.solutionMedia,
        attachedMedia: poll.attachedMedia,
    });
    return client.sendFile(entity, { ...params, file: media });
}

async function _getMessagePoll(
    client: TelegramClient,
    entity: Api.TypeInputPeer,
    message: MessageIDLike
): Promise<Api.Poll> {
    let msg: Api.Message | undefined =
        message instanceof Api.Message ? message : undefined;
    if (!msg || !(msg.media instanceof Api.MessageMediaPoll)) {
        const id = utils.getMessageId(message);
        if (id == undefined) {
            throw new Error(`Cannot convert ${message} to a message ID`);
        }
        msg = (await getMessages(client, entity, { ids: id }))[0];
    }
    if (!msg || !(msg.media instanceof Api.MessageMediaPoll)) {
        throw new Error("The message does not contain a poll");
    }
    return msg.media.poll;
}

export async function vote(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike,
    options: number | number[] | Buffer | Buffer[]
) {
    const peer = await client.getInputEntity(entity);
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    const list = Array.isArray(options) ? options : [options];
    let bytes: Buffer[];
    if (list.every((option) => typeof option === "number")) {
        const poll = await _getMessagePoll(client, peer, message);
        bytes = (list as number[]).map((index) => {
            const answer = poll.answers[index];
            if (!answer || !(answer instanceof Api.PollAnswer)) {
                throw new Error(`Poll has no answer with index ${index}`);
            }
            return answer.option;
        });
    } else {
        bytes = list as Buffer[];
    }
    return client.invoke(
        new Api.messages.SendVote({
            peer: peer,
            msgId: msgId,
            options: bytes,
        })
    );
}

export async function closePoll(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike
): Promise<Api.Poll> {
    const peer = await client.getInputEntity(entity);
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    const poll = await _getMessagePoll(client, peer, message);
    const request = new Api.messages.EditMessage({
        peer: peer,
        id: msgId,
        media: new Api.InputMediaPoll({
            poll: new Api.Poll({
                id: poll.id,
                closed: true,
                question: poll.question,
                answers: poll.answers,
                multipleChoice: poll.multipleChoice,
                quiz: poll.quiz,
                publicVoters: poll.publicVoters,
                hash: poll.hash,
            }),
        }),
    });
    const result = await client.invoke(request);
    if ("updates" in result) {
        for (const update of result.updates) {
            if (update instanceof Api.UpdateMessagePoll && update.poll) {
                return update.poll;
            }
        }
    }
    return _getMessagePoll(client, peer, msgId);
}

function _collectMessages(
    client: TelegramClient,
    messages: Api.TypeMessage[],
    users: Api.TypeUser[],
    chats: Api.TypeChat[]
): Api.Message[] {
    const entities = new Map<string, any>();
    for (const x of [...users, ...chats]) {
        entities.set(utils.getPeerId(x), x);
    }
    const out: Api.Message[] = [];
    for (const m of messages) {
        if (m instanceof Api.MessageEmpty) {
            continue;
        }
        const msg = m as unknown as Api.Message;
        try {
            msg._finishInit(client, entities, undefined);
        } catch (e) {}
        msg._entities = entities;
        out.push(msg);
    }
    return out;
}

export async function getScheduledMessages(
    client: TelegramClient,
    entity: EntityLike,
    ids?: number | number[]
): Promise<Api.Message[]> {
    const peer = await client.getInputEntity(entity);
    const result =
        ids == undefined
            ? await client.api.messages.getScheduledHistory({
                  peer: peer,
                  hash: bigInt.zero,
              })
            : await client.api.messages.getScheduledMessages({
                  peer: peer,
                  id: Array.isArray(ids) ? ids : [ids],
              });
    if (!("messages" in result)) {
        return [];
    }
    return _collectMessages(client, result.messages, result.users, result.chats);
}

export async function sendScheduledMessages(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[]
): Promise<Api.Message[]> {
    const peer = await client.getInputEntity(entity);
    const result = await client.api.messages.sendScheduledMessages({
        peer: peer,
        id: Array.isArray(ids) ? ids : [ids],
    });
    if (!("updates" in result)) {
        return [];
    }
    const messages: Api.TypeMessage[] = [];
    for (const update of result.updates) {
        if (
            update instanceof Api.UpdateNewMessage ||
            update instanceof Api.UpdateNewChannelMessage ||
            update instanceof Api.UpdateNewScheduledMessage
        ) {
            messages.push(update.message);
        }
    }
    return _collectMessages(client, messages, result.users, result.chats);
}

export async function deleteScheduledMessages(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[]
): Promise<void> {
    const peer = await client.getInputEntity(entity);
    await client.api.messages.deleteScheduledMessages({
        peer: peer,
        id: Array.isArray(ids) ? ids : [ids],
    });
}

export async function copyMessages(
    client: TelegramClient,
    entity: EntityLike,
    params: Omit<ForwardMessagesParams, "dropAuthor">
) {
    return forwardMessages(client, entity, { ...params, dropAuthor: true });
}

export interface SaveDraftParams {
    message?: string;
    parseMode?: any;
    formattingEntities?: Api.TypeMessageEntity[];
    linkPreview?: boolean;
    replyTo?: number | Api.Message | Api.TypeInputReplyTo;
    quoteText?: string;
    quoteEntities?: Api.TypeMessageEntity[];
    quoteOffset?: number;
    replyToPeerId?: EntityLike;
    topMsgId?: number | Api.Message;
    invertMedia?: boolean;
    media?: Api.TypeInputMedia;
    effect?: BigInteger;
    suggestedPost?: Api.TypeSuggestedPost;
    richMessage?: Api.TypeInputRichMessage;
}

export async function saveDraft(
    client: TelegramClient,
    entity: EntityLike,
    params: SaveDraftParams = {}
): Promise<boolean> {
    const peer = await client.getInputEntity(entity);
    let message = params.message || "";
    let entities = params.formattingEntities;
    if (entities == undefined && message) {
        [message, entities] = await _parseMessageText(
            client,
            message,
            params.parseMode
        );
    }
    const replyTo = await _toReplyObject(
        client,
        params.replyTo,
        params.topMsgId,
        {
            quoteText: params.quoteText,
            quoteEntities: params.quoteEntities,
            quoteOffset: params.quoteOffset,
            replyToPeerId: params.replyToPeerId,
        }
    );
    return client.invoke(
        new Api.messages.SaveDraft({
            peer: peer,
            message: message.toString(),
            entities: entities,
            noWebpage:
                params.linkPreview === undefined
                    ? undefined
                    : !params.linkPreview,
            replyTo: replyTo,
            invertMedia: params.invertMedia,
            media: params.media,
            effect: params.effect,
            suggestedPost: params.suggestedPost,
            richMessage: params.richMessage,
        })
    );
}

export async function clearDraft(client: TelegramClient, entity: EntityLike) {
    return saveDraft(client, entity, {});
}

export async function clearAllDrafts(client: TelegramClient): Promise<boolean> {
    return client.api.messages.clearAllDrafts({});
}

interface ParsedMessageLink {
    username?: string;
    channelId?: string;
    msgId: number;
    thread?: number;
    comment?: number;
}

function _linkInt(value: string | null | undefined): number | undefined {
    if (!value || !/^\d+$/.test(value)) {
        return undefined;
    }
    const n = parseInt(value, 10);
    return isNaN(n) ? undefined : n;
}

export function _parseMessageLink(link: string): ParsedMessageLink | undefined {
    let raw = link.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
        raw = "https://" + raw;
    }
    let url: URL;
    try {
        url = new URL(raw);
    } catch (e) {
        return undefined;
    }
    const query = url.searchParams;
    if (url.protocol === "tg:") {
        const host = url.host || url.pathname.replace(/^\/+/, "");
        const post = _linkInt(query.get("post"));
        if (post == undefined) {
            return undefined;
        }
        const common = {
            msgId: post,
            thread: _linkInt(query.get("thread")),
            comment: _linkInt(query.get("comment")),
        };
        if (host === "resolve" && query.get("domain")) {
            return { username: query.get("domain")!, ...common };
        }
        if (host === "privatepost" && _linkInt(query.get("channel"))) {
            return { channelId: query.get("channel")!, ...common };
        }
        return undefined;
    }
    if (!/^(t\.me|telegram\.me|telegram\.dog)$/i.test(url.hostname)) {
        return undefined;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "s") {
        parts.shift();
    }
    if (parts.length < 2) {
        return undefined;
    }
    const msgId = _linkInt(parts[parts.length - 1]);
    if (msgId == undefined) {
        return undefined;
    }
    const thread =
        parts.length >= 3 ? _linkInt(parts[1]) : _linkInt(query.get("thread"));
    const comment = _linkInt(query.get("comment"));
    if (parts[0] === "c") {
        const channelId = parts[1];
        if (parts.length < 3 || !/^\d+$/.test(channelId)) {
            return undefined;
        }
        return {
            channelId,
            msgId,
            thread: parts.length >= 4 ? _linkInt(parts[2]) : thread,
            comment,
        };
    }
    const username = parts[0];
    if (username.startsWith("+") || username.startsWith("joinchat")) {
        return undefined;
    }
    return { username, msgId, thread, comment };
}

export async function getMessageByLink(
    client: TelegramClient,
    link: string
): Promise<Api.Message | undefined> {
    const parsed = _parseMessageLink(link);
    if (!parsed) {
        throw new Error(`Cannot parse message link: ${link}`);
    }
    const peer = await client.getInputEntity(
        parsed.channelId != undefined ? "-100" + parsed.channelId : parsed.username!
    );
    if (parsed.comment != undefined) {
        const discussion = await getCommentData(client, peer, parsed.msgId);
        return (
            await getMessages(client, discussion.entity, {
                ids: parsed.comment,
            })
        )[0];
    }
    return (await getMessages(client, peer, { ids: parsed.msgId }))[0];
}

export interface TranslateTextParams {
    toLang: string;
    tone?: string;
    entity?: EntityLike;
    ids?: number | number[];
    text?: string | string[];
}

export async function translateText(
    client: TelegramClient,
    params: TranslateTextParams
): Promise<Api.messages.TypeTranslatedText> {
    const { toLang, tone, entity, ids, text } = params;
    if ((entity == undefined) !== (ids == undefined)) {
        throw new Error("translateText: entity and ids must be used together");
    }
    if ((entity == undefined) === (text == undefined)) {
        throw new Error(
            "translateText: provide either entity+ids or text, not both"
        );
    }
    return client.invoke(
        new Api.messages.TranslateText({
            toLang: toLang,
            tone: tone,
            peer: entity ? await client.getInputEntity(entity) : undefined,
            id: ids == undefined ? undefined : Array.isArray(ids) ? ids : [ids],
            text:
                text == undefined
                    ? undefined
                    : (Array.isArray(text) ? text : [text]).map(
                          (t) =>
                              new Api.TextWithEntities({
                                  text: t,
                                  entities: [],
                              })
                      ),
        })
    );
}

export async function getMessagesViews(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[],
    increment: boolean = false
): Promise<Api.messages.MessageViews> {
    const peer = await client.getInputEntity(entity);
    return client.api.messages.getMessagesViews({
        peer: peer,
        id: Array.isArray(ids) ? ids : [ids],
        increment: increment,
    });
}

export async function getOutboxReadDate(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike
): Promise<Api.TypeOutboxReadDate> {
    const peer = await client.getInputEntity(entity);
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    return client.api.messages.getOutboxReadDate({
        peer: peer,
        msgId: msgId,
    });
}

export async function getMessageReadParticipants(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike
): Promise<Api.TypeReadParticipantDate[]> {
    const peer = await client.getInputEntity(entity);
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    return client.api.messages.getMessageReadParticipants({
        peer: peer,
        msgId: msgId,
    });
}

export async function getRichMessage(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike
): Promise<Api.Message | undefined> {
    const peer = await client.getInputEntity(entity);
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    const result = await client.api.messages.getRichMessage({
        peer: peer,
        id: msgId,
    });
    if (!("messages" in result)) {
        return undefined;
    }
    const collected = _collectMessages(
        client,
        result.messages,
        result.users,
        result.chats
    );
    return collected.find((m) => m.id === msgId) ?? collected[0];
}

export async function getDiscussionMessage(
    client: TelegramClient,
    entity: EntityLike,
    message: MessageIDLike
): Promise<Api.Message | undefined> {
    const peer = await client.getInputEntity(entity);
    const msgId = utils.getMessageId(message);
    if (msgId == undefined) {
        throw new Error(`Cannot convert ${message} to a message ID`);
    }
    const result = await client.api.messages.getDiscussionMessage({
        peer: peer,
        msgId: msgId,
    });
    const collected = _collectMessages(
        client,
        result.messages,
        result.users,
        result.chats
    );
    if (!collected.length) {
        return undefined;
    }
    return collected.reduce((a, b) => (a.id < b.id ? a : b));
}
