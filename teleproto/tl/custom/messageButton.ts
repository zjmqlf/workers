import type { TelegramClient } from "../../client/TelegramClient";
import type { ButtonLike, EntityLike, MessageIDLike } from "../../define";
import { Api } from "../api";
import { Button } from "./button";
import { computeCheck } from "../../Password";

export class MessageButton {
    private readonly _client: TelegramClient;
    private readonly _chat: EntityLike;
    public readonly button: ButtonLike;
    private readonly _bot?: EntityLike;
    private readonly _msgId: MessageIDLike;

    constructor(
        client: TelegramClient,
        original: ButtonLike,
        chat: EntityLike,
        bot: EntityLike | undefined,
        msgId: MessageIDLike
    ) {
        this.button = original;
        this._bot = bot;
        this._chat = chat;
        this._msgId = msgId;
        this._client = client;
    }

    get client() {
        return this._client;
    }

    get text() {
        return !(this.button instanceof Button) ? this.button.text : "";
    }

    get data() {
        const type = this._inlineType;
        if (type instanceof Api.InlineButtonTypeCallback) {
            return type.data;
        }
    }

    get inlineQuery() {
        const type = this._inlineType;
        if (type instanceof Api.InlineButtonTypeSwitchInline) {
            return type.query;
        }
    }

    get url() {
        const type = this._inlineType;
        if (type instanceof Api.InlineButtonTypeUrl) {
            return type.url;
        }
    }

    private get _inlineType() {
        return this.button instanceof Api.KeyboardInlineButton
            ? this.button.type
            : undefined;
    }

    async click({
        sharePhone = false,
        shareGeo,
        password,
    }: {
        sharePhone?: boolean | string | Api.InputMediaContact;
        shareGeo?: [number, number] | Api.InputMediaGeoPoint;
        password?: string;
    }) {
        const inlineType = this._inlineType;
        if (inlineType instanceof Api.InlineButtonTypeCallback) {
            let encryptedPassword;
            if (password != undefined) {
                const pwd = await this.client.invoke(
                    new Api.account.GetPassword()
                );
                encryptedPassword = await computeCheck(pwd, password);
            }
            const request = new Api.messages.GetBotCallbackAnswer({
                peer: this._chat,
                msgId: this._msgId,
                data: inlineType.data,
                password: encryptedPassword,
            });
            try {
                return await this._client.invoke(request);
            } catch (e: any) {
                if (e.errorMessage == "BOT_RESPONSE_TIMEOUT") {
                    return null;
                }
                throw e;
            }
        } else if (inlineType instanceof Api.InlineButtonTypeSwitchInline) {
            return this._client.invoke(
                new Api.messages.StartBot({
                    bot: this._bot,
                    peer: this._chat,
                    startParam: inlineType.query,
                })
            );
        } else if (inlineType instanceof Api.InlineButtonTypeUrl) {
            return inlineType.url;
        } else if (inlineType instanceof Api.InlineButtonTypeGame) {
            const request = new Api.messages.GetBotCallbackAnswer({
                peer: this._chat,
                msgId: this._msgId,
                game: true,
            });
            try {
                return await this._client.invoke(request);
            } catch (e: any) {
                if (e.errorMessage == "BOT_RESPONSE_TIMEOUT") {
                    return null;
                }
                throw e;
            }
        } else if (this.button instanceof Api.KeyboardButton) {
            const type = this.button.type;
            if (type instanceof Api.ButtonTypeDefault) {
                return this._client.sendMessage(this._chat, {
                    message: this.button.text,
                    parseMode: undefined,
                });
            } else if (type instanceof Api.ButtonTypeRequestPhone) {
                if (!sharePhone) {
                    throw new Error(
                        "cannot click on phone buttons unless sharePhone=true"
                    );
                }
                if (sharePhone == true || typeof sharePhone == "string") {
                    const me = await this._client.getMe();
                    sharePhone = new Api.InputMediaContact({
                        phoneNumber:
                            (sharePhone == true ? me.phone : sharePhone) || "",
                        firstName: me.firstName || "",
                        lastName: me.lastName || "",
                        vcard: "",
                    });
                }
                return this._client.sendFile(this._chat, {
                    file: sharePhone,
                });
            } else if (type instanceof Api.ButtonTypeRequestGeoLocation) {
                if (!shareGeo) {
                    throw new Error(
                        "cannot click on geo buttons unless shareGeo=[longitude, latitude]"
                    );
                }
                if (Array.isArray(shareGeo)) {
                    shareGeo = new Api.InputMediaGeoPoint({
                        geoPoint: new Api.InputGeoPoint({
                            long: shareGeo[0],
                            lat: shareGeo[1],
                        }),
                    });
                }
                return this._client.sendFile(this._chat, {
                    file: shareGeo,
                });
            }
        }
    }
}
