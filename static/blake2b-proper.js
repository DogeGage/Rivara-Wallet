// Proper Blake2b implementation for browser
// Simplified but correct version for Tezos address derivation

(function() {
    // Blake2b initialization vectors
    const BLAKE2B_IV = new Uint32Array([
        0x6A09E667, 0xF3BCC908, 0xBB67AE85, 0x84CAA73B,
        0x3C6EF372, 0xFE94F82B, 0xA54FF53A, 0x5F1D36F1,
        0x510E527F, 0xADE682D1, 0x9B05688C, 0x2B3E6C1F,
        0x1F83D9AB, 0xFB41BD6B, 0x5BE0CD19, 0x137E2179
    ]);

    // Sigma permutations
    const SIGMA = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
        [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
        [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
        [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
        [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
        [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
        [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
        [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
        [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3]
    ];

    function rotr64(x, n) {
        return (x >>> n) | (x << (32 - n));
    }

    function add64(v, a, b) {
        const al = v[a], ah = v[a + 1];
        const bl = v[b], bh = v[b + 1];
        const rl = (al + bl) >>> 0;
        const rh = (ah + bh + (rl < al ? 1 : 0)) >>> 0;
        v[a] = rl;
        v[a + 1] = rh;
    }

    function add64c(v, a, b0, b1) {
        const al = v[a];
        const rl = (al + b0) >>> 0;
        const rh = (v[a + 1] + b1 + (rl < al ? 1 : 0)) >>> 0;
        v[a] = rl;
        v[a + 1] = rh;
    }

    function G(v, m, a, b, c, d, ix, iy) {
        add64(v, a, b);
        add64c(v, a, m[ix], m[ix + 1]);
        
        let xor0 = v[d] ^ v[a];
        let xor1 = v[d + 1] ^ v[a + 1];
        v[d] = xor1;
        v[d + 1] = xor0;
        
        add64(v, c, d);
        
        xor0 = v[b] ^ v[c];
        xor1 = v[b + 1] ^ v[c + 1];
        v[b] = (xor0 >>> 24) | (xor1 << 8);
        v[b + 1] = (xor1 >>> 24) | (xor0 << 8);
        
        add64(v, a, b);
        add64c(v, a, m[iy], m[iy + 1]);
        
        xor0 = v[d] ^ v[a];
        xor1 = v[d + 1] ^ v[a + 1];
        v[d] = (xor0 >>> 16) | (xor1 << 16);
        v[d + 1] = (xor1 >>> 16) | (xor0 << 16);
        
        add64(v, c, d);
        
        xor0 = v[b] ^ v[c];
        xor1 = v[b + 1] ^ v[c + 1];
        v[b] = (xor1 >>> 31) | (xor0 << 1);
        v[b + 1] = (xor0 >>> 31) | (xor1 << 1);
    }

    function blake2bCompress(ctx, last) {
        const v = new Uint32Array(32);
        const m = new Uint32Array(32);
        
        for (let i = 0; i < 16; i++) {
            v[i] = ctx.h[i];
            v[i + 16] = BLAKE2B_IV[i];
        }
        
        v[24] ^= ctx.t;
        v[25] ^= (ctx.t / 0x100000000) >>> 0;
        
        if (last) {
            v[28] = ~v[28];
            v[29] = ~v[29];
        }
        
        for (let i = 0; i < 32; i++) {
            m[i] = ctx.b[4 * i] | (ctx.b[4 * i + 1] << 8) | 
                   (ctx.b[4 * i + 2] << 16) | (ctx.b[4 * i + 3] << 24);
        }
        
        for (let i = 0; i < 12; i++) {
            const s = SIGMA[i];
            G(v, m, 0, 8, 16, 24, s[0] * 2, s[1] * 2);
            G(v, m, 2, 10, 18, 26, s[2] * 2, s[3] * 2);
            G(v, m, 4, 12, 20, 28, s[4] * 2, s[5] * 2);
            G(v, m, 6, 14, 22, 30, s[6] * 2, s[7] * 2);
            G(v, m, 0, 10, 20, 30, s[8] * 2, s[9] * 2);
            G(v, m, 2, 12, 22, 24, s[10] * 2, s[11] * 2);
            G(v, m, 4, 14, 16, 26, s[12] * 2, s[13] * 2);
            G(v, m, 6, 8, 18, 28, s[14] * 2, s[15] * 2);
        }
        
        for (let i = 0; i < 16; i++) {
            ctx.h[i] ^= v[i] ^ v[i + 16];
        }
    }

    function blake2b(input, key, outlen) {
        outlen = outlen || 64;
        key = key || null;
        
        const ctx = {
            b: new Uint8Array(128),
            h: new Uint32Array(16),
            t: 0,
            c: 0,
            outlen: outlen
        };
        
        for (let i = 0; i < 16; i++) {
            ctx.h[i] = BLAKE2B_IV[i];
        }
        
        const keylen = key ? key.length : 0;
        ctx.h[0] ^= 0x01010000 ^ (keylen << 8) ^ outlen;
        
        if (key && keylen > 0) {
            blake2bUpdate(ctx, key);
            ctx.c = 128;
        }
        
        blake2bUpdate(ctx, input);
        return blake2bFinal(ctx);
    }

    function blake2bUpdate(ctx, input) {
        for (let i = 0; i < input.length; i++) {
            if (ctx.c === 128) {
                ctx.t += ctx.c;
                blake2bCompress(ctx, false);
                ctx.c = 0;
            }
            ctx.b[ctx.c++] = input[i];
        }
    }

    function blake2bFinal(ctx) {
        ctx.t += ctx.c;
        while (ctx.c < 128) {
            ctx.b[ctx.c++] = 0;
        }
        blake2bCompress(ctx, true);
        
        const out = new Uint8Array(ctx.outlen);
        for (let i = 0; i < ctx.outlen; i++) {
            out[i] = (ctx.h[i >> 2] >>> (8 * (i & 3))) & 0xff;
        }
        return out;
    }
    
    // Export
    if (!window.blake2b) {
        window.blake2b = blake2b;
        console.log('Blake2b (proper) loaded ✓');
    }
})();
