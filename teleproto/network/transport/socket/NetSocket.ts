import * as net from "node:net";
import { ByteStream, SocketClosedError } from "./ByteStream";
import type { SocketInterface } from "./types";
import { Buffer } from "node:buffer";

const DEFAULT_KEEP_ALIVE_INTERVAL = 30_000;

export class NetSocket implements SocketInterface {
    private socket?: net.Socket;
    private stream = new ByteStream();
    private readonly keepAliveInterval: number;

    constructor(keepAliveInterval?: number) {
        this.keepAliveInterval = keepAliveInterval ?? DEFAULT_KEEP_ALIVE_INTERVAL;
        this.stream.end();
    }

    get lastDataAt() {
        return this.stream.lastDataAt;
    }

    async connect(port: number, ip: string) {
        const stream = (this.stream = new ByteStream());
        const socket = new net.Socket();
        this.socket = socket;
        socket.on("data", (chunk: Buffer) => stream.push(chunk));
        socket.on("close", () => stream.end());
        await new Promise<void>((resolve, reject) => {
            const fail = (error: Error) => {
                stream.end(error);
                reject(error);
            };
            socket.once("error", fail);
            const ready = () => {
                socket.off("error", fail);
                socket.on("error", (error) => stream.end(error));
                socket.setNoDelay(true);
                socket.setKeepAlive(this.keepAliveInterval > 0, Math.max(0, this.keepAliveInterval));
                resolve();
            };
            socket.connect(port, ip, ready);
        });
    }

    read(n: number) {
        return this.stream.read(n);
    }

    readExactly(n: number) {
        return this.stream.readExactly(n);
    }

    write(data: Buffer) {
        if (this.stream.closed || !this.socket) throw new SocketClosedError("NetSocket was closed");
        this.socket.write(data);
    }

    async close() {
        const socket = this.socket;
        this.socket = undefined;
        this.stream.end();
        if (!socket || socket.destroyed) return;
        const closed = new Promise<void>((resolve) => socket.once("close", () => resolve()));
        socket.destroy();
        socket.unref();
        await closed;
    }

    toString() {
        return "NetSocket";
    }
}
