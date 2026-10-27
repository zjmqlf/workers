import { EventBuilder, EventCommon } from "./common";
import type { TelegramClient } from "../client/TelegramClient";
import { Api } from "../tl";

export interface RawInterface {
    types?: Function[];
    func?: CallableFunction;
}

export class Raw extends EventBuilder {
    private readonly types?: Function[];

    constructor(params: RawInterface) {
        super({ func: params.func });
        this.types = params.types;
    }

    async resolve(client: TelegramClient) {
        this.resolved = true;
    }

    build(update: Api.TypeUpdate): Api.TypeUpdate {
        return update;
    }

    filter(event: EventCommon) {
        if (this.types) {
            let correct = false;
            for (const type of this.types) {
                if (event instanceof type) {
                    correct = true;
                    break;
                }
            }
            if (!correct) {
                return;
            }
        }
        return super.filter(event);
    }
}
