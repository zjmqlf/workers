import { ConnectionTCPObfuscated } from "../../../network/connection/Obfuscation";

export { PaddedIntermediatePacketCodec } from "../../../network/connection/IntermediateCodec";

export class TCPMTProxy extends ConnectionTCPObfuscated {}

export class ConnectionTCPMTProxyAbridged extends TCPMTProxy {}

export function isLegacyProxyConnection(connection: unknown): boolean {
    return typeof connection === "function" && connection.prototype instanceof TCPMTProxy;
}
