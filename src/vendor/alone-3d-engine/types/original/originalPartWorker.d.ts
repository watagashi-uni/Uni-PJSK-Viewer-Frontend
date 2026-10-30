import type { PartRegistryEntry } from "../parts/runtimePartComposer";
import { type OriginalPartType } from "./partBuilder";
import { type OriginalTexturePayload } from "./originalTextures";
import { type UnityClipData } from "./unityAnimationClip";
export type OriginalPartRequest = {
    id: number;
    baseUrl: string;
    brotliWasmUrl: string;
    entry: PartRegistryEntry;
    partType: OriginalPartType;
    bundleName: string;
    colorBundleName: string | null;
    characterHeightMeters: number;
    attachNode: string | null;
};
export type OriginalClipRequest = {
    id: number;
    kind: "clips";
    baseUrl: string;
    brotliWasmUrl: string;
    bundleNames: string[];
};
export declare function loadOriginalClipsRequest(request: Omit<OriginalClipRequest, "id">): Promise<{
    clips: Record<string, UnityClipData[] | null>;
}>;
export declare function buildOriginalPartRequest(request: Omit<OriginalPartRequest, "id">): Promise<{
    runtime: import("../internal").PartRuntimePackage;
    textures: Record<string, OriginalTexturePayload>;
}>;
