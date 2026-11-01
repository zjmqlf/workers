import type { HttpConnectOptions, HttpConnectResponse, TcpSocket } from "./types";

export { isIP } from "./ip";

export type Socket = TcpSocket;

export const tcp = false;

function unavailable(): Error {
    return new Error("TCP sockets are not available in this environment: use WebSocketTransport or WebProxyTransport");
}

export function createSocket(): Socket {
    throw unavailable();
}

export function httpConnect(_options: HttpConnectOptions): Promise<HttpConnectResponse<Socket>> {
    return Promise.reject(unavailable());
}

