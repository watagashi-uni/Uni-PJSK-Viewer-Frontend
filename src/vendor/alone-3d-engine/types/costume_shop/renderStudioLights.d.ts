import { SekaiCharacterAmbientLight, SekaiCharacterRimLight, SekaiDirectionalLight, SekaiGlobalSettings, SekaiGlobalSpotLight, type UnityQuaternion, type UnityVector3 } from "../engine/official/sekaiLightComponents";
import { UnityShaderGlobals } from "../materials/official/unityShaderGlobals";
export declare const CHARACTER_LIGHT_CONSTANTS: {
    DIRECTIONAL_LIGHT_ROTATION: readonly [-15, 50, 0];
    CHARACTER_RIM_LIGHT_ROTATION: readonly [20, -60, 0];
    CHARACTER_RIM_LIGHT_COLOR: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    CHARACTER_RIM_LIGHT_RANGE: number;
    CHARACTER_AMBIENT_LIGHT_COLOR: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
};
export declare class CostumeShopRenderStudioLights {
    readonly globals: UnityShaderGlobals;
    readonly settings: SekaiGlobalSettings;
    readonly directional: SekaiDirectionalLight;
    readonly ambient: SekaiCharacterAmbientLight;
    readonly rim: SekaiCharacterRimLight;
    readonly spot: SekaiGlobalSpotLight;
    constructor(globals?: UnityShaderGlobals);
    setCameraRoot(rotation: UnityQuaternion, position: UnityVector3): void;
    setRenderCamera(localToWorld: readonly number[]): void;
    update(): void;
}
