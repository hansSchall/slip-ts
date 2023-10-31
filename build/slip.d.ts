export declare enum SLIP {
    END = 192,
    ESC = 219,
    ESC_END = 220,
    ESC_ESC = 221
}
export declare function encodeSLIP(data: Uint8Array): Uint8Array;
export declare function asyncDecodeSLIP(data: AsyncIterable<Uint8Array>): AsyncGenerator<Uint8Array, void, unknown>;
export declare function decodeSLIP(cb: (data: Uint8Array) => void): (chunk: Uint8Array) => void;
