import * as THREE from "three";
export declare class SekaiExtraBoneRuntime {
    private readonly entries;
    private readonly sourceEuler;
    private readonly targetEuler;
    private readonly targetQuaternion;
    private constructor();
    static fromPjskRuntimeExtension(extension: unknown, root: THREE.Object3D): SekaiExtraBoneRuntime | null;
    update(): void;
    getControlledTrackNodeNames(): Set<string>;
}
