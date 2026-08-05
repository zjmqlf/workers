import type { TelegramClient } from "./TelegramClient";
import type { EntityLike } from "../define";
import type { BigInteger } from "big-integer";
import { generateRandomBigInt } from "../Helpers";
import { Api } from "../tl";

export interface CreateForumTopicParams {
    title: string;
    iconColor?: number;
    iconEmojiId?: BigInteger;
    titleMissing?: boolean;
    sendAs?: EntityLike;
}

export async function createForumTopic(
    client: TelegramClient,
    entity: EntityLike,
    params: CreateForumTopicParams
) {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.messages.CreateForumTopic({
            peer: peer,
            title: params.title,
            iconColor: params.iconColor,
            iconEmojiId: params.iconEmojiId,
            titleMissing: params.titleMissing,
            randomId: generateRandomBigInt(),
            sendAs: params.sendAs
                ? await client.getInputEntity(params.sendAs)
                : undefined,
        })
    );
}

export interface EditForumTopicParams {
    title?: string;
    iconEmojiId?: BigInteger;
    closed?: boolean;
    hidden?: boolean;
}

export async function editForumTopic(
    client: TelegramClient,
    entity: EntityLike,
    topicId: number,
    params: EditForumTopicParams
) {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.messages.EditForumTopic({
            peer: peer,
            topicId: topicId,
            title: params.title,
            iconEmojiId: params.iconEmojiId,
            closed: params.closed,
            hidden: params.hidden,
        })
    );
}

export async function updatePinnedForumTopic(
    client: TelegramClient,
    entity: EntityLike,
    topicId: number,
    pinned: boolean
) {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.messages.UpdatePinnedForumTopic({
            peer: peer,
            topicId: topicId,
            pinned: pinned,
        })
    );
}

export async function reorderPinnedForumTopics(
    client: TelegramClient,
    entity: EntityLike,
    order: number[],
    params: { force?: boolean } = {}
) {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.messages.ReorderPinnedForumTopics({
            peer: peer,
            order: order,
            force: params.force,
        })
    );
}

export interface GetForumTopicsParams {
    search?: string;
    offsetDate?: number;
    offsetId?: number;
    offsetTopic?: number;
    limit?: number;
}

export async function getForumTopics(
    client: TelegramClient,
    entity: EntityLike,
    params: GetForumTopicsParams = {}
): Promise<Api.messages.ForumTopics> {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.messages.GetForumTopics({
            peer: peer,
            q: params.search,
            offsetDate: params.offsetDate ?? 0,
            offsetId: params.offsetId ?? 0,
            offsetTopic: params.offsetTopic ?? 0,
            limit: params.limit ?? 100,
        })
    );
}

export async function getForumTopicsByID(
    client: TelegramClient,
    entity: EntityLike,
    topicIds: number | number[]
): Promise<Api.messages.ForumTopics> {
    const peer = await client.getInputEntity(entity);
    return client.invoke(
        new Api.messages.GetForumTopicsByID({
            peer: peer,
            topics: Array.isArray(topicIds) ? topicIds : [topicIds],
        })
    );
}

export async function toggleForum(
    client: TelegramClient,
    entity: EntityLike,
    enabled: boolean,
    tabs: boolean = false
) {
    const channel = await client.getInputEntity(entity);
    return client.api.channels.toggleForum({
        channel: channel,
        enabled: enabled,
        tabs: tabs,
    });
}

export async function toggleViewForumAsMessages(
    client: TelegramClient,
    entity: EntityLike,
    enabled: boolean
) {
    const channel = await client.getInputEntity(entity);
    return client.api.channels.toggleViewForumAsMessages({
        channel: channel,
        enabled: enabled,
    });
}
