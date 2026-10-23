import { Api } from "../../tl";
import type { TelegramClient } from "../TelegramClient";
import { generateRandomLong, unionId } from "../../Helpers";
import { getInputMedia, getMessageId } from "../../Utils";
import { EntityLike, FileLike, MarkupLike, MessageIDLike } from "../../define";
import path from "path";
import { promises as fs } from "fs";
import { createHash } from "crypto";
import * as utils from "../../Utils";
import { _parseMessageText } from "./messageParse";
import bigInt, { BigInteger } from "big-integer";
import { MediaAbortError } from "../../errors";
import { FileUploader } from "../files/FileUploader";
import { findUploads, rememberUpload, type UploadSource } from "../files/uploadRegistry";
import { choosePartSize, MAX_PART_SIZE } from "../files/PartsManager";
import { Buffer } from "node:buffer";

interface OnProgress {
    (progress: number): void;

    isCanceled?: boolean;
}

export interface UploadFileParams {
    file: NamedBlob | CustomFile;
    workers?: number;
    onProgress?: OnProgress;
    maxBufferSize?: number;
}

export interface NamedBlob {
    name: string;
    size: number;
    arrayBuffer(): Promise<ArrayBuffer>;
}

function isNamedBlob(value: unknown): value is NamedBlob {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as NamedBlob).arrayBuffer === "function" &&
        typeof (value as NamedBlob).name === "string" &&
        typeof (value as NamedBlob).size === "number"
    );
}

export class CustomFile {
    name: string;
    size: number;
    path: string;
    buffer?: Buffer;

    constructor(name: string, size: number, path: string, buffer?: Buffer) {
        this.name = name;
        this.size = size;
        this.path = path;
        this.buffer = buffer;
    }
}

const BUFFER_SIZE_20MB = 20 * 1024 * 1024;

async function openUploadSource(file: NamedBlob | CustomFile, size: number, maxBufferSize: number): Promise<UploadSource> {
    if (size > maxBufferSize && file instanceof CustomFile && file.path) {
        const handle = await fs.open(file.path, "r");
        return {
            async read(offset, length) {
                const buffer = Buffer.allocUnsafe(length);
                let read = 0;
                while (read < length) {
                    const { bytesRead } = await handle.read(buffer, read, length - read, offset + read);
                    if (!bytesRead) throw new Error(`${file.path} ended at ${offset + read} bytes, expected ${size}`);
                    read += bytesRead;
                }
                return buffer;
            },
            close: () => handle.close(),
        };
    }
    const buffer = Buffer.from(await fileToBuffer(file));
    return {
        read: async (offset, length) => buffer.subarray(offset, offset + length),
        close: async () => {},
    };
}

export async function uploadFile(
    client: TelegramClient,
    fileParams: UploadFileParams
): Promise<Api.InputFile | Api.InputFileBig> {
    const { file, onProgress, workers } = fileParams;
    const { name, size } = file;
    const fileId = generateRandomLong(true);
    let partSize = choosePartSize(size, client._files.maxPartSize);
    const maxParts = await client._files.maxUploadParts();
    if (Math.ceil(size / MAX_PART_SIZE) > maxParts) {
        throw new Error(`${name} is ${size} bytes, larger than the ${maxParts * MAX_PART_SIZE} bytes this account can upload`);
    }
    if (Math.ceil(size / partSize) > maxParts) partSize = MAX_PART_SIZE;
    const maxBufferSize = fileParams.maxBufferSize || BUFFER_SIZE_20MB - 1;
    const source = await openUploadSource(file, size, maxBufferSize);
    const abort = new AbortController();
    let uploaded = 0;
    onProgress?.(0);
    const uploader = new FileUploader(client._files, {
        fileId,
        size,
        partSize,
        dcId: client.session.dcId,
        maxInflight: workers && workers > 0 ? workers : undefined,
        read: (offset, length) => source.read(offset, length),
        signal: abort.signal,
        onPart: () => {
            if (!onProgress) return;
            if (onProgress.isCanceled) {
                abort.abort();
                return;
            }
            onProgress(++uploaded / uploader.partCount);
        },
    });
    try {
        await uploader.run();
        const parts = uploader.partCount;
        const input = uploader.isBig
            ? new Api.InputFileBig({ id: fileId, parts, name })
            : new Api.InputFile({ id: fileId, parts, name, md5Checksum: createHash("md5").update(await source.read(0, size)).digest("hex") });
        rememberUpload(input, {
            fileId,
            size,
            partSize,
            partCount: parts,
            isBig: uploader.isBig,
            dcId: client.session.dcId,
            open: () => openUploadSource(file, size, maxBufferSize),
        });
        return input;
    } catch (error) {
        if (error instanceof MediaAbortError && onProgress?.isCanceled) throw new Error("USER_CANCELED");
        throw error;
    } finally {
        await source.close();
    }
}

export async function _resaveUploadedParts(client: TelegramClient, request: unknown, part: number | "all"): Promise<boolean> {
    const files = findUploads(request);
    if (!files.length) return false;
    for (const file of files) {
        if (part !== "all" && part >= file.partCount) continue;
        const source = await file.open();
        try {
            if (part === "all") {
                await new FileUploader(client._files, { ...file, read: (offset, length) => source.read(offset, length) }).run();
                continue;
            }
            const offset = part * file.partSize;
            const bytes = await source.read(offset, Math.min(file.partSize, file.size - offset));
            await client._files.run("upload", file.dcId, () =>
                file.isBig
                    ? new Api.upload.SaveBigFilePart({ fileId: file.fileId, filePart: part, fileTotalParts: file.partCount, bytes })
                    : new Api.upload.SaveFilePart({ fileId: file.fileId, filePart: part, bytes })
            );
        } finally {
            await source.close();
        }
    }
    client._log.info(`Re-saved ${part === "all" ? "all parts" : `part ${part}`} of ${files.length} uploaded file(s)`);
    return true;
}

export interface SendFileInterface {
    file: FileLike | FileLike[];
    caption?: string | string[];
    forceDocument?: boolean;
    fileSize?: number;
    clearDraft?: boolean;
    progressCallback?: OnProgress;
    replyTo?: MessageIDLike | Api.TypeInputReplyTo;
    quoteText?: string;
    quoteEntities?: Api.TypeMessageEntity[];
    quoteOffset?: number;
    replyToPeerId?: EntityLike;
    attributes?: Api.TypeDocumentAttribute[] | Api.TypeDocumentAttribute[][];
    thumb?: FileLike;
    voiceNote?: boolean;
    videoNote?: boolean;
    supportsStreaming?: boolean;
    parseMode?: any;
    formattingEntities?: Api.TypeMessageEntity[];
    silent?: boolean;
    scheduleDate?: number;
    buttons?: MarkupLike;
    workers?: number;
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
    spoiler?: boolean;
    ttlSeconds?: number;
    nosoundVideo?: boolean;
    videoCover?: Api.TypeInputPhoto;
    videoTimestamp?: number;
}

interface FileToMediaInterface {
    file: FileLike;
    forceDocument?: boolean;
    fileSize?: number;
    progressCallback?: OnProgress;
    attributes?: Api.TypeDocumentAttribute[];
    thumb?: FileLike;
    voiceNote?: boolean;
    videoNote?: boolean;
    supportsStreaming?: boolean;
    mimeType?: string;
    asImage?: boolean;
    workers?: number;
    spoiler?: boolean;
    ttlSeconds?: number;
    nosoundVideo?: boolean;
    videoCover?: Api.TypeInputPhoto;
    videoTimestamp?: number;
}

export function _toQuickReplyShortcut(
    shortcut: string | number | Api.TypeInputQuickReplyShortcut | undefined
): Api.TypeInputQuickReplyShortcut | undefined {
    if (shortcut == undefined) {
        return undefined;
    }
    if (typeof shortcut === "string") {
        return new Api.InputQuickReplyShortcut({ shortcut });
    }
    if (typeof shortcut === "number") {
        return new Api.InputQuickReplyShortcutId({ shortcutId: shortcut });
    }
    return shortcut;
}

export async function _toReplyObject(
    client: TelegramClient,
    replyTo: MessageIDLike | Api.TypeInputReplyTo | undefined,
    topMsgId?: number | Api.Message,
    quote?: {
        quoteText?: string;
        quoteEntities?: Api.TypeMessageEntity[];
        quoteOffset?: number;
        replyToPeerId?: EntityLike;
    }
): Promise<Api.TypeInputReplyTo | undefined> {
    if (
        replyTo != undefined &&
        typeof replyTo === "object" &&
        (replyTo as any).SUBCLASS_OF_ID === unionId("InputReplyTo")
    ) {
        return replyTo as Api.TypeInputReplyTo;
    }
    const replyToMsgId =
        replyTo != undefined
            ? getMessageId(replyTo as MessageIDLike)
            : getMessageId(topMsgId);
    if (replyToMsgId == undefined) {
        return undefined;
    }
    return new Api.InputReplyToMessage({
        replyToMsgId,
        topMsgId: replyTo != undefined ? getMessageId(topMsgId) : undefined,
        quoteText: quote?.quoteText,
        quoteEntities: quote?.quoteEntities,
        quoteOffset: quote?.quoteOffset,
        replyToPeerId: quote?.replyToPeerId
            ? await client.getInputEntity(quote.replyToPeerId)
            : undefined,
    });
}

export async function _fileToMedia(
    client: TelegramClient,
    {
        file,
        forceDocument,
        fileSize,
        progressCallback,
        attributes,
        thumb,
        voiceNote = false,
        videoNote = false,
        supportsStreaming = false,
        mimeType,
        asImage,
        workers,
        spoiler,
        ttlSeconds,
        nosoundVideo,
        videoCover,
        videoTimestamp,
    }: FileToMediaInterface
): Promise<{
    fileHandle?: any;
    media?: Api.TypeInputMedia;
    image?: boolean;
}> {
    if (!file) {
        return { fileHandle: undefined, media: undefined, image: undefined };
    }
    const isImage = utils.isImage(file);

    if (asImage == undefined) {
        asImage = isImage && !forceDocument;
    }
    if (
        typeof file == "object" &&
        !Buffer.isBuffer(file) &&
        !(file instanceof Api.InputFile) &&
        !(file instanceof Api.InputFileBig) &&
        !(file instanceof CustomFile) &&
        !isNamedBlob(file) &&
        !("read" in file)
    ) {
        try {
            return {
                fileHandle: undefined,
                media: utils.getInputMedia(file, {
                    isPhoto: asImage,
                    attributes: attributes,
                    forceDocument: forceDocument,
                    voiceNote: voiceNote,
                    videoNote: videoNote,
                    supportsStreaming: supportsStreaming,
                    spoiler: spoiler,
                    ttlSeconds: ttlSeconds,
                    nosoundVideo: nosoundVideo,
                    videoCover: videoCover,
                    videoTimestamp: videoTimestamp,
                }),
                image: asImage,
            };
        } catch (e) {
            return {
                fileHandle: undefined,
                media: undefined,
                image: isImage,
            };
        }
    }
    let media;
    let fileHandle;
    let createdFile;

    if (file instanceof Api.InputFile || file instanceof Api.InputFileBig) {
        fileHandle = file;
    } else if (
        typeof file == "string" &&
        (file.startsWith("https://") || file.startsWith("http://"))
    ) {
        if (asImage) {
            media = new Api.InputMediaPhotoExternal({
                url: file,
                spoiler: spoiler,
                ttlSeconds: ttlSeconds,
            });
        } else {
            media = new Api.InputMediaDocumentExternal({
                url: file,
                spoiler: spoiler,
                ttlSeconds: ttlSeconds,
                videoCover: videoCover,
                videoTimestamp: videoTimestamp,
            });
        }
    } else if (!(typeof file == "string") || (await fs.lstat(file)).isFile()) {
        if (typeof file == "string") {
            createdFile = new CustomFile(
                path.basename(file),
                (await fs.stat(file)).size,
                file
            );
        } else if (isNamedBlob(file) || file instanceof CustomFile) {
            createdFile = file;
        } else {
            const name =
                "name" in file && typeof file.name === "string"
                    ? file.name
                    : "unnamed";
            if (Buffer.isBuffer(file)) {
                createdFile = new CustomFile(name, file.length, "", file);
            }
        }
        if (!createdFile) {
            throw new Error(
                `Could not create file from ${JSON.stringify(file)}`
            );
        }
        fileHandle = await uploadFile(client, {
            file: createdFile,
            onProgress: progressCallback,
            workers: workers,
        });
    } else {
        throw new Error(`"Not a valid path nor a url ${file}`);
    }
    if (media != undefined) {
    } else if (fileHandle == undefined) {
        throw new Error(
            `Failed to convert ${file} to media. Not an existing file or an HTTP URL`
        );
    } else if (asImage) {
        media = new Api.InputMediaUploadedPhoto({
            file: fileHandle,
            spoiler: spoiler,
            ttlSeconds: ttlSeconds,
        });
    } else {
        // @ts-ignore
        let res = utils.getAttributes(file, {
            mimeType: mimeType,
            attributes: attributes,
            forceDocument: forceDocument && !isImage,
            voiceNote: voiceNote,
            videoNote: videoNote,
            supportsStreaming: supportsStreaming,
            thumb: thumb,
        });
        attributes = res.attrs;
        mimeType = res.mimeType;

        let uploadedThumb;
        if (!thumb) {
            uploadedThumb = undefined;
        } else {
            if (typeof thumb == "string") {
                uploadedThumb = new CustomFile(
                    path.basename(thumb),
                    (await fs.stat(thumb)).size,
                    thumb
                );
            } else if (isNamedBlob(thumb)) {
                uploadedThumb = thumb;
            } else {
                let name;
                if ("name" in thumb) {
                    name = thumb.name;
                } else {
                    name = "unnamed";
                }
                if (Buffer.isBuffer(thumb)) {
                    uploadedThumb = new CustomFile(
                        name,
                        thumb.length,
                        "",
                        thumb
                    );
                }
            }
            if (!uploadedThumb) {
                throw new Error(`Could not create file from ${file}`);
            }
            uploadedThumb = await uploadFile(client, {
                file: uploadedThumb,
                workers: 1,
            });
        }
        media = new Api.InputMediaUploadedDocument({
            file: fileHandle,
            mimeType: mimeType,
            attributes: attributes,
            thumb: uploadedThumb,
            forceFile: forceDocument && !isImage,
            spoiler: spoiler,
            ttlSeconds: ttlSeconds,
            nosoundVideo: nosoundVideo,
            videoCover: videoCover,
            videoTimestamp: videoTimestamp,
        });
    }
    return {
        fileHandle: fileHandle,
        media: media,
        image: asImage,
    };
}

export async function _sendAlbum(
    client: TelegramClient,
    entity: EntityLike,
    {
        file,
        caption,
        formattingEntities,
        forceDocument = false,
        fileSize,
        clearDraft = false,
        progressCallback,
        replyTo,
        attributes,
        thumb,
        parseMode,
        voiceNote = false,
        videoNote = false,
        silent,
        supportsStreaming = false,
        scheduleDate,
        workers,
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
        quickReplyShortcut,
        quoteText,
        quoteEntities,
        quoteOffset,
        replyToPeerId,
        spoiler,
        ttlSeconds,
        nosoundVideo,
        videoCover,
        videoTimestamp,
    }: SendFileInterface
) {
    entity = await client.getInputEntity(entity);
    let files = [];
    if (!Array.isArray(file)) {
        files = [file];
    } else {
        files = file;
    }
    if (!Array.isArray(caption)) {
        if (!caption) {
            caption = "";
        }
        caption = [caption];
    }
    const captions: [string, Api.TypeMessageEntity[]][] = [];
    for (const [i, c] of caption.entries()) {
        if (i === 0 && formattingEntities) {
            captions.push([c || "", formattingEntities]);
        } else {
            captions.push(await _parseMessageText(client, c, parseMode));
        }
    }
    if (commentTo != undefined) {
        const discussionData = await client.getCommentData(entity, commentTo);
        entity = discussionData.entity;
        replyTo = discussionData.replyTo;
    }
    if (!attributes) {
        attributes = [];
    }

    let index = 0;
    const albumFiles = [];
    for (const file of files) {
        let { fileHandle, media, image } = await _fileToMedia(client, {
            file: file,
            forceDocument: forceDocument,
            fileSize: fileSize,
            progressCallback: progressCallback,
            // @ts-ignore
            attributes: attributes[index],
            thumb: thumb,
            voiceNote: voiceNote,
            videoNote: videoNote,
            supportsStreaming: supportsStreaming,
            workers: workers,
            spoiler: spoiler,
            ttlSeconds: ttlSeconds,
            nosoundVideo: nosoundVideo,
            videoCover: videoCover,
            videoTimestamp: videoTimestamp,
        });
        index++;
        if (
            media instanceof Api.InputMediaUploadedPhoto ||
            media instanceof Api.InputMediaPhotoExternal
        ) {
            const r = await client.invoke(
                new Api.messages.UploadMedia({
                    peer: entity,
                    media,
                })
            );
            if (r instanceof Api.MessageMediaPhoto) {
                media = getInputMedia(r.photo, {
                    spoiler: spoiler,
                    ttlSeconds: ttlSeconds,
                });
            }
        } else if (media instanceof Api.InputMediaUploadedDocument) {
            const r = await client.invoke(
                new Api.messages.UploadMedia({
                    peer: entity,
                    media,
                })
            );
            if (r instanceof Api.MessageMediaDocument) {
                media = getInputMedia(r.document, {
                    spoiler: spoiler,
                    ttlSeconds: ttlSeconds,
                    videoCover: videoCover,
                    videoTimestamp: videoTimestamp,
                });
            }
        }
        let text = "";
        let msgEntities: Api.TypeMessageEntity[] = [];
        if (captions.length) {
            [text, msgEntities] = captions.shift()!;
        }
        albumFiles.push(
            new Api.InputSingleMedia({
                media: media!,
                message: text,
                entities: msgEntities,
            })
        );
    }
    const replyObject = await _toReplyObject(client, replyTo, topMsgId, {
        quoteText,
        quoteEntities,
        quoteOffset,
        replyToPeerId,
    });

    const result = await client.invoke(
        new Api.messages.SendMultiMedia({
            peer: entity,
            replyTo: replyObject,
            multiMedia: albumFiles,
            silent: silent,
            scheduleDate: scheduleDate,
            clearDraft: clearDraft,
            noforwards: noforwards,
            background: background,
            updateStickersetsOrder: updateStickersetsOrder,
            allowPaidFloodskip: allowPaidFloodskip,
            allowPaidStars: allowPaidStars,
            quickReplyShortcut: _toQuickReplyShortcut(quickReplyShortcut),
            sendAs: sendAs
                ? await client.getInputEntity(sendAs)
                : undefined,
            effect: effect,
            invertMedia: invertMedia,
        })
    );
    const randomIds = albumFiles.map((m) => m.randomId);
    return client._getResponseMessage(randomIds, result, entity) as Api.Message;
}

export async function sendFile(
    client: TelegramClient,
    entity: EntityLike,
    {
        file,
        caption,
        forceDocument = false,
        fileSize,
        clearDraft = false,
        progressCallback,
        replyTo,
        attributes,
        thumb,
        parseMode,
        formattingEntities,
        voiceNote = false,
        videoNote = false,
        buttons,
        silent,
        supportsStreaming = false,
        scheduleDate,
        workers,
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
        quoteText,
        quoteEntities,
        quoteOffset,
        replyToPeerId,
        spoiler,
        ttlSeconds,
        nosoundVideo,
        videoCover,
        videoTimestamp,
    }: SendFileInterface
) {
    if (!file) {
        throw new Error("You need to specify a file");
    }
    if (!caption) {
        caption = "";
    }
    entity = await client.getInputEntity(entity);
    if (commentTo != undefined) {
        const discussionData = await client.getCommentData(entity, commentTo);
        entity = discussionData.entity;
        replyTo = discussionData.replyTo;
    }
    if (Array.isArray(file)) {
        return await _sendAlbum(client, entity, {
            file: file,
            caption: caption,
            formattingEntities: formattingEntities,
            replyTo: replyTo,
            parseMode: parseMode,
            attributes: attributes,
            silent: silent,
            scheduleDate: scheduleDate,
            supportsStreaming: supportsStreaming,
            clearDraft: clearDraft,
            forceDocument: forceDocument,
            noforwards: noforwards,
            topMsgId: topMsgId,
            fileSize: fileSize,
            progressCallback: progressCallback,
            workers: workers,
            thumb: thumb,
            voiceNote: voiceNote,
            videoNote: videoNote,
            sendAs: sendAs,
            effect: effect,
            invertMedia: invertMedia,
            background: background,
            updateStickersetsOrder: updateStickersetsOrder,
            allowPaidFloodskip: allowPaidFloodskip,
            allowPaidStars: allowPaidStars,
            quickReplyShortcut: quickReplyShortcut,
            quoteText: quoteText,
            quoteEntities: quoteEntities,
            quoteOffset: quoteOffset,
            replyToPeerId: replyToPeerId,
            spoiler: spoiler,
            ttlSeconds: ttlSeconds,
            nosoundVideo: nosoundVideo,
            videoCover: videoCover,
            videoTimestamp: videoTimestamp,
        });
    }
    if (Array.isArray(caption)) {
        caption = caption[0] || "";
    }
    let msgEntities;
    if (formattingEntities != undefined) {
        msgEntities = formattingEntities;
    } else {
        [caption, msgEntities] = await _parseMessageText(
            client,
            caption,
            parseMode
        );
    }

    const { fileHandle, media, image } = await _fileToMedia(client, {
        file: file,
        forceDocument: forceDocument,
        fileSize: fileSize,
        progressCallback: progressCallback,
        // @ts-ignore
        attributes: attributes,
        thumb: thumb,
        voiceNote: voiceNote,
        videoNote: videoNote,
        supportsStreaming: supportsStreaming,
        workers: workers,
        spoiler: spoiler,
        ttlSeconds: ttlSeconds,
        nosoundVideo: nosoundVideo,
        videoCover: videoCover,
        videoTimestamp: videoTimestamp,
    });
    if (media == undefined) {
        throw new Error(`Cannot use ${file} as file.`);
    }
    const markup = client.buildReplyMarkup(buttons);
    const replyObject = await _toReplyObject(client, replyTo, topMsgId, {
        quoteText,
        quoteEntities,
        quoteOffset,
        replyToPeerId,
    });

    const request = new Api.messages.SendMedia({
        peer: entity,
        media: media,
        replyTo: replyObject,
        message: caption,
        entities: msgEntities,
        replyMarkup: markup,
        silent: silent,
        scheduleDate: scheduleDate,
        scheduleRepeatPeriod: scheduleRepeatPeriod,
        clearDraft: clearDraft,
        noforwards: noforwards,
        background: background,
        updateStickersetsOrder: updateStickersetsOrder,
        allowPaidFloodskip: allowPaidFloodskip,
        allowPaidStars: allowPaidStars,
        quickReplyShortcut: _toQuickReplyShortcut(quickReplyShortcut),
        suggestedPost: suggestedPost,
        sendAs: sendAs
            ? await client.getInputEntity(sendAs)
            : undefined,
        effect: effect,
        invertMedia: invertMedia,
    });
    const result = await client.invoke(request);
    return client._getResponseMessage(request, result, entity) as Api.Message;
}

function fileToBuffer(file: NamedBlob | CustomFile): Promise<Buffer> | Buffer {
    if (file instanceof CustomFile) {
        if (file.buffer != undefined) {
            return file.buffer;
        } else {
            return fs.readFile(file.path) as unknown as Buffer;
        }
    } else if (isNamedBlob(file)) {
        return file.arrayBuffer().then((ab) => Buffer.from(ab));
    } else {
        throw new Error("Could not create buffer from file " + file);
    }
}