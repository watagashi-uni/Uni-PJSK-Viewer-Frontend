export type CharacterYawMode = "0" | "45" | "-45" | "90" | "-90" | "180";
export type SpringRuntimeMode = "off" | "unity-prefab";
export type EngineRenderState = {
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
export declare const characterYawDegreesByMode: Record<CharacterYawMode, number>;
export declare const defaultRenderState: EngineRenderState;
export declare const defaultAnimationState: EngineAnimationState;
