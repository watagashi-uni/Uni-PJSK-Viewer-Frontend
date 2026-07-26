import * as THREE from "three";
import type { RawMaterialProperties, RawMaterialTextureProperty } from "../data/sampleScene";
export declare function readRawMaterialFloat(rawMaterial: RawMaterialProperties | null | undefined, propertyName: string): number | null;
export declare function readRawMaterialBoolean(rawMaterial: RawMaterialProperties | null | undefined, propertyName: string, keyword?: string): boolean | null;
export declare function readRawMaterialColor(rawMaterial: RawMaterialProperties | null | undefined, propertyName: string): {
    r: number;
    g: number;
    b: number;
    a: number;
} | null;
export declare function readRawMaterialTexture(rawMaterial: RawMaterialProperties | null | undefined, propertyName: string): RawMaterialTextureProperty | null;
export declare function applyRawMaterialTextureTransform(texture: THREE.Texture | null | undefined, rawMaterial: RawMaterialProperties | null | undefined, propertyName: string): void;
