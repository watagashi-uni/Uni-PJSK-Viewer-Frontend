export type VirtualLiveRotation = {
    x: number;
    y: number;
    z: number;
    w: number;
};
/** Browser device orientation to Unity's left-handed camera quaternion. */
export declare function virtualLiveOrientationRotation(alpha: number, beta: number, gamma: number, screenAngle: number): VirtualLiveRotation;
/** Call from a user gesture on platforms that require sensor permission. */
export declare function listenVirtualLiveOrientation(emit: (rotation: VirtualLiveRotation) => void, signal?: AbortSignal): Promise<() => void>;
