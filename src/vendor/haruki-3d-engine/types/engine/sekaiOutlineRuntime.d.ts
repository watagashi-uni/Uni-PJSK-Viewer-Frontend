import * as THREE from "three";
import type { RawMaterialProperties } from "../data/sampleScene";
export { readRawMaterialColor, } from "./rawMaterialRuntime";
export declare const sekaiCostumeShopOutlineSettings: {
    readonly widthMin: 0.0004;
    readonly widthMax: 0.0095;
    readonly distanceNear: 0.45;
    readonly distanceFar: 20;
};
/** Reconstructs the captured ClampForever, unweighted Unity FOV curve. */
export declare function evaluateSekaiOutlineFovFactor(fieldOfView: number): number;
export type SekaiRgb = {
    r: number;
    g: number;
    b: number;
};
export type SekaiRgba = SekaiRgb & {
    a: number;
};
export declare const sekaiCostumeShopOutlineControllerDefaults: {
    readonly color: {
        readonly r: 0;
        readonly g: 0;
        readonly b: 0;
    };
    readonly blending: 0.5;
};
/**
 * Presentation calibration for direct high-resolution browser output.
 *
 * CostumeShop renders its preview into a smaller intermediate texture before
 * the UI scales it up. The browser kernel renders directly at the final device
 * resolution, so applying the captured world-space shell unchanged makes it
 * visibly thicker and lets too much shaded material color into the outline.
 * Keep the captured globals above intact and correct only the presentation.
 */
export declare const sekaiPreviewOutlineCalibration: {
    readonly widthScale: 0.5;
    readonly shadedColorBlend: 0.3;
};
export declare function isSekaiOutlinePassEnabled(rawMaterial: RawMaterialProperties | null | undefined): boolean;
export declare function evaluateSekaiOutlineColor(mainTexture: SekaiRgb, materialOutline: SekaiRgb, globalOutline: SekaiRgb, blending: number): SekaiRgb;
export declare function applySekaiOutlineController(material: THREE.Material, color: THREE.ColorRepresentation | SekaiRgb | null | undefined, blending: number | null | undefined): void;
export declare function createSekaiOutlineMaterial(useVertexColor: boolean, rawMaterial?: RawMaterialProperties, useSecondNormal?: boolean, sourceMainTex?: THREE.Texture | null, sourceMaterial?: THREE.Material | null): THREE.ShaderMaterial | THREE.MeshBasicMaterial;
