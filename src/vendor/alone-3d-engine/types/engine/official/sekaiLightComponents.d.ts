import type { UnityShaderGlobals } from "../../materials/official/unityShaderGlobals";
export type UnityQuaternion = readonly [number, number, number, number];
export type UnityVector3 = readonly [number, number, number];
export type UnityColor = {
    r: number;
    g: number;
    b: number;
    a: number;
};
export declare function unityQuaternionEuler(x: number, y: number, z: number): UnityQuaternion;
export declare function unityQuaternionMultiply(a: UnityQuaternion, b: UnityQuaternion): UnityQuaternion;
export declare function unityRotate(q: UnityQuaternion, v: UnityVector3): UnityVector3;
export declare function unityForward(q: UnityQuaternion): UnityVector3;
export declare function unityGammaToLinearSpace(value: number): number;
export declare class UnityLightTransform {
    localRotation: UnityQuaternion;
    parentRotation: UnityQuaternion;
    position: UnityVector3;
    get rotation(): UnityQuaternion;
    get forward(): UnityVector3;
    setLocalEulerAngles(x: number, y: number, z: number): void;
}
export declare class SekaiGlobalSettings {
    fogColor: UnityColor;
    fogStart: number;
    fogEnd: number;
    intensity: number;
    quality: number;
    update(globals: UnityShaderGlobals): void;
}
export declare class SekaiCharacterDirectionalLight {
    useFaceShadowLimiter: boolean;
    faceShadowLimitRange: number;
    shadowTexWeight: number;
    useShadowFade: boolean;
    fade: number;
    shadowWidth: number;
    useHsvControl: boolean;
    hue: number;
    saturation: number;
    value: number;
    contrast: number;
    initialize(): void;
}
export declare class SekaiDirectionalLight {
    readonly transform: UnityLightTransform;
    readonly characterDirectionalLightData: SekaiCharacterDirectionalLight;
    shadowColor: UnityColor;
    shadowThreshold: number;
    start(): void;
    update(globals: UnityShaderGlobals): void;
}
type Vec4 = [number, number, number, number];
export declare class SekaiCharacterAmbientLight {
    static readonly intensityArray: number[];
    static readonly colorArray: Vec4[];
    static readonly specularColorArray: Vec4[];
    static readonly outlineColorArray: Vec4[];
    static readonly outlineBlendingArray: number[];
    ambientColor: UnityColor;
    intensity: number;
    specularColor: UnityColor;
    outlineColor: UnityColor;
    outlineBlending: number;
    formationId: number;
    update(globals: UnityShaderGlobals): void;
}
export declare class SekaiCharacterRimLight {
    static readonly lightArray: Vec4[];
    static readonly colorArray: Vec4[];
    static readonly shadowColorArray: Vec4[];
    static readonly factorArray: Vec4[];
    static readonly shadowSharpnessArray: number[];
    readonly transform: UnityLightTransform;
    rimColor: UnityColor;
    range: number;
    edgeSmoothness: number;
    emission: number;
    directionMode: 0 | 1;
    rimDirectionVector: UnityVector3;
    lightInfluence: number;
    isUseShadowColor: boolean;
    shadowRimColor: UnityColor;
    shadowSharpness: number;
    formationId: number;
    mainCameraLocalToWorld: readonly number[] | null;
    setup(formationId: number, mainCameraLocalToWorld: readonly number[] | null, range: number): void;
    private getRimLightDirection;
    update(globals: UnityShaderGlobals): void;
}
export declare class SekaiGlobalSpotLight {
    readonly transform: UnityLightTransform;
    outerColor: UnityColor;
    radiusNear: number;
    radiusFar: number;
    update(globals: UnityShaderGlobals): void;
}
export {};
