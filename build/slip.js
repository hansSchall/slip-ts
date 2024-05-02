"use strict";
/*
* SLIP-TS

* Copyright (C) 2023 Hans Schallmoser

* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.

* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.

* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
* USA
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSLIP = exports.asyncDecodeSLIP = exports.encodeSLIP = exports.SLIP = void 0;
// inspired by https://github.com/colinbdclark/slip.js
var SLIP;
(function (SLIP) {
    SLIP[SLIP["END"] = 192] = "END";
    SLIP[SLIP["ESC"] = 219] = "ESC";
    SLIP[SLIP["ESC_END"] = 220] = "ESC_END";
    SLIP[SLIP["ESC_ESC"] = 221] = "ESC_ESC";
})(SLIP || (exports.SLIP = SLIP = {}));
function encodeSLIP(data) {
    if (data.indexOf(SLIP.END) === -1 && data.indexOf(SLIP.ESC) === -1) { // nothing to escape
        const res = new Uint8Array(data.length + 1);
        res.set(data);
        res[data.length] = SLIP.END;
        return res;
    }
    const result = new Uint8Array(data.length * 2 + 1);
    let pos = 0;
    function push(data) {
        result[pos] = data;
        pos++;
    }
    for (const token of data) {
        if (token === SLIP.END) {
            push(SLIP.ESC);
            push(SLIP.ESC_END);
        }
        else if (token === SLIP.ESC) {
            push(SLIP.ESC);
            push(SLIP.ESC_ESC);
        }
        else {
            push(token);
        }
    }
    push(SLIP.END);
    return new Uint8Array(new Uint8Array(result.buffer, 0, pos));
}
exports.encodeSLIP = encodeSLIP;
function merge(a, b) {
    const res = new Uint8Array(a.length + b.length);
    res.set(a, 0);
    res.set(b, a.length);
    return res;
}
function shiftPacket(data) {
    data = new Uint8Array(data);
    const packetEnd = data.indexOf(SLIP.END);
    if (packetEnd === -1)
        return [data];
    else
        return [
            new Uint8Array(data.buffer, 0, packetEnd),
            ...shiftPacket(new Uint8Array(data.buffer, packetEnd + 1))
        ];
}
function unescape(packet) {
    if (packet.indexOf(SLIP.ESC) === -1)
        return packet; // nothing to escape
    const result = new Uint8Array(packet.length);
    let pos = 0;
    function push(data) {
        result[pos] = data;
        pos++;
    }
    let flagEsc = false;
    for (const token of packet) {
        if (token === SLIP.ESC) {
            flagEsc = true;
        }
        else if (flagEsc) {
            flagEsc = false;
            if (token === SLIP.ESC_END)
                push(SLIP.END);
            else if (token === SLIP.ESC_ESC)
                push(SLIP.ESC);
        }
        else {
            push(token);
        }
    }
    return new Uint8Array(new Uint8Array(result.buffer, 0, pos));
}
async function* asyncDecodeSLIP(data) {
    let buf = new Uint8Array(0);
    for await (const chunk of data) {
        const packets = shiftPacket(merge(buf, chunk));
        buf = packets.pop() ?? new Uint8Array(0);
        for (const packet of packets) {
            if (packet.length)
                yield unescape(packet);
        }
    }
}
exports.asyncDecodeSLIP = asyncDecodeSLIP;
function decodeSLIP(cb) {
    let buf = new Uint8Array(0);
    return function (chunk) {
        const packets = shiftPacket(merge(buf, chunk));
        buf = packets.pop() ?? new Uint8Array(0);
        for (const packet of packets) {
            if (packet.length)
                cb(unescape(packet));
        }
    };
}
exports.decodeSLIP = decodeSLIP;
