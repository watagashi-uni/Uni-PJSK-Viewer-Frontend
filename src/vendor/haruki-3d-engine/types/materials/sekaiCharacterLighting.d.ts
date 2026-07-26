export type SekaiBaseShadowInput = {
    normalDotLight: number;
    valueB: number;
    useLambert: boolean;
    useValueTex: boolean;
    threshold: number;
    width: number;
    fadeMode: number;
};
export type SekaiFaceShadowInput = {
    sdf: number;
    mirroredSdf: number;
    headDotX: number;
    headDotY: number;
    useLimiter: boolean;
    rangeLimit: number;
    width: number;
    fadeMode: number;
};
export type SekaiSkinColorInput = {
    skinValue: number;
    globalShadow: readonly [number, number, number];
    defaultSkin: readonly [number, number, number];
    shadow1Skin: readonly [number, number, number];
    shadow2Skin: readonly [number, number, number];
};
export declare function evaluateSekaiBaseShadow(input: SekaiBaseShadowInput): {
    rawLight: number;
    shadow: number;
};
export declare function evaluateSekaiFaceShadow(input: SekaiFaceShadowInput): {
    sdf: number;
    threshold: number;
    shadow: number;
};
export declare function evaluateSekaiSkinColor(input: SekaiSkinColorInput): [number, number, number];
export declare const sekaiCharacterShadowFunctionsGlsl = "\nfloat sekaiSmooth01(float value) {\n  float x = clamp(value, 0.0, 1.0);\n  return x * x * (3.0 - 2.0 * x);\n}\n\nfloat sekaiBaseShadow(\n  float normalDotLight,\n  float valueB,\n  float useLambert,\n  float useValueTex,\n  float threshold,\n  float width,\n  float fadeMode\n) {\n  float halfLambert = normalDotLight * 0.5 + 0.5;\n  float baseLight = useLambert > 0.5 ? halfLambert : 1.0;\n  float selectedValueB = useValueTex > 0.5 ? valueB : 0.5;\n  float rawLight = clamp(baseLight + 2.0 * selectedValueB - 1.0, 0.0, 1.0);\n  float t = clamp(threshold, 0.0, 1.0);\n  float w = clamp(width, 0.0, 1.0);\n  float q = fadeMode < 0.5\n    ? clamp((rawLight - t * (1.0 - w)) / max(t * w, 0.00001), 0.0, 1.0)\n    : clamp((rawLight - t) / max((1.0 - t) * w, 0.00001), 0.0, 1.0);\n  return 1.0 - sekaiSmooth01(q);\n}\n\nfloat sekaiFaceShadow(\n  float sdf,\n  float threshold,\n  float width,\n  float fadeMode\n) {\n  float w = clamp(width, 0.0, 1.0);\n  float q = fadeMode < 0.5\n    ? clamp((threshold - sdf) / max((1.0 - sdf) * w, 0.00001), 0.0, 1.0)\n    : clamp((sdf - threshold) / max((1.0 - threshold) * w, 0.00001), 0.0, 1.0);\n  return fadeMode < 0.5 ? sekaiSmooth01(q) : 1.0 - sekaiSmooth01(q);\n}\n";
export declare const sekaiCharacterColorFunctionsGlsl = "\nvec3 sekaiApplyHsvc(\n  vec3 color,\n  float hueSin,\n  float hueCos,\n  float saturation,\n  float value,\n  float contrast\n) {\n  vec3 axis = vec3(0.577350259);\n  vec3 rotated =\n    color * hueCos +\n    cross(axis, color) * hueSin +\n    axis * dot(axis, color) * (1.0 - hueCos);\n  rotated =\n    (rotated - vec3(0.5)) * (contrast * 2.0) +\n    vec3(value * 2.0 - 0.5);\n  float luma = dot(rotated, vec3(0.22, 0.707, 0.071));\n  return (rotated - vec3(luma)) * (saturation * 2.0) + vec3(luma);\n}\n\nvec3 sekaiSkinRamp(\n  float skinValue,\n  vec3 globalShadow,\n  vec3 defaultSkin,\n  vec3 shadow1Skin,\n  vec3 shadow2Skin\n) {\n  vec3 mid = globalShadow * shadow1Skin;\n  vec3 dark = globalShadow * shadow2Skin;\n  vec3 upperBand = mix(mid, defaultSkin, clamp(skinValue * 2.0 - 1.0, 0.0, 1.0));\n  return mix(dark, upperBand, clamp(skinValue * 2.0, 0.0, 1.0));\n}\n\nvec3 sekaiOverlay(vec3 base, vec3 blend) {\n  vec3 multiplyBranch = 2.0 * base * blend;\n  vec3 screenBranch = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);\n  return mix(multiplyBranch, screenBranch, step(vec3(0.5), base));\n}\n\nvec3 sekaiApplyCharacterAmbient(\n  vec3 color,\n  vec3 ambientColor,\n  float ambientIntensity,\n  vec4 partsAmbientColor\n) {\n  vec3 overlaid = sekaiOverlay(color, ambientColor);\n  float intensity = ambientIntensity;\n  vec3 multiplied = overlaid * intensity * partsAmbientColor.rgb;\n  vec3 screened =\n    1.0 -\n    2.0 * (1.0 - overlaid * intensity) * (1.0 - partsAmbientColor.rgb);\n  return mix(screened, multiplied, clamp(partsAmbientColor.a, 0.0, 1.0));\n}\n\n";
