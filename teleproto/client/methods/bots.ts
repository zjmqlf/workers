import type { EntityLike } from "../../define";
import { Api } from "../../tl";
import { InlineResults } from "../../tl/custom/inlineResults";
import type { TelegramClient } from "../TelegramClient";
import { _parseMessageText, type ParseInterface } from "./messageParse";

export async function inlineQuery(
    client: TelegramClient,
    bot: EntityLike,
    query: string,
    entity?: Api.InputPeerSelf,
    offset?: string,
    geoPoint?: Api.TypeInputGeoPoint
): Promise<InlineResults> {
    bot = await client.getInputEntity(bot);
    let peer: Api.TypeInputPeer = new Api.InputPeerSelf();
    if (entity) {
        peer = await client.getInputEntity(entity);
    }
    const result = await client.invoke(
        new Api.messages.GetInlineBotResults({
            bot: bot,
            peer: peer,
            query: query,
            offset: offset || "",
            geoPoint: geoPoint,
        })
    );
    return new InlineResults(client, result, entity ? peer : undefined);
}

export interface BotCommandEntry {
    command: string;
    description: string;
    ephemeral?: boolean;
}

export interface BotCommandScopeParams {
    scope?: Api.TypeBotCommandScope;
    langCode?: string;
}

export async function setBotCommands(
    client: TelegramClient,
    commands: BotCommandEntry[],
    params: BotCommandScopeParams = {}
): Promise<boolean> {
    return client.invoke(
        new Api.bots.SetBotCommands({
            scope: params.scope ?? new Api.BotCommandScopeDefault(),
            langCode: params.langCode ?? "",
            commands: commands.map(
                (command) =>
                    new Api.BotCommand({
                        command: command.command,
                        description: command.description,
                        ephemeral: command.ephemeral,
                    })
            ),
        })
    );
}

export async function getBotCommands(
    client: TelegramClient,
    params: BotCommandScopeParams = {}
): Promise<Api.BotCommand[]> {
    return client.invoke(
        new Api.bots.GetBotCommands({
            scope: params.scope ?? new Api.BotCommandScopeDefault(),
            langCode: params.langCode ?? "",
        })
    );
}

export async function resetBotCommands(
    client: TelegramClient,
    params: BotCommandScopeParams = {}
): Promise<boolean> {
    return client.invoke(
        new Api.bots.ResetBotCommands({
            scope: params.scope ?? new Api.BotCommandScopeDefault(),
            langCode: params.langCode ?? "",
        })
    );
}

export interface SetBotInfoParams {
    bot?: EntityLike;
    langCode?: string;
    name?: string;
    about?: string;
    description?: string;
}

export async function setBotInfo(
    client: TelegramClient,
    params: SetBotInfoParams
): Promise<boolean> {
    return client.invoke(
        new Api.bots.SetBotInfo({
            bot: params.bot
                ? ((await client.getInputEntity(
                      params.bot
                  )) as unknown as Api.TypeInputUser)
                : undefined,
            langCode: params.langCode ?? "",
            name: params.name,
            about: params.about,
            description: params.description,
        })
    );
}

export async function getBotInfo(
    client: TelegramClient,
    params: { bot?: EntityLike; langCode?: string } = {}
): Promise<Api.bots.BotInfo> {
    return client.invoke(
        new Api.bots.GetBotInfo({
            bot: params.bot
                ? ((await client.getInputEntity(
                      params.bot
                  )) as unknown as Api.TypeInputUser)
                : undefined,
            langCode: params.langCode ?? "",
        })
    );
}

export async function setBotMenuButton(
    client: TelegramClient,
    user: EntityLike,
    button: Api.TypeBotMenuButton
): Promise<boolean> {
    return client.invoke(
        new Api.bots.SetBotMenuButton({
            userId: (await client.getInputEntity(
                user
            )) as unknown as Api.TypeInputUser,
            button: button,
        })
    );
}

export async function getBotMenuButton(
    client: TelegramClient,
    user: EntityLike
): Promise<Api.TypeBotMenuButton> {
    return client.invoke(
        new Api.bots.GetBotMenuButton({
            userId: (await client.getInputEntity(
                user
            )) as unknown as Api.TypeInputUser,
        })
    );
}

export interface SetBotVerificationParams {
    bot?: EntityLike;
    enabled?: boolean;
    description?: string | Api.TypeTextWithEntities;
    parseMode?: false | string | ParseInterface;
}

export async function addBotUsername(
    client: TelegramClient,
    bot: EntityLike,
    username: string
): Promise<boolean> {
    return client.invoke(new Api.bots.AddUsername({ bot, username }));
}

export async function removeBotUsername(
    client: TelegramClient,
    bot: EntityLike,
    username: string
): Promise<boolean> {
    return client.invoke(new Api.bots.RemoveUsername({ bot, username }));
}

export async function checkBotUsername(
    client: TelegramClient,
    username: string,
    params: { additional?: boolean } = {}
): Promise<boolean> {
    return client.invoke(
        new Api.bots.CheckUsername({ additional: params.additional, username })
    );
}

export async function setBotVerification(
    client: TelegramClient,
    peer: EntityLike,
    params: SetBotVerificationParams = {}
): Promise<boolean> {
    let customDescription: Api.TypeTextWithEntities | undefined;
    if (typeof params.description === "string") {
        const [text, entities] = await _parseMessageText(
            client,
            params.description,
            params.parseMode as false | string | ParseInterface
        );
        customDescription = new Api.TextWithEntities({ text, entities });
    } else {
        customDescription = params.description;
    }
    return client.invoke(
        new Api.bots.SetCustomVerification({
            enabled: params.enabled ?? true,
            bot: params.bot,
            peer,
            customDescription,
        })
    );
}
