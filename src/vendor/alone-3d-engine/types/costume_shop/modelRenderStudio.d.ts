export type PerspectiveCameraSettingData = {
    zoomDuration: number;
    bottomLowerLimitPosition: number;
    bottomUpperLimitPosition: number;
    topLowerLimitPosition: number;
    topUpperLimitPosition: number;
    nearZ: number;
    farZ: number;
    fov: number;
};
export declare const COSTUME_SHOP_CAMERA_SETTING: Readonly<PerspectiveCameraSettingData>;
export declare const MODEL_RENDER_STUDIO_CAMERA: {
    readonly localPosition: readonly [0, number, number];
    readonly localRotation: readonly [0, 1, 0, number];
    readonly nearClipPlane: number;
    readonly farClipPlane: 100;
    readonly textureWidth: 1024;
    readonly textureHeight: 1024;
};
type Vector3 = [number, number, number];
type Quaternion = [number, number, number, number];
export declare class ModelRenderStudioCamera {
    zoomValue: number;
    zoomMoveValue: number;
    moveValue: number;
    zoomDurationRatio: number;
    cameraSetting: Readonly<PerspectiveCameraSettingData> | null;
    fieldOfView: number;
    readonly cameraLocalPosition: Vector3;
    readonly cameraLocalRotation: Quaternion;
    cameraRootRotation: Quaternion;
    initialize(data: Readonly<PerspectiveCameraSettingData>): void;
    zoom(zoomValue: number, moveValue: number, isSetUp: boolean): void;
    calculateCameraZoom(moveValue: number, zoomValue: number): void;
    moveVertical(y: number): void;
    calculateCameraMovePosition(moveValue: number): void;
    rotate(x: number, _y: number, hasModel: boolean): void;
    cameraWorldPosition(): Vector3;
    cameraWorldRotation(): Quaternion;
    private requireSetting;
}
export {};
