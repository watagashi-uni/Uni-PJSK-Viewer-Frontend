import * as THREE from "three";
import type { BodyAssetManifest, HeadAssetManifest, RawMaterialProperties } from "../../data/sampleScene";
import { type OfficialShaderTable } from "../../materials/official/officialUnityMaterial";
import type { UnityShaderGlobals } from "../../materials/official/unityShaderGlobals";
import type { RuntimeTextureLoader } from "../runtimeTextureLoader";
import { CharacterModelMaterials } from "./characterModelMaterials";
import { OfficialCharacterRenderer } from "./officialCharacterRenderer";
import { OfficialMaterialState } from "./officialMaterialState";
import type { SekaiDirectionalLight } from "./sekaiLightComponents";
import { SekaiCharacterEye, type SekaiCharacterEyeSerialized } from "./sekaiCharacterEye";
export declare function loadOfficialShaderTable(shader: string): Promise<OfficialShaderTable>;
export declare function resolveOfficialShaderName(raw: RawMaterialProperties): string;
export declare function readSekaiCharacterEyeSerialized(runtimeExtension: unknown): SekaiCharacterEyeSerialized;
export type OfficialCharacter = {
    renderer: OfficialCharacterRenderer;
    model: CharacterModelMaterials;
    eye: SekaiCharacterEye | null;
    states: OfficialMaterialState[];
};
export declare function installOfficialCharacter(options: {
    root: THREE.Object3D;
    bodyAsset: BodyAssetManifest;
    headAsset: HeadAssetManifest;
    textureLoader: RuntimeTextureLoader;
    globals: UnityShaderGlobals;
    directionalLight: SekaiDirectionalLight;
    headBone: () => THREE.Object3D | null;
    transformByPathId: (pathId: number) => THREE.Object3D | null;
    runtimeExtension: unknown;
    skinColors?: {
        default: string;
        shadow1: string;
        shadow2: string;
    } | null;
}): Promise<OfficialCharacter>;
