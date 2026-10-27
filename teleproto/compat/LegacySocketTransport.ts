import type { Connection } from "../network/connection/Connection";
import { ConnectionTCPObfuscated } from "../network/connection/Obfuscation";
import { Transport, type ResolvedTransport } from "../network/transport/Transport";
import type { SocketFactory as NativeSocketFactory } from "../network/transport/socket/types";
import type { SocketFactory } from "./extensions/SocketInterface";
import { isLegacyProxyConnection } from "./network/connection/TCPMTProxy";

export class LegacySocketTransport extends Transport {
    constructor(
        readonly factory: SocketFactory,
    ) {
        super();
    }

    resolve(connection?: typeof Connection): ResolvedTransport {
        const { factory } = this;
        const socket = function (this: unknown, keepAliveInterval?: number) {
            return new factory(keepAliveInterval);
        } as unknown as NativeSocketFactory;
        return {
            connection: connection ?? ConnectionTCPObfuscated,
            socket,
            webSocket: !!factory.isWebSocket,
        };
    }
}
