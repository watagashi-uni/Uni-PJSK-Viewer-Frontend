//#region src/materials/official/generated/Sekai_Live_Character_Eye-Base.json
var e = /*#__PURE__*/ JSON.parse("{\"040ced7866e5e5e16901217d26a1d07dbdf101c979dde1a2a5924755a7ca97c1\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\nuniform \\tmediump float _DitherAlpha;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int                _CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nUNITY_LOCATION(3) uniform mediump sampler2D _DitherTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp float vs_TEXCOORD2;\\nin highp vec4 vs_TEXCOORD3;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD7;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec2 u_xlat16_1;\\nvec3 u_xlat2;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nfloat u_xlat14;\\nbool u_xlatb21;\\nmediump float u_xlat16_24;\\nvoid main()\\n{\\n    u_xlat0.xy = vs_TEXCOORD7.xy / vs_TEXCOORD7.ww;\\n    u_xlat0.xy = u_xlat0.xy * _ScreenParams.xy;\\n    u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.25);\\n    u_xlat16_0.x = texture(_DitherTex, u_xlat0.xy, _GlobalMipBias.x).x;\\n    u_xlat16_1.x = (-u_xlat16_0.x) + _DitherAlpha;\\n    u_xlatb0.x = u_xlat16_1.x<0.0;\\n    if(u_xlatb0.x){discard;}\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat2.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat2.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat2.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_1.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_1.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat2.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat2.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat2.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlatb21 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb21){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat7.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat2.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat2.xyz = (-u_xlat16_6.xyz) * u_xlat2.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat2.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat7.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat2.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat2.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat7.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat7.x = float(1.0) / u_xlat7.x;\\n        u_xlat0.x = u_xlat7.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat7.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat14 = u_xlat0.x * u_xlat7.x;\\n        u_xlat0.x = (-u_xlat7.x) * u_xlat0.x + 1.0;\\n        u_xlat7.xyz = u_xlat16_4.xyz * vec3(u_xlat14);\\n        u_xlat7.xyz = u_xlat7.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat7.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_24 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_24 * _SekaiFogColor.w;\\n    u_xlat7.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat1.xyz = u_xlat0.xxx * u_xlat7.xyz + u_xlat16_3.xyz;\\n    u_xlat0.x = vs_TEXCOORD2 / vs_TEXCOORD3.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat7.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat7.x = u_xlat7.x + -1.0;\\n    u_xlat7.x = u_xlat7.x * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat7.x * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat7.x = u_xlat0.x;\\n    u_xlat7.x = clamp(u_xlat7.x, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat7.x;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * 0.5;\\n    SV_Target0 = u_xlat1;\\n    SV_Target1.x = u_xlat0.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int                _CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec4 vs_TEXCOORD7;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nint u_xlati1;\\nvec4 u_xlat2;\\nfloat u_xlat3;\\nfloat u_xlat6;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat1.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    u_xlat0.xyz = (-u_xlat1.yyy) * hlslcc_mtx4x4unity_WorldToObject[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_WorldToObject[0].xyz * u_xlat1.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_WorldToObject[2].xyz * u_xlat1.zzz + u_xlat0.xyz;\\n    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_WorldToObject[3].xyz;\\n    u_xlat1.xyz = u_xlat0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyw = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * u_xlat0.xxx + u_xlat1.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * u_xlat0.zzz + u_xlat0.xyw;\\n    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    u_xlati1 = (-_CharacterReflectionOff) + 1;\\n    u_xlat1.x = float(u_xlati1);\\n    u_xlat2 = u_xlat0 * u_xlat1.xxxx;\\n    u_xlat0.x = u_xlat1.x * u_xlat0.z + _ProjectionParams.y;\\n    gl_Position = u_xlat2;\\n    vs_TEXCOORD2 = u_xlat2.z;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat3 = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat0.x / u_xlat3;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat0.x;\\n    vs_TEXCOORD3 = u_xlat2;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    vs_TEXCOORD6 = 0.0;\\n    u_xlat0.x = u_xlat2.y * _ProjectionParams.x;\\n    u_xlat0.w = u_xlat0.x * 0.5;\\n    u_xlat0.xz = u_xlat2.xw * vec2(0.5, 0.5);\\n    vs_TEXCOORD7.zw = u_xlat2.zw;\\n    vs_TEXCOORD7.xy = u_xlat0.zz + u_xlat0.xw;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat3 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat3 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat6 = in_TEXCOORD0.y;\\n    u_xlat3 = u_xlat6 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat3 + _EyeFlipbookOffsetY;\\n    u_xlat3 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat3 = abs(u_xlat3) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat3 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"3d0dbd636943f2c7dc5321d29b02cd02499e663247c55967a6b5154b748117f9\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\nuniform \\tmediump float _DitherAlpha;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nUNITY_LOCATION(3) uniform mediump sampler2D _DitherTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp float vs_TEXCOORD2;\\nin highp vec4 vs_TEXCOORD3;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD7;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec2 u_xlat16_1;\\nvec3 u_xlat2;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nfloat u_xlat14;\\nbool u_xlatb21;\\nmediump float u_xlat16_24;\\nvoid main()\\n{\\n    u_xlat0.xy = vs_TEXCOORD7.xy / vs_TEXCOORD7.ww;\\n    u_xlat0.xy = u_xlat0.xy * _ScreenParams.xy;\\n    u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.25);\\n    u_xlat16_0.x = texture(_DitherTex, u_xlat0.xy, _GlobalMipBias.x).x;\\n    u_xlat16_1.x = (-u_xlat16_0.x) + _DitherAlpha;\\n    u_xlatb0.x = u_xlat16_1.x<0.0;\\n    if(u_xlatb0.x){discard;}\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat2.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat2.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat2.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_1.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_1.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat2.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat2.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat2.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlatb21 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb21){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat7.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat2.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat2.xyz = (-u_xlat16_6.xyz) * u_xlat2.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat2.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat7.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat2.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat2.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat7.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat7.x = float(1.0) / u_xlat7.x;\\n        u_xlat0.x = u_xlat7.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat7.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat14 = u_xlat0.x * u_xlat7.x;\\n        u_xlat0.x = (-u_xlat7.x) * u_xlat0.x + 1.0;\\n        u_xlat7.xyz = u_xlat16_4.xyz * vec3(u_xlat14);\\n        u_xlat7.xyz = u_xlat7.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat7.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_24 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_24 * _SekaiFogColor.w;\\n    u_xlat7.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat1.xyz = u_xlat0.xxx * u_xlat7.xyz + u_xlat16_3.xyz;\\n    u_xlat0.x = vs_TEXCOORD2 / vs_TEXCOORD3.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat7.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat7.x = u_xlat7.x + -1.0;\\n    u_xlat7.x = u_xlat7.x * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat7.x * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat7.x = u_xlat0.x;\\n    u_xlat7.x = clamp(u_xlat7.x, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat7.x;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * 0.5;\\n    SV_Target0 = u_xlat1;\\n    SV_Target1.x = u_xlat0.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec4 _MonitorObjectPositionArray[10];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec4 vs_TEXCOORD7;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nint u_xlati1;\\nvec4 u_xlat2;\\nvec4 u_xlat3;\\nfloat u_xlat4;\\nfloat u_xlat5;\\nfloat u_xlat8;\\nvoid main()\\n{\\n    u_xlat0.x = hlslcc_mtx4x4unity_ObjectToWorld[0].y;\\n    u_xlat0.y = hlslcc_mtx4x4unity_ObjectToWorld[1].y;\\n    u_xlat0.z = hlslcc_mtx4x4unity_ObjectToWorld[2].y;\\n    u_xlati1 = _CharacterId;\\n    u_xlat0.w = _MonitorObjectPositionArray[u_xlati1].y;\\n    u_xlat2.xyz = in_POSITION0.xyz;\\n    u_xlat2.w = 1.0;\\n    u_xlat0.x = dot(u_xlat0, u_xlat2);\\n    u_xlat0 = u_xlat0.xxxx * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat3.w = _MonitorObjectPositionArray[u_xlati1].x;\\n    u_xlat1.w = _MonitorObjectPositionArray[u_xlati1].z;\\n    u_xlat3.x = hlslcc_mtx4x4unity_ObjectToWorld[0].x;\\n    u_xlat3.y = hlslcc_mtx4x4unity_ObjectToWorld[1].x;\\n    u_xlat3.z = hlslcc_mtx4x4unity_ObjectToWorld[2].x;\\n    u_xlat3.x = dot(u_xlat3, u_xlat2);\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat3.xxxx + u_xlat0;\\n    u_xlat1.x = hlslcc_mtx4x4unity_ObjectToWorld[0].z;\\n    u_xlat1.y = hlslcc_mtx4x4unity_ObjectToWorld[1].z;\\n    u_xlat1.z = hlslcc_mtx4x4unity_ObjectToWorld[2].z;\\n    u_xlat1.x = dot(u_xlat1, u_xlat2);\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD2 = u_xlat0.z;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat1.x = u_xlat0.z + _ProjectionParams.y;\\n    u_xlat5 = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat1.x = u_xlat1.x / u_xlat5;\\n    u_xlat1.x = u_xlat1.x * _ProjectionParams.z;\\n    u_xlat1.x = max(u_xlat1.x, 0.0);\\n    u_xlat1.x = (-_SekaiFogFactor.y) * u_xlat1.x + _SekaiFogFactor.x;\\n    u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat1.x;\\n    vs_TEXCOORD3 = u_xlat0;\\n    u_xlat1.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat1.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat1.xyz;\\n    u_xlat1.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat1.xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat1.xyz;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    vs_TEXCOORD6 = 0.0;\\n    u_xlat0.y = u_xlat0.y * _ProjectionParams.x;\\n    u_xlat1.xzw = u_xlat0.xwy * vec3(0.5, 0.5, 0.5);\\n    vs_TEXCOORD7.zw = u_xlat0.zw;\\n    vs_TEXCOORD7.xy = u_xlat1.zz + u_xlat1.xw;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat4 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat4 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat8 = in_TEXCOORD0.y;\\n    u_xlat4 = u_xlat8 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat4 + _EyeFlipbookOffsetY;\\n    u_xlat4 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat4 = abs(u_xlat4) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat4 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"69e2f1309dbe264ae35f5709a3e767f418234e9badd5282d840bfd42acd80617\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int                _CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp float vs_TEXCOORD2;\\nin highp vec4 vs_TEXCOORD3;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nvec3 u_xlat8;\\nfloat u_xlat16;\\nbool u_xlatb24;\\nmediump float u_xlat16_27;\\nvoid main()\\n{\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat1.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat1.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat1.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_2.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_2.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat1.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat1.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlatb24 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb24){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat8.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat7.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat7.xyz = (-u_xlat16_6.xyz) * u_xlat7.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat7.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat8.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat7.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat7.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat8.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat8.x = float(1.0) / u_xlat8.x;\\n        u_xlat0.x = u_xlat8.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat8.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat16 = u_xlat0.x * u_xlat8.x;\\n        u_xlat0.x = (-u_xlat8.x) * u_xlat0.x + 1.0;\\n        u_xlat8.xyz = u_xlat16_4.xyz * vec3(u_xlat16);\\n        u_xlat8.xyz = u_xlat8.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat8.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_27 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_27 * _SekaiFogColor.w;\\n    u_xlat8.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat16_3.xyz;\\n    u_xlat0.x = vs_TEXCOORD2 / vs_TEXCOORD3.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat8.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat8.x = u_xlat8.x + -1.0;\\n    u_xlat8.x = u_xlat8.x * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat8.x * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat8.x = u_xlat0.x;\\n    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat8.x;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * 0.5;\\n    SV_Target0 = u_xlat1;\\n    SV_Target1.x = u_xlat0.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int                _CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nint u_xlati1;\\nvec4 u_xlat2;\\nfloat u_xlat3;\\nfloat u_xlat6;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat1.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    u_xlat0.xyz = (-u_xlat1.yyy) * hlslcc_mtx4x4unity_WorldToObject[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_WorldToObject[0].xyz * u_xlat1.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_WorldToObject[2].xyz * u_xlat1.zzz + u_xlat0.xyz;\\n    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_WorldToObject[3].xyz;\\n    u_xlat1.xyz = u_xlat0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyw = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * u_xlat0.xxx + u_xlat1.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * u_xlat0.zzz + u_xlat0.xyw;\\n    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    u_xlati1 = (-_CharacterReflectionOff) + 1;\\n    u_xlat1.x = float(u_xlati1);\\n    u_xlat2 = u_xlat0 * u_xlat1.xxxx;\\n    u_xlat0.x = u_xlat1.x * u_xlat0.z + _ProjectionParams.y;\\n    gl_Position = u_xlat2;\\n    vs_TEXCOORD2 = u_xlat2.z;\\n    vs_TEXCOORD3 = u_xlat2;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat3 = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat0.x / u_xlat3;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat0.x;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    vs_TEXCOORD6 = 0.0;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat3 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat3 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat6 = in_TEXCOORD0.y;\\n    u_xlat3 = u_xlat6 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat3 + _EyeFlipbookOffsetY;\\n    u_xlat3 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat3 = abs(u_xlat3) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat3 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"6f155a3589bd93f7fecf14fd678860a6d575d3e7b2072462fbdc3b6ceab6f32a\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp float vs_TEXCOORD2;\\nin highp vec4 vs_TEXCOORD3;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nvec3 u_xlat8;\\nfloat u_xlat16;\\nbool u_xlatb24;\\nmediump float u_xlat16_27;\\nvoid main()\\n{\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat1.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat1.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat1.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_2.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_2.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat1.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat1.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlatb24 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb24){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat8.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat7.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat7.xyz = (-u_xlat16_6.xyz) * u_xlat7.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat7.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat8.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat7.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat7.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat8.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat8.x = float(1.0) / u_xlat8.x;\\n        u_xlat0.x = u_xlat8.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat8.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat16 = u_xlat0.x * u_xlat8.x;\\n        u_xlat0.x = (-u_xlat8.x) * u_xlat0.x + 1.0;\\n        u_xlat8.xyz = u_xlat16_4.xyz * vec3(u_xlat16);\\n        u_xlat8.xyz = u_xlat8.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat8.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_27 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_27 * _SekaiFogColor.w;\\n    u_xlat8.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat16_3.xyz;\\n    u_xlat0.x = vs_TEXCOORD2 / vs_TEXCOORD3.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat8.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat8.x = u_xlat8.x + -1.0;\\n    u_xlat8.x = u_xlat8.x * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat8.x * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat8.x = u_xlat0.x;\\n    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat8.x;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * 0.5;\\n    SV_Target0 = u_xlat1;\\n    SV_Target1.x = u_xlat0.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec3 u_xlat1;\\nfloat u_xlat2;\\nfloat u_xlat4;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat1.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD2 = u_xlat0.z;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat1.x = u_xlat0.z + _ProjectionParams.y;\\n    vs_TEXCOORD3 = u_xlat0;\\n    u_xlat0.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat1.x / u_xlat0.x;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat0.x;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    vs_TEXCOORD6 = 0.0;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat2 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat2 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat4 = in_TEXCOORD0.y;\\n    u_xlat2 = u_xlat4 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat2 + _EyeFlipbookOffsetY;\\n    u_xlat2 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat2 = abs(u_xlat2) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat2 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"7cb9bbf02f4d4c5a52b95381fd61bd88ca56adbcff51bf61fee25d33dcae4b6e\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\nuniform \\tmediump float _DitherAlpha;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float                _EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3                _FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nUNITY_LOCATION(3) uniform mediump sampler2D _DitherTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin mediump float vs_TEXCOORD6;\\nin highp vec4 vs_TEXCOORD7;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec3 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nmediump vec4 u_xlat16_1;\\nvec3 u_xlat2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nfloat u_xlat14;\\nbool u_xlatb21;\\nmediump float u_xlat16_24;\\nvoid main()\\n{\\n    u_xlat0.xy = vs_TEXCOORD7.xy / vs_TEXCOORD7.ww;\\n    u_xlat0.xy = u_xlat0.xy * _ScreenParams.xy;\\n    u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.25);\\n    u_xlat16_0.x = texture(_DitherTex, u_xlat0.xy, _GlobalMipBias.x).x;\\n    u_xlat16_1.x = (-u_xlat16_0.x) + _DitherAlpha;\\n    u_xlatb0.x = u_xlat16_1.x<0.0;\\n    if(u_xlatb0.x){discard;}\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat2.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat2.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat2.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_1.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_1.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat2.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat2.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat2.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0.xyz = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x).xyz;\\n    u_xlat2.xyz = u_xlat16_0.xyz * _TintColor.xyz;\\n    u_xlatb21 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb21){\\n        u_xlat16_1 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_1.xyz;\\n        u_xlat16_3.xyz = u_xlat16_1.www * u_xlat16_3.xyz + u_xlat2.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat2.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat7.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat2.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat2.xyz = (-u_xlat16_6.xyz) * u_xlat2.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat2.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat7.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat2.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat2.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat7.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat7.x = float(1.0) / u_xlat7.x;\\n        u_xlat0.x = u_xlat7.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat7.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat14 = u_xlat0.x * u_xlat7.x;\\n        u_xlat0.x = (-u_xlat7.x) * u_xlat0.x + 1.0;\\n        u_xlat7.xyz = u_xlat16_4.xyz * vec3(u_xlat14);\\n        u_xlat7.xyz = u_xlat7.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat7.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_24 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_24 * _SekaiFogColor.w;\\n    u_xlat7.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat0.xyz = u_xlat0.xxx * u_xlat7.xyz + u_xlat16_3.xyz;\\n    SV_Target0.xyz = u_xlat0.xyz;\\n    SV_Target0.w = vs_TEXCOORD6;\\n    SV_Target1 = vec4(0.0, 0.0, 0.0, 0.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float                _EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3                _FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec4 vs_TEXCOORD7;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nmediump float u_xlat16_2;\\nfloat u_xlat3;\\nfloat u_xlat4;\\nmediump float u_xlat16_5;\\nfloat u_xlat6;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat1.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD2 = u_xlat0.z;\\n    u_xlat1.x = u_xlat0.z + _ProjectionParams.y;\\n    u_xlat4 = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat1.x = u_xlat1.x / u_xlat4;\\n    u_xlat1.x = u_xlat1.x * _ProjectionParams.z;\\n    u_xlat1.x = max(u_xlat1.x, 0.0);\\n    u_xlat1.x = (-_SekaiFogFactor.y) * u_xlat1.x + _SekaiFogFactor.x;\\n    u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat1.x;\\n    vs_TEXCOORD3 = u_xlat0;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    u_xlat1.x = hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat1.y = hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat1.z = hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat1.x = dot(u_xlat1.xyz, _FaceFront.xyz);\\n    u_xlat16_2 = u_xlat1.x + (-_EyelashFaceCameraEdge2);\\n    u_xlat16_5 = (-_EyelashFaceCameraEdge2) + _EyelashFaceCameraEdge1;\\n    u_xlat16_5 = float(1.0) / u_xlat16_5;\\n    u_xlat16_2 = u_xlat16_5 * u_xlat16_2;\\n    u_xlat16_2 = clamp(u_xlat16_2, 0.0, 1.0);\\n    u_xlat16_5 = u_xlat16_2 * -2.0 + 3.0;\\n    u_xlat16_2 = u_xlat16_2 * u_xlat16_2;\\n    u_xlat16_2 = u_xlat16_2 * u_xlat16_5;\\n    vs_TEXCOORD6 = u_xlat16_2 * _EyelashTransparent;\\n    u_xlat0.y = u_xlat0.y * _ProjectionParams.x;\\n    u_xlat1.xzw = u_xlat0.xwy * vec3(0.5, 0.5, 0.5);\\n    vs_TEXCOORD7.zw = u_xlat0.zw;\\n    vs_TEXCOORD7.xy = u_xlat1.zz + u_xlat1.xw;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat3 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat3 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat6 = in_TEXCOORD0.y;\\n    u_xlat3 = u_xlat6 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat3 + _EyeFlipbookOffsetY;\\n    u_xlat3 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat3 = abs(u_xlat3) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat3 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"7d29218544ef27548bb6d19606322114ef26b8a19357364ffcc1adaf84171127\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tfloat rp_GlobalIntensity;\\nuniform \\tmediump vec4 rp_CharacterAmbientLightColorArray[10];\\nuniform \\tfloat rp_CharacterAmbientLightIntensityArray[10];\\nuniform \\tfloat rp_CharacterAmbientLightBrightnessArray[10];\\nuniform \\tmediump vec4 rp_FogColor;\\nuniform \\tmediump vec4 rp_HeightFogColor;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tfloat _Emission;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_SheetValue;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4                _EmissionColor;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nin highp vec2 vs_TEXCOORD1;\\nin highp vec2 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nlayout(location = 0) out highp vec4 SV_Target0;\\nlayout(location = 1) out highp vec4 SV_Target1;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec3 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nvec3 u_xlat6;\\nvec3 u_xlat7;\\nvoid main()\\n{\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat1.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat1.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat1.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_2.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_2.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat1.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat1.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy + vs_TEXCOORD1.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlat16_2.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_2.xyz = u_xlat16_2.xyz + u_xlat16_2.xyz;\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat1.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_3.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_3.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_3.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_4.xyz = u_xlat1.xyz + u_xlat1.xyz;\\n    SV_Target0.w = u_xlat1.w;\\n    u_xlati0 = _CharacterId;\\n    u_xlat16_5.xyz = vec3(1.0, 1.0, 1.0) + (-rp_CharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat16_2.xyz = (-u_xlat16_2.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_2.xyz = (-u_xlat16_4.xyz) * rp_CharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat16_2.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * rp_CharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_2.xyz = u_xlat16_3.xyz * u_xlat16_2.xyz + u_xlat16_4.xyz;\\n    u_xlat7.xyz = u_xlat16_2.xyz * vec3(rp_CharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat1.xyz = rp_CharacterAmbientLightColorArray[u_xlati0].xyz * vec3(rp_CharacterAmbientLightBrightnessArray[u_xlati0]);\\n    u_xlat1.xyz = u_xlat1.xyz * vec3(rp_GlobalIntensity);\\n    u_xlat6.xyz = u_xlat7.xyz * vec3(rp_GlobalIntensity);\\n    u_xlat0.xyz = (-u_xlat7.xyz) * vec3(rp_GlobalIntensity) + rp_FogColor.xyz;\\n    u_xlat0.xyz = vs_TEXCOORD4.xxx * u_xlat0.xyz + u_xlat6.xyz;\\n    u_xlat6.xyz = (-u_xlat0.xyz) + rp_HeightFogColor.xyz;\\n    u_xlat0.xyz = vs_TEXCOORD4.yyy * u_xlat6.xyz + u_xlat0.xyz;\\n    u_xlat6.xyz = (-u_xlat0.xyz) + _EmissionColor.xyz;\\n    SV_Target0.xyz = vec3(vec3(_Emission, _Emission, _Emission)) * u_xlat6.xyz + u_xlat0.xyz;\\n    u_xlat1.w = rp_GlobalIntensity;\\n    u_xlat0 = u_xlat1 * vec4(0.200000003, 0.200000003, 0.200000003, 1.0);\\n    u_xlat1.xyz = _EmissionColor.xyz * vec3(0.200000003, 0.200000003, 0.200000003) + (-u_xlat0.xyz);\\n    SV_Target1.xyz = vec3(vec3(_Emission, _Emission, _Emission)) * u_xlat1.xyz + u_xlat0.xyz;\\n    SV_Target1.w = u_xlat0.w;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 rp_FogFactor;\\nuniform \\tmediump vec4 rp_FogColor;\\nuniform \\tvec2 rp_HeightFogFactor;\\nuniform \\tmediump vec4 rp_HeightFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_SheetValue;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4                _EmissionColor;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin mediump vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp vec4 vs_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout highp vec2 vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nout highp vec2 vs_TEXCOORD5;\\nvec4 u_xlat0;\\nbool u_xlatb0;\\nvec3 u_xlat1;\\nvec4 u_xlat2;\\nvec3 u_xlat3;\\nfloat u_xlat13;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1].yxyz;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0].yxyz * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2].yxyz * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat1.xyz = u_xlat0.yzw + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat2 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat2;\\n    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat2;\\n    u_xlat1.xyz = (-u_xlat1.xyz) + _WorldSpaceCameraPos.xyz;\\n    u_xlat2 = u_xlat2 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat2;\\n    u_xlat3.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat3.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat3.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat13 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat13 = max(u_xlat13, 1.17549435e-38);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    u_xlat3.xyz = vec3(u_xlat13) * u_xlat3.xyz;\\n    u_xlat13 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    vs_NORMAL0.xyz = vec3(u_xlat13) * u_xlat3.xyz;\\n    vs_TEXCOORD0 = u_xlat2;\\n    u_xlat13 = u_xlat2.z + _ProjectionParams.y;\\n    vs_COLOR0 = in_COLOR0;\\n    u_xlat2.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat13 = u_xlat13 / u_xlat2.x;\\n    u_xlat13 = u_xlat13 * _ProjectionParams.z;\\n    u_xlat13 = max(u_xlat13, 0.0);\\n    u_xlat13 = (-rp_FogFactor.xxxy.w) * u_xlat13 + rp_FogFactor.xxxy.z;\\n    u_xlat13 = clamp(u_xlat13, 0.0, 1.0);\\n    u_xlat13 = (-u_xlat13) + 1.0;\\n    vs_TEXCOORD4.x = u_xlat13 * rp_FogColor.w;\\n    u_xlat0.x = hlslcc_mtx4x4unity_ObjectToWorld[3].y * in_POSITION0.w + u_xlat0.x;\\n    vs_TEXCOORD3.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.yzw;\\n    u_xlat0.x = u_xlat0.x + (-rp_HeightFogFactor.x);\\n    u_xlat0.x = u_xlat0.x * rp_HeightFogFactor.y;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD4.y = u_xlat0.x * rp_HeightFogColor.w;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlatb0 = unity_OrthoParams.w==0.0;\\n    u_xlat2.x = (u_xlatb0) ? u_xlat1.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat2.y = (u_xlatb0) ? u_xlat1.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat2.z = (u_xlatb0) ? u_xlat1.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat0.x = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat0.x = inversesqrt(u_xlat0.x);\\n    vs_TEXCOORD2.xyz = u_xlat0.xxx * u_xlat2.xyz;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    return;\\n}\\n\\n\"},\"a253b21a8d5d9dcf45ad3f8a32e63c1cbe4a7cd9ee45e63305691e22af733369\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float                _EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3                _FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin mediump float vs_TEXCOORD6;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec3 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec3 u_xlat1;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nfloat u_xlat14;\\nbool u_xlatb21;\\nmediump float u_xlat16_24;\\nvoid main()\\n{\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat1.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat1.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat1.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_2.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_2.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat1.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat1.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0.xyz = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x).xyz;\\n    u_xlat1.xyz = u_xlat16_0.xyz * _TintColor.xyz;\\n    u_xlatb21 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb21){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat7.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat1.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat1.xyz = (-u_xlat16_6.xyz) * u_xlat1.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat1.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat7.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat1.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat1.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat7.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat7.x = float(1.0) / u_xlat7.x;\\n        u_xlat0.x = u_xlat7.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat7.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat14 = u_xlat0.x * u_xlat7.x;\\n        u_xlat0.x = (-u_xlat7.x) * u_xlat0.x + 1.0;\\n        u_xlat7.xyz = u_xlat16_4.xyz * vec3(u_xlat14);\\n        u_xlat7.xyz = u_xlat7.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat7.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_24 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_24 * _SekaiFogColor.w;\\n    u_xlat7.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat0.xyz = u_xlat0.xxx * u_xlat7.xyz + u_xlat16_3.xyz;\\n    SV_Target0.xyz = u_xlat0.xyz;\\n    SV_Target0.w = vs_TEXCOORD6;\\n    SV_Target1 = vec4(0.0, 0.0, 0.0, 0.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float                _EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float                _EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3                _FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec3 u_xlat1;\\nmediump float u_xlat16_2;\\nfloat u_xlat3;\\nmediump float u_xlat16_5;\\nfloat u_xlat6;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat1.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD2 = u_xlat0.z;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat1.x = u_xlat0.z + _ProjectionParams.y;\\n    vs_TEXCOORD3 = u_xlat0;\\n    u_xlat0.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat1.x / u_xlat0.x;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat0.x;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    u_xlat0.x = hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat0.y = hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat0.z = hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat0.x = dot(u_xlat0.xyz, _FaceFront.xyz);\\n    u_xlat16_2 = u_xlat0.x + (-_EyelashFaceCameraEdge2);\\n    u_xlat16_5 = (-_EyelashFaceCameraEdge2) + _EyelashFaceCameraEdge1;\\n    u_xlat16_5 = float(1.0) / u_xlat16_5;\\n    u_xlat16_2 = u_xlat16_5 * u_xlat16_2;\\n    u_xlat16_2 = clamp(u_xlat16_2, 0.0, 1.0);\\n    u_xlat16_5 = u_xlat16_2 * -2.0 + 3.0;\\n    u_xlat16_2 = u_xlat16_2 * u_xlat16_2;\\n    u_xlat16_2 = u_xlat16_2 * u_xlat16_5;\\n    vs_TEXCOORD6 = u_xlat16_2 * _EyelashTransparent;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat3 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat3 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat6 = in_TEXCOORD0.y;\\n    u_xlat3 = u_xlat6 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat3 + _EyeFlipbookOffsetY;\\n    u_xlat3 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat3 = abs(u_xlat3) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat3 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"c4589dd960f9264296db53fd510df9a0f11a06b5644ee08db02f61df7c6b1b1c\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\nuniform \\tmediump float _DitherAlpha;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nUNITY_LOCATION(3) uniform mediump sampler2D _DitherTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp float vs_TEXCOORD2;\\nin highp vec4 vs_TEXCOORD3;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD7;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec2 u_xlat16_1;\\nvec3 u_xlat2;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nfloat u_xlat14;\\nbool u_xlatb21;\\nmediump float u_xlat16_24;\\nvoid main()\\n{\\n    u_xlat0.xy = vs_TEXCOORD7.xy / vs_TEXCOORD7.ww;\\n    u_xlat0.xy = u_xlat0.xy * _ScreenParams.xy;\\n    u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.25);\\n    u_xlat16_0.x = texture(_DitherTex, u_xlat0.xy, _GlobalMipBias.x).x;\\n    u_xlat16_1.x = (-u_xlat16_0.x) + _DitherAlpha;\\n    u_xlatb0.x = u_xlat16_1.x<0.0;\\n    if(u_xlatb0.x){discard;}\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat2.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat2.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat2.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_1.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_1.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat2.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat2.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat2.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlatb21 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb21){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat7.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat2.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat2.xyz = (-u_xlat16_6.xyz) * u_xlat2.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat2.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat7.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat2.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat2.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat7.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat7.x = float(1.0) / u_xlat7.x;\\n        u_xlat0.x = u_xlat7.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat7.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat14 = u_xlat0.x * u_xlat7.x;\\n        u_xlat0.x = (-u_xlat7.x) * u_xlat0.x + 1.0;\\n        u_xlat7.xyz = u_xlat16_4.xyz * vec3(u_xlat14);\\n        u_xlat7.xyz = u_xlat7.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat7.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_24 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_24 * _SekaiFogColor.w;\\n    u_xlat7.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat1.xyz = u_xlat0.xxx * u_xlat7.xyz + u_xlat16_3.xyz;\\n    u_xlat0.x = vs_TEXCOORD2 / vs_TEXCOORD3.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat7.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat7.x = u_xlat7.x + -1.0;\\n    u_xlat7.x = u_xlat7.x * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat7.x * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat7.x = u_xlat0.x;\\n    u_xlat7.x = clamp(u_xlat7.x, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat7.x;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * 0.5;\\n    SV_Target0 = u_xlat1;\\n    SV_Target1.x = u_xlat0.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec4 vs_TEXCOORD7;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nfloat u_xlat2;\\nfloat u_xlat3;\\nfloat u_xlat4;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat1.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD2 = u_xlat0.z;\\n    u_xlat1.x = u_xlat0.z + _ProjectionParams.y;\\n    u_xlat3 = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat1.x = u_xlat1.x / u_xlat3;\\n    u_xlat1.x = u_xlat1.x * _ProjectionParams.z;\\n    u_xlat1.x = max(u_xlat1.x, 0.0);\\n    u_xlat1.x = (-_SekaiFogFactor.y) * u_xlat1.x + _SekaiFogFactor.x;\\n    u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat1.x;\\n    vs_TEXCOORD3 = u_xlat0;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    vs_TEXCOORD6 = 0.0;\\n    u_xlat0.y = u_xlat0.y * _ProjectionParams.x;\\n    u_xlat1.xzw = u_xlat0.xwy * vec3(0.5, 0.5, 0.5);\\n    vs_TEXCOORD7.zw = u_xlat0.zw;\\n    vs_TEXCOORD7.xy = u_xlat1.zz + u_xlat1.xw;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat2 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat2 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat4 = in_TEXCOORD0.y;\\n    u_xlat2 = u_xlat4 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat2 + _EyeFlipbookOffsetY;\\n    u_xlat2 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat2 = abs(u_xlat2) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat2 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"},\"c478af866667153f3279ee0763cf460aaa873a2ca9e950bcf627c0f96e3a1d02\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tfloat _SekaiGlobalEyeTime;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _DistortionTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _EyeFlipbookTex;\\nin highp vec2 vs_TEXCOORD0;\\nin mediump float vs_TEXCOORD1;\\nin highp float vs_TEXCOORD2;\\nin highp vec4 vs_TEXCOORD3;\\nin highp vec3 vs_TEXCOORD4;\\nin highp vec2 vs_TEXCOORD5;\\nin highp vec2 vs_TEXCOORD8;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nint u_xlati0;\\nbvec3 u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nvec3 u_xlat8;\\nfloat u_xlat16;\\nbool u_xlatb24;\\nmediump float u_xlat16_27;\\nvoid main()\\n{\\n    u_xlat0.x = _SekaiGlobalEyeTime * _DistortionFPS;\\n    u_xlat0.x = floor(u_xlat0.x);\\n    u_xlat0.x = u_xlat0.x / _DistortionFPS;\\n    u_xlat1.x = u_xlat0.x * _DistortionScrollX;\\n    u_xlat1.y = u_xlat0.x * _DistortionScrollY;\\n    u_xlat0.xy = (-u_xlat1.xy) * vec2(vec2(_DistortionScrollSpeed, _DistortionScrollSpeed)) + vs_TEXCOORD5.xy;\\n    u_xlat16_0.xy = texture(_DistortionTex, u_xlat0.xy).xy;\\n    u_xlat16_2.xy = u_xlat16_0.xy * vec2(2.0, 2.0) + vec2(-1.0, -1.0);\\n    u_xlat0.xy = u_xlat16_2.xy + vec2(_DistortionOffsetX, _DistortionOffsetY);\\n    u_xlat1.x = _DistortionIntensity * _DistortionIntensityX;\\n    u_xlat1.y = _DistortionIntensity * _DistortionIntensityY;\\n    u_xlat0.xy = u_xlat0.xy * u_xlat1.xy + vs_TEXCOORD0.xy;\\n    u_xlat16_0 = texture(_MainTex, u_xlat0.xy, _GlobalMipBias.x);\\n    u_xlat1 = u_xlat16_0 * _TintColor;\\n    u_xlatb24 = _EyeFlipbookEnabled>=0.5;\\n    if(u_xlatb24){\\n        u_xlat16_2 = texture(_EyeFlipbookTex, vs_TEXCOORD8.xy, _GlobalMipBias.x);\\n        u_xlat16_3.xyz = (-u_xlat16_0.xyz) * _TintColor.xyz + u_xlat16_2.xyz;\\n        u_xlat16_3.xyz = u_xlat16_2.www * u_xlat16_3.xyz + u_xlat1.xyz;\\n    } else {\\n        u_xlat16_3.xyz = u_xlat1.xyz;\\n    }\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlati0 = _CharacterId;\\n    u_xlat8.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz;\\n    u_xlat16_6.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlat7.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati0].xyz);\\n    u_xlat7.xyz = (-u_xlat16_6.xyz) * u_xlat7.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati0].xyz + u_xlat7.xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_5.xyz + u_xlat8.xyz;\\n    u_xlat0.xyz = u_xlat16_4.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati0]);\\n    u_xlat7.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_4.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat16_4.xyz + u_xlat16_4.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = (-u_xlat16_4.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat7.xyz * _PartsAmbientColor.xyz + (-u_xlat16_4.xyz);\\n    u_xlat16_4.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_4.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD4.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat8.x = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat8.x = float(1.0) / u_xlat8.x;\\n        u_xlat0.x = u_xlat8.x * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat8.x = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat16 = u_xlat0.x * u_xlat8.x;\\n        u_xlat0.x = (-u_xlat8.x) * u_xlat0.x + 1.0;\\n        u_xlat8.xyz = u_xlat16_4.xyz * vec3(u_xlat16);\\n        u_xlat8.xyz = u_xlat8.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat8.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_4.xyz;\\n    }\\n    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + u_xlat0.xyz;\\n    u_xlat16_3.xyz = vec3(_LightInfluence) * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlat16_27 = (-vs_TEXCOORD1) + 1.0;\\n    u_xlat0.x = u_xlat16_27 * _SekaiFogColor.w;\\n    u_xlat8.xyz = (-u_xlat16_3.xyz) + _SekaiFogColor.xyz;\\n    u_xlat1.xyz = u_xlat0.xxx * u_xlat8.xyz + u_xlat16_3.xyz;\\n    u_xlat0.x = vs_TEXCOORD2 / vs_TEXCOORD3.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat8.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat8.x = u_xlat8.x + -1.0;\\n    u_xlat8.x = u_xlat8.x * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat8.x * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat8.x = u_xlat0.x;\\n    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat8.x;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * 0.5;\\n    SV_Target0 = u_xlat1;\\n    SV_Target1.x = u_xlat0.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec4 _MonitorObjectPositionArray[10];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4                _EyeFlipbookTex_ST;\\n\\tUNITY_UNIFORM vec4                _SheetValue;\\n\\tUNITY_UNIFORM float                _EyeFlipbookCurrentFrame;\\n\\tUNITY_UNIFORM float                _EyeFlipbookEnabled;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetX;\\n\\tUNITY_UNIFORM float                _EyeFlipbookOffsetY;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Threshold;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_LightInfluenceForEyeHighlight;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_EmissionColor;\\n\\tUNITY_UNIFORM mediump float                _LightInfluence;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashTransparent;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge1;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_EyelashFaceCameraEdge2;\\n\\tUNITY_UNIFORM mediump vec4                _TintColor;\\n\\tUNITY_UNIFORM mediump vec3 Xhlslcc_UnusedX_FaceFront;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DistortionTex_ST;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingX;\\n\\tUNITY_UNIFORM float                _DistortionTexTilingY;\\n\\tUNITY_UNIFORM float                _DistortionIntensity;\\n\\tUNITY_UNIFORM float                _DistortionIntensityX;\\n\\tUNITY_UNIFORM float                _DistortionIntensityY;\\n\\tUNITY_UNIFORM float                _DistortionOffsetX;\\n\\tUNITY_UNIFORM float                _DistortionOffsetY;\\n\\tUNITY_UNIFORM float                _DistortionScrollX;\\n\\tUNITY_UNIFORM float                _DistortionScrollY;\\n\\tUNITY_UNIFORM float                _DistortionScrollSpeed;\\n\\tUNITY_UNIFORM float                _DistortionFPS;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec2 vs_TEXCOORD0;\\nout mediump float vs_TEXCOORD1;\\nout highp float vs_TEXCOORD2;\\nout highp vec4 vs_TEXCOORD3;\\nout highp vec3 vs_TEXCOORD4;\\nout highp vec2 vs_TEXCOORD5;\\nout mediump float vs_TEXCOORD6;\\nout highp vec2 vs_TEXCOORD8;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nint u_xlati1;\\nvec4 u_xlat2;\\nvec4 u_xlat3;\\nfloat u_xlat4;\\nfloat u_xlat8;\\nvoid main()\\n{\\n    u_xlat0.x = hlslcc_mtx4x4unity_ObjectToWorld[0].y;\\n    u_xlat0.y = hlslcc_mtx4x4unity_ObjectToWorld[1].y;\\n    u_xlat0.z = hlslcc_mtx4x4unity_ObjectToWorld[2].y;\\n    u_xlati1 = _CharacterId;\\n    u_xlat0.w = _MonitorObjectPositionArray[u_xlati1].y;\\n    u_xlat2.xyz = in_POSITION0.xyz;\\n    u_xlat2.w = 1.0;\\n    u_xlat0.x = dot(u_xlat0, u_xlat2);\\n    u_xlat0 = u_xlat0.xxxx * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat3.w = _MonitorObjectPositionArray[u_xlati1].x;\\n    u_xlat1.w = _MonitorObjectPositionArray[u_xlati1].z;\\n    u_xlat3.x = hlslcc_mtx4x4unity_ObjectToWorld[0].x;\\n    u_xlat3.y = hlslcc_mtx4x4unity_ObjectToWorld[1].x;\\n    u_xlat3.z = hlslcc_mtx4x4unity_ObjectToWorld[2].x;\\n    u_xlat3.x = dot(u_xlat3, u_xlat2);\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat3.xxxx + u_xlat0;\\n    u_xlat1.x = hlslcc_mtx4x4unity_ObjectToWorld[0].z;\\n    u_xlat1.y = hlslcc_mtx4x4unity_ObjectToWorld[1].z;\\n    u_xlat1.z = hlslcc_mtx4x4unity_ObjectToWorld[2].z;\\n    u_xlat1.x = dot(u_xlat1, u_xlat2);\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD2 = u_xlat0.z;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat1.x = u_xlat0.z + _ProjectionParams.y;\\n    vs_TEXCOORD3 = u_xlat0;\\n    u_xlat0.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat1.x / u_xlat0.x;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD1 = u_xlat0.x;\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    vs_TEXCOORD4.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;\\n    vs_TEXCOORD5.xy = in_TEXCOORD0.xy * vec2(_DistortionTexTilingX, _DistortionTexTilingY);\\n    vs_TEXCOORD6 = 0.0;\\n    u_xlat0.x = trunc(_EyeFlipbookCurrentFrame);\\n    u_xlat0.x = u_xlat0.x * _SheetValue.x;\\n    u_xlat4 = floor(u_xlat0.x);\\n    u_xlat0.y = u_xlat4 * _SheetValue.y;\\n    u_xlat0.xy = fract(u_xlat0.xy);\\n    u_xlat8 = in_TEXCOORD0.y;\\n    u_xlat4 = u_xlat8 * _SheetValue.y + (-u_xlat0.y);\\n    u_xlat1.y = u_xlat4 + _EyeFlipbookOffsetY;\\n    u_xlat4 = in_TEXCOORD0.x * 2.0 + -1.0;\\n    u_xlat4 = abs(u_xlat4) + _EyeFlipbookOffsetX;\\n    u_xlat1.x = u_xlat4 * _SheetValue.x + u_xlat0.x;\\n    vs_TEXCOORD8.xy = u_xlat1.xy * _EyeFlipbookTex_ST.xy + _EyeFlipbookTex_ST.zw;\\n    return;\\n}\\n\\n\"}}"), t = [
	{
		default: {
			dimension: 2,
			name: "white"
		},
		flags: 0,
		name: "_MainTex",
		type: 4
	},
	{
		default: 1,
		flags: 0,
		name: "_LightInfluence",
		type: 3
	},
	{
		default: {
			dimension: 2,
			name: "gray"
		},
		flags: 0,
		name: "_DistortionTex",
		type: 4
	},
	{
		default: 1,
		flags: 0,
		name: "_DistortionTexTilingX",
		type: 2
	},
	{
		default: 1,
		flags: 0,
		name: "_DistortionTexTilingY",
		type: 2
	},
	{
		default: 1,
		flags: 0,
		name: "_DistortionScrollSpeed",
		type: 2
	},
	{
		default: .5,
		flags: 0,
		name: "_DistortionScrollX",
		type: 2
	},
	{
		default: .5,
		flags: 0,
		name: "_DistortionScrollY",
		type: 2
	},
	{
		default: 12,
		flags: 0,
		name: "_DistortionFPS",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_DistortionIntensity",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_DistortionIntensityX",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_DistortionIntensityY",
		type: 2
	},
	{
		default: .57,
		flags: 0,
		name: "_DistortionOffsetX",
		type: 3
	},
	{
		default: .57,
		flags: 0,
		name: "_DistortionOffsetY",
		type: 3
	},
	{
		default: [
			1,
			1,
			1,
			1
		],
		flags: 1,
		name: "_PartsAmbientColor",
		type: 0
	},
	{
		default: 1,
		flags: 0,
		name: "_Stencil",
		type: 2
	},
	{
		default: 255,
		flags: 0,
		name: "_ReadMask",
		type: 2
	},
	{
		default: 255,
		flags: 0,
		name: "_WriteMask",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_StencilComp",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_StencilOp",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_StencilFail",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_StencilZFail",
		type: 2
	},
	{
		default: [
			0,
			0,
			1,
			0
		],
		flags: 0,
		name: "_FaceFront",
		type: 1
	},
	{
		default: 0,
		flags: 0,
		name: "_EyelashTransparent",
		type: 3
	},
	{
		default: .5,
		flags: 0,
		name: "_EyelashFaceCameraEdge1",
		type: 3
	},
	{
		default: 0,
		flags: 0,
		name: "_EyelashFaceCameraEdge2",
		type: 3
	},
	{
		default: 1,
		flags: 0,
		name: "_EyelashStencil",
		type: 2
	},
	{
		default: 255,
		flags: 0,
		name: "_EyelashReadMask",
		type: 2
	},
	{
		default: 255,
		flags: 0,
		name: "_EyelashWriteMask",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyelashStencilComp",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyelashStencilOp",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyelashStencilFail",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyelashStencilZFail",
		type: 2
	},
	{
		default: {
			dimension: 2,
			name: "black"
		},
		flags: 0,
		name: "_EyeFlipbookTex",
		type: 4
	},
	{
		default: [
			1,
			1,
			1,
			0
		],
		flags: 0,
		name: "_SheetValue",
		type: 1
	},
	{
		default: 0,
		flags: 0,
		name: "_EyeFlipbookCurrentFrame",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyeFlipbookEnabled",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyeFlipbookOffsetX",
		type: 2
	},
	{
		default: 0,
		flags: 0,
		name: "_EyeFlipbookOffsetY",
		type: 2
	},
	{
		default: [
			1,
			1,
			1,
			1
		],
		flags: 1,
		name: "_TintColor",
		type: 0
	},
	{
		default: 0,
		flags: 1,
		name: "_CharacterId",
		type: 2
	},
	{
		default: 0,
		flags: 1,
		name: "_CharacterReflectionOff",
		type: 2
	},
	{
		default: [
			0,
			0,
			0,
			1
		],
		flags: 1,
		name: "_EmissionColor",
		type: 0
	}
], n = "Sekai/Live/Character/Eye-Base", r = [{
	lod: 100,
	passes: [
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "Base",
			owner: "Sekai/Live/Character/Eye-Base",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 2
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: "_StencilFail",
						value: 0
					},
					pass: {
						property: "_StencilOp",
						value: 0
					},
					zFail: {
						property: "_StencilZFail",
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: "_ReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_WriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 4
				},
				zWrite: {
					property: null,
					value: 1
				}
			},
			tags: {
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "6f155a3589bd93f7fecf14fd678860a6d575d3e7b2072462fbdc3b6ceab6f32a",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "c4589dd960f9264296db53fd510df9a0f11a06b5644ee08db02f61df7c6b1b1c",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "Monitor",
			owner: "Sekai/Live/Character/Eye-Base",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 2
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: null,
					value: 255
				},
				stencilRef: {
					property: null,
					value: 0
				},
				stencilWriteMask: {
					property: null,
					value: 255
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 4
				},
				zWrite: {
					property: null,
					value: 1
				}
			},
			tags: {
				LIGHTMODE: "SekaiMonitor",
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "c478af866667153f3279ee0763cf460aaa873a2ca9e950bcf627c0f96e3a1d02",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "3d0dbd636943f2c7dc5321d29b02cd02499e663247c55967a6b5154b748117f9",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "Reflection",
			owner: "Sekai/Live/Character/Eye-Base",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 0
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: null,
					value: 255
				},
				stencilRef: {
					property: null,
					value: 0
				},
				stencilWriteMask: {
					property: null,
					value: 255
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 4
				},
				zWrite: {
					property: null,
					value: 1
				}
			},
			tags: {
				LIGHTMODE: "SekaiReflection",
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "69e2f1309dbe264ae35f5709a3e767f418234e9badd5282d840bfd42acd80617",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "040ced7866e5e5e16901217d26a1d07dbdf101c979dde1a2a5924755a7ca97c1",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "Eyelash",
			owner: "Sekai/Live/Character/Eye-Base",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 10
						},
						destBlendAlpha: {
							property: null,
							value: 1
						},
						srcBlend: {
							property: null,
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 0
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 0
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: "_EyelashStencilComp",
						value: 0
					},
					fail: {
						property: "_EyelashStencilFail",
						value: 0
					},
					pass: {
						property: "_EyelashStencilOp",
						value: 0
					},
					zFail: {
						property: "_EyelashStencilZFail",
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: "_EyelashReadMask",
					value: 0
				},
				stencilRef: {
					property: "_EyelashStencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_EyelashWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 8
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				LIGHTMODE: "SekaiEyelash",
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "a253b21a8d5d9dcf45ad3f8a32e63c1cbe4a7cd9ee45e63305691e22af733369",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "7cb9bbf02f4d4c5a52b95381fd61bd88ca56adbcff51bf61fee25d33dcae4b6e",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "EYEBASE-RP",
			owner: "Sekai/Live/Character/Eye-Base",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 2
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: null,
					value: 255
				},
				stencilRef: {
					property: null,
					value: 0
				},
				stencilWriteMask: {
					property: null,
					value: 255
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 4
				},
				zWrite: {
					property: null,
					value: 1
				}
			},
			tags: {
				LIGHTMODE: "SekaiBase",
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "7d29218544ef27548bb6d19606322114ef26b8a19357364ffcc1adaf84171127",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "EYEBASE-RP-OVER",
			owner: "Sekai/Live/Character/Eye-Base",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 2
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: null,
					value: 255
				},
				stencilRef: {
					property: null,
					value: 0
				},
				stencilWriteMask: {
					property: null,
					value: 255
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 4
				},
				zWrite: {
					property: null,
					value: 1
				}
			},
			tags: {
				LIGHTMODE: "SekaiBaseOver",
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "7d29218544ef27548bb6d19606322114ef26b8a19357364ffcc1adaf84171127",
				shaderRequirements: 33
			}]
		}
	],
	tags: {
		QUEUE: "Geometry",
		RenderType: "Opaque"
	}
}], i = {
	programs: e,
	properties: t,
	shader: n,
	subShaders: r
};
//#endregion
export { i as default, e as programs, t as properties, n as shader, r as subShaders };
