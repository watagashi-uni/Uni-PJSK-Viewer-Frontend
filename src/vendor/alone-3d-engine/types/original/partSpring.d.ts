import { type OriginalBundle } from "./unityBundle";
import type { SerializedObject } from "./unityFile";
type Json = Record<string, unknown>;
type Vec3 = {
    x: number;
    y: number;
    z: number;
};
export declare function toRaw(value: unknown): unknown;
type ObjectRef = {
    fileId: number;
    pathId: number;
    name?: string | null;
    transformPath?: string | null;
    transformPathId?: number | null;
    activeSelf?: boolean | null;
    activeInHierarchy?: boolean | null;
};
export type SpringExport = ReturnType<typeof exportSpringBone>;
export declare function exportSpringBone(bundle: OriginalBundle, objects: SerializedObject[], partKind: string, bundlePath: string): {
    version: number;
    bundlePath: string;
    partKind: string;
    prefabGraph: {
        version: number;
        partKind: string;
        bundlePath: string;
        gameObjects: {
            pathId: number;
            name: string;
            activeSelf: boolean | null;
            activeInHierarchy: boolean | null;
            transformPathId: number | null;
            transformPath: string | null;
            componentPathIds: number[];
        }[];
        transforms: {
            pathId: number;
            gameObjectPathId: number | null;
            name: string | null;
            transformPath: string;
            poseRoot: string | null;
            parentPathId: number | null;
            childPathIds: number[];
            localPosition: {
                x: number;
                y: number;
                z: number;
            };
            localRotation: {
                x: number;
                y: number;
                z: number;
                w: number;
            };
            localScale: {
                x: number;
                y: number;
                z: number;
            };
        }[];
        renderers: {
            pathId: number;
            typeName: string;
            gameObjectPathId: number | null;
            transformPathId: number | null;
            name: string | null;
            transformPath: string | null;
            poseRoot: string | null;
            activeSelf: boolean | null;
            activeInHierarchy: boolean | null;
            enabled: boolean;
            meshPathId: number | null;
            meshName: string | null;
            skinnedMeshBones: number[];
            rootBonePathId: number | null;
            materialFileIds: number[];
            materialPathIds: number[];
        }[];
        animators: {
            pathId: number;
            gameObjectPathId: number | null;
            name: string | null;
            transformPath: string | null;
            poseRoot: string | null;
            enabled: boolean;
            hasTransformHierarchy: boolean;
            avatarPathId: number | null;
            controllerPathId: number | null;
        }[];
        monoBehaviours: {
            pathId: number;
            scriptName: string;
            gameObjectPathId: number | null;
            name: string | null;
            transformPath: string | null;
            poseRoot: string | null;
            enabled: boolean | null;
            objectReferenceFields: {
                fieldPath: string;
                references: {
                    fileId: number;
                    pathId: number;
                }[];
            }[];
        }[];
        constraints: {
            pathId: number;
            type: string;
            typeName: string;
            gameObjectPathId: number | null;
            ownerName: string | null;
            ownerPath: string | null;
            poseRoot: string | null;
            enabled: boolean | null;
            active: boolean | null;
            weight: number;
            locked: boolean | null;
            translationAxis: number | null;
            rotationAxis: number | null;
            translationAtRest: Vec3 | null;
            rotationAtRest: Vec3 | null;
            translationOffset: Vec3 | null;
            rotationOffset: Vec3 | null;
            aimVector: Vec3 | null;
            upVector: Vec3 | null;
            worldUpVector: Vec3 | null;
            worldUpType: number | null;
            worldUpObjectPathId: number | null;
            worldUpObjectName: string | null;
            worldUpObjectPath: string | null;
            sources: {
                sourcePathId: number | null;
                sourceName: string | null;
                sourcePath: string | null;
                weight: number;
                translationOffset: Vec3 | null;
                rotationOffset: Vec3 | null;
            }[];
            objectReferenceFields: {
                fieldPath: string;
                references: {
                    fileId: number;
                    pathId: number;
                }[];
            }[];
        }[];
        constraintCapability: {
            requestedTypes: string[];
            supportedTypes: string[];
            missingTypes: string[];
        };
        rootTransformPathIds: number[];
    };
    managers: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        raw: Json;
    }[];
    bones: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        pivotNode: ObjectRef | null;
        radius: number | null;
        stiffnessForce: number | null;
        dragForce: number | null;
        windInfluence: number | null;
        springForce: Vec3 | null;
        lengthLimitTargets: ObjectRef[];
        colliders: ObjectRef[];
        raw: Json;
    }[];
    sphereColliders: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        linkedRenderer: ObjectRef | null;
        linkedRendererEnabled: boolean | null;
        radius: number | null;
        height: number | null;
        center: Vec3 | null;
        direction: Vec3 | null;
        raw: Json;
    }[];
    capsuleColliders: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        linkedRenderer: ObjectRef | null;
        linkedRendererEnabled: boolean | null;
        radius: number | null;
        height: number | null;
        center: Vec3 | null;
        direction: Vec3 | null;
        raw: Json;
    }[];
    panelColliders: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        linkedRenderer: ObjectRef | null;
        linkedRendererEnabled: boolean | null;
        radius: number | null;
        height: number | null;
        center: Vec3 | null;
        direction: Vec3 | null;
        raw: Json;
    }[];
    forceProviders: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        raw: Json;
    }[];
    springBonePivots: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        raw: Json;
    }[];
    extraBones: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        referenceBone: ObjectRef | null;
        rotationOrder: number | null;
        coefficient: number | null;
        defaultEulerAngles: Vec3 | null;
        axisX: number | null;
        axisY: number | null;
        axisZ: number | null;
        raw: Json;
    }[];
    accessoryTransformAdjustments: AccessoryAdjustment[];
    funit: {
        present: boolean;
        scriptCount: number;
        springManagerCount: number;
        springBoneCount: number;
        sphereColliderCount: number;
        capsuleColliderCount: number;
        panelColliderCount: number;
        detectedScripts: string[];
        policy: string;
    };
    characterHair: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        headTransform: ObjectRef | null;
        offset: Vec3 | null;
        raw: Json;
    } | null;
    characterEye: {
        pathId: number;
        scriptName: string;
        gameObject: ObjectRef | null;
        lightInfluence: number | null;
        lightInfluenceForEyeHighlight: number | null;
        tintColor: {
            r: number;
            g: number;
            b: number;
            a: number;
        } | null;
        emissionColor: {
            r: number;
            g: number;
            b: number;
            a: number;
        } | null;
        baseTiling: {
            tileX: number;
            tileY: number;
            sample: number;
        } | null;
        highlightTiling: {
            tileX: number;
            tileY: number;
            sample: number;
        } | null;
        leftEyeCloseBlendShapeValue: number | null;
        rightEyeCloseBlendShapeValue: number | null;
        raw: Json;
    } | null;
    warnings: string[];
};
type AccessoryAdjustment = {
    faceId: string;
    position: Vec3;
    rotationEulerDegrees: Vec3;
    scale: Vec3;
};
export declare function buildPartSpringBone(partType: string, spring: SpringExport): {
    partKind: string;
    prefabGraph: {
        version: number;
        partKind: string;
        bundlePath: string;
        gameObjects: {
            pathId: number;
            name: string;
            activeSelf: boolean | null;
            activeInHierarchy: boolean | null;
            transformPathId: number | null;
            transformPath: string | null;
            componentPathIds: number[];
        }[];
        transforms: {
            pathId: number;
            gameObjectPathId: number | null;
            name: string | null;
            transformPath: string;
            poseRoot: string | null;
            parentPathId: number | null;
            childPathIds: number[];
            localPosition: {
                x: number;
                y: number;
                z: number;
            };
            localRotation: {
                x: number;
                y: number;
                z: number;
                w: number;
            };
            localScale: {
                x: number;
                y: number;
                z: number;
            };
        }[];
        renderers: {
            pathId: number;
            typeName: string;
            gameObjectPathId: number | null;
            transformPathId: number | null;
            name: string | null;
            transformPath: string | null;
            poseRoot: string | null;
            activeSelf: boolean | null;
            activeInHierarchy: boolean | null;
            enabled: boolean;
            meshPathId: number | null;
            meshName: string | null;
            skinnedMeshBones: number[];
            rootBonePathId: number | null;
            materialFileIds: number[];
            materialPathIds: number[];
        }[];
        animators: {
            pathId: number;
            gameObjectPathId: number | null;
            name: string | null;
            transformPath: string | null;
            poseRoot: string | null;
            enabled: boolean;
            hasTransformHierarchy: boolean;
            avatarPathId: number | null;
            controllerPathId: number | null;
        }[];
        monoBehaviours: {
            pathId: number;
            scriptName: string;
            gameObjectPathId: number | null;
            name: string | null;
            transformPath: string | null;
            poseRoot: string | null;
            enabled: boolean | null;
            objectReferenceFields: {
                fieldPath: string;
                references: {
                    fileId: number;
                    pathId: number;
                }[];
            }[];
        }[];
        constraints: {
            pathId: number;
            type: string;
            typeName: string;
            gameObjectPathId: number | null;
            ownerName: string | null;
            ownerPath: string | null;
            poseRoot: string | null;
            enabled: boolean | null;
            active: boolean | null;
            weight: number;
            locked: boolean | null;
            translationAxis: number | null;
            rotationAxis: number | null;
            translationAtRest: Vec3 | null;
            rotationAtRest: Vec3 | null;
            translationOffset: Vec3 | null;
            rotationOffset: Vec3 | null;
            aimVector: Vec3 | null;
            upVector: Vec3 | null;
            worldUpVector: Vec3 | null;
            worldUpType: number | null;
            worldUpObjectPathId: number | null;
            worldUpObjectName: string | null;
            worldUpObjectPath: string | null;
            sources: {
                sourcePathId: number | null;
                sourceName: string | null;
                sourcePath: string | null;
                weight: number;
                translationOffset: Vec3 | null;
                rotationOffset: Vec3 | null;
            }[];
            objectReferenceFields: {
                fieldPath: string;
                references: {
                    fileId: number;
                    pathId: number;
                }[];
            }[];
        }[];
        constraintCapability: {
            requestedTypes: string[];
            supportedTypes: string[];
            missingTypes: string[];
        };
        rootTransformPathIds: number[];
    };
    managers: {
        partKind: string;
        pathId: number;
        nodeName: string | null;
        nodePath: string | null;
        poseRoot: string | null;
        activeSelf: boolean | null;
        activeInHierarchy: boolean | null;
        enabled: boolean;
        automaticUpdates: boolean;
        enableLengthLimits: boolean;
        enableAngleLimits: boolean;
        enableCollision: boolean;
        collideWithGround: boolean;
        groundHeight: number;
        isSumOfForcesOnBone: boolean;
        isPaused: boolean;
        dynamicRatio: number;
        simulationFrameRate: number;
        slowMotionScale: number;
        bounce: number;
        friction: number;
        animatedBoneNames: string[];
        rawGravity: Vec3 | null;
        forceProviders: {
            sourcePathId: number;
            scriptName: string;
            nodeName: string | null;
            nodePath: string | null;
            activeSelf: boolean | null;
            activeInHierarchy: boolean | null;
            springManagerPathId: number;
            raw: Json;
        }[];
        bonePathIds: number[];
    }[];
    bones: {
        partKind: string;
        pathId: number;
        nodeName: string | null;
        nodePath: string | null;
        poseRoot: string | null;
        activeSelf: boolean | null;
        activeInHierarchy: boolean | null;
        enabled: boolean;
        pivotNodePath: string | null;
        pivotNodeName: string | null;
        pivotSourcePathId: number | null;
        hitRadius: number;
        stiffness: number;
        dragForce: number;
        gravityPower: number;
        gravityDir: number[];
        rawStiffnessForce: number | null;
        rawDragForce: number | null;
        rawSpringForce: Vec3 | null;
        rawWindInfluence: number | null;
        rawAngularStiffness: number | null;
        rawSpringConstant: number | null;
        lengthLimitTargets: {
            name: string | null;
            path: string | null;
            pathId: number;
        }[];
        rawAngleLimits: {
            y: {
                active: boolean;
                min: number | null;
                max: number | null;
            } | null;
            z: {
                active: boolean;
                min: number | null;
                max: number | null;
            } | null;
        };
        directColliderPathIds: number[];
        colliderFlag: number;
    }[];
    extraBones: {
        gameObject: {
            fileId: number;
            pathId: number;
            name?: string | null;
            transformPath?: string | null;
            transformPathId?: number | null;
            activeSelf?: boolean | null;
            activeInHierarchy?: boolean | null;
        } | null;
        referenceBone: {
            fileId: number;
            pathId: number;
            name?: string | null;
            transformPath?: string | null;
            transformPathId?: number | null;
            activeSelf?: boolean | null;
            activeInHierarchy?: boolean | null;
        } | null;
        pathId: number;
        scriptName: string;
        rotationOrder: number | null;
        coefficient: number | null;
        defaultEulerAngles: Vec3 | null;
        axisX: number | null;
        axisY: number | null;
        axisZ: number | null;
        raw: Json;
    }[];
    colliders: {
        partKind: unknown;
        index: unknown;
        pathId: unknown;
        scriptName: unknown;
        nodeName: unknown;
        nodePath: unknown;
        poseRoot: unknown;
        enabled: unknown;
        linkedRenderer: unknown;
        linkedRendererEnabled: unknown;
        shape: unknown;
    }[];
    colliderBindings: {
        sourceKind: string;
        partKind: unknown;
        sourceSpringBonePathId: unknown;
        colliderFlag: {} | null;
        matchedPrefixes: {} | null;
        collidersByRoot: {} | null;
        defaultRoot: {} | null;
        sourceColliderPathIds: unknown;
        colliders: unknown;
    }[];
    managerColliderCaches: {
        managerPathId: number;
        partKind: string;
        sourcePoseRoot: string | null;
        runtimeRoot: string;
        managerNodeName: string | null;
        managerNodePath: string | null;
        springBonePathIds: number[];
        sphereColliderIndexes: unknown[];
        capsuleColliderIndexes: unknown[];
        panelColliderIndexes: unknown[];
        reason: string;
    }[];
    activeRootProfile: {
        defaultBodyRoot: string;
        activeRoots: string[];
        inactiveRoots: string[];
    };
    funit: {
        present: boolean;
        scriptCount: number;
        springManagerCount: number;
        springBoneCount: number;
        sphereColliderCount: number;
        capsuleColliderCount: number;
        panelColliderCount: number;
        detectedScripts: string[];
        policy: string;
    };
    constraintSetup: {
        version: string;
        sourceKind: string;
        constraints: (Json & {
            status: string;
            type: string;
            ownerPath?: string;
            ownerName?: string;
            pathId: number;
            reason: string;
        })[];
        warnings: string[];
    };
    warnings: string[];
};
export declare function buildCharacterControllers(spring: SpringExport): Json;
export {};
