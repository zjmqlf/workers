import type { Connection } from "../connection/Connection";
import { ConnectionTCPObfuscated } from "../connection/Obfuscation";
import { NetSocket } from "./socket/NetSocket";
import { Transport, type ResolvedTransport } from "./Transport";

export class TcpTransport extends Transport {
    resolve(connection?: typeof Connection): ResolvedTransport {
        return { connection: connection ?? ConnectionTCPObfuscated, socket: NetSocket };
    }
}
