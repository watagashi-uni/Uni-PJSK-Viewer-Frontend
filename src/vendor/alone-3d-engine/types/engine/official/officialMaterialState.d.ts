import * as THREE from "three";
import type { RawMaterialProperties } from "../../data/sampleScene";
import type { OfficialShaderTable } from "../../materials/official/officialUnityMaterial";
export type UnityTextureBinding = {
    texture: THREE.Texture | null;
    scaleOffset: [number, number, number, number];
    defaultName: string;
};
export declare class OfficialMaterialState {
    readonly table: OfficialShaderTable;
    readonly name: string;
    renderQueue: number;
    private readonly floats;
    private readonly colors;
    private readonly textures;
    private readonly keywords;
    private version;
    constructor(table: OfficialShaderTable, name: string, raw: RawMaterialProperties | null | undefined, resolveTexture: (property: string) => THREE.Texture | null);
    get revision(): number;
    get enabledKeywords(): ReadonlySet<string>;
    hasFloat(name: string): boolean;
    getFloat(name: string): number | null;
    getColor(name: string): [number, number, number, number] | null;
    getTexture(name: string): UnityTextureBinding | null;
    setFloat(name: string, value: number): void;
    setInt(name: string, value: number): void;
    setColor(name: string, color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): void;
    setVector(name: string, x: number, y: number, z: number, w: number): void;
    setTexture(name: string, texture: THREE.Texture | null): void;
    setTextureOffset(name: string, x: number, y: number): void;
    enableKeyword(keyword: string): void;
    disableKeyword(keyword: string): void;
}
