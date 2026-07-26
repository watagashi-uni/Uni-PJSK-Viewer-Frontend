import * as THREE from "three";
import { type AnimationTrackDebug, type BodyAnimationKind, type RuntimeMotionRetargetDebug } from "./runtimeMotion";
import type { PrefabHeadFollowDebug } from "./unityPrefabRuntime";
export type BodyAnimationSelection = {
    motionUrl: string | null;
    motionKind?: BodyAnimationKind | null;
    loopUrl: string | null;
    loopKind?: BodyAnimationKind | null;
};
export type AnimationRetargetDebug = RuntimeMotionRetargetDebug & {
    prefabHeadFollow?: PrefabHeadFollowDebug;
};
export type AnimationPlaybackSnapshot = {
    selectedUrl: string | null;
    selectedLoopUrl: string | null;
    activeClipName: string | null;
    queuedLoopClipName: string | null;
    currentTime: number;
    duration: number;
    paused: boolean;
    speed: number;
    faceMotionEnabled: boolean;
    bodyHeadTracksEnabled: boolean;
    bodyTrackDebug: AnimationTrackDebug | null;
    bodyLoopTrackDebug: AnimationTrackDebug | null;
    bodyRetargetDebug: AnimationRetargetDebug | null;
    error: string | null;
};
export type AnimationPlaybackContext = {
    root: THREE.Object3D | null;
    retargetWithUnityPrefab: boolean;
    runtimeExtension: unknown;
    prefabHeadFollow: PrefabHeadFollowDebug;
};
export type AnimationPlaybackPosition = {
    activeClipName: string | null;
    currentTime: number;
};
type AnimationClipLoader = (url: string, kind: BodyAnimationKind | null) => Promise<THREE.AnimationClip[]>;
type AnimationPlaybackRuntimeOptions = {
    loadClips?: AnimationClipLoader;
    onLoopPromoted?: () => void;
};
export declare class AnimationPlaybackRuntime {
    private readonly loadClips;
    private readonly onLoopPromoted;
    private readonly clipCache;
    private readonly smoothedLoopClipCache;
    private context;
    private motionUrl;
    private motionKind;
    private loopUrl;
    private loopKind;
    private activeClipName;
    private duration;
    private action;
    private loopAction;
    private mixer;
    private finishedHandler;
    private error;
    private retargetDebug;
    private queuedLoopClipName;
    private speed;
    private paused;
    private bodyHeadTracksEnabled;
    private revision;
    constructor(options?: AnimationPlaybackRuntimeOptions);
    setSelection(selection: BodyAnimationSelection | null): void;
    hasSelection(): boolean;
    matchesSelection(motionUrl: string | null, loopUrl: string | null): boolean;
    capturePosition(): AnimationPlaybackPosition;
    setPaused(paused: boolean): void;
    setSpeed(speed: number): void;
    getSpeed(): number;
    isPaused(): boolean;
    setBodyHeadTracksEnabled(enabled: boolean): boolean;
    step(delta: number): void;
    seek(time: number): number;
    seekPhase(phase: number): number;
    seekLoopPhase(phase: number): number;
    restorePosition(position: AnimationPlaybackPosition): void;
    refresh(context: AnimationPlaybackContext): Promise<{
        poseApplied: boolean;
    }>;
    release(options?: {
        preserveSelection?: boolean;
        clearCache?: boolean;
    }): void;
    getSnapshot(options?: {
        faceMotionEnabled?: boolean;
        utjControlledNodeNames?: ReadonlySet<string>;
    }): AnimationPlaybackSnapshot;
    private loadCachedClips;
    private preparePlayableClip;
    private installPlayback;
    private promoteQueuedLoop;
    private applySettings;
    private configureAction;
    private getSmoothedLoopClip;
    private removeFinishedHandler;
    private stopPlayback;
}
export {};
