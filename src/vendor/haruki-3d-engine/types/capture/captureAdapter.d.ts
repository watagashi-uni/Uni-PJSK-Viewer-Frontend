import type { Haruki3DEngine } from "../engine/Haruki3DEngine";
import type { HarukiCaptureRolePartsRequest, HarukiCaptureRolePartsResult, HarukiPrepareCaptureFrameRequest } from "./captureTypes";
export declare class HarukiCaptureAdapter {
    private readonly engine;
    private queue;
    constructor(engine: Haruki3DEngine);
    captureRoleParts(request: HarukiCaptureRolePartsRequest): Promise<HarukiCaptureRolePartsResult>;
    private captureRolePartsInternal;
    prepareCaptureFrame(request?: HarukiPrepareCaptureFrameRequest): Promise<void>;
}
