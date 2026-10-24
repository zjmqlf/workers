import { Api } from "../tl";
import { NewMessage, NewMessageEvent, NewMessageInterface } from "./NewMessage";
import bigInt from "big-integer";

export interface EditedMessageInterface extends NewMessageInterface {
    func?: { (event: EditedMessageEvent): boolean };
}

export class EditedMessage extends NewMessage {
    func?: { (event: EditedMessageEvent): boolean };

    constructor(editedMessageParams: EditedMessageInterface) {
        super(editedMessageParams);
    }

    build(
        update: Api.TypeUpdate | Api.TypeUpdates,
        callback: undefined,
        selfId: bigInt.BigInteger
    ) {
        if (
            update instanceof Api.UpdateEditChannelMessage ||
            update instanceof Api.UpdateEditMessage
        ) {
            if (!(update.message instanceof Api.Message)) {
                return undefined;
            }
            const event = new EditedMessageEvent(update.message, update);
            this.addAttributes(event);
            return event;
        }
    }
}

export class EditedMessageEvent extends NewMessageEvent {
    constructor(
        message: Api.Message,
        originalUpdate: Api.TypeUpdate | Api.TypeUpdates
    ) {
        super(message, originalUpdate);
    }
}
