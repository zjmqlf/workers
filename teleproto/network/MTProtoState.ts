import crypto from "node:crypto";
import bigInt from "big-integer";
import type { AuthKey } from "../crypto/AuthKey";
import { generateRandomLong, mod, readBufferFromBigInt, readBigIntFromBuffer } from "../Helpers";
import { Api } from "../tl";
import { toSignedLittleBuffer } from "../Helpers";
import { GZIPPacked, TLMessage } from "../tl/core";
import { BinaryReader } from "../extensions";
import type { BinaryWriter } from "../extensions";
import { IGE } from "../crypto/IGE";
import { InvalidBufferError, SecurityError } from "../errors";
import { ReceivedIdsManager } from "./ReceivedIdsManager";
import { Buffer } from "node:buffer";

export class MTProtoState {
    private readonly authKey?: AuthKey;
    private _log: any;
    timeOffset: number;
    salt: bigInt.BigInteger;
    private id: bigInt.BigInteger;
    _sequence: number;
    private _lastMsgId: bigInt.BigInteger;
    private receivedIds: ReceivedIdsManager;
    private securityChecks: boolean;

    constructor(authKey?: AuthKey, loggers?: any, securityChecks = true) {
        this.authKey = authKey;
        this._log = loggers;
        this.timeOffset = 0;
        this.salt = bigInt.zero;
        this._sequence = 0;
        this.id = this._lastMsgId = bigInt.zero;
        this.receivedIds = new ReceivedIdsManager();
        this.securityChecks = securityChecks;
        this.reset();
    }

    get sessionId(): bigInt.BigInteger {
        return this.id;
    }

    reset() {
        this.id = generateRandomLong(true);
        this._sequence = 0;
        this._lastMsgId = bigInt.zero;
        this.receivedIds.clear();
    }

    _calcKey(authKey: Buffer, msgKey: Buffer, client: boolean) {
        const x = client ? 0 : 8;
        const sha256a = crypto
            .createHash("sha256")
            .update(msgKey)
            .update(authKey.subarray(x, x + 36))
            .digest();
        const sha256b = crypto
            .createHash("sha256")
            .update(authKey.subarray(x + 40, x + 76))
            .update(msgKey)
            .digest();
        const key = Buffer.concat([
            sha256a.subarray(0, 8),
            sha256b.subarray(8, 24),
            sha256a.subarray(24, 32),
        ]);
        const iv = Buffer.concat([
            sha256b.subarray(0, 8),
            sha256a.subarray(8, 24),
            sha256b.subarray(24, 32),
        ]);
        return { key, iv };
    }

    async writeDataAsMessage(
        buffer: BinaryWriter,
        data: Buffer,
        contentRelated: boolean,
        afterId?: bigInt.BigInteger,
        predeterminedMsgId?: bigInt.BigInteger
    ) {
        const msgId = predeterminedMsgId ?? this._getNewMsgId();
        const seqNo = this._getSeqNo(contentRelated);
        let body;
        if (!afterId) {
            body = await GZIPPacked.gzipIfSmaller(contentRelated, data);
        } else {
            body = await GZIPPacked.gzipIfSmaller(
                contentRelated,
                new Api.InvokeAfterMsg({
                    msgId: afterId,
                    query: {
                        getBytes() {
                            return data;
                        },
                    },
                }).getBytes()
            );
        }
        const s = Buffer.alloc(4);
        s.writeInt32LE(seqNo, 0);
        const b = Buffer.alloc(4);
        b.writeInt32LE(body.length, 0);
        const m = toSignedLittleBuffer(msgId, 8);
        buffer.write(Buffer.concat([m, s, b]));
        buffer.write(body);
        return msgId;
    }

    async encryptMessageData(data: Buffer) {
        if (!this.authKey) {
            throw new Error("Auth key unset");
        }
        await this.authKey.waitForKey();
        const authKey = this.authKey.getKey();
        if (!authKey) {
            throw new Error("Auth key unset");
        }
        if (!this.salt || !this.id || !authKey || !this.authKey.keyId) {
            throw new Error("Unset params");
        }
        const padLen = mod(-(16 + data.length + 12), 16) + 12;
        const plain = Buffer.allocUnsafe(16 + data.length + padLen);
        toSignedLittleBuffer(this.salt, 8).copy(plain, 0);
        toSignedLittleBuffer(this.id, 8).copy(plain, 8);
        data.copy(plain, 16);
        crypto.randomFillSync(plain, 16 + data.length, padLen);

        const msgKeyLarge = crypto
            .createHash("sha256")
            .update(authKey.subarray(88, 120))
            .update(plain)
            .digest();

        const msgKey = msgKeyLarge.subarray(8, 24);

        const { iv, key } = this._calcKey(authKey, msgKey, true);

        const keyId = readBufferFromBigInt(this.authKey.keyId, 8);
        return Buffer.concat([
            keyId,
            msgKey,
            new IGE(key, iv).encryptIge(plain),
        ]);
    }

    async decryptMessageData(body: Buffer) {
        if (!this.authKey) {
            throw new Error("Auth key unset");
        }
        if (body.length < 8) {
            throw new InvalidBufferError(body);
        }
        const keyId = readBigIntFromBuffer(body.slice(0, 8));
        if (!this.authKey.keyId || keyId.neq(this.authKey.keyId)) {
            throw new SecurityError("Server replied with an invalid auth key");
        }
        const authKey = this.authKey.getKey();
        if (!authKey) {
            throw new SecurityError("Unset AuthKey");
        }
        const msgKey = body.subarray(8, 24);
        const { iv, key } = this._calcKey(authKey, msgKey, false);
        body = new IGE(key, iv).decryptIge(body.subarray(24));

        const ourKey = crypto
            .createHash("sha256")
            .update(authKey.subarray(96, 128))
            .update(body)
            .digest();

        if (!msgKey.equals(ourKey.subarray(8, 24))) {
            throw new SecurityError(
                "Received msg_key doesn't match with expected one"
            );
        }
        const reader = new BinaryReader(body);
        reader.readLong();
        const serverId = reader.readLong();
        if (serverId.neq(this.id) && this.securityChecks) {
            throw new SecurityError("Server replied with a wrong session ID");
        }
        const remoteMsgId = reader.readLong();
        const registerResult = this.receivedIds.registerMsgId(remoteMsgId);
        if (registerResult !== "success" && this.securityChecks) {
            throw new SecurityError(`Rejected message: ${registerResult}`);
        }
        this.receivedIds.shrink();
        const remoteSequence = reader.readInt();
        reader.readInt();
        const obj = reader.tgReadObject();

        return new TLMessage(remoteMsgId, remoteSequence, obj);
    }

    _getNewMsgId() {
        const now = new Date().getTime() / 1000 + this.timeOffset;
        const nanoseconds = Math.floor((now - Math.floor(now)) * 1e9);
        let newMsgId = bigInt(Math.floor(now))
            .shiftLeft(bigInt(32))
            .or(bigInt(nanoseconds).shiftLeft(bigInt(2)));
        if (this._lastMsgId.greaterOrEquals(newMsgId)) {
            newMsgId = this._lastMsgId.add(bigInt(4));
        }
        this._lastMsgId = newMsgId;
        return newMsgId;
    }

    updateTimeOffset(correctMsgId: bigInt.BigInteger) {
        const bad = this._getNewMsgId();
        const old = this.timeOffset;
        const now = Math.floor(new Date().getTime() / 1000);
        const correct = correctMsgId.shiftRight(bigInt(32)).toJSNumber();
        this.timeOffset = correct - now;
        if (this.timeOffset !== old) {
            this._lastMsgId = bigInt.zero;
            this._log.debug(
                `Updated time offset (old offset ${old}, bad ${bad}, good ${correctMsgId}, new ${this.timeOffset})`
            );
        }

        return this.timeOffset;
    }

    _getSeqNo(contentRelated: boolean) {
        if (contentRelated) {
            const result = this._sequence * 2 + 1;
            this._sequence += 1;
            return result;
        } else {
            return this._sequence * 2;
        }
    }
}
