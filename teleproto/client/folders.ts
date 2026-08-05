import type { TelegramClient } from "./TelegramClient";
import { Api } from "../tl";

export async function getDialogFilters(
    client: TelegramClient
): Promise<Api.messages.DialogFilters> {
    return client.api.messages.getDialogFilters({});
}

export async function updateDialogFilter(
    client: TelegramClient,
    id: number,
    filter?: Api.TypeDialogFilter
): Promise<boolean> {
    return client.invoke(
        new Api.messages.UpdateDialogFilter({
            id: id,
            filter: filter,
        })
    );
}

export async function updateDialogFiltersOrder(
    client: TelegramClient,
    order: number[]
): Promise<boolean> {
    return client.api.messages.updateDialogFiltersOrder({ order: order });
}
