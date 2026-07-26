import * as THREE from "three";
export declare const projectedShadowTargetBoneNames: readonly ["Left_Toe", "Right_Toe"];
export type ProjectedShadowSettings = {
    width: number;
    height: number;
    opacity: number;
    crossSize: number;
    crossOpacity: number;
    floorY: number;
    adjustShadow: boolean;
    adjustAlpha: boolean;
    invisibleHeight: number;
    directionalShadow: boolean;
};
export type ProjectedShadowSettingsInput = Partial<ProjectedShadowSettings>;
export type RuntimeProjectedShadowDebug = {
    visible: boolean;
    floorY: number;
    characterHeight: number;
    settings: ProjectedShadowSettings;
    targetPosition: {
        x: number;
        y: number;
        z: number;
    };
    targetPositions: Array<{
        x: number;
        y: number;
        z: number;
    }>;
    directional: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        forward: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        opacity: number;
        alpha: number;
    };
    cross: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        opacity: number;
    };
    pairs: Array<{
        targetPosition: {
            x: number;
            y: number;
            z: number;
        };
        directionalOpacity: number;
        crossOpacity: number;
    }>;
};
export declare const defaultProjectedShadowSettings: ProjectedShadowSettings;
type CharacterProjectedShadowUpdate = {
    targetWorldPositions: THREE.Vector3[];
    lightWorldPosition: THREE.Vector3 | null;
    characterHeight: number;
    visible: boolean;
};
export declare class CharacterProjectedShadowController {
    readonly group: THREE.Group<THREE.Object3DEventMap>;
    private readonly defaultDirection;
    private settings;
    private readonly pairs;
    constructor();
    setSettings(input?: ProjectedShadowSettingsInput): void;
    update(state: CharacterProjectedShadowUpdate): void;
    getDebugSnapshot(characterHeight: number): RuntimeProjectedShadowDebug;
    dispose(): void;
    private createShadowMaterial;
    private calculateDirectionalAlpha;
    private resolveDirection;
}
export {};
