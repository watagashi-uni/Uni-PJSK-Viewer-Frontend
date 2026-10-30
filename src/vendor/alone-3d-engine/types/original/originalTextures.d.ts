import * as THREE from "three";
import { type OriginalBundle } from "./unityBundle";
type AstcDecoder = {
    decode16(data: Uint8Array, width: number, height: number, block: number): Uint16Array;
};
export declare function loadAstcDecoder(wasmBytes?: ArrayBuffer | Uint8Array): Promise<AstcDecoder>;
export type OriginalTexturePayload = {
    name: string;
    width: number;
    height: number;
    format: number;
    data: Uint8Array;
};
export declare function extractTexturePayload(bundle: OriginalBundle, pathId: bigint): OriginalTexturePayload;
export type OriginalTextureCapabilities = {
    nativeAstc: boolean;
};
export declare function astcUnorm16ToHalf(c: number): number;
export declare function createOriginalTexture(payload: OriginalTexturePayload, caps: OriginalTextureCapabilities): Promise<THREE.Texture>;
export declare class OriginalTextureSource {
    private readonly caps;
    private readonly payloads;
    private readonly textures;
    constructor(caps: OriginalTextureCapabilities);
    register(payloads: Record<string, OriginalTexturePayload>): void;
    has(uri: string): boolean;
    loadAsync(uri: string): Promise<THREE.Texture>;
    dispose(): void;
}
export declare function originalTextureSource(caps?: OriginalTextureCapabilities): OriginalTextureSource;
export declare function originalTextureCapabilities(renderer: THREE.WebGLRenderer): OriginalTextureCapabilities;
export {};
