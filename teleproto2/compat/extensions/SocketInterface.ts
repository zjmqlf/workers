import type { PacketReader } from "../../network/transport/socket/types";
import { Buffer } from "node:buffer";

export type { PacketReader };

export interface SocketInterface extends PacketReader {
    connect(port: number, ip: string): Promise<unknown>;
    readAll(): Promise<Buffer>;
    write(data: Buffer): void;
    close(): Promise<void>;
    lastDataAt?: number;
}

export interface SocketFactory {
    new (keepAliveInterval?: number): SocketInterface;
    readonly isWebSocket?: boolean;
}
