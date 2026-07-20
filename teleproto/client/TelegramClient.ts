import {
    PROD_DC_IPV4,
    PROD_DC_IPV6,
    TEST_DC_IPV4,
    TEST_DC_IPV6,
    TelegramBaseClient,
    TelegramClientParams,
    webSocketDcAddress,
} from "./telegramBaseClient";

import * as authMethods from "./auth";
import * as botMethods from "./bots";
import * as buttonsMethods from "./buttons";
import * as downloadMethods from "./downloads";
import * as parseMethods from "./messageParse";
import * as messageMethods from "./messages";
import * as updateMethods from "./updates";
import * as uploadMethods from "./uploads";
import * as userMethods from "./users";
import * as chatMethods from "./chats";
import * as dialogMethods from "./dialogs";
import * as twoFA from "./2fa";
import type { ButtonLike, Entity, EntityLike, MessageIDLike } from "../define";
import { Api } from "../tl";
import { createApiProxy } from "../tl/runtime/apiProxy";
import { HTMLParser } from "../extensions/html";
import { MarkdownParser } from "../extensions/markdown";
import { MarkdownV2Parser } from "../extensions/markdownv2";
import type { EventBuilder } from "../events/common";
import { MTProtoSender } from "../network";
import type { SessionLease } from "../network/Network";
import { LAYER } from "../tl/runtime/registry";
import { DownloadMediaInterface } from "./downloads";
import { NewMessage, NewMessageEvent } from "../events";
import { _handleUpdate, _updateLoop, catchUp } from "./updates";
import { Session } from "../sessions";
import { Album, AlbumEvent } from "../events/Album";
import { CallbackQuery, CallbackQueryEvent } from "../events/CallbackQuery";
import { EditedMessage, EditedMessageEvent } from "../events/EditedMessage";
import { DeletedMessage, DeletedMessageEvent } from "../events/DeletedMessage";

export class TelegramClient<
    S extends Session = Session
> extends TelegramBaseClient<S> {
    constructor(
        session: string | S,
        apiId: number,
        apiHash: string,
        clientParams: TelegramClientParams
    ) {
        super(session, apiId, apiHash, clientParams);
    }

    start(authParams?: authMethods.UserAuthParams | authMethods.BotAuthParams) {
        return authMethods.start(this, authParams);
    }

    checkAuthorization() {
        return authMethods.checkAuthorization(this);
    }

    logOut() {
        return authMethods.logOut(this);
    }

    signInUser(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.UserAuthParams
    ) {
        return authMethods.signInUser(this, apiCredentials, authParams);
    }

    signInUserWithQrCode(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.QrCodeAuthParams
    ) {
        return authMethods.signInUserWithQrCode(
            this,
            apiCredentials,
            authParams
        );
    }

    sendCode(
        apiCredentials: authMethods.ApiCredentials,
        phoneNumber: string,
        forceSMS = false,
        reCaptchaCallback?: (siteKey: string) => Promise<string>
    ) {
        return authMethods.sendCode(
            this,
            apiCredentials,
            phoneNumber,
            forceSMS,
            reCaptchaCallback
        );
    }


    sendVerifyEmailCode(
        phoneNumber: string,
        phoneCodeHash: string,
        email: string
    ) {
        return authMethods.sendVerifyEmailCode(
            this,
            phoneNumber,
            phoneCodeHash,
            email
        );
    }

    verifyEmail(
        phoneNumber: string,
        phoneCodeHash: string,
        verification: authMethods.EmailVerificationResult
    ) {
        return authMethods.verifyEmail(
            this,
            phoneNumber,
            phoneCodeHash,
            verification
        );
    }

    resetLoginEmail(phoneNumber: string, phoneCodeHash: string) {
        return authMethods.resetLoginEmail(this, phoneNumber, phoneCodeHash);
    }

    signInWithPassword(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.UserPasswordAuthParams
    ) {
        return authMethods.signInWithPassword(this, apiCredentials, authParams);
    }

    signInBot(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.BotAuthParams
    ) {
        return authMethods.signInBot(this, apiCredentials, authParams);
    }

    async updateTwoFaSettings({
        isCheckPassword,
        currentPassword,
        newPassword,
        hint = "",
        email,
        emailCodeCallback,
        onEmailCodeError,
    }: twoFA.TwoFaParams) {
        return twoFA.updateTwoFaSettings(this, {
            isCheckPassword,
            currentPassword,
            newPassword,
            hint,
            email,
            emailCodeCallback,
            onEmailCodeError,
        });
    }

    inlineQuery(
        bot: EntityLike,
        query: string,
        entity?: Api.InputPeerSelf,
        offset?: string,
        geoPoint?: Api.TypeInputGeoPoint
    ) {
        return botMethods.inlineQuery(
            this,
            bot,
            query,
            entity,
            offset,
            geoPoint
        );
    }

    buildReplyMarkup(
        buttons:
            | Api.TypeReplyMarkup
            | undefined
            | ButtonLike
            | ButtonLike[]
            | ButtonLike[][],
        inlineOnly: boolean = false
    ) {
        return buttonsMethods.buildReplyMarkup(buttons, inlineOnly);
    }

    downloadFile(
        inputLocation: Api.TypeInputFileLocation,
        fileParams: downloadMethods.DownloadFileParams = {}
    ) {
        return downloadMethods.downloadFile(this, inputLocation, fileParams);
    }

    downloadProfilePhoto(
        entity: EntityLike,
        downloadProfilePhotoParams:
            | downloadMethods.DownloadProfilePhotoParams
            | string = {
            isBig: false,
        }
    ) {
        if (typeof downloadProfilePhotoParams === "string") {
            downloadProfilePhotoParams = {
                outputFile: downloadProfilePhotoParams,
            };
        }
        return downloadMethods.downloadProfilePhoto(
            this,
            entity,
            downloadProfilePhotoParams
        );
    }

    downloadMedia(
        messageOrMedia: Api.Message | Api.TypeMessageMedia,
        downloadParams?: DownloadMediaInterface | string
    ) {
        if (typeof downloadParams === "string") {
            downloadParams = { outputFile: downloadParams };
        }
        return downloadMethods.downloadMedia(
            this,
            messageOrMedia,
            downloadParams?.outputFile,
            downloadParams?.thumb,
            downloadParams?.progressCallback,
            {
                signal: downloadParams?.signal,
                requestTimeout: downloadParams?.requestTimeout,
            }
        );
    }

    get parseMode() {
        return this._parseMode;
    }

    setParseMode(
        mode:
            | "md"
            | "md2"
            | "markdown"
            | "markdownv2"
            | "html"
            | parseMethods.ParseInterface
            | undefined
    ) {
        if (mode) {
            this._parseMode = this._sanitizeParseMode(mode);
        } else {
            this._parseMode = undefined;
        }
    }

    _sanitizeParseMode(
        mode: string | parseMethods.ParseInterface
    ): parseMethods.ParseInterface {
        if (mode === "md" || mode === "markdown") {
            return MarkdownParser;
        }
        if (mode === "md2" || mode === "markdownv2") {
            return MarkdownV2Parser;
        }
        if (mode == "html") {
            return HTMLParser;
        }
        if (typeof mode == "object" && "parse" in mode && "unparse" in mode) {
            return mode;
        }
        throw new Error(`Invalid parse mode type ${mode}`);
    }

    iterMessages(
        entity: EntityLike | undefined,
        iterParams: Partial<messageMethods.IterMessagesParams> = {}
    ) {
        return messageMethods.iterMessages(this, entity, iterParams);
    }

    getMessages(
        entity: EntityLike | undefined,
        getMessagesParams: Partial<messageMethods.IterMessagesParams> = {}
    ) {
        return messageMethods.getMessages(this, entity, getMessagesParams);
    }

    getCommentData(entity: EntityLike, message: number | Api.Message) {
        return messageMethods.getCommentData(this, entity, message);
    }

    sendMessage(
        entity: EntityLike,
        sendMessageParams: messageMethods.SendMessageParams = {}
    ) {
        return messageMethods.sendMessage(this, entity, sendMessageParams);
    }

    forwardMessages(
        entity: EntityLike,
        forwardMessagesParams: messageMethods.ForwardMessagesParams
    ) {
        return messageMethods.forwardMessages(
            this,
            entity,
            forwardMessagesParams
        );
    }

    editMessage(
        entity: EntityLike,
        editMessageParams: messageMethods.EditMessageParams
    ) {
        return messageMethods.editMessage(this, entity, editMessageParams);
    }

    deleteMessages(
        entity: EntityLike | undefined,
        messageIds: MessageIDLike[],
        { revoke = true }
    ) {
        return messageMethods.deleteMessages(this, entity, messageIds, {
            revoke: revoke,
        });
    }

    pinMessage(
        entity: EntityLike,
        message?: undefined,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<Api.messages.AffectedHistory>;
    pinMessage(
        entity: EntityLike,
        message: MessageIDLike,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<Api.Message>;
    pinMessage(
        entity: EntityLike,
        message?: any,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ) {
        return messageMethods.pinMessage(
            this,
            entity,
            message,
            pinMessageParams
        );
    }

    unpinMessage(
        entity: EntityLike,
        message?: undefined,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<Api.messages.AffectedHistory>;
    unpinMessage(
        entity: EntityLike,
        message: MessageIDLike,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<undefined>;
    unpinMessage(
        entity: EntityLike,
        message?: any,
        unpinMessageParams?: messageMethods.UpdatePinMessageParams
    ) {
        return messageMethods.unpinMessage(
            this,
            entity,
            message,
            unpinMessageParams
        ) as Promise<Api.messages.AffectedHistory | undefined>;
    }

    markAsRead(
        entity: EntityLike,
        message?: MessageIDLike | MessageIDLike[],
        markAsReadParams?: messageMethods.MarkAsReadParams
    ) {
        return messageMethods.markAsRead(
            this,
            entity,
            message,
            markAsReadParams
        );
    }

    sendReaction(
        entity: EntityLike,
        messageId: number,
        reaction?: Api.TypeReaction[],
        big?: boolean
    ) {
        return messageMethods.sendReaction(
            this,
            entity,
            messageId,
            reaction,
            big
        );
    }

    getReactionUsers(
        entity: EntityLike,
        messageId: number,
        params?: { reaction?: string; limit?: number; offset?: string }
    ) {
        return messageMethods.getReactionUsers(
            this,
            entity,
            messageId,
            params
        );
    }

    iterDialogs(iterDialogsParams: dialogMethods.IterDialogsParams = {}) {
        return dialogMethods.iterDialogs(this, iterDialogsParams);
    }

    getDialogs(params: dialogMethods.IterDialogsParams = {}) {
        return dialogMethods.getDialogs(this, params);
    }

    iterParticipants(
        entity: EntityLike,
        params: chatMethods.IterParticipantsParams = {}
    ) {
        return chatMethods.iterParticipants(this, entity, params);
    }

    getParticipants(
        entity: EntityLike,
        params: chatMethods.IterParticipantsParams = {}
    ) {
        return chatMethods.getParticipants(this, entity, params);
    }

    kickParticipant(entity: EntityLike, participant: EntityLike) {
        return chatMethods.kickParticipant(this, entity, participant);
    }

    on(event: NewMessage): (f: (event: NewMessageEvent) => void) => void;
    on(event: CallbackQuery): (f: (event: CallbackQueryEvent) => void) => void;
    on(event: Album): (f: (event: AlbumEvent) => void) => void;
    on(event: EditedMessage): (f: (event: EditedMessageEvent) => void) => void;
    on(event: DeletedMessage): (f: (event: DeletedMessageEvent) => void) => void;
    on(event?: EventBuilder): (f: (event: any) => void) => void;
    on(event?: EventBuilder) {
        return updateMethods.on(this, event);
    }

    addEventHandler(
        callback: { (event: NewMessageEvent): void },
        event: NewMessage
    ): void;
    addEventHandler(
        callback: { (event: CallbackQueryEvent): void },
        event: CallbackQuery
    ): void;
    addEventHandler(
        callback: { (event: AlbumEvent): void },
        event: Album
    ): void;
    addEventHandler(
        callback: { (event: EditedMessageEvent): void },
        event: EditedMessage
    ): void;
    addEventHandler(
        callback: { (event: DeletedMessageEvent): void },
        event: DeletedMessage
    ): void;
    addEventHandler(
        callback: { (event: any): void },
        event?: EventBuilder
    ): void;
    addEventHandler(callback: { (event: any): void }, event?: EventBuilder) {
        return updateMethods.addEventHandler(this, callback, event);
    }

    removeEventHandler(callback: CallableFunction, event: EventBuilder) {
        return updateMethods.removeEventHandler(this, callback, event);
    }

    listEventHandlers() {
        return updateMethods.listEventHandlers(this);
    }

    async catchUp() {
        return catchUp(this);
    }

    uploadFile(fileParams: uploadMethods.UploadFileParams) {
        return uploadMethods.uploadFile(this, fileParams);
    }

    sendFile(
        entity: EntityLike,
        sendFileParams: uploadMethods.SendFileInterface
    ) {
        return uploadMethods.sendFile(this, entity, sendFileParams);
    }

    invoke<R extends Api.AnyRequest>(
        request: R,
        dcId?: number
    ): Promise<R["__response"]> {
        return userMethods.invoke(this, request, dcId);
    }
    
    invokeWithSender<R extends Api.AnyRequest>(
        request: R,
        sender?: MTProtoSender | SessionLease
    ): Promise<R["__response"]> {
        return userMethods.invoke(this, request, undefined, sender);
    }

    private _apiProxy?: Api.ApiFacade;

    get api(): Api.ApiFacade {
        if (!this._apiProxy) {
            this._apiProxy = createApiProxy(
                Api as unknown as Record<string, unknown>,
                (request, dcId) =>
                    this.invoke(request as Api.AnyRequest, dcId)
            ) as Api.ApiFacade;
        }
        return this._apiProxy;
    }

    getMe(inputPeer: true): Promise<Api.InputPeerUser>;
    getMe(inputPeer?: false): Promise<Api.User>;
    getMe(inputPeer = false) {
        return userMethods.getMe(this, inputPeer);
    }

    isBot() {
        return userMethods.isBot(this);
    }

    isUserAuthorized() {
        return userMethods.isUserAuthorized(this);
    }

    getEntity(entity: EntityLike): Promise<Entity>;
    getEntity(entity: EntityLike[]): Promise<Entity[]>;
    getEntity(entity: any) {
        return userMethods.getEntity(this, entity);
    }

    getInputEntity(entity: EntityLike) {
        return userMethods.getInputEntity(this, entity);
    }

    getPeerId(peer: EntityLike, addMark = true) {
        return userMethods.getPeerId(this, peer, addMark);
    }

    _getInputDialog(peer: any) {
        return userMethods._getInputDialog(this, peer);
    }

    _getInputNotify(notify: any) {
        return userMethods._getInputNotify(this, notify);
    }

    async _handleReconnect() {
        this._log.info("Handling reconnect!");
        try {
            const res = await this.getMe();
        } catch (e) {
            if (this._sender?.userDisconnected) {
                this._log.debug(
                    `Reconnect probe cancelled by disconnect: ${
                        e instanceof Error ? e.message : e
                    }`
                );
                return;
            }
            this._log.error(`Error while trying to reconnect`, e);
            if (this._errorHandler) {
                await this._errorHandler(e as Error);
            }
        }
        if (!this._loopStarted && !this._destroyed) {
            this._log.info("Restarting update loop after reconnect");
            _updateLoop(this);
            this._loopStarted = true;
        }
    }

    async connect() {
        await this._initSession();
        if (this._sender === undefined) {
            this._sender = new MTProtoSender(this.session.getAuthKey(), {
                logger: this._log,
                dcId: this.session.dcId || 4,
                retries: this._connectionRetries,
                delay: this._retryDelay,
                autoReconnect: this._autoReconnect,
                connectTimeout: this._timeout,
                authKeyCallback: this._authKeyCallback.bind(this),
                updateCallback: _handleUpdate.bind(this),
                isMainSender: true,
                client: this,
                securityChecks: this._securityChecks,
                autoReconnectCallback: this._handleReconnect.bind(this),
                reconnectRetries: this._reconnectRetries,
                dcenter: this._dcenters.get(
                    this.session.dcId || 4,
                    this.session.getAuthKey()
                ),
            });
        }

        if (this._sender.isConnected()) {
            if (!this._loopStarted) {
                _updateLoop(this);
                this._loopStarted = true;
            }
            return false;
        }

        const connection = new this._connection({
            ip: this.session.serverAddress,
            port: this.session.port || 80,
            dcId: this.session.dcId,
            loggers: this._log,
            socket: this.networkSocket,
            keepAliveInterval: this._keepAliveInterval,
        });
        this._log.info(`Using LAYER ${LAYER} for initial connect`);
        await this._connectSender(this._sender, this.session.dcId, connection);
        this.session.setAuthKey(this._sender.authKey);
        this.session.save();

        if (!this._loopStarted) {
            _updateLoop(this);
            this._loopStarted = true;
        }
        this._connectedDeferred.resolve();
        this._isSwitchingDc = false;
        return true;
    }

    async _switchDC(newDc: number) {
        this._log.info(`Reconnecting to new data center ${newDc}`);
        const sameDc = newDc === this.session.dcId;
        const DC = await this.getDC(newDc);
        this.session.setDC(newDc, DC.ipAddress, DC.port);
        if (!sameDc) {
            await this._sender!.authKey.setKey(undefined);
            this.session.setAuthKey(undefined);
        }
        this.session.save();
        this._isSwitchingDc = true;
        await this._media.purge();
        await this._network.purge();
        await this._disconnect();
        this._sender = undefined;
        return await this.connect();
    }

    async getDC(
        dcId: number,
        downloadDC = false
    ): Promise<{ id: number; ipAddress: string; port: number }> {
        this._log.debug(`Getting DC ${dcId}`);
        if (!this._config) {
            try {
                this._config = await this.api.help.getConfig();
            } catch (e) {
                this._log.warn(
                    `help.GetConfig failed, falling back to built-in DC seeds: ${e}`
                );
            }
        }
        const lookup = this._lookupDcOption(dcId, downloadDC);
        if (lookup) {
            return lookup;
        }
        const ipv4Table = this._testServers ? TEST_DC_IPV4 : PROD_DC_IPV4;
        const ipv6Table = this._testServers ? TEST_DC_IPV6 : PROD_DC_IPV6;
        const ipAddress = (this._useIPV6 ? ipv6Table : ipv4Table)[dcId];
        if (ipAddress) {
            return { id: dcId, ipAddress, port: 443 };
        }
        throw new Error(`Cannot find the DC with the ID of ${dcId}`);
    }

    private _lookupDcOption(
        dcId: number,
        mediaCluster: boolean
    ): { id: number; ipAddress: string; port: number } | undefined {
        if (!this._config) return undefined;
        let candidates = this._config.dcOptions.filter((DC) => {
            if (DC.id !== dcId) return false;
            if (DC.cdn) return false;
            if (DC.mediaOnly && !mediaCluster) return false;
            if (DC.secret && DC.secret.length) return false;
            if (DC.tcpoOnly) return false;
            return !!DC.ipv6 === this._useIPV6;
        });
        if (!candidates.length) return undefined;
        if (mediaCluster && candidates.some((DC) => DC.mediaOnly)) {
            candidates = candidates.filter((DC) => DC.mediaOnly);
        }
        // if (this._proxy && candidates.some((DC) => DC.static)) {
        //     candidates = candidates.filter((DC) => DC.static);
        // }
        const failures =
            this._dcConnectFailures.get(`${dcId}:${mediaCluster}`) ?? 0;
        const chosen = candidates[failures % candidates.length];
        return {
            id: chosen.id,
            ipAddress: chosen.ipAddress,
            port: chosen.port || 443,
        };
    }

    async _getDownloadConcurrency(fileSize: number): Promise<number> {
        if (!this._appConfig) {
            try {
                const result = await this.api.help.getAppConfig({ hash: 0 });
                if (result instanceof Api.help.AppConfig) {
                    this._appConfig = {};
                    const walk = (v: any): any => {
                        if (v instanceof Api.JsonObject) {
                            const obj: any = {};
                            for (const kv of v.value) {
                                obj[kv.key] = walk(kv.value);
                            }
                            return obj;
                        }
                        if (v instanceof Api.JsonArray) return v.value.map(walk);
                        if (v instanceof Api.JsonString) return v.value;
                        if (v instanceof Api.JsonNumber) return v.value;
                        if (v instanceof Api.JsonBool) return v.value;
                        if (v instanceof Api.JsonNull) return null;
                        return v;
                    };
                    this._appConfig = walk(result.config);
                }
            } catch {
                this._appConfig = {};
            }
        }
        const smallLimit = this._appConfig?.small_queue_max_active_operations_count ?? 4;
        const largeLimit = this._appConfig?.large_queue_max_active_operations_count ?? 8;
        return fileSize > 20 * 1024 * 1024 ? largeLimit : smallLimit;
    }

    _getResponseMessage(req: any, result: any, inputChat: any) {
        return parseMethods._getResponseMessage(this, req, result, inputChat);
    }

    static get events() {
        return require("../events");
    }
}
