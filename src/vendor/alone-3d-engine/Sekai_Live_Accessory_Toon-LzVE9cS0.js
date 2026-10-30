//#region src/materials/official/generated/Sekai_Live_Accessory_Toon.json
var e = /*#__PURE__*/ JSON.parse("{\"04766c006846d2f2a4054d3ded16d1b78f84b783052ed2292e5c65364c7765e7\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _SekaiDirectionalLight;\\nuniform \\tmediump vec4 _SekaiShadowColor;\\nuniform \\tmediump float _SekaiShadowThreshold;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec4 _SekaiRimLightArray[12];\\nuniform \\tvec4 _SekaiRimLightColorArray[12];\\nuniform \\tvec4 _SekaiShadowRimLightColorArray[12];\\nuniform \\tmediump vec4 _SekaiRimLightFactor[12];\\nuniform \\tmediump float _SekaiRimLightShadowSharpnessArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float                _IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _ShadowTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _ValueTex;\\nin highp vec3 vs_NORMAL0;\\nin highp float vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD0;\\nin highp vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD1;\\nin mediump float vs_TEXCOORD4;\\nin highp vec3 vs_TEXCOORD2;\\nin highp vec3 vs_TEXCOORD3;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nmediump vec4 u_xlat16_0;\\nvec3 u_xlat1;\\nmediump vec3 u_xlat16_1;\\nint u_xlati1;\\nvec4 u_xlat2;\\nmediump vec3 u_xlat16_2;\\nmediump vec4 u_xlat16_3;\\nvec3 u_xlat4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nvec3 u_xlat9;\\nbvec3 u_xlatb9;\\nmediump float u_xlat16_11;\\nvec3 u_xlat12;\\nmediump vec3 u_xlat16_13;\\nfloat u_xlat17;\\nfloat u_xlat18;\\nint u_xlati18;\\nmediump float u_xlat16_19;\\nfloat u_xlat25;\\nbool u_xlatb25;\\nfloat u_xlat26;\\nint u_xlati26;\\nmediump float u_xlat16_27;\\nvoid main()\\n{\\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlat16_1.xyz = texture(_ShadowTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat1.xyz = (-u_xlat16_0.xyz) + u_xlat16_1.xyz;\\n    u_xlat25 = u_xlat1.x * _ShadowTexWeight;\\n    u_xlat1.xyz = vec3(_ShadowTexWeight) * u_xlat1.xyz + u_xlat16_0.xyz;\\n    u_xlat16_2.xyz = texture(_ValueTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat16_3.x = u_xlat16_2.z * 2.0 + -1.0;\\n    u_xlat16_11 = _Saturation + _Saturation;\\n    u_xlat16_19 = _Value * 2.0 + -1.0;\\n    u_xlat16_27 = _Contrast + _Contrast;\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_0.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat18 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_0.xyz);\\n    u_xlat18 = u_xlat18 * 0.57735002;\\n    u_xlat16_5.x = (-_HueCosAngle) + 1.0;\\n    u_xlat4.xyz = vec3(u_xlat18) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_13.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz * vec3(u_xlat16_27) + vec3(u_xlat16_19);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_6.x = dot(u_xlat16_13.xyz, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + (-u_xlat16_6.xxx);\\n    u_xlat16_13.xyz = vec3(u_xlat16_11) * u_xlat16_13.xyz + u_xlat16_6.xxx;\\n    u_xlat18 = dot(_SekaiDirectionalLight.xyz, vs_NORMAL0.xyz);\\n    u_xlat18 = u_xlat18 * 0.5 + 0.5;\\n    switch(_FadeMode){\\n        case 0:\\n            u_xlat4.x = _ShadowWidth * (-_SekaiShadowThreshold) + _SekaiShadowThreshold;\\n            u_xlat12.x = u_xlat16_3.x + u_xlat18;\\n            u_xlat12.x = clamp(u_xlat12.x, 0.0, 1.0);\\n            u_xlat12.x = (-u_xlat4.x) + u_xlat12.x;\\n            u_xlat4.x = (-u_xlat4.x) + _SekaiShadowThreshold;\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat4.x = u_xlat12.x / u_xlat4.x;\\n            u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n            u_xlat12.x = u_xlat4.x * u_xlat4.x;\\n            u_xlat4.x = (-u_xlat4.x) * 2.0 + 3.0;\\n            u_xlat26 = (-u_xlat12.x) * u_xlat4.x + 1.0;\\n            break;\\n        case 1:\\n            u_xlat4.x = (-_SekaiShadowThreshold) + 1.0;\\n            u_xlat4.x = u_xlat4.x * _ShadowWidth;\\n            u_xlat18 = u_xlat16_3.x + u_xlat18;\\n            u_xlat18 = clamp(u_xlat18, 0.0, 1.0);\\n            u_xlat18 = u_xlat18 + (-_SekaiShadowThreshold);\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat18 = u_xlat18 / u_xlat4.x;\\n            u_xlat18 = clamp(u_xlat18, 0.0, 1.0);\\n            u_xlat4.x = u_xlat18 * u_xlat18;\\n            u_xlat18 = (-u_xlat18) * 2.0 + 3.0;\\n            u_xlat26 = (-u_xlat4.x) * u_xlat18 + 1.0;\\n            break;\\n        default:\\n            break;\\n    }\\n    u_xlat1.xyz = u_xlat1.xyz * _SekaiShadowColor.xyz + (-u_xlat16_13.xyz);\\n    u_xlat1.xyz = vec3(u_xlat26) * u_xlat1.xyz + u_xlat16_13.xyz;\\n    u_xlat25 = u_xlat26 * u_xlat25 + u_xlat16_0.x;\\n    u_xlat4.xyz = _SekaiShadowColor.xyz * _Shadow1SkinColor.xyz;\\n    u_xlat7.xyz = _SekaiShadowColor.xyz * _Shadow2SkinColor.xyz;\\n    u_xlat16_3.x = u_xlat25 + u_xlat25;\\n    u_xlat16_13.x = u_xlat25 * 2.0 + -1.0;\\n    u_xlat16_13.x = clamp(u_xlat16_13.x, 0.0, 1.0);\\n    u_xlat16_6.xyz = (-_Shadow1SkinColor.xyz) * _SekaiShadowColor.xyz + _DefaultSkinColor.xyz;\\n    u_xlat16_13.xyz = u_xlat16_13.xxx * u_xlat16_6.xyz + u_xlat4.xyz;\\n    u_xlat16_3.x = u_xlat16_3.x;\\n    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);\\n    u_xlat16_13.xyz = (-_Shadow2SkinColor.xyz) * _SekaiShadowColor.xyz + u_xlat16_13.xyz;\\n    u_xlat16_13.xyz = u_xlat16_3.xxx * u_xlat16_13.xyz + u_xlat7.xyz;\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_13.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat25 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_13.xyz);\\n    u_xlat25 = u_xlat25 * 0.57735002;\\n    u_xlat4.xyz = vec3(u_xlat25) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_5.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_3.xzw = u_xlat16_5.xyz * vec3(u_xlat16_27) + vec3(u_xlat16_19);\\n    u_xlat16_3.xzw = u_xlat16_3.xzw + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_5.x = dot(u_xlat16_3.xzw, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_3.xzw = u_xlat16_3.xzw + (-u_xlat16_5.xxx);\\n    u_xlat16_3.xyz = vec3(u_xlat16_11) * u_xlat16_3.xzw + u_xlat16_5.xxx;\\n    u_xlatb25 = u_xlat16_2.x>=0.5;\\n    u_xlat16_27 = (u_xlatb25) ? 1.0 : 0.0;\\n    u_xlat16_3.xyz = (-u_xlat1.xyz) + u_xlat16_3.xyz;\\n    u_xlat16_3.xyz = vec3(u_xlat16_27) * u_xlat16_3.xyz + u_xlat1.xyz;\\n    u_xlati1 = _CharacterId;\\n    u_xlat9.xyz = _SekaiRimLightColorArray[u_xlati1].www * _SekaiRimLightColorArray[u_xlati1].xyz;\\n    u_xlat2.x = dot(vs_NORMAL0.xyz, vs_TEXCOORD2.xyz);\\n    u_xlat2.z = dot(vs_TEXCOORD2.xyz, _SekaiRimLightArray[u_xlati1].xyz);\\n    u_xlat26 = dot(vs_NORMAL0.xyz, vs_NORMAL0.xyz);\\n    u_xlat26 = inversesqrt(u_xlat26);\\n    u_xlat4.xyz = vec3(u_xlat26) * vs_NORMAL0.xyz;\\n    u_xlat26 = dot(_SekaiRimLightArray[u_xlati1].xyz, _SekaiRimLightArray[u_xlati1].xyz);\\n    u_xlat26 = inversesqrt(u_xlat26);\\n    u_xlat7.xyz = vec3(u_xlat26) * _SekaiRimLightArray[u_xlati1].xyz;\\n    u_xlat26 = dot(u_xlat4.xyz, u_xlat7.xyz);\\n    u_xlat16_27 = -1.0 + _SekaiRimLightShadowSharpnessArray[u_xlati1];\\n    u_xlat16_5.x = 1.0 + (-_SekaiRimLightShadowSharpnessArray[u_xlati1]);\\n    u_xlat4.x = (-u_xlat16_27) + u_xlat16_5.x;\\n    u_xlat12.x = u_xlat26 + (-u_xlat16_27);\\n    u_xlat4.x = float(1.0) / u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n    u_xlat12.x = u_xlat4.x * -2.0 + 3.0;\\n    u_xlat4.x = u_xlat4.x * u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat12.xyz = _SekaiShadowRimLightColorArray[u_xlati1].xyz * _SekaiShadowRimLightColorArray[u_xlati1].www + (-u_xlat9.xyz);\\n    u_xlat9.xyz = u_xlat4.xxx * u_xlat12.xyz + u_xlat9.xyz;\\n    u_xlat2.xz = max(u_xlat2.xz, vec2(0.0, 0.0));\\n    u_xlat2.x = (-u_xlat2.x) + 1.0;\\n    u_xlat16_27 = 10.0 + (-_SekaiRimLightFactor[u_xlati1].x);\\n    u_xlat2.x = log2(u_xlat2.x);\\n    u_xlat2.x = u_xlat2.x * u_xlat16_27;\\n    u_xlat2.x = exp2(u_xlat2.x);\\n    u_xlat18 = u_xlat2.x * u_xlat2.z + (-u_xlat2.x);\\n    u_xlat2.x = _SekaiRimLightFactor[u_xlati1].w * u_xlat18 + u_xlat2.x;\\n    u_xlat18 = (-u_xlat26) + 0.0500000007;\\n    u_xlati26 = int((0.0<u_xlat18) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati18 = int((u_xlat18<0.0) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati18 = (-u_xlati26) + u_xlati18;\\n    u_xlat18 = float(u_xlati18);\\n    u_xlat18 = u_xlat2.x * u_xlat18 + (-u_xlat2.x);\\n    u_xlat2.x = _SekaiRimLightFactor[u_xlati1].w * u_xlat18 + u_xlat2.x;\\n    u_xlat2.x = u_xlat2.x + (-_RimThreshold);\\n    u_xlat18 = float(1.0) / _SekaiRimLightFactor[u_xlati1].z;\\n    u_xlat2.x = u_xlat18 * u_xlat2.x;\\n    u_xlat2.x = clamp(u_xlat2.x, 0.0, 1.0);\\n    u_xlat18 = u_xlat2.x * -2.0 + 3.0;\\n    u_xlat2.x = u_xlat2.x * u_xlat2.x;\\n    u_xlat2.x = u_xlat2.x * u_xlat18;\\n    u_xlat9.xyz = u_xlat9.xyz * u_xlat2.xxx;\\n    u_xlat2.xzw = u_xlat9.xyz * vs_COLOR0.yyy;\\n    u_xlat16_3.xyz = u_xlat9.xyz * vs_COLOR0.yyy + u_xlat16_3.xyz;\\n    u_xlatb9.xyz = greaterThanEqual(u_xlat16_3.xyzz, vec4(0.5, 0.5, 0.5, 0.5)).xyz;\\n    u_xlat16_5.x = (u_xlatb9.x) ? float(1.0) : float(0.0);\\n    u_xlat16_5.y = (u_xlatb9.y) ? float(1.0) : float(0.0);\\n    u_xlat16_5.z = (u_xlatb9.z) ? float(1.0) : float(0.0);\\n    u_xlat16_6.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat9.xyz = u_xlat16_6.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati1].xyz;\\n    u_xlat16_3.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat4.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati1].xyz);\\n    u_xlat4.xyz = (-u_xlat16_3.xyz) * u_xlat4.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = (-u_xlat16_6.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati1].xyz + u_xlat4.xyz;\\n    u_xlat16_3.xyz = u_xlat16_5.xyz * u_xlat16_3.xyz + u_xlat9.xyz;\\n    u_xlat9.xyz = u_xlat16_3.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati1]);\\n    u_xlat4.xyz = u_xlat9.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_3.xyz = (-u_xlat9.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = (-u_xlat16_3.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat4.xyz * _PartsAmbientColor.xyz + (-u_xlat16_3.xyz);\\n    u_xlat16_3.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_3.xyz;\\n    u_xlatb9.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb9.x){\\n        u_xlat9.xyz = (-vs_TEXCOORD3.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat9.xy = u_xlat9.xy * u_xlat9.xy;\\n        u_xlat9.x = u_xlat9.y + u_xlat9.x;\\n        u_xlat9.x = u_xlat9.z * u_xlat9.z + u_xlat9.x;\\n        u_xlat17 = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat9.x = u_xlat9.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat17 = float(1.0) / u_xlat17;\\n        u_xlat9.x = u_xlat17 * u_xlat9.x;\\n        u_xlat9.x = clamp(u_xlat9.x, 0.0, 1.0);\\n        u_xlat17 = u_xlat9.x * -2.0 + 3.0;\\n        u_xlat9.x = u_xlat9.x * u_xlat9.x;\\n        u_xlat25 = u_xlat9.x * u_xlat17;\\n        u_xlat9.x = (-u_xlat17) * u_xlat9.x + 1.0;\\n        u_xlat4.xyz = u_xlat16_3.xyz * vec3(u_xlat25);\\n        u_xlat4.xyz = u_xlat4.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat9.xyz = u_xlat9.xxx * u_xlat16_3.xyz + u_xlat4.xyz;\\n    } else {\\n        u_xlat9.xyz = u_xlat16_3.xyz;\\n    }\\n    u_xlat2.xzw = u_xlat2.xzw * _SekaiRimLightFactor[u_xlati1].yyy;\\n    u_xlat2.xyz = u_xlat9.xyz * u_xlat16_2.yyy + u_xlat2.xzw;\\n    u_xlat16_3.x = (-vs_TEXCOORD4) + 1.0;\\n    u_xlat1.x = u_xlat16_3.x * _SekaiFogColor.w;\\n    u_xlat4.xyz = (-u_xlat9.xyz) + _SekaiFogColor.xyz;\\n    u_xlat16_0.xyz = u_xlat1.xxx * u_xlat4.xyz + u_xlat9.xyz;\\n    u_xlat1.x = vs_TEXCOORD5 / vs_TEXCOORD0.w;\\n    u_xlat1.x = u_xlat1.x * 0.5 + 0.5;\\n    u_xlat1.x = (-u_xlat1.x) + 1.0;\\n    u_xlat9.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat9.x = u_xlat9.x + -1.0;\\n    u_xlat9.x = u_xlat9.x * _ProjectionParams.w;\\n    u_xlat1.x = u_xlat9.x * u_xlat1.x + _ProjectionParams.w;\\n    u_xlat1.x = (-_CoCParams.x) * u_xlat1.x + 1.0;\\n    u_xlat1.x = u_xlat1.x * _CoCParams.y;\\n    u_xlat9.x = u_xlat1.x;\\n    u_xlat9.x = clamp(u_xlat9.x, 0.0, 1.0);\\n    u_xlat1.x = max(u_xlat1.x, -1.0);\\n    u_xlat1.x = min(u_xlat1.x, 0.0);\\n    u_xlat1.x = u_xlat1.x + u_xlat9.x;\\n    u_xlat1.x = u_xlat1.x + 1.0;\\n    u_xlat1.x = u_xlat1.x * 0.5;\\n    SV_Target0 = u_xlat16_0;\\n    SV_Target1.x = u_xlat1.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2.xyz = u_xlat2.xyz;\\n    SV_Target2.w = 1.0;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec4 _MonitorObjectPositionArray[12];\\nuniform \\tvec4 _MonitorAccessoryPositionArray[10];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float                _IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp float vs_TEXCOORD5;\\nout highp vec4 vs_TEXCOORD0;\\nout highp vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout mediump float vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nvec4 u_xlat0;\\nint u_xlati0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nvec4 u_xlat2;\\nvec4 u_xlat3;\\nint u_xlati3;\\nfloat u_xlat13;\\nbool u_xlatb13;\\nvoid main()\\n{\\n    u_xlatb0 = 0.5<_IsAccessory;\\n    if(u_xlatb0){\\n        u_xlati0 = _CharacterId;\\n        u_xlat0.xyz = _MonitorObjectPositionArray[u_xlati0].zxy + _MonitorAccessoryPositionArray[u_xlati0].zxy;\\n        u_xlat1.x = u_xlat0.y;\\n        u_xlat2.x = u_xlat0.z;\\n    } else {\\n        u_xlati3 = _CharacterId;\\n        u_xlat1.x = _MonitorObjectPositionArray[u_xlati3].x;\\n        u_xlat2.x = _MonitorObjectPositionArray[u_xlati3].y;\\n        u_xlat0.x = _MonitorObjectPositionArray[u_xlati3].z;\\n    }\\n    u_xlat1.y = hlslcc_mtx4x4unity_ObjectToWorld[0].x;\\n    u_xlat1.z = hlslcc_mtx4x4unity_ObjectToWorld[1].x;\\n    u_xlat1.w = hlslcc_mtx4x4unity_ObjectToWorld[2].x;\\n    u_xlat3.xyz = in_POSITION0.xyz;\\n    u_xlat3.w = 1.0;\\n    u_xlat1.x = dot(u_xlat1.yzwx, u_xlat3);\\n    u_xlat2.y = hlslcc_mtx4x4unity_ObjectToWorld[0].y;\\n    u_xlat2.z = hlslcc_mtx4x4unity_ObjectToWorld[1].y;\\n    u_xlat2.w = hlslcc_mtx4x4unity_ObjectToWorld[2].y;\\n    u_xlat1.y = dot(u_xlat2.yzwx, u_xlat3);\\n    u_xlat0.y = hlslcc_mtx4x4unity_ObjectToWorld[0].z;\\n    u_xlat0.z = hlslcc_mtx4x4unity_ObjectToWorld[1].z;\\n    u_xlat0.w = hlslcc_mtx4x4unity_ObjectToWorld[2].z;\\n    u_xlat1.z = dot(u_xlat0.yzwx, u_xlat3);\\n    u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    u_xlat2.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat2.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat2.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat13 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat13 = max(u_xlat13, 1.17549435e-38);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    u_xlat2.xyz = vec3(u_xlat13) * u_xlat2.xyz;\\n    u_xlat13 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    vs_NORMAL0.xyz = vec3(u_xlat13) * u_xlat2.xyz;\\n    u_xlatb13 = unity_OrthoParams.w==0.0;\\n    u_xlat2.xyz = (-u_xlat1.xyz) + _WorldSpaceCameraPos.xyz;\\n    u_xlat3.x = (u_xlatb13) ? u_xlat2.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat3.y = (u_xlatb13) ? u_xlat2.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat3.z = (u_xlatb13) ? u_xlat2.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat13 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    vs_TEXCOORD2.xyz = vec3(u_xlat13) * u_xlat3.xyz;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat13 = u_xlat0.z + _ProjectionParams.y;\\n    u_xlat2.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat13 = u_xlat13 / u_xlat2.x;\\n    u_xlat13 = u_xlat13 * _ProjectionParams.z;\\n    u_xlat13 = max(u_xlat13, 0.0);\\n    u_xlat13 = (-_SekaiFogFactor.y) * u_xlat13 + _SekaiFogFactor.x;\\n    u_xlat13 = clamp(u_xlat13, 0.0, 1.0);\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD0 = u_xlat0;\\n    vs_COLOR0 = in_COLOR0;\\n    vs_TEXCOORD3.xyz = u_xlat1.xyz;\\n    vs_TEXCOORD4 = u_xlat13;\\n    vs_TEXCOORD5 = u_xlat0.z;\\n    return;\\n}\\n\\n\"},\"309549705cf937eabc0f2dce122bf3f2a24e88ed3048b5ce4b1e1326de58ae7d\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvoid main()\\n{\\n    SV_Target0 = vec4(0.100000001, 0.100000001, 0.100000001, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ZBufferParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 rp_FogFactor;\\nuniform \\tmediump vec4 rp_FogColor;\\nuniform \\tvec2 rp_HeightFogFactor;\\nuniform \\tmediump vec4 rp_HeightFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterId;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_PartsAmbientColor;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowTexWeight;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_FadeMode;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowWidth;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_HueSinAngle;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_HueCosAngle;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Saturation;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Value;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin mediump vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp vec4 vs_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout highp vec2 vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nfloat u_xlat0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nvec4 u_xlat2;\\nvec3 u_xlat3;\\nvec3 u_xlat4;\\nfloat u_xlat7;\\nfloat u_xlat14;\\nvoid main()\\n{\\n    u_xlat0 = in_COLOR0.z * 0.100000001;\\n    u_xlat4.x = (-_ProjectionParams.y) + _ProjectionParams.z;\\n    u_xlat0 = u_xlat0 / u_xlat4.x;\\n    u_xlat1 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat1;\\n    u_xlat2 = hlslcc_mtx4x4unity_ObjectToWorld[3] * in_POSITION0.wwww + u_xlat1;\\n    u_xlat4.xyz = u_xlat1.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat4.xyz = (-u_xlat4.xyz) + _WorldSpaceCameraPos.xyz;\\n    u_xlat1 = u_xlat2.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat2.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat2.zzzz + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat2.wwww + u_xlat1;\\n    u_xlat14 = u_xlat1.z / u_xlat1.w;\\n    u_xlat14 = _ZBufferParams.x * u_xlat14 + _ZBufferParams.y;\\n    u_xlat14 = float(1.0) / u_xlat14;\\n    u_xlat3.x = (-unity_OrthoParams.w) + 1.0;\\n    u_xlat14 = u_xlat14 * u_xlat3.x;\\n    u_xlat14 = u_xlat1.z * unity_OrthoParams.w + u_xlat14;\\n    u_xlat14 = (-u_xlat0) * 0.5 + u_xlat14;\\n    u_xlat0 = u_xlat0 * 0.5;\\n    u_xlat0 = (-u_xlat0) * _ProjectionParams.x + u_xlat1.z;\\n    u_xlat7 = u_xlat14 * _ZBufferParams.x;\\n    u_xlat14 = (-_ZBufferParams.y) * u_xlat14 + 1.0;\\n    u_xlat14 = u_xlat14 / u_xlat7;\\n    u_xlat14 = u_xlat1.w * u_xlat14;\\n    u_xlat14 = u_xlat3.x * u_xlat14;\\n    gl_Position.z = u_xlat0 * unity_OrthoParams.w + u_xlat14;\\n    gl_Position.xyw = u_xlat1.xyw;\\n    u_xlat3.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat3.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat3.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat0 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat0 = max(u_xlat0, 1.17549435e-38);\\n    u_xlat0 = inversesqrt(u_xlat0);\\n    u_xlat3.xyz = vec3(u_xlat0) * u_xlat3.xyz;\\n    u_xlat0 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat0 = inversesqrt(u_xlat0);\\n    vs_NORMAL0.xyz = vec3(u_xlat0) * u_xlat3.xyz;\\n    vs_TEXCOORD0 = u_xlat1;\\n    u_xlat0 = u_xlat1.z + _ProjectionParams.y;\\n    vs_COLOR0 = in_COLOR0;\\n    u_xlat1.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0 = u_xlat0 / u_xlat1.x;\\n    u_xlat0 = u_xlat0 * _ProjectionParams.z;\\n    u_xlat0 = max(u_xlat0, 0.0);\\n    u_xlat0 = (-rp_FogFactor.xxxy.w) * u_xlat0 + rp_FogFactor.xxxy.z;\\n    u_xlat0 = clamp(u_xlat0, 0.0, 1.0);\\n    u_xlat0 = (-u_xlat0) + 1.0;\\n    vs_TEXCOORD4.x = u_xlat0 * rp_FogColor.w;\\n    u_xlat0 = u_xlat2.y + (-rp_HeightFogFactor.x);\\n    vs_TEXCOORD3.xyz = u_xlat2.xyz;\\n    u_xlat0 = u_xlat0 * rp_HeightFogFactor.y;\\n    u_xlat0 = clamp(u_xlat0, 0.0, 1.0);\\n    vs_TEXCOORD4.y = u_xlat0 * rp_HeightFogColor.w;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlatb0 = unity_OrthoParams.w==0.0;\\n    u_xlat1.x = (u_xlatb0) ? u_xlat4.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat1.y = (u_xlatb0) ? u_xlat4.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat1.z = (u_xlatb0) ? u_xlat4.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat0 = dot(u_xlat1.xyz, u_xlat1.xyz);\\n    u_xlat0 = inversesqrt(u_xlat0);\\n    vs_TEXCOORD2.xyz = vec3(u_xlat0) * u_xlat1.xyz;\\n    return;\\n}\\n\\n\"},\"3335b052fefea563fd011b8f83a70ff3fb664b5aa3ce11449ed2b6b2b68df3d0\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 _SekaiDirectionalLight;\\nuniform \\tmediump vec4 _SekaiShadowColor;\\nuniform \\tmediump float _SekaiShadowThreshold;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec4 _SekaiRimLightArray[12];\\nuniform \\tvec4 _SekaiRimLightColorArray[12];\\nuniform \\tvec4 _SekaiShadowRimLightColorArray[12];\\nuniform \\tmediump vec4 _SekaiRimLightFactor[12];\\nuniform \\tmediump float _SekaiRimLightShadowSharpnessArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\nuniform \\tmediump float _DitherAlpha;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float                _IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _ShadowTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _ValueTex;\\nUNITY_LOCATION(3) uniform mediump sampler2D _DitherTex;\\nin highp vec3 vs_NORMAL0;\\nin highp float vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD0;\\nin highp vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD1;\\nin mediump float vs_TEXCOORD4;\\nin highp vec3 vs_TEXCOORD2;\\nin highp vec3 vs_TEXCOORD3;\\nin highp vec4 vs_TEXCOORD6;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec2 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nbool u_xlatb0;\\nmediump vec4 u_xlat16_1;\\nvec3 u_xlat2;\\nmediump vec3 u_xlat16_2;\\nint u_xlati2;\\nvec4 u_xlat3;\\nmediump vec3 u_xlat16_3;\\nvec3 u_xlat4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nmediump float u_xlat16_9;\\nvec3 u_xlat10;\\nbvec3 u_xlatb10;\\nvec3 u_xlat12;\\nmediump vec3 u_xlat16_13;\\nmediump float u_xlat16_17;\\nfloat u_xlat18;\\nfloat u_xlat19;\\nint u_xlati19;\\nmediump float u_xlat16_25;\\nfloat u_xlat26;\\nbool u_xlatb26;\\nfloat u_xlat27;\\nint u_xlati27;\\nvoid main()\\n{\\n    u_xlat0.xy = vs_TEXCOORD6.xy / vs_TEXCOORD6.ww;\\n    u_xlat0.xy = u_xlat0.xy * _ScreenParams.xy;\\n    u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.25);\\n    u_xlat16_0.x = texture(_DitherTex, u_xlat0.xy, _GlobalMipBias.x).x;\\n    u_xlat16_1.x = (-u_xlat16_0.x) + _DitherAlpha;\\n    u_xlatb0 = u_xlat16_1.x<0.0;\\n    if(u_xlatb0){discard;}\\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlat16_2.xyz = texture(_ShadowTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat2.xyz = (-u_xlat16_0.xyz) + u_xlat16_2.xyz;\\n    u_xlat26 = u_xlat2.x * _ShadowTexWeight;\\n    u_xlat2.xyz = vec3(_ShadowTexWeight) * u_xlat2.xyz + u_xlat16_0.xyz;\\n    u_xlat16_3.xyz = texture(_ValueTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat16_1.x = u_xlat16_3.z * 2.0 + -1.0;\\n    u_xlat16_9 = _Saturation + _Saturation;\\n    u_xlat16_17 = _Value * 2.0 + -1.0;\\n    u_xlat16_25 = _Contrast + _Contrast;\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_0.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat19 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_0.xyz);\\n    u_xlat19 = u_xlat19 * 0.57735002;\\n    u_xlat16_5.x = (-_HueCosAngle) + 1.0;\\n    u_xlat4.xyz = vec3(u_xlat19) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_13.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz * vec3(u_xlat16_25) + vec3(u_xlat16_17);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_6.x = dot(u_xlat16_13.xyz, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + (-u_xlat16_6.xxx);\\n    u_xlat16_13.xyz = vec3(u_xlat16_9) * u_xlat16_13.xyz + u_xlat16_6.xxx;\\n    u_xlat19 = dot(_SekaiDirectionalLight.xyz, vs_NORMAL0.xyz);\\n    u_xlat19 = u_xlat19 * 0.5 + 0.5;\\n    switch(_FadeMode){\\n        case 0:\\n            u_xlat4.x = _ShadowWidth * (-_SekaiShadowThreshold) + _SekaiShadowThreshold;\\n            u_xlat12.x = u_xlat16_1.x + u_xlat19;\\n            u_xlat12.x = clamp(u_xlat12.x, 0.0, 1.0);\\n            u_xlat12.x = (-u_xlat4.x) + u_xlat12.x;\\n            u_xlat4.x = (-u_xlat4.x) + _SekaiShadowThreshold;\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat4.x = u_xlat12.x / u_xlat4.x;\\n            u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n            u_xlat12.x = u_xlat4.x * u_xlat4.x;\\n            u_xlat4.x = (-u_xlat4.x) * 2.0 + 3.0;\\n            u_xlat27 = (-u_xlat12.x) * u_xlat4.x + 1.0;\\n            break;\\n        case 1:\\n            u_xlat4.x = (-_SekaiShadowThreshold) + 1.0;\\n            u_xlat4.x = u_xlat4.x * _ShadowWidth;\\n            u_xlat19 = u_xlat16_1.x + u_xlat19;\\n            u_xlat19 = clamp(u_xlat19, 0.0, 1.0);\\n            u_xlat19 = u_xlat19 + (-_SekaiShadowThreshold);\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat19 = u_xlat19 / u_xlat4.x;\\n            u_xlat19 = clamp(u_xlat19, 0.0, 1.0);\\n            u_xlat4.x = u_xlat19 * u_xlat19;\\n            u_xlat19 = (-u_xlat19) * 2.0 + 3.0;\\n            u_xlat27 = (-u_xlat4.x) * u_xlat19 + 1.0;\\n            break;\\n        default:\\n            break;\\n    }\\n    u_xlat2.xyz = u_xlat2.xyz * _SekaiShadowColor.xyz + (-u_xlat16_13.xyz);\\n    u_xlat2.xyz = vec3(u_xlat27) * u_xlat2.xyz + u_xlat16_13.xyz;\\n    u_xlat26 = u_xlat27 * u_xlat26 + u_xlat16_0.x;\\n    u_xlat4.xyz = _SekaiShadowColor.xyz * _Shadow1SkinColor.xyz;\\n    u_xlat7.xyz = _SekaiShadowColor.xyz * _Shadow2SkinColor.xyz;\\n    u_xlat16_1.x = u_xlat26 + u_xlat26;\\n    u_xlat16_13.x = u_xlat26 * 2.0 + -1.0;\\n    u_xlat16_13.x = clamp(u_xlat16_13.x, 0.0, 1.0);\\n    u_xlat16_6.xyz = (-_Shadow1SkinColor.xyz) * _SekaiShadowColor.xyz + _DefaultSkinColor.xyz;\\n    u_xlat16_13.xyz = u_xlat16_13.xxx * u_xlat16_6.xyz + u_xlat4.xyz;\\n    u_xlat16_1.x = u_xlat16_1.x;\\n    u_xlat16_1.x = clamp(u_xlat16_1.x, 0.0, 1.0);\\n    u_xlat16_13.xyz = (-_Shadow2SkinColor.xyz) * _SekaiShadowColor.xyz + u_xlat16_13.xyz;\\n    u_xlat16_13.xyz = u_xlat16_1.xxx * u_xlat16_13.xyz + u_xlat7.xyz;\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_13.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat26 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_13.xyz);\\n    u_xlat26 = u_xlat26 * 0.57735002;\\n    u_xlat4.xyz = vec3(u_xlat26) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_5.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_1.xzw = u_xlat16_5.xyz * vec3(u_xlat16_25) + vec3(u_xlat16_17);\\n    u_xlat16_1.xzw = u_xlat16_1.xzw + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_5.x = dot(u_xlat16_1.xzw, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_1.xzw = u_xlat16_1.xzw + (-u_xlat16_5.xxx);\\n    u_xlat16_1.xyz = vec3(u_xlat16_9) * u_xlat16_1.xzw + u_xlat16_5.xxx;\\n    u_xlatb26 = u_xlat16_3.x>=0.5;\\n    u_xlat16_25 = (u_xlatb26) ? 1.0 : 0.0;\\n    u_xlat16_1.xyz = (-u_xlat2.xyz) + u_xlat16_1.xyz;\\n    u_xlat16_1.xyz = vec3(u_xlat16_25) * u_xlat16_1.xyz + u_xlat2.xyz;\\n    u_xlati2 = _CharacterId;\\n    u_xlat10.xyz = _SekaiRimLightColorArray[u_xlati2].www * _SekaiRimLightColorArray[u_xlati2].xyz;\\n    u_xlat3.x = dot(vs_NORMAL0.xyz, vs_TEXCOORD2.xyz);\\n    u_xlat3.z = dot(vs_TEXCOORD2.xyz, _SekaiRimLightArray[u_xlati2].xyz);\\n    u_xlat27 = dot(vs_NORMAL0.xyz, vs_NORMAL0.xyz);\\n    u_xlat27 = inversesqrt(u_xlat27);\\n    u_xlat4.xyz = vec3(u_xlat27) * vs_NORMAL0.xyz;\\n    u_xlat27 = dot(_SekaiRimLightArray[u_xlati2].xyz, _SekaiRimLightArray[u_xlati2].xyz);\\n    u_xlat27 = inversesqrt(u_xlat27);\\n    u_xlat7.xyz = vec3(u_xlat27) * _SekaiRimLightArray[u_xlati2].xyz;\\n    u_xlat27 = dot(u_xlat4.xyz, u_xlat7.xyz);\\n    u_xlat16_25 = -1.0 + _SekaiRimLightShadowSharpnessArray[u_xlati2];\\n    u_xlat16_5.x = 1.0 + (-_SekaiRimLightShadowSharpnessArray[u_xlati2]);\\n    u_xlat4.x = (-u_xlat16_25) + u_xlat16_5.x;\\n    u_xlat12.x = (-u_xlat16_25) + u_xlat27;\\n    u_xlat4.x = float(1.0) / u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n    u_xlat12.x = u_xlat4.x * -2.0 + 3.0;\\n    u_xlat4.x = u_xlat4.x * u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat12.xyz = _SekaiShadowRimLightColorArray[u_xlati2].xyz * _SekaiShadowRimLightColorArray[u_xlati2].www + (-u_xlat10.xyz);\\n    u_xlat10.xyz = u_xlat4.xxx * u_xlat12.xyz + u_xlat10.xyz;\\n    u_xlat3.xz = max(u_xlat3.xz, vec2(0.0, 0.0));\\n    u_xlat3.x = (-u_xlat3.x) + 1.0;\\n    u_xlat16_25 = 10.0 + (-_SekaiRimLightFactor[u_xlati2].x);\\n    u_xlat3.x = log2(u_xlat3.x);\\n    u_xlat3.x = u_xlat16_25 * u_xlat3.x;\\n    u_xlat3.x = exp2(u_xlat3.x);\\n    u_xlat19 = u_xlat3.x * u_xlat3.z + (-u_xlat3.x);\\n    u_xlat3.x = _SekaiRimLightFactor[u_xlati2].w * u_xlat19 + u_xlat3.x;\\n    u_xlat19 = (-u_xlat27) + 0.0500000007;\\n    u_xlati27 = int((0.0<u_xlat19) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati19 = int((u_xlat19<0.0) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati19 = (-u_xlati27) + u_xlati19;\\n    u_xlat19 = float(u_xlati19);\\n    u_xlat19 = u_xlat3.x * u_xlat19 + (-u_xlat3.x);\\n    u_xlat3.x = _SekaiRimLightFactor[u_xlati2].w * u_xlat19 + u_xlat3.x;\\n    u_xlat3.x = u_xlat3.x + (-_RimThreshold);\\n    u_xlat19 = float(1.0) / _SekaiRimLightFactor[u_xlati2].z;\\n    u_xlat3.x = u_xlat19 * u_xlat3.x;\\n    u_xlat3.x = clamp(u_xlat3.x, 0.0, 1.0);\\n    u_xlat19 = u_xlat3.x * -2.0 + 3.0;\\n    u_xlat3.x = u_xlat3.x * u_xlat3.x;\\n    u_xlat3.x = u_xlat3.x * u_xlat19;\\n    u_xlat10.xyz = u_xlat10.xyz * u_xlat3.xxx;\\n    u_xlat3.xzw = u_xlat10.xyz * vs_COLOR0.yyy;\\n    u_xlat16_1.xyz = u_xlat10.xyz * vs_COLOR0.yyy + u_xlat16_1.xyz;\\n    u_xlatb10.xyz = greaterThanEqual(u_xlat16_1.xyzz, vec4(0.5, 0.5, 0.5, 0.5)).xyz;\\n    u_xlat16_5.x = (u_xlatb10.x) ? float(1.0) : float(0.0);\\n    u_xlat16_5.y = (u_xlatb10.y) ? float(1.0) : float(0.0);\\n    u_xlat16_5.z = (u_xlatb10.z) ? float(1.0) : float(0.0);\\n    u_xlat16_6.xyz = u_xlat16_1.xyz + u_xlat16_1.xyz;\\n    u_xlat10.xyz = u_xlat16_6.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati2].xyz;\\n    u_xlat16_1.xyz = (-u_xlat16_1.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = u_xlat16_1.xyz + u_xlat16_1.xyz;\\n    u_xlat4.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati2].xyz);\\n    u_xlat4.xyz = (-u_xlat16_1.xyz) * u_xlat4.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = (-u_xlat16_6.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati2].xyz + u_xlat4.xyz;\\n    u_xlat16_1.xyz = u_xlat16_5.xyz * u_xlat16_1.xyz + u_xlat10.xyz;\\n    u_xlat10.xyz = u_xlat16_1.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati2]);\\n    u_xlat4.xyz = u_xlat10.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_1.xyz = (-u_xlat10.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = u_xlat16_1.xyz + u_xlat16_1.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = (-u_xlat16_1.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat4.xyz * _PartsAmbientColor.xyz + (-u_xlat16_1.xyz);\\n    u_xlat16_1.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_1.xyz;\\n    u_xlatb10.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb10.x){\\n        u_xlat10.xyz = (-vs_TEXCOORD3.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat10.xy = u_xlat10.xy * u_xlat10.xy;\\n        u_xlat10.x = u_xlat10.y + u_xlat10.x;\\n        u_xlat10.x = u_xlat10.z * u_xlat10.z + u_xlat10.x;\\n        u_xlat18 = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat10.x = u_xlat10.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat18 = float(1.0) / u_xlat18;\\n        u_xlat10.x = u_xlat18 * u_xlat10.x;\\n        u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);\\n        u_xlat18 = u_xlat10.x * -2.0 + 3.0;\\n        u_xlat10.x = u_xlat10.x * u_xlat10.x;\\n        u_xlat26 = u_xlat10.x * u_xlat18;\\n        u_xlat10.x = (-u_xlat18) * u_xlat10.x + 1.0;\\n        u_xlat4.xyz = u_xlat16_1.xyz * vec3(u_xlat26);\\n        u_xlat4.xyz = u_xlat4.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat10.xyz = u_xlat10.xxx * u_xlat16_1.xyz + u_xlat4.xyz;\\n    } else {\\n        u_xlat10.xyz = u_xlat16_1.xyz;\\n    }\\n    u_xlat3.xzw = u_xlat3.xzw * _SekaiRimLightFactor[u_xlati2].yyy;\\n    u_xlat3.xyz = u_xlat10.xyz * u_xlat16_3.yyy + u_xlat3.xzw;\\n    u_xlat16_1.x = (-vs_TEXCOORD4) + 1.0;\\n    u_xlat2.x = u_xlat16_1.x * _SekaiFogColor.w;\\n    u_xlat4.xyz = (-u_xlat10.xyz) + _SekaiFogColor.xyz;\\n    u_xlat16_0.xyz = u_xlat2.xxx * u_xlat4.xyz + u_xlat10.xyz;\\n    u_xlat2.x = vs_TEXCOORD5 / vs_TEXCOORD0.w;\\n    u_xlat2.x = u_xlat2.x * 0.5 + 0.5;\\n    u_xlat2.x = (-u_xlat2.x) + 1.0;\\n    u_xlat10.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat10.x = u_xlat10.x + -1.0;\\n    u_xlat10.x = u_xlat10.x * _ProjectionParams.w;\\n    u_xlat2.x = u_xlat10.x * u_xlat2.x + _ProjectionParams.w;\\n    u_xlat2.x = (-_CoCParams.x) * u_xlat2.x + 1.0;\\n    u_xlat2.x = u_xlat2.x * _CoCParams.y;\\n    u_xlat10.x = u_xlat2.x;\\n    u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);\\n    u_xlat2.x = max(u_xlat2.x, -1.0);\\n    u_xlat2.x = min(u_xlat2.x, 0.0);\\n    u_xlat2.x = u_xlat2.x + u_xlat10.x;\\n    u_xlat2.x = u_xlat2.x + 1.0;\\n    u_xlat2.x = u_xlat2.x * 0.5;\\n    SV_Target0 = u_xlat16_0;\\n    SV_Target1.x = u_xlat2.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2.xyz = u_xlat3.xyz;\\n    SV_Target2.w = 1.0;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec4 _MonitorObjectPositionArray[12];\\nuniform \\tvec4 _MonitorAccessoryPositionArray[10];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float                _IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp float vs_TEXCOORD5;\\nout highp vec4 vs_TEXCOORD0;\\nout highp vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout mediump float vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nout highp vec4 vs_TEXCOORD6;\\nvec4 u_xlat0;\\nint u_xlati0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nvec4 u_xlat2;\\nvec4 u_xlat3;\\nint u_xlati3;\\nfloat u_xlat6;\\nfloat u_xlat13;\\nbool u_xlatb13;\\nvoid main()\\n{\\n    u_xlatb0 = 0.5<_IsAccessory;\\n    if(u_xlatb0){\\n        u_xlati0 = _CharacterId;\\n        u_xlat0.xyz = _MonitorObjectPositionArray[u_xlati0].zxy + _MonitorAccessoryPositionArray[u_xlati0].zxy;\\n        u_xlat1.x = u_xlat0.y;\\n        u_xlat2.x = u_xlat0.z;\\n    } else {\\n        u_xlati3 = _CharacterId;\\n        u_xlat1.x = _MonitorObjectPositionArray[u_xlati3].x;\\n        u_xlat2.x = _MonitorObjectPositionArray[u_xlati3].y;\\n        u_xlat0.x = _MonitorObjectPositionArray[u_xlati3].z;\\n    }\\n    u_xlat1.y = hlslcc_mtx4x4unity_ObjectToWorld[0].x;\\n    u_xlat1.z = hlslcc_mtx4x4unity_ObjectToWorld[1].x;\\n    u_xlat1.w = hlslcc_mtx4x4unity_ObjectToWorld[2].x;\\n    u_xlat3.xyz = in_POSITION0.xyz;\\n    u_xlat3.w = 1.0;\\n    u_xlat1.x = dot(u_xlat1.yzwx, u_xlat3);\\n    u_xlat2.y = hlslcc_mtx4x4unity_ObjectToWorld[0].y;\\n    u_xlat2.z = hlslcc_mtx4x4unity_ObjectToWorld[1].y;\\n    u_xlat2.w = hlslcc_mtx4x4unity_ObjectToWorld[2].y;\\n    u_xlat1.y = dot(u_xlat2.yzwx, u_xlat3);\\n    u_xlat0.y = hlslcc_mtx4x4unity_ObjectToWorld[0].z;\\n    u_xlat0.z = hlslcc_mtx4x4unity_ObjectToWorld[1].z;\\n    u_xlat0.w = hlslcc_mtx4x4unity_ObjectToWorld[2].z;\\n    u_xlat1.z = dot(u_xlat0.yzwx, u_xlat3);\\n    u_xlat0 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    u_xlat2.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat2.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat2.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat13 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat13 = max(u_xlat13, 1.17549435e-38);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    u_xlat2.xyz = vec3(u_xlat13) * u_xlat2.xyz;\\n    u_xlat13 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    vs_NORMAL0.xyz = vec3(u_xlat13) * u_xlat2.xyz;\\n    u_xlatb13 = unity_OrthoParams.w==0.0;\\n    u_xlat2.xyz = (-u_xlat1.xyz) + _WorldSpaceCameraPos.xyz;\\n    u_xlat3.x = (u_xlatb13) ? u_xlat2.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat3.y = (u_xlatb13) ? u_xlat2.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat3.z = (u_xlatb13) ? u_xlat2.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat13 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat13 = inversesqrt(u_xlat13);\\n    vs_TEXCOORD2.xyz = vec3(u_xlat13) * u_xlat3.xyz;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat13 = u_xlat0.z + _ProjectionParams.y;\\n    u_xlat2.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat13 = u_xlat13 / u_xlat2.x;\\n    u_xlat13 = u_xlat13 * _ProjectionParams.z;\\n    u_xlat13 = max(u_xlat13, 0.0);\\n    u_xlat13 = (-_SekaiFogFactor.y) * u_xlat13 + _SekaiFogFactor.x;\\n    u_xlat13 = clamp(u_xlat13, 0.0, 1.0);\\n    u_xlat2.xz = u_xlat0.xw * vec2(0.5, 0.5);\\n    u_xlat6 = u_xlat0.y * _ProjectionParams.x;\\n    u_xlat2.w = u_xlat6 * 0.5;\\n    vs_TEXCOORD6.xy = u_xlat2.zz + u_xlat2.xw;\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD0 = u_xlat0;\\n    vs_COLOR0 = in_COLOR0;\\n    vs_TEXCOORD3.xyz = u_xlat1.xyz;\\n    vs_TEXCOORD4 = u_xlat13;\\n    vs_TEXCOORD6.zw = u_xlat0.zw;\\n    vs_TEXCOORD5 = u_xlat0.z;\\n    return;\\n}\\n\\n\"},\"49fcefee865acd9ac5c729409b9b1e0186983fec2fc06c6a9655499c8a458350\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tmediump vec4 _SekaiCharacterOutlineColorArray[12];\\nuniform \\tfloat _SekaiCharacterOutlineBlendingArray[12];\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_RimThreshold;\\n\\tUNITY_UNIFORM float                _OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowTexWeight;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_FadeMode;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _ShadowTex;\\nin highp vec4 vs_TEXCOORD0;\\nin highp vec2 vs_TEXCOORD1;\\nin mediump float vs_TEXCOORD3;\\nin highp float vs_TEXCOORD4;\\nin highp vec3 vs_TEXCOORD2;\\nlayout(location = 0) out highp vec4 SV_Target0;\\nlayout(location = 1) out highp vec4 SV_Target1;\\nvec3 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nbvec3 u_xlatb0;\\nfloat u_xlat1;\\nint u_xlati1;\\nmediump vec3 u_xlat16_2;\\nmediump vec3 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nfloat u_xlat6;\\nvec3 u_xlat7;\\nmediump float u_xlat16_9;\\nfloat u_xlat12;\\nmediump float u_xlat16_15;\\nmediump float u_xlat16_20;\\nmediump float u_xlat16_21;\\nvoid main()\\n{\\n    u_xlat16_0 = texture(_ShadowTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlati1 = _CharacterId;\\n    u_xlat16_2.xyz = _SekaiCharacterOutlineColorArray[u_xlati1].www * _SekaiCharacterOutlineColorArray[u_xlati1].xyz;\\n    u_xlat16_20 = _Saturation + _Saturation;\\n    u_xlat16_3.x = _Value * 2.0 + -1.0;\\n    u_xlat16_9 = _Contrast + _Contrast;\\n    u_xlat7.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat7.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat7.zxy);\\n    u_xlat7.xyz = u_xlat7.xyz * vec3(_HueSinAngle);\\n    u_xlat7.xyz = u_xlat16_0.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat7.xyz;\\n    u_xlat0.x = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_0.xyz);\\n    u_xlat0.x = u_xlat0.x * 0.57735002;\\n    u_xlat16_15 = (-_HueCosAngle) + 1.0;\\n    u_xlat0.xyz = u_xlat0.xxx * vec3(u_xlat16_15) + u_xlat7.xyz;\\n    u_xlat16_4.xyz = u_xlat0.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_3.xyz = u_xlat16_4.xyz * vec3(u_xlat16_9) + u_xlat16_3.xxx;\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_21 = dot(u_xlat16_3.xyz, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_3.xyz = (-vec3(u_xlat16_21)) + u_xlat16_3.xyz;\\n    u_xlat16_3.xyz = vec3(u_xlat16_20) * u_xlat16_3.xyz + vec3(u_xlat16_21);\\n    u_xlatb0.xyz = greaterThanEqual(u_xlat16_3.xyzx, vec4(0.5, 0.5, 0.5, 0.0)).xyz;\\n    u_xlat16_4.x = (u_xlatb0.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb0.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb0.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat0.xyz = u_xlat16_5.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati1].xyz;\\n    u_xlat16_3.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat7.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati1].xyz);\\n    u_xlat7.xyz = (-u_xlat16_3.xyz) * u_xlat7.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = (-u_xlat16_5.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati1].xyz + u_xlat7.xyz;\\n    u_xlat16_3.xyz = u_xlat16_4.xyz * u_xlat16_3.xyz + u_xlat0.xyz;\\n    u_xlat0.xyz = u_xlat16_3.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati1]);\\n    u_xlat7.xyz = u_xlat0.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_3.xyz = (-u_xlat0.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat16_4.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = (-u_xlat16_3.xyz) * u_xlat16_4.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_4.xyz = u_xlat7.xyz * _PartsAmbientColor.xyz + (-u_xlat16_3.xyz);\\n    u_xlat16_3.xyz = _PartsAmbientColor.www * u_xlat16_4.xyz + u_xlat16_3.xyz;\\n    u_xlatb0.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb0.x){\\n        u_xlat0.xyz = (-vs_TEXCOORD2.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat0.xy = u_xlat0.xy * u_xlat0.xy;\\n        u_xlat0.x = u_xlat0.y + u_xlat0.x;\\n        u_xlat0.x = u_xlat0.z * u_xlat0.z + u_xlat0.x;\\n        u_xlat6 = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat0.x = u_xlat0.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat6 = float(1.0) / u_xlat6;\\n        u_xlat0.x = u_xlat6 * u_xlat0.x;\\n        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n        u_xlat6 = u_xlat0.x * -2.0 + 3.0;\\n        u_xlat0.x = u_xlat0.x * u_xlat0.x;\\n        u_xlat12 = u_xlat0.x * u_xlat6;\\n        u_xlat0.x = (-u_xlat6) * u_xlat0.x + 1.0;\\n        u_xlat7.xyz = u_xlat16_3.xyz * vec3(u_xlat12);\\n        u_xlat7.xyz = u_xlat7.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat0.xyz = u_xlat0.xxx * u_xlat16_3.xyz + u_xlat7.xyz;\\n    } else {\\n        u_xlat0.xyz = u_xlat16_3.xyz;\\n    }\\n    u_xlat0.xyz = (-_SekaiCharacterOutlineColorArray[u_xlati1].xyz) * _SekaiCharacterOutlineColorArray[u_xlati1].www + u_xlat0.xyz;\\n    u_xlat0.xyz = vec3(_SekaiCharacterOutlineBlendingArray[u_xlati1]) * u_xlat0.xyz + u_xlat16_2.xyz;\\n    u_xlat16_2.x = (-vs_TEXCOORD3) + 1.0;\\n    u_xlat1 = u_xlat16_2.x * _SekaiFogColor.w;\\n    u_xlat7.xyz = (-u_xlat0.xyz) + _SekaiFogColor.xyz;\\n    SV_Target0.xyz = vec3(u_xlat1) * u_xlat7.xyz + u_xlat0.xyz;\\n    u_xlat0.x = vs_TEXCOORD4 / vs_TEXCOORD0.w;\\n    u_xlat0.x = u_xlat0.x * 0.5 + 0.5;\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat6 = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat6 = u_xlat6 + -1.0;\\n    u_xlat6 = u_xlat6 * _ProjectionParams.w;\\n    u_xlat0.x = u_xlat6 * u_xlat0.x + _ProjectionParams.w;\\n    u_xlat0.x = (-_CoCParams.x) * u_xlat0.x + 1.0;\\n    u_xlat0.x = u_xlat0.x * _CoCParams.y;\\n    u_xlat6 = u_xlat0.x;\\n    u_xlat6 = clamp(u_xlat6, 0.0, 1.0);\\n    u_xlat0.x = max(u_xlat0.x, -1.0);\\n    u_xlat0.x = min(u_xlat0.x, 0.0);\\n    u_xlat0.x = u_xlat0.x + u_xlat6;\\n    u_xlat0.x = u_xlat0.x + 1.0;\\n    SV_Target1.x = u_xlat0.x * 0.5;\\n    SV_Target0.w = u_xlat16_0.w;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_RimThreshold;\\n\\tUNITY_UNIFORM float                _OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowTexWeight;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_FadeMode;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD0;\\nout highp vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout mediump float vs_TEXCOORD3;\\nout highp float vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvec3 u_xlat2;\\nvoid main()\\n{\\n    u_xlat0.x = dot(in_NORMAL0.xyz, in_NORMAL0.xyz);\\n    u_xlat0.x = inversesqrt(u_xlat0.x);\\n    u_xlat0.xyz = u_xlat0.xxx * in_NORMAL0.xyz;\\n    u_xlat0.xyz = u_xlat0.xyz * vec3(vec3(_OutlineWidth, _OutlineWidth, _OutlineWidth));\\n    u_xlat0.xyz = u_xlat0.xyz * in_COLOR0.xxx + in_POSITION0.xyz;\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_ObjectToWorld[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    vs_TEXCOORD0 = u_xlat0;\\n    vs_COLOR0 = in_COLOR0;\\n    vs_TEXCOORD4 = u_xlat0.z;\\n    u_xlat0.x = u_xlat0.z + _ProjectionParams.y;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat2.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat2.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat2.xyz;\\n    u_xlat2.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat2.xyz;\\n    vs_TEXCOORD2.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat2.xyz;\\n    u_xlat2.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat0.x / u_xlat2.x;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD3 = u_xlat0.x;\\n    return;\\n}\\n\\n\"},\"96bb4ec99476b5e5d98fba2f9f35d62f0da965cf0eed70e51395b931c513d7de\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 _SekaiDirectionalLight;\\nuniform \\tmediump vec4 _SekaiShadowColor;\\nuniform \\tmediump float _SekaiShadowThreshold;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec4 _SekaiRimLightArray[12];\\nuniform \\tvec4 _SekaiRimLightColorArray[12];\\nuniform \\tvec4 _SekaiShadowRimLightColorArray[12];\\nuniform \\tmediump vec4 _SekaiRimLightFactor[12];\\nuniform \\tmediump float _SekaiRimLightShadowSharpnessArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\nuniform \\tmediump float _DitherAlpha;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _ShadowTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _ValueTex;\\nUNITY_LOCATION(3) uniform mediump sampler2D _DitherTex;\\nin highp vec3 vs_NORMAL0;\\nin highp float vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD0;\\nin highp vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD1;\\nin mediump float vs_TEXCOORD4;\\nin highp vec3 vs_TEXCOORD2;\\nin highp vec3 vs_TEXCOORD3;\\nin highp vec4 vs_TEXCOORD6;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nvec2 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nbool u_xlatb0;\\nmediump vec4 u_xlat16_1;\\nvec3 u_xlat2;\\nmediump vec3 u_xlat16_2;\\nint u_xlati2;\\nvec4 u_xlat3;\\nmediump vec3 u_xlat16_3;\\nvec3 u_xlat4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nmediump float u_xlat16_9;\\nvec3 u_xlat10;\\nbvec3 u_xlatb10;\\nvec3 u_xlat12;\\nmediump vec3 u_xlat16_13;\\nmediump float u_xlat16_17;\\nfloat u_xlat18;\\nfloat u_xlat19;\\nint u_xlati19;\\nmediump float u_xlat16_25;\\nfloat u_xlat26;\\nbool u_xlatb26;\\nfloat u_xlat27;\\nint u_xlati27;\\nvoid main()\\n{\\n    u_xlat0.xy = vs_TEXCOORD6.xy / vs_TEXCOORD6.ww;\\n    u_xlat0.xy = u_xlat0.xy * _ScreenParams.xy;\\n    u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.25);\\n    u_xlat16_0.x = texture(_DitherTex, u_xlat0.xy, _GlobalMipBias.x).x;\\n    u_xlat16_1.x = (-u_xlat16_0.x) + _DitherAlpha;\\n    u_xlatb0 = u_xlat16_1.x<0.0;\\n    if(u_xlatb0){discard;}\\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlat16_2.xyz = texture(_ShadowTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat2.xyz = (-u_xlat16_0.xyz) + u_xlat16_2.xyz;\\n    u_xlat26 = u_xlat2.x * _ShadowTexWeight;\\n    u_xlat2.xyz = vec3(_ShadowTexWeight) * u_xlat2.xyz + u_xlat16_0.xyz;\\n    u_xlat16_3.xyz = texture(_ValueTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat16_1.x = u_xlat16_3.z * 2.0 + -1.0;\\n    u_xlat16_9 = _Saturation + _Saturation;\\n    u_xlat16_17 = _Value * 2.0 + -1.0;\\n    u_xlat16_25 = _Contrast + _Contrast;\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_0.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat19 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_0.xyz);\\n    u_xlat19 = u_xlat19 * 0.57735002;\\n    u_xlat16_5.x = (-_HueCosAngle) + 1.0;\\n    u_xlat4.xyz = vec3(u_xlat19) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_13.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz * vec3(u_xlat16_25) + vec3(u_xlat16_17);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_6.x = dot(u_xlat16_13.xyz, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + (-u_xlat16_6.xxx);\\n    u_xlat16_13.xyz = vec3(u_xlat16_9) * u_xlat16_13.xyz + u_xlat16_6.xxx;\\n    u_xlat19 = dot(_SekaiDirectionalLight.xyz, vs_NORMAL0.xyz);\\n    u_xlat19 = u_xlat19 * 0.5 + 0.5;\\n    switch(_FadeMode){\\n        case 0:\\n            u_xlat4.x = _ShadowWidth * (-_SekaiShadowThreshold) + _SekaiShadowThreshold;\\n            u_xlat12.x = u_xlat16_1.x + u_xlat19;\\n            u_xlat12.x = clamp(u_xlat12.x, 0.0, 1.0);\\n            u_xlat12.x = (-u_xlat4.x) + u_xlat12.x;\\n            u_xlat4.x = (-u_xlat4.x) + _SekaiShadowThreshold;\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat4.x = u_xlat12.x / u_xlat4.x;\\n            u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n            u_xlat12.x = u_xlat4.x * u_xlat4.x;\\n            u_xlat4.x = (-u_xlat4.x) * 2.0 + 3.0;\\n            u_xlat27 = (-u_xlat12.x) * u_xlat4.x + 1.0;\\n            break;\\n        case 1:\\n            u_xlat4.x = (-_SekaiShadowThreshold) + 1.0;\\n            u_xlat4.x = u_xlat4.x * _ShadowWidth;\\n            u_xlat19 = u_xlat16_1.x + u_xlat19;\\n            u_xlat19 = clamp(u_xlat19, 0.0, 1.0);\\n            u_xlat19 = u_xlat19 + (-_SekaiShadowThreshold);\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat19 = u_xlat19 / u_xlat4.x;\\n            u_xlat19 = clamp(u_xlat19, 0.0, 1.0);\\n            u_xlat4.x = u_xlat19 * u_xlat19;\\n            u_xlat19 = (-u_xlat19) * 2.0 + 3.0;\\n            u_xlat27 = (-u_xlat4.x) * u_xlat19 + 1.0;\\n            break;\\n        default:\\n            break;\\n    }\\n    u_xlat2.xyz = u_xlat2.xyz * _SekaiShadowColor.xyz + (-u_xlat16_13.xyz);\\n    u_xlat2.xyz = vec3(u_xlat27) * u_xlat2.xyz + u_xlat16_13.xyz;\\n    u_xlat26 = u_xlat27 * u_xlat26 + u_xlat16_0.x;\\n    u_xlat4.xyz = _SekaiShadowColor.xyz * _Shadow1SkinColor.xyz;\\n    u_xlat7.xyz = _SekaiShadowColor.xyz * _Shadow2SkinColor.xyz;\\n    u_xlat16_1.x = u_xlat26 + u_xlat26;\\n    u_xlat16_13.x = u_xlat26 * 2.0 + -1.0;\\n    u_xlat16_13.x = clamp(u_xlat16_13.x, 0.0, 1.0);\\n    u_xlat16_6.xyz = (-_Shadow1SkinColor.xyz) * _SekaiShadowColor.xyz + _DefaultSkinColor.xyz;\\n    u_xlat16_13.xyz = u_xlat16_13.xxx * u_xlat16_6.xyz + u_xlat4.xyz;\\n    u_xlat16_1.x = u_xlat16_1.x;\\n    u_xlat16_1.x = clamp(u_xlat16_1.x, 0.0, 1.0);\\n    u_xlat16_13.xyz = (-_Shadow2SkinColor.xyz) * _SekaiShadowColor.xyz + u_xlat16_13.xyz;\\n    u_xlat16_13.xyz = u_xlat16_1.xxx * u_xlat16_13.xyz + u_xlat7.xyz;\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_13.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat26 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_13.xyz);\\n    u_xlat26 = u_xlat26 * 0.57735002;\\n    u_xlat4.xyz = vec3(u_xlat26) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_5.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_1.xzw = u_xlat16_5.xyz * vec3(u_xlat16_25) + vec3(u_xlat16_17);\\n    u_xlat16_1.xzw = u_xlat16_1.xzw + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_5.x = dot(u_xlat16_1.xzw, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_1.xzw = u_xlat16_1.xzw + (-u_xlat16_5.xxx);\\n    u_xlat16_1.xyz = vec3(u_xlat16_9) * u_xlat16_1.xzw + u_xlat16_5.xxx;\\n    u_xlatb26 = u_xlat16_3.x>=0.5;\\n    u_xlat16_25 = (u_xlatb26) ? 1.0 : 0.0;\\n    u_xlat16_1.xyz = (-u_xlat2.xyz) + u_xlat16_1.xyz;\\n    u_xlat16_1.xyz = vec3(u_xlat16_25) * u_xlat16_1.xyz + u_xlat2.xyz;\\n    u_xlati2 = _CharacterId;\\n    u_xlat10.xyz = _SekaiRimLightColorArray[u_xlati2].www * _SekaiRimLightColorArray[u_xlati2].xyz;\\n    u_xlat3.x = dot(vs_NORMAL0.xyz, vs_TEXCOORD2.xyz);\\n    u_xlat3.z = dot(vs_TEXCOORD2.xyz, _SekaiRimLightArray[u_xlati2].xyz);\\n    u_xlat27 = dot(vs_NORMAL0.xyz, vs_NORMAL0.xyz);\\n    u_xlat27 = inversesqrt(u_xlat27);\\n    u_xlat4.xyz = vec3(u_xlat27) * vs_NORMAL0.xyz;\\n    u_xlat27 = dot(_SekaiRimLightArray[u_xlati2].xyz, _SekaiRimLightArray[u_xlati2].xyz);\\n    u_xlat27 = inversesqrt(u_xlat27);\\n    u_xlat7.xyz = vec3(u_xlat27) * _SekaiRimLightArray[u_xlati2].xyz;\\n    u_xlat27 = dot(u_xlat4.xyz, u_xlat7.xyz);\\n    u_xlat16_25 = -1.0 + _SekaiRimLightShadowSharpnessArray[u_xlati2];\\n    u_xlat16_5.x = 1.0 + (-_SekaiRimLightShadowSharpnessArray[u_xlati2]);\\n    u_xlat4.x = (-u_xlat16_25) + u_xlat16_5.x;\\n    u_xlat12.x = (-u_xlat16_25) + u_xlat27;\\n    u_xlat4.x = float(1.0) / u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n    u_xlat12.x = u_xlat4.x * -2.0 + 3.0;\\n    u_xlat4.x = u_xlat4.x * u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat12.xyz = _SekaiShadowRimLightColorArray[u_xlati2].xyz * _SekaiShadowRimLightColorArray[u_xlati2].www + (-u_xlat10.xyz);\\n    u_xlat10.xyz = u_xlat4.xxx * u_xlat12.xyz + u_xlat10.xyz;\\n    u_xlat3.xz = max(u_xlat3.xz, vec2(0.0, 0.0));\\n    u_xlat3.x = (-u_xlat3.x) + 1.0;\\n    u_xlat16_25 = 10.0 + (-_SekaiRimLightFactor[u_xlati2].x);\\n    u_xlat3.x = log2(u_xlat3.x);\\n    u_xlat3.x = u_xlat16_25 * u_xlat3.x;\\n    u_xlat3.x = exp2(u_xlat3.x);\\n    u_xlat19 = u_xlat3.x * u_xlat3.z + (-u_xlat3.x);\\n    u_xlat3.x = _SekaiRimLightFactor[u_xlati2].w * u_xlat19 + u_xlat3.x;\\n    u_xlat19 = (-u_xlat27) + 0.0500000007;\\n    u_xlati27 = int((0.0<u_xlat19) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati19 = int((u_xlat19<0.0) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati19 = (-u_xlati27) + u_xlati19;\\n    u_xlat19 = float(u_xlati19);\\n    u_xlat19 = u_xlat3.x * u_xlat19 + (-u_xlat3.x);\\n    u_xlat3.x = _SekaiRimLightFactor[u_xlati2].w * u_xlat19 + u_xlat3.x;\\n    u_xlat3.x = u_xlat3.x + (-_RimThreshold);\\n    u_xlat19 = float(1.0) / _SekaiRimLightFactor[u_xlati2].z;\\n    u_xlat3.x = u_xlat19 * u_xlat3.x;\\n    u_xlat3.x = clamp(u_xlat3.x, 0.0, 1.0);\\n    u_xlat19 = u_xlat3.x * -2.0 + 3.0;\\n    u_xlat3.x = u_xlat3.x * u_xlat3.x;\\n    u_xlat3.x = u_xlat3.x * u_xlat19;\\n    u_xlat10.xyz = u_xlat10.xyz * u_xlat3.xxx;\\n    u_xlat3.xzw = u_xlat10.xyz * vs_COLOR0.yyy;\\n    u_xlat16_1.xyz = u_xlat10.xyz * vs_COLOR0.yyy + u_xlat16_1.xyz;\\n    u_xlatb10.xyz = greaterThanEqual(u_xlat16_1.xyzz, vec4(0.5, 0.5, 0.5, 0.5)).xyz;\\n    u_xlat16_5.x = (u_xlatb10.x) ? float(1.0) : float(0.0);\\n    u_xlat16_5.y = (u_xlatb10.y) ? float(1.0) : float(0.0);\\n    u_xlat16_5.z = (u_xlatb10.z) ? float(1.0) : float(0.0);\\n    u_xlat16_6.xyz = u_xlat16_1.xyz + u_xlat16_1.xyz;\\n    u_xlat10.xyz = u_xlat16_6.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati2].xyz;\\n    u_xlat16_1.xyz = (-u_xlat16_1.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = u_xlat16_1.xyz + u_xlat16_1.xyz;\\n    u_xlat4.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati2].xyz);\\n    u_xlat4.xyz = (-u_xlat16_1.xyz) * u_xlat4.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = (-u_xlat16_6.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati2].xyz + u_xlat4.xyz;\\n    u_xlat16_1.xyz = u_xlat16_5.xyz * u_xlat16_1.xyz + u_xlat10.xyz;\\n    u_xlat10.xyz = u_xlat16_1.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati2]);\\n    u_xlat4.xyz = u_xlat10.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_1.xyz = (-u_xlat10.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = u_xlat16_1.xyz + u_xlat16_1.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_1.xyz = (-u_xlat16_1.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat4.xyz * _PartsAmbientColor.xyz + (-u_xlat16_1.xyz);\\n    u_xlat16_1.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_1.xyz;\\n    u_xlatb10.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb10.x){\\n        u_xlat10.xyz = (-vs_TEXCOORD3.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat10.xy = u_xlat10.xy * u_xlat10.xy;\\n        u_xlat10.x = u_xlat10.y + u_xlat10.x;\\n        u_xlat10.x = u_xlat10.z * u_xlat10.z + u_xlat10.x;\\n        u_xlat18 = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat10.x = u_xlat10.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat18 = float(1.0) / u_xlat18;\\n        u_xlat10.x = u_xlat18 * u_xlat10.x;\\n        u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);\\n        u_xlat18 = u_xlat10.x * -2.0 + 3.0;\\n        u_xlat10.x = u_xlat10.x * u_xlat10.x;\\n        u_xlat26 = u_xlat10.x * u_xlat18;\\n        u_xlat10.x = (-u_xlat18) * u_xlat10.x + 1.0;\\n        u_xlat4.xyz = u_xlat16_1.xyz * vec3(u_xlat26);\\n        u_xlat4.xyz = u_xlat4.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat10.xyz = u_xlat10.xxx * u_xlat16_1.xyz + u_xlat4.xyz;\\n    } else {\\n        u_xlat10.xyz = u_xlat16_1.xyz;\\n    }\\n    u_xlat3.xzw = u_xlat3.xzw * _SekaiRimLightFactor[u_xlati2].yyy;\\n    u_xlat3.xyz = u_xlat10.xyz * u_xlat16_3.yyy + u_xlat3.xzw;\\n    u_xlat16_1.x = (-vs_TEXCOORD4) + 1.0;\\n    u_xlat2.x = u_xlat16_1.x * _SekaiFogColor.w;\\n    u_xlat4.xyz = (-u_xlat10.xyz) + _SekaiFogColor.xyz;\\n    u_xlat16_0.xyz = u_xlat2.xxx * u_xlat4.xyz + u_xlat10.xyz;\\n    u_xlat2.x = vs_TEXCOORD5 / vs_TEXCOORD0.w;\\n    u_xlat2.x = u_xlat2.x * 0.5 + 0.5;\\n    u_xlat2.x = (-u_xlat2.x) + 1.0;\\n    u_xlat10.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat10.x = u_xlat10.x + -1.0;\\n    u_xlat10.x = u_xlat10.x * _ProjectionParams.w;\\n    u_xlat2.x = u_xlat10.x * u_xlat2.x + _ProjectionParams.w;\\n    u_xlat2.x = (-_CoCParams.x) * u_xlat2.x + 1.0;\\n    u_xlat2.x = u_xlat2.x * _CoCParams.y;\\n    u_xlat10.x = u_xlat2.x;\\n    u_xlat10.x = clamp(u_xlat10.x, 0.0, 1.0);\\n    u_xlat2.x = max(u_xlat2.x, -1.0);\\n    u_xlat2.x = min(u_xlat2.x, 0.0);\\n    u_xlat2.x = u_xlat2.x + u_xlat10.x;\\n    u_xlat2.x = u_xlat2.x + 1.0;\\n    u_xlat2.x = u_xlat2.x * 0.5;\\n    SV_Target0 = u_xlat16_0;\\n    SV_Target1.x = u_xlat2.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2.xyz = u_xlat3.xyz;\\n    SV_Target2.w = 1.0;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp float vs_TEXCOORD5;\\nout highp vec4 vs_TEXCOORD0;\\nout highp vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout mediump float vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nout highp vec4 vs_TEXCOORD6;\\nvec4 u_xlat0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nvec3 u_xlat2;\\nvec3 u_xlat3;\\nfloat u_xlat4;\\nfloat u_xlat12;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat1 = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat1;\\n    u_xlat2.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat2.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat2.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat12 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat12 = max(u_xlat12, 1.17549435e-38);\\n    u_xlat12 = inversesqrt(u_xlat12);\\n    u_xlat2.xyz = vec3(u_xlat12) * u_xlat2.xyz;\\n    u_xlat12 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat12 = inversesqrt(u_xlat12);\\n    vs_NORMAL0.xyz = vec3(u_xlat12) * u_xlat2.xyz;\\n    vs_TEXCOORD5 = u_xlat1.z;\\n    vs_TEXCOORD0 = u_xlat1;\\n    vs_COLOR0 = in_COLOR0;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat2.xyz = (-u_xlat0.xyz) + _WorldSpaceCameraPos.xyz;\\n    vs_TEXCOORD3.xyz = u_xlat0.xyz;\\n    u_xlatb0 = unity_OrthoParams.w==0.0;\\n    u_xlat3.x = (u_xlatb0) ? u_xlat2.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat3.y = (u_xlatb0) ? u_xlat2.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat3.z = (u_xlatb0) ? u_xlat2.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat0.x = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat0.x = inversesqrt(u_xlat0.x);\\n    vs_TEXCOORD2.xyz = u_xlat0.xxx * u_xlat3.xyz;\\n    u_xlat0.x = u_xlat1.z + _ProjectionParams.y;\\n    u_xlat4 = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat0.x / u_xlat4;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD4 = u_xlat0.x;\\n    u_xlat0.x = u_xlat1.y * _ProjectionParams.x;\\n    u_xlat0.w = u_xlat0.x * 0.5;\\n    u_xlat0.xz = u_xlat1.xw * vec2(0.5, 0.5);\\n    vs_TEXCOORD6.zw = u_xlat1.zw;\\n    vs_TEXCOORD6.xy = u_xlat0.zz + u_xlat0.xw;\\n    return;\\n}\\n\\n\"},\"a58039678263755cf19c80362719d8c9bd6b63e3e459051c438c4fd0190644e3\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _SekaiDirectionalLight;\\nuniform \\tmediump vec4 _SekaiShadowColor;\\nuniform \\tmediump float _SekaiShadowThreshold;\\nuniform \\tvec4 _CoCParams;\\nuniform \\tfloat _SekaiAllLightIntensity;\\nuniform \\tfloat _SekaiCharacterAmbientLightIntensityArray[12];\\nuniform \\tvec4 _SekaiCharacterAmbientLightColorArray[12];\\nuniform \\tvec4 _SekaiRimLightArray[12];\\nuniform \\tvec4 _SekaiRimLightColorArray[12];\\nuniform \\tvec4 _SekaiShadowRimLightColorArray[12];\\nuniform \\tmediump vec4 _SekaiRimLightFactor[12];\\nuniform \\tmediump float _SekaiRimLightShadowSharpnessArray[12];\\nuniform \\tvec3 _SekaiGlobalSpotLightPos;\\nuniform \\tvec4 _SekaiGlobalSpotLightColor;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusNear;\\nuniform \\tfloat _SekaiGlobalSpotLightRadiusFar;\\nuniform \\tint _SekaiGlobalSpotLightEnabled;\\nuniform \\tvec4 _SekaiFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _ShadowTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _ValueTex;\\nin highp vec3 vs_NORMAL0;\\nin highp float vs_TEXCOORD5;\\nin highp vec4 vs_TEXCOORD0;\\nin highp vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD1;\\nin mediump float vs_TEXCOORD4;\\nin highp vec3 vs_TEXCOORD2;\\nin highp vec3 vs_TEXCOORD3;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nlayout(location = 2) out mediump vec4 SV_Target2;\\nmediump vec4 u_xlat16_0;\\nvec3 u_xlat1;\\nmediump vec3 u_xlat16_1;\\nint u_xlati1;\\nvec4 u_xlat2;\\nmediump vec3 u_xlat16_2;\\nmediump vec4 u_xlat16_3;\\nvec3 u_xlat4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nvec3 u_xlat7;\\nvec3 u_xlat9;\\nbvec3 u_xlatb9;\\nmediump float u_xlat16_11;\\nvec3 u_xlat12;\\nmediump vec3 u_xlat16_13;\\nfloat u_xlat17;\\nfloat u_xlat18;\\nint u_xlati18;\\nmediump float u_xlat16_19;\\nfloat u_xlat25;\\nbool u_xlatb25;\\nfloat u_xlat26;\\nint u_xlati26;\\nmediump float u_xlat16_27;\\nvoid main()\\n{\\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlat16_1.xyz = texture(_ShadowTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat1.xyz = (-u_xlat16_0.xyz) + u_xlat16_1.xyz;\\n    u_xlat25 = u_xlat1.x * _ShadowTexWeight;\\n    u_xlat1.xyz = vec3(_ShadowTexWeight) * u_xlat1.xyz + u_xlat16_0.xyz;\\n    u_xlat16_2.xyz = texture(_ValueTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).xyz;\\n    u_xlat16_3.x = u_xlat16_2.z * 2.0 + -1.0;\\n    u_xlat16_11 = _Saturation + _Saturation;\\n    u_xlat16_19 = _Value * 2.0 + -1.0;\\n    u_xlat16_27 = _Contrast + _Contrast;\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_0.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_0.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat18 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_0.xyz);\\n    u_xlat18 = u_xlat18 * 0.57735002;\\n    u_xlat16_5.x = (-_HueCosAngle) + 1.0;\\n    u_xlat4.xyz = vec3(u_xlat18) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_13.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz * vec3(u_xlat16_27) + vec3(u_xlat16_19);\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_6.x = dot(u_xlat16_13.xyz, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_13.xyz = u_xlat16_13.xyz + (-u_xlat16_6.xxx);\\n    u_xlat16_13.xyz = vec3(u_xlat16_11) * u_xlat16_13.xyz + u_xlat16_6.xxx;\\n    u_xlat18 = dot(_SekaiDirectionalLight.xyz, vs_NORMAL0.xyz);\\n    u_xlat18 = u_xlat18 * 0.5 + 0.5;\\n    switch(_FadeMode){\\n        case 0:\\n            u_xlat4.x = _ShadowWidth * (-_SekaiShadowThreshold) + _SekaiShadowThreshold;\\n            u_xlat12.x = u_xlat16_3.x + u_xlat18;\\n            u_xlat12.x = clamp(u_xlat12.x, 0.0, 1.0);\\n            u_xlat12.x = (-u_xlat4.x) + u_xlat12.x;\\n            u_xlat4.x = (-u_xlat4.x) + _SekaiShadowThreshold;\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat4.x = u_xlat12.x / u_xlat4.x;\\n            u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n            u_xlat12.x = u_xlat4.x * u_xlat4.x;\\n            u_xlat4.x = (-u_xlat4.x) * 2.0 + 3.0;\\n            u_xlat26 = (-u_xlat12.x) * u_xlat4.x + 1.0;\\n            break;\\n        case 1:\\n            u_xlat4.x = (-_SekaiShadowThreshold) + 1.0;\\n            u_xlat4.x = u_xlat4.x * _ShadowWidth;\\n            u_xlat18 = u_xlat16_3.x + u_xlat18;\\n            u_xlat18 = clamp(u_xlat18, 0.0, 1.0);\\n            u_xlat18 = u_xlat18 + (-_SekaiShadowThreshold);\\n            u_xlat4.x = max(u_xlat4.x, 9.99999975e-05);\\n            u_xlat18 = u_xlat18 / u_xlat4.x;\\n            u_xlat18 = clamp(u_xlat18, 0.0, 1.0);\\n            u_xlat4.x = u_xlat18 * u_xlat18;\\n            u_xlat18 = (-u_xlat18) * 2.0 + 3.0;\\n            u_xlat26 = (-u_xlat4.x) * u_xlat18 + 1.0;\\n            break;\\n        default:\\n            break;\\n    }\\n    u_xlat1.xyz = u_xlat1.xyz * _SekaiShadowColor.xyz + (-u_xlat16_13.xyz);\\n    u_xlat1.xyz = vec3(u_xlat26) * u_xlat1.xyz + u_xlat16_13.xyz;\\n    u_xlat25 = u_xlat26 * u_xlat25 + u_xlat16_0.x;\\n    u_xlat4.xyz = _SekaiShadowColor.xyz * _Shadow1SkinColor.xyz;\\n    u_xlat7.xyz = _SekaiShadowColor.xyz * _Shadow2SkinColor.xyz;\\n    u_xlat16_3.x = u_xlat25 + u_xlat25;\\n    u_xlat16_13.x = u_xlat25 * 2.0 + -1.0;\\n    u_xlat16_13.x = clamp(u_xlat16_13.x, 0.0, 1.0);\\n    u_xlat16_6.xyz = (-_Shadow1SkinColor.xyz) * _SekaiShadowColor.xyz + _DefaultSkinColor.xyz;\\n    u_xlat16_13.xyz = u_xlat16_13.xxx * u_xlat16_6.xyz + u_xlat4.xyz;\\n    u_xlat16_3.x = u_xlat16_3.x;\\n    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);\\n    u_xlat16_13.xyz = (-_Shadow2SkinColor.xyz) * _SekaiShadowColor.xyz + u_xlat16_13.xyz;\\n    u_xlat16_13.xyz = u_xlat16_3.xxx * u_xlat16_13.xyz + u_xlat7.xyz;\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002);\\n    u_xlat4.xyz = u_xlat16_13.zxy * vec3(0.57735002, 0.57735002, 0.57735002) + (-u_xlat4.zxy);\\n    u_xlat4.xyz = u_xlat4.xyz * vec3(_HueSinAngle);\\n    u_xlat4.xyz = u_xlat16_13.xyz * vec3(vec3(_HueCosAngle, _HueCosAngle, _HueCosAngle)) + u_xlat4.xyz;\\n    u_xlat25 = dot(vec3(0.57735002, 0.57735002, 0.57735002), u_xlat16_13.xyz);\\n    u_xlat25 = u_xlat25 * 0.57735002;\\n    u_xlat4.xyz = vec3(u_xlat25) * u_xlat16_5.xxx + u_xlat4.xyz;\\n    u_xlat16_5.xyz = u_xlat4.xyz + vec3(-0.5, -0.5, -0.5);\\n    u_xlat16_3.xzw = u_xlat16_5.xyz * vec3(u_xlat16_27) + vec3(u_xlat16_19);\\n    u_xlat16_3.xzw = u_xlat16_3.xzw + vec3(0.5, 0.5, 0.5);\\n    u_xlat16_5.x = dot(u_xlat16_3.xzw, vec3(0.219999999, 0.707000017, 0.0710000023));\\n    u_xlat16_3.xzw = u_xlat16_3.xzw + (-u_xlat16_5.xxx);\\n    u_xlat16_3.xyz = vec3(u_xlat16_11) * u_xlat16_3.xzw + u_xlat16_5.xxx;\\n    u_xlatb25 = u_xlat16_2.x>=0.5;\\n    u_xlat16_27 = (u_xlatb25) ? 1.0 : 0.0;\\n    u_xlat16_3.xyz = (-u_xlat1.xyz) + u_xlat16_3.xyz;\\n    u_xlat16_3.xyz = vec3(u_xlat16_27) * u_xlat16_3.xyz + u_xlat1.xyz;\\n    u_xlati1 = _CharacterId;\\n    u_xlat9.xyz = _SekaiRimLightColorArray[u_xlati1].www * _SekaiRimLightColorArray[u_xlati1].xyz;\\n    u_xlat2.x = dot(vs_NORMAL0.xyz, vs_TEXCOORD2.xyz);\\n    u_xlat2.z = dot(vs_TEXCOORD2.xyz, _SekaiRimLightArray[u_xlati1].xyz);\\n    u_xlat26 = dot(vs_NORMAL0.xyz, vs_NORMAL0.xyz);\\n    u_xlat26 = inversesqrt(u_xlat26);\\n    u_xlat4.xyz = vec3(u_xlat26) * vs_NORMAL0.xyz;\\n    u_xlat26 = dot(_SekaiRimLightArray[u_xlati1].xyz, _SekaiRimLightArray[u_xlati1].xyz);\\n    u_xlat26 = inversesqrt(u_xlat26);\\n    u_xlat7.xyz = vec3(u_xlat26) * _SekaiRimLightArray[u_xlati1].xyz;\\n    u_xlat26 = dot(u_xlat4.xyz, u_xlat7.xyz);\\n    u_xlat16_27 = -1.0 + _SekaiRimLightShadowSharpnessArray[u_xlati1];\\n    u_xlat16_5.x = 1.0 + (-_SekaiRimLightShadowSharpnessArray[u_xlati1]);\\n    u_xlat4.x = (-u_xlat16_27) + u_xlat16_5.x;\\n    u_xlat12.x = u_xlat26 + (-u_xlat16_27);\\n    u_xlat4.x = float(1.0) / u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat4.x = clamp(u_xlat4.x, 0.0, 1.0);\\n    u_xlat12.x = u_xlat4.x * -2.0 + 3.0;\\n    u_xlat4.x = u_xlat4.x * u_xlat4.x;\\n    u_xlat4.x = u_xlat4.x * u_xlat12.x;\\n    u_xlat12.xyz = _SekaiShadowRimLightColorArray[u_xlati1].xyz * _SekaiShadowRimLightColorArray[u_xlati1].www + (-u_xlat9.xyz);\\n    u_xlat9.xyz = u_xlat4.xxx * u_xlat12.xyz + u_xlat9.xyz;\\n    u_xlat2.xz = max(u_xlat2.xz, vec2(0.0, 0.0));\\n    u_xlat2.x = (-u_xlat2.x) + 1.0;\\n    u_xlat16_27 = 10.0 + (-_SekaiRimLightFactor[u_xlati1].x);\\n    u_xlat2.x = log2(u_xlat2.x);\\n    u_xlat2.x = u_xlat2.x * u_xlat16_27;\\n    u_xlat2.x = exp2(u_xlat2.x);\\n    u_xlat18 = u_xlat2.x * u_xlat2.z + (-u_xlat2.x);\\n    u_xlat2.x = _SekaiRimLightFactor[u_xlati1].w * u_xlat18 + u_xlat2.x;\\n    u_xlat18 = (-u_xlat26) + 0.0500000007;\\n    u_xlati26 = int((0.0<u_xlat18) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati18 = int((u_xlat18<0.0) ? 0xFFFFFFFFu : uint(0));\\n    u_xlati18 = (-u_xlati26) + u_xlati18;\\n    u_xlat18 = float(u_xlati18);\\n    u_xlat18 = u_xlat2.x * u_xlat18 + (-u_xlat2.x);\\n    u_xlat2.x = _SekaiRimLightFactor[u_xlati1].w * u_xlat18 + u_xlat2.x;\\n    u_xlat2.x = u_xlat2.x + (-_RimThreshold);\\n    u_xlat18 = float(1.0) / _SekaiRimLightFactor[u_xlati1].z;\\n    u_xlat2.x = u_xlat18 * u_xlat2.x;\\n    u_xlat2.x = clamp(u_xlat2.x, 0.0, 1.0);\\n    u_xlat18 = u_xlat2.x * -2.0 + 3.0;\\n    u_xlat2.x = u_xlat2.x * u_xlat2.x;\\n    u_xlat2.x = u_xlat2.x * u_xlat18;\\n    u_xlat9.xyz = u_xlat9.xyz * u_xlat2.xxx;\\n    u_xlat2.xzw = u_xlat9.xyz * vs_COLOR0.yyy;\\n    u_xlat16_3.xyz = u_xlat9.xyz * vs_COLOR0.yyy + u_xlat16_3.xyz;\\n    u_xlatb9.xyz = greaterThanEqual(u_xlat16_3.xyzz, vec4(0.5, 0.5, 0.5, 0.5)).xyz;\\n    u_xlat16_5.x = (u_xlatb9.x) ? float(1.0) : float(0.0);\\n    u_xlat16_5.y = (u_xlatb9.y) ? float(1.0) : float(0.0);\\n    u_xlat16_5.z = (u_xlatb9.z) ? float(1.0) : float(0.0);\\n    u_xlat16_6.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat9.xyz = u_xlat16_6.xyz * _SekaiCharacterAmbientLightColorArray[u_xlati1].xyz;\\n    u_xlat16_3.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat4.xyz = vec3(1.0, 1.0, 1.0) + (-_SekaiCharacterAmbientLightColorArray[u_xlati1].xyz);\\n    u_xlat4.xyz = (-u_xlat16_3.xyz) * u_xlat4.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = (-u_xlat16_6.xyz) * _SekaiCharacterAmbientLightColorArray[u_xlati1].xyz + u_xlat4.xyz;\\n    u_xlat16_3.xyz = u_xlat16_5.xyz * u_xlat16_3.xyz + u_xlat9.xyz;\\n    u_xlat9.xyz = u_xlat16_3.xyz * vec3(_SekaiCharacterAmbientLightIntensityArray[u_xlati1]);\\n    u_xlat4.xyz = u_xlat9.xyz * vec3(_SekaiAllLightIntensity);\\n    u_xlat16_3.xyz = (-u_xlat9.xyz) * vec3(_SekaiAllLightIntensity) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = u_xlat16_3.xyz + u_xlat16_3.xyz;\\n    u_xlat16_5.xyz = (-_PartsAmbientColor.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_3.xyz = (-u_xlat16_3.xyz) * u_xlat16_5.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_5.xyz = u_xlat4.xyz * _PartsAmbientColor.xyz + (-u_xlat16_3.xyz);\\n    u_xlat16_3.xyz = _PartsAmbientColor.www * u_xlat16_5.xyz + u_xlat16_3.xyz;\\n    u_xlatb9.x = 0<_SekaiGlobalSpotLightEnabled;\\n    if(u_xlatb9.x){\\n        u_xlat9.xyz = (-vs_TEXCOORD3.xyz) + _SekaiGlobalSpotLightPos.xyz;\\n        u_xlat9.xy = u_xlat9.xy * u_xlat9.xy;\\n        u_xlat9.x = u_xlat9.y + u_xlat9.x;\\n        u_xlat9.x = u_xlat9.z * u_xlat9.z + u_xlat9.x;\\n        u_xlat17 = (-_SekaiGlobalSpotLightRadiusNear) + _SekaiGlobalSpotLightRadiusFar;\\n        u_xlat9.x = u_xlat9.x + (-_SekaiGlobalSpotLightRadiusNear);\\n        u_xlat17 = float(1.0) / u_xlat17;\\n        u_xlat9.x = u_xlat17 * u_xlat9.x;\\n        u_xlat9.x = clamp(u_xlat9.x, 0.0, 1.0);\\n        u_xlat17 = u_xlat9.x * -2.0 + 3.0;\\n        u_xlat9.x = u_xlat9.x * u_xlat9.x;\\n        u_xlat25 = u_xlat9.x * u_xlat17;\\n        u_xlat9.x = (-u_xlat17) * u_xlat9.x + 1.0;\\n        u_xlat4.xyz = u_xlat16_3.xyz * vec3(u_xlat25);\\n        u_xlat4.xyz = u_xlat4.xyz * _SekaiGlobalSpotLightColor.xyz;\\n        u_xlat9.xyz = u_xlat9.xxx * u_xlat16_3.xyz + u_xlat4.xyz;\\n    } else {\\n        u_xlat9.xyz = u_xlat16_3.xyz;\\n    }\\n    u_xlat2.xzw = u_xlat2.xzw * _SekaiRimLightFactor[u_xlati1].yyy;\\n    u_xlat2.xyz = u_xlat9.xyz * u_xlat16_2.yyy + u_xlat2.xzw;\\n    u_xlat16_3.x = (-vs_TEXCOORD4) + 1.0;\\n    u_xlat1.x = u_xlat16_3.x * _SekaiFogColor.w;\\n    u_xlat4.xyz = (-u_xlat9.xyz) + _SekaiFogColor.xyz;\\n    u_xlat16_0.xyz = u_xlat1.xxx * u_xlat4.xyz + u_xlat9.xyz;\\n    u_xlat1.x = vs_TEXCOORD5 / vs_TEXCOORD0.w;\\n    u_xlat1.x = u_xlat1.x * 0.5 + 0.5;\\n    u_xlat1.x = (-u_xlat1.x) + 1.0;\\n    u_xlat9.x = _ProjectionParams.z / _ProjectionParams.y;\\n    u_xlat9.x = u_xlat9.x + -1.0;\\n    u_xlat9.x = u_xlat9.x * _ProjectionParams.w;\\n    u_xlat1.x = u_xlat9.x * u_xlat1.x + _ProjectionParams.w;\\n    u_xlat1.x = (-_CoCParams.x) * u_xlat1.x + 1.0;\\n    u_xlat1.x = u_xlat1.x * _CoCParams.y;\\n    u_xlat9.x = u_xlat1.x;\\n    u_xlat9.x = clamp(u_xlat9.x, 0.0, 1.0);\\n    u_xlat1.x = max(u_xlat1.x, -1.0);\\n    u_xlat1.x = min(u_xlat1.x, 0.0);\\n    u_xlat1.x = u_xlat1.x + u_xlat9.x;\\n    u_xlat1.x = u_xlat1.x + 1.0;\\n    u_xlat1.x = u_xlat1.x * 0.5;\\n    SV_Target0 = u_xlat16_0;\\n    SV_Target1.x = u_xlat1.x;\\n    SV_Target1.yzw = vec3(0.0, 0.0, 1.0);\\n    SV_Target2.xyz = u_xlat2.xyz;\\n    SV_Target2.w = 1.0;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 _SekaiFogFactor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4                _DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4                _Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4                _PartsAmbientColor;\\n\\tUNITY_UNIFORM float                _ShadowTexWeight;\\n\\tUNITY_UNIFORM int                _FadeMode;\\n\\tUNITY_UNIFORM float                _ShadowWidth;\\n\\tUNITY_UNIFORM mediump float                _HueSinAngle;\\n\\tUNITY_UNIFORM mediump float                _HueCosAngle;\\n\\tUNITY_UNIFORM mediump float                _Saturation;\\n\\tUNITY_UNIFORM mediump float                _Value;\\n\\tUNITY_UNIFORM mediump float                _Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp float vs_TEXCOORD5;\\nout highp vec4 vs_TEXCOORD0;\\nout highp vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout mediump float vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nvec3 u_xlat0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nvec3 u_xlat2;\\nfloat u_xlat9;\\nvoid main()\\n{\\n    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;\\n    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;\\n    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat1 = u_xlat1 + hlslcc_mtx4x4unity_MatrixVP[3];\\n    gl_Position = u_xlat1;\\n    u_xlat2.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat2.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat2.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat9 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat9 = max(u_xlat9, 1.17549435e-38);\\n    u_xlat9 = inversesqrt(u_xlat9);\\n    u_xlat2.xyz = vec3(u_xlat9) * u_xlat2.xyz;\\n    u_xlat9 = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat9 = inversesqrt(u_xlat9);\\n    vs_NORMAL0.xyz = vec3(u_xlat9) * u_xlat2.xyz;\\n    vs_TEXCOORD5 = u_xlat1.z;\\n    vs_TEXCOORD0 = u_xlat1;\\n    u_xlat9 = u_xlat1.z + _ProjectionParams.y;\\n    vs_COLOR0 = in_COLOR0;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlat1.xyz = (-u_xlat0.xyz) + _WorldSpaceCameraPos.xyz;\\n    vs_TEXCOORD3.xyz = u_xlat0.xyz;\\n    u_xlatb0 = unity_OrthoParams.w==0.0;\\n    u_xlat2.x = (u_xlatb0) ? u_xlat1.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat2.y = (u_xlatb0) ? u_xlat1.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat2.z = (u_xlatb0) ? u_xlat1.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat0.x = dot(u_xlat2.xyz, u_xlat2.xyz);\\n    u_xlat0.x = inversesqrt(u_xlat0.x);\\n    vs_TEXCOORD2.xyz = u_xlat0.xxx * u_xlat2.xyz;\\n    u_xlat0.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0.x = u_xlat9 / u_xlat0.x;\\n    u_xlat0.x = u_xlat0.x * _ProjectionParams.z;\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-_SekaiFogFactor.y) * u_xlat0.x + _SekaiFogFactor.x;\\n    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);\\n    vs_TEXCOORD4 = u_xlat0.x;\\n    return;\\n}\\n\\n\"},\"ae551fb585e5bbd7b9373fafcc4c5fc97bac5922e1a8f350b2ba2b2dc55a7d05\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec2 _GlobalMipBias;\\nuniform \\tfloat rp_GlobalIntensity;\\nuniform \\tvec4 rp_DirectionalLightVector;\\nuniform \\tmediump vec4 rp_CharacterAmbientLightColorArray[10];\\nuniform \\tfloat rp_CharacterAmbientLightIntensityArray[10];\\nuniform \\tfloat rp_CharacterAmbientLightBrightnessArray[10];\\nuniform \\tmediump vec4 rp_CharacterRimColor;\\nuniform \\tvec4 rp_CharacterRimVector;\\nuniform \\tfloat rp_CharacterRimIntensity;\\nuniform \\tfloat rp_CharacterRimBrightness;\\nuniform \\tmediump vec4 rp_FogColor;\\nuniform \\tmediump vec4 rp_HeightFogColor;\\nuniform \\tmediump vec4 _EmissionColor;\\nuniform \\tfloat _Emission;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_PartsAmbientColor;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowTexWeight;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_FadeMode;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowWidth;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_HueSinAngle;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_HueCosAngle;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Saturation;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Value;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nUNITY_LOCATION(1) uniform mediump sampler2D _ShadowTex;\\nUNITY_LOCATION(2) uniform mediump sampler2D _ValueTex;\\nin highp vec3 vs_NORMAL0;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD1;\\nin highp vec2 vs_TEXCOORD4;\\nin highp vec3 vs_TEXCOORD2;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nlayout(location = 1) out mediump vec4 SV_Target1;\\nvec3 u_xlat0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nmediump vec2 u_xlat16_1;\\nvec4 u_xlat2;\\nmediump vec4 u_xlat16_2;\\nvec3 u_xlat3;\\nmediump vec4 u_xlat16_3;\\nmediump vec3 u_xlat16_4;\\nmediump vec3 u_xlat16_5;\\nmediump vec3 u_xlat16_6;\\nmediump vec3 u_xlat16_7;\\nfloat u_xlat8;\\nvec3 u_xlat9;\\nbvec3 u_xlatb9;\\nfloat u_xlat24;\\nint u_xlati24;\\nbool u_xlatb24;\\nvoid main()\\n{\\n    u_xlat0.x = dot(vs_TEXCOORD2.xyz, vs_NORMAL0.xyz);\\n    u_xlat0.x = max(u_xlat0.x, 0.0);\\n    u_xlat0.x = (-u_xlat0.x) + 1.0;\\n    u_xlat0.x = log2(u_xlat0.x);\\n    u_xlat8 = (-rp_CharacterRimIntensity) + 10.0;\\n    u_xlat0.x = u_xlat0.x * u_xlat8;\\n    u_xlat0.x = exp2(u_xlat0.x);\\n    u_xlat8 = dot(vs_TEXCOORD2.xyz, rp_CharacterRimVector.xyz);\\n    u_xlat8 = max(u_xlat8, 0.0);\\n    u_xlat0.x = u_xlat8 * u_xlat0.x;\\n    u_xlat8 = dot(rp_CharacterRimVector.xyz, vs_NORMAL0.xyz);\\n    u_xlat0.x = u_xlat8 * u_xlat0.x;\\n    u_xlatb0 = u_xlat0.x>=_RimThreshold;\\n    u_xlat0.x = u_xlatb0 ? 1.0 : float(0.0);\\n    u_xlat0.x = u_xlat0.x * vs_COLOR0.y;\\n    u_xlat0.xyz = u_xlat0.xxx * rp_CharacterRimColor.xyz;\\n    u_xlat0.xyz = u_xlat0.xyz * vec3(rp_GlobalIntensity);\\n    u_xlat24 = dot(rp_DirectionalLightVector.xyz, vs_NORMAL0.xyz);\\n    u_xlat24 = u_xlat24 * 0.5 + 0.5;\\n    u_xlat16_1.xy = texture(_ValueTex, vs_TEXCOORD1.xy, _GlobalMipBias.x).yz;\\n    u_xlat16_2.x = u_xlat16_1.y * 2.0 + -1.0;\\n    u_xlat24 = u_xlat24 + u_xlat16_2.x;\\n    u_xlat24 = clamp(u_xlat24, 0.0, 1.0);\\n    u_xlatb24 = u_xlat24>=0.40625;\\n    u_xlat24 = u_xlatb24 ? 1.0 : float(0.0);\\n    u_xlat16_2 = texture(_MainTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlat16_3 = texture(_ShadowTex, vs_TEXCOORD1.xy, _GlobalMipBias.x);\\n    u_xlat2 = u_xlat16_2 + (-u_xlat16_3);\\n    u_xlat2 = vec4(u_xlat24) * u_xlat2 + u_xlat16_3;\\n    u_xlatb9.xyz = greaterThanEqual(u_xlat2.xyzz, vec4(0.5, 0.5, 0.5, 0.5)).xyz;\\n    u_xlat16_4.x = (u_xlatb9.x) ? float(1.0) : float(0.0);\\n    u_xlat16_4.y = (u_xlatb9.y) ? float(1.0) : float(0.0);\\n    u_xlat16_4.z = (u_xlatb9.z) ? float(1.0) : float(0.0);\\n    u_xlat16_5.xyz = u_xlat2.xyz + u_xlat2.xyz;\\n    u_xlat16_6.xyz = (-u_xlat2.xyz) + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = u_xlat16_6.xyz + u_xlat16_6.xyz;\\n    u_xlati24 = _CharacterId;\\n    u_xlat16_7.xyz = vec3(1.0, 1.0, 1.0) + (-rp_CharacterAmbientLightColorArray[u_xlati24].xyz);\\n    u_xlat16_6.xyz = (-u_xlat16_6.xyz) * u_xlat16_7.xyz + vec3(1.0, 1.0, 1.0);\\n    u_xlat16_6.xyz = (-u_xlat16_5.xyz) * rp_CharacterAmbientLightColorArray[u_xlati24].xyz + u_xlat16_6.xyz;\\n    u_xlat16_5.xyz = u_xlat16_5.xyz * rp_CharacterAmbientLightColorArray[u_xlati24].xyz;\\n    u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat16_6.xyz + u_xlat16_5.xyz;\\n    u_xlat9.xyz = u_xlat16_4.xyz * vec3(rp_CharacterAmbientLightIntensityArray[u_xlati24]);\\n    u_xlat3.xyz = rp_CharacterAmbientLightColorArray[u_xlati24].xyz * vec3(rp_CharacterAmbientLightBrightnessArray[u_xlati24]);\\n    u_xlat3.xyz = u_xlat3.xyz * vec3(0.200000003, 0.200000003, 0.200000003);\\n    u_xlat3.xyz = u_xlat0.xyz * vec3(vec3(rp_CharacterRimBrightness, rp_CharacterRimBrightness, rp_CharacterRimBrightness)) + u_xlat3.xyz;\\n    u_xlat16_4.xyz = u_xlat9.xyz * vec3(rp_GlobalIntensity) + u_xlat0.xyz;\\n    u_xlat0.xyz = u_xlat3.xyz * vec3(rp_GlobalIntensity);\\n    u_xlat9.xyz = (-u_xlat16_4.xyz) + rp_FogColor.xyz;\\n    u_xlat9.xyz = vs_TEXCOORD4.xxx * u_xlat9.xyz + u_xlat16_4.xyz;\\n    u_xlat3.xyz = (-u_xlat9.xyz) + rp_HeightFogColor.xyz;\\n    u_xlat9.xyz = vs_TEXCOORD4.yyy * u_xlat3.xyz + u_xlat9.xyz;\\n    u_xlat3.xyz = (-u_xlat9.xyz) + _EmissionColor.xyz;\\n    u_xlat2.xyz = vec3(_Emission) * u_xlat3.xyz + u_xlat9.xyz;\\n    u_xlat16_4.x = u_xlat16_1.x * u_xlat2.w;\\n    u_xlat1.w = u_xlat16_4.x * rp_GlobalIntensity;\\n    SV_Target0 = u_xlat2;\\n    u_xlat3.xyz = _EmissionColor.xyz * vec3(0.200000003, 0.200000003, 0.200000003) + (-u_xlat0.xyz);\\n    u_xlat1.xyz = vec3(_Emission) * u_xlat3.xyz + u_xlat0.xyz;\\n    SV_Target1 = u_xlat1;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec3 _WorldSpaceCameraPos;\\nuniform \\tvec4 _ProjectionParams;\\nuniform \\tvec4 _ZBufferParams;\\nuniform \\tvec4 unity_OrthoParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixV[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tvec2 rp_FogFactor;\\nuniform \\tmediump vec4 rp_FogColor;\\nuniform \\tvec2 rp_HeightFogFactor;\\nuniform \\tmediump vec4 rp_HeightFogColor;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(1) uniform UnityPerDraw {\\n#endif\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\\n\\tUNITY_UNIFORM vec4                hlslcc_mtx4x4unity_WorldToObject[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\nUNITY_BINDING(0) uniform UnityPerMaterial {\\n#endif\\n\\tUNITY_UNIFORM vec4                _MainTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ShadowTex_ST;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_ValueTex_ST;\\n\\tUNITY_UNIFORM float                _RimThreshold;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineWidth;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_OutlineL;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_DefaultSkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow1SkinColor;\\n\\tUNITY_UNIFORM vec4 Xhlslcc_UnusedX_Shadow2SkinColor;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_CharacterReflectionOff;\\n\\tUNITY_UNIFORM int                _CharacterId;\\n\\tUNITY_UNIFORM mediump vec4 Xhlslcc_UnusedX_PartsAmbientColor;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowTexWeight;\\n\\tUNITY_UNIFORM int Xhlslcc_UnusedX_FadeMode;\\n\\tUNITY_UNIFORM float Xhlslcc_UnusedX_ShadowWidth;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_HueSinAngle;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_HueCosAngle;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Saturation;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Value;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_Contrast;\\n\\tUNITY_UNIFORM mediump float Xhlslcc_UnusedX_IsAccessory;\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n};\\n#endif\\nin highp vec4 in_POSITION0;\\nin highp vec3 in_NORMAL0;\\nin mediump vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout highp vec3 vs_NORMAL0;\\nout highp vec4 vs_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD1;\\nout highp vec2 vs_TEXCOORD4;\\nout highp vec3 vs_TEXCOORD2;\\nout highp vec3 vs_TEXCOORD3;\\nfloat u_xlat0;\\nbool u_xlatb0;\\nvec4 u_xlat1;\\nvec4 u_xlat2;\\nvec3 u_xlat3;\\nvec3 u_xlat4;\\nfloat u_xlat7;\\nfloat u_xlat14;\\nvoid main()\\n{\\n    u_xlat0 = in_COLOR0.z * 0.100000001;\\n    u_xlat4.x = (-_ProjectionParams.y) + _ProjectionParams.z;\\n    u_xlat0 = u_xlat0 / u_xlat4.x;\\n    u_xlat1 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat1;\\n    u_xlat2 = hlslcc_mtx4x4unity_ObjectToWorld[3] * in_POSITION0.wwww + u_xlat1;\\n    u_xlat4.xyz = u_xlat1.xyz + hlslcc_mtx4x4unity_ObjectToWorld[3].xyz;\\n    u_xlat4.xyz = (-u_xlat4.xyz) + _WorldSpaceCameraPos.xyz;\\n    u_xlat1 = u_xlat2.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat2.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat2.zzzz + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat2.wwww + u_xlat1;\\n    u_xlat14 = u_xlat1.z / u_xlat1.w;\\n    u_xlat14 = _ZBufferParams.x * u_xlat14 + _ZBufferParams.y;\\n    u_xlat14 = float(1.0) / u_xlat14;\\n    u_xlat3.x = (-unity_OrthoParams.w) + 1.0;\\n    u_xlat14 = u_xlat14 * u_xlat3.x;\\n    u_xlat14 = u_xlat1.z * unity_OrthoParams.w + u_xlat14;\\n    u_xlat14 = (-u_xlat0) * 0.5 + u_xlat14;\\n    u_xlat0 = u_xlat0 * 0.5;\\n    u_xlat0 = (-u_xlat0) * _ProjectionParams.x + u_xlat1.z;\\n    u_xlat7 = u_xlat14 * _ZBufferParams.x;\\n    u_xlat14 = (-_ZBufferParams.y) * u_xlat14 + 1.0;\\n    u_xlat14 = u_xlat14 / u_xlat7;\\n    u_xlat14 = u_xlat1.w * u_xlat14;\\n    u_xlat14 = u_xlat3.x * u_xlat14;\\n    gl_Position.z = u_xlat0 * unity_OrthoParams.w + u_xlat14;\\n    gl_Position.xyw = u_xlat1.xyw;\\n    u_xlat3.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);\\n    u_xlat3.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);\\n    u_xlat3.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);\\n    u_xlat0 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat0 = max(u_xlat0, 1.17549435e-38);\\n    u_xlat0 = inversesqrt(u_xlat0);\\n    u_xlat3.xyz = vec3(u_xlat0) * u_xlat3.xyz;\\n    u_xlat0 = dot(u_xlat3.xyz, u_xlat3.xyz);\\n    u_xlat0 = inversesqrt(u_xlat0);\\n    vs_NORMAL0.xyz = vec3(u_xlat0) * u_xlat3.xyz;\\n    vs_TEXCOORD0 = u_xlat1;\\n    u_xlat0 = u_xlat1.z + _ProjectionParams.y;\\n    vs_COLOR0 = in_COLOR0;\\n    u_xlat1.x = _ProjectionParams.y + _ProjectionParams.z;\\n    u_xlat0 = u_xlat0 / u_xlat1.x;\\n    u_xlat0 = u_xlat0 * _ProjectionParams.z;\\n    u_xlat0 = max(u_xlat0, 0.0);\\n    u_xlat0 = (-rp_FogFactor.xxxy.w) * u_xlat0 + rp_FogFactor.xxxy.z;\\n    u_xlat0 = clamp(u_xlat0, 0.0, 1.0);\\n    u_xlat0 = (-u_xlat0) + 1.0;\\n    vs_TEXCOORD4.x = u_xlat0 * rp_FogColor.w;\\n    u_xlat0 = u_xlat2.y + (-rp_HeightFogFactor.x);\\n    vs_TEXCOORD3.xyz = u_xlat2.xyz;\\n    u_xlat0 = u_xlat0 * rp_HeightFogFactor.y;\\n    u_xlat0 = clamp(u_xlat0, 0.0, 1.0);\\n    vs_TEXCOORD4.y = u_xlat0 * rp_HeightFogColor.w;\\n    vs_TEXCOORD1.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    u_xlatb0 = unity_OrthoParams.w==0.0;\\n    u_xlat1.x = (u_xlatb0) ? u_xlat4.x : hlslcc_mtx4x4unity_MatrixV[0].z;\\n    u_xlat1.y = (u_xlatb0) ? u_xlat4.y : hlslcc_mtx4x4unity_MatrixV[1].z;\\n    u_xlat1.z = (u_xlatb0) ? u_xlat4.z : hlslcc_mtx4x4unity_MatrixV[2].z;\\n    u_xlat0 = dot(u_xlat1.xyz, u_xlat1.xyz);\\n    u_xlat0 = inversesqrt(u_xlat0);\\n    vs_TEXCOORD2.xyz = vec3(u_xlat0) * u_xlat1.xyz;\\n    return;\\n}\\n\\n\"}}"), t = [
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
		default: {
			dimension: 2,
			name: "white"
		},
		flags: 0,
		name: "_ShadowTex",
		type: 4
	},
	{
		default: {
			dimension: 2,
			name: "black"
		},
		flags: 0,
		name: "_ValueTex",
		type: 4
	},
	{
		default: .001,
		flags: 0,
		name: "_OutlineWidth",
		type: 2
	},
	{
		default: .5,
		flags: 0,
		name: "_OutlineL",
		type: 3
	},
	{
		default: .2,
		flags: 0,
		name: "_RimThreshold",
		type: 3
	},
	{
		default: 0,
		flags: 1,
		name: "_CharacterId",
		type: 2
	},
	{
		default: [
			.9921875,
			.9609375,
			.921875,
			1
		],
		flags: 1,
		name: "_DefaultSkinColor",
		type: 0
	},
	{
		default: [
			.890625,
			.76953125,
			.796875,
			1
		],
		flags: 1,
		name: "_Shadow1SkinColor",
		type: 0
	},
	{
		default: [
			.796875,
			.59375,
			.63671875,
			1
		],
		flags: 1,
		name: "_Shadow2SkinColor",
		type: 0
	},
	{
		default: 0,
		flags: 1,
		name: "_CharacterReflectionOff",
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
		name: "_PartsAmbientColor",
		type: 0
	},
	{
		default: 1,
		flags: 1,
		name: "_ShadowTexWeight",
		type: 3
	},
	{
		default: 0,
		flags: 1,
		name: "_FadeMode",
		type: 2
	},
	{
		default: 0,
		flags: 1,
		name: "_ShadowWidth",
		type: 3
	},
	{
		default: 0,
		flags: 1,
		name: "_FadeMode",
		type: 2
	},
	{
		default: 0,
		flags: 1,
		name: "_ShadowWidth",
		type: 3
	},
	{
		default: 1,
		flags: 1,
		name: "_HueCosAngle",
		type: 2
	},
	{
		default: 0,
		flags: 1,
		name: "_HueSinAngle",
		type: 2
	},
	{
		default: .5,
		flags: 1,
		name: "_Saturation",
		type: 3
	},
	{
		default: .5,
		flags: 1,
		name: "_Value",
		type: 3
	},
	{
		default: .5,
		flags: 1,
		name: "_Contrast",
		type: 3
	},
	{
		default: 0,
		flags: 1,
		name: "_IsAccessory",
		type: 2
	}
], n = "Sekai/Live/Accessory/Toon", r = [{
	lod: 300,
	passes: [
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "BASE",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "a58039678263755cf19c80362719d8c9bd6b63e3e459051c438c4fd0190644e3",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "96bb4ec99476b5e5d98fba2f9f35d62f0da965cf0eed70e51395b931c513d7de",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "OUTLINE",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
					value: 1
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
					value: 2
				},
				zWrite: {
					property: null,
					value: 1
				}
			},
			tags: {
				LIGHTMODE: "SekaiOutline",
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "49fcefee865acd9ac5c729409b9b1e0186983fec2fc06c6a9655499c8a458350",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "MONITOR",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
				program: "04766c006846d2f2a4054d3ded16d1b78f84b783052ed2292e5c65364c7765e7",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "3335b052fefea563fd011b8f83a70ff3fb664b5aa3ce11449ed2b6b2b68df3d0",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "BASE-RP",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
				program: "ae551fb585e5bbd7b9373fafcc4c5fc97bac5922e1a8f350b2ba2b2dc55a7d05",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "BASE-RP-OVER",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
							value: 1
						},
						destBlendAlpha: {
							property: null,
							value: 1
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
				program: "309549705cf937eabc0f2dce122bf3f2a24e88ed3048b5ce4b1e1326de58ae7d",
				shaderRequirements: 33
			}]
		}
	],
	tags: {
		QUEUE: "Geometry",
		RenderType: "Opaque"
	}
}, {
	lod: 100,
	passes: [
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "BASE",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
				QUEUE: "Geometry",
				RenderType: "Opaque"
			},
			variants: [{
				keywords: [],
				program: "a58039678263755cf19c80362719d8c9bd6b63e3e459051c438c4fd0190644e3",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "96bb4ec99476b5e5d98fba2f9f35d62f0da965cf0eed70e51395b931c513d7de",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: ["USE_DITHER_ALPHA"],
			name: "MONITOR",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
				program: "04766c006846d2f2a4054d3ded16d1b78f84b783052ed2292e5c65364c7765e7",
				shaderRequirements: 33
			}, {
				keywords: ["USE_DITHER_ALPHA"],
				program: "3335b052fefea563fd011b8f83a70ff3fb664b5aa3ce11449ed2b6b2b68df3d0",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "BASE-RP",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
				program: "ae551fb585e5bbd7b9373fafcc4c5fc97bac5922e1a8f350b2ba2b2dc55a7d05",
				shaderRequirements: 33
			}]
		},
		{
			keywordSpace: [],
			name: "BASE-RP-OVER",
			owner: "Hidden/Sekai/Live/Accessory/Toon",
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
							value: 1
						},
						destBlendAlpha: {
							property: null,
							value: 1
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
				program: "309549705cf937eabc0f2dce122bf3f2a24e88ed3048b5ce4b1e1326de58ae7d",
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
