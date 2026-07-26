import * as THREE from "three";
import type { HeadAssetManifest } from "../data/sampleScene";
export type FaceMotionKeyframe = {
    time: number;
    value: number;
};
export type FaceMotionCurve = {
    curveHash: number;
    keyframes: FaceMotionKeyframe[];
};
export type FaceMotionClip = {
    name: string;
    sampleRate: number;
    duration: number;
    curves: FaceMotionCurve[];
};
export type FaceMotionSet = {
    bundlePath?: string;
    clips: FaceMotionClip[];
};
export type FaceMotionPlaybackSnapshot = {
    activeClipName: string | null;
    queuedLoopClipName: string | null;
    error: string | null;
    currentTime: number;
    mappedMeshCount: number;
    mappedCurveCount: number;
};
export type RuntimeHeadMorphDebug = {
    meshName: string;
    morphTargetCount: number;
    mappedChannelCount: number;
    sampleChannels: string[];
};
export declare function readEmbeddedRuntimeFaceMotion(extension: unknown): FaceMotionSet | null;
export declare class FaceMotionRuntime {
    private motionSet;
    private clip;
    private loopClip;
    private time;
    private error;
    private enabled;
    private readonly bindings;
    bind(root: THREE.Object3D, headAsset: Pick<HeadAssetManifest, "morphChannels" | "morphChannelBindings">): RuntimeHeadMorphDebug[];
    setMotion(data: FaceMotionSet | null, preferredClipName: string | null, preferredLoopClipName: string | null): void;
    hasMotion(): boolean;
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;
    step(delta: number, speed: number, paused?: boolean): void;
    seek(time: number): void;
    promoteLoop(): void;
    applyCurrent(): void;
    release(options?: {
        preserveMotion?: boolean;
    }): void;
    getSnapshot(): FaceMotionPlaybackSnapshot;
    private clearInfluences;
}
