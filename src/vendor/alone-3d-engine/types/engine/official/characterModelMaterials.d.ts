import type * as THREE from "three";
import type { OfficialMaterialState } from "./officialMaterialState";
import { type SekaiCharacterDirectionalLight, type UnityColor, type UnityQuaternion } from "./sekaiLightComponents";
export declare enum CharacterMaterialType {
    Face = 0,
    Eye = 1,
    Eyebrow = 2,
    Eyelash = 3,
    EyeHighlight = 4,
    Hair = 5,
    Body = 6,
    Acc = 7,
    Other = 8
}
export declare function classifyCharacterMaterial(materialName: string): CharacterMaterialType;
export type CharacterStencilData = {
    stencilRef: number;
    readMask: number;
    writeMask: number;
    comp: number;
    pass: number;
    fail: number;
    zFail: number;
};
export type CharacterMaterialData = {
    renderQueue: number;
    baseStencil: CharacterStencilData;
    overlayStencil: CharacterStencilData;
};
export declare function createCharacterStencilData(type: CharacterMaterialType, formationId: number): CharacterMaterialData;
export type CharacterModelRenderer = {
    gameObjectName: string;
    materials: {
        state: OfficialMaterialState;
        type: CharacterMaterialType;
    }[];
};
export type CharacterHeadTransform = {
    rotation: UnityQuaternion;
};
export declare function unityEulerAngles(q: UnityQuaternion): [number, number, number];
export declare class CharacterModelMaterials {
    private readonly head;
    private readonly renderers;
    private readonly face;
    private readonly acc;
    private rendererFormationId;
    private readonly stencilFormationId;
    private directionalLightRotation;
    private characterDirectionalLightData;
    private characterAction;
    private skin;
    constructor(renderers: CharacterModelRenderer[], head: () => CharacterHeadTransform | null);
    private allMaterials;
    setupRenderQueueAndStencil(): void;
    setupFormation(formationId: number): void;
    setupDirectionalLight(rotation: () => UnityQuaternion, data: SekaiCharacterDirectionalLight): void;
    addCharacterAction(action: () => void): void;
    updateReflection(): void;
    setupDitherTexture(texture: THREE.Texture): void;
    setupAccessoryMaterial(): void;
    setupSkin(defaultSkinColor: UnityColor, shadow1SkinColor: UnityColor, shadow2SkinColor: UnityColor): void;
    update(): void;
    private updateEyelashData;
    private updateCharacterMaterialParameters;
    private setupFaceShadowAction;
    get skinColors(): [UnityColor, UnityColor, UnityColor] | null;
}
