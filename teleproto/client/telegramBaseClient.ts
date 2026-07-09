import {
    Connection,
    ConnectionTCPFull,
    ConnectionTCPObfuscated,
} from "../network";
import { TelegramClient } from "./TelegramClient";
import { sleep } from "../Helpers";
import { Session, StoreSession } from "../sessions";
import { Logger, PromisedNetSockets } from "../extensions";
import { Api } from "../tl";
import type { AuthKey } from "../crypto/AuthKey";
import { EntityCache } from "../entityCache";
import type { ParseInterface } from "./messageParse";
import { MarkdownParser, LogLevel, Deferred } from "../extensions";
import { MTProtoSender } from "../network";
import { DcenterRegistry } from "../network/Dcenter";
import { Network } from "../network/Network";
import type { SessionLease } from "../network/Network";
import {
    MediaScheduler,
    MediaSchedulerOptions,
} from "../network/MediaScheduler";
import { LAYER } from "../tl/runtime/registry";
import { Semaphore } from "async-mutex";

const SESSION_IDLE_TIMEOUT_MS = 15000;
const SESSION_STARTUP_DELAY_MS = 800;
const PROD_DEFAULT_DC_ID = 2;

export const PROD_DC_IPV4: { readonly [id: number]: string } = {
    1: "149.154.175.50",
    2: "149.154.167.51",
    3: "149.154.175.100",
    4: "149.154.167.91",
    5: "149.154.171.5",
};
export const PROD_DC_IPV6: { readonly [id: number]: string } = {
    1: "2001:0b28:f23d:f001:0000:0000:0000:000a",
    2: "2001:067c:04e8:f002:0000:0000:0000:000a",
    3: "2001:0b28:f23d:f003:0000:0000:0000:000a",
    4: "2001:067c:04e8:f004:0000:0000:0000:000a",
    5: "2001:0b28:f23f:f005:0000:0000:0000:000a",
};
const DC_PORT = 443;

function inferSessionEnv(address: string): boolean | undefined {
    for (const ip of Object.values(PROD_DC_IPV4)) if (ip === address) return false;
    for (const ip of Object.values(PROD_DC_IPV6)) if (ip === address) return false;
    return undefined;
}

export interface TelegramClientParams {
    connection?: typeof Connection;
    useIPV6?: boolean;
    timeout?: number;
    requestRetries?: number;
    connectionRetries?: number;
    reconnectRetries?: number;
    downloadRetries?: number;
    retryDelay?: number;
    autoReconnect?: boolean;
    sequentialUpdates?: boolean;
    floodSleepThreshold?: number;
    deviceModel?: string;
    systemVersion?: string;
    appVersion?: string;
    langCode?: string;
    systemLangCode?: string;
    baseLogger?: Logger;
    maxConcurrentDownloads?: number;
    securityChecks?: boolean;
    networkSocket?: typeof PromisedNetSockets;
    reCaptchaCallback?: (siteKey: string) => Promise<string>;
    downloadPool?: Partial<MediaSchedulerOptions> & {
        inflightPerDc?: number;
        maxSessions?: number;
        sessions?: number;
    };
    entityCache?: EntityCacheOptions;
}

const clientParamsDefault = {
    connection: ConnectionTCPFull,
    networkSocket: PromisedNetSockets,
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
    _securityChecks: true,
};

export abstract class TelegramBaseClient {
    _config?: Api.Config;
    _appConfig?: { [key: string]: any };
    public _log: Logger;
    public _floodSleepThreshold: number;
    public session: Session;
    public apiHash: string;
    public apiId: number;
    public _requestRetries: number;
    public _downloadRetries: number;
    public _connectionRetries: number;
    public _reconnectRetries: number;
    public _retryDelay: number;
    public _timeout: number;
    public _autoReconnect: boolean;
    public _connection: typeof Connection;
    public _initRequest: Api.InitConnection;
    public _sender?: MTProtoSender;
    public _floodWaitedRequests: any;
    public _borrowedSenderPromises: any;
    public _bot?: boolean;
    public _useIPV6: boolean;
    public _selfInputPeer?: Api.InputPeerUser;
    public _errorHandler?: (error: Error) => Promise<void>;
    public _eventBuilders: [EventBuilder, CallableFunction][];
    public _entityCache: EntityCache;
    public _lastRequest?: number;
    public _parseMode?: ParseInterface;
    public _reCaptchaCallback?: (siteKey: string) => Promise<string>;
    public _ALBUMS = new Map<
        string,
        [ReturnType<typeof setTimeout>, Api.TypeUpdate[]]
    >();
    public _network!: Network;
    public _media!: MediaScheduler;
    public _filePool!: FilePool;
    public readonly _dcenters = new DcenterRegistry();
    _loopStarted: boolean;
    _reconnecting: boolean;
    _destroyed: boolean;
    _isSwitchingDc: boolean;
    _semaphore: Semaphore;
    _securityChecks: boolean;
    public networkSocket: typeof PromisedNetSockets;
    _connectedDeferred: Deferred<void>;

    constructor(
        session: string | Session,
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
            session = new StoreSession(session);
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
        this._downloadRetries = clientParams.downloadRetries!;
        this._connectionRetries = clientParams.connectionRetries!;
        this._reconnectRetries = clientParams.reconnectRetries!;
        this._retryDelay = clientParams.retryDelay || 0;
        this._timeout = clientParams.timeout!;
        this._autoReconnect = clientParams.autoReconnect!;
        this._semaphore = new Semaphore(
            clientParams.maxConcurrentDownloads || 1
        );
        this.networkSocket = clientParams.networkSocket || PromisedNetSockets;
        this._reCaptchaCallback = clientParams.reCaptchaCallback;
        if (!(clientParams.connection instanceof Function)) {
            throw new Error("Connection should be a class not an instance");
        }
        this._connection = clientParams.connection;
        this._initRequest = new Api.InitConnection({
            apiId: this.apiId,
            deviceModel:
                clientParams.deviceModel || "Unknown",
            systemVersion:
                clientParams.systemVersion || "1.0",
            appVersion: clientParams.appVersion || "1.0",
            langCode: clientParams.langCode || clientParamsDefault.langCode,
            langPack: "",
            systemLangCode:
                clientParams.systemLangCode ||
                clientParamsDefault.systemLangCode,
        });

        this._floodWaitedRequests = {};
        this._bot = undefined;
        this._selfInputPeer = undefined;
        this._securityChecks = !!clientParams.securityChecks;
        this._entityCache = new EntityCache(clientParams.entityCache);
        this._config = undefined;
        this._loopStarted = false;
        this._reconnecting = false;
        this._destroyed = false;
        this._isSwitchingDc = false;
        this._connectedDeferred = new Deferred();
        this._parseMode = MarkdownParser;
        this._network = new Network(this, {
            idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
            sessionStartupDelayMs: SESSION_STARTUP_DELAY_MS,
        });
        this._media = new MediaScheduler(
            this,
            this._network,
            clientParams.downloadPool
        );
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
        // @ts-ignore
        this._semaphore._value = value;
    }

    async _initSession() {
        await this.session.load();
        if (!this.session.serverAddress) {
            const dcId = PROD_DEFAULT_DC_ID;
            const ipv4Table = PROD_DC_IPV4;
            const ipv6Table = PROD_DC_IPV6;
            this.session.setDC(
                dcId,
                this._useIPV6 ? ipv6Table[dcId] : ipv4Table[dcId],
                DC_PORT
            );
        } else {
            const sessionEnv = inferSessionEnv(this.session.serverAddress);
            if (sessionEnv !== undefined) {
                this._log.warn(
                    `but the session's saved address (${this.session.serverAddress}) looks like ` +
                    `${sessionEnv ? "test" : "production"}. Sessions are not portable between ` +
                    `environments ¡ª use a separate session for each.`
                );
            }
            this._useIPV6 = this.session.serverAddress.includes(":");
        }
    }

    get connected() {
        return this._sender && this._sender.isConnected();
    }

    async disconnect() {
        await this._disconnect();
        await this._media.purge();
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
        this._loopStarted = false;
        await this._sender?.disconnect();
    }

    async destroy() {
        this._destroyed = true;
        await this.disconnect();
        await this._media.close();
        await this._network.close();
        this._eventBuilders = [];
    }

    async _authKeyCallback(authKey: AuthKey, dcId: number) {
        this.session.setAuthKey(authKey, dcId);
        await this.session.save();
    }

    async _connectSender(sender: MTProtoSender, dcId: number) {
        const dc = await this.getDC(dcId, !!sender.authKey.getKey());
        while (true) {
            try {
                const needAuth =
                    this.session.dcId !== dcId && !sender._authenticated;
                let innerQuery: Api.AnyRequest;
                if (needAuth) {
                    this._log.info(
                        `Exporting authorization for data center ${dc.ipAddress} with layer ${LAYER}`
                    );
                    const auth = await this.invoke(
                        new Api.auth.ExportAuthorization({ dcId: dcId })
                    );
                    innerQuery = new Api.auth.ImportAuthorization({
                        id: auth.id,
                        bytes: auth.bytes,
                    });
                } else {
                    innerQuery = new Api.help.GetConfig();
                }

                await sender.connect(
                    new this._connection({
                        ip: dc.ipAddress,
                        port: dc.port,
                        dcId: dcId,
                        loggers: this._log,
                        proxy: this._proxy,
                        socket: this.networkSocket,
                    }),
                    false
                );
                const initConn = new Api.InitConnection({
                    apiId: this._initRequest.apiId,
                    deviceModel: this._initRequest.deviceModel,
                    systemVersion: this._initRequest.systemVersion,
                    appVersion: this._initRequest.appVersion,
                    langCode: this._initRequest.langCode,
                    langPack: this._initRequest.langPack,
                    systemLangCode: this._initRequest.systemLangCode,
                    query: innerQuery,
                });
                await sender.send(
                    new Api.InvokeWithLayer({ layer: LAYER, query: initConn })
                );
                sender._authenticated = true;
                sender._needsInitConnection = false;
                sender.dcId = dcId;
                sender.userDisconnected = false;

                return sender;
            } catch (err: any) {
                if (err.errorMessage === "DC_ID_INVALID") {
                    sender._authenticated = true;
                    sender.userDisconnected = false;
                    return sender;
                }
                if (this._errorHandler) {
                    await this._errorHandler(err as Error);
                } else {
                    this._log.error("Error while connecting sender", err);
                }
                await sleep(1000);
                await sender.disconnect();
            }
        }
    }

    _makeSender(
        dcId: number,
        onBreak: (dcId: number) => void,
        authKey?: AuthKey,
        autoReconnect: boolean = true,
        tempBinding?: import("../network/MTProtoSender").SenderTempBinding,
    ): MTProtoSender {
        return new MTProtoSender(authKey ?? this.session.getAuthKey(dcId), {
            logger: this._log,
            dcId,
            retries: this._connectionRetries,
            delay: this._retryDelay,
            autoReconnect: autoReconnect && this._autoReconnect,
            connectTimeout: this._timeout,
            authKeyCallback: this._authKeyCallback.bind(this),
            isMainSender: dcId === this.session.dcId,
            onConnectionBreak: onBreak,
            client: this as unknown as TelegramClient,
            securityChecks: this._securityChecks,
            reconnectRetries: this._reconnectRetries,
            dcenter: this._dcenters.get(dcId),
            tempBinding,
        });
    }

    getSender(dcId: number): Promise<SessionLease> {
        return dcId
            ? this._network.lease(dcId)
            : Promise.resolve({ sender: this._sender!, release: () => {} });
    }

    async getDC(
        dcId: number,
        download: boolean
    ): Promise<{ id: number; ipAddress: string; port: number }> {
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
