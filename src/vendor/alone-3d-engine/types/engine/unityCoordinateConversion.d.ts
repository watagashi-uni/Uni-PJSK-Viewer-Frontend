import * as THREE from "three";
/**
 * Coordinate contract for this engine.
 *
 * Unity-authored data enters the engine through a single mirror:
 *
 *   Unity / F5 / prefab local or world vector:  ( x, y, z )
 *   Engine / Three vector after import:        ( -x, y, z )
 *
 * Quaternions are mirrored by the matching basis change:
 *
 *   Unity quaternion:  ( x, y, z, w )
 *   Engine quaternion: ( x, -y, -z, w )
 *
 * Rules that keep the runtime sane:
 *
 * 1. Convert serialized Unity positions, directions, and rotations exactly once
 *    at the import boundary.
 * 2. After a Transform/Object3D exists in the engine scene, all runtime math is
 *    engine-space math. Do not convert live Three world/local positions again.
 * 3. When IDA/F5 names a Unity basis vector, such as QuaternionUtility.Left,
 *    convert that named Unity axis with convertUnityAxisToThree before using it
 *    with a Three matrix/quaternion.
 * 4. Never paste raw Unity basis literals like (-1, 0, 0) into runtime code
 *    unless the code is still explicitly operating in unconverted Unity space.
 * 5. AssetStudio ImportedModel geometry, bind matrices, morph deltas, and
 *    ImportedFrame rest transforms are already mirrored before export. Motion
 *    tracks are likewise normalized by Haruki-3D-Exporter. Do not pass either
 *    class of data through these helpers.
 *
 * The trap: Unity "Left" is local -X, but in this engine local -X is mirrored,
 * so Unity Left becomes engine +X. Hardcoding Three (-1, 0, 0) for an F5
 * "Left" silently flips SpringBone angle limits and makes whole cloth/hair
 * groups bend outward.
 */
export type UnityVectorLike = {
    x?: number;
    y?: number;
    z?: number;
    X?: number;
    Y?: number;
    Z?: number;
};
export type UnityQuaternionLike = {
    x?: number;
    y?: number;
    z?: number;
    w?: number;
    X?: number;
    Y?: number;
    Z?: number;
    W?: number;
};
export type UnityAxisName = "right" | "left" | "up" | "down" | "forward" | "back";
export declare function readUnityVector3(value: UnityVectorLike | undefined | null, fallback: THREE.Vector3): THREE.Vector3;
export declare function readUnityQuaternion(value: UnityQuaternionLike | undefined | null): THREE.Quaternion;
/** Match Transform.localRotation's SIMD normalization, including its two sum orders. */
export declare function normalizeUnityLocalQuaternion(q: THREE.Quaternion): THREE.Quaternion;
export declare function convertUnityPositionToThree(value: THREE.Vector3): THREE.Vector3;
export declare function convertUnityDirectionToThree(value: THREE.Vector3): THREE.Vector3;
export declare function convertUnityQuaternionToThree(value: THREE.Quaternion): THREE.Quaternion;
export declare function convertUnityAxisToThree(axis: UnityAxisName): THREE.Vector3;
/** Native rotation composition includes ancestor scale signs, without matrix decomposition. */
export declare function getUnityWorldQuaternion(node: THREE.Object3D | null, target: THREE.Quaternion): THREE.Quaternion;
/** Unity Transform.position evaluates the local TRS chain in float32. */
export declare function getUnityWorldPosition(node: THREE.Object3D, target: THREE.Vector3): THREE.Vector3;
export declare function inverseUnityTransformPoint(node: THREE.Object3D, point: THREE.Vector3): THREE.Vector3;
/** Already-imported direction follows Unity world orientation without scale magnitudes. */
export declare function transformUnityDirectionToWorld(node: THREE.Object3D, direction: THREE.Vector3): THREE.Vector3;
export declare function rotateUnityVectorFloat32(v: THREE.Vector3, q: THREE.Quaternion): THREE.Vector3;
export declare function lerpUnityQuaternionFloat32(from: THREE.Quaternion, to: THREE.Quaternion, t: number): THREE.Quaternion;
