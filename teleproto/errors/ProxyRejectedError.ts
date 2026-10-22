export class ProxyRejectedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProxyRejectedError";
    }
}
