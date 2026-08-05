import { Buffer } from "node:buffer";

export interface PacketReader {
    read(n: number): Promise<Buffer>;
    readExactly(n: number): Promise<Buffer>;
}

export interface SocketInterface extends PacketReader {
    connect(port: number, ip: string): Promise<unknown>;
    readAll(): Promise<Buffer>;
    write(data: Buffer): void;
    close(): Promise<void>;
}

export interface SocketFactory {
    new (
        keepAliveInterval?: number
    ): SocketInterface;
    readonly isWebSocket?: boolean;
}
