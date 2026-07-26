import * as THREE from "three";
import type { HeadAssetManifest } from "../data/sampleScene";
import { type SekaiLayerAtlas } from "../materials/sekaiLayerMaterial";
import { type RuntimeMaterialDebug } from "./characterMaterialRuntime";
type RuntimeTextureLoader = {
    loadAsync(url: string): Promise<THREE.Texture>;
};
export type CharacterEyeMaterialController = {
    lightInfluence: number | null;
    lightInfluenceForEyeHighlight: number | null;
    tintColor: string | null;
    emissionColor: string | null;
    baseTiling: SekaiLayerAtlas | null;
    highlightTiling: SekaiLayerAtlas | null;
};
export declare function bindHeadRuntimeMaterials({ root, headAsset, textureLoader, templates, view, hair, eyeController, debug, }: {
    root: THREE.Object3D;
    headAsset: HeadAssetManifest;
    textureLoader: RuntimeTextureLoader;
    templates: {
        body: THREE.ShaderMaterial;
        hair: THREE.ShaderMaterial;
        face: THREE.ShaderMaterial;
    };
    view: {
        bodyDebugMode: number;
        faceDebugMode: number;
        faceSdfEnabled: boolean;
    };
    hair: {
        controllerPresent: boolean;
        proximityShadowEnabled: boolean;
        headPosition: THREE.Vector3;
    };
    eyeController?: CharacterEyeMaterialController | null;
    debug?: RuntimeMaterialDebug[];
}): Promise<RuntimeMaterialDebug[]>;
export {};
