import * as THREE from "three";
export declare enum UtjColliderStatus {
    NoCollision = 0,
    HeadIsEmbedded = 1,
    TailCollision = 2
}
export type UtjSpringBoneState = {
    currTipPos: THREE.Vector3;
    prevTipPos: THREE.Vector3;
    hitNormal: THREE.Vector3;
    cachedPosition: THREE.Vector3;
    cachedMovement: THREE.Vector3;
};
export type UtjSpringBoneUpdateInput = {
    headPosition: THREE.Vector3;
    parentRotation: THREE.Quaternion;
    initialLocalRotation: THREE.Quaternion;
    boneAxis: THREE.Vector3;
    lengthFallbackDirection?: THREE.Vector3;
    springLength: number;
    stiffnessForce: number;
    dragForce: number;
    springForce: THREE.Vector3;
    externalForce: THREE.Vector3;
    deltaTime: number;
};
export type UtjSpringBoneCollisionInput = {
    headPosition: THREE.Vector3;
    springLength: number;
    tailRadius: number;
    colliders: readonly UtjCollider[];
    bounce: number;
    friction: number;
    onColliderCheck?: (collider: UtjCollider, trace: UtjColliderCheckTrace) => void;
    onCollision?: (collider: UtjCollider, result: UtjCollisionResult) => void;
};
export type UtjGroundCollisionInput = {
    headPosition: THREE.Vector3;
    springLength: number;
    tailRadius: number;
    groundHeight: number;
    lengthFallbackDirection: THREE.Vector3;
    bounce: number;
    friction: number;
};
export type UtjSphereCollisionOptions = {
    headEmbeddedFallback?: false | THREE.Vector3;
    noIntersectionStatus?: UtjColliderStatus.NoCollision | UtjColliderStatus.TailCollision;
};
export type UtjSphereCollider = {
    kind: "sphere";
    enabled?: boolean;
    debugName?: string;
    debugPath?: string;
    debugSourcePathId?: number;
    radius: number;
    localOffset: THREE.Vector3;
    localToWorldMatrix: THREE.Matrix4;
    worldToLocalMatrix: THREE.Matrix4;
    worldToLocalRadiusScale: number;
    localToWorldNormalMatrix: THREE.Matrix4;
    lossyScaleX: number;
};
export type UtjCapsuleCollider = {
    kind: "capsule";
    enabled?: boolean;
    debugName?: string;
    debugPath?: string;
    debugSourcePathId?: number;
    start: THREE.Vector3;
    end: THREE.Vector3;
    radius: number;
};
export type UtjLocalCapsuleCollider = {
    kind: "capsuleLocal";
    enabled?: boolean;
    debugName?: string;
    debugPath?: string;
    debugSourcePathId?: number;
    localStart: THREE.Vector3;
    localEnd: THREE.Vector3;
    radius: number;
    localToWorldMatrix: THREE.Matrix4;
    worldToLocalMatrix: THREE.Matrix4;
    worldToLocalRadiusScale: number;
    localToWorldNormalMatrix: THREE.Matrix4;
    lossyScaleX: number;
};
export type UtjPanelCollider = {
    kind: "panel";
    enabled?: boolean;
    debugName?: string;
    debugPath?: string;
    debugSourcePathId?: number;
    width: number;
    height: number;
    localToWorldMatrix: THREE.Matrix4;
    worldToLocalMatrix: THREE.Matrix4;
    worldToLocalRadiusScale: number;
    worldToLocalLengthScale: number;
    localToWorldNormalMatrix: THREE.Matrix4;
};
export type UtjCollider = UtjSphereCollider | UtjCapsuleCollider | UtjLocalCapsuleCollider | UtjPanelCollider;
export type UtjCollisionResult = {
    status: UtjColliderStatus;
    tailPosition: THREE.Vector3;
    hitNormal: THREE.Vector3;
};
export type UtjColliderTraceDetails = {
    kind: UtjCollider["kind"];
    localHeadPosition?: THREE.Vector3;
    localTailPositionBefore?: THREE.Vector3;
    localTailPositionAfter?: THREE.Vector3;
    localTailRadius?: number;
    localSphereOrigin?: THREE.Vector3;
    localSphereRadius?: number;
    localCapsuleStart?: THREE.Vector3;
    localCapsuleEnd?: THREE.Vector3;
    capsuleRadius?: number;
    panelWidth?: number;
    panelHeight?: number;
};
export type UtjColliderCheckTrace = {
    status: UtjColliderStatus;
    beforeTailPosition: THREE.Vector3;
    afterTailPosition: THREE.Vector3;
    hitNormal: THREE.Vector3;
    details: UtjColliderTraceDetails;
};
export type UtjAngleLimit = {
    active: boolean;
    min: number;
    max: number;
};
export type UtjConstrainVectorInput = {
    basisSide: THREE.Vector3;
    basisUp: THREE.Vector3;
    basisForward: THREE.Vector3;
    springStrength: number;
    deltaTime: number;
    limit: UtjAngleLimit;
    vector: THREE.Vector3;
};
export type UtjLengthLimitTarget = {
    position: THREE.Vector3;
    initialLength: number;
};
export type UtjApplyLengthLimitsInput = {
    currTipPos: THREE.Vector3;
    springConstant: number;
    deltaTime: number;
    targets: readonly UtjLengthLimitTarget[];
};
export declare function createUtjSpringBoneState(headPosition: THREE.Vector3, tipPosition: THREE.Vector3): UtjSpringBoneState;
export declare function computeAnimatedTipPosition(input: Pick<UtjSpringBoneUpdateInput, "headPosition" | "parentRotation" | "initialLocalRotation" | "boneAxis" | "springLength">): THREE.Vector3;
export declare function updateUtjSpring(state: UtjSpringBoneState, input: UtjSpringBoneUpdateInput): void;
export declare function cacheUtjSpringBonePosition(state: UtjSpringBoneState, headPosition: THREE.Vector3): void;
export declare function enforceSpringLength(tailPosition: THREE.Vector3, headPosition: THREE.Vector3, springLength: number, fallbackDirection?: THREE.Vector3): void;
export declare function fixBoneLength(result: THREE.Vector3, headPosition: THREE.Vector3, tailPosition: THREE.Vector3, minLength: number, maxLength: number, fallbackDirection?: THREE.Vector3): void;
export declare function applyUtjLengthLimits(input: UtjApplyLengthLimitsInput): void;
export declare function checkUtjCollisions(state: UtjSpringBoneState, input: UtjSpringBoneCollisionInput): UtjColliderStatus;
export declare function checkUtjGroundCollision(state: UtjSpringBoneState, input: UtjGroundCollisionInput): boolean;
export declare function checkPanelCollisionAndReact(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, tailRadius: number, springLength: number, collider: UtjPanelCollider): UtjCollisionResult;
export declare function checkCollisionWithAlignedPlaneAndReact(localHeadPosition: THREE.Vector3, localLength: number, localTailPosition: THREE.Vector3, localTailRadius: number, upAxis: 0 | 1 | 2): UtjColliderStatus;
export declare function checkSphereCollisionAndReact(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, tailRadius: number, sphereCenter: THREE.Vector3, sphereRadius: number, headEmbeddedRadius?: number, options?: UtjSphereCollisionOptions): UtjCollisionResult;
export declare function checkLocalSphereCollisionAndReact(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, tailRadius: number, collider: UtjSphereCollider): UtjCollisionResult;
export declare function checkCapsuleCollisionAndReact(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, tailRadius: number, capsuleStart: THREE.Vector3, capsuleEnd: THREE.Vector3, capsuleRadius: number): UtjCollisionResult;
export declare function checkLocalCapsuleCollisionAndReact(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, tailRadius: number, collider: UtjLocalCapsuleCollider): UtjCollisionResult;
export declare function checkLocalYAxisCapsuleCollisionAndReact(localHeadPosition: THREE.Vector3, localTailPosition: THREE.Vector3, localTailRadius: number, localStart: THREE.Vector3, localEnd: THREE.Vector3, capsuleRadius: number, lossyScaleX?: number): UtjCollisionResult;
export declare function checkLocalCylinderCollisionAndReact(localHeadPosition: THREE.Vector3, localTailPosition: THREE.Vector3, localTailRadius: number, capsuleRadius: number, lossyScaleX?: number): UtjCollisionResult;
export type UtjSphereIntersectionCircle = {
    origin: THREE.Vector3;
    upVector: THREE.Vector3;
    radius: number;
};
export declare function computeSphereIntersectionCircle(originA: THREE.Vector3, radiusA: number, originB: THREE.Vector3, radiusB: number): UtjSphereIntersectionCircle | null;
export declare function computeNewTailPosition(intersection: UtjSphereIntersectionCircle, tailPosition: THREE.Vector3): THREE.Vector3;
export declare function applyUtjCollisionVelocityResponse(state: UtjSpringBoneState, hitNormal: THREE.Vector3, bounce: number, friction: number, preCollisionTip?: THREE.Vector3): void;
export declare function constrainUtjAngleLimit(input: UtjConstrainVectorInput): boolean;
export declare function computeUtjWorldRotation(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, parentRotation: THREE.Quaternion, initialLocalRotation: THREE.Quaternion, boneAxis: THREE.Vector3): THREE.Quaternion;
export declare function computeUtjLocalRotation(headPosition: THREE.Vector3, tailPosition: THREE.Vector3, parentRotation: THREE.Quaternion, initialLocalRotation: THREE.Quaternion, boneAxis: THREE.Vector3): THREE.Quaternion;
