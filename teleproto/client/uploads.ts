import { Api } from "../tl";

import { TelegramClient } from "./TelegramClient";
import { generateRandomBytes, readBigIntFromBuffer, unionId } from "../Helpers";
import { getAppropriatedPartSize, getInputMedia, getMessageId } from "../Utils";
import { EntityLike, FileLike, MarkupLike, MessageIDLike } from "../define";
import path from "node:path";
import { promises as fs } from "node:fs";
import * as utils from "../Utils";
import { _parseMessageText } from "./messageParse";
import bigInt, { BigInteger } from "big-integer";
import { BoundedSemaphore } from "../network/OrderedWriter";
import { Buffer } from "node:buffer";

interface OnProgress {
    (progress: number): void;

    isCanceled?: boolean;
}

export interface UploadFileParams {
    file: File | CustomFile;
    workers?: number;
    onProgress?: OnProgress;
    maxBufferSize?: number;
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

interface CustomBufferOptions {
    filePath?: string;
    buffer?: Buffer;
}

class CustomBuffer {
    constructor(private readonly options: CustomBufferOptions) {
        if (!options.buffer && !options.filePath) {
            throw new Error(
                "Either one of `buffer` or `filePath` should be specified"
            );
        }
    }

    async slice(begin: number, end: number): Promise<Buffer> {
        const { buffer, filePath } = this.options;
        if (buffer) {
            return buffer.slice(begin, end);
        } else if (filePath) {
            const buffSize = end - begin;
            const buff = Buffer.alloc(buffSize);
            const fHandle = await fs.open(filePath, "r");

            await fHandle.read(buff, 0, buffSize, begin);
            await fHandle.close();

            return Buffer.from(buff);
        }

        return Buffer.alloc(0);
    }
}

const KB_TO_BYTES = 1024;
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;
const BUFFER_SIZE_20MB = 20 * 1024 * 1024;

async function getFileBuffer(
    file: File | CustomFile,
    fileSize: number,
    maxBufferSize: number
): Promise<CustomBuffer> {
    const options: CustomBufferOptions = {};
    if (fileSize > maxBufferSize && file instanceof CustomFile) {
        options.filePath = file.path;
    } else {
        options.buffer = Buffer.from(await fileToBuffer(file));
    }

    return new CustomBuffer(options);
}

export async function uploadFile(
    client: TelegramClient,
    fileParams: UploadFileParams
): Promise<Api.InputFile | Api.InputFileBig> {
    const { file, onProgress } = fileParams;
    let { workers } = fileParams;

    const { name, size } = file;
    const fileId = readBigIntFromBuffer(generateRandomBytes(8), true, true);
    const isLarge = size > LARGE_FILE_THRESHOLD;

    const partSize = getAppropriatedPartSize(bigInt(size)) * KB_TO_BYTES;
    const partCount = Math.floor((size + partSize - 1) / partSize);
    const buffer = await getFileBuffer(
        file,
        size,
        fileParams.maxBufferSize || BUFFER_SIZE_20MB - 1
    );

    const ul = client._media.opts.upload;
    let readAhead = Math.max(
        1,
        ul.maxSessions * Math.ceil(ul.maxWindow / Math.max(1, partSize))
    );
    if (workers && workers > 0) {
        readAhead = Math.min(readAhead, workers);
    }
    if (readAhead > partCount) {
        readAhead = partCount;
    }

    let progress = 0;
    if (onProgress) {
        onProgress(progress);
    }

    const dcId = client.session.dcId;
    const abort = new AbortController();
    const inflight = new BoundedSemaphore(Math.max(1, readAhead));
    let firstError: any;
    const tasks: Promise<void>[] = [];

    for (let j = 0; j < partCount; j++) {
        let endPart = (j + 1) * partSize;
        if (endPart > size) {
            endPart = size;
        }
        if (endPart == j * partSize) {
            break;
        }

        if (firstError) break;
        await inflight.acquire();
        if (firstError) {
            inflight.release();
            break;
        }

        const jMemo = j;
        const startPart = j * partSize;
        const endPartMemo = endPart;

        // eslint-disable-next-line no-loop-func
        tasks.push(
            (async () => {
                try {
                    const bytesMemo = await buffer.slice(startPart, endPartMemo);
                    await client._media.savePart(
                        dcId,
                        isLarge
                            ? new Api.upload.SaveBigFilePart({
                                fileId,
                                filePart: jMemo,
                                fileTotalParts: partCount,
                                bytes: bytesMemo,
                            })
                            : new Api.upload.SaveFilePart({
                                fileId,
                                filePart: jMemo,
                                bytes: bytesMemo,
                            }),
                        abort.signal
                    );

                    if (onProgress) {
                        if (onProgress.isCanceled) {
                            throw new Error("USER_CANCELED");
                        }

                        progress += 1 / partCount;
                        onProgress(progress);
                    }
                } catch (err: any) {
                    if (!firstError) firstError = err;
                    abort.abort();
                } finally {
                    inflight.release();
                }
            })()
        );
    }

    await Promise.all(tasks);
    if (firstError) {
        throw firstError;
    }

    return isLarge
        ? new Api.InputFileBig({
            id: fileId,
            parts: partCount,
            name,
        })
        : new Api.InputFile({
            id: fileId,
            parts: partCount,
            name,
            md5Checksum: "",
        });
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
        } else if (
            (typeof File !== "undefined" && file instanceof File) ||
            file instanceof CustomFile
        ) {
            createdFile = file;
        } else {
            let name;
            if ("name" in file) {
                // @ts-ignore
                name = file.name;
            } else {
                name = "unnamed";
            }
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
            } else if (typeof File !== "undefined" && thumb instanceof File) {
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

function fileToBuffer(file: File | CustomFile): Promise<Buffer> | Buffer {
    if (typeof File !== "undefined" && file instanceof File) {
        return new Response(file)
            .arrayBuffer()
            .then((ab) => Buffer.from(ab));
    } else if (file instanceof CustomFile) {
        if (file.buffer != undefined) {
            return file.buffer;
        } else {
            return fs.readFile(file.path) as unknown as Buffer;
        }
    } else {
        throw new Error("Could not create buffer from file " + file);
    }
}