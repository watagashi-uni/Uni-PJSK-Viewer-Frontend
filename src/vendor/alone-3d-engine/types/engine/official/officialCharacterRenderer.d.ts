import * as THREE from "three";
import type { UnityShaderGlobals } from "../../materials/official/unityShaderGlobals";
import type { OfficialMaterialState } from "./officialMaterialState";
type Feature = {
    name: string;
    lightMode: string;
    queue: [number, number];
    opaqueSort: boolean;
};
export declare const SCENE_SEKAI_RENDERER_FEATURES: readonly Feature[];
export type OfficialRendererSource = {
    mesh: THREE.Mesh | THREE.SkinnedMesh;
    rootBone: THREE.Object3D | null;
    slots: {
        slotIndex: number;
        state: OfficialMaterialState;
    }[];
};
export declare class OfficialCharacterRenderer {
    private readonly sources;
    private readonly globals;
    readonly root: THREE.Group<THREE.Object3DEventMap>;
    private readonly items;
    private readonly scratch;
    constructor(sources: OfficialRendererSource[], globals: UnityShaderGlobals);
    private createItem;
    private buildPassMaterial;
    prepare(camera: THREE.Camera): void;
    private feedUniforms;
    private assign;
    dispose(): void;
}
export {};
