export function i2abLow(buf: Uint32Array): ArrayBufferLike {
    const out = new Uint8Array(buf.length * 4);
    let o = 0;

    for (let j = 0; j < buf.length; j++) {
        const v = buf[j] >>> 0;

        out[o++] = (v >>> 24) & 0xff;
        out[o++] = (v >>> 16) & 0xff;
        out[o++] = (v >>> 8) & 0xff;
        out[o++] = v & 0xff;
    }

    return out.buffer;
}

export function i2abBig(buf: Uint32Array): ArrayBufferLike {
    return buf.buffer;
}

export function ab2iLow(ab: ArrayBufferLike | Uint8Array): Uint32Array {
    const src = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
    const len = src.length;

    if (len % 4 !== 0)
        throw new RangeError("Byte length must be a multiple of 4");

    const out = new Uint32Array(len / 4);
    for (let i = 0, w = 0; i < len; i += 4) {
        out[w++] =
            ((src[i] << 24) >>> 0) ^
            ((src[i + 1] << 16) >>> 0) ^
            ((src[i + 2] << 8) >>> 0) ^
            (src[i + 3] >>> 0);
    }

    return out;
}

export function ab2iBig(ab: ArrayBufferLike | Uint8Array): Uint32Array {
    return ab instanceof Uint8Array
        ? new Uint32Array(
            ab.buffer,
            ab.byteOffset,
            Math.floor(ab.byteLength / 4)
        )
        : new Uint32Array(ab);
}

export const isBigEndian =
    new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 0x01;

export const i2ab = isBigEndian ? i2abBig : i2abLow;
export const ab2i = isBigEndian ? ab2iBig : ab2iLow;
