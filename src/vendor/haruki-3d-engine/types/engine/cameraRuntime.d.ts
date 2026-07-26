import * as THREE from "three";
export type PjskCameraPreset = "default" | "capture";
export type PjskCameraProfile = "official-default" | "full-body";
export type RuntimeCameraDebug = {
    preset: PjskCameraPreset;
    profile: PjskCameraProfile | null;
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
    characterHeight: number;
};
type HarukiCameraPose = {
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
export declare function getDefaultCameraPose(characterHeight: number): HarukiCameraPose;
export declare function getCostumeShopCameraPose(profile: PjskCameraProfile): HarukiCameraPose;
export declare function shiftCameraPoseRight(position: THREE.Vector3, target: THREE.Vector3, amount: number, characterHeight: number): {
    target: THREE.Vector3;
    position: THREE.Vector3;
};
export {};
