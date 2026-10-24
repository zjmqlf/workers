import type { TelegramClient } from "./TelegramClient";
import type { Entity, EntityLike } from "../define";
import { Api } from "../tl";
import { getInputChannel, getPeerId } from "../Utils";
import { RequestIter } from "../requestIter";
import { TotalList } from "../Helpers";
import type { UpdateNotifySettingsParams } from "./account";

export interface CreateCommunityParams {
    title: string;
    peer: EntityLike;
    about?: string;
    hidden?: boolean;
}

export type CommunityPeerLinkAction = "visible" | "hidden" | "deleted";

export type CommunityPeer = Api.CommunityPeer & { entity?: Entity };

export type CommunityPeerLinkRequest = Api.CommunityPeerRequest & {
    entity?: Entity;
    requestedByUser?: Api.User;
};

export interface IterCommunityPeerLinkRequestsParams {
    offset?: string;
    limit?: number;
    waitTime?: number;
}

export type FullCommunity = Api.messages.ChatFull & {
    fullChat: Api.CommunityFull;
};

export async function createCommunity(
    client: TelegramClient,
    params: CreateCommunityParams
): Promise<Api.Community> {
    const result = await client.invoke(new Api.communities.Create({
        title: params.title,
        peer: await client.getInputEntity(params.peer),
        about: params.about,
        hidden: params.hidden,
    }));
    if (result instanceof Api.Updates || result instanceof Api.UpdatesCombined) {
        const community = result.chats.find(
            (chat): chat is Api.Community => chat instanceof Api.Community
        );
        if (community) return community;
    }
    throw new Error("Telegram did not return the created community");
}

export async function getCommunity(
    client: TelegramClient,
    community: EntityLike
): Promise<FullCommunity> {
    const result = await client.invoke(new Api.channels.GetFullChannel({
        channel: getInputChannel(await client.getInputEntity(community)),
    }));
    if (!(result.fullChat instanceof Api.CommunityFull)) {
        throw new Error("The entity is not a community");
    }
    return result as FullCommunity;
}

export async function getJoinedCommunities(
    client: TelegramClient
): Promise<TotalList<Api.Community | Api.CommunityForbidden>> {
    const result = await client.invoke(new Api.communities.GetJoinedCommunities());
    const communities = new TotalList<Api.Community | Api.CommunityForbidden>();
    for (const chat of result.chats) {
        if (chat instanceof Api.Community || chat instanceof Api.CommunityForbidden) {
            communities.push(chat);
        }
    }
    communities.total = result instanceof Api.messages.ChatsSlice
        ? result.count
        : communities.length;
    return communities;
}

export async function getCommunityPeers(
    client: TelegramClient,
    community: EntityLike
): Promise<CommunityPeer[]> {
    const result = await getCommunity(client, community);
    const entities = new Map<string, Entity>(
        [...result.chats, ...result.users].map((entity) => [getPeerId(entity), entity])
    );
    return result.fullChat.linkedPeers.map((peer) => Object.assign(peer, {
        entity: entities.get(getPeerId(peer.peer)),
    }));
}

export async function setCommunityPeerLink(
    client: TelegramClient,
    community: EntityLike,
    peer: EntityLike,
    action: CommunityPeerLinkAction
): Promise<boolean> {
    if (!["visible", "hidden", "deleted"].includes(action)) {
        throw new Error("Community peer link action must be visible, hidden or deleted");
    }
    return client.invoke(new Api.communities.TogglePeerLink({
        community: getInputChannel(await client.getInputEntity(community)),
        peer: await client.getInputEntity(peer),
        visible: action === "visible" || undefined,
        hidden: action === "hidden" || undefined,
        deleted: action === "deleted" || undefined,
    }));
}

export async function setCommunityCollapsed(
    client: TelegramClient,
    community: EntityLike,
    collapsed: boolean
): Promise<Api.TypeUpdates> {
    return client.invoke(new Api.communities.ToggleCommunityCollapsedInDialogs({
        community: getInputChannel(await client.getInputEntity(community)),
        collapsed: collapsed || undefined,
    }));
}

export class CommunityPeerLinkRequestsIter extends RequestIter {
    private request?: Api.communities.GetPeerLinkRequests;
    private readonly offsets = new Set<string>();

    async _init({ community, offset }: { community: EntityLike; offset: string }) {
        this.offsets.clear();
        this.request = new Api.communities.GetPeerLinkRequests({
            community: getInputChannel(await this.client.getInputEntity(community)),
            offset,
            limit: Math.min(this.left || 1, 100),
        });
        if (this.left === 0) {
            this.total = (await this.client.invoke(this.request)).totalCount;
            return true;
        }
    }

    async _loadNextChunk(): Promise<boolean | undefined> {
        while (this.request) {
            const request = this.request;
            this.offsets.add(request.offset);
            request.limit = Math.min(this.left, 100);
            const result = await this.client.invoke(request);
            this.total = result.totalCount;
            const entities = new Map<string, Entity>(
                [...result.chats, ...result.users].map((entity) => [getPeerId(entity), entity])
            );
            const users = new Map(result.users.map((user) => [user.id.toString(), user]));
            for (const entry of result.requests) {
                const requestedBy = users.get(entry.requestedBy.toString());
                this.buffer!.push(Object.assign(entry, {
                    entity: entities.get(getPeerId(entry.peer)),
                    requestedByUser: requestedBy instanceof Api.User ? requestedBy : undefined,
                }));
            }
            if (!result.nextOffset || this.offsets.has(result.nextOffset)) {
                this.request = undefined;
                return true;
            }
            request.offset = result.nextOffset;
            if (this.buffer!.length) return undefined;
        }
        return true;
    }

    [Symbol.asyncIterator](): AsyncIterator<CommunityPeerLinkRequest> {
        return super[Symbol.asyncIterator]();
    }
}

export function iterCommunityPeerLinkRequests(
    client: TelegramClient,
    community: EntityLike,
    params: IterCommunityPeerLinkRequestsParams = {}
): CommunityPeerLinkRequestsIter {
    return new CommunityPeerLinkRequestsIter(client, params.limit, {
        waitTime: params.waitTime,
    }, { community, offset: params.offset ?? "" });
}

export async function getCommunityPeerLinkRequests(
    client: TelegramClient,
    community: EntityLike,
    params: IterCommunityPeerLinkRequestsParams = {}
): Promise<TotalList<CommunityPeerLinkRequest>> {
    return (await iterCommunityPeerLinkRequests(client, community, params).collect()) as TotalList<CommunityPeerLinkRequest>;
}

export async function setCommunityPeerLinkRequestApproval(
    client: TelegramClient,
    community: EntityLike,
    peer: EntityLike,
    approved: boolean
): Promise<boolean> {
    return client.invoke(new Api.communities.TogglePeerLinkRequestApproval({
        community: getInputChannel(await client.getInputEntity(community)),
        peer: await client.getInputEntity(peer),
        reject: !approved || undefined,
    }));
}

export async function setAllCommunityPeerLinkRequestsApproval(
    client: TelegramClient,
    community: EntityLike,
    approved: boolean
): Promise<boolean> {
    return client.invoke(new Api.communities.ToggleAllPeerLinkRequestApproval({
        community: getInputChannel(await client.getInputEntity(community)),
        reject: !approved || undefined,
    }));
}

export async function setCommunityParticipantBanned(
    client: TelegramClient,
    community: EntityLike,
    participant: EntityLike,
    banned: boolean
): Promise<boolean> {
    return client.invoke(new Api.communities.ToggleParticipantBanned({
        community: getInputChannel(await client.getInputEntity(community)),
        participant: await client.getInputEntity(participant),
        unban: !banned || undefined,
    }));
}

export async function getCommunityParticipantJoinedChats(
    client: TelegramClient,
    community: EntityLike,
    participant: EntityLike
): Promise<Api.communities.ParticipantJoinedChats> {
    return client.invoke(new Api.communities.GetParticipantJoinedChats({
        community: getInputChannel(await client.getInputEntity(community)),
        participant: await client.getInputEntity(participant),
    }));
}

export async function pinCommunity(
    client: TelegramClient,
    community: EntityLike,
    pinned = true
): Promise<boolean> {
    return client.invoke(new Api.messages.ToggleDialogPin({
        peer: new Api.InputDialogPeerCommunity({
            community: getInputChannel(await client.getInputEntity(community)),
        }) as unknown as Api.TypeEntityLike,
        pinned: pinned || undefined,
    }));
}

export async function getCommunityNotifySettings(client: TelegramClient, community: EntityLike) {
    return client.getNotifySettings(new Api.InputNotifyCommunity({
        community: getInputChannel(await client.getInputEntity(community)),
    }));
}

export async function updateCommunityNotifySettings(
    client: TelegramClient,
    community: EntityLike,
    params: UpdateNotifySettingsParams
) {
    return client.updateNotifySettings(new Api.InputNotifyCommunity({
        community: getInputChannel(await client.getInputEntity(community)),
    }), params);
}
