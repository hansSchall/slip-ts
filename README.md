# slip-ts

Typescript (and JavaScript) SLIP encoder/decoder

SLIP: https://en.wikipedia.org/wiki/Serial_Line_Internet_Protocol

Inspired by https://github.com/colinbdclark/slip.js, rewritten in TypeScript and
enhanced to support AsyncIterators

## Installation

### Deno

```ts
import {
  asyncDecodeSLIP,
  decodeSLIP,
  encodeSLIP,
} from "https://deno.land/x/slip_ts/slip.ts";
```

### Node.js

`npm install slip-ts` or `yarn add slip-ts`

### Web

`slip-ts` should also work in browser, not tested. Install ist using npm, yarn
or copy the source files

## Usage

### Encoding

```ts
import { encodeSLIP } from "slip-ts";

const data: UInt8Array = ...;

const encoded: UInt8Array = encodeSLIP(data);
```

### Decoding Option 1 - Preferred - using AsyncIterators

```ts
import { asyncDecodeSLIP } from "slip-ts";

const input: AsyncIterable<Uint8Array> = ...;

for await (const decoded: UInt8Array of asyncDecodeSLIP(input)) {
    // decoded is a UInt8Array containing a decoded data frame
}
```

### Decoding Option 2 - Classic - using callbacks

```ts
import { decodeSLIP } from "slip-ts";

const decoder = decodeSLIP((decoded: UInt8Array) => {
  // decoded is a UInt8Array containing a decoded data frame
});

yourDataSource.on("data", (data: UInt8array) => {
  decoder(data);
});
```

## Contributing

Feel free to create an issue to report a bug, contribute fixes, unit tests,
etc.!

## License

(c) 2023 Hans Schallmoser

licensed under the GNU Lesser General Public License v2.1 (see LICENSE file)
