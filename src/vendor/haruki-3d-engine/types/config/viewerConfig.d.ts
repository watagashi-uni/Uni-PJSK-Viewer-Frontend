import type { HairShadowMode } from "../engine/Haruki3DEngine";
export type ToonShadowSmoothMode = "auto" | "hard" | "w003" | "w005" | "w008" | "w012";
export type ValueShadowInfluenceMode = "0" | "0.25" | "0.5" | "1";
export type CharacterYawMode = "0" | "45" | "-45" | "90" | "-90" | "180";
export type SpringRuntimeMode = "off" | "unity-prefab";
export type EngineRenderState = {
    hairShadowMode: HairShadowMode;
    toonShadowSmoothMode: ToonShadowSmoothMode;
    valueShadowInfluenceMode: ValueShadowInfluenceMode;
    characterYawMode: CharacterYawMode;
    faceMotionEnabled: boolean;
    bodyHeadTracksEnabled: boolean;
    springRuntimeMode: SpringRuntimeMode;
};
export type EngineAnimationState = {
    selectedMotionUrl: string;
    selectedLoopUrl: string;
    speed: number;
    paused: boolean;
    seekTime: number;
};
export type ViewerRenderState = EngineRenderState;
export type ViewerAnimationState = EngineAnimationState;
export declare const toonShadowSmoothByMode: Record<ToonShadowSmoothMode, number | null>;
export declare const valueShadowInfluenceByMode: Record<ValueShadowInfluenceMode, number>;
export declare const characterYawDegreesByMode: Record<CharacterYawMode, number>;
export declare const defaultRenderState: EngineRenderState;
export declare const defaultAnimationState: EngineAnimationState;
