import { Connection } from "../network";
import { LegacySocketTransport } from "../compat/LegacySocketTransport";
import type { SocketFactory as LegacySocketFactory } from "../compat/extensions/SocketInterface";
import { isLegacyProxyConnection } from "../compat/network/connection/TCPMTProxy";
import type { TelegramClient } from "./TelegramClient";
import { Session, StoreSession } from "../sessions";
import { Logger } from "../extensions";
import { Api } from "../tl";
import { AuthKey } from "../crypto/AuthKey";
import { addServerKey } from "../crypto/RSA";
import { IGE } from "../crypto/IGE";
import { EntityCache } from "../entityCache";
import type { EntityCacheOptions } from "../entityCache";
import type { ParseInterface } from "./methods/messageParse";
import type { EventBuilder } from "../events/common";
import { MarkdownParser } from "../extensions/markdown";
import { Session as MTProtoSender, type ConnectionBreakReason, type SenderTempBinding } from "../network/session/Session";
import { DcStateRegistry } from "../network/dc/DcState";
import { SessionPool } from "../network/dc/SessionPool";
import type { SessionLease } from "../network/dc/SessionPool";
import { DC_PORT, DcAddressBook, isTestDcAddress, type DcAddress } from "../network/dc/DcAddressBook";
import { FileTransfers, type TransferBalance } from "./files/FileTransfers";
import { LAYER } from "../tl/runtime/Registry";
import { LogLevel } from "../extensions/Logger";
import { Deferred } from "../extensions/Deferred";
import { UpdateManager } from "./updates/UpdateManager";
import { UpdateDispatcher } from "./updates/UpdateDispatcher";
import { UpdateLoop } from "./updates/UpdateLoop";
import type { ClientUpdates } from "./updates/ClientUpdates";
import type { ResolvedTransport, Transport } from "../network/transport/Transport";
import { TcpTransport } from "../network/transport/TcpTransport";

const SESSION_IDLE_TIMEOUT_MS = 300_000;
const SESSION_STARTUP_DELAY_MS = 800;

type LifecycleEvent = "connecting" | "connect" | "disconnect" | "reconnecting" | "reconnect" | "destroy";
type LifecycleHandler = () => void | Promise<void>;

const PROD_DEFAULT_DC_ID = 2;

export {
    PROD_DC_IPV4,
    PROD_DC_IPV6,
    WEBSOCKET_DC_HOSTS,
    webSocketDcAddress,
} from "../network/dc/DcAddressBook";

function jsonValue(value: Api.TypeJSONValue): unknown {
    if (value instanceof Api.JsonObject) return Object.fromEntries(value.value.map((entry) => [entry.key, jsonValue(entry.value)]));
    if (value instanceof Api.JsonArray) return value.value.map(jsonValue);
    if (value instanceof Api.JsonNull) return null;
    return (value as { value: unknown }).value;
}

export interface DownloadPoolOptions {
    partSize?: number;
    sessions?: number;
    inflightPerDc?: number;
    download?: TransferBalance & Record<string, unknown>;
    upload?: TransferBalance & Record<string, unknown>;
    idleTimeoutMs?: number;
    sessionStartupDelayMs?: number;
    maxSessions?: number;
    requestRetries?: number;
    requestDeadlineMs?: number;
    cdnSupported?: boolean;
}

export interface TelegramClientParams {
    connection?: typeof Connection;
    useIPV6?: boolean;
    timeout?: number;
    requestRetries?: number;
    connectionRetries?: number;
    reconnectRetries?: number;
    transport?: Transport;
    networkSocket?: LegacySocketFactory;
    downloadRetries?: number;
    retryDelay?: number;
    autoReconnect?: boolean;
    sequentialUpdates?: boolean;
    floodSleepThreshold?: number;
    deviceModel?: string;
    systemVersion?: string;
    appVersion?: string;
    langCode?: string;
    langPack?: string;
    pfs?: boolean;
    systemLangCode?: string;
    baseLogger?: Logger;
    maxConcurrentDownloads?: number;
    securityChecks?: boolean;
    networkSocket?: SocketFactory;
    keepAliveInterval?: number;
    reCaptchaCallback?: (siteKey: string) => Promise<string>;
    downloadPool?: DownloadPoolOptions;
    channelPollInterval?: number;
    channelPollRequestInterval?: number;
    channelPollConcurrency?: number;
    entityCache?: EntityCacheOptions;
}

const clientParamsDefault = {
    useIPV6: false,
    timeout: 10,
    requestRetries: 5,
    connectionRetries: Infinity,
    reconnectRetries: Infinity,
    retryDelay: 1000,
    downloadRetries: 5,
    autoReconnect: true,
    sequentialUpdates: false,
    floodSleepThreshold: 60,
    deviceModel: "",
    systemVersion: "",
    appVersion: "",
    langCode: "en",
    systemLangCode: "en",
    channelPollInterval: 1000,
    channelPollRequestInterval: 250,
    channelPollConcurrency: 2,
    _securityChecks: true,
};

export abstract class TelegramBaseClient<S extends Session = Session> {
    _config?: Api.Config;
    private _tzOffset: number;
    private readonly _pfs: boolean;
    private _configTimer?: ReturnType<typeof setTimeout>;
    _appConfig?: { [key: string]: unknown };
    private _appConfigTask?: Promise<{ [key: string]: unknown }>;
    private _cdnKeysTask?: Promise<void>;
    public _log: Logger;
    public _floodSleepThreshold: number;
    public session: S;
    public apiHash: string;
    public apiId: number;
    public _requestRetries: number;
    public _downloadRetries: number;
    public _connectionRetries: number;
    public _reconnectRetries: number;
    public _retryDelay: number;
    public _timeout: number;
    public _autoReconnect: boolean;
    public _transport: ResolvedTransport;
    public networkSocket?: LegacySocketFactory;
    public _initRequest: Api.InitConnection;
    public _sender?: MTProtoSender;
    public _floodWaitedRequests: any;
    public _bot?: boolean;
    public _premium?: boolean;
    public _useIPV6: boolean;
    public _selfInputPeer?: Api.InputPeerUser;
    public _errorHandler?: (error: Error) => Promise<void>;
    public _eventBuilders: [EventBuilder, CallableFunction][];
    public _entityCache: EntityCache;
    public _channelPollInterval: number;
    public _channelPollRequestInterval: number;
    public _channelPollConcurrency: number;
    public readonly _sequentialUpdates: boolean;
    public _lastRequest?: number;
    public _lastReceivedAt = 0;
    public _parseMode?: ParseInterface;
    public _reCaptchaCallback?: (siteKey: string) => Promise<string>;
    public _ALBUMS = new Map<
        string,
        [ReturnType<typeof setTimeout>, Api.TypeUpdate[]]
    >();
    public _network!: SessionPool;
    public _addresses!: DcAddressBook;
    public _files!: FileTransfers;
    public readonly _dcenters = new DcStateRegistry();
    _destroyed: boolean;
    protected _updates?: ClientUpdates;
    private readonly _lifecycleHandlers = new Map<LifecycleEvent, Set<LifecycleHandler>>();
    private _connectionEvent: LifecycleEvent = "disconnect";
    private _destroyTask?: Promise<void>;
    _maxConcurrentDownloads: number;
    _securityChecks: boolean;
    public _keepAliveInterval?: number;
    _connectedDeferred: Deferred<void>;
    public updateManager!: UpdateManager;
    _updateDispatcher!: UpdateDispatcher;
    _updateLoop!: UpdateLoop;

    constructor(
        session: string | S,
        apiId: number,
        apiHash: string,
        clientParams: TelegramClientParams
    ) {
        clientParams = { ...clientParamsDefault, ...clientParams };
        if (!apiId || !apiHash) {
            throw new Error("Your API ID or Hash cannot be empty or undefined");
        }
        if (clientParams.baseLogger) {
            this._log = clientParams.baseLogger;
        } else {
            this._log = new Logger();
        }
        this._log.info("Running teleproto");
        if (session && typeof session == "string") {
            session = new StoreSession(session) as unknown as S;
        }
        if (!(session instanceof Session)) {
            throw new Error(
                "Only StringSession and StoreSessions are supported currently :( "
            );
        }
        this._floodSleepThreshold = clientParams.floodSleepThreshold!;
        this.session = session;
        this.apiId = apiId;
        this.apiHash = apiHash;
        this._useIPV6 = clientParams.useIPV6!;
        this._requestRetries = clientParams.requestRetries!;
        this._sequentialUpdates = !!clientParams.sequentialUpdates;
        this._downloadRetries = clientParams.downloadRetries!;
        this._connectionRetries = clientParams.connectionRetries!;
        this._reconnectRetries = clientParams.reconnectRetries!;
        this._retryDelay = clientParams.retryDelay || 0;
        this._channelPollInterval = clientParams.channelPollInterval!;
        this._channelPollRequestInterval = clientParams.channelPollRequestInterval!;
        this._channelPollConcurrency = clientParams.channelPollConcurrency!;
        for (const [name, value] of [
            ["channelPollInterval", this._channelPollInterval],
            ["channelPollRequestInterval", this._channelPollRequestInterval],
            ["channelPollConcurrency", this._channelPollConcurrency],
        ] as const) {
            if (!Number.isSafeInteger(value) || value <= 0) {
                throw new RangeError(`${name} must be a positive safe integer`);
            }
        }
        this._timeout = clientParams.timeout!;
        this._autoReconnect = clientParams.autoReconnect!;
        this._maxConcurrentDownloads = clientParams.maxConcurrentDownloads || 1;
        this._keepAliveInterval = clientParams.keepAliveInterval;
        this._reCaptchaCallback = clientParams.reCaptchaCallback;
        if (clientParams.connection && !(clientParams.connection instanceof Function)) {
            throw new Error("Connection should be a class not an instance");
        }
        let connection = clientParams.connection;
        if (isLegacyProxyConnection(connection)) {
            this._log.warn("connection: proxy connection classes are deprecated: the proxy picks its own framing, remove the connection option");
            connection = undefined;
        }
        let transport: Transport;
        if (clientParams.networkSocket) {
            if (clientParams.transport) throw new Error("transport replaces networkSocket: pass only transport");
            this._log.warn(
                "networkSocket is deprecated: use the transport option (TcpTransport) or your own Transport"
            );
            this.networkSocket = clientParams.networkSocket;
            transport = new LegacySocketTransport(clientParams.networkSocket);
        } else {
            transport =
                clientParams.transport ??
                new TcpTransport();
        }
        const route = transport.resolve(connection);
        this._transport = route;
        this._initRequest = new Api.InitConnection({
            apiId: this.apiId,
            deviceModel:
                clientParams.deviceModel || "Unknown",
            systemVersion:
                clientParams.systemVersion || "1.0",
            appVersion: clientParams.appVersion || "1.0",
            langCode: clientParams.langCode || clientParamsDefault.langCode,
            langPack: clientParams.langPack || "",
            systemLangCode:
                clientParams.systemLangCode ||
                clientParamsDefault.systemLangCode,
        });
        this._pfs = !!clientParams.pfs;
        const tzOffset = -new Date().getTimezoneOffset() * 60;
        this._tzOffset = Math.abs(tzOffset) >= 15 * 3600 ? 0 : Math.trunc(tzOffset / 900) * 900 || 0;
        this._eventBuilders = [];

        this._floodWaitedRequests = {};
        this._bot = undefined;
        this._selfInputPeer = undefined;
        this._securityChecks = !!clientParams.securityChecks;
        this._entityCache = new EntityCache(clientParams.entityCache);
        this._config = undefined;
        this._destroyed = false;
        this._connectedDeferred = new Deferred();
        this._parseMode = MarkdownParser;
        this.updateManager = new UpdateManager(this as unknown as TelegramClient);
        this._updateDispatcher = new UpdateDispatcher(this as unknown as TelegramClient);
        this._updateLoop = new UpdateLoop(this as unknown as TelegramClient);
        this._addresses = new DcAddressBook({
            webSocket: !!route.webSocket,
            ipv6: () => this._useIPV6,
        });
        this._network = new SessionPool(this, {
            idleTimeoutMs:
                clientParams.downloadPool?.idleTimeoutMs ??
                SESSION_IDLE_TIMEOUT_MS,
            sessionStartupDelayMs:
                clientParams.downloadPool?.sessionStartupDelayMs ??
                SESSION_STARTUP_DELAY_MS,
        });
        this._files = new FileTransfers(this, clientParams.downloadPool);
    }

    get entityCache(): EntityCache {
        return this._entityCache;
    }

    get floodSleepThreshold() {
        return this._floodSleepThreshold;
    }

    set floodSleepThreshold(value: number) {
        this._floodSleepThreshold = Math.min(value || 0, 24 * 60 * 60);
    }

    set maxConcurrentDownloads(value: number) {
        this._maxConcurrentDownloads = value;
    }

    async _initSession() {
        await this.session.load();
        if (!this.session.serverAddress) {
            const dcId = PROD_DEFAULT_DC_ID;
            const seed = this._addresses.seed(dcId, this._useIPV6)!;
            this.session.setDC(dcId, seed.ipAddress, seed.port);
            return;
        }
        const sessionEnv = isTestDcAddress(this.session.serverAddress);
        if (sessionEnv !== undefined) {
            this._log.warn(
                    `but the session's saved address (${this.session.serverAddress}) looks like ` +
                    `${sessionEnv ? "test" : "production"}. Sessions are not portable between ` +
                    `environments — use a separate session for each.`
            );
        }
        const webAddress = this.session.serverAddress.endsWith(".web.telegram.org");
        if (!webAddress) this._useIPV6 = this.session.serverAddress.includes(":");
        if (webAddress !== !!this._transport.webSocket) {
            const seed = this._addresses.seed(this.session.dcId, this._useIPV6);
            if (seed) this.session.setDC(this.session.dcId, seed.ipAddress, seed.port);
        }
    }

    get connected() {
        return this._sender && this._sender.isConnected();
    }

    onConnecting(handler: LifecycleHandler): () => void {
        return this._subscribeLifecycle("connecting", handler);
    }

    onConnect(handler: LifecycleHandler): () => void {
        return this._subscribeLifecycle("connect", handler);
    }

    onDisconnect(handler: LifecycleHandler): () => void {
        return this._subscribeLifecycle("disconnect", handler);
    }

    onReconnecting(handler: LifecycleHandler): () => void {
        return this._subscribeLifecycle("reconnecting", handler);
    }

    onReconnect(handler: LifecycleHandler): () => void {
        return this._subscribeLifecycle("reconnect", handler);
    }

    onDestroy(handler: LifecycleHandler): () => void {
        return this._subscribeLifecycle("destroy", handler);
    }

    private _subscribeLifecycle(event: LifecycleEvent, handler: LifecycleHandler): () => void {
        if (typeof handler !== "function") throw new TypeError("Lifecycle handler must be a function");
        if (this._destroyed) throw new Error("Cannot subscribe to a destroyed client");
        let handlers = this._lifecycleHandlers.get(event);
        if (!handlers) this._lifecycleHandlers.set(event, handlers = new Set());
        handlers.add(handler);
        return () => { handlers!.delete(handler); };
    }

    _handleConnectionLifecycle(event: "connecting" | "connect" | "disconnect" | "reconnecting"): void {
        if (this._destroyed && event !== "disconnect") return;
        if (event === this._connectionEvent) return;
        this._connectionEvent = event;
        this._emitLifecycle(event);
    }

    protected _emitLifecycle(event: LifecycleEvent): void {
        for (const handler of this._lifecycleHandlers.get(event) ?? []) {
            void Promise.resolve().then(() => {
                if (this._destroyed && event !== "destroy" && event !== "disconnect") return;
                return handler();
            }).catch(async (error) => {
                this._log.error(`${event} handler failed`, error);
                if (this._errorHandler) {
                    try {
                        await this._errorHandler(error);
                    } catch (handlerError) {
                        this._log.error("Lifecycle error handler failed", handlerError);
                    }
                }
            });
        }
    }

    async disconnect() {
        await this._disconnect();
        this._files.reset();
        await this._network.purge();
        this._teardownUpdateState();
    }

    _teardownUpdateState() {
        for (const [timer] of this._ALBUMS.values()) {
            clearTimeout(timer);
        }
        this._ALBUMS.clear();

        this.updateManager.stop();

        for (const [builder] of this._eventBuilders) {
            builder.resolved = false;
        }
    }

    get disconnected() {
        return !this._sender || this._sender._disconnected;
    }

    async _disconnect() {
        this._updateLoop.stop();
        await this._sender?.disconnect();
    }

    destroy(): Promise<void> {
        if (this._destroyTask) return this._destroyTask;
        this._destroyed = true;
        clearTimeout(this._configTimer);
        this._updateDispatcher.clear();
        this._destroyTask = (async () => {
            await this.disconnect();
            await this._network.close();
            this._eventBuilders = [];
            this._updates?._destroy();
            this._emitLifecycle("destroy");
            this._lifecycleHandlers.clear();
        })();
        return this._destroyTask;
    }

    async _authKeyCallback(authKey: AuthKey | undefined, dcId: number) {
        if (this._addresses.isCdn(dcId)) return;
        if (authKey && dcId !== this.session.dcId) this._dcenters.get(dcId).authorized = false;
        this.session.setAuthKey(authKey, dcId);
        await this.session.save();
    }

    _createConnection(address: DcAddress, dcId = address.id): Connection {
        return new this._transport.connection({
            ip: address.ipAddress,
            port: address.port,
            dcId: address.mediaOnly ? -dcId : dcId,
            loggers: this._log,
            socket: this._transport.socket,
            keepAliveInterval: this._keepAliveInterval,
        });
    }

    _ensureCdnKeys(): Promise<void> {
        this._cdnKeysTask ??= this.invoke(new Api.help.GetCdnConfig())
            .then(async (config) => {
                for (const key of config.publicKeys) await addServerKey(key.publicKey);
            })
            .catch((error) => {
                this._cdnKeysTask = undefined;
                throw error;
            });
        return this._cdnKeysTask;
    }

    async _connectSender(sender: MTProtoSender, dcId: number, connection?: Connection, mediaCluster = false) {
        try {
            if (!connection && this._addresses.isCdn(dcId)) {
                await this._ensureCdnKeys();
                const address = this._addresses.cdn(dcId);
                if (!address) throw new Error(`No address for CDN dc ${dcId}`);
                await sender.connect(this._createConnection(address));
                return sender;
            }
            connection ??= this._createConnection(await this.getDC(dcId, mediaCluster && !!sender.authKey.getKey()));
            await sender.connect(connection);
            if (dcId !== this.session.dcId) {
                await this._dcenters.get(dcId).authorize(async () => {
                    this._log.info(`Exporting authorization for data center ${dcId}`);
                    const auth = await this.invoke(new Api.auth.ExportAuthorization({ dcId }));
                    await sender.send(new Api.auth.ImportAuthorization({ id: auth.id, bytes: auth.bytes }));
                });
            }
            return sender;
        } catch (error) {
            if ((error as { errorMessage?: string }).errorMessage === "DC_ID_INVALID") return sender;
            this._addresses.fail(dcId, mediaCluster);
            await sender.disconnect().catch(() => {});
            throw error;
        }
    }

    async _validateAuthKey(dcId: number, permAuthKey: AuthKey, template: Connection): Promise<boolean | undefined> {
        let failure: unknown;
        const sender = new MTProtoSender(new AuthKey(), {
            logger: this._log,
            dcId,
            client: this as unknown as TelegramClient,
            isMainSender: false,
            retries: 2,
            autoReconnect: false,
            connectTimeout: this._timeout,
            securityChecks: this._securityChecks,
            tempBinding: {
                permAuthKey,
                dcParam: dcId,
                expiresIn: 3600,
                onFailed: (error) => {
                    failure = error;
                },
            },
        });
        try {
            await sender.connect(template.clone());
            return failure === undefined ? true : undefined;
        } catch (error) {
            const message = ((failure ?? error) as { errorMessage?: string }).errorMessage;
            return message === "ENCRYPTED_MESSAGE_INVALID" ? false : undefined;
        } finally {
            await sender.disconnect().catch(() => {});
        }
    }

    _getAppConfig(): Promise<{ [key: string]: unknown }> {
        this._appConfigTask ??= this.invoke(new Api.help.GetAppConfig({ hash: 0 }))
            .then((result) => {
                if (result instanceof Api.help.AppConfig) this._appConfig = jsonValue(result.config) as { [key: string]: unknown };
                return this._appConfig ?? {};
            })
            .catch((error) => {
                this._appConfigTask = undefined;
                this._log.debug(`help.getAppConfig failed: ${error}`);
                return this._appConfig ?? {};
            });
        return this._appConfigTask;
    }

    _usePfs(): boolean {
        return this._pfs || (this._config?.tmpSessions ?? 0) > 1;
    }

    _buildInitConnection(query: Api.AnyRequest): Api.InitConnection {
        const init = this._initRequest;
        const sendLang = !!init.langPack && !init.langCode.startsWith("X");
        return new Api.InitConnection({
            apiId: init.apiId,
            deviceModel: init.deviceModel,
            systemVersion: init.systemVersion,
            appVersion: init.appVersion,
            systemLangCode: init.systemLangCode,
            langPack: sendLang ? init.langPack : "",
            langCode: sendLang ? init.langCode || "en" : "",
            params: new Api.JsonObject({
                value: [
                    new Api.JsonObjectValue({
                        key: "tz_offset",
                        value: new Api.JsonNumber({ value: this._tzOffset }),
                    }),
                ],
            }),
            query,
        });
    }

    _setConfig(config: Api.Config) {
        this._config = config;
        this._addresses.setOptions(config.dcOptions);
        const seconds = Math.min(Math.max(config.expires - config.date, 60), 86400);
        this._scheduleConfigReload(seconds * (1 - Math.random() * 0.2));
    }

    private _scheduleConfigReload(seconds: number) {
        clearTimeout(this._configTimer);
        if (this._destroyed) return;
        this._configTimer = setTimeout(() => void this._reloadConfig(), seconds * 1000);
        this._configTimer.unref?.();
    }

    async _reloadConfig() {
        if (this._destroyed) return;
        try {
            this._setConfig(await this.invoke(new Api.help.GetConfig()));
        } catch (error) {
            this._log.warn(`help.getConfig failed, retrying in 60s: ${error}`);
            this._scheduleConfigReload(60);
        }
    }

    _makeSender(
        dcId: number,
        onBreak: (dcId: number, reason?: ConnectionBreakReason) => void,
        authKey?: AuthKey,
        autoReconnect = true,
        tempBinding?: SenderTempBinding,
        media = false
    ): MTProtoSender {
        const dc = this._dcenters.get(dcId);
        return new MTProtoSender(authKey ?? this.session.getAuthKey(dcId), {
            logger: this._log,
            dcId,
            client: this as unknown as TelegramClient,
            isMainSender: false,
            retries: this._connectionRetries,
            reconnectRetries: this._reconnectRetries,
            autoReconnect: autoReconnect && this._autoReconnect,
            connectTimeout: this._timeout,
            securityChecks: this._securityChecks,
            authKeyCallback: this._authKeyCallback.bind(this),
            onConnectionBreak: onBreak,
            dcenter: dc,
            throttle: media ? dc.mediaThrottle : dc.throttle,
            tempBinding,
        });
    }

    getSender(dcId: number): Promise<MTProtoSender> {
        return dcId
            ? this._network.getSession(dcId).ensureConnected()
            : Promise.resolve(this._sender!);
    }

    _leaseSender(dcId: number): Promise<SessionLease> {
        return dcId
            ? this._network.lease(dcId)
            : Promise.resolve({ sender: this._sender!, release: () => {} });
    }

    async getDC(dcId: number, download: boolean): Promise<DcAddress> {
        throw new Error("Cannot be called from here!");
    }

    invoke<R extends Api.AnyRequest>(request: R): Promise<R["__response"]> {
        throw new Error("Cannot be called from here!");
    }

    setLogLevel(level: LogLevel) {
        this._log.setLevel(level);
    }

    get logger() {
        return this._log;
    }

    set onError(handler: (error: Error) => Promise<void>) {
        this._errorHandler = async (error: Error) => {
            try {
                await handler(error);
            } catch (e: any) {
                e.message = `Error ${e.message} thrown while handling top-level error: ${error.message}`;
                this._log.error(e.message, e);
            }
        };
    }
}
