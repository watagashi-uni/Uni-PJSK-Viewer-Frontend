import type { OfficialMaterialState } from "./officialMaterialState";
import type { UnityColor } from "./sekaiLightComponents";
export type SekaiEyeTiling = {
    tileX: number;
    tileY: number;
    sample: number;
};
export declare function sekaiEyeTileOffset(tiling: SekaiEyeTiling): [number, number];
export type SekaiCharacterEyeSerialized = {
    lightInfluence: number;
    lightInfluenceForEyeHighlight: number;
    tintColor: UnityColor;
    emissionColor: UnityColor;
    baseTiling: SekaiEyeTiling;
    highlightTiling: SekaiEyeTiling;
};
export declare function characterSettingsCloseEyeBlendShapes(characterId: number): {
    left: string[];
    right: string[];
} | null;
export type SekaiEyeRenderer = {
    materials: ({
        name: string;
        shader: string;
        state: OfficialMaterialState;
    } | null)[];
    blendShapeIndex(name: string): number;
    blendShapeWeight(index: number): number;
};
export declare class SekaiCharacterEye {
    private lightInfluence;
    private lightInfluenceForEyeHighlight;
    private lightInfluenceShaderParam;
    private lightInfluenceForEyeHighlightShaderParam;
    private readonly tintColor;
    private readonly emissionColor;
    private readonly baseTiling;
    private readonly highlightTiling;
    private leftEyeCloseBlendShapeValue;
    private rightEyeCloseBlendShapeValue;
    private baseMaterial;
    private highlightMaterial;
    private eyelashMaterial;
    private blendShapeIndexTable;
    private eyeRenderer;
    private readonly characterEyeActions;
    updateError: string | null;
    constructor(serialized: SekaiCharacterEyeSerialized);
    setup(renderer: SekaiEyeRenderer, characterId: number, setup3DType: "MusicVideo" | "Gacha" | "None" | "Other"): void;
    private getMaterials;
    update(): void;
    private require;
    private getBlendShapeValue;
    private updateLightInfluenceShaderParams;
}
