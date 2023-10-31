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

// inspired by https://github.com/colinbdclark/slip.js

export enum SLIP {
    END = 192,
    ESC = 219,
    ESC_END = 220,
    ESC_ESC = 221,
}

export function encodeSLIP(data: Uint8Array) {
    const result = new Uint8Array(data.length * 2 + 1);
    let pos = 0;
    function push(data: number) {
        result[pos] = data;
        pos++;
    }
    for (const token of data) {
        if (token === SLIP.END) {
            push(SLIP.ESC);
            push(SLIP.ESC_END);
        } else if (token === SLIP.ESC) {
            push(SLIP.ESC);
            push(SLIP.ESC_ESC);
        } else {
            push(token);
        }
    }
    push(SLIP.END);
    return new Uint8Array(new Uint8Array(result.buffer, 0, pos));
}

function merge(a: Uint8Array, b: Uint8Array) {
    const res = new Uint8Array(a.length + b.length);
    res.set(a, 0);
    res.set(b, a.length);
    return res;
}

function shiftPacket(data: Uint8Array): Uint8Array[] {
    data = new Uint8Array(data);
    const packetEnd = data.indexOf(SLIP.END);
    if (packetEnd === -1)
        return [data];
    else
        return [
            new Uint8Array(data.buffer, 0, packetEnd),
            ...shiftPacket(
                new Uint8Array(data.buffer, packetEnd + 1)
            )
        ];
}

function unescape(packet: Uint8Array): Uint8Array {
    const result = new Uint8Array(packet.length);
    let pos = 0;
    function push(data: number) {
        result[pos] = data;
        pos++;
    }
    let flagEsc = false;
    for (const token of packet) {
        if (token === SLIP.ESC) {
            flagEsc = true;
        } else if (flagEsc) {
            flagEsc = false;
            if (token === SLIP.ESC_END)
                push(SLIP.END);
            else if (token === SLIP.ESC_ESC)
                push(SLIP.ESC);
        } else {
            push(token);
        }
    }
    return new Uint8Array(new Uint8Array(result.buffer, 0, pos));
}

export async function* asyncDecodeSLIP(data: AsyncIterable<Uint8Array>) {
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

export function decodeSLIP(cb: (data: Uint8Array) => void) {
    let buf = new Uint8Array(0);
    return function (chunk: Uint8Array) {
        const packets = shiftPacket(merge(buf, chunk));
        buf = packets.pop() ?? new Uint8Array(0);
        for (const packet of packets) {
            if (packet.length)
                cb(unescape(packet));
        }
    };
}
