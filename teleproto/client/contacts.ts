import type { TelegramClient } from "./TelegramClient";
import type { EntityLike } from "../define";
import { TotalList, returnBigInt } from "../Helpers";
import { Api } from "../tl";
import bigInt from "big-integer";

export async function getContacts(
    client: TelegramClient
): Promise<Api.User[]> {
    const result = await client.api.contacts.getContacts({
        hash: bigInt.zero,
    });
    if (result instanceof Api.contacts.ContactsNotModified) {
        return [];
    }
    return result.users.filter(
        (user): user is Api.User => user instanceof Api.User
    );
}

function _toNote(
    note: string | Api.TypeTextWithEntities | undefined
): Api.TypeTextWithEntities | undefined {
    if (note == undefined) {
        return undefined;
    }
    if (typeof note === "string") {
        return new Api.TextWithEntities({ text: note, entities: [] });
    }
    return note;
}

export interface AddContactParams {
    firstName: string;
    lastName?: string;
    phone?: string;
    addPhonePrivacyException?: boolean;
    note?: string | Api.TypeTextWithEntities;
}

export async function addContact(
    client: TelegramClient,
    entity: EntityLike,
    params: AddContactParams
) {
    const user = await client.getInputEntity(entity);
    return client.invoke(
        new Api.contacts.AddContact({
            id: user as unknown as Api.TypeInputUser,
            firstName: params.firstName,
            lastName: params.lastName || "",
            phone: params.phone || "",
            addPhonePrivacyException: params.addPhonePrivacyException,
            note: _toNote(params.note),
        })
    );
}

export async function deleteContacts(
    client: TelegramClient,
    users: EntityLike | EntityLike[]
) {
    const list = Array.isArray(users) ? users : [users];
    const ids: Api.TypeInputUser[] = [];
    for (const user of list) {
        ids.push(
            (await client.getInputEntity(
                user
            )) as unknown as Api.TypeInputUser
        );
    }
    return client.invoke(new Api.contacts.DeleteContacts({ id: ids }));
}

export interface ImportContactEntry {
    phone: string;
    firstName: string;
    lastName?: string;
    note?: string | Api.TypeTextWithEntities;
    clientId?: number;
}

export async function importContacts(
    client: TelegramClient,
    contacts: ImportContactEntry[]
): Promise<Api.contacts.ImportedContacts> {
    return client.invoke(
        new Api.contacts.ImportContacts({
            contacts: contacts.map(
                (contact, i) =>
                    new Api.InputPhoneContact({
                        clientId: returnBigInt(contact.clientId ?? i),
                        phone: contact.phone,
                        firstName: contact.firstName,
                        lastName: contact.lastName || "",
                        note: _toNote(contact.note),
                    })
            ),
        })
    );
}

export async function block(
    client: TelegramClient,
    entity: EntityLike,
    params: { myStoriesFrom?: boolean } = {}
): Promise<boolean> {
    const peer = await client.getInputEntity(entity);
    return client.api.contacts.block({
        id: peer,
        myStoriesFrom: params.myStoriesFrom,
    });
}

export async function unblock(
    client: TelegramClient,
    entity: EntityLike,
    params: { myStoriesFrom?: boolean } = {}
): Promise<boolean> {
    const peer = await client.getInputEntity(entity);
    return client.api.contacts.unblock({
        id: peer,
        myStoriesFrom: params.myStoriesFrom,
    });
}

export interface GetBlockedParams {
    offset?: number;
    limit?: number;
    myStoriesFrom?: boolean;
}

export async function getBlocked(
    client: TelegramClient,
    params: GetBlockedParams = {}
): Promise<TotalList<Api.TypePeerBlocked>> {
    const result = await client.api.contacts.getBlocked({
        offset: params.offset ?? 0,
        limit: params.limit ?? 100,
        myStoriesFrom: params.myStoriesFrom,
    });
    const blocked = new TotalList<Api.TypePeerBlocked>();
    blocked.push(...result.blocked);
    blocked.total =
        result instanceof Api.contacts.BlockedSlice
            ? result.count
            : result.blocked.length;
    return blocked;
}
