import type { UnityClipData } from "../original/unityAnimationClip";
import { PlayableAnimator, type UnityAnimatorTarget } from "./unityPlayableAnimator";
export declare const enum PLAYABLE_LAYER {
    BREATH = 0,
    MOTION = 1,
    MOTION_OVERRIDE = 2,
    FACIAL = 3,
    LIPSYNC = 4,
    BLINK = 5
}
export declare const enum ChangeMotionResult {
    Success = 0,
    Failure = 1,
    BlinkEndWait = 2
}
export declare const COMMON_MOTION_BUNDLE = "model3d/motion/common/default";
export type MotionClipResolver = (bundleName: string, motionName: string) => UnityClipData | null;
export declare class UnityMotionController {
    private readonly loadClip;
    private playableAnimator;
    private readonly loopAnimationNameDict;
    private readonly currentMotionAssetBundleNameDict;
    private readonly lipsyncMotionDict;
    private analyzer;
    private deltaTime;
    constructor(loadClip: MotionClipResolver);
    get animator(): PlayableAnimator | null;
    private load;
    setup(target: UnityAnimatorTarget): void;
    private setupBreath;
    private setupLipSync;
    changeMotionWithLoop(layer: PLAYABLE_LAYER, bundleName: string, motionName: string, loopMotionName: string, fadeTime?: number, startTime?: number): void;
    setLoopMotion(layer: PLAYABLE_LAYER, bundleName: string, motionName: string, _fadeTime?: number): boolean;
    changeMotion(layer: PLAYABLE_LAYER, bundleName: string, motionName: string, fadeTime?: number, startTime?: number): ChangeMotionResult.Success | ChangeMotionResult.Failure;
    getCurrentMotionBundleName(layer: PLAYABLE_LAYER): string;
    getCurrentMotionName(layer: PLAYABLE_LAYER): string;
    private onFinishMotion;
    setLipSync(analyzer: (() => number) | null): void;
    update(deltaTime: number): void;
    evaluateAnimator(deltaTime: number): void;
    lateUpdate(): void;
    private updateLipSync;
}
