import { type OriginalBundle } from "./unityBundle";
export declare const enum UnityBindingType {
    Transform = 4,
    SkinnedMeshRenderer = 137
}
export declare const enum UnityTransformAttribute {
    Position = 1,
    Rotation = 2,
    Scale = 3,
    EulerAngles = 4
}
export declare const UNITY_BLEND_SHAPE_CUSTOM_TYPE = 20;
export type UnityClipBinding = {
    path: number;
    attribute: number;
    typeID: number;
    customType: number;
    offset: number;
    dimension: number;
};
export type UnityClipData = {
    name: string;
    startTime: number;
    stopTime: number;
    isLooping: boolean;
    bindings: UnityClipBinding[];
    curveCount: number;
    streamed: {
        curveCount: number;
        keyStart: Uint32Array;
        keyTimes: Float32Array;
        keyCoefficients: Float32Array;
    };
    dense: {
        curveCount: number;
        frameCount: number;
        sampleRate: number;
        beginTime: number;
        samples: Float32Array;
    };
    constants: Float32Array;
};
type GenericBinding = {
    path: number;
    attribute: number;
    typeID: number;
    customType: number;
    isPPtrCurve: number;
    isIntCurve: number;
    isSerializeReferenceCurve: number;
};
type UnityAnimationClipObject = {
    m_Name: string;
    m_Legacy: boolean;
    m_Compressed: boolean;
    m_Events: unknown[];
    m_MuscleClip: {
        m_StartTime: number;
        m_StopTime: number;
        m_LoopTime: boolean;
        m_LoopBlend: boolean;
        m_Mirror: boolean;
        m_CycleOffset: number;
        m_Clip: {
            data: {
                m_StreamedClip: {
                    data: Uint32Array;
                    curveCount: number;
                    discreteCurveCount: number;
                };
                m_DenseClip: {
                    m_FrameCount: number;
                    m_CurveCount: number;
                    m_SampleRate: number;
                    m_BeginTime: number;
                    m_SampleArray: Float32Array;
                };
                m_ConstantClip: {
                    data: Float32Array;
                };
            };
        };
    };
    m_ClipBindingConstant: {
        genericBindings: GenericBinding[];
        pptrCurveMapping: unknown[];
    };
};
export declare function bindingDimension(typeID: number, attribute: number): 1 | 3 | 4;
export declare function decodeUnityClip(raw: UnityAnimationClipObject): UnityClipData;
export declare function loadBundleClip(bundle: OriginalBundle, clipName: string): UnityClipData | null;
export declare function unityClipLength(clip: UnityClipData): number;
export declare function sampleUnityClip(clip: UnityClipData, time: number, out: Float32Array): Float32Array<ArrayBufferLike>;
export declare function unityClipTransferables(clip: UnityClipData): ArrayBuffer[];
export {};
