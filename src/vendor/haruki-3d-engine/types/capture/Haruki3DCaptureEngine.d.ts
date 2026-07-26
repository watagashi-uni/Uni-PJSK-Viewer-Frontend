import type { PreviewLightState } from "../data/sampleScene";
import { Haruki3DEngine as Haruki3DEngineCore, type PjskEngineOptions } from "../engine/Haruki3DEngine";
import type { HarukiCaptureRolePartsRequest, HarukiPrepareCaptureFrameRequest } from "./captureTypes";
export type Haruki3DCaptureEngineOptions = PjskEngineOptions & {
    enableControls?: boolean;
};
/** @deprecated Prefer HarukiCaptureAdapter with Haruki3DEngineCore. */
export declare class Haruki3DEngine extends Haruki3DEngineCore {
    private readonly captureAdapter;
    constructor(containerOrOptions: HTMLElement | Haruki3DCaptureEngineOptions, initialLight?: PreviewLightState);
    captureRoleParts(request: HarukiCaptureRolePartsRequest): Promise<import("./captureTypes").HarukiCaptureRolePartsResult>;
    prepareCaptureFrame(request?: HarukiPrepareCaptureFrameRequest): Promise<void>;
}
export { Haruki3DEngineCore };
