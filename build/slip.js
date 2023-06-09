"use strict";
// (c) 2023 Hans Schallmoser, licensed under GNU Lesser General Public License v2.1, see LICENSE file
// inspired by https://github.com/colinbdclark/slip.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSLIP = exports.asyncDecodeSLIP = exports.encodeSLIP = exports.SLIP = void 0;
var SLIP;
(function (SLIP) {
    SLIP[SLIP["END"] = 192] = "END";
    SLIP[SLIP["ESC"] = 219] = "ESC";
    SLIP[SLIP["ESC_END"] = 220] = "ESC_END";
    SLIP[SLIP["ESC_ESC"] = 221] = "ESC_ESC";
})(SLIP = exports.SLIP || (exports.SLIP = {}));
function expandByteArray(arr) {
    const expanded = new Uint8Array(arr.length * 2);
    expanded.set(arr);
    return expanded;
}
function sliceByteArray(arr, start, end) {
    const sliced = arr.buffer.slice ? arr.buffer.slice(start, end) : arr.subarray(start, end);
    return new Uint8Array(sliced);
}
function encodeSLIP(data) {
    let encoded = new Uint8Array((data.length + 7) & ~0x03);
    let j = 0;
    function push(char) {
        encoded[j++] = char;
    }
    push(SLIP.END);
    for (let i = 0; i < data.length; i++) {
        if (j > encoded.length - 3) {
            encoded = expandByteArray(encoded);
        }
        const char = data[i];
        if (char === SLIP.END) {
            push(SLIP.ESC);
            push(SLIP.ESC_END);
        }
        else if (char === SLIP.ESC) {
            push(SLIP.ESC);
            push(SLIP.ESC_ESC);
        }
        else {
            push(char);
        }
    }
    push(SLIP.END);
    return sliceByteArray(encoded, 0, j);
}
exports.encodeSLIP = encodeSLIP;
function mergeBuffers(buf1, buf2) {
    if (buf1.length == 0)
        return buf2;
    if (buf2.length == 0)
        return buf1;
    const res = new Uint8Array(buf1.length + buf2.length);
    res.set(buf1, 0);
    res.set(buf2, buf1.length);
    return res;
}
function* g_decodeSLIP() {
    let input = new Uint8Array(0);
    let decoded = new Uint8Array(0);
    let p_decoded = 0;
    let escape = false;
    function push(char) {
        decoded[p_decoded++] = char;
    }
    function yieldReturn(data, p_input) {
        input = mergeBuffers(sliceByteArray(input, p_input, input.length), data);
        decoded = new Uint8Array(input.length);
        p_decoded = 0;
    }
    while (true) {
        for (let p_input = 0; p_input < input.length; p_input++) {
            const char = input[p_input];
            if (escape) {
                if (char === SLIP.ESC_ESC) {
                    push(SLIP.ESC);
                }
                else if (char === SLIP.ESC_END) {
                    push(SLIP.END);
                }
            }
            else {
                if (char === SLIP.ESC) {
                    escape = true;
                    continue;
                }
                else if (char === SLIP.END) {
                    if (p_decoded == 0)
                        continue;
                    yieldReturn(yield sliceByteArray(decoded, 0, p_decoded), p_input);
                }
                else {
                    push(char);
                }
            }
        }
        yieldReturn(yield new Uint8Array(0), 0);
    }
}
async function* asyncDecodeSLIP(data) {
    const decoder = g_decodeSLIP();
    decoder.next(new Uint8Array(0));
    while (true) {
        for await (let chunk of data) {
            while (true) {
                const yielded = decoder.next(chunk).value;
                if (yielded.length > 0) {
                    if (chunk.length > 0)
                        chunk = new Uint8Array(0);
                    yield yielded;
                }
                else {
                    if (chunk.length > 0)
                        chunk = new Uint8Array(0);
                    else
                        break;
                }
            }
        }
    }
}
exports.asyncDecodeSLIP = asyncDecodeSLIP;
function decodeSLIP(cb) {
    const decoder = g_decodeSLIP();
    decoder.next(new Uint8Array(0));
    return function (chunk) {
        while (true) {
            const yielded = decoder.next(chunk).value;
            if (yielded.length > 0) {
                if (chunk.length > 0)
                    chunk = new Uint8Array(0);
                cb(yielded);
            }
            else {
                if (chunk.length > 0)
                    chunk = new Uint8Array(0);
                else
                    break;
            }
        }
    };
}
exports.decodeSLIP = decodeSLIP;
