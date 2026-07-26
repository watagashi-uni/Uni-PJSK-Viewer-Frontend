import type { BodyAssetManifest, HeadAssetManifest } from "../data/sampleScene";
export type RuntimeNumericArray = number[] | Float32Array | Uint16Array | Uint32Array;
export type RuntimeSkinColors = {
    default: string;
    shadow1: string;
    shadow2: string;
};
export type RuntimeCombinedCharacterAsset = {
    id: string;
    displayName: string;
    meshUrl: string;
    prefabRuntimeMeshUrl?: string;
    unityRuntimeJsonUrl?: string;
    unityRuntimeJsonPath?: string;
    unityMotionJsonUrl?: string;
    unityMotionJsonPath?: string;
    bodyAsset: BodyAssetManifest;
    headAsset: HeadAssetManifest;
    skinColors?: RuntimeSkinColors;
    runtimeExtension?: unknown;
};
