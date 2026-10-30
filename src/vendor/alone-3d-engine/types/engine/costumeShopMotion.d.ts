import type * as THREE from "three";
import type { OriginalPartProvider } from "../original/originalPartProvider";
export { ORIGINAL_MOTION_SCHEME } from "../original/costumeIndex";
export declare function originalMotionBundle(animationUrl: string | null | undefined): string | null;
export declare function rendererMorphMeshes(node: THREE.Object3D, carrierBindings?: readonly {
    source: THREE.Object3D;
    target: THREE.Object3D;
}[]): THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material | THREE.Material[], THREE.Object3DEventMap>[];
export type CostumeShopMotionSnapshot = {
    motionBundle: string | null;
    motionClip: string | null;
    motionTime: number;
    motionLength: number;
    facialClip: string | null;
    facialTime: number;
    lipSyncClip: string | null;
};
export declare class CostumeShopMotion {
    private readonly provider;
    private controller;
    private readonly clips;
    private prevCharacter;
    private calmDownPending;
    constructor(provider: OriginalPartProvider);
    private resolve;
    preload(bundleNames: readonly string[]): Promise<void>;
    setupModel(root: THREE.Object3D, renderedMeshes: (node: THREE.Object3D) => THREE.Mesh[]): void;
    playMotion(character: string, motionBundle: string): void;
    takeCalmDown(): boolean;
    get active(): boolean;
    update(deltaTime: number): void;
    evaluate(deltaTime: number): void;
    lateUpdate(): void;
    seek(loop: boolean, phase: number): number;
    snapshot(): CostumeShopMotionSnapshot;
}
