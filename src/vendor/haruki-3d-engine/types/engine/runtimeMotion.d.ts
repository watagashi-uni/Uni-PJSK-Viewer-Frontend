import * as THREE from "three";
export type BodyAnimationKind = "unity-json";
export type AnimationTrackDebug = {
    trackCount: number;
    transformTrackCount: number;
    hairTrackCount: number;
    headTrackCount: number;
    neckTrackCount: number;
    upperBodyTrackCount: number;
    utjControlledTrackCount: number;
    sampleHairTracks: string[];
    sampleHeadTracks: string[];
    sampleUtjControlledTracks: string[];
};
export type RuntimeMotionRetargetDebug = {
    mode: "none" | "unity-prefab";
    bindingCount: number;
    sourceTrackCount: number;
    emittedTrackCount: number;
    resolvedTargetCount: number;
    resolvedBodyTargetCount: number;
    resolvedFaceTargetCount: number;
    unresolvedTrackCount: number;
    duplicateTargetTrackCount: number;
    sampleUnresolvedTracks: string[];
    sampleResolvedHeadTargets: string[];
};
export declare function isLoopClipName(name: string | undefined, url: string | null): boolean;
export declare function createSmoothedLoopClip(clip: THREE.AnimationClip, sampleRate?: number): THREE.AnimationClip;
export declare function makeAnimationTrackDebug(clip: THREE.AnimationClip | null, utjControlledNodeNames?: ReadonlySet<string>): AnimationTrackDebug | null;
export declare function prepareRuntimeAnimationClip(clip: THREE.AnimationClip, includeBodyHeadTracks: boolean): THREE.AnimationClip;
export declare function inferBodyAnimationKind(url: string | null, explicitKind?: BodyAnimationKind | null): BodyAnimationKind | null;
export declare function animationClipCacheKey(url: string, kind: BodyAnimationKind | null): string;
export declare function decodeUnityMotionClips(value: unknown): THREE.AnimationClip[];
export declare function retargetUnityPrefabAnimationClip(clip: THREE.AnimationClip, root: THREE.Object3D, extension: unknown): {
    clip: THREE.AnimationClip | null;
    debug: RuntimeMotionRetargetDebug;
    error: string | null;
};
