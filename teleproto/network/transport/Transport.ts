import type { Connection } from "../connection/Connection";
import type { SocketFactory } from "../../extensions/SocketInterface";
import { ConnectionTCPObfuscated } from "../connection/TCPObfuscated";

export interface ResolvedTransport {
    connection: typeof Connection;
    socket: SocketFactory;
}

export abstract class Transport {
    abstract resolve(connection?: typeof Connection): ResolvedTransport;
}

export function ownFraming(
    transport: string,
    framing: typeof Connection,
    requested?: typeof Connection
): typeof Connection {
    if (requested && requested !== framing) {
        throw new Error(`${transport} uses its own packet framing: remove the connection option`);
    }
    return framing;
}

export function resolveLegacyTransport(options: {
    socket: SocketFactory;
    connection: typeof Connection;
    explicitConnection: boolean;
    explicitSocket: boolean;
}): ResolvedTransport {
    let { connection, socket } = options;
    if (!options.explicitConnection && socket.isWebSocket) {
        connection = ConnectionTCPObfuscated;
    }
    return { connection, socket };
}
