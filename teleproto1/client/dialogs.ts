import { Api } from "../tl";
import { RequestIter } from "../requestIter";
import type { TelegramClient } from "./TelegramClient";
import * as utils from "../Utils";
import { Dialog } from "../tl/custom/dialog";
import { DateLike, EntityLike } from "../define";
import { TotalList } from "../Helpers";
import bigInt from "big-integer";

const _MAX_CHUNK_SIZE = 100;

function _dialogMessageKey(peer: Api.TypePeer, messageId: number): string {
    return (
        "" +
        [
            peer instanceof Api.PeerChannel ? peer.channelId : undefined,
            messageId,
        ]
    );
}

export interface DialogsIterInterface {
    offsetDate: number;
    offsetId: number;
    offsetPeer: Api.TypePeer;
    ignorePinned: boolean;
    ignoreMigrated: boolean;
    folder: number;
    includeCommunities?: boolean;
}

export class _DialogsIter<IncludeCommunities extends boolean = false> extends RequestIter {
    private request?: Api.messages.GetDialogs;
    private seen?: Set<any>;
    private filterDate?: number;
    private ignoreMigrated?: boolean;
    private lastOffset?: string;
    private includeCommunities = false;

    async _init({
        offsetDate,
        offsetId,
        offsetPeer,
        ignorePinned,
        ignoreMigrated,
        folder,
        includeCommunities,
    }: DialogsIterInterface) {
        this.request = new Api.messages.GetDialogs({
            offsetDate: offsetDate ?? 0,
            offsetId,
            offsetPeer,
            limit: 1,
            hash: bigInt.zero,
            excludePinned: ignorePinned,
            folderId: folder,
        });
        if (this.limit <= 0) {
            const dialogs = await this.client.invoke(this.request);
            if ("count" in dialogs) {
                this.total = dialogs.count;
            } else {
                this.total = dialogs.dialogs.length;
            }

            return true;
        }

        this.seen = new Set();
        this.filterDate = offsetDate;
        this.ignoreMigrated = ignoreMigrated;
        this.lastOffset = undefined;
        this.includeCommunities = !!includeCommunities;
    }
    [Symbol.asyncIterator](): AsyncIterator<Dialog<IncludeCommunities extends false ? Api.Dialog : Api.Dialog | Api.DialogCommunity>, any, undefined> {
        return super[Symbol.asyncIterator]();
    }

    async _loadNextChunk(): Promise<boolean | undefined> {
        if (!this.request || !this.seen || !this.buffer) {
            return;
        }
        while (true) {
            this.request.limit = Math.min(this.left, _MAX_CHUNK_SIZE);
            const r = await this.client.invoke(this.request);
            if (r instanceof Api.messages.DialogsNotModified) {
                return;
            }
            if ("count" in r) {
                this.total = r.count;
            } else {
                this.total = r.dialogs.length;
            }
            const entities = new Map<string, Api.TypeUser | Api.TypeChat>();
            const messages = new Map<string, Api.Message>();

            for (const entity of [...r.users, ...r.chats]) {
                if (
                    entity instanceof Api.UserEmpty ||
                    entity instanceof Api.ChatEmpty
                ) {
                    continue;
                }
                entities.set(utils.getPeerId(entity), entity);
            }
            for (const m of r.messages) {
                let message = m as unknown as Api.Message;
                try {
                    if (message && "_finishInit" in message) {
                        message._finishInit(this.client, entities, undefined);
                    }
                } catch (e) {
                    this.client._log.error(
                        "Got error while trying to finish init message with id " +
                            m.id,
                        e
                    );
                    if (this.client._errorHandler) {
                        await this.client._errorHandler(e as Error);
                    }
                }
                messages.set(
                    _dialogMessageKey(message.peerId!, message.id),
                    message
                );
            }

            for (const d of r.dialogs) {
                if (d instanceof Api.DialogFolder || (!this.includeCommunities && d instanceof Api.DialogCommunity)) {
                    continue;
                }
                const peer = d instanceof Api.DialogCommunity
                    ? new Api.PeerChannel({ channelId: d.communityId })
                    : d.peer;
                const message = d instanceof Api.Dialog
                    ? messages.get(_dialogMessageKey(d.peer, d.topMessage))
                    : undefined;
                if (this.filterDate != undefined && d instanceof Api.Dialog) {
                    const date = message?.date!;
                    if (date == undefined || date > this.filterDate) {
                        continue;
                    }
                }
                const peerId = utils.getPeerId(peer);
                if (!this.seen.has(peerId)) {
                    this.seen.add(peerId);
                    if (!entities.has(peerId)) {
                        continue;
                    }
                    const cd = new Dialog(this.client, d, entities, message);
                    if (
                        !this.ignoreMigrated ||
                        !(cd.entity instanceof Api.Chat && cd.entity.migratedTo)
                    ) {
                        this.buffer.push(cd);
                    }
                }
            }
            if (
                r.dialogs.length < this.request.limit ||
                !(r instanceof Api.messages.DialogsSlice)
            ) {
                return true;
            }
            const lastDialog = [...r.dialogs].reverse().find(
                (dialog): dialog is Api.Dialog => dialog instanceof Api.Dialog
            );
            if (!lastDialog) {
                if (this.request.excludePinned) return true;
                this.request.excludePinned = true;
                if (this.buffer.length) return;
                continue;
            }
            const lastMessage = messages.get(_dialogMessageKey(lastDialog.peer, lastDialog.topMessage));
            const offsetEntity = entities.get(utils.getPeerId(lastDialog.peer));
            const offsetPeer = offsetEntity
                ? utils.getInputPeer(offsetEntity)
                : await this.client.getInputEntity(lastDialog.peer);
            const offset = `${utils.getPeerId(lastDialog.peer)}:${lastDialog.topMessage}`;
            if (this.lastOffset === offset) return true;
            this.lastOffset = offset;
            this.request.excludePinned = true;
            this.request.offsetId = lastDialog.topMessage;
            this.request.offsetDate = lastMessage ? lastMessage.date! : 0;
            this.request.offsetPeer = offsetPeer;
            if (this.buffer.length) return;
        }
    }
}

export interface IterDialogsParams<IncludeCommunities extends boolean = false> {
    includeCommunities?: IncludeCommunities;
    limit?: number;
    offsetDate?: DateLike;
    offsetId?: number;
    offsetPeer?: EntityLike;
    ignorePinned?: boolean;
    ignoreMigrated?: boolean;
    folder?: number;
    archived?: boolean;
}

export function iterDialogs<IncludeCommunities extends boolean = false>(
    client: TelegramClient,
    {
        limit = undefined,
        offsetDate = undefined,
        offsetId = 0,
        offsetPeer = new Api.InputPeerEmpty(),
        ignorePinned = false,
        ignoreMigrated = false,
        folder = undefined,
        archived = undefined,
        includeCommunities,
    }: IterDialogsParams<IncludeCommunities>
): _DialogsIter<IncludeCommunities> {
    if (archived != undefined) {
        folder = archived ? 1 : 0;
    }

    return new _DialogsIter<IncludeCommunities>(
        client,
        limit,
        {},
        {
            offsetDate,
            offsetId,
            offsetPeer,
            ignorePinned,
            ignoreMigrated,
            folder,
            includeCommunities,
        }
    );
}

export async function getDialogs<IncludeCommunities extends boolean = false>(
    client: TelegramClient,
    params: IterDialogsParams<IncludeCommunities>
): Promise<TotalList<Dialog<IncludeCommunities extends false ? Api.Dialog : Api.Dialog | Api.DialogCommunity>>> {
    return (await client.iterDialogs(params).collect()) as TotalList<Dialog<IncludeCommunities extends false ? Api.Dialog : Api.Dialog | Api.DialogCommunity>>;
}
