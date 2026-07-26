import * as THREE from "three";
import { UnityConstraintRuntime, type RuntimeConstraintDebug } from "./unityConstraintRuntime";
export type PrefabHeadFollowDebug = {
    active: boolean;
    sourcePath: string | null;
    targetPath: string | null;
    reason: string | null;
    setupVersion?: string;
    sourceScaleCorrection?: {
        characterHeightMeters: number | null;
        characterModelScaleMeters: number | null;
        scale: number;
        reason: string;
    };
    targetCount?: number;
    targetPaths?: string[];
    mountedHeadRootCount?: number;
    mountedHeadOriginPaths?: string[];
    assemblyCounts?: {
        inputTransforms: number;
        retainedTransforms: number;
        removedTransforms: number;
        capturedCommonRemovedTransforms: number;
        removedAtLeastCapturedCommonCount: boolean;
    };
    positionRoots?: PrefabHeadFollowNodeDebug[];
    keyNodes?: Record<string, PrefabHeadFollowNodeDebug | null>;
    assemblyDistances?: {
        bodyNeckToFaceNeck: number | null;
        bodyHeadToFaceHead: number | null;
    };
};
export type PrefabHeadFollowNodeDebug = {
    path: string;
    canonicalPath: string;
    parentPath: string | null;
    destroyed: boolean;
    localPosition: {
        x: number;
        y: number;
        z: number;
    };
    localQuaternion: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    worldPosition: {
        x: number;
        y: number;
        z: number;
    };
    worldQuaternion: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    worldForward: {
        x: number;
        y: number;
        z: number;
    };
};
export type UnityPrefabSourceGraph = {
    root: THREE.Group;
    nodeByPath: Map<string, THREE.Object3D>;
    meshCarrierBindings: Array<{
        source: THREE.Object3D;
        target: THREE.Object3D;
    }>;
    bodyAttach: THREE.Object3D | null;
    bodyAttachPath: string | null;
    headRoot: THREE.Object3D | null;
    headRootPath: string | null;
    headOrigin: THREE.Object3D | null;
    headOriginPath: string | null;
    bodyRootBone: THREE.Object3D | null;
    bodyRootBonePath: string | null;
    headRendererPaths: string[];
    debug: PrefabHeadFollowDebug;
};
export type NativeMeshInstallDiagnostics = {
    meshCount: number;
    boneCount: number;
    skinnedMeshCount: number;
    skinBindings: NativeMeshSkinBindingDiagnostics[];
    error: string | null;
    warnings: string[];
};
export type NativeMeshSkinBindingDiagnostics = {
    meshName: string;
    partKind: string | null;
    rendererTransformPath: string | null;
    rootBonePath: string | null;
    rootBoneResolved: boolean;
    effectiveRootBonePath: string | null;
    effectiveRootBoneResolved: boolean;
    boneCount: number;
    restTranslation: {
        x: number;
        y: number;
        z: number;
    };
    restScale: {
        x: number;
        y: number;
        z: number;
    };
    restMatrixSpread: number;
    restMatrixSpreadBonePath: string | null;
};
export declare function applyUnityCharacterHeight(graph: UnityPrefabSourceGraph, characterHeight: number): THREE.Object3D<THREE.Object3DEventMap>;
export declare function buildUnityPrefabSourceGraph(extension: unknown, meshCarrierRoot?: THREE.Object3D | null): UnityPrefabSourceGraph | null;
export declare function installUnityRuntimeNativeMeshes(graph: UnityPrefabSourceGraph, extension: unknown): NativeMeshInstallDiagnostics;
export declare function syncUnityPrefabSourceGraph(graph: UnityPrefabSourceGraph, extension: unknown, characterHeight: number, constraintRuntime?: {
    update(): RuntimeConstraintDebug;
} | null): RuntimeConstraintDebug | null;
export declare function createUnityPrefabConstraintRuntime(graph: UnityPrefabSourceGraph, extension: unknown, characterHeight: number): UnityConstraintRuntime | null;
export declare function makeUnityPrefabHeadFollowDebugSnapshot(graph: UnityPrefabSourceGraph | null, extension: unknown, fallback: PrefabHeadFollowDebug): PrefabHeadFollowDebug;
