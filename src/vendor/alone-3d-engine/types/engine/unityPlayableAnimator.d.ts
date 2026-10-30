import * as THREE from "three";
import { type UnityClipData } from "../original/unityAnimationClip";
export declare const enum PlayableAnimatorLoopType {
    FollowAnimationClip = 0,
    Loop = 1,
    Clamp = 2
}
export declare const enum InputPlayableUseType {
    BuildUp = 0,
    Recycle = 1
}
declare const enum PlayState {
    Paused = 0,
    Playing = 1
}
export declare class AnimationClipPlayable {
    readonly clip: UnityClipData;
    time: number;
    speed: number;
    playState: PlayState;
    readonly length: number;
    constructor(clip: UnityClipData);
    getTime(): number;
    setTime(time: number): void;
    timeSet: boolean;
    getSpeed(): number;
    setSpeed(speed: number): void;
    getPlayState(): PlayState;
    play(): void;
    pause(): void;
    clipTime(): number;
}
export declare class AnimationMixerPlayable {
    readonly normalizeWeights: boolean;
    readonly inputs: (AnimationClipPlayable | null)[];
    readonly weights: number[];
    constructor(inputCount: number, normalizeWeights: boolean);
    getInputCount(): number;
    getInput(index: number): AnimationClipPlayable | null;
    addInput(playable: AnimationClipPlayable, weight: number): number;
    connectInput(index: number, playable: AnimationClipPlayable): void;
    disconnectInput(index: number): void;
    getInputWeight(index: number): number;
    setInputWeight(index: number, weight: number): void;
}
export declare class AnimationLayerMixerPlayable {
    readonly inputs: AnimationMixerPlayable[];
    readonly weights: number[];
    addInput(mixer: AnimationMixerPlayable, weight: number): void;
    getInputCount(): number;
    getInputWeight(index: number): number;
    setInputWeight(index: number, weight: number): void;
}
declare const enum PropertyKind {
    Position = 0,
    Rotation = 1,
    Scale = 2,
    BlendShape = 3
}
type BoundProperty = {
    kind: PropertyKind;
    node: THREE.Object3D;
    morphs: {
        mesh: THREE.Mesh;
        index: number;
    }[];
    defaults: Float64Array;
    offset: number;
    size: number;
};
export declare class UnityAnimatorTarget {
    readonly root: THREE.Object3D;
    private readonly renderedMeshes;
    private readonly nodeByPathCrc;
    private readonly properties;
    private readonly ordered;
    private bufferSize;
    constructor(root: THREE.Object3D, renderedMeshes: (node: THREE.Object3D) => THREE.Mesh[]);
    bindClip(clip: UnityClipData): void;
    get size(): number;
    propertyFor(path: number, typeID: number, attribute: number): BoundProperty | null;
    writeDefaults(out: Float64Array): void;
    defaultOf(p: BoundProperty, out: Float64Array, at: number): void;
    apply(values: Float64Array): void;
    get boundProperties(): readonly BoundProperty[];
}
export declare class UnityAnimatorEvaluator {
    readonly target: UnityAnimatorTarget;
    private readonly plans;
    private readonly samples;
    private result;
    private layerValue;
    private layerMask;
    private animatedMark;
    private readonly quaternion;
    constructor(target: UnityAnimatorTarget);
    private plan;
    private sample;
    evaluate(layers: readonly AnimationLayerMixerPlayable[]): void;
}
export declare class PlayableGraph {
    readonly outputs: AnimationLayerMixerPlayable[];
    private evaluator;
    private boundClips;
    playing: boolean;
    createOutput(source: AnimationLayerMixerPlayable): void;
    bind(target: UnityAnimatorTarget): void;
    get target(): UnityAnimatorTarget | null;
    private connectedClips;
    update(deltaTime: number): void;
}
export declare class PlayableBlender {
    readonly mixer: AnimationMixerPlayable;
    private currentIndex;
    private currentAnimationName;
    private prevIndex;
    private prevAnimationName;
    private blendTargetTime;
    private blendTime;
    private blendFadeOutTargetTime;
    private blendFadeOutTime;
    private blendForwardIndex;
    private blendForwardStartWeight;
    private readonly blendBackIndexs;
    private readonly blendBackStartWeight;
    private blendBackIndexCount;
    private blendWeight;
    private currentStatus;
    private nextUseInputIndex;
    private blendTimeScale;
    private animationLoopCount;
    private currentAnimationClipPlayable;
    speed: number;
    loopType: PlayableAnimatorLoopType;
    onAnimationFinished: ((name: string, loopCount: number) => void) | null;
    constructor(mixer: AnimationMixerPlayable, multiBlendingMax?: number);
    private setCurrentIndex;
    get currentAnimationClip(): UnityClipData | null;
    get curentAnimationName(): string;
    get previousAnimationName(): string | null;
    get currentTime(): number;
    set currentTime(time: number);
    get currentNormalizeTime(): number;
    set currentNormalizeTime(time: number);
    update(deltaTime: number): void;
    private timeUpdateDeltaTime;
    setBlendTimeScale(timeScale: number): void;
    private updateCommonProcess;
    private updateBlending;
    private updateOffBlending;
    private fitForwardTarget;
    private fitBackTarget;
    startOffBlend(blendTime: number): void;
    setSpeed(speed: number): void;
    startBlend(targetIndex: number, blendTime: number, blendFadeOutTime: number, animationName: string, loopType: PlayableAnimatorLoopType, startTime: number): void;
    startBlendRecycle(animation: AnimationClipPlayable, blendTime: number, blendFadeOutTime: number, animationName: string, loopType: PlayableAnimatorLoopType, startTime: number): void;
}
export declare class PlayableAnimator {
    readonly graph: PlayableGraph;
    private blenders;
    private layer;
    private readonly animationDictonary;
    private inputPlayableUseType;
    initialize(useLayerSize: number, inputPlayableUseType?: InputPlayableUseType, recycleSlot?: number): void;
    registerAnimationClip(layerIndex: number, clip: UnityClipData, animationName?: string, isAddMixer?: boolean): void;
    registerAnimationFinishCallBack(layerIndex: number, callback: (name: string, loopCount: number) => void): void;
    getAnimationTime(layerIndex: number): number;
    setAnimationTime(layerIndex: number, time: number): void;
    getAnimationNormalizeTime(layerIndex: number): number;
    setAnimationNormalizeTime(layerIndex: number, time: number): void;
    getCurrentAnimationName(layerIndex: number): string;
    getCurrentAnimationClip(layerIndex: number): UnityClipData | null;
    finalizeSetup(target: UnityAnimatorTarget, reSetup?: boolean): void;
    setLayerWeight(layerIndex: number, weight: number): void;
    getLayerWeight(layerIndex: number): number;
    changeAnimation(layerIndex: number, animationName: string, blendTime: number, loopType?: PlayableAnimatorLoopType, startTime?: number, isSameAnimationRewind?: boolean): PlayableBlender | null;
    changeAnimationOff(layerIndex: number, blendTime: number): PlayableBlender | null;
    existsAnimation(animationName: string): boolean;
    setSpeed(layerIndex: number, speed: number): void;
    update(deltaTime: number): void;
    blender(layerIndex: number): PlayableBlender;
}
export {};
