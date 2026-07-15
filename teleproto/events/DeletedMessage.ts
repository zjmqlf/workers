import type { Entity, EntityLike } from "../define";
import { Api } from "../tl";
import { EventBuilder, EventCommon, DefaultEventInterface } from "./common";

type DeleteUpdateType = Api.UpdateDeleteMessages | Api.UpdateDeleteChannelMessages;

export class DeletedMessage extends EventBuilder {
    constructor(eventParams: DefaultEventInterface = {}) {
        super(eventParams);
    }

    build(update: Api.TypeUpdate): DeletedMessageEvent | undefined {
        if (update instanceof Api.UpdateDeleteChannelMessages) {
            return new DeletedMessageEvent(
                update.messages,
                update,
                new Api.PeerChannel({ channelId: update.channelId })
            );
        } else if (update instanceof Api.UpdateDeleteMessages) {
            return new DeletedMessageEvent(update.messages, update);
        }
        return undefined;
    }
}

export class DeletedMessageEvent extends EventCommon {
    originalUpdate: DeleteUpdateType & { _entities?: Map<string, Entity> };
    deletedIds: number[];
    peer?: EntityLike;

    constructor(
        deletedIds: number[],
        originalUpdate: DeleteUpdateType,
        peer?: EntityLike
    ) {
        super({
            chatPeer: peer,
            msgId: Array.isArray(deletedIds) && deletedIds.length > 0 ? deletedIds[0] : undefined,
        });
        this.originalUpdate = originalUpdate;
        this.deletedIds = deletedIds;
        this.peer = peer;
    }

    get deletedId(): number | undefined {
        return this.deletedIds.length > 0 ? this.deletedIds[0] : undefined;
    }

    get isChannel(): boolean {
        return this.originalUpdate instanceof Api.UpdateDeleteChannelMessages;
    }
}
