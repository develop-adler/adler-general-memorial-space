const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

function base64ToArrayBuffer(base64) {
    let bufferLength = base64.length * 0.75;
    const len = base64.length;
    let i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64.endsWith('=')) {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
}

/**
 * Worker to load resources in parallel
 */
// eslint-disable-next-line no-undef
self.onmessage = e => {
    if (typeof e.data === 'string') {
        const arraybuffer = base64ToArrayBuffer(e.data.substring(37));
        // eslint-disable-next-line no-undef
        self.postMessage(arraybuffer, [arraybuffer]);
    } else if (Array.isArray(e.data)) {
        const arrBufferList = [];
        e.data.forEach(base64 => {
            // truncate 'data:application/octet-stream;base64,' from base64 string
            arrBufferList.push(base64ToArrayBuffer(base64.substring(37)));
        });
        // eslint-disable-next-line no-undef
        self.postMessage(arrBufferList, arrBufferList);
    }
};
