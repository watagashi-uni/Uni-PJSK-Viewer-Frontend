import { decompress } from "../../node_modules/brotli-wasm/pkg.web/brotli_wasm.js";
export declare function loadBrotliWasm(wasmUrl: string): Promise<{
    decompress: typeof decompress;
}>;
