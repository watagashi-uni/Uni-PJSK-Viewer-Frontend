import * as THREE from "three";
export type PjskCameraPreset = "default" | "capture" | "costume-shop";
export type PjskCameraProfile = "official-default" | "full-body" | "legacy-cloud";
export type RuntimeCameraDebug = {
    preset: PjskCameraPreset;
    profile: PjskCameraProfile | null;
    characterRootYawDegrees: number;
    costumeShopState: {
        cameraRootYawDegrees: number;
        zoomValue: number;
        zoomMoveValue: number;
        zoomRatio: number;
        localCameraPosition: {
            x: number;
            y: number;
            z: number;
        };
        localCameraRotationYDegrees: number;
    } | null;
    position: {
        x: number;
        y: number;
        z: number;
    };
    target: {
        x: number;
        y: number;
        z: number;
    };
    offset: {
        x: number;
        y: number;
        z: number;
    };
    distance: number;
    polarDegrees: number;
    azimuthDegrees: number;
    fovDegrees: number;
    aspect: number;
    zoom: number;
    minPolarDegrees: number;
    maxPolarDegrees: number;
    masterCharacterHeightMeters: number;
    characterModelScaleMeters: number;
};
type CostumeShopCameraPose = {
    target: THREE.Vector3;
    position: THREE.Vector3;
    fov: number;
    costumeShopState: {
        cameraRootYawDegrees: number;
        zoomValue: number;
        zoomMoveValue: number;
        zoomRatio: number;
        localCameraPosition: THREE.Vector3;
        localCameraRotationYDegrees: number;
    } | null;
};
export declare function getDefaultCameraPose(characterModelScale: number): CostumeShopCameraPose;
export declare function getCostumeShopCameraPose(profile: PjskCameraProfile, cameraRootYawDegrees?: number, characterHeightMeters?: number): CostumeShopCameraPose;
export declare function shiftCameraPoseRight(position: THREE.Vector3, target: THREE.Vector3, amount: number, characterModelScale: number): {
    target: THREE.Vector3;
    position: THREE.Vector3;
};
export {};
