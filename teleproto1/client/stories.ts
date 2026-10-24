import type { TelegramClient } from "./TelegramClient";
import type { EntityLike, FileLike } from "../define";
import type { BigInteger } from "big-integer";
import { generateRandomBigInt } from "../Helpers";
import { Api } from "../tl";
import { _fileToMedia } from "./uploads";
import { _parseMessageText } from "./messageParse";

async function _toStoryMedia(
    client: TelegramClient,
    media: FileLike
): Promise<Api.TypeInputMedia> {
    const converted = await _fileToMedia(client, { file: media });
    if (!converted.media) {
        throw new Error(`Cannot use ${media} as story media`);
    }
    return converted.media;
}

export interface SendStoryParams {
    media: FileLike;
    caption?: string;
    entities?: Api.TypeMessageEntity[];
    parseMode?: any;
    privacyRules?: Api.TypeInputPrivacyRule[];
    pinned?: boolean;
    noforwards?: boolean;
    period?: number;
    mediaAreas?: Api.TypeMediaArea[];
    fwdFromId?: EntityLike;
    fwdFromStory?: number;
    fwdModified?: boolean;
    albums?: number[];
    music?: Api.TypeInputDocument;
}

export async function sendStory(
    client: TelegramClient,
    entity: EntityLike,
    params: SendStoryParams
) {
    const peer = await client.getInputEntity(entity);
    let caption = params.caption;
    let entities = params.entities;
    if (caption != undefined && entities == undefined) {
        [caption, entities] = await _parseMessageText(
            client,
            caption,
            params.parseMode
        );
    }
    return client.invoke(
        new Api.stories.SendStory({
            peer: peer,
            media: await _toStoryMedia(client, params.media),
            caption: caption,
            entities: entities,
            privacyRules: params.privacyRules ?? [
                new Api.InputPrivacyValueAllowAll(),
            ],
            pinned: params.pinned,
            noforwards: params.noforwards,
            period: params.period,
            mediaAreas: params.mediaAreas,
            fwdFromId: params.fwdFromId
                ? await client.getInputEntity(params.fwdFromId)
                : undefined,
            fwdFromStory: params.fwdFromStory,
            fwdModified: params.fwdModified,
            albums: params.albums,
            music: params.music,
            randomId: generateRandomBigInt(),
        })
    );
}

export interface EditStoryParams {
    media?: FileLike;
    caption?: string;
    entities?: Api.TypeMessageEntity[];
    parseMode?: any;
    privacyRules?: Api.TypeInputPrivacyRule[];
    mediaAreas?: Api.TypeMediaArea[];
    music?: Api.TypeInputDocument;
}

export async function editStory(
    client: TelegramClient,
    entity: EntityLike,
    storyId: number,
    params: EditStoryParams
) {
    const peer = await client.getInputEntity(entity);
    let caption = params.caption;
    let entities = params.entities;
    if (caption != undefined && entities == undefined) {
        [caption, entities] = await _parseMessageText(
            client,
            caption,
            params.parseMode
        );
    }
    return client.invoke(
        new Api.stories.EditStory({
            peer: peer,
            id: storyId,
            media: params.media
                ? await _toStoryMedia(client, params.media)
                : undefined,
            caption: caption,
            entities: entities,
            privacyRules: params.privacyRules,
            mediaAreas: params.mediaAreas,
            music: params.music,
        })
    );
}

export async function deleteStories(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[]
): Promise<number[]> {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.stories.DeleteStories({
            peer: peer,
            id: Array.isArray(ids) ? ids : [ids],
        })
    );
}

export async function toggleStoriesPinned(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[],
    pinned: boolean = true
): Promise<number[]> {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.stories.TogglePinned({
            peer: peer,
            id: Array.isArray(ids) ? ids : [ids],
            pinned: pinned,
        })
    );
}

export async function canSendStory(
    client: TelegramClient,
    entity: EntityLike
): Promise<Api.stories.CanSendStoryCount> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.canSendStory({ peer: peer });
}

export interface GetAllStoriesParams {
    next?: boolean;
    hidden?: boolean;
    state?: string;
}

export async function getAllStories(
    client: TelegramClient,
    params: GetAllStoriesParams = {}
): Promise<Api.stories.TypeAllStories> {
    return client.api.stories.getAllStories({
        next: params.next,
        hidden: params.hidden,
        state: params.state,
    });
}

export async function getPeerStories(
    client: TelegramClient,
    entity: EntityLike
): Promise<Api.stories.PeerStories> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.getPeerStories({ peer: peer });
}

export async function getStoriesByID(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[]
): Promise<Api.stories.Stories> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.getStoriesByID({
        peer: peer,
        id: Array.isArray(ids) ? ids : [ids],
    });
}

export interface GetStoriesPageParams {
    offsetId?: number;
    limit?: number;
}

export async function getPinnedStories(
    client: TelegramClient,
    entity: EntityLike,
    params: GetStoriesPageParams = {}
): Promise<Api.stories.Stories> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.getPinnedStories({
        peer: peer,
        offsetId: params.offsetId ?? 0,
        limit: params.limit ?? 100,
    });
}

export async function getStoriesArchive(
    client: TelegramClient,
    entity: EntityLike,
    params: GetStoriesPageParams = {}
): Promise<Api.stories.Stories> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.getStoriesArchive({
        peer: peer,
        offsetId: params.offsetId ?? 0,
        limit: params.limit ?? 100,
    });
}

export async function readStories(
    client: TelegramClient,
    entity: EntityLike,
    maxId?: number
): Promise<number[]> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.readStories({
        peer: peer,
        maxId: maxId ?? 0,
    });
}

export async function incrementStoryViews(
    client: TelegramClient,
    entity: EntityLike,
    ids: number | number[]
): Promise<boolean> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.incrementStoryViews({
        peer: peer,
        id: Array.isArray(ids) ? ids : [ids],
    });
}

export interface GetStoryViewsListParams {
    justContacts?: boolean;
    reactionsFirst?: boolean;
    forwardsFirst?: boolean;
    search?: string;
    offset?: string;
    limit?: number;
}

export async function getStoryViewsList(
    client: TelegramClient,
    entity: EntityLike,
    storyId: number,
    params: GetStoryViewsListParams = {}
): Promise<Api.stories.StoryViewsList> {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.stories.GetStoryViewsList({
            peer: peer,
            id: storyId,
            justContacts: params.justContacts,
            reactionsFirst: params.reactionsFirst,
            forwardsFirst: params.forwardsFirst,
            q: params.search,
            offset: params.offset ?? "",
            limit: params.limit ?? 100,
        })
    );
}

export async function exportStoryLink(
    client: TelegramClient,
    entity: EntityLike,
    storyId: number
): Promise<Api.ExportedStoryLink> {
    const peer = await client.getInputEntity(entity);
    return client.api.stories.exportStoryLink({ peer: peer, id: storyId });
}

export async function sendStoryReaction(
    client: TelegramClient,
    entity: EntityLike,
    storyId: number,
    reaction?: string | BigInteger | Api.TypeReaction,
    params: { addToRecent?: boolean } = {}
) {
    const peer = await client.getInputEntity(entity);
    let resolved: Api.TypeReaction;
    if (reaction == undefined) {
        resolved = new Api.ReactionEmpty();
    } else if (typeof reaction === "string") {
        resolved = new Api.ReactionEmoji({ emoticon: reaction });
    } else if (
        reaction instanceof Api.ReactionEmoji ||
        reaction instanceof Api.ReactionCustomEmoji ||
        reaction instanceof Api.ReactionPaid ||
        reaction instanceof Api.ReactionEmpty
    ) {
        resolved = reaction;
    } else {
        resolved = new Api.ReactionCustomEmoji({
            documentId: reaction as BigInteger,
        });
    }
    return client.invoke(
        new Api.stories.SendReaction({
            peer: peer,
            storyId: storyId,
            reaction: resolved,
            addToRecent: params.addToRecent,
        })
    );
}
