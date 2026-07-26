import * as THREE from "three";
export type UnityConstraintRuntimeGraph = {
    root: THREE.Object3D;
    nodeByPath: Map<string, THREE.Object3D>;
};
export type RuntimeConstraintSetupSource = {
    version?: string | number;
    sourceKind?: string;
    constraints?: RuntimeConstraintSource[];
    warnings?: string[];
};
type RuntimeConstraintSource = {
    type?: string;
    ownerPath?: string | null;
    ownerName?: string | null;
    enabled?: boolean | null;
    active?: boolean | null;
    weight?: number | null;
    locked?: boolean | null;
    translationAxis?: number | null;
    rotationAxis?: number | null;
    translationAtRest?: UnityVectorLike | null;
    rotationAtRest?: UnityVectorLike | null;
    translationOffset?: UnityVectorLike | null;
    rotationOffset?: UnityVectorLike | null;
    aimVector?: UnityVectorLike | null;
    upVector?: UnityVectorLike | null;
    worldUpVector?: UnityVectorLike | null;
    worldUpType?: number | null;
    worldUpObjectName?: string | null;
    worldUpObjectPath?: string | null;
    sources?: RuntimeConstraintBindingSource[];
    status?: string;
    reason?: string;
};
type UnityVectorLike = {
    x?: number;
    y?: number;
    z?: number;
    X?: number;
    Y?: number;
    Z?: number;
};
type RuntimeConstraintBindingSource = {
    sourceName?: string | null;
    sourcePath?: string | null;
    weight?: number;
    translationOffset?: UnityVectorLike | null;
    rotationOffset?: UnityVectorLike | null;
};
export type RuntimeConstraintDebug = {
    version: string | number | null;
    sourceKind: string | null;
    constraintCount: number;
    resolvedCount: number;
    unresolvedCount: number;
    appliedCount: number;
    warnings: string[];
    constraints: Array<{
        type: string;
        status: string;
        reason: string;
        ownerPath: string | null;
        ownerName: string | null;
        resolvedOwner: boolean;
        applied: boolean;
        sources: Array<{
            sourcePath: string | null;
            sourceName: string | null;
            weight: number;
            resolvedSource: boolean;
            translationOffset: {
                x: number;
                y: number;
                z: number;
            } | null;
            rotationOffset: {
                x: number;
                y: number;
                z: number;
            } | null;
        }>;
    }>;
};
export declare class UnityConstraintRuntime {
    private readonly graph;
    private readonly setup;
    private readonly constraints;
    constructor(graph: UnityConstraintRuntimeGraph, setup: RuntimeConstraintSetupSource, characterHeight: number);
    update(): RuntimeConstraintDebug;
}
export declare function applyUnityRuntimeConstraints(graph: UnityConstraintRuntimeGraph, setup: RuntimeConstraintSetupSource | undefined, characterHeight: number): RuntimeConstraintDebug | null;
export {};
