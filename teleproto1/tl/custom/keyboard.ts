import type { BigInteger } from "big-integer";
import type { EntityLike } from "../../define";
import { returnBigInt } from "../../Helpers";
import { getInputUser } from "../../Utils";
import { Api } from "../api";
import { Button } from "./button";
import { Buffer } from "node:buffer";

export type ButtonColor = "primary" | "danger" | "success";

export interface ButtonStyleOptions {
    color?: ButtonColor;
    icon?: BigInteger | string | number;
}

export type ButtonStyleLike = Api.KeyboardButtonStyle | ButtonStyleOptions;

export interface ButtonOptions {
    style?: ButtonStyleLike;
}

export interface CallbackButtonOptions extends ButtonOptions {
    requiresPassword?: boolean;
}

export interface UrlAuthButtonOptions extends ButtonOptions {
    bot?: EntityLike;
    writeAccess?: boolean;
    fwdText?: string;
    buttonId?: number;
}

export interface SwitchInlineButtonOptions extends ButtonOptions {
    query?: string;
    samePeer?: boolean;
    peerTypes?: Api.TypeInlineQueryPeerType[];
}

export interface RequestPollButtonOptions extends ButtonOptions {
    quiz?: boolean;
}

export interface RequestPeerButtonOptions extends ButtonOptions {
    buttonId: number;
    peerType: Api.TypeRequestPeerType;
    max?: number;
    nameRequested?: boolean;
    usernameRequested?: boolean;
    photoRequested?: boolean;
}

export interface ReplyKeyboardOptions {
    resize?: boolean;
    singleUse?: boolean;
    selective?: boolean;
    persistent?: boolean;
    forceReply?: boolean;
    placeholder?: string;
}

export interface InlineKeyboardOptions {
    forceReply?: boolean;
}

export interface HideKeyboardOptions {
    selective?: boolean;
}

export interface ForceReplyOptions {
    singleUse?: boolean;
    selective?: boolean;
    placeholder?: string;
}

function toStyle(style?: ButtonStyleLike): Api.KeyboardButtonStyle | undefined {
    if (!style) return undefined;
    if (style instanceof Api.KeyboardButtonStyle) return style;
    return new Api.KeyboardButtonStyle({
        bgPrimary: style.color === "primary" || undefined,
        bgDanger: style.color === "danger" || undefined,
        bgSuccess: style.color === "success" || undefined,
        icon: style.icon === undefined ? undefined : returnBigInt(style.icon),
    });
}

abstract class KeyboardBuilder<TButton> {
    protected readonly rows: TButton[][];

    protected constructor(rows: TButton[][] = []) {
        this.rows = rows.map((row) => [...row]);
    }

    row(): this {
        this.rows.push([]);
        return this;
    }

    add(...buttons: TButton[]): this {
        this.current().push(...buttons);
        return this;
    }

    columns(count: number): this {
        if (count < 1) throw new Error("A keyboard row needs at least one button");
        const flat = this.rows.flat();
        this.rows.length = 0;
        for (let i = 0; i < flat.length; i += count) {
            this.rows.push(flat.slice(i, i + count));
        }
        return this;
    }

    get size(): number {
        return this.rows.reduce((total, row) => total + row.length, 0);
    }

    protected current(): TButton[] {
        if (!this.rows.length) this.rows.push([]);
        return this.rows[this.rows.length - 1]!;
    }

    protected filled(): TButton[][] {
        return this.rows.filter((row) => row.length > 0);
    }
}

export class InlineKeyboard extends KeyboardBuilder<Api.TypeKeyboardInlineButton> {
    private options: InlineKeyboardOptions;

    constructor(
        rows: (Api.TypeKeyboardInlineButton | Button)[][] = [],
        options: InlineKeyboardOptions = {},
    ) {
        super(
            rows.map((row) =>
                row.map((button) => {
                    const raw = button instanceof Button ? button.button : button;
                    if (!(raw instanceof Api.KeyboardInlineButton)) {
                        throw new Error("An inline keyboard takes inline buttons only");
                    }
                    return raw;
                }),
            ),
        );
        this.options = options;
    }

    callback(text: string, data: Buffer | string, options: CallbackButtonOptions = {}): this {
        const payload = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
        if (payload.length > 64) {
            throw new Error("Callback data must not exceed 64 bytes");
        }
        return this.push(
            text,
            new Api.InlineButtonTypeCallback({
                data: payload,
                requiresPassword: options.requiresPassword,
            }),
            options,
        );
    }

    url(text: string, url: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.InlineButtonTypeUrl({ url }), options);
    }

    urlAuth(text: string, url: string, options: UrlAuthButtonOptions = {}): this {
        const type =
            options.bot !== undefined || options.writeAccess !== undefined
                ? new Api.InputInlineButtonTypeUrlAuth({
                    url,
                    bot: getInputUser(options.bot ?? new Api.InputUserSelf()),
                    requestWriteAccess: options.writeAccess,
                    fwdText: options.fwdText,
                })
                : new Api.InlineButtonTypeUrlAuth({
                    url,
                    fwdText: options.fwdText,
                    buttonId: options.buttonId ?? 0,
                });
        return this.push(text, type, options);
    }

    webApp(text: string, url: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.InlineButtonTypeWebView({ url }), options);
    }

    switchInline(text: string, options: SwitchInlineButtonOptions = {}): this {
        return this.push(
            text,
            new Api.InlineButtonTypeSwitchInline({
                query: options.query ?? "",
                samePeer: options.samePeer,
                peerTypes: options.peerTypes,
            }),
            options,
        );
    }

    userProfile(text: string, user: EntityLike, options: ButtonOptions = {}): this {
        return this.push(
            text,
            new Api.InputInlineButtonTypeUserProfile({ userId: getInputUser(user) }),
            options,
        );
    }

    copy(text: string, copyText: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.InlineButtonTypeCopy({ copyText }), options);
    }

    game(text: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.InlineButtonTypeGame(), options);
    }

    buy(text: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.InlineButtonTypeBuy(), options);
    }

    disabled(text: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.InlineButtonTypeDisabled(), options);
    }

    forceReply(forceReply = true): this {
        this.options = { ...this.options, forceReply };
        return this;
    }

    build(): Api.ReplyInlineMarkup {
        return new Api.ReplyInlineMarkup({
            rows: this.filled().map(
                (buttons) => new Api.KeyboardInlineButtonRow({ buttons }),
            ),
            forceReply: this.options.forceReply,
        });
    }

    private push(
        text: string,
        type: Api.TypeInlineButtonType,
        options: ButtonOptions,
    ): this {
        return this.add(
            new Api.KeyboardInlineButton({
                text,
                type,
                style: toStyle(options.style),
            }),
        );
    }
}

export class ReplyKeyboard extends KeyboardBuilder<Api.TypeKeyboardButton> {
    private options: ReplyKeyboardOptions;

    constructor(
        rows: (Api.TypeKeyboardButton | Button)[][] = [],
        options: ReplyKeyboardOptions = {},
    ) {
        super(
            rows.map((row) =>
                row.map((button) => {
                    const raw = button instanceof Button ? button.button : button;
                    if (!(raw instanceof Api.KeyboardButton)) {
                        throw new Error("A reply keyboard takes plain buttons only");
                    }
                    return raw;
                }),
            ),
        );
        this.options = options;
    }

    text(text: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.ButtonTypeDefault(), options);
    }

    requestPhone(text: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.ButtonTypeRequestPhone(), options);
    }

    requestLocation(text: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.ButtonTypeRequestGeoLocation(), options);
    }

    requestPoll(text: string, options: RequestPollButtonOptions = {}): this {
        return this.push(
            text,
            new Api.ButtonTypeRequestPoll({ quiz: options.quiz }),
            options,
        );
    }

    requestPeer(text: string, options: RequestPeerButtonOptions): this {
        return this.push(
            text,
            new Api.InputButtonTypeRequestPeer({
                buttonId: options.buttonId,
                peerType: options.peerType,
                maxQuantity: options.max ?? 1,
                nameRequested: options.nameRequested,
                usernameRequested: options.usernameRequested,
                photoRequested: options.photoRequested,
            }),
            options,
        );
    }

    webApp(text: string, url: string, options: ButtonOptions = {}): this {
        return this.push(text, new Api.ButtonTypeSimpleWebView({ url }), options);
    }

    set(options: ReplyKeyboardOptions): this {
        this.options = { ...this.options, ...options };
        return this;
    }

    build(): Api.ReplyKeyboardMarkup {
        return new Api.ReplyKeyboardMarkup({
            rows: this.filled().map(
                (buttons) => new Api.KeyboardButtonRow({ buttons }),
            ),
            resize: this.options.resize,
            singleUse: this.options.singleUse,
            selective: this.options.selective,
            persistent: this.options.persistent,
            forceReply: this.options.forceReply,
            placeholder: this.options.placeholder,
        });
    }

    private push(
        text: string,
        type: Api.TypeButtonType,
        options: ButtonOptions,
    ): this {
        return this.add(
            new Api.KeyboardButton({
                text,
                type,
                style: toStyle(options.style),
            }),
        );
    }
}

export const Keyboard = {
    hide(options: HideKeyboardOptions = {}): Api.ReplyKeyboardHide {
        return new Api.ReplyKeyboardHide({ selective: options.selective });
    },
    forceReply(options: ForceReplyOptions = {}): Api.ReplyKeyboardForceReply {
        return new Api.ReplyKeyboardForceReply({
            singleUse: options.singleUse,
            selective: options.selective,
            placeholder: options.placeholder,
        });
    },
};
