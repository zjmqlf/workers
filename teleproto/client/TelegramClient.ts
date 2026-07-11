import {
    PROD_DC_IPV4,
    PROD_DC_IPV6,
    TelegramBaseClient,
    TelegramClientParams,
} from "./telegramBaseClient";
import * as parseMethods from "./messageParse";
import * as messageMethods from "./messages";
import * as userMethods from "./users";
import * as dialogMethods from "./dialogs";
import type { Entity, EntityLike, MessageIDLike } from "../define";
import { Api } from "../tl";
import { createApiProxy } from "../tl/runtime/apiProxy";
import { MTProtoSender } from "../network";
import type { SessionLease } from "../network/Network";
import { LAYER } from "../tl/runtime/registry";
import { Session } from "../sessions";

export class TelegramClient extends TelegramBaseClient {
    constructor(
        session: string | Session,
        apiId: number,
        apiHash: string,
        clientParams: TelegramClientParams
    ) {
        super(session, apiId, apiHash, clientParams);
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

    iterDialogs(iterDialogsParams: dialogMethods.IterDialogsParams = {}) {
        return dialogMethods.iterDialogs(this, iterDialogsParams);
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
            this._log.error(`Error while trying to reconnect`, e);
            if (this._errorHandler) {
                await this._errorHandler(e as Error);
            }
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
        const connection = new this._connection({
            ip: this.session.serverAddress,
            port: this.session.port || 80,
            dcId: this.session.dcId,
            loggers: this._log,
            socket: this.networkSocket,
        });
        if (!(await this._sender.connect(connection, false))) {
            return false;
        }
        this.session.setAuthKey(this._sender.authKey);
        this.session.save();

        this._initRequest.query = new Api.help.GetConfig();
        this._log.info(`Using LAYER ${LAYER} for initial connect`);
        await this._sender.send(
            new Api.InvokeWithLayer({
                layer: LAYER,
                query: this._initRequest,
            })
        );
        this._connectedDeferred.resolve();
        this._isSwitchingDc = false;
        return true;
    }

    async _switchDC(newDc: number) {
        this._log.info(`Reconnecting to new data center ${newDc}`);
        const DC = await this.getDC(newDc);
        this.session.setDC(newDc, DC.ipAddress, DC.port);
        await this._sender!.authKey.setKey(undefined);
        this.session.setAuthKey(undefined);
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
        const ipv4Table = PROD_DC_IPV4;
        const ipv6Table = PROD_DC_IPV6;
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
        if (candidates.some((DC) => DC.static)) {
            candidates = candidates.filter((DC) => DC.static);
        }
        const chosen = candidates[0];
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
}
