import type { PartRegistryEntry, PartRuntimePackage } from "../parts/runtimePartComposer";
import { type OriginalBundle } from "./unityBundle";
export type OriginalPartType = "body" | "head" | "hair" | "head_optional";
export type BundleResolver = (cabName: string) => OriginalBundle | null;
export declare const originalTextureUri: (cab: string, pathId: bigint) => string;
export declare function crc32(text: string): number;
export type OriginalPartInput = {
    entry: PartRegistryEntry;
    partType: OriginalPartType;
    bundle: OriginalBundle;
    colorBundle: OriginalBundle | null;
    resolveBundle: BundleResolver;
    characterHeightMeters: number;
    attachNode?: string | null;
};
export declare function buildOriginalPart(input: OriginalPartInput): PartRuntimePackage;
