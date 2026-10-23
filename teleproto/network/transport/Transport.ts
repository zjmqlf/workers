import type { Connection } from "../connection/Connection";
import type { SocketFactory } from "./socket/types";

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
