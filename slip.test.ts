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

import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { asyncDecodeSLIP, encodeSLIP, SLIP } from "./slip.ts";

Deno.test("encodeSLIP", () => {
    // basic packet
    assertEquals(encodeSLIP(
        new Uint8Array([1, 2, 3])),
        new Uint8Array([1, 2, 3, SLIP.END]));

    // empty packet
    assertEquals(encodeSLIP(
        new Uint8Array([])),
        new Uint8Array([SLIP.END]));

    // escape END
    assertEquals(encodeSLIP(
        new Uint8Array([1, SLIP.END])),
        new Uint8Array([1, SLIP.ESC, SLIP.ESC_END, SLIP.END]));

    // escape ESC
    assertEquals(encodeSLIP(
        new Uint8Array([1, SLIP.ESC])),
        new Uint8Array([1, SLIP.ESC, SLIP.ESC_ESC, SLIP.END]));

    // don't escape ESC_END
    assertEquals(encodeSLIP(
        new Uint8Array([1, SLIP.ESC_END])),
        new Uint8Array([1, SLIP.ESC_END, SLIP.END]));

    // don't escape ESC_ESC
    assertEquals(encodeSLIP(
        new Uint8Array([1, SLIP.ESC_ESC])),
        new Uint8Array([1, SLIP.ESC_ESC, SLIP.END]));
});

async function* spreadData(data: Uint8Array[]) {
    for (const packet of data) {
        yield packet;
    }
}

async function decode(data: Uint8Array[]) {
    const res = Array<Uint8Array>();
    for await (const packet of asyncDecodeSLIP(spreadData(data))) {
        res.push(packet);
    }
    return res;
}

Deno.test("decodeSLIP", async () => {
    // basic packet
    assertEquals(await decode(
        [new Uint8Array([1, 2, 3, SLIP.END])]),
        [new Uint8Array([1, 2, 3])]);

    // two packets
    assertEquals(await decode(
        [new Uint8Array([1, 2, 3, SLIP.END, 4, 5, SLIP.END])]),
        [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]);

    // two packets, second without END
    assertEquals(await decode(
        [new Uint8Array([1, 2, 3, SLIP.END, 4, 5])]),
        [new Uint8Array([1, 2, 3])]);

    // two packets, to transmission units
    assertEquals(await decode(
        [new Uint8Array([1, 2, 3, SLIP.END]), new Uint8Array([4, 5, SLIP.END])]),
        [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]);

    // two packets, to transmission units, first END in second packet
    assertEquals(await decode(
        [new Uint8Array([1, 2, 3]), new Uint8Array([SLIP.END, 4, 5, SLIP.END])]),
        [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]);

    // two packets, to transmission units, parts of first in second
    assertEquals(await decode(
        [new Uint8Array([1, 2]), new Uint8Array([3, SLIP.END, 4, 5, SLIP.END])]),
        [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]);
});

async function encodeDecode(data: Uint8Array[]) {
    assertEquals(await decode(data.map(encodeSLIP)), data);
}

Deno.test("encodeDecodeSLIP", async () => {
    // two packets
    await encodeDecode([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])]);

    // contains END
    await encodeDecode([new Uint8Array([1, 2, 3, SLIP.END]), new Uint8Array([4, 5])]);

    // contains ESC
    await encodeDecode([new Uint8Array([1, 2, 3, SLIP.ESC]), new Uint8Array([4, 5])]);

    // contains ESC ESC_ESC
    await encodeDecode([new Uint8Array([1, 2, 3, SLIP.ESC, SLIP.ESC_ESC]), new Uint8Array([4, 5])]);

    // contains ESC END
    await encodeDecode([new Uint8Array([1, 2, 3, SLIP.ESC, SLIP.ESC_END]), new Uint8Array([4, 5])]);
});
