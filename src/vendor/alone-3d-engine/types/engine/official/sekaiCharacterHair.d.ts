import * as THREE from "three";
import type { OfficialMaterialState } from "./officialMaterialState";
export type SekaiCharacterHairSerialized = {
    offset: [number, number, number];
};
export declare class SekaiCharacterHair {
    private readonly serialized;
    private readonly rendererMaterials;
    private headTransform;
    private materials;
    private readonly point;
    constructor(serialized: SekaiCharacterHairSerialized, rendererMaterials: () => OfficialMaterialState[]);
    setup(headTransform: () => THREE.Object3D | null, useHairShadow: boolean): void;
    onUpdate(): void;
}
export declare function readSekaiCharacterHair(runtimeExtension: unknown): (SekaiCharacterHairSerialized & {
    rendererTransformPathId: number;
}) | null;
