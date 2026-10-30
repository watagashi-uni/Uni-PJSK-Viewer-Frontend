import { A as e, C as t, E as n, I as r, L as i, R as a, S as o, T as s, _ as c, c as l, i as u, k as d, l as f, n as p, o as m, r as h, s as g, t as _, v, w as y, x as b, y as x } from "./unityPrefabRuntime-BiYdXsAt.js";
import { a as S, c as ee, i as C, n as te, r as w, s as ne } from "./partBuilder-BINYc9p5.js";
import * as T from "three";
import { CompressedArrayTexture as re, CompressedCubeTexture as ie, CompressedTexture as ae, Data3DTexture as oe, DataTexture as se, FileLoader as ce, FloatType as le, HalfFloatType as E, LinearFilter as ue, LinearMipmapLinearFilter as de, LinearSRGBColorSpace as fe, Loader as pe, NoColorSpace as me, RGBAFormat as D, RGBA_ASTC_4x4_Format as he, RGBA_ASTC_6x6_Format as ge, RGBA_BPTC_Format as _e, RGBA_ETC2_EAC_Format as ve, RGBA_PVRTC_4BPPV1_Format as ye, RGBA_S3TC_DXT1_Format as be, RGBA_S3TC_DXT3_Format as xe, RGBA_S3TC_DXT5_Format as Se, RGB_BPTC_UNSIGNED_Format as Ce, RGB_ETC1_Format as we, RGB_ETC2_Format as Te, RGB_PVRTC_4BPPV1_Format as Ee, RGB_S3TC_DXT1_Format as De, RGFormat as O, RedFormat as k, SRGBColorSpace as Oe, UnsignedByteType as A } from "three";
//#region src/data/sampleScene.ts
var ke = {
	x: -15,
	y: 50,
	z: 0
}, Ae = {
	x: -.7127446532249451,
	y: .258819043636322,
	z: .6519262194633484
}, je = {
	x: .833125114440918,
	y: -.3420201539993286,
	z: .43465474247932434
}, j = {
	ambientColor: {
		r: .5,
		g: .5,
		b: .5
	},
	ambientIntensity: 1,
	specularColor: {
		r: 1,
		g: 1,
		b: 1
	},
	specularIntensity: 1,
	rimColor: {
		r: .5,
		g: .5,
		b: .5
	},
	rimColorAlpha: 1,
	rimRange: 7,
	rimEdgeSmoothness: .0010000000474974513,
	rimEmission: 0,
	rimLightInfluence: 1,
	shadowRimColor: {
		r: 0,
		g: 0,
		b: 0
	},
	rimShadowSharpness: .5
}, Me = Ae, Ne = {
	x: Me.x,
	y: Me.y,
	z: Me.z,
	intensity: 1,
	ambient: 0,
	shadowThreshold: .40625,
	shadowWeight: 1,
	characterAmbient: j.ambientIntensity,
	rimColorAlpha: j.rimColorAlpha,
	rimRange: j.rimRange,
	rimEdgeSmoothness: j.rimEdgeSmoothness,
	rimEmission: j.rimEmission,
	rimLightInfluence: j.rimLightInfluence,
	rimShadowSharpness: j.rimShadowSharpness
};
j.ambientIntensity, j.rimColorAlpha, j.rimRange, j.rimEdgeSmoothness, j.rimEmission, j.rimLightInfluence, j.rimShadowSharpness;
//#endregion
//#region src/engine/sekaiExtraBoneRuntime.ts
var Pe = Math.PI / 180, Fe = [
	"XYZ",
	"XZY",
	"YXZ",
	"YZX",
	"ZXY",
	"ZYX"
], Ie = class e {
	entries;
	sourceUnityQuaternion = new T.Quaternion();
	sourceUnityEuler = new T.Euler();
	targetUnityEuler = new T.Euler();
	targetUnityQuaternion = new T.Quaternion();
	targetQuaternion = new T.Quaternion();
	constructor(e) {
		this.entries = e;
	}
	static fromPjskRuntimeExtension(t, n) {
		let r = Re(t);
		if (!r.length) return null;
		n.updateMatrixWorld(!0);
		let i = He(n), a = [];
		for (let e of r) {
			let t = e.GameObject ?? e.gameObject ?? null, n = e.ReferenceBone ?? e.referenceBone ?? null, r = Ge(i, Xe(t?.TransformPath ?? t?.transformPath), Xe(t?.Name ?? t?.name)), o = Ge(i, Xe(n?.TransformPath ?? n?.transformPath), Xe(n?.Name ?? n?.name));
			if (!r || !o) continue;
			let s = Fe[Ye(e.RotationOrder ?? e.rotationOrder, 4)] ?? "ZXY";
			a.push({
				node: r,
				referenceNode: o,
				coefficient: Ye(e.Coefficient ?? e.coefficient, 1),
				defaultQuaternion: ze(e),
				axisX: Ze(e.AxisX ?? e.axisX, !0),
				axisY: Ze(e.AxisY ?? e.axisY, !0),
				axisZ: Ze(e.AxisZ ?? e.axisZ, !0),
				order: s
			});
		}
		return a.sort((e, t) => qe(e.referenceNode) - qe(t.referenceNode)), a.length ? new e(a) : null;
	}
	update() {
		for (let e of this.entries) {
			this.sourceUnityQuaternion.set(e.referenceNode.quaternion.x, -e.referenceNode.quaternion.y, -e.referenceNode.quaternion.z, e.referenceNode.quaternion.w).normalize(), this.sourceUnityEuler.setFromQuaternion(this.sourceUnityQuaternion, "YXZ"), Be(this.sourceUnityEuler);
			let t = e.coefficient > 0 ? -1 : +(e.coefficient < 0);
			this.targetUnityEuler.set(0, 0, 0, e.order), e.axisX && (this.targetUnityEuler.x = this.sourceUnityEuler.x * t), e.axisY && (this.targetUnityEuler.y = this.sourceUnityEuler.y * t), e.axisZ && (this.targetUnityEuler.z = this.sourceUnityEuler.z * t), this.targetUnityQuaternion.setFromEuler(this.targetUnityEuler).invert(), this.targetQuaternion.copy(v(this.targetUnityQuaternion)), Le(e.node.quaternion, e.defaultQuaternion, this.targetQuaternion, Math.abs(e.coefficient)), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
		}
	}
	getControlledTrackNodeNames() {
		return new Set(this.entries.map((e) => e.node.name).filter(Boolean));
	}
};
function Le(e, t, n, r) {
	let i = T.MathUtils.clamp(r, 0, 1), a = t.dot(n) < 0 ? -1 : 1;
	return e.set(T.MathUtils.lerp(t.x, n.x * a, i), T.MathUtils.lerp(t.y, n.y * a, i), T.MathUtils.lerp(t.z, n.z * a, i), T.MathUtils.lerp(t.w, n.w * a, i)).normalize();
}
function Re(e) {
	let t = M(e), n = M(t?.pjskSpringBone ?? t?.PjskSpringBone), r = M(n?.raw ?? n?.Raw), i = [];
	for (let e of [r?.body ?? r?.Body, r?.head ?? r?.Head]) {
		let t = M(e), n = t?.extraBones ?? t?.ExtraBones;
		Array.isArray(n) && i.push(...n.filter(Je));
	}
	return i;
}
function ze(e) {
	let t = M(e.DefaultEulerAngles ?? e.defaultEulerAngles) ?? {}, n = Ye(t.X ?? t.x, 0), r = Ye(t.Y ?? t.y, 0), i = Ye(t.Z ?? t.z, 0);
	return v(new T.Quaternion().setFromEuler(new T.Euler(n * Pe, r * Pe, i * Pe, "YXZ")));
}
function Be(e) {
	return e.x = Ve(e.x), e.y = Ve(e.y), e.z = Ve(e.z), e;
}
function Ve(e) {
	let t = Math.PI * 2;
	return (e % t + t) % t;
}
function He(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	return e.traverse((r) => {
		if (r !== e) {
			let e = n.get(r.name) ?? [];
			e.push(r), n.set(r.name, e);
		}
		for (let n of Ue(e, r)) t.set(n, r);
	}), {
		nodeByPath: t,
		nodeByName: n
	};
}
function Ue(e, t) {
	let n = We(t, e);
	if (!n) return [];
	let r = [n];
	return n.startsWith("body/") && r.push(`sit_body/${n.slice(5)}`), r;
}
function We(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function Ge(e, t, n) {
	for (let n of Ke(t)) {
		let t = e.nodeByPath.get(n);
		if (t) return t;
	}
	return n ? e.nodeByName.get(n)?.[0] ?? null : null;
}
function Ke(e) {
	if (!e) return [];
	let t = [e];
	return e.startsWith("sit_body/") && t.push(`body/${e.slice(9)}`), t;
}
function qe(e) {
	let t = 0, n = e.parent;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function M(e) {
	return e && typeof e == "object" ? e : null;
}
function Je(e) {
	return !!M(e);
}
function Ye(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Xe(e) {
	return typeof e == "string" ? e : null;
}
function Ze(e, t) {
	return typeof e == "boolean" ? e : typeof e == "number" ? e !== 0 : t;
}
//#endregion
//#region src/costume_shop/modelRenderStudio.ts
var N = Math.fround;
function Qe(e, t) {
	return Number.isNaN(e) ? t : Number.isNaN(t) ? e : Math.min(e, t);
}
function $e(e, t) {
	return Number.isNaN(e) ? t : Number.isNaN(t) ? e : Math.max(e, t);
}
function et(e) {
	return e < 0 ? 0 : Qe(e, 1);
}
var P = {
	zoomDuration: N(.35),
	bottomLowerLimitPosition: N(.4),
	bottomUpperLimitPosition: N(.85),
	topLowerLimitPosition: N(1.25),
	topUpperLimitPosition: N(.85),
	nearZ: N(2.3),
	farZ: N(4.5),
	fov: 25
}, F = {
	localPosition: [
		0,
		N(1.35),
		N(1.17)
	],
	localRotation: [
		0,
		1,
		0,
		N(-1.8725350514614547e-7)
	],
	nearClipPlane: N(.01),
	farClipPlane: 100,
	textureWidth: 1024,
	textureHeight: 1024
};
function tt(e, t) {
	let [n, r, i, a] = e, [o, s, c, l] = t;
	return [
		N(N(N(N(a * o) + N(n * l)) + N(r * c)) - N(i * s)),
		N(N(N(N(a * s) + N(r * l)) + N(i * o)) - N(n * c)),
		N(N(N(N(a * c) + N(i * l)) + N(n * s)) - N(r * o)),
		N(N(N(N(a * l) - N(n * o)) - N(r * s)) - N(i * c))
	];
}
function nt(e, t) {
	let [n, r, i, a] = e, o = N(2 * N(N(r * t[2]) - N(i * t[1]))), s = N(2 * N(N(i * t[0]) - N(n * t[2]))), c = N(2 * N(N(n * t[1]) - N(r * t[0])));
	return [
		N(N(t[0] + N(a * o)) + N(N(r * c) - N(i * s))),
		N(N(t[1] + N(a * s)) + N(N(i * o) - N(n * c))),
		N(N(t[2] + N(a * c)) + N(N(n * s) - N(r * o)))
	];
}
var rt = N(Math.PI / 180), it = class {
	zoomValue = 0;
	zoomMoveValue = 1;
	moveValue = 0;
	zoomDurationRatio = 0;
	cameraSetting = null;
	fieldOfView = 50;
	cameraLocalPosition = [...F.localPosition];
	cameraLocalRotation = [...F.localRotation];
	cameraRootRotation = [
		0,
		0,
		0,
		1
	];
	initialize(e) {
		this.cameraSetting = e, this.fieldOfView = e.fov, this.cameraLocalPosition[1] = e.topLowerLimitPosition, this.zoom(0, this.zoomMoveValue, !0);
	}
	zoom(e, t, n) {
		let r = this.requireSetting(), i = N(this.zoomValue + e);
		this.zoomValue = i;
		let a = N(r.zoomDuration * et(N(i / r.zoomDuration)));
		if (this.zoomValue = a, !(a >= 0 || n)) return;
		this.zoomMoveValue = t, this.calculateCameraZoom(t, a);
		let o = et(N(this.zoomValue / r.zoomDuration));
		this.cameraLocalPosition[2] = N(r.nearZ + N(N(r.farZ - r.nearZ) * $e(o, 0)));
	}
	calculateCameraZoom(e, t) {
		let n = this.requireSetting(), r = et(N(t / n.zoomDuration));
		this.zoomDurationRatio = r;
		let i = $e(r, 0), a = N(n.bottomLowerLimitPosition + N(N(n.bottomUpperLimitPosition - n.bottomLowerLimitPosition) * i)), o = N(N(n.topLowerLimitPosition + N(N(n.topUpperLimitPosition - n.topLowerLimitPosition) * i)) - a), s = e >= 0 ? Qe(e, 1) : 0;
		this.cameraLocalPosition[1] = N(a + N(s * o));
	}
	moveVertical(e) {
		this.zoomDurationRatio < 1 && this.calculateCameraMovePosition(e);
	}
	calculateCameraMovePosition(e) {
		let t = this.cameraLocalPosition[1];
		this.moveValue = t;
		let n = this.requireSetting(), r = this.zoomDurationRatio < 0 ? 0 : Qe(this.zoomDurationRatio, 1), i = N(n.bottomLowerLimitPosition + N(N(n.bottomUpperLimitPosition - n.bottomLowerLimitPosition) * r)), a = N(n.topLowerLimitPosition + N(N(n.topUpperLimitPosition - n.topLowerLimitPosition) * r)), o = N(t + e), s = o < i ? i : o, c = s <= a ? s : a;
		this.moveValue = c;
		let l = 0;
		if (i !== a) {
			let e = N(N(c - i) / N(a - i));
			e >= 0 && (l = Qe(e, 1));
		}
		this.zoomMoveValue = l, this.cameraLocalPosition[1] = c;
	}
	rotate(e, t, n) {
		if (!n) return;
		let r = N(N(N(-e) * rt) * .5);
		this.cameraRootRotation = tt(this.cameraRootRotation, [
			0,
			N(Math.sin(r)),
			0,
			N(Math.cos(r))
		]);
	}
	cameraWorldPosition() {
		return nt(this.cameraRootRotation, this.cameraLocalPosition);
	}
	cameraWorldRotation() {
		return tt(this.cameraRootRotation, this.cameraLocalRotation);
	}
	requireSetting() {
		if (!this.cameraSetting) throw Error("ModelRenderStudio camera is not initialized");
		return this.cameraSetting;
	}
}, at = new T.Vector3(.04835, .48222, .07241), ot = new T.Vector3(-.08532, .12848, 1.93551), st = 35, ct = .46, lt = 2.74, ut = -.0245, dt = .765;
function I(e) {
	let t = at.clone().multiplyScalar(e);
	return {
		target: t,
		position: t.clone().add(ot.clone().multiplyScalar(e)),
		fov: st,
		costumeShopState: null
	};
}
function L(e, t = 0, n = 1.6) {
	let r = Number.isFinite(t) ? t : 0;
	if (e === "legacy-cloud") {
		let e = new T.Vector3(0, ct, 0), t = new T.Vector3(0, 0, lt).applyAxisAngle(new T.Vector3(0, 1, 0), T.MathUtils.degToRad(r));
		return {
			target: e,
			position: e.clone().add(t),
			fov: P.fov,
			costumeShopState: null
		};
	}
	let i = e === "official-default" ? {
		cameraRootYawDegrees: r,
		zoomValue: 0,
		zoomMoveValue: 1
	} : {
		cameraRootYawDegrees: r,
		zoomValue: P.zoomDuration,
		zoomMoveValue: 0
	}, a = T.MathUtils.clamp(i.zoomValue, 0, P.zoomDuration), o = P.zoomDuration > 0 ? a / P.zoomDuration : 0, s = T.MathUtils.lerp(P.bottomLowerLimitPosition, P.bottomUpperLimitPosition, o), c = T.MathUtils.lerp(P.topLowerLimitPosition, P.topUpperLimitPosition, o), l = T.MathUtils.clamp(i.zoomMoveValue, 0, 1), u = e === "full-body" ? dt : T.MathUtils.lerp(s, c, l), d = T.MathUtils.lerp(P.nearZ, P.farZ, o), f = T.MathUtils.degToRad(i.cameraRootYawDegrees), p = new T.Vector3(0, u, d);
	return {
		target: new T.Vector3(0, u, 0),
		position: p.clone().applyAxisAngle(new T.Vector3(0, 1, 0), f),
		fov: P.fov,
		costumeShopState: {
			cameraRootYawDegrees: i.cameraRootYawDegrees,
			zoomValue: a,
			zoomMoveValue: l,
			zoomRatio: o,
			localCameraPosition: p,
			localCameraRotationYDegrees: 180
		}
	};
}
function ft(e, t, n, r) {
	let i = t.clone().sub(e).normalize(), a = new T.Vector3().crossVectors(i, new T.Vector3(0, 1, 0)).normalize().multiplyScalar(ut * n * r);
	return {
		target: t.clone().add(a),
		position: e.clone().add(a)
	};
}
//#endregion
//#region src/materials/official/unityGlesProgram.ts
var pt = "#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1", mt = "#define UNITY_SUPPORTS_UNIFORM_LOCATION 1";
function R(e) {
	let t = /^#version 300 es\n/;
	if (!t.test(e)) throw Error("official program does not start with #version 300 es");
	return e.replace(t, "").split(pt).join("#define HLSLCC_ENABLE_UNIFORM_BUFFERS 0").split(mt).join("#define UNITY_SUPPORTS_UNIFORM_LOCATION 0");
}
var ht = /^in\s+(lowp|mediump|highp)\s+(float|vec2|vec3|vec4|uvec4|ivec4)\s+(in_\w+)\s*;\s*$/gm;
function gt(e) {
	return [...e.matchAll(ht)].map((e) => ({
		precision: e[1],
		type: e[2],
		name: e[3]
	}));
}
function _t(e) {
	switch (e.name) {
		case "in_POSITION0": return "harukiUnityObjectFromMesh * vec4(transformed, 1.0)";
		case "in_NORMAL0": return "mat3(harukiUnityObjectFromMesh) * objectNormal";
		case "in_TANGENT0": return "vec4(mat3(harukiUnityObjectFromMesh) * objectTangent, tangent.w * harukiUnityTangentSign)";
		case "in_COLOR0": return "harukiVertexColor()";
		case "in_TEXCOORD0": return e.type === "vec2" ? "uv" : "vec4(uv, 0.0, 0.0)";
		case "in_TEXCOORD1": return e.type === "vec2" ? "uv1" : "vec4(uv1, 0.0, 0.0)";
		case "in_TEXCOORD2": return e.type === "vec2" ? "uv2" : "vec4(uv2, 0.0, 0.0)";
		default: throw Error(`unmapped official vertex input ${e.name}`);
	}
}
function vt(e, t) {
	let n = R(e), r = gt(n);
	if (!r.some((e) => e.name === "in_POSITION0")) throw Error("official vertex stage without in_POSITION0");
	let i = n.match(/^void main\(\)$/gm) ?? [];
	if (i.length !== 1) throw Error(`official vertex stage has ${i.length} main()`);
	let a = n.replace(ht, (e, t, n, r) => `${t} ${n} ${r};`).replace(/^void main\(\)$/m, "void harukiOfficialMain()"), o = (e) => r.some((t) => t.name === e), s = t.morphTargets, c = [
		t.skinning ? "#define USE_SKINNING" : "",
		s ? "#define USE_MORPHTARGETS" : "",
		s && s.normals ? "#define USE_MORPHNORMALS" : "",
		o("in_TANGENT0") ? "#define USE_TANGENT" : "",
		s ? `#define MORPHTARGETS_COUNT ${s.count}` : "",
		s ? `#define MORPHTARGETS_TEXTURE_STRIDE ${s.stride}` : ""
	].filter(Boolean), l = T.ShaderChunk;
	return `${a}\n${[
		"",
		"// ---- Haruki skinning pre-pass (Three chunks) ----",
		...c,
		s ? "precision highp sampler2DArray;" : "",
		s?.tangents && o("in_TANGENT0") ? "uniform highp sampler2DArray harukiMorphTangentTexture;\nuniform ivec2 harukiMorphTangentTextureSize;" : "",
		"uniform highp mat4 harukiUnityObjectFromMesh;",
		"uniform highp float harukiUnityTangentSign;",
		"uniform highp float harukiHasVertexColor;",
		"in highp vec3 position;",
		o("in_NORMAL0") || o("in_TANGENT0") ? "in highp vec3 normal;" : "",
		o("in_TANGENT0") ? "in highp vec4 tangent;" : "",
		o("in_TEXCOORD0") ? "in highp vec2 uv;" : "",
		o("in_TEXCOORD1") ? "in highp vec2 uv1;" : "",
		o("in_TEXCOORD2") ? "in highp vec2 uv2;" : "",
		o("in_COLOR0") ? "in highp vec4 color;" : "",
		t.skinning ? "in highp vec4 skinIndex;\nin highp vec4 skinWeight;" : "",
		l.morphtarget_pars_vertex,
		l.skinning_pars_vertex,
		o("in_COLOR0") ? "highp vec4 harukiVertexColor() { return harukiHasVertexColor > 0.5 ? color : vec4(1.0); }" : "",
		"void main()",
		"{",
		"  vec3 transformed = vec3(position);",
		"  vec3 objectNormal = vec3(0.0, 1.0, 0.0);",
		o("in_NORMAL0") || o("in_TANGENT0") ? "  objectNormal = vec3(normal);" : "",
		o("in_TANGENT0") ? "  vec3 objectTangent = vec3(tangent.xyz);" : "",
		s ? l.morphnormal_vertex : "",
		s?.tangents && o("in_TANGENT0") ? [
			"  for (int i = 0; i < MORPHTARGETS_COUNT; i++) {",
			"    if (morphTargetInfluences[i] != 0.0) {",
			"      int y = gl_VertexID / harukiMorphTangentTextureSize.x;",
			"      int x = gl_VertexID - y * harukiMorphTangentTextureSize.x;",
			"      objectTangent += texelFetch(harukiMorphTangentTexture, ivec3(x, y, i), 0).xyz * morphTargetInfluences[i];",
			"    }",
			"  }"
		].join("\n") : "",
		s ? l.morphtarget_vertex : "",
		t.skinning ? l.skinbase_vertex : "",
		t.skinning ? l.skinnormal_vertex : "",
		t.skinning ? l.skinning_vertex : "",
		...r.map((e) => `  ${e.name} = ${_t(e)};`),
		"  harukiOfficialMain();",
		"}",
		""
	].filter((e) => e !== "").join("\n")}\n`;
}
function yt(e) {
	return R(e);
}
//#endregion
//#region src/materials/official/officialUnityMaterial.ts
function bt(e, t) {
	let n = e.subShaders.find((e) => e.lod <= t);
	if (!n) throw Error(`${e.shader}: no SubShader within LOD ${t}`);
	return n;
}
function xt(e, t) {
	let n = e.passes.filter((e) => e.name.toUpperCase() === t.toUpperCase());
	if (n.length !== 1) throw Error(`SubShader LOD ${e.lod}: ${n.length} passes named ${t}`);
	return n[0];
}
function St(e, t) {
	let n = new Set(e.keywordSpace), r = [...new Set(t)].filter((e) => n.has(e)).sort().join(" "), i = e.variants.find((e) => e.keywords.join(" ") === r);
	if (!i) throw Error(`${e.owner}/${e.name}: no official variant for [${r}]`);
	return i;
}
var Ct = /^\s*(?:UNITY_LOCATION\(\d+\)\s+)?(?:uniform|UNITY_UNIFORM)\s+(?:(?:lowp|mediump|highp)\s+)?(\w+)\s+(\w+)(?:\[(\d+)\])?\s*;/gm;
function wt(...e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) for (let e of n.matchAll(Ct)) {
		let n = e[2];
		if (n.startsWith("Xhlslcc_Unused") || n.startsWith("harukiUnity") || n === "harukiHasVertexColor" || /^(bindMatrix|bindMatrixInverse|boneTexture|morphTarget\w*)$/.test(n)) continue;
		let r = {
			type: e[1],
			name: n,
			arraySize: e[3] ? Number(e[3]) : null
		}, i = t.get(n);
		if (i && (i.type !== r.type || i.arraySize !== r.arraySize)) throw Error(`uniform ${n} declared differently in the two stages`);
		t.set(n, r);
	}
	return [...t.values()];
}
var Tt = {
	float: 1,
	int: 1,
	vec2: 2,
	vec3: 3,
	vec4: 4,
	ivec2: 2,
	ivec3: 3,
	ivec4: 4
};
function Et(e) {
	if (e.type.startsWith("sampler")) return null;
	let t = Tt[e.type];
	if (t === void 0) throw Error(`unsupported official uniform type ${e.type} ${e.name}`);
	if (e.arraySize !== null) return e.type.startsWith("i") ? new Int32Array(e.arraySize * t) : new Float32Array(e.arraySize * t);
	switch (e.type) {
		case "float":
		case "int": return 0;
		case "vec2": return new T.Vector2();
		case "vec3": return new T.Vector3();
		case "vec4": return new T.Vector4();
		default: return new Int32Array(t);
	}
}
var Dt = [
	T.ZeroFactor,
	T.OneFactor,
	T.DstColorFactor,
	T.SrcColorFactor,
	T.OneMinusDstColorFactor,
	T.SrcAlphaFactor,
	T.OneMinusSrcColorFactor,
	T.DstAlphaFactor,
	T.OneMinusDstAlphaFactor,
	T.SrcAlphaSaturateFactor,
	T.OneMinusSrcAlphaFactor
], Ot = [
	T.AddEquation,
	T.SubtractEquation,
	T.ReverseSubtractEquation,
	T.MinEquation,
	T.MaxEquation
], kt = [
	T.AlwaysDepth,
	T.NeverDepth,
	T.LessDepth,
	T.EqualDepth,
	T.LessEqualDepth,
	T.GreaterDepth,
	T.NotEqualDepth,
	T.GreaterEqualDepth,
	T.AlwaysDepth
], At = [
	T.AlwaysStencilFunc,
	T.NeverStencilFunc,
	T.LessStencilFunc,
	T.EqualStencilFunc,
	T.LessEqualStencilFunc,
	T.GreaterStencilFunc,
	T.NotEqualStencilFunc,
	T.GreaterEqualStencilFunc,
	T.AlwaysStencilFunc
], jt = [
	T.KeepStencilOp,
	T.ZeroStencilOp,
	T.ReplaceStencilOp,
	T.IncrementStencilOp,
	T.DecrementStencilOp,
	T.InvertStencilOp,
	T.IncrementWrapStencilOp,
	T.DecrementWrapStencilOp
];
function Mt(e, t, n) {
	if (!e.property) return e.value;
	let r = n.float(e.property);
	if (r !== null) return r;
	let i = t.properties.find((t) => t.name === e.property);
	if (i && typeof i.default == "number") return i.default;
	throw Error(`${t.shader}: state property ${e.property} has no value`);
}
function z(e, t, n) {
	let r = e[Math.trunc(t)];
	if (r === void 0) throw Error(`unsupported ${n} ${t}`);
	return r;
}
function Nt(e, t, n, r) {
	let i = n.state, a = (e) => Mt(e, t, r), o = a(i.culling);
	e.side = o === 0 ? T.DoubleSide : o === 1 ? T.BackSide : T.FrontSide;
	let s = a(i.zTest);
	e.depthTest = s !== 0, e.depthFunc = z(kt, s, "ZTest"), e.depthWrite = a(i.zWrite) !== 0;
	let c = a(i.offsetFactor), l = a(i.offsetUnits);
	e.polygonOffset = c !== 0 || l !== 0, e.polygonOffsetFactor = c, e.polygonOffsetUnits = l, e.alphaToCoverage = a(i.alphaToMask) !== 0;
	let u = i.blend[0], d = a(u.srcBlend), f = a(u.destBlend), p = a(u.srcBlendAlpha), m = a(u.destBlendAlpha), h = a(u.blendOp), g = a(u.blendOpAlpha);
	d === 1 && f === 0 && p === 1 && m === 0 && h === 0 && g === 0 ? e.blending = T.NoBlending : (e.blending = T.CustomBlending, e.blendSrc = z(Dt, d, "blend factor"), e.blendDst = z(Dt, f, "blend factor"), e.blendSrcAlpha = z(Dt, p, "blend factor"), e.blendDstAlpha = z(Dt, m, "blend factor"), e.blendEquation = z(Ot, h, "BlendOp"), e.blendEquationAlpha = z(Ot, g, "BlendOp")), e.premultipliedAlpha = !1;
	let _ = a(u.colMask);
	if (e.colorWrite = _ !== 0, _ === 14) e.blending === T.NoBlending && (e.blending = T.CustomBlending, e.blendSrc = T.OneFactor, e.blendDst = T.ZeroFactor, e.blendEquation = T.AddEquation), e.blendSrcAlpha = T.ZeroFactor, e.blendDstAlpha = T.OneFactor, e.blendEquationAlpha = T.AddEquation;
	else if (_ !== 0 && _ !== 15) throw Error(`${n.owner}/${n.name}: partial ColorMask ${_} needs a per-channel mask`);
	let v = a(i.stencilOp.comp), y = a(i.stencilRef), b = a(i.stencilReadMask), x = a(i.stencilWriteMask), S = a(i.stencilOp.pass), ee = a(i.stencilOp.fail), C = a(i.stencilOp.zFail);
	e.stencilWrite = !(v === 8 && S === 0 && ee === 0 && C === 0) && v !== 0, e.stencilFunc = z(At, v, "stencil Comp"), e.stencilRef = y, e.stencilFuncMask = b, e.stencilWriteMask = x, e.stencilZPass = z(jt, S, "stencil Pass"), e.stencilFail = z(jt, ee, "stencil Fail"), e.stencilZFail = z(jt, C, "stencil ZFail");
}
function Pt(e, t, n, r, i) {
	let a = St(t, n), o = e.programs[a.program];
	if (!o) throw Error(`${t.owner}/${t.name}: program ${a.program} missing from the table`);
	let s = vt(o.vertex, r), c = yt(o.fragment), l = wt(s, c), u = {
		harukiUnityObjectFromMesh: { value: new T.Matrix4() },
		harukiUnityTangentSign: { value: -1 },
		harukiHasVertexColor: { value: 0 }
	};
	for (let e of l) u[e.name] = { value: Et(e) };
	let d = new T.RawShaderMaterial({
		name: `${t.owner}/${t.name}`,
		glslVersion: T.GLSL3,
		vertexShader: s,
		fragmentShader: c,
		uniforms: u
	});
	return Nt(d, e, t, i), {
		material: d,
		pass: t,
		variant: a,
		uniforms: l
	};
}
var Ft = {
	programs: /* @__PURE__ */ JSON.parse("{\"23e56577679923d4e76434da22277eddd1ef0dc40daa89682ca6fb0cac2be9de\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_1;\\nvoid main()\\n{\\n    u_xlat16_0.x = vs_COLOR0.w * 255.0;\\n    u_xlat16_0.x = roundEven(u_xlat16_0.x);\\n    u_xlat16_0.w = u_xlat16_0.x * 0.00392156886;\\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat1 = u_xlat16_1 + _TextureSampleAdd;\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat1;\\n    SV_Target0.xyz = u_xlat0.www * u_xlat0.xyz;\\n    SV_Target0.w = u_xlat0.w;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"},\"874129697aab9aee5f3170bf13bfcacc070925db72e936742eb9b01238095908\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_1;\\nmediump float u_xlat16_2;\\nbool u_xlatb3;\\nvoid main()\\n{\\n    u_xlat16_0.x = vs_COLOR0.w * 255.0;\\n    u_xlat16_0.x = roundEven(u_xlat16_0.x);\\n    u_xlat16_0.w = u_xlat16_0.x * 0.00392156886;\\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat1 = u_xlat16_1 + _TextureSampleAdd;\\n    u_xlat16_2 = u_xlat16_0.w * u_xlat1.w + -0.00100000005;\\n    u_xlatb3 = u_xlat16_2<0.0;\\n    if(u_xlatb3){discard;}\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat1;\\n    SV_Target0.xyz = u_xlat0.www * u_xlat0.xyz;\\n    SV_Target0.w = u_xlat0.w;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"},\"b875c005045cb4b3732d47272a7cfc463db6bb91acdcc62f197eea11b0612e6b\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nuniform \\tvec4 _ClipRect;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nin highp vec4 vs_TEXCOORD2;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_1;\\nbool u_xlatb1;\\nmediump float u_xlat16_2;\\nmediump float u_xlat16_5;\\nvoid main()\\n{\\n    u_xlat16_0.x = vs_COLOR0.w * 255.0;\\n    u_xlat16_0.x = roundEven(u_xlat16_0.x);\\n    u_xlat16_0.w = u_xlat16_0.x * 0.00392156886;\\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat1 = u_xlat16_1 + _TextureSampleAdd;\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat1;\\n    u_xlat1.xy = (-_ClipRect.xy) + _ClipRect.zw;\\n    u_xlat1.xy = u_xlat1.xy + -abs(vs_TEXCOORD2.xy);\\n    u_xlat1.xy = u_xlat1.xy * vs_TEXCOORD2.zw;\\n    u_xlat1.xy = clamp(u_xlat1.xy, 0.0, 1.0);\\n    u_xlat16_2 = u_xlat1.y * u_xlat1.x;\\n    u_xlat16_5 = u_xlat0.w * u_xlat16_2 + -0.00100000005;\\n    u_xlat16_2 = u_xlat0.w * u_xlat16_2;\\n    SV_Target0.xyz = u_xlat0.xyz * vec3(u_xlat16_2);\\n    SV_Target0.w = u_xlat16_2;\\n    u_xlatb1 = u_xlat16_5<0.0;\\n    if(u_xlatb1){discard;}\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"},\"be6a8cb8eb12ea1e0ca2da97d7329ec93a4f7c3c35505846a6bf8f7ff4b96978\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nuniform \\tvec4 _ClipRect;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nin highp vec4 vs_TEXCOORD2;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nmediump float u_xlat16_1;\\nvec4 u_xlat2;\\nmediump vec4 u_xlat16_2;\\nmediump float u_xlat16_4;\\nvoid main()\\n{\\n    u_xlat0.xy = (-_ClipRect.xy) + _ClipRect.zw;\\n    u_xlat0.xy = u_xlat0.xy + -abs(vs_TEXCOORD2.xy);\\n    u_xlat0.xy = u_xlat0.xy * vs_TEXCOORD2.zw;\\n    u_xlat0.xy = clamp(u_xlat0.xy, 0.0, 1.0);\\n    u_xlat16_1 = u_xlat0.y * u_xlat0.x;\\n    u_xlat16_4 = vs_COLOR0.w * 255.0;\\n    u_xlat16_4 = roundEven(u_xlat16_4);\\n    u_xlat16_0.w = u_xlat16_4 * 0.00392156886;\\n    u_xlat16_2 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat2 = u_xlat16_2 + _TextureSampleAdd;\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat2;\\n    u_xlat16_1 = u_xlat16_1 * u_xlat0.w;\\n    SV_Target0.xyz = u_xlat0.xyz * vec3(u_xlat16_1);\\n    SV_Target0.w = u_xlat16_1;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"}}"),
	properties: [
		{
			default: {
				dimension: 2,
				name: "white"
			},
			flags: 2,
			name: "_MainTex",
			type: 4
		},
		{
			default: [
				1,
				1,
				1,
				1
			],
			flags: 0,
			name: "_Color",
			type: 0
		},
		{
			default: 8,
			flags: 0,
			name: "_StencilComp",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_Stencil",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_StencilOp",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilWriteMask",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilReadMask",
			type: 2
		},
		{
			default: 15,
			flags: 0,
			name: "_ColorMask",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_UseUIAlphaClip",
			type: 2
		}
	],
	shader: "UI/Default",
	subShaders: [{
		lod: 0,
		passes: [{
			keywordSpace: ["UNITY_UI_ALPHACLIP", "UNITY_UI_CLIP_RECT"],
			name: "Default",
			owner: "UI/Default",
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
							property: "_ColorMask",
							value: 0
						},
						destBlend: {
							property: null,
							value: 10
						},
						destBlendAlpha: {
							property: null,
							value: 10
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
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
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
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: "unity_GUIZTestMode",
					value: 0
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				CanUseSpriteAtlas: "true",
				IGNOREPROJECTOR: "true",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [
				{
					keywords: [],
					program: "23e56577679923d4e76434da22277eddd1ef0dc40daa89682ca6fb0cac2be9de",
					shaderRequirements: 1
				},
				{
					keywords: ["UNITY_UI_ALPHACLIP"],
					program: "874129697aab9aee5f3170bf13bfcacc070925db72e936742eb9b01238095908",
					shaderRequirements: 1
				},
				{
					keywords: ["UNITY_UI_CLIP_RECT"],
					program: "be6a8cb8eb12ea1e0ca2da97d7329ec93a4f7c3c35505846a6bf8f7ff4b96978",
					shaderRequirements: 1
				},
				{
					keywords: ["UNITY_UI_ALPHACLIP", "UNITY_UI_CLIP_RECT"],
					program: "b875c005045cb4b3732d47272a7cfc463db6bb91acdcc62f197eea11b0612e6b",
					shaderRequirements: 1
				}
			]
		}],
		tags: {
			CanUseSpriteAtlas: "true",
			IGNOREPROJECTOR: "true",
			PreviewType: "Plane",
			QUEUE: "Transparent",
			RenderType: "Transparent"
		}
	}]
}, It = {
	programs: { f622ed2d0f0e50c8f78bf11f593dee9c653ddf4d7fc60b41712b8ab0cf72dec2: {
		fragment: "#version 300 es\n\nprecision highp float;\nprecision highp int;\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 _ClipRect;\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\nin mediump vec4 vs_COLOR0;\nin mediump vec2 vs_TEXCOORD0;\nin highp vec4 vs_TEXCOORD1;\nlayout(location = 0) out mediump vec4 SV_Target0;\nvec4 u_xlat0;\nbvec4 u_xlatb0;\nvec4 u_xlat1;\nmediump vec4 u_xlat16_1;\nvoid main()\n{\n    u_xlatb0.xy = greaterThanEqual(vs_TEXCOORD1.xyxx, _ClipRect.xyxx).xy;\n    u_xlatb0.zw = greaterThanEqual(_ClipRect.zzzw, vs_TEXCOORD1.xxxy).zw;\n    u_xlat0.x = u_xlatb0.x ? float(1.0) : 0.0;\n    u_xlat0.y = u_xlatb0.y ? float(1.0) : 0.0;\n    u_xlat0.z = u_xlatb0.z ? float(1.0) : 0.0;\n    u_xlat0.w = u_xlatb0.w ? float(1.0) : 0.0;\n;\n    u_xlat0.xy = u_xlat0.zw * u_xlat0.xy;\n    u_xlat0.x = u_xlat0.y * u_xlat0.x;\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\n    u_xlat1 = u_xlat16_1 * vs_COLOR0;\n    u_xlat1.w = u_xlat0.x * u_xlat1.w;\n    SV_Target0 = u_xlat1;\n    return;\n}\n\n",
		vertex: "#version 300 es\n\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\nuniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];\nuniform 	mediump vec4 _Color;\nuniform 	vec4 _MainTex_ST;\nin highp vec4 in_POSITION0;\nin highp vec4 in_COLOR0;\nin highp vec2 in_TEXCOORD0;\nout mediump vec4 vs_COLOR0;\nout mediump vec2 vs_TEXCOORD0;\nout highp vec4 vs_TEXCOORD1;\nvec4 u_xlat0;\nvec4 u_xlat1;\nvoid main()\n{\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\n    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\n    u_xlat0 = in_COLOR0 * _Color;\n    vs_COLOR0 = u_xlat0;\n    u_xlat0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\n    vs_TEXCOORD0.xy = u_xlat0.xy;\n    vs_TEXCOORD1 = in_POSITION0;\n    return;\n}\n\n"
	} },
	properties: [
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
			default: [
				1,
				1,
				1,
				1
			],
			flags: 0,
			name: "_Color",
			type: 0
		},
		{
			default: 8,
			flags: 0,
			name: "_StencilComp",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_Stencil",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_StencilOp",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilWriteMask",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilReadMask",
			type: 2
		},
		{
			default: 15,
			flags: 0,
			name: "_ColorMask",
			type: 2
		},
		{
			default: [
				-32767,
				-32767,
				32767,
				32767
			],
			flags: 0,
			name: "_ClipRect",
			type: 1
		}
	],
	shader: "Sekai/Particles/UI-Default",
	subShaders: [{
		lod: 0,
		passes: [{
			keywordSpace: [],
			name: "",
			owner: "Sekai/Particles/UI-Default",
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
							property: "_ColorMask",
							value: 0
						},
						destBlend: {
							property: null,
							value: 10
						},
						destBlendAlpha: {
							property: null,
							value: 10
						},
						srcBlend: {
							property: null,
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 5
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
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
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
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: "unity_GUIZTestMode",
					value: 0
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				CanUseSpriteAtlas: "true",
				IGNOREPROJECTOR: "true",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [{
				keywords: [],
				program: "f622ed2d0f0e50c8f78bf11f593dee9c653ddf4d7fc60b41712b8ab0cf72dec2",
				shaderRequirements: 33
			}]
		}],
		tags: {
			CanUseSpriteAtlas: "true",
			IGNOREPROJECTOR: "true",
			PreviewType: "Plane",
			QUEUE: "Transparent",
			RenderType: "Transparent"
		}
	}]
}, Lt = {
	programs: {
		aeebd7e8d1a3d29033cf1a035b98a4e69ae796a719c4742a751aa4fca9786dc9: {
			fragment: "#version 300 es\n\nprecision highp float;\nprecision highp int;\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec2 _GlobalMipBias;\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\nin mediump vec4 vs_COLOR0;\nin highp vec2 vs_TEXCOORD0;\nlayout(location = 0) out mediump vec4 SV_Target0;\nvec4 u_xlat0;\nmediump vec4 u_xlat16_0;\nvoid main()\n{\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD0.xy, _GlobalMipBias.x);\n    u_xlat0 = u_xlat16_0 * vs_COLOR0;\n    SV_Target0 = u_xlat0;\n    return;\n}\n\n",
			vertex: "#version 300 es\n\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(0) uniform UnityPerDraw {\n#endif\n	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(1) uniform UnityPerMaterial {\n#endif\n	UNITY_UNIFORM vec4                _MainTex_ST;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\nin highp vec4 in_POSITION0;\nin mediump vec4 in_COLOR0;\nin highp vec3 in_TEXCOORD0;\nout mediump vec4 vs_COLOR0;\nout highp vec2 vs_TEXCOORD0;\nvec4 u_xlat0;\nvec4 u_xlat1;\nvoid main()\n{\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\n    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\n    vs_COLOR0 = in_COLOR0;\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\n    return;\n}\n\n"
		},
		f2f13b8dd42b2304de7febd2acae6a76f4a651d5d0c4f7cc21b77a3704c5a07a: {
			fragment: "#version 300 es\n\nprecision highp float;\nprecision highp int;\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec2 _GlobalMipBias;\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\nin mediump vec4 vs_COLOR0;\nin highp vec2 vs_TEXCOORD0;\nlayout(location = 0) out mediump vec4 SV_Target0;\nlayout(location = 1) out mediump vec4 SV_Target1;\nlayout(location = 2) out mediump vec4 SV_Target2;\nvec4 u_xlat0;\nmediump vec4 u_xlat16_0;\nvoid main()\n{\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD0.xy, _GlobalMipBias.x);\n    u_xlat0 = u_xlat16_0 * vs_COLOR0;\n    SV_Target0 = u_xlat0;\n    SV_Target1 = vec4(0.0, 0.0, 0.0, 1.0);\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\n    return;\n}\n\n",
			vertex: "#version 300 es\n\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(0) uniform UnityPerDraw {\n#endif\n	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(1) uniform UnityPerMaterial {\n#endif\n	UNITY_UNIFORM vec4                _MainTex_ST;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\nin highp vec4 in_POSITION0;\nin mediump vec4 in_COLOR0;\nin highp vec3 in_TEXCOORD0;\nout mediump vec4 vs_COLOR0;\nout highp vec2 vs_TEXCOORD0;\nvec4 u_xlat0;\nvec4 u_xlat1;\nvoid main()\n{\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\n    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\n    vs_COLOR0 = in_COLOR0;\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\n    return;\n}\n\n"
		}
	},
	properties: [
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
			default: 8,
			flags: 0,
			name: "_StencilComp",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_Stencil",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_StencilOp",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilWriteMask",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilReadMask",
			type: 2
		}
	],
	shader: "Sekai/Particles/UI/Additive",
	subShaders: [{
		lod: 0,
		passes: [{
			keywordSpace: [],
			name: "",
			owner: "Sekai/Particles/UI/Additive",
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
							value: 14
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
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 5
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
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
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
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
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
				IGNOREPROJECTOR: "true",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [{
				keywords: [],
				program: "f2f13b8dd42b2304de7febd2acae6a76f4a651d5d0c4f7cc21b77a3704c5a07a",
				shaderRequirements: 227
			}]
		}, {
			keywordSpace: [],
			name: "",
			owner: "Sekai/Particles/UI/Additive",
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
							value: 14
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
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 5
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
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
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
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
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
				IGNOREPROJECTOR: "true",
				LIGHTMODE: "SekaiUI",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [{
				keywords: [],
				program: "aeebd7e8d1a3d29033cf1a035b98a4e69ae796a719c4742a751aa4fca9786dc9",
				shaderRequirements: 227
			}]
		}],
		tags: {
			IGNOREPROJECTOR: "true",
			PreviewType: "Plane",
			QUEUE: "Transparent",
			RenderType: "Transparent"
		}
	}]
}, Rt = 1 / 65535, B = {
	panelSize: [759.5499877929688, 647.280029296875],
	backgroundSize: [2338, 1440],
	particleScale: 100,
	tri: {
		duration: 6,
		rate: 8,
		lifetime: [6, 7],
		speed: [.5, 2.200000047683716],
		size: [1, 5],
		startRotation: [-6.283185005187988, 6.283185005187988],
		angularVelocityXY: [-.6108652353286743, .6108652353286743],
		angularVelocityZ: [-1.570796251296997, 1.570796251296997],
		radius: 2.0999999046325684,
		radiusThickness: .7599999904632568,
		sizeCurve: [[
			0,
			.1817779541015625,
			0,
			0
		], [
			1,
			1,
			.3526337146759033,
			.3526337146759033
		]],
		alphaKeys: [
			[0, 0],
			[6168 * Rt, 1],
			[54548 * Rt, 1],
			[1, 0]
		],
		frameRange: [0, .9998999834060669],
		tiles: [2, 2]
	},
	flare: {
		duration: 5,
		lifetime: 5,
		size: 15,
		sizeMultiplier: 2,
		offset: [0, -3.4200000762939453],
		sizeCurve: [
			[
				0,
				.6434060335159302,
				0,
				0
			],
			[
				.617828369140625,
				.8837184906005859,
				.7115257382392883,
				.7115257382392883
			],
			[
				1,
				1,
				0,
				0
			]
		],
		color: [
			.16078431904315948,
			.22817322611808777,
			.9137254953384399
		],
		alphaKeys: [
			[0, 0],
			[11565 * Rt, 1],
			[23708 * Rt, 1],
			[1, 0]
		],
		startFrame: .5,
		tiles: [2, 2]
	}
}, zt = 1 / 60;
function Bt(e, t) {
	let n = e[0], r = e[e.length - 1];
	if (t <= n[0]) return n[1];
	if (t >= r[0]) return r[1];
	let i = 0;
	for (; t > e[i + 1][0];) i++;
	let [a, o, , s] = e[i], [c, l, u] = e[i + 1], d = c - a, f = (t - a) / d, p = f * f, m = p * f;
	return (2 * m - 3 * p + 1) * o + (m - 2 * p + f) * d * s + (-2 * m + 3 * p) * l + (m - p) * d * u;
}
function Vt(e, t) {
	if (t <= e[0][0]) return e[0][1];
	for (let n = 1; n < e.length; n++) {
		let [r, i] = e[n];
		if (t <= r) {
			let [a, o] = e[n - 1];
			return o + (i - o) * (t - a) / (r - a);
		}
	}
	return e[e.length - 1][1];
}
function Ht(e, t) {
	return Math.min(Math.floor(e * t[0] * t[1]), t[0] * t[1] - 1);
}
function Ut(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 >>> 0;
		let e = t;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
var Wt = class {
	tri = [];
	flareAge = 0;
	emission = 0;
	random;
	constructor(e = 1) {
		this.random = Ut(e);
	}
	between(e) {
		return e[0] + (e[1] - e[0]) * this.random();
	}
	step(e) {
		let t = B.tri;
		for (let t = 0; t < this.tri.length;) {
			let n = this.tri[t];
			if (n.age += e, n.age >= n.lifetime) {
				this.tri[t] = this.tri[this.tri.length - 1], this.tri.pop();
				continue;
			}
			n.x += n.vx * e, n.y += n.vy * e;
			for (let t = 0; t < 3; t++) n.rotation[t] += n.angularVelocity[t] * e;
			t++;
		}
		for (this.emission += t.rate * e; this.emission >= 1;) {
			--this.emission;
			let e = this.emission / t.rate, n = 1 - t.radiusThickness, r = t.radius * Math.sqrt(n * n + (1 - n * n) * this.random()), i = this.random() * Math.PI * 2, a = Math.cos(i), o = -Math.sin(i), s = this.between(t.speed);
			this.tri.push({
				x: a * (r + s * e),
				y: o * (r + s * e),
				vx: a * s,
				vy: o * s,
				startSize: this.between(t.size),
				lifetime: this.between(t.lifetime),
				age: e,
				rotation: [
					this.between(t.startRotation),
					this.between(t.startRotation),
					this.between(t.startRotation)
				],
				angularVelocity: [
					this.between(t.angularVelocityXY),
					this.between(t.angularVelocityXY),
					this.between(t.angularVelocityZ)
				],
				frame: Ht(this.between(t.frameRange), t.tiles)
			});
		}
		this.flareAge = (this.flareAge + e) % B.flare.duration;
	}
	prewarm() {
		for (let e = 0; e < B.tri.duration; e += zt) this.step(zt);
		this.flareAge = 0;
	}
};
function Gt(e, t, n) {
	let r = e.programs[St(t, []).program];
	if (!r) throw Error(`${e.shader}: program missing from the table`);
	let i = new T.RawShaderMaterial({
		name: e.shader,
		glslVersion: T.GLSL3,
		vertexShader: R(r.vertex),
		fragmentShader: R(r.fragment),
		uniforms: n
	});
	return Nt(i, e, t, {
		float: (e) => e === "unity_GUIZTestMode" ? 8 : e === "_ColorMask" ? 15 : null,
		color: () => null
	}), i;
}
function Kt(e, t = 0) {
	return bt(e, 300).passes[t];
}
function qt(e) {
	let t = [];
	for (let n = 0; n < e; n++) t.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4 + 2, n * 4 + 3, n * 4);
	return t;
}
function Jt(e, t) {
	return [e % t[0] / t[0], 1 - (Math.floor(e / t[0]) + 1) / t[1]];
}
var Yt = [
	[-.5, -.5],
	[-.5, .5],
	[.5, .5],
	[.5, -.5]
];
async function Xt(e) {
	let t = new T.TextureLoader(), n = async (n, r, i) => {
		let a = await t.loadAsync(new URL(`ui/archive-background/${n}`, e).toString());
		return a.colorSpace = T.NoColorSpace, a.generateMipmaps = i, a.minFilter = i ? T.LinearMipmapNearestFilter : T.LinearFilter, a.magFilter = T.LinearFilter, a.wrapS = a.wrapT = r, a.needsUpdate = !0, a;
	}, [r, i, a] = await Promise.all([
		n("bg_sekai.png", T.ClampToEdgeWrapping, !1),
		n("tex_sekai_v2_02.png", T.RepeatWrapping, !0),
		n("tex_transition_01.png", T.ClampToEdgeWrapping, !1)
	]);
	return {
		background: r,
		triangles: i,
		flare: a
	};
}
var Zt = class {
	textures;
	simulation;
	scene = new T.Scene();
	camera = new T.OrthographicCamera(0, 1, 1, 0, -1, 1);
	matrixVP = new T.Matrix4();
	screenParams = new T.Vector4();
	backgroundMesh;
	backgroundPositions;
	triMesh;
	triPositions;
	triColors;
	triUVs;
	flareMesh;
	flarePositions;
	flareColors;
	opaqueMesh;
	capacity;
	underlayColor = new T.Color(1, 1, 1);
	constructor(e, t = 1) {
		this.textures = e, this.simulation = new Wt(t), this.simulation.prewarm();
		let n = () => ({ value: new T.Matrix4().elements }), r = () => ({ value: new T.Vector4(-32767, -32767, 32767, 32767) }), i = new T.BufferGeometry();
		this.backgroundPositions = new T.BufferAttribute(/* @__PURE__ */ new Float32Array(12), 3), i.setAttribute("in_POSITION0", this.backgroundPositions), i.setAttribute("in_COLOR0", new T.BufferAttribute((/* @__PURE__ */ new Uint8Array(16)).fill(255), 4, !0)), i.setAttribute("in_TEXCOORD0", new T.BufferAttribute(new Float32Array([
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			0
		]), 2)), i.setIndex(qt(1)), this.backgroundMesh = new T.Mesh(i, Gt(Ft, Kt(Ft), {
			hlslcc_mtx4x4unity_ObjectToWorld: n(),
			hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
			hlslcc_mtx4x4glstate_matrix_projection: { value: this.matrixVP.elements },
			_ScreenParams: { value: this.screenParams },
			_UIMaskSoftnessX: { value: 0 },
			_UIMaskSoftnessY: { value: 0 },
			_Color: { value: new T.Vector4(1, 1, 1, 1) },
			_TextureSampleAdd: { value: new T.Vector4(0, 0, 0, 0) },
			_MainTex_ST: { value: new T.Vector4(1, 1, 0, 0) },
			_ClipRect: r(),
			_MainTex: { value: e.background }
		})), this.capacity = 64;
		let a = new T.BufferGeometry();
		this.triPositions = new T.BufferAttribute(new Float32Array(this.capacity * 12), 3), this.triColors = new T.BufferAttribute(new Uint8Array(this.capacity * 16), 4, !0), this.triUVs = new T.BufferAttribute(new Float32Array(this.capacity * 8), 2), this.triMesh = new T.Mesh(a, Gt(It, Kt(It), {
			hlslcc_mtx4x4unity_ObjectToWorld: n(),
			hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
			_Color: { value: new T.Vector4(1, 1, 1, 1) },
			_MainTex_ST: { value: new T.Vector4(1, 1, 0, 0) },
			_ClipRect: r(),
			_MainTex: { value: e.triangles }
		})), this.setTriAttributes();
		let o = new T.BufferGeometry();
		this.flarePositions = new T.BufferAttribute(/* @__PURE__ */ new Float32Array(12), 3), this.flareColors = new T.BufferAttribute(/* @__PURE__ */ new Uint8Array(16), 4, !0);
		let [s, c] = Jt(Ht(B.flare.startFrame, B.flare.tiles), B.flare.tiles), [l, u] = B.flare.tiles;
		o.setAttribute("in_POSITION0", this.flarePositions), o.setAttribute("in_COLOR0", this.flareColors), o.setAttribute("in_TEXCOORD0", new T.BufferAttribute(new Float32Array(Yt.flatMap(([e, t]) => [
			s + (e + .5) / l,
			c + (t + .5) / u,
			0
		])), 3)), o.setIndex(qt(1));
		let d = Lt;
		this.flareMesh = new T.Mesh(o, Gt(d, Kt(d, 1), {
			hlslcc_mtx4x4unity_ObjectToWorld: n(),
			hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
			_MainTex_ST: { value: new T.Vector4(1, 1, 0, 0) },
			_GlobalMipBias: { value: new T.Vector2(0, 0) },
			_MainTex: { value: e.flare }
		})), this.opaqueMesh = new T.Mesh(new T.PlaneGeometry(2, 2), new T.RawShaderMaterial({
			glslVersion: T.GLSL3,
			vertexShader: "in vec3 position; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
			fragmentShader: "precision mediump float; out vec4 color; void main() { color = vec4(0.0, 0.0, 0.0, 1.0); }",
			blending: T.CustomBlending,
			blendSrc: T.ZeroFactor,
			blendDst: T.OneFactor,
			blendSrcAlpha: T.OneFactor,
			blendDstAlpha: T.ZeroFactor,
			depthTest: !1,
			depthWrite: !1
		})), [
			this.backgroundMesh,
			this.triMesh,
			this.flareMesh,
			this.opaqueMesh
		].forEach((e, t) => {
			e.renderOrder = t, e.frustumCulled = !1, this.scene.add(e);
		});
	}
	setTriAttributes() {
		let e = this.triMesh.geometry;
		e.setAttribute("in_POSITION0", this.triPositions), e.setAttribute("in_COLOR0", this.triColors), e.setAttribute("in_TEXCOORD0", this.triUVs), e.setIndex(qt(this.capacity));
	}
	ensureCapacity(e) {
		if (!(e <= this.capacity)) {
			for (; this.capacity < e;) this.capacity *= 2;
			this.triMesh.geometry.dispose(), this.triPositions = new T.BufferAttribute(new Float32Array(this.capacity * 12), 3), this.triColors = new T.BufferAttribute(new Uint8Array(this.capacity * 16), 4, !0), this.triUVs = new T.BufferAttribute(new Float32Array(this.capacity * 8), 2), this.setTriAttributes();
		}
	}
	step(e) {
		e > 0 && this.simulation.step(e);
	}
	layout(e, t) {
		let n = B, r = e.screenHeight / n.panelSize[1], i = e.screenHeight * .5, a = n.backgroundSize[0] * .5 * r, o = n.backgroundSize[1] * .5 * r;
		this.backgroundPositions.array.set(Yt.flatMap(([e, n]) => [
			t + e * 2 * a,
			i + n * 2 * o,
			0
		])), this.backgroundPositions.needsUpdate = !0;
		let s = n.particleScale * r, c = this.simulation.tri;
		this.ensureCapacity(c.length);
		let l = this.triPositions.array, u = this.triColors.array, d = this.triUVs.array, [f, p] = n.tri.tiles;
		for (let e = 0; e < c.length; e++) {
			let r = c[e], a = r.age / r.lifetime, o = r.startSize * Bt(n.tri.sizeCurve, a) * s, m = t + r.x * s, h = i + r.y * s, [g, _, v] = r.rotation, y = Math.cos(-v), b = Math.sin(-v), x = Math.cos(g), S = Math.sin(g), ee = Math.cos(_), C = Math.sin(_), te = Math.round(Vt(n.tri.alphaKeys, a) * 255), [w, ne] = Jt(r.frame, n.tri.tiles);
			for (let t = 0; t < 4; t++) {
				let [n, r] = Yt[t], i = n * y - r * b, a = n * b + r * y, s = a * x, c = a * S, g = i * ee + c * C, _ = e * 4 + t;
				l[_ * 3] = m + g * o, l[_ * 3 + 1] = h + s * o, l[_ * 3 + 2] = 0, u.set([
					255,
					255,
					255,
					te
				], _ * 4), d[_ * 2] = w + (n + .5) / f, d[_ * 2 + 1] = ne + (r + .5) / p;
			}
		}
		this.triMesh.geometry.setDrawRange(0, c.length * 6), this.triPositions.needsUpdate = !0, this.triColors.needsUpdate = !0, this.triUVs.needsUpdate = !0;
		let m = n.flare, h = this.simulation.flareAge / m.lifetime, g = m.size * m.sizeMultiplier * Bt(m.sizeCurve, h) * s, _ = t + m.offset[0] * s, v = i + m.offset[1] * s;
		this.flarePositions.array.set(Yt.flatMap(([e, t]) => [
			_ + e * g,
			v + t * g,
			0
		])), this.flarePositions.needsUpdate = !0;
		let y = [...m.color.map((e) => Math.round(e * 255)), Math.round(Vt(m.alphaKeys, h) * 255)];
		for (let e = 0; e < 4; e++) this.flareColors.array.set(y, e * 4);
		this.flareColors.needsUpdate = !0;
	}
	render(e, t, n = t.screenWidth * .5) {
		this.matrixVP.makeOrthographic(0, t.screenWidth, t.screenHeight, 0, -1, 1), this.screenParams.set(t.screenWidth, t.screenHeight, 1 + 1 / t.screenWidth, 1 + 1 / t.screenHeight), this.layout(t, n);
		let r = e.getClearColor(new T.Color()), i = e.getClearAlpha();
		e.setRenderTarget(null), e.setClearColor(this.underlayColor, 1), e.clear(!0, !0, !0);
		let a = e.autoClear;
		e.autoClear = !1, e.render(this.scene, this.camera), e.autoClear = a, e.setClearColor(r, i);
	}
	dispose() {
		for (let e of [
			this.backgroundMesh,
			this.triMesh,
			this.flareMesh,
			this.opaqueMesh
		]) e.geometry.dispose(), e.material.dispose();
		for (let e of Object.values(this.textures)) e.dispose();
	}
}, V = Math.fround, Qt = 1.6;
function $t(e) {
	return V((Number.isFinite(e) && e > 0 ? e : Qt) * 100);
}
function en(e) {
	let t = $t(e);
	return V(V(V(V(t - 160) * .5) + 160) / t);
}
function tn(e) {
	return V(V($t(e) * en(e)) * .01);
}
//#endregion
//#region src/engine/official/sekaiLightComponents.ts
var nn = Math.PI / 180;
function rn(e, t, n) {
	let r = e * nn * .5, i = t * nn * .5, a = n * nn * .5, o = [
		Math.sin(r),
		0,
		0,
		Math.cos(r)
	], s = [
		0,
		Math.sin(i),
		0,
		Math.cos(i)
	], c = [
		0,
		0,
		Math.sin(a),
		Math.cos(a)
	];
	return an(an(s, o), c);
}
function an(e, t) {
	return [
		e[3] * t[0] + e[0] * t[3] + e[1] * t[2] - e[2] * t[1],
		e[3] * t[1] + e[1] * t[3] + e[2] * t[0] - e[0] * t[2],
		e[3] * t[2] + e[2] * t[3] + e[0] * t[1] - e[1] * t[0],
		e[3] * t[3] - e[0] * t[0] - e[1] * t[1] - e[2] * t[2]
	];
}
function on(e, t) {
	let [n, r, i, a] = e, o = n * 2, s = r * 2, c = i * 2, l = n * o, u = r * s, d = i * c, f = n * s, p = n * c, m = r * c, h = a * o, g = a * s, _ = a * c;
	return [
		(1 - (u + d)) * t[0] + (f - _) * t[1] + (p + g) * t[2],
		(f + _) * t[0] + (1 - (l + d)) * t[1] + (m - h) * t[2],
		(p - g) * t[0] + (m + h) * t[1] + (1 - (l + u)) * t[2]
	];
}
function sn(e) {
	return on(e, [
		0,
		0,
		1
	]);
}
function cn(e) {
	return e <= .04045 ? e / 12.92 : e < 1 ? ((e + .055) / 1.055) ** 2.4 : e ** 2.2;
}
var ln = class {
	localRotation = [
		0,
		0,
		0,
		1
	];
	parentRotation = [
		0,
		0,
		0,
		1
	];
	position = [
		0,
		0,
		0
	];
	get rotation() {
		return an(this.parentRotation, this.localRotation);
	}
	get forward() {
		return sn(this.rotation);
	}
	setLocalEulerAngles(e, t, n) {
		this.localRotation = rn(e, t, n);
	}
}, un = class {
	fogColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	fogStart = 1;
	fogEnd = 300;
	intensity = 1;
	quality = 500;
	update(e) {
		e.maximumLOD = this.quality, this.fogStart >= this.fogEnd ? e.setVector("_SekaiFogFactor", 1, 0, 0, 0) : e.setVector("_SekaiFogFactor", Math.fround(this.fogEnd / (this.fogEnd - this.fogStart)), Math.fround(1 / (this.fogEnd - this.fogStart)), 0, 0), e.setColor("_SekaiFogColor", this.fogColor), e.setFloat("_SekaiAllLightIntensity", this.intensity);
	}
}, dn = class {
	useFaceShadowLimiter = !0;
	faceShadowLimitRange = 0;
	shadowTexWeight = 0;
	useShadowFade = !1;
	fade = 1;
	shadowWidth = 0;
	useHsvControl = !1;
	hue = 0;
	saturation = .5;
	value = .5;
	contrast = .5;
	initialize() {
		this.useShadowFade = !1, this.shadowWidth = 0, this.useHsvControl = !1, this.useFaceShadowLimiter = !0, this.faceShadowLimitRange = 0, this.shadowTexWeight = 1, this.hue = 0, this.saturation = .5, this.value = .5, this.contrast = .5;
	}
}, fn = class {
	transform = new ln();
	characterDirectionalLightData = new dn();
	shadowColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	shadowThreshold = .40625;
	start() {
		this.characterDirectionalLightData.initialize();
	}
	update(e) {
		let t = this.transform.forward;
		e.setVector("_WorldSpaceLightPos0", t[0], t[1], t[2], 0), e.setVector("_SekaiDirectionalLight", t[0], t[1], t[2], 0), e.setColor("_SekaiShadowColor", this.shadowColor), e.setFloat("_SekaiShadowThreshold", this.shadowThreshold);
	}
}, H = 12, pn = (e) => [
	e.r,
	e.g,
	e.b,
	e.a
], mn = class e {
	static intensityArray = Array(H).fill(0);
	static colorArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static specularColorArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static outlineColorArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static outlineBlendingArray = Array(H).fill(0);
	ambientColor = {
		r: .5,
		g: .5,
		b: .5,
		a: 1
	};
	intensity = 1;
	specularColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	outlineColor = {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
	outlineBlending = .5;
	formationId = 0;
	update(t) {
		let n = e;
		n.intensityArray[this.formationId] = this.intensity, n.colorArray[this.formationId] = pn(this.ambientColor), n.specularColorArray[this.formationId] = pn(this.specularColor), n.outlineColorArray[this.formationId] = pn(this.outlineColor), n.outlineBlendingArray[this.formationId] = this.outlineBlending, t.setFloatArray("_SekaiCharacterAmbientLightIntensityArray", n.intensityArray), t.setVectorArray("_SekaiCharacterAmbientLightColorArray", n.colorArray), t.setVectorArray("_SekaiCharacterSpecularColorArray", n.specularColorArray), t.setVectorArray("_SekaiCharacterOutlineColorArray", n.outlineColorArray), t.setFloatArray("_SekaiCharacterOutlineBlendingArray", n.outlineBlendingArray);
	}
}, hn = class e {
	static lightArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static colorArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static shadowColorArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static factorArray = Array.from({ length: H }, () => [
		0,
		0,
		0,
		0
	]);
	static shadowSharpnessArray = Array(H).fill(0);
	transform = new ln();
	rimColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	range = 1;
	edgeSmoothness = .0010000000474974513;
	emission = 0;
	directionMode = 0;
	rimDirectionVector = [
		-1,
		0,
		0
	];
	lightInfluence = 1;
	isUseShadowColor = !1;
	shadowRimColor = {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
	shadowSharpness = .5;
	formationId = 0;
	mainCameraLocalToWorld = null;
	setup(e, t, n) {
		this.mainCameraLocalToWorld = t, this.formationId = e, this.range = n;
	}
	getRimLightDirection() {
		let e;
		if (this.directionMode === 1) {
			let t = this.mainCameraLocalToWorld;
			if (!t) throw Error("SekaiCharacterRimLight ScreenVector needs the main camera");
			let [n, r, i] = [
				-this.rimDirectionVector[0],
				-this.rimDirectionVector[1],
				-this.rimDirectionVector[2]
			], a = t[0] * n + t[4] * r + t[8] * i, o = t[1] * n + t[5] * r + t[9] * i, s = t[2] * n + t[6] * r + t[10] * i, c = Math.sqrt(s * s + (a * a + o * o));
			e = c <= 1e-5 ? [
				0,
				0,
				0
			] : [
				a / c,
				o / c,
				s / c
			];
		} else e = this.transform.forward;
		let t = Math.sqrt(e[2] * e[2] + (e[0] * e[0] + e[1] * e[1]));
		return t <= 1e-5 ? [
			0,
			0,
			0
		] : [
			e[0] / t,
			e[1] / t,
			e[2] / t
		];
	}
	update(t) {
		let n = e, r = this.getRimLightDirection();
		n.lightArray[this.formationId] = [
			r[0],
			r[1],
			r[2],
			0
		], n.colorArray[this.formationId] = pn(this.rimColor), n.shadowColorArray[this.formationId] = pn(this.isUseShadowColor ? this.shadowRimColor : this.rimColor), n.factorArray[this.formationId] = [
			this.range,
			this.emission,
			this.edgeSmoothness,
			cn(this.lightInfluence)
		], n.shadowSharpnessArray[this.formationId] = this.shadowSharpness, t.setVectorArray("_SekaiRimLightArray", n.lightArray), t.setVectorArray("_SekaiRimLightColorArray", n.colorArray), t.setVectorArray("_SekaiShadowRimLightColorArray", n.shadowColorArray), t.setVectorArray("_SekaiRimLightFactor", n.factorArray), t.setFloatArray("_SekaiRimLightShadowSharpnessArray", n.shadowSharpnessArray);
	}
}, gn = class {
	transform = new ln();
	outerColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	radiusNear = 999;
	radiusFar = 1e3;
	update(e) {
		let t = this.transform.position;
		e.setVector("_SekaiGlobalSpotLightPos", t[0], t[1], t[2], 0), e.setColor("_SekaiGlobalSpotLightColor", this.outerColor), e.setFloat("_SekaiGlobalSpotLightRadiusNear", this.radiusNear * this.radiusNear), e.setFloat("_SekaiGlobalSpotLightRadiusFar", this.radiusFar * this.radiusFar);
	}
}, _n = class {
	maximumLOD = 2147483647;
	values = /* @__PURE__ */ new Map();
	version = 0;
	get revision() {
		return this.version;
	}
	setFloat(e, t) {
		this.set(e, t);
	}
	setInt(e, t) {
		this.set(e, Math.trunc(t));
	}
	setVector(e, t, n, r, i) {
		this.set(e, [
			t,
			n,
			r,
			i
		]);
	}
	setColor(e, t) {
		this.set(e, [
			t.r,
			t.g,
			t.b,
			t.a
		]);
	}
	setFloatArray(e, t) {
		this.set(e, Float32Array.from(t));
	}
	setVectorArray(e, t) {
		let n = new Float32Array(t.length * 4);
		t.forEach((e, t) => n.set(e, t * 4)), this.set(e, n);
	}
	setTexture(e, t) {
		this.set(e, t);
	}
	get(e) {
		return this.values.get(e);
	}
	set(e, t) {
		this.values.set(e, t), this.version++;
	}
}, vn = {
	DIRECTIONAL_LIGHT_ROTATION: [
		-15,
		50,
		0
	],
	CHARACTER_RIM_LIGHT_ROTATION: [
		20,
		-60,
		0
	],
	CHARACTER_RIM_LIGHT_COLOR: {
		r: .5,
		g: .5,
		b: .5,
		a: 1
	},
	CHARACTER_RIM_LIGHT_RANGE: 7,
	CHARACTER_AMBIENT_LIGHT_COLOR: {
		r: .5,
		g: .5,
		b: .5,
		a: 1
	}
}, yn = class {
	globals;
	settings = new un();
	directional = new fn();
	ambient = new mn();
	rim = new hn();
	spot = new gn();
	constructor(e = new _n()) {
		this.globals = e;
		let t = vn;
		this.settings.quality = 300, this.ambient.formationId = 0, this.rim.setup(0, null, t.CHARACTER_RIM_LIGHT_RANGE), this.rim.rimColor = { ...t.CHARACTER_RIM_LIGHT_COLOR }, this.rim.transform.setLocalEulerAngles(...t.CHARACTER_RIM_LIGHT_ROTATION), this.directional.transform.setLocalEulerAngles(...t.DIRECTIONAL_LIGHT_ROTATION), this.ambient.ambientColor = { ...t.CHARACTER_AMBIENT_LIGHT_COLOR }, this.directional.start();
	}
	setCameraRoot(e, t) {
		for (let n of [
			this.directional.transform,
			this.rim.transform,
			this.spot.transform
		]) n.parentRotation = e, n.position = t;
	}
	setRenderCamera(e) {
		this.rim.mainCameraLocalToWorld = e;
	}
	update() {
		this.settings.update(this.globals), this.directional.update(this.globals), this.ambient.update(this.globals), this.rim.update(this.globals), this.spot.update(this.globals);
	}
}, U = Math.fround;
function bn(e, t) {
	return Number.isNaN(e) ? t : Number.isNaN(t) ? e : Math.min(e, t);
}
function xn(e) {
	return e < 0 ? 0 : bn(e, 1);
}
var Sn = [1920, 1080], Cn = {
	viewerAnchoredX: -583,
	shadowAnchoredX: 35,
	shadowColor: [
		.26666668,
		.26666668,
		.4,
		.10196079
	],
	modelColor: [
		1,
		1,
		1,
		1
	]
}, wn = 10, Tn = U(.001);
function En(e, t) {
	let [n, r] = Sn, i = U(t / e) >= U(r / n) ? 0 : 1, a = U(Math.log2(U(e / n))), o = U(2 ** U(a + U(U(U(Math.log2(U(t / r))) - a) * i))), s = U(e / o), c = U(t / o), l = c, u = U(U(s * .5) + Cn.viewerAnchoredX), d = (e) => ({
		x: U(U(U(u + e) - U(l * .5)) * o),
		y: 0,
		width: U(l * o),
		height: U(l * o)
	});
	return {
		screenWidth: e,
		screenHeight: t,
		scaleFactor: o,
		contentWidth: s,
		contentHeight: c,
		modelTexture: d(0),
		shadowTexture: d(Cn.shadowAnchoredX)
	};
}
var Dn = class {
	studio;
	pointerList = [];
	gestureData = {
		pointerCount: 0,
		prevPointerCount: 0,
		distance: 0,
		prevDistance: 0,
		deltaScale: 0,
		screenPosition: [[0, 0], [0, 0]],
		dragDelta: [[0, 0], [0, 0]]
	};
	currentPinchCenter = 0;
	prevTouchCount = 0;
	isZoomIncontinuous = !1;
	colliderState = "model";
	touches = /* @__PURE__ */ new Map();
	pointerData = /* @__PURE__ */ new Map();
	constructor(e) {
		this.studio = e;
	}
	touchBegan(e, t, n) {
		this.touches.set(e, {
			id: e,
			x: t,
			y: n,
			began: !0,
			ended: !1
		});
	}
	touchMoved(e, t, n) {
		let r = this.touches.get(e);
		!r || r.ended || (r.x = t, r.y = n);
	}
	touchEnded(e, t, n) {
		let r = this.touches.get(e);
		!r || r.ended || (r.x = t, r.y = n, r.ended = !0);
	}
	update(e, t) {
		for (let t of [...this.touches.values()]) {
			let n = !this.pointerData.has(t.id), r = this.pointerData.get(t.id) ?? {
				pointerId: t.id,
				position: [t.x, t.y],
				delta: [0, 0],
				pressPosition: [0, 0],
				pressedCollider: !1
			};
			this.pointerData.set(t.id, r);
			let i = n || t.began;
			r.delta = i ? [0, 0] : [U(t.x - r.position[0]), U(t.y - r.position[1])], r.position = [t.x, t.y], i && (r.pressPosition = [t.x, t.y], this.colliderContains(e, t.x, t.y) && (r.pressedCollider = !0, this.onPointerDown(), this.listenerPointerDown(r))), t.began = !1, t.ended && (r.pressedCollider && (this.onPointerUp(), this.listenerPointerUp(r)), this.pointerData.delete(t.id), this.touches.delete(t.id));
		}
		this.listenerUpdate(t, e.screenHeight);
	}
	get snapshot() {
		return {
			touchCount: this.pointerList.length,
			collider: this.colliderState,
			isZoomIncontinuous: this.isZoomIncontinuous,
			currentPinchCenter: this.currentPinchCenter
		};
	}
	colliderContains(e, t, n) {
		if (this.colliderState === "extended") return !0;
		let r = e.modelTexture, i = this.colliderState === "released" ? U(r.width * .5) : 0;
		return t >= r.x - i && t <= r.x + r.width + i && n >= r.y && n <= r.y + r.height;
	}
	onPointerDown() {
		this.colliderState = "extended";
	}
	onPointerUp() {
		this.colliderState = "released";
	}
	listenerPointerDown(e) {
		this.pointerList.length <= 1 && !this.pointerList.includes(e) && this.pointerList.push(e);
	}
	listenerPointerUp(e) {
		let t = this.pointerList.indexOf(e);
		t >= 0 && this.pointerList.splice(t, 1), this.pointerList.length <= 1 && this.onPinchScaleEnd();
	}
	listenerUpdate(e, t) {
		let n = this.gestureData;
		n.prevDistance = n.distance, n.prevPointerCount = n.pointerCount, n.pointerCount = Math.min(this.pointerList.length, 2);
		for (let e = 0; e < n.pointerCount; e++) n.screenPosition[e] = [...this.pointerList[e].position], n.dragDelta[e] = [...this.pointerList[e].delta];
		let r = this.pointerList.length;
		if (r >= 2) {
			let e = this.pointerList[0].position, r = this.pointerList[1].position, i = U(e[0] - r[0]), a = U(e[1] - r[1]), o = U(Math.sqrt(U(U(i * i) + U(a * a))));
			n.distance = o, n.prevPointerCount < 2 && (n.prevDistance = o), n.deltaScale = U(o - n.prevDistance), this.onPinchScale(t);
		} else if (r === 1) {
			n.deltaScale = 0, n.distance = 0;
			let t = this.pointerList[0], r = U(Math.sqrt(U(U(t.pressPosition[0] * t.pressPosition[0]) + U(t.pressPosition[1] * t.pressPosition[1])))), i = U(Math.sqrt(U(U(t.position[0] * t.position[0]) + U(t.position[1] * t.position[1]))));
			Math.abs(U(r - i)) > wn && this.onDrag(e);
		}
	}
	onDrag(e) {
		let t = this.gestureData;
		if (t.pointerCount > 1) return;
		let [n, r] = t.dragDelta[0];
		this.studio.rotate(U(n * U(-.33)), 0, e), this.studio.moveVertical(U(r * U(-.001)));
	}
	onPinchScale(e) {
		let t = this.gestureData.deltaScale;
		Math.abs(t) > .1 && this.updatePinch(-t, e);
	}
	updatePinch(e, t) {
		let n = this.pointerList.length;
		e < 0 && n !== this.prevTouchCount && this.studio.zoomDurationRatio > 0 ? (this.isZoomIncontinuous = !0, this.updatePinchCenter()) : e > 0 && this.studio.zoomDurationRatio < 1 && (this.isZoomIncontinuous = !1);
		let r = this.isZoomIncontinuous ? this.calculatePinchCenterY(t) : this.studio.zoomMoveValue;
		this.studio.zoom(U(Tn * e), r, !1), this.prevTouchCount = this.pointerList.length;
	}
	updatePinchCenter() {
		let [e, t] = this.gestureData.screenPosition;
		this.currentPinchCenter = U(e[1] + U(U(t[1] - e[1]) * .5));
	}
	calculatePinchCenterY(e) {
		let t = this.studio.zoomMoveValue, n = xn(U(this.currentPinchCenter / e)), r = xn(U(this.studio.zoomDurationRatio * .5));
		return xn(U(t + U(U(n - t) * r)));
	}
	onPinchScaleEnd() {
		this.prevTouchCount = 0;
	}
};
//#endregion
//#region src/costume_shop/costumeShopViewerComposite.ts
function On(e) {
	return e.map((e) => Math.round(Math.min(Math.max(e, 0), 1) * 255));
}
function kn() {
	return new T.WebGLRenderTarget(F.textureWidth, F.textureHeight, {
		format: T.RGBAFormat,
		type: T.UnsignedByteType,
		depthBuffer: !0,
		stencilBuffer: !0,
		generateMipmaps: !1,
		minFilter: T.LinearFilter,
		magFilter: T.LinearFilter,
		wrapS: T.RepeatWrapping,
		wrapT: T.RepeatWrapping,
		colorSpace: T.NoColorSpace
	});
}
var An = class {
	scene = new T.Scene();
	camera = new T.OrthographicCamera(0, 1, 1, 0, -1, 1);
	shadow;
	model;
	matrixVP = new T.Matrix4();
	constructor(e) {
		let t = Ft, n = xt(bt(t, 300), "Default"), r = t.programs[St(n, []).program];
		if (!r) throw Error("UI/Default: program missing from the table");
		let i = (i, a) => {
			let o = new T.RawShaderMaterial({
				name: "UI/Default",
				glslVersion: T.GLSL3,
				vertexShader: R(r.vertex),
				fragmentShader: R(r.fragment),
				uniforms: {
					_ScreenParams: { value: new T.Vector4() },
					hlslcc_mtx4x4unity_ObjectToWorld: { value: new T.Matrix4().elements },
					hlslcc_mtx4x4glstate_matrix_projection: { value: this.matrixVP.elements },
					hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
					_Color: { value: new T.Vector4(1, 1, 1, 1) },
					_ClipRect: { value: new T.Vector4(-32767, -32767, 32767, 32767) },
					_MainTex_ST: { value: new T.Vector4(1, 1, 0, 0) },
					_UIMaskSoftnessX: { value: 0 },
					_UIMaskSoftnessY: { value: 0 },
					_TextureSampleAdd: { value: new T.Vector4(0, 0, 0, 0) },
					_MainTex: { value: e }
				}
			});
			Nt(o, t, n, {
				float: (e) => e === "unity_GUIZTestMode" ? 8 : null,
				color: () => null
			});
			let s = new T.BufferGeometry(), c = new T.BufferAttribute(/* @__PURE__ */ new Float32Array(12), 3);
			s.setAttribute("in_POSITION0", c);
			let l = On(i);
			s.setAttribute("in_COLOR0", new T.BufferAttribute(new Uint8Array([
				...l,
				...l,
				...l,
				...l
			]), 4, !0)), s.setAttribute("in_TEXCOORD0", new T.BufferAttribute(new Float32Array([
				0,
				0,
				0,
				1,
				1,
				1,
				1,
				0
			]), 2)), s.setIndex([
				0,
				1,
				2,
				2,
				3,
				0
			]);
			let u = new T.Mesh(s, o);
			return u.frustumCulled = !1, u.renderOrder = a, this.scene.add(u), {
				mesh: u,
				positions: c,
				material: o
			};
		};
		this.shadow = i(Cn.shadowColor, 0), this.model = i(Cn.modelColor, 1);
	}
	render(e, t, n, r = !0) {
		let { screenWidth: i, screenHeight: a } = t;
		this.matrixVP.makeOrthographic(0, i, a, 0, -1, 1);
		for (let [e, n] of [[this.shadow, t.shadowTexture], [this.model, t.modelTexture]]) jn(e.positions, n), e.material.uniforms._ScreenParams.value.set(i, a, 1 + 1 / i, 1 + 1 / a), e.material.uniformsNeedUpdate = !0;
		this.scene.background = n, e.setRenderTarget(null);
		let o = e.autoClear;
		e.autoClear = r, e.render(this.scene, this.camera), e.autoClear = o;
	}
	dispose() {
		for (let e of [this.shadow, this.model]) e.mesh.geometry.dispose(), e.material.dispose();
	}
};
function jn(e, t) {
	let n = t.x, r = t.y, i = t.x + t.width, a = t.y + t.height;
	e.array.set([
		n,
		r,
		0,
		n,
		a,
		0,
		i,
		a,
		0,
		i,
		r,
		0
	]), e.needsUpdate = !0;
}
//#endregion
//#region src/engine/official/characterModelMaterials.ts
function Mn(e) {
	let t = e.toLowerCase();
	return t === "mtl_chr_00" ? 0 : t === "mtl_chr_eye_00" ? 1 : t === "mtl_chr_eyebrow_00" ? 2 : t === "mtl_chr_eyelash_00" ? 3 : t === "mtl_chr_ehl_00" ? 4 : t === "mtl_chr_hair_00" ? 5 : /mtl_bdy_[0-9]+/.test(t) ? 6 : /mtl_chr_acc_[0-9]+/.test(t) ? 7 : 8;
}
function Nn(e, t) {
	let n = {
		renderQueue: 2e3,
		baseStencil: {
			stencilRef: 0,
			readMask: 255,
			writeMask: 255,
			comp: 8,
			pass: 2,
			fail: 0,
			zFail: 0
		},
		overlayStencil: {
			stencilRef: 0,
			readMask: 255,
			writeMask: 255,
			comp: 0,
			pass: 0,
			fail: 0,
			zFail: 0
		}
	};
	switch (e) {
		case 1:
		case 2:
		case 3: {
			let r = 1 << t >>> 0;
			n.renderQueue = e === 1 ? 2002 : 2001, n.baseStencil.stencilRef = 255, n.baseStencil.writeMask = r, n.overlayStencil = {
				stencilRef: r,
				readMask: r,
				writeMask: r,
				comp: 3,
				pass: 1,
				fail: 0,
				zFail: 0
			};
			break;
		}
		case 5:
			n.renderQueue = 2451, n.baseStencil.writeMask = ~(1 << t) & 255;
			break;
	}
	return n;
}
var W = (e) => e | 0;
function Pn(e) {
	let [t, n, r, i] = e, a = 2 * (i * t - n * r), o = Math.max(-1, Math.min(1, a)), s = Math.asin(o), c, l;
	Math.abs(o) < .9999999 ? (c = Math.atan2(2 * (i * n + t * r), 1 - 2 * (t * t + n * n)), l = Math.atan2(2 * (i * r + t * n), 1 - 2 * (t * t + r * r))) : (c = Math.atan2(-2 * (t * r - i * n), 1 - 2 * (n * n + r * r)), l = 0);
	let u = (e) => {
		let t = e * 180 / Math.PI;
		return t < 0 ? t + 360 : t >= 360 ? t - 360 : t;
	};
	return [
		u(s),
		u(c),
		u(l)
	];
}
function Fn(e, t) {
	let n = Math.sqrt(e * e + t * t);
	return n > 1e-5 ? [e / n, t / n] : [0, 0];
}
var In = class {
	head;
	renderers;
	face;
	acc;
	rendererFormationId = 0;
	stencilFormationId = -1;
	directionalLightRotation = null;
	characterDirectionalLightData = null;
	characterAction = [];
	skin = null;
	constructor(e, t) {
		this.head = t, this.renderers = e, this.face = [...e].reverse().find((e) => e.gameObjectName === "Face"), this.acc = [...e].reverse().find((e) => e.gameObjectName === "Acc");
	}
	*allMaterials() {
		for (let e of this.renderers) for (let t of e.materials) yield t;
	}
	setupRenderQueueAndStencil() {
		for (let { state: e, type: t } of this.allMaterials()) {
			let n = Nn(t, this.stencilFormationId >= 0 ? this.stencilFormationId : this.rendererFormationId);
			e.renderQueue = W(n.renderQueue);
			let r = n.baseStencil;
			e.setInt("_Stencil", W(r.stencilRef)), e.setInt("_ReadMask", W(r.readMask)), e.setInt("_WriteMask", W(r.writeMask)), e.setInt("_StencilComp", r.comp), e.setInt("_StencilOp", r.pass), e.setInt("_StencilFail", r.fail), e.setInt("_StencilZFail", r.zFail);
			let i = n.overlayStencil;
			e.setInt("_EyelashStencil", W(i.stencilRef)), e.setInt("_EyelashReadMask", W(i.readMask)), e.setInt("_EyelashWriteMask", W(i.writeMask)), e.setInt("_EyelashStencilComp", i.comp), e.setInt("_EyelashStencilOp", i.pass), e.setInt("_EyelashStencilFail", i.fail), e.setInt("_EyelashStencilZFail", i.zFail);
		}
	}
	setupFormation(e) {
		this.rendererFormationId = e;
		for (let { state: e } of this.allMaterials()) e.setInt("_CharacterId", this.rendererFormationId);
		this.setupRenderQueueAndStencil();
	}
	setupDirectionalLight(e, t) {
		this.directionalLightRotation = e, this.characterDirectionalLightData = t, this.characterAction.length === 0 && this.characterAction.push(() => this.setupFaceShadowAction());
	}
	addCharacterAction(e) {
		this.characterAction.push(e);
	}
	updateReflection() {
		for (let { state: e } of this.allMaterials()) e.setInt("_CharacterReflectionOff", 0);
	}
	setupDitherTexture(e) {
		for (let { state: t } of this.allMaterials()) t.setTexture("_DitherTex", e);
	}
	setupAccessoryMaterial() {
		if (!(!this.acc || this.acc.materials.length === 0)) for (let { state: e } of this.acc.materials) e.hasFloat("_IsAccessory") && e.setFloat("_IsAccessory", 1);
	}
	setupSkin(e, t, n) {
		this.skin = [
			e,
			t,
			n
		];
		for (let { state: r } of this.allMaterials()) r.setColor("_DefaultSkinColor", e), r.setColor("_Shadow1SkinColor", t), r.setColor("_Shadow2SkinColor", n);
	}
	update() {
		this.updateEyelashData(), this.updateCharacterMaterialParameters();
		for (let e of this.characterAction) e();
	}
	updateEyelashData() {
		let e = this.head();
		if (!e || !this.face) return;
		let t = sn(e.rotation);
		for (let { state: e } of this.face.materials) e.setVector("_FaceFront", t[0], t[1], t[2], 0);
	}
	updateCharacterMaterialParameters() {
		let e = this.characterDirectionalLightData;
		if (e) for (let { state: t } of this.allMaterials()) if (t.setFloat("_ShadowTexWeight", e.shadowTexWeight), e.useShadowFade ? (t.setInt("_FadeMode", e.fade), t.setFloat("_ShadowWidth", e.shadowWidth)) : t.setFloat("_ShadowWidth", 0), e.useHsvControl) {
			let n = Math.fround(e.hue * Math.fround(Math.PI)), r = Math.fround(n + n);
			t.setFloat("_HueSinAngle", Math.sin(r)), t.setFloat("_HueCosAngle", Math.cos(r)), t.setFloat("_Saturation", e.saturation), t.setFloat("_Value", e.value), t.setFloat("_Contrast", e.contrast);
		} else t.setFloat("_HueSinAngle", 0), t.setFloat("_HueCosAngle", 1), t.setFloat("_Saturation", .5), t.setFloat("_Value", .5), t.setFloat("_Contrast", .5);
	}
	setupFaceShadowAction() {
		let e = this.head(), t = this.characterDirectionalLightData;
		if (!e || !t || !this.directionalLightRotation || !this.face) return;
		let n = on(e.rotation, [
			0,
			1,
			0
		]), r = Fn(-n[0], -n[2]), i = Pn(e.rotation)[1], a = this.directionalLightRotation(), o = sn(a), s = Fn(o[0], o[2]), c = Pn(a)[1], l = Math.fround(Math.abs(Math.abs(c - i) - 180) / -180 + 1), u = r[0] * s[0] + r[1] * s[1];
		for (let { state: e } of this.face.materials) t.useFaceShadowLimiter ? e.enableKeyword("_FACE_SHADOW_RANGE_LIMIT") : e.disableKeyword("_FACE_SHADOW_RANGE_LIMIT"), e.setFloat("_RangeLimit", t.faceShadowLimitRange), e.setVector("_HeadDotDirectionalLightValues", u, l, 0, 0);
	}
	get skinColors() {
		return this.skin;
	}
}, Ln = new Uint8Array([
	165,
	105,
	150,
	90,
	45,
	225,
	30,
	210,
	135,
	75,
	180,
	120,
	15,
	195,
	60,
	240
]), Rn = null;
function zn() {
	if (!Rn) {
		let e = new T.DataTexture(Ln, 4, 4, T.RedFormat, T.UnsignedByteType);
		e.name = "BayerMatrix", e.magFilter = T.NearestFilter, e.minFilter = T.NearestFilter, e.wrapS = T.RepeatWrapping, e.wrapT = T.RepeatWrapping, e.generateMipmaps = !1, e.flipY = !1, e.unpackAlignment = 1, e.colorSpace = T.NoColorSpace, e.needsUpdate = !0, Rn = e;
	}
	return Rn;
}
var Bn = {
	white: [
		255,
		255,
		255,
		255
	],
	black: [
		0,
		0,
		0,
		0
	],
	gray: [
		128,
		128,
		128,
		128
	],
	grey: [
		128,
		128,
		128,
		128
	],
	bump: [
		128,
		128,
		255,
		128
	],
	red: [
		255,
		0,
		0,
		0
	]
}, Vn = /* @__PURE__ */ new Map();
function Hn(e) {
	let t = (e || "gray").toLowerCase(), n = Bn[t];
	if (!n) throw Error(`unknown Unity default texture "${e}"`);
	let r = Vn.get(t);
	return r || (r = new T.DataTexture(new Uint8Array(n), 1, 1, T.RGBAFormat, T.UnsignedByteType), r.name = `unity_default_${t}`, r.magFilter = T.NearestFilter, r.minFilter = T.NearestFilter, r.generateMipmaps = !1, r.colorSpace = T.NoColorSpace, r.needsUpdate = !0, Vn.set(t, r)), r;
}
//#endregion
//#region src/engine/official/officialCharacterRenderer.ts
var Un = [
	{
		name: "OpaqueForward",
		lightMode: "SRPDEFAULTUNLIT",
		queue: [0, 2500],
		opaqueSort: !0
	},
	{
		name: "OpaqueOutline",
		lightMode: "SEKAIOUTLINE",
		queue: [0, 2500],
		opaqueSort: !0
	},
	{
		name: "TransparentForward",
		lightMode: "SRPDEFAULTUNLIT",
		queue: [2501, 5e3],
		opaqueSort: !1
	},
	{
		name: "Eyelash",
		lightMode: "SEKAIEYELASH",
		queue: [2001, 2450],
		opaqueSort: !0
	}
], Wn = new T.Matrix4().makeScale(-1, 1, 1);
function Gn(e) {
	return (e.tags.LIGHTMODE ?? e.tags.LightMode ?? "SRPDefaultUnlit").toUpperCase();
}
var Kn = new T.MeshBasicMaterial({ visible: !1 }), qn = /* @__PURE__ */ new WeakMap();
function Jn(e, t) {
	let n = qn.get(e);
	if (!n) {
		let r = e.getAttribute("position").count, i = Math.min(r, 4096), a = Math.ceil(r / i), o = new Float32Array(i * a * t.length * 4);
		t.forEach((e, t) => {
			for (let n = 0; n < r; n++) {
				let r = (t * i * a + n) * 4;
				o[r] = e.getX(n), o[r + 1] = e.getY(n), o[r + 2] = e.getZ(n);
			}
		}), n = new T.DataArrayTexture(o, i, a, t.length), n.format = T.RGBAFormat, n.type = T.FloatType, n.magFilter = T.NearestFilter, n.minFilter = T.NearestFilter, n.needsUpdate = !0, qn.set(e, n);
	}
	return n;
}
var Yn = class {
	sources;
	globals;
	root = new T.Group();
	items = [];
	scratch = {
		objectToWorld: new T.Matrix4(),
		worldToObject: new T.Matrix4(),
		objectFromMesh: new T.Matrix4(),
		view: new T.Matrix4(),
		viewProjection: new T.Matrix4(),
		camera: new T.Vector3(),
		center: new T.Vector3(),
		box: new T.Box3(),
		viewport: new T.Vector4()
	};
	constructor(e, t) {
		this.sources = e, this.globals = t;
		let n = 0;
		for (let r of e) {
			for (let e of r.slots) {
				let i = bt(e.state.table, t.maximumLOD);
				for (let t of i.passes) {
					let i = Gn(t);
					Un.forEach((a, o) => {
						if (a.lightMode !== i || t.variants.length === 0) return;
						let s = this.createItem(r, e.slotIndex, e.state, t, o, n++);
						this.items.push(s);
					});
				}
			}
			let e = r.mesh.material;
			r.mesh.material = Array.isArray(e) ? e.map(() => Kn) : Kn;
		}
	}
	createItem(e, t, n, r, i, a) {
		let o = this.buildPassMaterial(e, n, r), s = e.mesh.geometry, c = s.groups.length ? s.groups.map((e) => e.materialIndex === t ? o.material : Kn) : [o.material], l;
		if (e.mesh.isSkinnedMesh) {
			let t = e.mesh, n = new T.SkinnedMesh(s, c);
			n.bindMode = t.bindMode, n.bind(t.skeleton, t.bindMatrix), l = n;
		} else l = new T.Mesh(s, c);
		l.name = `${e.mesh.name}#${t}:${r.name}`, l.matrixAutoUpdate = !1, l.frustumCulled = !1, l.morphTargetInfluences = e.mesh.morphTargetInfluences, l.morphTargetDictionary = e.mesh.morphTargetDictionary, e.mesh.add(l);
		let u = {
			object: l,
			feature: i,
			state: n,
			pass: r,
			passMaterial: o,
			keywordKey: [...n.enabledKeywords].sort().join(" "),
			source: e,
			slotIndex: t,
			creation: a
		};
		return l.onBeforeRender = (e, t, n) => this.feedUniforms(e, n, u), u;
	}
	buildPassMaterial(e, t, n) {
		let r = e.mesh.geometry, i = r.morphAttributes.tangent, a = r.morphAttributes.position?.length ? {
			count: r.morphAttributes.position.length,
			stride: 1 + +!!r.morphAttributes.normal + +!!r.morphAttributes.color,
			normals: !!r.morphAttributes.normal,
			tangents: !!i?.length
		} : null;
		if (r.morphAttributes.color) throw Error(`${e.mesh.name}: blend-shape vertex colors are not supported`);
		let o = Pt(t.table, n, t.enabledKeywords, {
			skinning: !!e.mesh.isSkinnedMesh,
			morphTargets: a
		}, {
			float: (e) => t.getFloat(e),
			color: (e) => t.getColor(e)
		}), s = o.material.uniforms;
		if (i?.length && o.material.vertexShader.includes("harukiMorphTangentTexture")) {
			let e = Jn(r, i);
			s.harukiMorphTangentTexture = { value: e }, s.harukiMorphTangentTextureSize = { value: new T.Vector2(e.image.width, e.image.height) };
		}
		return o;
	}
	prepare(e) {
		e.getWorldPosition(this.scratch.camera);
		for (let e of this.items) {
			let t = [...e.state.enabledKeywords].sort().join(" ");
			if (t !== e.keywordKey) {
				let n = e.passMaterial.material;
				e.passMaterial = this.buildPassMaterial(e.source, e.state, e.pass);
				let r = e.object.material;
				for (let t = 0; t < r.length; t++) r[t] === n && (r[t] = e.passMaterial.material);
				n.dispose(), e.keywordKey = t;
			}
		}
		let t = /* @__PURE__ */ new Map();
		for (let e of this.items) {
			let n = e.source.mesh.geometry;
			n.boundingBox || n.computeBoundingBox(), this.scratch.box.copy(n.boundingBox).applyMatrix4(e.source.mesh.matrixWorld), this.scratch.box.getCenter(this.scratch.center), t.set(e, this.scratch.center.distanceToSquared(this.scratch.camera));
		}
		[...this.items].sort((e, n) => {
			if (e.feature !== n.feature) return e.feature - n.feature;
			if (e.state.renderQueue !== n.state.renderQueue) return e.state.renderQueue - n.state.renderQueue;
			let r = Un[e.feature].opaqueSort, i = (t.get(e) ?? 0) - (t.get(n) ?? 0);
			return i === 0 ? e.creation - n.creation : r ? i : -i;
		}).forEach((e, t) => {
			let n = Un[e.feature], r = e.state.renderQueue;
			e.object.visible = r >= n.queue[0] && r <= n.queue[1], e.object.renderOrder = t;
		});
	}
	feedUniforms(e, t, n) {
		let r = this.scratch, i = n.passMaterial.material, a = i.uniforms, o = n.source, s = (o.rootBone ?? o.mesh).matrixWorld;
		r.objectToWorld.multiplyMatrices(Wn, s).multiply(Wn), r.worldToObject.copy(r.objectToWorld).invert(), r.objectFromMesh.copy(s).invert().premultiply(Wn).multiply(o.mesh.matrixWorld), a.harukiUnityObjectFromMesh.value.copy(r.objectFromMesh), a.harukiHasVertexColor.value = +!!o.mesh.geometry.getAttribute("color"), r.view.multiplyMatrices(t.matrixWorldInverse, Wn), r.viewProjection.multiplyMatrices(t.projectionMatrix, r.view), t.getWorldPosition(r.camera), e.getViewport(r.viewport);
		let c = t, l = c.near ?? .1, u = c.far ?? 1e3, d = r.viewport.z, f = r.viewport.w;
		for (let e of n.passMaterial.uniforms) this.assign(a[e.name], e, n.state, {
			hlslcc_mtx4x4unity_ObjectToWorld: r.objectToWorld.elements,
			hlslcc_mtx4x4unity_WorldToObject: r.worldToObject.elements,
			hlslcc_mtx4x4unity_MatrixV: r.view.elements,
			hlslcc_mtx4x4unity_MatrixVP: r.viewProjection.elements,
			_WorldSpaceCameraPos: [
				-r.camera.x,
				r.camera.y,
				r.camera.z
			],
			_ProjectionParams: [
				1,
				l,
				u,
				1 / u
			],
			_ScreenParams: [
				d,
				f,
				1 + 1 / d,
				1 + 1 / f
			],
			_ZBufferParams: [
				1 - u / l,
				u / l,
				(1 - u / l) / u,
				u / l / u
			],
			unity_OrthoParams: [
				0,
				0,
				0,
				+!!t.isOrthographicCamera
			],
			_GlobalMipBias: [0, 1]
		});
		i.uniformsNeedUpdate = !0;
	}
	assign(e, t, n, r) {
		if (!e) return;
		let i = t.name, a = r[i];
		if (a) {
			Xn(e, t, a);
			return;
		}
		if (t.type.startsWith("sampler")) {
			let t = n.getTexture(i), r = this.globals.get(i);
			e.value = t ? t.texture ?? Hn(t.defaultName) : r instanceof T.Texture ? r : Hn("gray");
			return;
		}
		if (i.endsWith("_ST")) {
			let r = n.getTexture(i.slice(0, -3));
			if (r) {
				Xn(e, t, r.scaleOffset);
				return;
			}
		}
		let o = n.getFloat(i);
		if (o !== null && !t.arraySize) {
			Xn(e, t, [o]);
			return;
		}
		let s = n.getColor(i);
		if (s && !t.arraySize) {
			Xn(e, t, s);
			return;
		}
		let c = this.globals.get(i);
		c !== void 0 && !(c instanceof T.Texture) && Xn(e, t, typeof c == "number" ? [c] : c);
	}
	dispose() {
		for (let e of this.items) e.object.removeFromParent(), e.passMaterial.material.dispose();
		this.items.length = 0;
	}
};
function Xn(e, t, n) {
	let r = e.value;
	if (typeof r == "number") {
		e.value = t.type === "int" ? Math.trunc(n[0] ?? 0) : n[0] ?? 0;
		return;
	}
	if (r instanceof Float32Array || r instanceof Int32Array) {
		let e = Math.min(r.length, n.length);
		for (let i = 0; i < e; i++) r[i] = t.type.startsWith("i") ? Math.trunc(n[i]) : n[i];
		return;
	}
	r instanceof T.Vector4 ? r.set(n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 0) : r instanceof T.Vector3 ? r.set(n[0] ?? 0, n[1] ?? 0, n[2] ?? 0) : r instanceof T.Vector2 && r.set(n[0] ?? 0, n[1] ?? 0);
}
//#endregion
//#region src/engine/official/officialMaterialState.ts
var Zn = class {
	table;
	name;
	renderQueue;
	floats = /* @__PURE__ */ new Map();
	colors = /* @__PURE__ */ new Map();
	textures = /* @__PURE__ */ new Map();
	keywords = /* @__PURE__ */ new Set();
	version = 0;
	constructor(e, t, n, r) {
		this.table = e, this.name = t, this.renderQueue = n && n.customRenderQueue >= 0 ? n.customRenderQueue : Qn(e);
		for (let t of e.properties) Array.isArray(t.default) ? this.colors.set(t.name, t.default.slice(0, 4)) : typeof t.default == "number" ? this.floats.set(t.name, t.default) : this.textures.set(t.name, {
			texture: null,
			scaleOffset: [
				1,
				1,
				0,
				0
			],
			defaultName: t.default.name
		});
		for (let e of n?.floatProperties ?? []) this.floats.set(e.name, e.value);
		for (let e of n?.intProperties ?? []) this.floats.set(e.name, e.value);
		for (let e of n?.colorProperties ?? []) this.colors.set(e.name, [
			e.r,
			e.g,
			e.b,
			e.a
		]);
		for (let e of n?.textureProperties ?? []) this.textures.set(e.name, {
			texture: r(e.name),
			scaleOffset: [
				e.scaleX,
				e.scaleY,
				e.offsetX,
				e.offsetY
			],
			defaultName: this.textures.get(e.name)?.defaultName ?? "gray"
		});
		for (let e of [...n?.validKeywords ?? [], ...n?.invalidKeywords ?? []]) this.keywords.add(e);
	}
	get revision() {
		return this.version;
	}
	get enabledKeywords() {
		return this.keywords;
	}
	hasFloat(e) {
		return this.floats.has(e);
	}
	getFloat(e) {
		return this.floats.get(e) ?? null;
	}
	getColor(e) {
		return this.colors.get(e) ?? null;
	}
	getTexture(e) {
		return this.textures.get(e) ?? null;
	}
	setFloat(e, t) {
		this.floats.set(e, Math.fround(t)), this.version++;
	}
	setInt(e, t) {
		this.setFloat(e, Math.trunc(t));
	}
	setColor(e, t) {
		this.colors.set(e, [
			t.r,
			t.g,
			t.b,
			t.a
		]), this.version++;
	}
	setVector(e, t, n, r, i) {
		this.colors.set(e, [
			t,
			n,
			r,
			i
		]), this.version++;
	}
	setTexture(e, t) {
		let n = this.textures.get(e);
		this.textures.set(e, {
			texture: t,
			scaleOffset: n ? n.scaleOffset : [
				1,
				1,
				0,
				0
			],
			defaultName: n?.defaultName ?? "gray"
		}), this.version++;
	}
	setTextureOffset(e, t, n) {
		let r = this.textures.get(e);
		if (!r) throw Error(`${this.name}: no texture property ${e}`);
		r.scaleOffset = [
			r.scaleOffset[0],
			r.scaleOffset[1],
			t,
			n
		], this.version++;
	}
	enableKeyword(e) {
		this.keywords.has(e) || (this.keywords.add(e), this.version++);
	}
	disableKeyword(e) {
		this.keywords.delete(e) && this.version++;
	}
};
function Qn(e) {
	let t = e.subShaders[0]?.tags.QUEUE ?? e.subShaders[0]?.tags.Queue;
	if (!t) return 2e3;
	let n = /^(Background|Geometry|AlphaTest|Transparent|Overlay)([+-]\d+)?$/i.exec(t);
	if (!n) throw Error(`${e.shader}: unknown Queue tag ${t}`);
	return {
		background: 1e3,
		geometry: 2e3,
		alphatest: 2450,
		transparent: 3e3,
		overlay: 4e3
	}[n[1].toLowerCase()] + (n[2] ? Number(n[2]) : 0);
}
//#endregion
//#region src/engine/official/sekaiCharacterEye.ts
function $n(e) {
	if (e.tileX !== 0 && e.tileY !== 0) {
		let t = Math.trunc(e.sample % e.tileX), n = Math.trunc(e.sample / e.tileY);
		return [Math.fround(t / e.tileX), Math.fround(1 - Math.fround(n / e.tileY))];
	}
	return [0, 0];
}
var er = ["BS_eye.eye_close", "BS_eye.eye_wink_L"], tr = ["BS_eye.eye_close", "BS_eye.eye_wink_R"];
function nr(e) {
	return !Number.isInteger(e) || e < 1 || e > 31 ? null : e === 14 ? {
		left: [],
		right: []
	} : e === 22 ? {
		left: ["BS_eye.eye_close"],
		right: ["BS_eye.eye_close"]
	} : {
		left: [...er],
		right: [...tr]
	};
}
var rr = "Sekai/Live/Character/Eye-Base", ir = "Sekai/Live/Character/Eye-Highlight", ar = class {
	lightInfluence;
	lightInfluenceForEyeHighlight;
	lightInfluenceShaderParam = 1;
	lightInfluenceForEyeHighlightShaderParam = 1;
	tintColor;
	emissionColor;
	baseTiling;
	highlightTiling;
	leftEyeCloseBlendShapeValue = 0;
	rightEyeCloseBlendShapeValue = 0;
	baseMaterial = null;
	highlightMaterial = null;
	eyelashMaterial = null;
	blendShapeIndexTable = null;
	eyeRenderer = null;
	characterEyeActions = [];
	updateError = null;
	constructor(e) {
		this.lightInfluence = e.lightInfluence, this.lightInfluenceForEyeHighlight = e.lightInfluenceForEyeHighlight, this.tintColor = e.tintColor, this.emissionColor = e.emissionColor, this.baseTiling = e.baseTiling, this.highlightTiling = e.highlightTiling;
	}
	setup(e, t, n) {
		let r = nr(t);
		r && (this.blendShapeIndexTable = {
			leftEyeClose: r.left.map((t) => e.blendShapeIndex(t)),
			rightEyeClose: r.right.map((t) => e.blendShapeIndex(t))
		}, this.eyeRenderer = e, this.getMaterials(e), this.lightInfluence = 1, this.lightInfluenceForEyeHighlight = 1, (n === "MusicVideo" || n === "Gacha") && this.characterEyeActions.push(() => this.updateLightInfluenceShaderParams()));
	}
	getMaterials(e) {
		for (let t of e.materials) t && (this.eyelashMaterial === null && t.name.includes("Eyelash") && (this.eyelashMaterial = t.state), t.shader === rr ? this.baseMaterial = t.state : t.shader === ir && (this.highlightMaterial = t.state));
	}
	update() {
		this.updateError = null, this.getBlendShapeValue();
		let e = this.require(this.baseMaterial, "baseMaterial");
		if (!e) return;
		e.setTextureOffset("_MainTex", ...$n(this.baseTiling));
		let t = this.require(this.highlightMaterial, "highlightMaterial");
		if (!t) return;
		t.setTextureOffset("_MainTex", ...$n(this.highlightTiling)), e.setColor("_TintColor", this.tintColor), t.setColor("_TintColor", this.tintColor), t.setColor("_EmissionColor", this.emissionColor);
		let n = +(this.leftEyeCloseBlendShapeValue >= Math.fround(99.9)), r = +(this.rightEyeCloseBlendShapeValue >= Math.fround(99.9));
		e.setInt("_IsLeftEyeClose", n), t.setInt("_IsLeftEyeClose", n);
		let i = this.require(this.eyelashMaterial, "eyelashMaterial");
		if (i) {
			i.setInt("_IsLeftEyeClose", n), e.setInt("_IsRightEyeClose", r), t.setInt("_IsRightEyeClose", r), i.setInt("_IsRightEyeClose", r);
			for (let e of this.characterEyeActions) e();
			e.setFloat("_LightInfluence", this.lightInfluenceShaderParam), t.setFloat("_LightInfluenceForEyeHighlight", this.lightInfluenceForEyeHighlightShaderParam);
		}
	}
	require(e, t) {
		return e || (this.updateError = `SekaiCharacterEye.Update: ${t} is null (NullReferenceException)`), e;
	}
	getBlendShapeValue() {
		let e = this.blendShapeIndexTable, t = this.eyeRenderer;
		if (!(!e || !t)) {
			this.leftEyeCloseBlendShapeValue = 0, this.rightEyeCloseBlendShapeValue = 0;
			for (let n of e.leftEyeClose) {
				let e = t.blendShapeWeight(n);
				this.leftEyeCloseBlendShapeValue < e && (this.leftEyeCloseBlendShapeValue = e);
			}
			for (let n of e.rightEyeClose) {
				let e = t.blendShapeWeight(n);
				this.rightEyeCloseBlendShapeValue < e && (this.rightEyeCloseBlendShapeValue = e);
			}
		}
	}
	updateLightInfluenceShaderParams() {
		this.lightInfluenceShaderParam = this.lightInfluence, this.lightInfluenceForEyeHighlightShaderParam = this.lightInfluenceForEyeHighlight;
	}
}, or = class {
	serialized;
	rendererMaterials;
	headTransform = null;
	materials = [];
	point = new T.Vector3();
	constructor(e, t) {
		this.serialized = e, this.rendererMaterials = t;
	}
	setup(e, t) {
		this.headTransform = e, this.materials = this.rendererMaterials();
		for (let e of this.materials) t ? (e.enableKeyword("_HAIR_SHADOW"), e.enableKeyword("_LAMBERT")) : (e.disableKeyword("_HAIR_SHADOW"), e.disableKeyword("_LAMBERT"));
	}
	onUpdate() {
		let e = this.headTransform?.();
		if (!e) return;
		let [t, n, r] = this.serialized.offset;
		e.updateWorldMatrix(!0, !1);
		let i = this.point.set(-t, n, r).applyMatrix4(e.matrixWorld);
		for (let e of this.materials) e.setVector("_HeadPosition", -i.x, i.y, i.z, 0);
	}
};
function sr(e) {
	let t = ((e ?? {}).characterControllers ?? {}).hair;
	if (!t) return null;
	let n = t.offset, r = t.gameObject?.transformPathId;
	if (!n || typeof r != "number") throw Error("characterControllers.hair has no offset / GameObject transform");
	return {
		offset: [
			n.x,
			n.y,
			n.z
		],
		rendererTransformPathId: r
	};
}
//#endregion
//#region src/engine/official/installOfficialCharacter.ts
var cr = {
	"-1686991803859250934": "Sekai/Live/Character/Toon-v3",
	"7767892853644477195": "Sekai/Live/Character/Toon",
	"-6807573587472322990": "Sekai/Live/Accessory/Toon",
	"8569198743089531179": "Sekai/Live/Character/Eye-Base",
	"9183286861755933747": "Sekai/Live/Character/Eye-Highlight"
}, lr = {
	"Sekai/Live/Character/Toon-v3": () => import("./Sekai_Live_Character_Toon-v3-XGZIb5UQ.js"),
	"Sekai/Live/Character/Toon": () => import("./Sekai_Live_Character_Toon-Dm8eHoZX.js"),
	"Sekai/Live/Accessory/Toon": () => import("./Sekai_Live_Accessory_Toon-LzVE9cS0.js"),
	"Sekai/Live/Character/Eye-Base": () => import("./Sekai_Live_Character_Eye-Base-DLHDyaOn.js"),
	"Sekai/Live/Character/Eye-Highlight": () => import("./Sekai_Live_Character_Eye-Highlight-B3sbvzqR.js")
}, ur = /* @__PURE__ */ new Map();
function dr(e) {
	let t = ur.get(e);
	if (!t) {
		let n = lr[e];
		if (!n) throw Error(`no official table for shader ${e}`);
		t = n().then((e) => e.default), ur.set(e, t);
	}
	return t;
}
function fr(e) {
	if (e.shaderName) return e.shaderName;
	let t = cr[e.shaderKey?.match(/^ref:-?\d+:(-?\d+)$/)?.[1] ?? String(e.shaderPathId)];
	if (!t) throw Error(`unknown character shader reference ${e.shaderKey ?? e.shaderPathId}`);
	return t;
}
function pr(e, t) {
	let n = (e) => {
		switch (e) {
			case 0: return T.RepeatWrapping;
			case 1: return T.ClampToEdgeWrapping;
			case 2: return T.MirroredRepeatWrapping;
			default: throw Error(`texture ${t.name}: Unity wrap mode ${e} has no WebGL sampler`);
		}
	};
	e.wrapS = n(t.wrapU), e.wrapT = n(t.wrapV);
	let r = t.sourceMipCount > 1;
	t.filterMode === 0 ? (e.magFilter = T.NearestFilter, e.minFilter = r ? T.NearestMipmapNearestFilter : T.NearestFilter) : (e.magFilter = T.LinearFilter, e.minFilter = r ? t.filterMode === 2 ? T.LinearMipmapLinearFilter : T.LinearMipmapNearestFilter : T.LinearFilter), e.anisotropy = Math.max(1, t.anisoLevel || 1);
}
var mr = /* @__PURE__ */ new WeakMap();
async function hr(e, t) {
	if (!t.uri) return null;
	let n = mr.get(e);
	n || (n = /* @__PURE__ */ new Map(), mr.set(e, n));
	let r = JSON.stringify([
		t.uri,
		t.wrapU,
		t.wrapV,
		t.filterMode,
		t.anisoLevel
	]), i = n.get(r);
	return i || (i = e.loadAsync(t.uri).then((e) => {
		let n = e.clone();
		return n.colorSpace = T.NoColorSpace, n.flipY = !1, pr(n, t), n.needsUpdate = !0, n;
	}), n.set(r, i)), i;
}
function gr(e, t) {
	let n = e?.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	return n ? {
		r: parseInt(n[1], 16) / 255,
		g: parseInt(n[2], 16) / 255,
		b: parseInt(n[3], 16) / 255,
		a: 1
	} : t;
}
function _r(e) {
	let t = (e, t) => {
		if (!e || typeof e != "object") throw Error(`runtime extension has no ${t}`);
		return e;
	}, n = (e, t) => e[t] ?? e[t.charAt(0).toUpperCase() + t.slice(1)], r = (e, t, r) => {
		let i = n(e, t);
		if (typeof i != "number" || !Number.isFinite(i)) throw Error(`${r}.${t} is not a number`);
		return i;
	}, i = t(n(t(n(t(e, "runtime extension"), "characterControllers"), "characterControllers"), "eye"), "characterControllers.eye (SekaiCharacterEye)"), a = (e) => {
		let a = t(n(i, e), `SekaiCharacterEye.${e}`), o = `SekaiCharacterEye.${e}`;
		return {
			r: r(a, "r", o),
			g: r(a, "g", o),
			b: r(a, "b", o),
			a: r(a, "a", o)
		};
	}, o = (e) => {
		let a = t(n(i, e), `SekaiCharacterEye.${e}`), o = `SekaiCharacterEye.${e}`;
		return {
			tileX: r(a, "tileX", o),
			tileY: r(a, "tileY", o),
			sample: r(a, "sample", o)
		};
	};
	return {
		lightInfluence: r(i, "lightInfluence", "SekaiCharacterEye"),
		lightInfluenceForEyeHighlight: r(i, "lightInfluenceForEyeHighlight", "SekaiCharacterEye"),
		tintColor: a("tintColor"),
		emissionColor: a("emissionColor"),
		baseTiling: o("baseTiling"),
		highlightTiling: o("highlightTiling")
	};
}
async function vr(e) {
	let { root: t, bodyAsset: n, headAsset: r, textureLoader: i, globals: a } = e, o = [...n.bodyMaterials, ...r.faceMaterials], s = /* @__PURE__ */ new Map(), c = [];
	await Promise.all(o.map(async (e) => {
		let t = e.rawMaterial;
		if (!t) throw Error(`material slot ${e.materialKey} has no raw material`);
		let n = await dr(fr(t));
		bt(n, a.maximumLOD);
		let r = /* @__PURE__ */ new Map();
		await Promise.all(t.textureProperties.map(async (e) => {
			r.set(e.name, await hr(i, e));
		}));
		let o = new Zn(n, e.materialName ?? "", t, (e) => r.get(e) ?? null);
		s.set(e.materialKey, o), c.push(o);
	}));
	let l = [], u = [], d = /* @__PURE__ */ new Map();
	for (let e of o) {
		let t = s.get(e.materialKey);
		t && e.rawMaterial && d.set(t, fr(e.rawMaterial));
	}
	let f = null;
	t.updateMatrixWorld(!0), t.traverse((e) => {
		let t = e;
		if (!t.isMesh || !t.userData.pjskNativeUnityMesh) return;
		let n = Array.isArray(t.material) ? t.material : [t.material], r = [], i = [];
		n.forEach((e, n) => {
			let a = e.userData.pjskMaterialKey, o = typeof a == "string" ? s.get(a) : void 0;
			if (!o) throw Error(`mesh ${t.name} slot ${n}: material ${a} has no exported slot`);
			r.push({
				slotIndex: n,
				state: o
			}), i.push({
				state: o,
				type: Mn(o.name)
			});
		}), l.push({
			mesh: t,
			rootBone: t.userData.pjskUnityRootBone ?? null,
			slots: r
		}), !f && t.name.replace(/^.*:/, "") === "Face" && (f = {
			mesh: t,
			slots: r
		}), u.push({
			gameObjectName: t.name,
			materials: i
		});
	});
	let p = (e) => {
		let t = e.getWorldQuaternion(new T.Quaternion());
		return [
			t.x,
			-t.y,
			-t.z,
			t.w
		];
	}, m = new In(u, () => {
		let t = e.headBone();
		return t ? { rotation: p(t) } : null;
	});
	m.setupFormation(0), m.setupDirectionalLight(() => e.directionalLight.transform.rotation, e.directionalLight.characterDirectionalLightData);
	let h = null, g = f;
	if (g) {
		h = new ar(_r(e.runtimeExtension));
		let t = g.mesh;
		h.setup({
			materials: g.slots.map(({ state: e }) => ({
				name: e.name,
				shader: d.get(e) ?? "",
				state: e
			})),
			blendShapeIndex: (e) => t.morphTargetDictionary?.[e] ?? -1,
			blendShapeWeight: (e) => {
				let n = t.morphTargetInfluences;
				return n && e >= 0 && e < n.length ? Math.fround(n[e] * 100) : 0;
			}
		}, Number(r.characterId), "None");
	}
	m.updateReflection(), m.setupDitherTexture(zn()), m.setupAccessoryMaterial();
	let _ = e.skinColors;
	if (!_) throw Error("installOfficialCharacter: the role's skin colors (gameCharacterUnits) are required");
	let v = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	m.setupSkin(gr(_.default, v), gr(_.shadow1, v), gr(_.shadow2, v)), m.setupFormation(0);
	let y = sr(e.runtimeExtension);
	if (y) {
		let t = e.transformByPathId(y.rendererTransformPathId);
		if (!t) throw Error("SekaiCharacterHair renderer transform is not in the character");
		let n = new or(y, () => l.filter((e) => e.mesh.parent === t).flatMap((e) => e.slots.map(({ state: e }) => e)));
		e.headBone() && n.setup(e.headBone, !0), m.addCharacterAction(() => n.onUpdate());
	}
	return {
		renderer: new Yn(l, a),
		model: m,
		eye: h,
		states: c
	};
}
//#endregion
//#region src/engine/official/sekaiCharacterOutlinePass.ts
var G = {
	outlineWidthMin: .03999999910593033,
	outlineWidthMax: .949999988079071,
	outlineDistanceNear: .44999998807907104,
	outlineDistanceFar: 20,
	fovCurve: [{
		time: -.013763427734375,
		value: 27.81246566772461,
		outTangent: -.13214513659477234
	}, {
		time: 100.92341613769531,
		value: -.03620624542236328,
		inTangent: -.5713597536087036
	}]
};
function yr(e) {
	let [t, n] = G.fovCurve;
	if (e <= t.time) return t.value;
	if (e >= n.time) return n.value;
	let r = n.time - t.time, i = (e - t.time) / r, a = i * i, o = a * i;
	return (2 * o - 3 * a + 1) * t.value + (o - 2 * a + i) * r * t.outTangent + (-2 * o + 3 * a) * n.value + (o - a) * r * n.inTangent;
}
function br(e, t) {
	let n = yr(t);
	e.setVector("_SekaiOutlineWidth", Math.fround(G.outlineWidthMin * .01), Math.fround(G.outlineWidthMax * .01), 0, 0), e.setVector("_SekaiOutlineFactor", G.outlineDistanceNear, Math.fround(1 / (G.outlineDistanceFar - G.outlineDistanceNear)), Math.fround(t / n), 0);
}
//#endregion
//#region node_modules/three/examples/jsm/utils/WorkerPool.js
var xr = class {
	constructor(e = 4) {
		this.pool = e, this.queue = [], this.workers = [], this.workersResolve = [], this.workerStatus = 0, this.workerCreator = null;
	}
	_initWorker(e) {
		if (!this.workers[e]) {
			let t = this.workerCreator();
			t.addEventListener("message", this._onMessage.bind(this, e)), this.workers[e] = t;
		}
	}
	_getIdleWorker() {
		for (let e = 0; e < this.pool; e++) if (!(this.workerStatus & 1 << e)) return e;
		return -1;
	}
	_onMessage(e, t) {
		let n = this.workersResolve[e];
		if (n && n(t), this.queue.length) {
			let { resolve: t, msg: n, transfer: r } = this.queue.shift();
			this.workersResolve[e] = t, this.workers[e].postMessage(n, r);
		} else this.workerStatus ^= 1 << e;
	}
	setWorkerCreator(e) {
		this.workerCreator = e;
	}
	setWorkerLimit(e) {
		this.pool = e;
	}
	postMessage(e, t) {
		return new Promise((n) => {
			let r = this._getIdleWorker();
			r === -1 ? this.queue.push({
				resolve: n,
				msg: e,
				transfer: t
			}) : (this._initWorker(r), this.workerStatus |= 1 << r, this.workersResolve[r] = n, this.workers[r].postMessage(e, t));
		});
	}
	dispose() {
		this.workers.forEach((e) => e.terminate()), this.workersResolve.length = 0, this.workers.length = 0, this.queue.length = 0, this.workerStatus = 0;
	}
}, Sr = 1000066e3, Cr = class {
	constructor() {
		this.vkFormat = 0, this.typeSize = 1, this.pixelWidth = 0, this.pixelHeight = 0, this.pixelDepth = 0, this.layerCount = 0, this.faceCount = 1, this.supercompressionScheme = 0, this.levels = [], this.dataFormatDescriptor = [{
			vendorId: 0,
			descriptorType: 0,
			descriptorBlockSize: 0,
			versionNumber: 2,
			colorModel: 0,
			colorPrimaries: 1,
			transferFunction: 2,
			flags: 0,
			texelBlockDimension: [
				0,
				0,
				0,
				0
			],
			bytesPlane: [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			],
			samples: []
		}], this.keyValue = {}, this.globalData = null;
	}
}, wr = class {
	constructor(e, t, n, r) {
		this._dataView = void 0, this._littleEndian = void 0, this._offset = void 0, this._dataView = new DataView(e.buffer, e.byteOffset + t, n), this._littleEndian = r, this._offset = 0;
	}
	_nextUint8() {
		let e = this._dataView.getUint8(this._offset);
		return this._offset += 1, e;
	}
	_nextUint16() {
		let e = this._dataView.getUint16(this._offset, this._littleEndian);
		return this._offset += 2, e;
	}
	_nextUint32() {
		let e = this._dataView.getUint32(this._offset, this._littleEndian);
		return this._offset += 4, e;
	}
	_nextUint64() {
		let e = this._dataView.getUint32(this._offset, this._littleEndian) + 2 ** 32 * this._dataView.getUint32(this._offset + 4, this._littleEndian);
		return this._offset += 8, e;
	}
	_nextInt32() {
		let e = this._dataView.getInt32(this._offset, this._littleEndian);
		return this._offset += 4, e;
	}
	_nextUint8Array(e) {
		let t = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._offset, e);
		return this._offset += e, t;
	}
	_skip(e) {
		return this._offset += e, this;
	}
	_scan(e, t) {
		t === void 0 && (t = 0);
		let n = this._offset, r = 0;
		for (; this._dataView.getUint8(this._offset) !== t && r < e;) r++, this._offset++;
		return r < e && this._offset++, new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + n, r);
	}
};
new Uint8Array([0]);
var K = [
	171,
	75,
	84,
	88,
	32,
	50,
	48,
	187,
	13,
	10,
	26,
	10
];
function Tr(e) {
	return new TextDecoder().decode(e);
}
function Er(e) {
	let t = new Uint8Array(e.buffer, e.byteOffset, K.length);
	if (t[0] !== K[0] || t[1] !== K[1] || t[2] !== K[2] || t[3] !== K[3] || t[4] !== K[4] || t[5] !== K[5] || t[6] !== K[6] || t[7] !== K[7] || t[8] !== K[8] || t[9] !== K[9] || t[10] !== K[10] || t[11] !== K[11]) throw Error("Missing KTX 2.0 identifier.");
	let n = new Cr(), r = 17 * Uint32Array.BYTES_PER_ELEMENT, i = new wr(e, K.length, r, !0);
	n.vkFormat = i._nextUint32(), n.typeSize = i._nextUint32(), n.pixelWidth = i._nextUint32(), n.pixelHeight = i._nextUint32(), n.pixelDepth = i._nextUint32(), n.layerCount = i._nextUint32(), n.faceCount = i._nextUint32();
	let a = i._nextUint32();
	n.supercompressionScheme = i._nextUint32();
	let o = i._nextUint32(), s = i._nextUint32(), c = i._nextUint32(), l = i._nextUint32(), u = i._nextUint64(), d = i._nextUint64(), f = new wr(e, K.length + r, 3 * a * 8, !0);
	for (let t = 0; t < a; t++) n.levels.push({
		levelData: new Uint8Array(e.buffer, e.byteOffset + f._nextUint64(), f._nextUint64()),
		uncompressedByteLength: f._nextUint64()
	});
	let p = new wr(e, o, s, !0), m = {
		vendorId: p._skip(4)._nextUint16(),
		descriptorType: p._nextUint16(),
		versionNumber: p._nextUint16(),
		descriptorBlockSize: p._nextUint16(),
		colorModel: p._nextUint8(),
		colorPrimaries: p._nextUint8(),
		transferFunction: p._nextUint8(),
		flags: p._nextUint8(),
		texelBlockDimension: [
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8()
		],
		bytesPlane: [
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8()
		],
		samples: []
	}, h = (m.descriptorBlockSize / 4 - 6) / 4;
	for (let e = 0; e < h; e++) {
		let t = {
			bitOffset: p._nextUint16(),
			bitLength: p._nextUint8(),
			channelType: p._nextUint8(),
			samplePosition: [
				p._nextUint8(),
				p._nextUint8(),
				p._nextUint8(),
				p._nextUint8()
			],
			sampleLower: -Infinity,
			sampleUpper: Infinity
		};
		64 & t.channelType ? (t.sampleLower = p._nextInt32(), t.sampleUpper = p._nextInt32()) : (t.sampleLower = p._nextUint32(), t.sampleUpper = p._nextUint32()), m.samples[e] = t;
	}
	n.dataFormatDescriptor.length = 0, n.dataFormatDescriptor.push(m);
	let g = new wr(e, c, l, !0);
	for (; g._offset < l;) {
		let e = g._nextUint32(), t = g._scan(e), r = Tr(t);
		if (n.keyValue[r] = g._nextUint8Array(e - t.byteLength - 1), r.match(/^ktx/i)) {
			let e = Tr(n.keyValue[r]);
			n.keyValue[r] = e.substring(0, e.lastIndexOf("\0"));
		}
		g._skip(e % 4 ? 4 - e % 4 : 0);
	}
	if (d <= 0) return n;
	let _ = new wr(e, u, d, !0), v = _._nextUint16(), y = _._nextUint16(), b = _._nextUint32(), x = _._nextUint32(), S = _._nextUint32(), ee = _._nextUint32(), C = [];
	for (let e = 0; e < a; e++) C.push({
		imageFlags: _._nextUint32(),
		rgbSliceByteOffset: _._nextUint32(),
		rgbSliceByteLength: _._nextUint32(),
		alphaSliceByteOffset: _._nextUint32(),
		alphaSliceByteLength: _._nextUint32()
	});
	let te = u + _._offset, w = te + b, ne = w + x, T = ne + S;
	return n.globalData = {
		endpointCount: v,
		selectorCount: y,
		imageDescs: C,
		endpointsData: new Uint8Array(e.buffer, e.byteOffset + te, b),
		selectorsData: new Uint8Array(e.buffer, e.byteOffset + w, x),
		tablesData: new Uint8Array(e.buffer, e.byteOffset + ne, S),
		extendedData: new Uint8Array(e.buffer, e.byteOffset + T, ee)
	}, n;
}
//#endregion
//#region node_modules/three/examples/jsm/libs/zstddec.module.js
var Dr, q, Or, kr = { env: { emscripten_notify_memory_growth: function(e) {
	Or = new Uint8Array(q.exports.memory.buffer);
} } }, Ar = class {
	init() {
		return Dr || (Dr = typeof fetch < "u" ? fetch("data:application/wasm;base64," + jr).then((e) => e.arrayBuffer()).then((e) => WebAssembly.instantiate(e, kr)).then(this._init) : WebAssembly.instantiate(Buffer.from(jr, "base64"), kr).then(this._init), Dr);
	}
	_init(e) {
		q = e.instance, kr.env.emscripten_notify_memory_growth(0);
	}
	decode(e, t = 0) {
		if (!q) throw Error("ZSTDDecoder: Await .init() before decoding.");
		let n = e.byteLength, r = q.exports.malloc(n);
		Or.set(e, r), t ||= Number(q.exports.ZSTD_findDecompressedSize(r, n));
		let i = q.exports.malloc(t), a = q.exports.ZSTD_decompress(i, t, r, n), o = Or.slice(i, i + a);
		return q.exports.free(r), q.exports.free(i), o;
	}
}, jr = "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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY0AAQMyIFEAMiBg0AIANBHzYCfCADIANB/ABqIANB+ABqIAQgBCAFaiAGGyIEIAEgAmoiAiAEaxAVIgUQAw0AIAMoAnwiBkEfSw0AIAMoAngiB0EJTw0AIABBiCBqIAMgBkGAC0GADCAHEBggA0E0NgJ8IAMgA0H8AGogA0H4AGogBCAFaiIEIAIgBGsQFSIFEAMNACADKAJ8IgZBNEsNACADKAJ4IgdBCk8NACAAQZAwaiADIAZBgA1B4A4gBxAYIANBIzYCfCADIANB/ABqIANB+ABqIAQgBWoiBCACIARrEBUiBRADDQAgAygCfCIGQSNLDQAgAygCeCIHQQpPDQAgACADIAZBwBBB0BEgBxAYIAQgBWoiBEEMaiIFIAJLDQAgAiAFayEFQQAhAgNAIAJBA0cEQCAEKAAAIgZBf2ogBU8NAiAAIAJBAnRqQZzQAWogBjYCACACQQFqIQIgBEEEaiEEDAELCyAEIAFrIQgLIANBgAFqJAAgCAtGAQN/IABBCGohAyAAKAIEIQJBACEAA0AgACACdkUEQCABIAMgAEEDdGotAAJBFktqIQEgAEEBaiEADAELCyABQQggAmt0C4YDAQV/Qbh/IQcCQCADRQ0AIAItAAAiBEUEQCABQQA2AgBBAUG4fyADQQFGGw8LAn8gAkEBaiIFIARBGHRBGHUiBkF/Sg0AGiAGQX9GBEAgA0EDSA0CIAUvAABBgP4BaiEEIAJBA2oMAQsgA0ECSA0BIAItAAEgBEEIdHJBgIB+aiEEIAJBAmoLIQUgASAENgIAIAVBAWoiASACIANqIgNLDQBBbCEHIABBEGogACAFLQAAIgVBBnZBI0EJIAEgAyABa0HAEEHQEUHwEiAAKAKM4QEgACgCnOIBIAQQHyIGEAMiCA0AIABBmCBqIABBCGogBUEEdkEDcUEfQQggASABIAZqIAgbIgEgAyABa0GAC0GADEGAFyAAKAKM4QEgACgCnOIBIAQQHyIGEAMiCA0AIABBoDBqIABBBGogBUECdkEDcUE0QQkgASABIAZqIAgbIgEgAyABa0GADUHgDkGQGSAAKAKM4QEgACgCnOIBIAQQHyIAEAMNACAAIAFqIAJrIQcLIAcLrQMBCn8jAEGABGsiCCQAAn9BUiACQf8BSw0AGkFUIANBDEsNABogAkEBaiELIABBBGohCUGAgAQgA0F/anRBEHUhCkEAIQJBASEEQQEgA3QiB0F/aiIMIQUDQCACIAtGRQRAAkAgASACQQF0Ig1qLwEAIgZB//8DRgRAIAkgBUECdGogAjoAAiAFQX9qIQVBASEGDAELIARBACAKIAZBEHRBEHVKGyEECyAIIA1qIAY7AQAgAkEBaiECDAELCyAAIAQ7AQIgACADOwEAIAdBA3YgB0EBdmpBA2ohBkEAIQRBACECA0AgBCALRkUEQCABIARBAXRqLgEAIQpBACEAA0AgACAKTkUEQCAJIAJBAnRqIAQ6AAIDQCACIAZqIAxxIgIgBUsNAAsgAEEBaiEADAELCyAEQQFqIQQMAQsLQX8gAg0AGkEAIQIDfyACIAdGBH9BAAUgCCAJIAJBAnRqIgAtAAJBAXRqIgEgAS8BACIBQQFqOwEAIAAgAyABEBRrIgU6AAMgACABIAVB/wFxdCAHazsBACACQQFqIQIMAQsLCyEFIAhBgARqJAAgBQvjBgEIf0FsIQcCQCACQQNJDQACQAJAAkACQCABLQAAIgNBA3EiCUEBaw4DAwEAAgsgACgCiOEBDQBBYg8LIAJBBUkNAkEDIQYgASgAACEFAn8CQAJAIANBAnZBA3EiCEF+aiIEQQFNBEAgBEEBaw0BDAILIAVBDnZB/wdxIQQgBUEEdkH/B3EhAyAIRQwCCyAFQRJ2IQRBBCEGIAVBBHZB//8AcSEDQQAMAQsgBUEEdkH//w9xIgNBgIAISw0DIAEtAARBCnQgBUEWdnIhBEEFIQZBAAshBSAEIAZqIgogAksNAgJAIANBgQZJDQAgACgCnOIBRQ0AQQAhAgNAIAJBg4ABSw0BIAJBQGshAgwAAAsACwJ/IAlBA0YEQCABIAZqIQEgAEHw4gFqIQIgACgCDCEGIAUEQCACIAMgASAEIAYQXwwCCyACIAMgASAEIAYQXQwBCyAAQbjQAWohAiABIAZqIQEgAEHw4gFqIQYgAEGo0ABqIQggBQRAIAggBiADIAEgBCACEF4MAQsgCCAGIAMgASAEIAIQXAsQAw0CIAAgAzYCgOIBIABBATYCiOEBIAAgAEHw4gFqNgLw4QEgCUECRgRAIAAgAEGo0ABqNgIMCyAAIANqIgBBiOMBakIANwAAIABBgOMBakIANwAAIABB+OIBakIANwAAIABB8OIBakIANwAAIAoPCwJ/AkACQAJAIANBAnZBA3FBf2oiBEECSw0AIARBAWsOAgACAQtBASEEIANBA3YMAgtBAiEEIAEvAABBBHYMAQtBAyEEIAEQIUEEdgsiAyAEaiIFQSBqIAJLBEAgBSACSw0CIABB8OIBaiABIARqIAMQCyEBIAAgAzYCgOIBIAAgATYC8OEBIAEgA2oiAEIANwAYIABCADcAECAAQgA3AAggAEIANwAAIAUPCyAAIAM2AoDiASAAIAEgBGo2AvDhASAFDwsCfwJAAkACQCADQQJ2QQNxQX9qIgRBAksNACAEQQFrDgIAAgELQQEhByADQQN2DAILQQIhByABLwAAQQR2DAELIAJBBEkgARAhIgJBj4CAAUtyDQFBAyEHIAJBBHYLIQIgAEHw4gFqIAEgB2otAAAgAkEgahAQIQEgACACNgKA4gEgACABNgLw4QEgB0EBaiEHCyAHC0sAIABC+erQ0OfJoeThADcDICAAQgA3AxggAELP1tO+0ser2UI3AxAgAELW64Lu6v2J9eAANwMIIABCADcDACAAQShqQQBBKBAQGgviAgICfwV+IABBKGoiASAAKAJIaiECAn4gACkDACIDQiBaBEAgACkDECIEQgeJIAApAwgiBUIBiXwgACkDGCIGQgyJfCAAKQMgIgdCEol8IAUQGSAEEBkgBhAZIAcQGQwBCyAAKQMYQsXP2bLx5brqJ3wLIAN8IQMDQCABQQhqIgAgAk0EQEIAIAEpAAAQCSADhUIbiUKHla+vmLbem55/fkLj3MqV/M7y9YV/fCEDIAAhAQwBCwsCQCABQQRqIgAgAksEQCABIQAMAQsgASgAAK1Ch5Wvr5i23puef34gA4VCF4lCz9bTvtLHq9lCfkL5893xmfaZqxZ8IQMLA0AgACACSQRAIAAxAABCxc/ZsvHluuonfiADhUILiUKHla+vmLbem55/fiEDIABBAWohAAwBCwsgA0IhiCADhULP1tO+0ser2UJ+IgNCHYggA4VC+fPd8Zn2masWfiIDQiCIIAOFC+8CAgJ/BH4gACAAKQMAIAKtfDcDAAJAAkAgACgCSCIDIAJqIgRBH00EQCABRQ0BIAAgA2pBKGogASACECAgACgCSCACaiEEDAELIAEgAmohAgJ/IAMEQCAAQShqIgQgA2ogAUEgIANrECAgACAAKQMIIAQpAAAQCTcDCCAAIAApAxAgACkAMBAJNwMQIAAgACkDGCAAKQA4EAk3AxggACAAKQMgIABBQGspAAAQCTcDICAAKAJIIQMgAEEANgJIIAEgA2tBIGohAQsgAUEgaiACTQsEQCACQWBqIQMgACkDICEFIAApAxghBiAAKQMQIQcgACkDCCEIA0AgCCABKQAAEAkhCCAHIAEpAAgQCSEHIAYgASkAEBAJIQYgBSABKQAYEAkhBSABQSBqIgEgA00NAAsgACAFNwMgIAAgBjcDGCAAIAc3AxAgACAINwMICyABIAJPDQEgAEEoaiABIAIgAWsiBBAgCyAAIAQ2AkgLCy8BAX8gAEUEQEG2f0EAIAMbDwtBun8hBCADIAFNBH8gACACIAMQEBogAwVBun8LCy8BAX8gAEUEQEG2f0EAIAMbDwtBun8hBCADIAFNBH8gACACIAMQCxogAwVBun8LC6gCAQZ/IwBBEGsiByQAIABB2OABaikDAEKAgIAQViEIQbh/IQUCQCAEQf//B0sNACAAIAMgBBBCIgUQAyIGDQAgACgCnOIBIQkgACAHQQxqIAMgAyAFaiAGGyIKIARBACAFIAYbayIGEEAiAxADBEAgAyEFDAELIAcoAgwhBCABRQRAQbp/IQUgBEEASg0BCyAGIANrIQUgAyAKaiEDAkAgCQRAIABBADYCnOIBDAELAkACQAJAIARBBUgNACAAQdjgAWopAwBCgICACFgNAAwBCyAAQQA2ApziAQwBCyAAKAIIED8hBiAAQQA2ApziASAGQRRPDQELIAAgASACIAMgBSAEIAgQOSEFDAELIAAgASACIAMgBSAEIAgQOiEFCyAHQRBqJAAgBQtnACAAQdDgAWogASACIAAoAuzhARAuIgEQAwRAIAEPC0G4fyECAkAgAQ0AIABB7OABaigCACIBBEBBYCECIAAoApjiASABRw0BC0EAIQIgAEHw4AFqKAIARQ0AIABBkOEBahBDCyACCycBAX8QVyIERQRAQUAPCyAEIAAgASACIAMgBBBLEE8hACAEEFYgAAs/AQF/AkACQAJAIAAoAqDiAUEBaiIBQQJLDQAgAUEBaw4CAAECCyAAEDBBAA8LIABBADYCoOIBCyAAKAKU4gELvAMCB38BfiMAQRBrIgkkAEG4fyEGAkAgBCgCACIIQQVBCSAAKALs4QEiBRtJDQAgAygCACIHQQFBBSAFGyAFEC8iBRADBEAgBSEGDAELIAggBUEDakkNACAAIAcgBRBJIgYQAw0AIAEgAmohCiAAQZDhAWohCyAIIAVrIQIgBSAHaiEHIAEhBQNAIAcgAiAJECwiBhADDQEgAkF9aiICIAZJBEBBuH8hBgwCCyAJKAIAIghBAksEQEFsIQYMAgsgB0EDaiEHAn8CQAJAAkAgCEEBaw4CAgABCyAAIAUgCiAFayAHIAYQSAwCCyAFIAogBWsgByAGEEcMAQsgBSAKIAVrIActAAAgCSgCCBBGCyIIEAMEQCAIIQYMAgsgACgC8OABBEAgCyAFIAgQRQsgAiAGayECIAYgB2ohByAFIAhqIQUgCSgCBEUNAAsgACkD0OABIgxCf1IEQEFsIQYgDCAFIAFrrFINAQsgACgC8OABBEBBaiEGIAJBBEkNASALEEQhDCAHKAAAIAynRw0BIAdBBGohByACQXxqIQILIAMgBzYCACAEIAI2AgAgBSABayEGCyAJQRBqJAAgBgsuACAAECsCf0EAQQAQAw0AGiABRSACRXJFBEBBYiAAIAEgAhA9EAMNARoLQQALCzcAIAEEQCAAIAAoAsTgASABKAIEIAEoAghqRzYCnOIBCyAAECtBABADIAFFckUEQCAAIAEQWwsL0QIBB38jAEEQayIGJAAgBiAENgIIIAYgAzYCDCAFBEAgBSgCBCEKIAUoAgghCQsgASEIAkACQANAIAAoAuzhARAWIQsCQANAIAQgC0kNASADKAAAQXBxQdDUtMIBRgRAIAMgBBAiIgcQAw0EIAQgB2shBCADIAdqIQMMAQsLIAYgAzYCDCAGIAQ2AggCQCAFBEAgACAFEE5BACEHQQAQA0UNAQwFCyAAIAogCRBNIgcQAw0ECyAAIAgQUCAMQQFHQQAgACAIIAIgBkEMaiAGQQhqEEwiByIDa0EAIAMQAxtBCkdyRQRAQbh/IQcMBAsgBxADDQMgAiAHayECIAcgCGohCEEBIQwgBigCDCEDIAYoAgghBAwBCwsgBiADNgIMIAYgBDYCCEG4fyEHIAQNASAIIAFrIQcMAQsgBiADNgIMIAYgBDYCCAsgBkEQaiQAIAcLRgECfyABIAAoArjgASICRwRAIAAgAjYCxOABIAAgATYCuOABIAAoArzgASEDIAAgATYCvOABIAAgASADIAJrajYCwOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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", Mr = "display-p3", Nr = "display-p3-linear", Pr = /* @__PURE__ */ new WeakMap(), Fr = 0, Ir, J = class e extends pe {
	constructor(e) {
		super(e), this.transcoderPath = "", this.transcoderBinary = null, this.transcoderPending = null, this.workerPool = new xr(), this.workerSourceURL = "", this.workerConfig = null, typeof MSC_TRANSCODER < "u" && console.warn("THREE.KTX2Loader: Please update to latest \"basis_transcoder\". \"msc_basis_transcoder\" is no longer supported in three.js r125+.");
	}
	setTranscoderPath(e) {
		return this.transcoderPath = e, this;
	}
	setWorkerLimit(e) {
		return this.workerPool.setWorkerLimit(e), this;
	}
	async detectSupportAsync(e) {
		return this.workerConfig = {
			astcSupported: await e.hasFeatureAsync("texture-compression-astc"),
			astcHDRSupported: !1,
			etc1Supported: await e.hasFeatureAsync("texture-compression-etc1"),
			etc2Supported: await e.hasFeatureAsync("texture-compression-etc2"),
			dxtSupported: await e.hasFeatureAsync("texture-compression-bc"),
			bptcSupported: await e.hasFeatureAsync("texture-compression-bptc"),
			pvrtcSupported: await e.hasFeatureAsync("texture-compression-pvrtc")
		}, this;
	}
	detectSupport(e) {
		return e.isWebGPURenderer === !0 ? this.workerConfig = {
			astcSupported: e.hasFeature("texture-compression-astc"),
			astcHDRSupported: !1,
			etc1Supported: e.hasFeature("texture-compression-etc1"),
			etc2Supported: e.hasFeature("texture-compression-etc2"),
			dxtSupported: e.hasFeature("texture-compression-bc"),
			bptcSupported: e.hasFeature("texture-compression-bptc"),
			pvrtcSupported: e.hasFeature("texture-compression-pvrtc")
		} : this.workerConfig = {
			astcSupported: e.extensions.has("WEBGL_compressed_texture_astc"),
			astcHDRSupported: e.extensions.has("WEBGL_compressed_texture_astc") && e.extensions.get("WEBGL_compressed_texture_astc").getSupportedProfiles().includes("hdr"),
			etc1Supported: e.extensions.has("WEBGL_compressed_texture_etc1"),
			etc2Supported: e.extensions.has("WEBGL_compressed_texture_etc"),
			dxtSupported: e.extensions.has("WEBGL_compressed_texture_s3tc"),
			bptcSupported: e.extensions.has("EXT_texture_compression_bptc"),
			pvrtcSupported: e.extensions.has("WEBGL_compressed_texture_pvrtc") || e.extensions.has("WEBKIT_WEBGL_compressed_texture_pvrtc")
		}, this;
	}
	init() {
		if (!this.transcoderPending) {
			let t = new ce(this.manager);
			t.setPath(this.transcoderPath), t.setWithCredentials(this.withCredentials);
			let n = t.loadAsync("basis_transcoder.js"), r = new ce(this.manager);
			r.setPath(this.transcoderPath), r.setResponseType("arraybuffer"), r.setWithCredentials(this.withCredentials);
			let i = r.loadAsync("basis_transcoder.wasm");
			this.transcoderPending = Promise.all([n, i]).then(([t, n]) => {
				let r = e.BasisWorker.toString(), i = [
					"/* constants */",
					"let _EngineFormat = " + JSON.stringify(e.EngineFormat),
					"let _EngineType = " + JSON.stringify(e.EngineType),
					"let _TranscoderFormat = " + JSON.stringify(e.TranscoderFormat),
					"let _BasisFormat = " + JSON.stringify(e.BasisFormat),
					"/* basis_transcoder.js */",
					t,
					"/* worker */",
					r.substring(r.indexOf("{") + 1, r.lastIndexOf("}"))
				].join("\n");
				this.workerSourceURL = URL.createObjectURL(new Blob([i])), this.transcoderBinary = n, this.workerPool.setWorkerCreator(() => {
					let e = new Worker(this.workerSourceURL), t = this.transcoderBinary.slice(0);
					return e.postMessage({
						type: "init",
						config: this.workerConfig,
						transcoderBinary: t
					}, [t]), e;
				});
			}), Fr > 0 && console.warn("THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues. Use a single KTX2Loader instance, or call .dispose() on old instances."), Fr++;
		}
		return this.transcoderPending;
	}
	load(e, t, n, r) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		let i = new ce(this.manager);
		i.setPath(this.path), i.setCrossOrigin(this.crossOrigin), i.setWithCredentials(this.withCredentials), i.setResponseType("arraybuffer"), i.load(e, (e) => {
			this.parse(e, t, r);
		}, n, r);
	}
	parse(e, t, n) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		if (Pr.has(e)) return Pr.get(e).promise.then(t).catch(n);
		this._createTexture(e).then((e) => t ? t(e) : null).catch(n);
	}
	_createTextureFrom(e, t) {
		let { type: n, error: r, data: { faces: i, width: a, height: o, format: s, type: c, dfdFlags: l } } = e;
		if (n === "error") return Promise.reject(r);
		let u;
		if (t.faceCount === 6) u = new ie(i, s, c);
		else {
			let e = i[0].mipmaps;
			u = t.layerCount > 1 ? new re(e, a, o, t.layerCount, s, c) : new ae(e, a, o, s, c);
		}
		return u.minFilter = i[0].mipmaps.length === 1 ? ue : de, u.magFilter = ue, u.generateMipmaps = !1, u.needsUpdate = !0, u.colorSpace = Vr(t), u.premultiplyAlpha = !!(l & 1), u;
	}
	async _createTexture(e, t = {}) {
		let n = Er(new Uint8Array(e)), r = n.vkFormat === 1000066e3 && n.dataFormatDescriptor[0].colorModel === 167;
		if (!(n.vkFormat === 0 || r && !this.workerConfig.astcHDRSupported)) return Br(n);
		let i = t, a = this.init().then(() => this.workerPool.postMessage({
			type: "transcode",
			buffer: e,
			taskConfig: i
		}, [e])).then((e) => this._createTextureFrom(e.data, n));
		return Pr.set(e, { promise: a }), a;
	}
	dispose() {
		this.workerPool.dispose(), this.workerSourceURL && URL.revokeObjectURL(this.workerSourceURL), Fr--;
	}
};
J.BasisFormat = {
	ETC1S: 0,
	UASTC: 1,
	UASTC_HDR: 2
}, J.TranscoderFormat = {
	ETC1: 0,
	ETC2: 1,
	BC1: 2,
	BC3: 3,
	BC4: 4,
	BC5: 5,
	BC7_M6_OPAQUE_ONLY: 6,
	BC7_M5: 7,
	PVRTC1_4_RGB: 8,
	PVRTC1_4_RGBA: 9,
	ASTC_4x4: 10,
	ATC_RGB: 11,
	ATC_RGBA_INTERPOLATED_ALPHA: 12,
	RGBA32: 13,
	RGB565: 14,
	BGR565: 15,
	RGBA4444: 16,
	BC6H: 22,
	RGB_HALF: 24,
	RGBA_HALF: 25
}, J.EngineFormat = {
	RGBAFormat: D,
	RGBA_ASTC_4x4_Format: he,
	RGB_BPTC_UNSIGNED_Format: Ce,
	RGBA_BPTC_Format: _e,
	RGBA_ETC2_EAC_Format: ve,
	RGBA_PVRTC_4BPPV1_Format: ye,
	RGBA_S3TC_DXT5_Format: Se,
	RGB_ETC1_Format: we,
	RGB_ETC2_Format: Te,
	RGB_PVRTC_4BPPV1_Format: Ee,
	RGBA_S3TC_DXT1_Format: be
}, J.EngineType = {
	UnsignedByteType: A,
	HalfFloatType: E,
	FloatType: le
}, J.BasisWorker = function() {
	let e, t, n, r = _EngineFormat, i = _EngineType, a = _TranscoderFormat, o = _BasisFormat;
	self.addEventListener("message", function(n) {
		let r = n.data;
		switch (r.type) {
			case "init":
				e = r.config, s(r.transcoderBinary);
				break;
			case "transcode":
				t.then(() => {
					try {
						let { faces: e, buffers: t, width: n, height: i, hasAlpha: a, format: o, type: s, dfdFlags: l } = c(r.buffer);
						self.postMessage({
							type: "transcode",
							id: r.id,
							data: {
								faces: e,
								width: n,
								height: i,
								hasAlpha: a,
								format: o,
								type: s,
								dfdFlags: l
							}
						}, t);
					} catch (e) {
						console.error(e), self.postMessage({
							type: "error",
							id: r.id,
							error: e.message
						});
					}
				});
				break;
		}
	});
	function s(e) {
		t = new Promise((t) => {
			n = {
				wasmBinary: e,
				onRuntimeInitialized: t
			}, BASIS(n);
		}).then(() => {
			n.initializeBasis(), n.KTX2File === void 0 && console.warn("THREE.KTX2Loader: Please update Basis Universal transcoder.");
		});
	}
	function c(e) {
		let t = new n.KTX2File(new Uint8Array(e));
		function r() {
			t.close(), t.delete();
		}
		if (!t.isValid()) throw r(), Error("THREE.KTX2Loader:	Invalid or unsupported .ktx2 file");
		let a;
		if (t.isUASTC()) a = o.UASTC;
		else if (t.isETC1S()) a = o.ETC1S;
		else if (t.isHDR()) a = o.UASTC_HDR;
		else throw Error("THREE.KTX2Loader: Unknown Basis encoding");
		let s = t.getWidth(), c = t.getHeight(), l = t.getLayers() || 1, u = t.getLevels(), f = t.getFaces(), m = t.getHasAlpha(), h = t.getDFDFlags(), { transcoderFormat: g, engineFormat: _, engineType: v } = d(a, s, c, m);
		if (!s || !c || !u) throw r(), Error("THREE.KTX2Loader:	Invalid texture");
		if (!t.startTranscoding()) throw r(), Error("THREE.KTX2Loader: .startTranscoding failed");
		let y = [], b = [];
		for (let e = 0; e < f; e++) {
			let n = [];
			for (let a = 0; a < u; a++) {
				let o = [], s, c;
				for (let n = 0; n < l; n++) {
					let l = t.getImageLevelInfo(a, n, e);
					e === 0 && a === 0 && n === 0 && (l.origWidth % 4 != 0 || l.origHeight % 4 != 0) && console.warn("THREE.KTX2Loader: ETC1S and UASTC textures should use multiple-of-four dimensions."), u > 1 ? (s = l.origWidth, c = l.origHeight) : (s = l.width, c = l.height);
					let d = new Uint8Array(t.getImageTranscodedSizeInBytes(a, n, 0, g)), f = t.transcodeImage(d, a, n, e, g, 0, -1, -1);
					if (v === i.HalfFloatType && (d = new Uint16Array(d.buffer, d.byteOffset, d.byteLength / Uint16Array.BYTES_PER_ELEMENT)), !f) throw r(), Error("THREE.KTX2Loader: .transcodeImage failed.");
					o.push(d);
				}
				let d = p(o);
				n.push({
					data: d,
					width: s,
					height: c
				}), b.push(d.buffer);
			}
			y.push({
				mipmaps: n,
				width: s,
				height: c,
				format: _,
				type: v
			});
		}
		return r(), {
			faces: y,
			buffers: b,
			width: s,
			height: c,
			hasAlpha: m,
			dfdFlags: h,
			format: _,
			type: v
		};
	}
	let l = [
		{
			if: "astcSupported",
			basisFormat: [o.UASTC],
			transcoderFormat: [a.ASTC_4x4, a.ASTC_4x4],
			engineFormat: [r.RGBA_ASTC_4x4_Format, r.RGBA_ASTC_4x4_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: Infinity,
			priorityUASTC: 1,
			needsPowerOfTwo: !1
		},
		{
			if: "bptcSupported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.BC7_M5, a.BC7_M5],
			engineFormat: [r.RGBA_BPTC_Format, r.RGBA_BPTC_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 3,
			priorityUASTC: 2,
			needsPowerOfTwo: !1
		},
		{
			if: "dxtSupported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.BC1, a.BC3],
			engineFormat: [r.RGBA_S3TC_DXT1_Format, r.RGBA_S3TC_DXT5_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 4,
			priorityUASTC: 5,
			needsPowerOfTwo: !1
		},
		{
			if: "etc2Supported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.ETC1, a.ETC2],
			engineFormat: [r.RGB_ETC2_Format, r.RGBA_ETC2_EAC_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 1,
			priorityUASTC: 3,
			needsPowerOfTwo: !1
		},
		{
			if: "etc1Supported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.ETC1],
			engineFormat: [r.RGB_ETC1_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 2,
			priorityUASTC: 4,
			needsPowerOfTwo: !1
		},
		{
			if: "pvrtcSupported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.PVRTC1_4_RGB, a.PVRTC1_4_RGBA],
			engineFormat: [r.RGB_PVRTC_4BPPV1_Format, r.RGBA_PVRTC_4BPPV1_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 5,
			priorityUASTC: 6,
			needsPowerOfTwo: !0
		},
		{
			if: "bptcSupported",
			basisFormat: [o.UASTC_HDR],
			transcoderFormat: [a.BC6H],
			engineFormat: [r.RGB_BPTC_UNSIGNED_Format],
			engineType: [i.HalfFloatType],
			priorityHDR: 1,
			needsPowerOfTwo: !1
		},
		{
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.RGBA32, a.RGBA32],
			engineFormat: [r.RGBAFormat, r.RGBAFormat],
			engineType: [i.UnsignedByteType, i.UnsignedByteType],
			priorityETC1S: 100,
			priorityUASTC: 100,
			needsPowerOfTwo: !1
		},
		{
			basisFormat: [o.UASTC_HDR],
			transcoderFormat: [a.RGBA_HALF],
			engineFormat: [r.RGBAFormat],
			engineType: [i.HalfFloatType],
			priorityHDR: 100,
			needsPowerOfTwo: !1
		}
	], u = {
		[o.ETC1S]: l.filter((e) => e.basisFormat.includes(o.ETC1S)).sort((e, t) => e.priorityUASTC - t.priorityUASTC),
		[o.UASTC]: l.filter((e) => e.basisFormat.includes(o.UASTC)).sort((e, t) => e.priorityUASTC - t.priorityUASTC),
		[o.UASTC_HDR]: l.filter((e) => e.basisFormat.includes(o.UASTC_HDR)).sort((e, t) => e.priorityHDR - t.priorityHDR)
	};
	function d(t, n, r, i) {
		let a = u[t];
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			if (!(s.if && !e[s.if]) && s.basisFormat.includes(t) && !(i && s.transcoderFormat.length < 2) && !(s.needsPowerOfTwo && !(f(n) && f(r)))) return {
				transcoderFormat: s.transcoderFormat[+!!i],
				engineFormat: s.engineFormat[+!!i],
				engineType: s.engineType[0]
			};
		}
		throw Error("THREE.KTX2Loader: Failed to identify transcoding target.");
	}
	function f(e) {
		return e <= 2 || (e & e - 1) == 0 && e !== 0;
	}
	function p(e) {
		if (e.length === 1) return e[0];
		let t = 0;
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			t += r.byteLength;
		}
		let n = new Uint8Array(t), r = 0;
		for (let t = 0; t < e.length; t++) {
			let i = e[t];
			n.set(i, r), r += i.byteLength;
		}
		return n;
	}
};
var Lr = /* @__PURE__ */ new Set([
	D,
	O,
	k
]), Rr = {
	109: D,
	97: D,
	37: D,
	43: D,
	103: O,
	83: O,
	16: O,
	22: O,
	100: k,
	76: k,
	15: k,
	9: k,
	148: Te,
	152: ve,
	[Sr]: he,
	158: he,
	157: he,
	166: ge,
	165: ge,
	133: be,
	134: be,
	131: De,
	132: De,
	138: xe,
	137: xe,
	142: Se,
	141: Se,
	146: _e,
	145: _e
}, zr = {
	109: le,
	97: E,
	37: A,
	43: A,
	103: le,
	83: E,
	16: A,
	22: A,
	100: le,
	76: E,
	15: A,
	9: A,
	148: A,
	152: A,
	[Sr]: E,
	166: A,
	165: A
};
async function Br(e) {
	let { vkFormat: t } = e;
	if (Rr[t] === void 0) throw Error("THREE.KTX2Loader: Unsupported vkFormat.");
	let n;
	e.supercompressionScheme === 2 && (Ir ||= new Promise(async (e) => {
		let t = new Ar();
		await t.init(), e(t);
	}), n = await Ir);
	let r = [];
	for (let i = 0; i < e.levels.length; i++) {
		let a = Math.max(1, e.pixelWidth >> i), o = Math.max(1, e.pixelHeight >> i), s = e.pixelDepth ? Math.max(1, e.pixelDepth >> i) : 0, c = e.levels[i], l;
		if (e.supercompressionScheme === 0) l = c.levelData;
		else if (e.supercompressionScheme === 2) l = n.decode(c.levelData, c.uncompressedByteLength);
		else throw Error("THREE.KTX2Loader: Unsupported supercompressionScheme.");
		let u;
		u = zr[t] === le ? new Float32Array(l.buffer, l.byteOffset, l.byteLength / Float32Array.BYTES_PER_ELEMENT) : zr[t] === E ? new Uint16Array(l.buffer, l.byteOffset, l.byteLength / Uint16Array.BYTES_PER_ELEMENT) : l, r.push({
			data: u,
			width: a,
			height: o,
			depth: s
		});
	}
	let i;
	if (Lr.has(Rr[t])) i = e.pixelDepth === 0 ? new se(r[0].data, e.pixelWidth, e.pixelHeight) : new oe(r[0].data, e.pixelWidth, e.pixelHeight, e.pixelDepth);
	else {
		if (e.pixelDepth > 0) throw Error("THREE.KTX2Loader: Unsupported pixelDepth.");
		i = new ae(r, e.pixelWidth, e.pixelHeight), i.minFilter = r.length === 1 ? ue : de, i.magFilter = ue;
	}
	return i.mipmaps = r, i.type = zr[t], i.format = Rr[t], i.colorSpace = Vr(e), i.needsUpdate = !0, Promise.resolve(i);
}
function Vr(e) {
	let t = e.dataFormatDescriptor[0];
	return t.colorPrimaries === 1 ? t.transferFunction === 2 ? Oe : fe : t.colorPrimaries === 10 ? t.transferFunction === 2 ? Mr : Nr : (t.colorPrimaries === 0 || console.warn(`THREE.KTX2Loader: Unsupported color primaries, "${t.colorPrimaries}"`), me);
}
//#endregion
//#region src/engine/runtimeTextureLoader.ts
var Hr = class {
	imageLoader = new T.TextureLoader();
	ktx2Loader;
	constructor(t, n = "/basis/") {
		this.ktx2Loader = new J().setTranscoderPath(n).detectSupport(t), e(d(t));
	}
	loadAsync(t) {
		return t.startsWith("original:") ? e().loadAsync(t) : /\.ktx2(?:[?#]|$)/i.test(t) ? this.ktx2Loader.loadAsync(t) : this.imageLoader.loadAsync(t);
	}
	dispose() {
		this.ktx2Loader.dispose();
	}
}, Ur = {
	maxOutputSize: 1024,
	enabled: !1
};
function Wr(e, t, n) {
	let r = Math.max(1, Number.isFinite(e) ? e : 1), i = Math.max(1, Number.isFinite(t) ? t : 1);
	return Math.min(Math.max(.1, Number.isFinite(n) ? n : 1), 2, Ur.maxOutputSize / Math.max(r, i));
}
//#endregion
//#region src/engine/unityPlayableAnimator.ts
var Y = Math.fround, Gr = /* @__PURE__ */ function(e) {
	return e[e.FollowAnimationClip = 0] = "FollowAnimationClip", e[e.Loop = 1] = "Loop", e[e.Clamp = 2] = "Clamp", e;
}({}), Kr = /* @__PURE__ */ function(e) {
	return e[e.BuildUp = 0] = "BuildUp", e[e.Recycle = 1] = "Recycle", e;
}({}), qr = class {
	clip;
	time = 0;
	speed = 1;
	playState = 1;
	length;
	constructor(e) {
		this.clip = e, this.length = ee(e);
	}
	getTime() {
		return this.time;
	}
	setTime(e) {
		this.time = e, this.timeSet = !0;
	}
	timeSet = !1;
	getSpeed() {
		return this.speed;
	}
	setSpeed(e) {
		this.speed = e;
	}
	getPlayState() {
		return this.playState;
	}
	play() {
		this.playState = 1;
	}
	pause() {
		this.playState = 0;
	}
	clipTime() {
		let e = this.length, t = Y(this.time);
		return t = this.clip.isLooping ? e > 0 ? Y(t - Y(Math.floor(t / e) * e)) : 0 : Math.min(Math.max(t, 0), e), Y(this.clip.startTime + t);
	}
}, Jr = class {
	normalizeWeights;
	inputs;
	weights;
	constructor(e, t) {
		this.normalizeWeights = t, this.inputs = Array.from({ length: e }, () => null), this.weights = Array.from({ length: e }, () => 0);
	}
	getInputCount() {
		return this.inputs.length;
	}
	getInput(e) {
		return this.inputs[e] ?? null;
	}
	addInput(e, t) {
		return this.inputs.push(e), this.weights.push(t), this.inputs.length - 1;
	}
	connectInput(e, t) {
		if (this.inputs[e]) throw Error(`mixer input ${e} is already connected`);
		this.inputs[e] = t;
	}
	disconnectInput(e) {
		this.inputs[e] = null;
	}
	getInputWeight(e) {
		return this.weights[e];
	}
	setInputWeight(e, t) {
		this.weights[e] = t;
	}
}, Yr = class {
	inputs = [];
	weights = [];
	addInput(e, t) {
		this.inputs.push(e), this.weights.push(t);
	}
	getInputCount() {
		return this.inputs.length;
	}
	getInputWeight(e) {
		return this.weights[e];
	}
	setInputWeight(e, t) {
		this.weights[e] = t;
	}
};
function Xr(e, t, n) {
	return t === w.Transform ? `t:${e}:${n === C.EulerAngles ? C.Rotation : n}` : `b:${e}:${n}`;
}
var Zr = class {
	root;
	renderedMeshes;
	nodeByPathCrc = /* @__PURE__ */ new Map();
	properties = /* @__PURE__ */ new Map();
	ordered = [];
	bufferSize = 0;
	constructor(e, t) {
		this.root = e, this.renderedMeshes = t;
		let n = (e, t) => {
			let r = te(t);
			this.nodeByPathCrc.has(r) || this.nodeByPathCrc.set(r, e);
			for (let r of e.children) n(r, t ? `${t}/${r.name}` : r.name);
		};
		n(e, "");
	}
	bindClip(e) {
		for (let t of e.bindings) {
			let e = Xr(t.path, t.typeID, t.attribute);
			if (this.properties.has(e)) continue;
			let n = this.nodeByPathCrc.get(t.path);
			if (!n) continue;
			let r = null;
			if (t.typeID === w.Transform) {
				let e = t.attribute === C.Position ? 0 : t.attribute === C.Scale ? 2 : 1, i = e === 1 ? 4 : 3, a = new Float64Array(i);
				e === 0 ? a.set([
					-n.position.x,
					n.position.y,
					n.position.z
				]) : e === 2 ? a.set([
					n.scale.x,
					n.scale.y,
					n.scale.z
				]) : a.set([
					n.quaternion.x,
					-n.quaternion.y,
					-n.quaternion.z,
					n.quaternion.w
				]), r = {
					kind: e,
					node: n,
					morphs: [],
					defaults: a,
					offset: 0,
					size: i
				};
			} else if (t.typeID === w.SkinnedMeshRenderer && t.customType === 20) {
				let e = [];
				for (let r of this.renderedMeshes(n)) {
					let n = r.morphTargetDictionary;
					if (!n || !r.morphTargetInfluences) continue;
					let i = Object.keys(n).find((e) => te(e) === t.attribute);
					i !== void 0 && e.push({
						mesh: r,
						index: n[i]
					});
				}
				if (!e.length) continue;
				r = {
					kind: 3,
					node: n,
					morphs: e,
					defaults: new Float64Array([e[0].mesh.morphTargetInfluences[e[0].index] * 100]),
					offset: 0,
					size: 1
				};
			}
			r && (r.offset = this.bufferSize, this.bufferSize += r.size, this.properties.set(e, r), this.ordered.push(r));
		}
	}
	get size() {
		return this.bufferSize;
	}
	propertyFor(e, t, n) {
		return this.properties.get(Xr(e, t, n)) ?? null;
	}
	writeDefaults(e) {
		for (let t of this.ordered) e.set(t.defaults, t.offset);
	}
	defaultOf(e, t, n) {
		for (let r = 0; r < e.size; r++) t[n + r] = e.defaults[r];
	}
	apply(e) {
		for (let t of this.ordered) {
			let n = t.offset;
			switch (t.kind) {
				case 0:
					t.node.position.set(-e[n], e[n + 1], e[n + 2]);
					break;
				case 2:
					t.node.scale.set(e[n], e[n + 1], e[n + 2]);
					break;
				case 1:
					t.node.quaternion.set(e[n], -e[n + 1], -e[n + 2], e[n + 3]);
					break;
				case 3:
					for (let r of t.morphs) r.mesh.morphTargetInfluences[r.index] = e[n] / 100;
					break;
			}
		}
	}
	get boundProperties() {
		return this.ordered;
	}
}, Qr = [
	[
		0,
		1,
		2
	],
	[
		0,
		2,
		1
	],
	[
		1,
		2,
		0
	],
	[
		1,
		0,
		2
	],
	[
		2,
		0,
		1
	],
	[
		2,
		1,
		0
	]
], X = /* @__PURE__ */ new Float64Array(12);
function $r(e, t, n, r, i, a) {
	let o = Math.PI / 360, s = [
		e,
		t,
		n
	];
	for (let e = 0; e < 3; e++) {
		let t = e * 4;
		X[t] = X[t + 1] = X[t + 2] = 0, X[t + e] = Math.sin(s[e] * o), X[t + 3] = Math.cos(s[e] * o);
	}
	let c = 0, l = 0, u = 0, d = 1;
	for (let e of Qr[r]) {
		let t = e * 4, n = X[t], r = X[t + 1], i = X[t + 2], a = X[t + 3], o = a * c + n * d + r * u - i * l, s = a * l - n * u + r * d + i * c, f = a * u + n * l - r * c + i * d, p = a * d - n * c - r * l - i * u;
		c = o, l = s, u = f, d = p;
	}
	i[a] = Y(c), i[a + 1] = Y(l), i[a + 2] = Y(u), i[a + 3] = Y(d);
}
var ei = class {
	target;
	plans = /* @__PURE__ */ new WeakMap();
	samples = /* @__PURE__ */ new WeakMap();
	result = /* @__PURE__ */ new Float64Array();
	layerValue = /* @__PURE__ */ new Float64Array();
	layerMask = /* @__PURE__ */ new Uint8Array();
	animatedMark = /* @__PURE__ */ new Uint8Array();
	quaternion = /* @__PURE__ */ new Float64Array(4);
	constructor(e) {
		this.target = e;
	}
	plan(e) {
		let t = this.plans.get(e);
		if (t) return t;
		t = [];
		for (let n of e.bindings) {
			let r = this.target.propertyFor(n.path, n.typeID, n.attribute);
			if (r) {
				if (t.some((e) => e.property === r)) throw Error(`${e.name}: two bindings write one property (path ${n.path})`);
				if (t.push({
					property: r,
					offset: n.offset,
					euler: n.typeID === w.Transform && n.attribute === C.EulerAngles ? n.customType : -1
				}), n.dimension !== S(n.typeID, n.attribute)) throw Error(`${e.name}: binding dimension`);
			}
		}
		return this.plans.set(e, t), t;
	}
	sample(e) {
		let t = this.samples.get(e.clip);
		return t || (t = new Float32Array(e.clip.curveCount), this.samples.set(e.clip, t)), ne(e.clip, e.clipTime(), t);
	}
	evaluate(e) {
		let t = this.target, n = t.size;
		this.result.length !== n && (this.result = new Float64Array(n), this.layerValue = new Float64Array(n), this.layerMask = new Uint8Array(n), this.animatedMark = new Uint8Array(n));
		let r = this.result, i = this.layerValue, a = this.layerMask;
		t.writeDefaults(r);
		let o = this.quaternion;
		for (let n of e) for (let e = 0; e < n.inputs.length; e++) {
			let s = n.weights[e];
			if (!(s > 0)) continue;
			let c = n.inputs[e], l = 0;
			for (let e = 0; e < c.inputs.length; e++) c.inputs[e] && c.weights[e] > 0 && (l += c.weights[e]);
			if (l > 0) {
				a.fill(0), i.fill(0);
				for (let e = 0; e < c.inputs.length; e++) {
					let t = c.inputs[e];
					if (!(!t || !(c.weights[e] > 0))) for (let e of this.plan(t.clip)) a[e.property.offset] = 1;
				}
				for (let e = 0; e < c.inputs.length; e++) {
					let n = c.inputs[e], r = c.weights[e];
					if (!n || !(r > 0)) continue;
					let s = c.normalizeWeights ? r / l : r, u = this.sample(n), d = this.animatedMark;
					d.fill(0);
					for (let e of this.plan(n.clip)) {
						let t = e.property;
						if (d[t.offset] = 1, t.kind === 1) {
							if (e.euler >= 0) $r(u[e.offset], u[e.offset + 1], u[e.offset + 2], e.euler, o, 0);
							else for (let t = 0; t < 4; t++) o[t] = u[e.offset + t];
							ti(i, t.offset, o, 0, s);
						} else for (let n = 0; n < t.size; n++) i[t.offset + n] += s * u[e.offset + n];
					}
					for (let e of t.boundProperties) if (!(!a[e.offset] || d[e.offset])) if (e.kind === 1) ti(i, e.offset, e.defaults, 0, s);
					else for (let t = 0; t < e.size; t++) i[e.offset + t] += s * e.defaults[t];
				}
				if (!c.normalizeWeights && l < 1) {
					for (let e of t.boundProperties) if (a[e.offset]) if (e.kind === 1) ti(i, e.offset, e.defaults, 0, 1 - l);
					else for (let t = 0; t < e.size; t++) i[e.offset + t] += (1 - l) * e.defaults[t];
				}
				for (let e of t.boundProperties) {
					let t = e.offset;
					if (a[t]) if (e.kind === 1 && ni(i, t), s >= 1) for (let n = 0; n < e.size; n++) r[t + n] = i[t + n];
					else if (e.kind === 1) {
						for (let e = 0; e < 4; e++) o[e] = r[t + e];
						for (let e = 0; e < 4; e++) r[t + e] = 0;
						ti(r, t, o, 0, 1 - s), ti(r, t, i, t, s), ni(r, t);
					} else for (let n = 0; n < e.size; n++) r[t + n] = r[t + n] + (i[t + n] - r[t + n]) * s;
				}
			}
		}
		t.apply(r);
	}
};
function ti(e, t, n, r, i) {
	let a = e[t] * n[r] + e[t + 1] * n[r + 1] + e[t + 2] * n[r + 2] + e[t + 3] * n[r + 3] < 0 ? -i : i;
	for (let i = 0; i < 4; i++) e[t + i] += a * n[r + i];
}
function ni(e, t) {
	let n = Math.hypot(e[t], e[t + 1], e[t + 2], e[t + 3]);
	if (n > 0) for (let r = 0; r < 4; r++) e[t + r] = e[t + r] / n;
	else e.set([
		0,
		0,
		0,
		1
	], t);
}
var ri = class {
	outputs = [];
	evaluator = null;
	boundClips = /* @__PURE__ */ new Set();
	playing = !1;
	createOutput(e) {
		this.outputs.push(e);
	}
	bind(e) {
		this.evaluator = new ei(e), this.boundClips = /* @__PURE__ */ new Set();
	}
	get target() {
		return this.evaluator?.target ?? null;
	}
	connectedClips() {
		let e = [];
		for (let t of this.outputs) for (let n of t.inputs) for (let t of n.inputs) t && e.push(t);
		return e;
	}
	update(e) {
		if (!this.playing) return;
		let t = this.connectedClips();
		for (let n of t) n.timeSet ? n.timeSet = !1 : n.playState === 1 && (n.time += e * n.speed);
		let n = this.evaluator;
		if (n) {
			for (let e of t) this.boundClips.has(e.clip) || (this.boundClips.add(e.clip), n.target.bindClip(e.clip));
			n.evaluate(this.outputs);
		}
	}
}, ii = class {
	mixer;
	currentIndex = -1;
	currentAnimationName = "";
	prevIndex = -1;
	prevAnimationName = null;
	blendTargetTime = 0;
	blendTime = 0;
	blendFadeOutTargetTime = 0;
	blendFadeOutTime = 0;
	blendForwardIndex = 0;
	blendForwardStartWeight = 0;
	blendBackIndexs;
	blendBackStartWeight;
	blendBackIndexCount = 0;
	blendWeight = 0;
	currentStatus = 0;
	nextUseInputIndex = 0;
	blendTimeScale = 1;
	animationLoopCount = 0;
	currentAnimationClipPlayable = null;
	speed = 1;
	loopType = 0;
	onAnimationFinished = null;
	constructor(e, t = 8) {
		this.mixer = e, this.blendBackIndexs = Array.from({ length: t }, () => 0), this.blendBackStartWeight = Array.from({ length: t }, () => 0);
	}
	setCurrentIndex(e) {
		this.currentIndex = e, this.currentAnimationClipPlayable = e >= 0 ? this.mixer.getInput(e) : null;
	}
	get currentAnimationClip() {
		return this.currentAnimationClipPlayable?.clip ?? null;
	}
	get curentAnimationName() {
		return this.currentAnimationName;
	}
	get previousAnimationName() {
		return this.prevAnimationName;
	}
	get currentTime() {
		return this.currentIndex >= 0 ? this.currentAnimationClipPlayable.getTime() : 0;
	}
	set currentTime(e) {
		this.currentIndex >= 0 && this.currentAnimationClipPlayable.setTime(e);
	}
	get currentNormalizeTime() {
		return this.currentIndex >= 0 ? Y(this.currentAnimationClipPlayable.getTime()) / this.currentAnimationClipPlayable.length : 0;
	}
	set currentNormalizeTime(e) {
		this.currentIndex >= 0 && this.currentAnimationClipPlayable.setTime(this.currentAnimationClipPlayable.length * e);
	}
	update(e) {
		switch (this.currentStatus) {
			case 0:
				this.updateCommonProcess();
				break;
			case 1:
				this.updateBlending(e);
				break;
			case 2:
				this.updateOffBlending(e);
				break;
			case 3: break;
		}
	}
	timeUpdateDeltaTime(e) {
		let t = Y(e * this.blendTimeScale);
		this.blendTime = Y(this.blendTime + t), this.blendFadeOutTime = Y(t + this.blendFadeOutTime);
	}
	setBlendTimeScale(e) {
		this.blendTimeScale = e;
	}
	updateCommonProcess() {
		if (this.currentIndex < 0) return;
		let e = this.currentAnimationClipPlayable, t = e.length, n = e.getTime();
		if (e.getPlayState() !== 1 && e.play(), n > t) switch (this.loopType) {
			case 0: {
				let r = e.clip.isLooping;
				this.animationLoopCount++, r ? (e.setTime(n - t), this.onAnimationFinished?.(this.currentAnimationName, this.animationLoopCount)) : this.animationLoopCount === 1 && (this.onAnimationFinished?.(this.currentAnimationName, 1), e.setSpeed(0));
				break;
			}
			case 1:
				this.animationLoopCount++, e.setTime(n - t), this.onAnimationFinished?.(this.currentAnimationName, this.animationLoopCount);
				break;
			case 2:
				this.animationLoopCount++, e.setTime(t), this.animationLoopCount === 1 && (this.onAnimationFinished?.(this.currentAnimationName, 1), e.setSpeed(0));
				break;
		}
	}
	updateBlending(e) {
		this.timeUpdateDeltaTime(e);
		let t = 0;
		if (this.blendTime >= this.blendTargetTime ? (this.fitForwardTarget(), t = 1) : (this.blendWeight = ai(this.blendForwardStartWeight, 1, Y(this.blendTime / this.blendTargetTime)), this.mixer.setInputWeight(this.blendForwardIndex, this.blendWeight)), this.blendFadeOutTime >= this.blendFadeOutTargetTime) this.fitBackTarget(), t |= 2;
		else for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], ai(this.blendBackStartWeight[e], 0, Y(this.blendFadeOutTime / this.blendFadeOutTargetTime)));
		t === 3 && (this.currentStatus = 0), this.updateCommonProcess();
	}
	updateOffBlending(e) {
		if (this.timeUpdateDeltaTime(e), this.blendTime >= this.blendTargetTime) {
			this.blendTime = this.blendTargetTime;
			for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], 0);
			this.blendBackIndexCount = 0, this.currentStatus = 3;
		} else for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], ai(this.blendBackStartWeight[e], 0, Y(this.blendTime / this.blendTargetTime)));
	}
	fitForwardTarget() {
		this.blendWeight = 1, this.mixer.setInputWeight(this.blendForwardIndex, 1);
	}
	fitBackTarget() {
		for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], 0);
		this.blendBackIndexCount = 0;
	}
	startOffBlend(e) {
		if (!(this.currentIndex < 0)) {
			this.blendTime = 0, this.blendTargetTime = e, this.blendBackIndexCount < this.blendBackIndexs.length - 1 ? this.blendBackIndexs[this.blendBackIndexCount++] = this.currentIndex : this.blendBackIndexs[0] = this.currentIndex;
			for (let e = 0; e < this.blendBackIndexCount; e++) this.blendBackStartWeight[e] = this.mixer.getInputWeight(this.blendBackIndexs[e]);
			this.prevIndex = this.currentIndex, this.prevAnimationName = this.currentAnimationName, this.setCurrentIndex(-1), this.currentAnimationName = "", this.currentStatus = 2;
		}
	}
	setSpeed(e) {
		this.speed = e, this.currentIndex >= 0 && this.currentAnimationClipPlayable.setSpeed(e);
	}
	startBlend(e, t, n, r, i, a) {
		if (this.currentIndex === e) {
			this.animationLoopCount = 0, this.currentIndex >= 0 && (this.currentAnimationClipPlayable.setSpeed(this.speed), this.currentAnimationClipPlayable.setTime(a), this.currentAnimationClipPlayable.setTime(a));
			return;
		}
		this.blendTime = 0, this.blendTargetTime = t, this.blendFadeOutTargetTime = n, this.loopType = i, this.animationLoopCount = 0, this.blendFadeOutTime = 0, this.blendForwardIndex = e, this.blendForwardStartWeight = this.mixer.getInputWeight(e);
		for (let e = 0; e < this.blendBackIndexCount; e++) if (this.blendBackIndexs[e] === this.blendForwardIndex) {
			for (let t = e; t < this.blendBackIndexCount; t++) this.blendBackIndexs[t] = this.blendBackIndexs[t + 1];
			this.blendBackIndexCount--;
			break;
		}
		this.currentIndex >= 0 && (this.blendBackIndexCount < this.blendBackIndexs.length - 1 ? this.blendBackIndexs[this.blendBackIndexCount++] = this.currentIndex : this.blendBackIndexs[0] = this.currentIndex);
		for (let e = 0; e < this.blendBackIndexCount; e++) this.blendBackStartWeight[e] = this.mixer.getInputWeight(this.blendBackIndexs[e]);
		this.prevIndex = this.currentIndex, this.prevAnimationName = this.currentAnimationName, this.setCurrentIndex(e), this.currentAnimationName = r;
		let o = this.currentAnimationClipPlayable, s = o.length * a;
		o.setTime(s), o.setTime(s), o.setSpeed(this.speed), this.currentStatus = 1;
	}
	startBlendRecycle(e, t, n, r, i, a) {
		let o = this.mixer.getInputCount(), s = 0, c = !1;
		for (let t = 0; t < o; t++) if (this.mixer.getInput(t) === e) {
			s = t, c = !0;
			break;
		}
		if (!c) {
			for (let e = 0; e < o; e++) {
				let e = this.mixer.getInputWeight(this.nextUseInputIndex), t = this.nextUseInputIndex;
				if (this.nextUseInputIndex = (t + 1) % o, !(e > 0)) {
					s = t;
					break;
				}
			}
			this.mixer.getInputWeight(s) > 0 && (s = this.nextUseInputIndex, this.nextUseInputIndex = (s + 1) % o, this.mixer.setInputWeight(s, 0)), this.mixer.disconnectInput(s), this.mixer.connectInput(s, e);
		}
		this.startBlend(s, t, n, r, i, a);
	}
};
function ai(e, t, n) {
	let r = Math.min(Math.max(n, 0), 1);
	return Y(e + Y(Y(t - e) * r));
}
var oi = class {
	graph = new ri();
	blenders = [];
	layer = null;
	animationDictonary = /* @__PURE__ */ new Map();
	inputPlayableUseType = 0;
	initialize(e, t = 0, n = 4) {
		this.blenders = [], this.inputPlayableUseType = t;
		for (let r = 0; r < e; r++) {
			let e = new Jr(t === 1 ? n : 0, !0);
			this.blenders.push(new ii(e));
		}
	}
	registerAnimationClip(e, t, n = "", r = !1) {
		let i = this.blenders[e], a = new qr(t), o = {
			playable: a,
			layerIndex: e,
			inputIndex: i.mixer.getInputCount()
		};
		(this.inputPlayableUseType === 0 || r) && i.mixer.addInput(a, 0), this.animationDictonary.set(n || t.name, o);
	}
	registerAnimationFinishCallBack(e, t) {
		this.blenders[e].onAnimationFinished = t;
	}
	getAnimationTime(e) {
		return this.blenders[e].currentTime;
	}
	setAnimationTime(e, t) {
		this.blenders[e].currentTime = t;
	}
	getAnimationNormalizeTime(e) {
		return this.blenders[e].currentNormalizeTime;
	}
	setAnimationNormalizeTime(e, t) {
		this.blenders[e].currentNormalizeTime = t;
	}
	getCurrentAnimationName(e) {
		return this.blenders[e].curentAnimationName;
	}
	getCurrentAnimationClip(e) {
		return this.animationDictonary.get(this.blenders[e].curentAnimationName)?.playable.clip ?? null;
	}
	finalizeSetup(e, t = !1) {
		let n = new Yr();
		if (this.layer = n, !t) for (let e of this.blenders) n.addInput(e.mixer, 1);
		this.graph.bind(e), this.graph.createOutput(n), this.graph.playing = !0;
	}
	setLayerWeight(e, t) {
		this.layer.getInputCount() <= e || this.layer.setInputWeight(e, t);
	}
	getLayerWeight(e) {
		return this.layer.getInputCount() <= e ? 0 : this.layer.getInputWeight(e);
	}
	changeAnimation(e, t, n, r = 0, i = 0, a = !0) {
		let o = this.animationDictonary.get(t);
		if (!o || this.blenders.length <= e) return null;
		let s = this.blenders[e];
		return !a && t === s.curentAnimationName || (this.inputPlayableUseType === 0 ? s.startBlend(o.inputIndex, n, n, t, r, i) : s.startBlendRecycle(o.playable, n, n, t, r, i)), s;
	}
	changeAnimationOff(e, t) {
		if (this.blenders.length <= e) return null;
		let n = this.blenders[e];
		return n.startOffBlend(t), n;
	}
	existsAnimation(e) {
		return this.animationDictonary.has(e);
	}
	setSpeed(e, t) {
		this.blenders[e]?.setSpeed(t);
	}
	update(e) {
		for (let t of this.blenders) t.update(e);
	}
	blender(e) {
		return this.blenders[e];
	}
}, Z = /* @__PURE__ */ function(e) {
	return e[e.BREATH = 0] = "BREATH", e[e.MOTION = 1] = "MOTION", e[e.MOTION_OVERRIDE = 2] = "MOTION_OVERRIDE", e[e.FACIAL = 3] = "FACIAL", e[e.LIPSYNC = 4] = "LIPSYNC", e[e.BLINK = 5] = "BLINK", e;
}({}), si = 6, ci = 24, li = "model3d/motion/common/default", ui = class {
	loadClip;
	playableAnimator = null;
	loopAnimationNameDict = /* @__PURE__ */ new Map([[1, null], [3, null]]);
	currentMotionAssetBundleNameDict = /* @__PURE__ */ new Map();
	lipsyncMotionDict = /* @__PURE__ */ new Map();
	analyzer = null;
	deltaTime = 0;
	constructor(e) {
		this.loadClip = e;
	}
	get animator() {
		return this.playableAnimator;
	}
	load(e, t) {
		return this.loadClip(e, t);
	}
	setup(e) {
		if (this.playableAnimator) this.playableAnimator.finalizeSetup(e, !0);
		else {
			let t = new oi();
			this.playableAnimator = t, t.initialize(si, Kr.Recycle, ci), t.finalizeSetup(e, !1), t.registerAnimationFinishCallBack(1, (e, t) => this.onFinishMotion(1, e, t)), t.registerAnimationFinishCallBack(3, (e, t) => this.onFinishMotion(3, e, t)), this.setupBreath(), this.setupLipSync();
		}
	}
	setupBreath() {
		let e = this.load(li, "breath_loop");
		if (!e) throw Error(`${li}/breath_loop is missing`);
		let t = this.playableAnimator;
		t.registerAnimationClip(0, e, e.name, !0), t.changeAnimation(0, e.name, 0, Gr.FollowAnimationClip, 0, !0).update(this.deltaTime);
	}
	setupLipSync() {
		let e = [
			[0, "lipsync_a_01"],
			[1, "lipsync_u_01"],
			[2, "lipsync_e_01"],
			[3, "lipsync_o_01"],
			[4, "lipsync_n_01"]
		];
		for (let [t, n] of e) {
			let e = this.load(li, n);
			if (!e) throw Error(`${li}/${n} is missing`);
			this.lipsyncMotionDict.set(t, e);
		}
		for (let [t] of e) {
			let e = this.lipsyncMotionDict.get(t);
			this.playableAnimator.registerAnimationClip(4, e, e.name, !0);
		}
	}
	changeMotionWithLoop(e, t, n, r, i = 0, a = 0) {
		this.setLoopMotion(e, t, r, i), this.changeMotion(e, t, n, i, a) === 1 && this.changeMotion(e, t, r, i, a);
	}
	setLoopMotion(e, t, n, r = 0) {
		let i = `${t}/${n}`, a = this.playableAnimator;
		if (!a.existsAnimation(i)) {
			let r = this.load(t, n);
			if (!r) return this.loopAnimationNameDict.set(e, null), !1;
			a.registerAnimationClip(e, r, i, !1);
		}
		return this.loopAnimationNameDict.set(e, i), !0;
	}
	changeMotion(e, t, n, r = 0, i = 0) {
		let a = `${t}/${n}`, o = this.playableAnimator;
		if (!o.existsAnimation(a)) {
			let r = this.load(t, n);
			if (!r) return 1;
			o.registerAnimationClip(e, r, a, !1);
		}
		return o.changeAnimation(e, a, r, Gr.FollowAnimationClip, i, !0).update(this.deltaTime), this.currentMotionAssetBundleNameDict.set(e, t), 0;
	}
	getCurrentMotionBundleName(e) {
		return this.currentMotionAssetBundleNameDict.get(e) ?? "";
	}
	getCurrentMotionName(e) {
		return this.playableAnimator.getCurrentAnimationName(e);
	}
	onFinishMotion(e, t, n) {
		let r = this.playableAnimator;
		if (r.getCurrentAnimationClip(e).isLooping) return;
		let i = this.loopAnimationNameDict.get(e);
		i && r.existsAnimation(i) && r.changeAnimation(e, i, 2, Gr.FollowAnimationClip, 0, !0).update(this.deltaTime);
	}
	setLipSync(e) {
		this.analyzer = e;
	}
	update(e) {
		this.deltaTime = e, this.playableAnimator?.update(e);
	}
	evaluateAnimator(e) {
		this.playableAnimator?.graph.update(e);
	}
	lateUpdate() {
		this.updateLipSync();
	}
	updateLipSync() {
		let e = this.analyzer ? this.analyzer() : null, t = e !== null && e > .3 ? 0 : e !== null && e > .24 ? 3 : e !== null && e > .17 ? 1 : e !== null && e > .1 ? 2 : 4;
		this.playableAnimator.changeAnimation(4, this.lipsyncMotionDict.get(t).name, .1, Gr.FollowAnimationClip, 0, !0).update(this.deltaTime);
	}
};
//#endregion
//#region src/engine/costumeShopMotion.ts
function di(e) {
	return e?.startsWith("original-motion:") ? e.slice(i.length) : null;
}
function fi(e, t = []) {
	let n = [];
	for (let t of e.children) {
		let e = t;
		e.isMesh && t.userData.pjskNativeUnityMesh && e.morphTargetDictionary && n.push(e);
	}
	for (let r of t) r.source === e && r.target.traverse((e) => {
		e.isMesh && e.morphTargetDictionary && n.push(e);
	});
	return n;
}
var pi = class {
	provider;
	controller = null;
	clips = /* @__PURE__ */ new Map();
	prevCharacter = null;
	calmDownPending = !1;
	constructor(e) {
		this.provider = e;
	}
	resolve = (e, t) => this.clips.get(e)?.get(t) ?? null;
	async preload(e) {
		let t = [li, ...e].filter((e) => !this.clips.has(e));
		if (!t.length) return;
		let n = await this.provider.clips(t);
		for (let e of t) {
			let t = n[e];
			this.clips.set(e, new Map((t ?? []).map((e) => [e.name, e])));
		}
	}
	setupModel(e, t) {
		let n = new Zr(e, t);
		this.controller ??= new ui(this.resolve), this.controller.setup(n);
	}
	playMotion(e, t) {
		let n = this.controller;
		if (!n) return;
		let r = this.prevCharacter !== e;
		this.prevCharacter = e, !(!r && n.getCurrentMotionBundleName(Z.MOTION) === t) && (n.changeMotionWithLoop(Z.FACIAL, t, "face", "face_loop", 0, 0), n.changeMotionWithLoop(Z.MOTION, t, "motion", "motion_loop", 0, 0), this.calmDownPending = !0);
	}
	takeCalmDown() {
		let e = this.calmDownPending;
		return this.calmDownPending = !1, e;
	}
	get active() {
		return this.controller !== null;
	}
	update(e) {
		this.controller?.update(e);
	}
	evaluate(e) {
		this.controller?.evaluateAnimator(e);
	}
	lateUpdate() {
		this.controller?.lateUpdate();
	}
	seek(e, t) {
		let n = this.controller, r = n?.animator;
		if (!n || !r) return 0;
		let i = n.getCurrentMotionBundleName(Z.MOTION);
		for (let [a, o] of [[Z.FACIAL, e ? "face_loop" : "face"], [Z.MOTION, e ? "motion_loop" : "motion"]]) n.changeMotion(a, i, o, 0, 0), r.setAnimationNormalizeTime(a, t);
		return n.evaluateAnimator(0), r.blender(Z.MOTION).currentAnimationClip ? this.snapshot().motionLength : 0;
	}
	snapshot() {
		let e = this.controller?.animator;
		if (!e) return {
			motionBundle: null,
			motionClip: null,
			motionTime: 0,
			motionLength: 0,
			facialClip: null,
			facialTime: 0,
			lipSyncClip: null
		};
		let t = e.blender(Z.MOTION), n = e.blender(Z.FACIAL), r = t.currentAnimationClip;
		return {
			motionBundle: this.controller.getCurrentMotionBundleName(Z.MOTION) || null,
			motionClip: r?.name ?? null,
			motionTime: t.currentTime,
			motionLength: r ? r.stopTime - r.startTime : 0,
			facialClip: n.currentAnimationClip?.name ?? null,
			facialTime: n.currentTime,
			lipSyncClip: e.getCurrentAnimationName(Z.LIPSYNC) || null
		};
	}
}, mi = 60, hi = new T.Vector3(0, 1, 0), gi = new T.Quaternion(0, 1, 0, 0);
function _i(e) {
	let t = null;
	return e.traverse((e) => {
		let n = e;
		!t && n.isSkinnedMesh && n.userData.pjskNativeUnityMesh && (t = n.userData.pjskUnityRootBone ?? null);
	}), t ? t.getObjectByName("Head") ?? null : null;
}
function vi(e) {
	return e && typeof e == "object" ? e : {};
}
function Q(e) {
	return Array.isArray(e) ? e.length : 0;
}
function yi(e) {
	let t = vi(e);
	return {
		managers: Q(t.managers ?? t.Managers),
		bones: Q(t.bones ?? t.Bones),
		extraBones: Q(t.extraBones ?? t.ExtraBones),
		sphereColliders: Q(t.sphereColliders ?? t.SphereColliders),
		capsuleColliders: Q(t.capsuleColliders ?? t.CapsuleColliders),
		panelColliders: Q(t.panelColliders ?? t.PanelColliders),
		characterHairPresent: !!(t.characterHair ?? t.CharacterHair),
		characterEyePresent: !!(t.characterEye ?? t.CharacterEye)
	};
}
function bi(e, t, n) {
	let r = vi(e), i = vi(r.pjskSpringBone ?? r.PjskSpringBone), a = vi(i.raw ?? i.Raw), o = yi(a.body ?? a.Body), s = yi(a.head ?? a.Head), c = !!(a.body ?? a.Body ?? a.head ?? a.Head);
	return {
		present: c,
		runtimePresent: !!n,
		active: !!n?.enabled,
		bodyManagerCount: o.managers,
		bodySpringBoneCount: o.bones,
		bodyExtraBoneCount: o.extraBones,
		bodySphereColliderCount: o.sphereColliders,
		bodyCapsuleColliderCount: o.capsuleColliders,
		bodyPanelColliderCount: o.panelColliders,
		headManagerCount: s.managers,
		headSpringBoneCount: s.bones,
		headExtraBoneCount: s.extraBones,
		headSphereColliderCount: s.sphereColliders,
		headCapsuleColliderCount: s.capsuleColliders,
		headPanelColliderCount: s.panelColliders,
		characterHairPresent: s.characterHairPresent,
		characterEyePresent: s.characterEyePresent,
		vrmSpringBoneManagerPresent: t,
		utjRuntime: n,
		source: c ? "PJSK_sekai_runtime" : "none"
	};
}
function xi(e, t, n = /* @__PURE__ */ new Set()) {
	if (!(!e || typeof e != "object" || n.has(e))) {
		if (n.add(e), e instanceof T.Texture) {
			t.add(e);
			return;
		}
		if (!(e instanceof T.Color || e instanceof T.Vector2 || e instanceof T.Vector3 || e instanceof T.Vector4 || e instanceof T.Matrix3 || e instanceof T.Matrix4 || ArrayBuffer.isView(e) || e instanceof ArrayBuffer)) {
			if (Array.isArray(e)) {
				for (let r of e) xi(r, t, n);
				return;
			}
			for (let r of Object.values(e)) xi(r, t, n);
		}
	}
}
function Si(e, t = !0, n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set()) {
	let i = Array.isArray(e) ? e : [e];
	for (let e of i) if (!n.has(e)) {
		if (t) {
			let t = /* @__PURE__ */ new Set();
			xi(e, t);
			for (let e of t) r.has(e) || (e.dispose(), r.add(e));
		}
		e.dispose();
	}
}
function Ci(e, t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set()) {
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		let i = e;
		i.isMesh && (i.geometry && !i.userData.pjskOutlineShell && !r.has(i.geometry) && (i.geometry.dispose(), r.add(i.geometry)), i.material && Si(i.material, !0, t, n));
	});
}
function $(e) {
	return e && typeof e == "object" ? e : {};
}
function wi(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Ti(e) {
	let t = $(e), n = $(t.pjskSpringBone ?? t.PjskSpringBone), r = $(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = $(t.funit ?? t.FUnit ?? n.funit ?? n.FUnit ?? r.funit ?? r.FUnit), a = i.detectedScripts ?? i.DetectedScripts, o = Array.isArray(a) ? a.filter((e) => typeof e == "string") : [], s = (e, t) => Math.max(Math.trunc(wi(i[e] ?? i[t]) ?? 0), 0);
	return {
		present: !!(i.present ?? i.Present),
		scriptCount: s("scriptCount", "ScriptCount"),
		springManagerCount: s("springManagerCount", "SpringManagerCount"),
		springBoneCount: s("springBoneCount", "SpringBoneCount"),
		sphereColliderCount: s("sphereColliderCount", "SphereColliderCount"),
		capsuleColliderCount: s("capsuleColliderCount", "CapsuleColliderCount"),
		panelColliderCount: s("panelColliderCount", "PanelColliderCount"),
		detectedScripts: o,
		policy: typeof (i.policy ?? i.Policy) == "string" ? String(i.policy ?? i.Policy) : "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function Ei(e) {
	let t = $(e), n = $(t.characterControllers ?? t.CharacterControllers), r = $(n.hair ?? n.Hair);
	if (!Object.keys(r).length) return null;
	let i = $(r.headTransform ?? r.HeadTransform);
	return {
		offset: c(b(r.offset ?? r.Offset, new T.Vector3())),
		headTransformName: typeof (i.name ?? i.Name) == "string" ? String(i.name ?? i.Name) : null,
		headTransformPath: typeof (i.transformPath ?? i.TransformPath) == "string" ? String(i.transformPath ?? i.TransformPath) : null
	};
}
function Di(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function Oi(e) {
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid roleId ${e}: expected "<characterId>:<unit>".`);
	return {
		characterId: r,
		unit: n.length > 0 && n.join(":").trim() || null
	};
}
function ki() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
var Ai = class {
	container;
	ownsCanvas;
	scene;
	camera;
	renderer;
	controls;
	cameraTarget = new T.Vector3();
	autoRender;
	manageResize;
	clock = new T.Clock();
	textureLoader;
	characterRoot;
	bodySlot;
	headSlot;
	sceneReference = new T.Group();
	capturePresentationEnabled = null;
	backgroundMode = "transparent";
	archiveBackground = null;
	archiveBackgroundBaseUrl = null;
	viewportWidth = 0;
	viewportHeight = 0;
	viewportPixelRatio = 0;
	animationFrame = 0;
	importRevision = 0;
	customSelectionQueue = Promise.resolve();
	customSelectionGeneration = 0;
	currentCompositionStatus = {
		mode: "pending",
		missingBodyBones: [],
		missingHeadBones: []
	};
	currentBodyAnimationRoot = null;
	costumeShopMotion = null;
	costumeShopMotionBaseUrl = null;
	costumeShopMotionPaused = !1;
	costumeShopMotionRoleId = null;
	onCostumeShopAnimatorEvaluated = null;
	costumeShopMotionSpeed = 1;
	currentRuntimeExtension = null;
	currentSpringRuntime = null;
	currentExtraBoneRuntime = null;
	currentConstraintRuntime = null;
	currentSpringTimelineControl = null;
	currentPrefabSourceGraph = null;
	studioLights = new yn();
	officialCharacter = null;
	officialUpdatePending = !0;
	officialUpdateDone = !1;
	springRuntimeMode = "unity-prefab";
	masterCharacterHeightMeters = 1.6;
	characterModelScaleMeters = 1.6;
	tempVector = new T.Vector3();
	tempVectorB = new T.Vector3();
	tempQuaternion = new T.Quaternion();
	currentCameraPreset = "default";
	currentCameraProfile = null;
	cameraRootYawDegrees = 0;
	studioCamera = new it();
	characterViewer = new Dn(this.studioCamera);
	studioRenderTexture = null;
	viewerComposite = null;
	detachViewerInput = null;
	drawingBufferSize = new T.Vector2();
	cameraDebugChangeCallback = null;
	currentLoadedRuntimePackage = null;
	lastNativeMeshInstallDiagnostics = null;
	lastConstraintSetupDiagnostics = null;
	runtimeDebug = {
		materialBindingMode: "manifest",
		funit: Ti(null)
	};
	constructor(e, t) {
		let n = e instanceof HTMLElement ? {
			container: e,
			initialLight: t
		} : e;
		if (!n.container && !n.canvas) throw Error("Haruki 3D engine requires a container or canvas.");
		this.container = n.container ?? null, this.ownsCanvas = n.canvas === void 0, this.autoRender = n.autoRender ?? !0, this.manageResize = n.manageResize ?? n.canvas === void 0, this.scene = new T.Scene(), this.scene.fog = new T.Fog("#7f8d95", 5.5, 15);
		let r = n.canvas ?? n.container, i = this.ownsCanvas ? 320 : 1, a = Math.max(r.clientWidth, i), o = Math.max(r.clientHeight, i), s = I(this.characterModelScaleMeters);
		this.camera = new T.PerspectiveCamera(s.fov, a / o, .1, 100), this.camera.position.copy(s.position), this.renderer = new T.WebGLRenderer({
			antialias: !1,
			stencil: !0,
			canvas: n.canvas,
			alpha: !0,
			premultipliedAlpha: !0
		}), this.renderer.setClearColor(0, 0), this.renderer.autoClearStencil = !0, this.backgroundMode = n.background ?? "transparent";
		let c = Wr(a, o, window.devicePixelRatio);
		this.renderer.setPixelRatio(c), this.renderer.setSize(a, o, this.ownsCanvas), this.viewportWidth = a, this.viewportHeight = o, this.viewportPixelRatio = c, this.renderer.outputColorSpace = T.SRGBColorSpace, this.container && this.renderer.domElement.parentElement !== this.container && this.container.appendChild(this.renderer.domElement), this.cameraTarget.copy(s.target), n.controlsFactory ? (this.controls = n.controlsFactory({
			camera: this.camera,
			canvas: this.renderer.domElement,
			target: this.cameraTarget,
			onChange: (e) => {
				this.cameraTarget.copy(e), this.cameraDebugChangeCallback?.();
			}
		}), this.controls.update()) : (this.controls = null, this.camera.lookAt(this.cameraTarget)), this.textureLoader = new Hr(this.renderer, n.ktx2TranscoderPath), this.characterRoot = new T.Group(), this.bodySlot = new T.Group(), this.headSlot = new T.Group(), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot), this.scene.add(this.characterRoot), this.setPresentationMode(n.presentationMode ?? "interactive"), this.studioCamera.initialize(P), this.applyCameraPreset(n.cameraPreset ?? "default", n.cameraProfile), this.handleResize = this.handleResize.bind(this), this.manageResize && (window.addEventListener("resize", this.handleResize), this.handleResize()), this.autoRender && this.render();
	}
	async importCombinedCharacter(e, t = {}) {
		let n = ++this.importRevision;
		t.disposeBeforeLoad && this.releaseCurrentCharacterResources(), this.lastNativeMeshInstallDiagnostics = null, this.lastConstraintSetupDiagnostics = null, this.applyCostumeShopCharacterHeight(e.bodyAsset.characterHeightMeters ?? this.masterCharacterHeightMeters);
		let r = await this.costumeShopMotionBundle(e), i = this.costumeShopMotionForCurrentStore(), [a] = await Promise.all([this.loadCombinedCharacterAsset(e), i.preload([r])]);
		return n === this.importRevision ? (this.retireCharacterSlot(this.bodySlot), this.retireCharacterSlot(this.headSlot), this.resetSlotParents(), this.officialCharacter && this.retiredOfficialCharacters.push(this.officialCharacter), this.officialCharacter = a.official ?? null, this.officialUpdatePending = !0, this.currentRuntimeExtension = e.runtimeExtension, this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.bodySlot.add(a.root), this.currentPrefabSourceGraph = a.prefabSourceGraph, _(a.prefabSourceGraph, this.characterModelScaleMeters), a.prefabSourceGraph.root !== a.root && this.bodySlot.add(a.prefabSourceGraph.root), this.currentBodyAnimationRoot = a.prefabSourceGraph.root, this.prepareCombinedComposition(), this.currentConstraintRuntime = h(a.prefabSourceGraph, this.currentRuntimeExtension, this.characterModelScaleMeters), this.syncUnityPrefabSourceGraph(), this.currentExtraBoneRuntime = Ie.fromPjskRuntimeExtension(this.currentRuntimeExtension, a.prefabSourceGraph.root), this.currentSpringRuntime = this.createSpringRuntime(a.prefabSourceGraph.root), i.setupModel(this.costumeShopAnimatorRoot(a.prefabSourceGraph), (e) => this.costumeShopRenderedMeshes(a.prefabSourceGraph, e)), i.playMotion(this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? e.id, r), this.officialCharacter && (this.updateOfficialFrame(this.officialCharacter), this.officialCharacter.renderer.prepare(this.camera), this.officialUpdateDone = !0), await this.renderer.compileAsync(this.scene, this.camera), this.disposeRetiredCharacters(), {
			revision: n,
			body: {
				...this.makeImportStatus(e.bodyAsset, a),
				assetId: e.id,
				displayName: `${e.displayName} [combined body]`
			},
			head: {
				...this.makeImportStatus(e.headAsset, a),
				assetId: e.id,
				displayName: `${e.displayName} [combined head]`
			},
			composition: this.currentCompositionStatus
		}) : (a.official?.renderer.dispose(), {
			revision: n,
			body: this.makeImportStatus(e.bodyAsset, a),
			head: this.makeImportStatus(e.headAsset, a),
			composition: this.currentCompositionStatus
		});
	}
	setCharacterYawDegrees(e) {
		let t = T.MathUtils.degToRad(Number.isFinite(e) ? e : 0);
		this.characterRoot.rotation.y = t, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState();
	}
	setViewYawDegrees(e) {
		if (this.cameraRootYawDegrees = Number.isFinite(e) ? e : 0, this.currentCameraPreset === "costume-shop") {
			this.studioCamera.cameraRootRotation = [...rn(0, -this.cameraRootYawDegrees, 0)], this.applyStudioCamera(), this.cameraDebugChangeCallback?.();
			return;
		}
		if (this.currentCameraPreset === "capture") {
			let e = L(this.currentCameraProfile ?? "full-body", this.cameraRootYawDegrees, this.masterCharacterHeightMeters);
			this.setCameraTarget(e.target), this.camera.position.copy(e.position), this.camera.fov = e.fov;
		} else {
			let e = I(this.characterModelScaleMeters), t = e.position.clone().sub(e.target).applyAxisAngle(hi, T.MathUtils.degToRad(this.cameraRootYawDegrees));
			this.setCameraTarget(e.target), this.camera.position.copy(e.target).add(t), this.camera.fov = e.fov;
		}
		this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	faceCharacterTowardCamera() {
		this.characterRoot.updateMatrixWorld(!0);
		let e = this.currentBodyAnimationRoot ?? this.characterRoot;
		e.updateMatrixWorld(!0);
		let t = Di(g(e), [
			"body/Position",
			"body/Position/PositionOffset",
			"body/Position/PositionOffset/Hip",
			"body/Position/Hip",
			"face/Position"
		])?.node ?? e;
		if (t.updateMatrixWorld(!0), x(t, this.tempQuaternion), this.tempVector.set(0, 0, 1).applyQuaternion(this.tempQuaternion), this.tempVector.y = 0, this.tempVector.lengthSq() < 1e-6) {
			this.setCharacterYawDegrees(0);
			return;
		}
		this.tempVector.normalize(), t.getWorldPosition(this.tempVectorB);
		let n = this.camera.position.clone().sub(this.tempVectorB);
		if (n.y = 0, n.lengthSq() < 1e-6) {
			this.setCharacterYawDegrees(0);
			return;
		}
		n.normalize();
		let r = Math.atan2(this.tempVector.x, this.tempVector.z), i = Math.atan2(n.x, n.z);
		this.characterRoot.rotation.y += i - r, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState();
	}
	getRuntimeDebugSnapshot() {
		return {
			...structuredClone(this.runtimeDebug),
			nativeMeshes: this.lastNativeMeshInstallDiagnostics,
			constraints: this.lastConstraintSetupDiagnostics,
			funit: Ti(this.currentRuntimeExtension),
			camera: this.getCameraDebugSnapshot()
		};
	}
	getCameraDebugSnapshot() {
		let e = this.camera.position, t = this.controls?.target ?? this.cameraTarget, n = e.clone().sub(t), r = new T.Spherical().setFromVector3(n), i = this.currentCameraPreset === "capture" ? L(this.currentCameraProfile ?? "full-body", this.cameraRootYawDegrees, this.masterCharacterHeightMeters) : null, a = this.currentCameraPreset === "costume-shop" ? this.studioCameraState() : i?.costumeShopState ?? null;
		return {
			preset: this.currentCameraPreset,
			profile: this.currentCameraProfile,
			characterRootYawDegrees: Number(T.MathUtils.radToDeg(this.characterRoot.rotation.y).toFixed(3)),
			costumeShopState: a === null ? null : {
				cameraRootYawDegrees: Number(a.cameraRootYawDegrees.toFixed(3)),
				zoomValue: Number(a.zoomValue.toFixed(4)),
				zoomMoveValue: Number(a.zoomMoveValue.toFixed(4)),
				zoomRatio: Number(a.zoomRatio.toFixed(4)),
				localCameraPosition: {
					x: Number(a.localCameraPosition.x.toFixed(4)),
					y: Number(a.localCameraPosition.y.toFixed(4)),
					z: Number(a.localCameraPosition.z.toFixed(4))
				},
				localCameraRotationYDegrees: a.localCameraRotationYDegrees
			},
			position: {
				x: Number(e.x.toFixed(4)),
				y: Number(e.y.toFixed(4)),
				z: Number(e.z.toFixed(4))
			},
			target: {
				x: Number(t.x.toFixed(4)),
				y: Number(t.y.toFixed(4)),
				z: Number(t.z.toFixed(4))
			},
			offset: {
				x: Number(n.x.toFixed(4)),
				y: Number(n.y.toFixed(4)),
				z: Number(n.z.toFixed(4))
			},
			distance: Number(r.radius.toFixed(4)),
			polarDegrees: Number(T.MathUtils.radToDeg(r.phi).toFixed(3)),
			azimuthDegrees: Number(T.MathUtils.radToDeg(r.theta).toFixed(3)),
			fovDegrees: Number(this.camera.fov.toFixed(3)),
			aspect: Number(this.camera.aspect.toFixed(4)),
			zoom: Number(this.camera.zoom.toFixed(4)),
			minPolarDegrees: Number(T.MathUtils.radToDeg(this.controls?.minPolarAngle ?? T.MathUtils.degToRad(82)).toFixed(3)),
			maxPolarDegrees: Number(T.MathUtils.radToDeg(this.controls?.maxPolarAngle ?? T.MathUtils.degToRad(100)).toFixed(3)),
			masterCharacterHeightMeters: Number(this.masterCharacterHeightMeters.toFixed(4)),
			characterModelScaleMeters: Number(this.characterModelScaleMeters.toFixed(4))
		};
	}
	onCameraDebugChange(e) {
		this.cameraDebugChangeCallback = e;
	}
	getSpringBoneSnapshot(e) {
		return bi(this.currentRuntimeExtension, !1, this.currentSpringRuntime?.getSnapshot(this.isSpringRuntimeEnabled(), e) ?? null);
	}
	setUtjSpringBoneTraceFilters(e, t) {
		this.currentSpringRuntime?.setTraceBoneFilters(e, t);
	}
	getUtjSpringBoneTraceSnapshot() {
		return this.currentSpringRuntime?.getTraceSnapshot() ?? null;
	}
	getAnimationSnapshot() {
		let e = this.costumeShopMotion?.snapshot() ?? {
			motionBundle: null,
			motionClip: null,
			motionTime: 0,
			motionLength: 0,
			facialClip: null,
			facialTime: 0,
			lipSyncClip: null
		};
		return {
			...e,
			activeClipName: e.motionClip,
			currentTime: e.motionTime,
			duration: e.motionLength,
			paused: this.costumeShopMotionPaused,
			speed: this.costumeShopMotionSpeed
		};
	}
	setAnimationPaused(e) {
		this.costumeShopMotionPaused = e;
	}
	setAnimationSpeed(e) {
		this.costumeShopMotionSpeed = e;
	}
	setUtjSpringBoneEnabled(e) {
		this.setSpringRuntimeMode(e ? "unity-prefab" : "off");
	}
	setSpringRuntimeMode(e) {
		this.springRuntimeMode !== e && (this.currentSpringRuntime?.resetPose(), this.springRuntimeMode = e, this.resetCurrentSpringRuntimeState());
	}
	resetCurrentSpringRuntimeState() {
		this.currentSpringRuntime?.resetStateToCurrentPose();
	}
	isSpringRuntimeEnabled() {
		return this.springRuntimeMode !== "off";
	}
	createSpringRuntime(e) {
		let t = f.fromPjskRuntimeExtension(this.currentRuntimeExtension, e);
		return t && this.currentSpringTimelineControl && t.setTimelineControl(this.currentSpringTimelineControl), t;
	}
	setSpringTimelineControl(e) {
		this.currentSpringTimelineControl = e ? { ...e } : null, this.currentSpringTimelineControl ? this.currentSpringRuntime?.setTimelineControl(this.currentSpringTimelineControl) : this.currentSpringRuntime?.clearTimelineControl();
	}
	seekAnimationPhase(e) {
		return this.prepareSpringRuntimeForAnimationSeek(), this.costumeShopMotion?.seek(!1, e), this.syncOfficialModelCombineSetup(), this.resetCurrentSpringRuntimeState(), this.getAnimationSnapshot();
	}
	seekAnimationLoopPhase(e) {
		return this.prepareSpringRuntimeForAnimationSeek(), this.costumeShopMotion?.seek(!0, e), this.syncOfficialModelCombineSetup(), this.resetCurrentSpringRuntimeState(), this.getAnimationSnapshot();
	}
	prepareSpringRuntimeForAnimationSeek() {
		this.currentSpringRuntime?.resetPose();
	}
	setPresentationMode(e) {
		this.setCapturePresentation(e === "capture");
	}
	setCapturePresentation(e) {
		if (this.capturePresentationEnabled === e) {
			e && this.handleResize();
			return;
		}
		if (this.capturePresentationEnabled = e, e) {
			this.scene.fog = null, this.sceneReference.visible = !1, this.handleResize();
			return;
		}
		this.scene.fog = new T.Fog("#7f8d95", 5.5, 15), this.sceneReference.visible = !1;
	}
	stepCharacterDynamics(e, t) {
		let n = Math.max(0, e), r = this.costumeShopMotion, i = t && !this.costumeShopMotionPaused;
		if (r && i) {
			let e = n * this.costumeShopMotionSpeed;
			r.update(e), r.evaluate(e), this.onCostumeShopAnimatorEvaluated?.();
		} else r && n === 0 && (r.evaluate(0), this.onCostumeShopAnimatorEvaluated?.());
		this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), n !== 0 && (this.isSpringRuntimeEnabled() ? (r?.takeCalmDown() && this.currentSpringRuntime?.settleCurrentPose(mi, n), this.currentSpringRuntime?.update(n)) : this.currentSpringRuntime?.resetPose(), r && i && r.lateUpdate());
	}
	costumeShopMotionForCurrentStore() {
		let e = this.currentLoadedRuntimePackage?.partSet?.baseUrl;
		if (!e) throw Error("Original motion needs the loaded part store.");
		return (!this.costumeShopMotion || this.costumeShopMotionBaseUrl !== e) && (this.costumeShopMotion = new pi(n(e)), this.costumeShopMotionBaseUrl = e), this.costumeShopMotion;
	}
	costumeShopAnimatorRoot(e) {
		let t = e.root.children.find((e) => e.name === "body");
		if (!t) throw Error("The composed character has no body prefab root.");
		return t;
	}
	costumeShopRenderedMeshes(e, t) {
		return fi(t, e.meshCarrierBindings);
	}
	async costumeShopMotionBundle(e) {
		let t = this.costumeShopMotionRoleId;
		if (t) {
			let e = this.currentLoadedRuntimePackage?.partSet;
			if (!e) throw Error("Original motion needs the loaded part store.");
			let n = Oi(t);
			return (await y(e, n.characterId, n.unit)).motionPackage.originalMotionBundle;
		}
		let n = di(e.bodyAsset.source.animationUrls?.[0]);
		if (!n) throw Error("The role runtime has no original motion bundle (motionPackage.originalMotionBundle).");
		return n;
	}
	async applyCostumeShopMotionRole(e) {
		let t = this.costumeShopMotion;
		if (!t?.active) return;
		let n = await this.costumeShopMotionBundle(e);
		await t.preload([n]), t.playMotion(this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? e.id, n);
	}
	getCostumeShopMotionSnapshot() {
		return this.costumeShopMotion?.snapshot() ?? null;
	}
	stepCaptureFrame(e, t) {
		this.currentCameraPreset === "costume-shop" && (this.characterViewer.update(this.costumeShopViewerLayout(), this.officialCharacter !== null), this.applyStudioCamera()), this.officialCharacter && !this.officialUpdateDone && this.updateOfficialFrame(this.officialCharacter), this.officialUpdateDone = !1, this.stepCharacterDynamics(e, t), t && this.archiveBackground?.step(Math.max(0, e));
	}
	async setBackgroundMode(e, t) {
		if (this.backgroundMode = e, e !== "archive") return;
		let n = t ?? this.currentLoadedRuntimePackage?.partSet?.baseUrl ?? null;
		if (!n) throw Error("The archive background needs the runtime store URL.");
		if (this.archiveBackground && this.archiveBackgroundBaseUrl === n) return;
		let r = await Xt(new URL(n, globalThis.location?.href).toString());
		this.archiveBackground?.dispose(), this.archiveBackground = new Zt(r), this.archiveBackgroundBaseUrl = n;
	}
	getBackgroundMode() {
		return this.backgroundMode;
	}
	drawsArchiveBackground() {
		return this.backgroundMode === "archive" && this.archiveBackground !== null;
	}
	getCharacterRoot() {
		return this.characterRoot;
	}
	getCanvas() {
		return this.renderer.domElement;
	}
	waitForPostProcessorReady() {
		return Promise.resolve();
	}
	setViewportSize(e, t) {
		let n = this.ownsCanvas ? 320 : 1, r = Math.max(Math.trunc(e) || 0, n), i = Math.max(Math.trunc(t) || 0, n), a = Wr(r, i, window.devicePixelRatio);
		this.viewportWidth === r && this.viewportHeight === i && this.viewportPixelRatio === a || (this.currentCameraPreset !== "costume-shop" && (this.camera.aspect = r / i, this.camera.updateProjectionMatrix()), this.renderer.setPixelRatio(a), this.renderer.setSize(r, i, this.ownsCanvas), this.viewportWidth = r, this.viewportHeight = i, this.viewportPixelRatio = a);
	}
	renderFrame() {
		if (this.officialCharacter && (this.officialUpdatePending && this.updateOfficialFrame(this.officialCharacter), this.prepareOfficialFrame(this.officialCharacter)), this.currentCameraPreset === "costume-shop" && this.studioRenderTexture && this.viewerComposite) {
			this.renderCostumeShopViewer(this.studioRenderTexture, this.viewerComposite);
			return;
		}
		if (this.drawsArchiveBackground()) {
			this.archiveBackground.render(this.renderer, this.costumeShopViewerLayout());
			let e = this.renderer.autoClear;
			this.renderer.autoClear = !1, this.renderer.clearDepth(), this.renderer.clearStencil(), this.renderer.render(this.scene, this.camera), this.renderer.autoClear = e;
			return;
		}
		this.renderer.render(this.scene, this.camera);
	}
	renderCostumeShopViewer(e, t) {
		let n = this.scene.background, r = this.renderer.getClearColor(new T.Color()), i = this.renderer.getClearAlpha();
		this.scene.background = null, this.renderer.setClearColor(0, 0), this.renderer.setRenderTarget(e), this.renderer.render(this.scene, this.camera), this.renderer.setClearColor(r, i), this.scene.background = n;
		let a = this.costumeShopViewerLayout();
		if (this.drawsArchiveBackground()) {
			this.archiveBackground.render(this.renderer, a, a.modelTexture.x + a.modelTexture.width * .5), t.render(this.renderer, a, null, !1);
			return;
		}
		t.render(this.renderer, a, n);
	}
	costumeShopViewerLayout() {
		let e = this.renderer.getDrawingBufferSize(this.drawingBufferSize);
		return En(e.x, e.y);
	}
	applyStudioCamera() {
		let e = this.studioCamera, t = e.cameraWorldPosition(), n = e.cameraWorldRotation();
		this.camera.position.set(-t[0], t[1], t[2]), this.camera.quaternion.set(n[0], -n[1], -n[2], n[3]).multiply(gi), this.camera.fov = e.fieldOfView, this.camera.aspect = F.textureWidth / F.textureHeight, this.camera.near = F.nearClipPlane, this.camera.far = F.farClipPlane, this.camera.updateProjectionMatrix(), this.camera.updateMatrixWorld(), this.cameraTarget.set(0, e.cameraLocalPosition[1], 0);
	}
	studioCameraState() {
		let e = this.studioCamera, [t, n, r, i] = e.cameraRootRotation;
		return {
			cameraRootYawDegrees: -T.MathUtils.radToDeg(Math.atan2(2 * (i * n + t * r), 1 - 2 * (n * n + t * t))),
			zoomValue: e.zoomValue,
			zoomMoveValue: e.zoomMoveValue,
			zoomRatio: e.zoomDurationRatio,
			localCameraPosition: new T.Vector3(...e.cameraLocalPosition),
			localCameraRotationYDegrees: 180
		};
	}
	enterCostumeShopViewer() {
		this.studioRenderTexture ??= kn(), this.viewerComposite ??= new An(this.studioRenderTexture.texture), this.controls && (this.controls.enabled = !1), this.detachViewerInput ||= this.attachViewerInput();
	}
	leaveCostumeShopViewer() {
		this.detachViewerInput?.(), this.detachViewerInput = null, this.controls && (this.controls.enabled = !0), this.camera.near = .1, this.camera.far = 100;
		let e = this.renderer.getSize(this.drawingBufferSize);
		this.camera.aspect = e.x / e.y, this.camera.updateProjectionMatrix();
	}
	attachViewerInput() {
		let e = this.renderer.domElement;
		if (typeof e.addEventListener != "function") return null;
		let t = (t) => {
			let n = e.getBoundingClientRect(), r = this.renderer.getDrawingBufferSize(this.drawingBufferSize);
			return [(t.clientX - n.left) * r.x / n.width, (n.bottom - t.clientY) * r.y / n.height];
		}, n = (e) => e.pointerType !== "mouse" || e.button === 0, r = (r) => {
			n(r) && (e.setPointerCapture?.(r.pointerId), this.costumeShopViewerTouch("began", r.pointerId, ...t(r)));
		}, i = (e) => this.costumeShopViewerTouch("moved", e.pointerId, ...t(e)), a = (e) => {
			n(e) && this.costumeShopViewerTouch("ended", e.pointerId, ...t(e));
		}, o = (e) => this.costumeShopViewerTouch("ended", e.pointerId, ...t(e)), s = e.style.touchAction;
		return e.style.touchAction = "none", e.addEventListener("pointerdown", r), e.addEventListener("pointermove", i), e.addEventListener("pointerup", a), e.addEventListener("pointercancel", o), () => {
			e.removeEventListener("pointerdown", r), e.removeEventListener("pointermove", i), e.removeEventListener("pointerup", a), e.removeEventListener("pointercancel", o), e.style.touchAction = s;
		};
	}
	costumeShopViewerTouch(e, t, n, r) {
		e === "began" ? this.characterViewer.touchBegan(t, n, r) : e === "moved" ? this.characterViewer.touchMoved(t, n, r) : this.characterViewer.touchEnded(t, n, r);
	}
	getCostumeShopViewerSnapshot() {
		let e = this.studioCamera;
		return {
			zoomValue: e.zoomValue,
			zoomMoveValue: e.zoomMoveValue,
			zoomDurationRatio: e.zoomDurationRatio,
			cameraLocalPosition: [...e.cameraLocalPosition],
			cameraRootRotation: [...e.cameraRootRotation],
			viewer: this.characterViewer.snapshot,
			layout: this.costumeShopViewerLayout()
		};
	}
	updateOfficialFrame(e) {
		this.officialUpdatePending = !1, this.studioLights.setCameraRoot(this.cameraRootRotation(), [
			0,
			0,
			0
		]), this.studioLights.update(), e.model.update(), e.eye?.update();
	}
	cameraRootRotation() {
		return this.currentCameraPreset === "costume-shop" ? this.studioCamera.cameraRootRotation : rn(0, -this.cameraRootYawDegrees, 0);
	}
	prepareOfficialFrame(e) {
		this.camera.updateMatrixWorld(), br(this.studioLights.globals, this.camera.fov), e.renderer.prepare(this.camera), this.officialUpdatePending = !0;
	}
	finishCaptureFrame() {
		this.renderer.getContext().finish();
	}
	stepRuntimeFrame(e, t = {}) {
		this.stepCaptureFrame(e, t.advanceAnimation ?? !0);
	}
	async loadRuntimePackage(e) {
		let t = this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? null, n = e.roleId ?? null;
		t && n && t !== n && (this.releaseCurrentCharacterResources(), this.currentLoadedRuntimePackage = null);
		let r = await s(e.baseUrl, e);
		return this.currentLoadedRuntimePackage = r, r.combinedCharacter && await this.importCombinedCharacter(r.combinedCharacter), r;
	}
	async setCustomSelection(e) {
		return this.enqueueCustomSelectionMutation((t) => this.applyCustomSelection(e, t));
	}
	async updateCustomSelection(e, t) {
		return this.enqueueCustomSelectionMutation(async (n) => {
			let r = this.currentLoadedRuntimePackage?.wardrobe;
			if (!r) throw Error("No custom part package is loaded.");
			let i = r.getCustomSelection();
			if (!i) throw Error("No custom selection is active.");
			return this.applyCustomSelection({
				...i,
				bodyCostume3dId: e === "body" && t !== null ? t : i.bodyCostume3dId,
				headCostume3dId: e === "head" && t !== null ? t : i.headCostume3dId,
				headPackagePath: e === "head" && t !== null ? null : i.headPackagePath,
				hairCostume3dId: e === "hair" && t !== null ? t : i.hairCostume3dId,
				headOptionalCostume3dId: e === "head_optional" ? t : i.headOptionalCostume3dId
			}, n);
		});
	}
	async loadRenderRecipe(e) {
		return this.enqueueCustomSelectionMutation((t) => this.loadRenderRecipeInternal(e, t));
	}
	enqueueCustomSelectionMutation(e) {
		let t = ++this.customSelectionGeneration, n = () => t === this.customSelectionGeneration, r = () => {
			if (!n()) throw ki();
			return e(n);
		}, i = this.customSelectionQueue.then(r, r);
		return this.customSelectionQueue = i.catch(() => void 0), i;
	}
	async applyCustomSelection(e, t = () => !0) {
		let n = this.currentLoadedRuntimePackage?.wardrobe;
		if (!n) throw Error("No custom part package is loaded.");
		let r = n.getCombinedCharacter()?.id ?? null, i = await n.setCustomSelection(e, t);
		if (!t()) throw ki();
		return r !== null && r === i.id || await this.importCombinedCharacter(i, { disposeBeforeLoad: !0 }), i;
	}
	async loadRenderRecipeInternal(e, n) {
		let i = String(e.baseUrl ?? "").trim();
		if (!i) throw Error("baseUrl is required to load a render recipe.");
		let a = l(e), s = Oi(a.roleId), c = Oi(a.bodyRoleId), u = r(s.characterId, s.unit), d = this.currentLoadedRuntimePackage, f = d?.partSet?.baseUrl ?? null, p = d?.wardrobe?.getActiveRoleId() ?? null;
		(!d?.wardrobe || f !== i || p !== u) && await this.loadRuntimePackage({
			baseUrl: i,
			roleId: u,
			deferDefaultSelection: !0
		});
		let m = this.currentLoadedRuntimePackage?.wardrobe;
		if (!m) throw Error("No custom part package is loaded.");
		m.getActiveRoleId() !== u && m.selectRole(s.characterId, s.unit);
		let h = m.getPartPackageSet();
		h && (await o(h, c.characterId, c.unit), await t(h, s.characterId, s.unit));
		let g = a.motionRoleId ? Oi(a.motionRoleId) : null, _ = g ? r(g.characterId, g.unit) : null, v = _ !== this.costumeShopMotionRoleId;
		this.costumeShopMotionRoleId = _;
		let y = {
			characterId: s.characterId,
			unit: s.unit,
			bodyCharacterId: c.characterId,
			bodyUnit: c.unit,
			bodyCostume3dId: a.bodyCostume3dId,
			headCostume3dId: a.headCostume3dId,
			headPackagePath: a.headPackagePath,
			hairCostume3dId: a.hairCostume3dId,
			headOptionalCostume3dId: a.headOptionalCostume3dId
		}, b = m.getCombinedCharacter()?.id ?? null, x = await this.applyCustomSelection(y, n);
		return v && b === x.id && await this.applyCostumeShopMotionRole(x), {
			selection: y,
			combinedCharacter: x
		};
	}
	getSnapshots(e) {
		return {
			animation: this.getAnimationSnapshot(),
			springBone: this.getSpringBoneSnapshot(e),
			camera: this.getCameraDebugSnapshot(),
			runtimeDebug: this.getRuntimeDebugSnapshot(),
			utjSpringBoneTrace: this.getUtjSpringBoneTraceSnapshot()
		};
	}
	destroy() {
		cancelAnimationFrame(this.animationFrame), this.releaseCurrentCharacterResources(), this.officialCharacter && this.retiredOfficialCharacters.push(this.officialCharacter), this.officialCharacter = null, this.disposeRetiredCharacters(), this.manageResize && window.removeEventListener("resize", this.handleResize), this.controls?.dispose(), this.detachViewerInput?.(), this.viewerComposite?.dispose(), this.studioRenderTexture?.dispose(), this.textureLoader.dispose(), this.archiveBackground?.dispose(), this.renderer.dispose(), this.ownsCanvas && this.renderer.domElement.parentElement === this.container && this.renderer.domElement.remove();
	}
	setCameraTarget(e) {
		this.cameraTarget.copy(e), this.controls?.target.copy(e);
	}
	syncCameraTarget() {
		if (this.controls) {
			this.controls.update(), this.cameraTarget.copy(this.controls.target);
			return;
		}
		this.camera.lookAt(this.cameraTarget);
	}
	applyCostumeShopCharacterHeight(e) {
		let t = e || 1.6, n = tn(t), r = Math.abs(n - this.characterModelScaleMeters) >= 1e-4;
		if (this.masterCharacterHeightMeters = t, this.characterModelScaleMeters = n, this.characterRoot.scale.setScalar(1), this.currentPrefabSourceGraph && _(this.currentPrefabSourceGraph, n), !r || this.currentCameraPreset !== "default" && this.currentCameraProfile !== "legacy-cloud") return;
		let i = this.currentCameraProfile === "legacy-cloud" ? L("legacy-cloud", this.cameraRootYawDegrees, t) : I(n), a = i.position.clone().sub(i.target).applyAxisAngle(hi, this.currentCameraProfile === "legacy-cloud" ? 0 : T.MathUtils.degToRad(this.cameraRootYawDegrees));
		this.setCameraTarget(i.target), this.camera.position.copy(i.target).add(a), this.syncCameraTarget();
	}
	applyCameraPreset(e, t = "full-body") {
		let n = this.currentCameraPreset;
		if (this.currentCameraPreset = e, e === "costume-shop") {
			this.currentCameraProfile = null, this.enterCostumeShopViewer(), this.applyStudioCamera(), this.cameraDebugChangeCallback?.();
			return;
		}
		if (n === "costume-shop" && this.leaveCostumeShopViewer(), e === "capture") {
			this.currentCameraProfile = t;
			let e = L(t, this.cameraRootYawDegrees, this.masterCharacterHeightMeters);
			this.setCameraTarget(e.target), this.camera.position.copy(e.position), this.camera.fov = e.fov;
		} else {
			this.currentCameraProfile = null;
			let e = I(this.characterModelScaleMeters), t = e.position.clone().sub(e.target).applyAxisAngle(hi, T.MathUtils.degToRad(this.cameraRootYawDegrees));
			this.setCameraTarget(e.target), this.camera.position.copy(e.target).add(t), this.camera.fov = e.fov;
		}
		this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	shiftCameraRight(e = 1) {
		if (!Number.isFinite(e) || e === 0 || this.currentCameraPreset === "costume-shop") return;
		let t = this.controls?.target ?? this.cameraTarget, n = ft(this.camera.position, t, e, this.characterModelScaleMeters);
		this.setCameraTarget(n.target), this.camera.position.copy(n.position), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	makeImportStatus(e, t) {
		return {
			assetId: e.id,
			displayName: e.displayName,
			sourceMode: t.sourceMode,
			requestedUrl: t.requestedUrl,
			meshCount: t.meshCount,
			boneCount: t.boneCount,
			skinnedMeshCount: t.skinnedMeshCount
		};
	}
	resetSlotParents() {
		this.bodySlot.parent?.remove(this.bodySlot), this.headSlot.parent?.remove(this.headSlot), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot);
	}
	retiredCharacterObjects = [];
	retiredOfficialCharacters = [];
	retireCharacterSlot(e) {
		for (let t of [...e.children]) e.remove(t), this.retiredCharacterObjects.push(t);
	}
	disposeRetiredCharacters() {
		let e = /* @__PURE__ */ new Set();
		for (let t of [this.bodySlot, this.headSlot]) t.traverse((t) => {
			let n = t.material;
			for (let t of Array.isArray(n) ? n : n ? [n] : []) xi(t, e);
		});
		for (let e of this.retiredOfficialCharacters.splice(0)) e.renderer.dispose();
		for (let t of this.retiredCharacterObjects.splice(0)) Ci(t, /* @__PURE__ */ new Set(), new Set(e));
	}
	releaseCurrentCharacterResources() {
		this.currentSpringRuntime?.resetPose(), this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentRuntimeExtension = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.retireCharacterSlot(this.bodySlot), this.retireCharacterSlot(this.headSlot), this.resetSlotParents(), this.renderer.renderLists.dispose(), this.renderer.info.reset();
	}
	prepareCombinedComposition() {
		let e = this.currentPrefabSourceGraph;
		if (!e) throw Error("Official model_combine_setup graph is not loaded.");
		return this.currentCompositionStatus = {
			mode: "model_combine_setup",
			missingBodyBones: e.bodyAttach ? [] : ["Unity prefab body attach unresolved"],
			missingHeadBones: e.headRoot && e.headOrigin ? [] : ["Unity prefab head root/origin unresolved"]
		}, this.currentCompositionStatus;
	}
	async loadCombinedCharacterAsset(e) {
		if (!e.unityRuntimeJsonUrl) throw Error("Final runtime package must provide container.unityRuntimeJson.");
		let t = p(e.runtimeExtension, null);
		if (!t) throw Error("Final runtime package must provide runtimeUnitySetup version 0414.");
		this.currentPrefabSourceGraph = t, this.syncUnityPrefabSourceGraph();
		let n = u(t, e.runtimeExtension);
		if (this.lastNativeMeshInstallDiagnostics = n, n.error) throw Error(`${n.error}${n.warnings.length ? ` ${n.warnings.slice(0, 3).join(" ")}` : ""}`);
		this.syncUnityPrefabSourceGraph();
		let r = await vr({
			root: t.root,
			bodyAsset: e.bodyAsset,
			headAsset: e.headAsset,
			textureLoader: this.textureLoader,
			globals: this.studioLights.globals,
			directionalLight: this.studioLights.directional,
			headBone: () => _i(t.root),
			transformByPathId: (e) => t.nodeByPathId.get(e) ?? null,
			runtimeExtension: e.runtimeExtension,
			skinColors: e.skinColors ?? null
		});
		return {
			root: t.root,
			sourceMode: "unity-runtime",
			requestedUrl: e.unityRuntimeJsonUrl,
			meshCount: n.meshCount,
			boneCount: n.boneCount,
			skinnedMeshCount: n.skinnedMeshCount,
			prefabSourceGraph: t,
			official: r
		};
	}
	handleResize() {
		let e = this.container ?? this.renderer.domElement, t = Math.max(e.clientWidth, 320), n = Math.max(e.clientHeight, 320);
		this.setViewportSize(t, n);
	}
	render() {
		let e = this.clock.getDelta(), t = this.clock.elapsedTime;
		this.stepRuntimeFrame(e, {
			advanceAnimation: !0,
			elapsedTime: t
		}), this.currentCameraPreset !== "costume-shop" && this.controls?.update(), this.renderFrame(), this.animationFrame = requestAnimationFrame(() => this.render());
	}
	syncUnityPrefabSourceGraph() {
		let e = this.currentPrefabSourceGraph;
		e && (this.lastConstraintSetupDiagnostics = m(e, this.currentRuntimeExtension, this.characterModelScaleMeters, this.currentConstraintRuntime));
	}
	syncOfficialModelCombineSetup() {
		this.syncUnityPrefabSourceGraph();
	}
};
//#endregion
//#region src/costume_shop/CostumeShopKernel.ts
function ji(e) {
	let t = String(e.assetBaseUrl ?? "").trim();
	if (!t) throw Error("assetBaseUrl is required to create the CostumeShop kernel.");
	let n = Mi(new Ai({
		canvas: e.canvas,
		initialLight: { ...e.initialLight ?? Ne },
		autoRender: !1,
		manageResize: !1,
		ktx2TranscoderPath: e.ktx2TranscoderPath,
		cameraPreset: e.framing === "upper-body" ? "capture" : void 0,
		cameraProfile: e.framing === "upper-body" ? "official-default" : void 0
	}), t);
	return e.background && e.background !== "transparent" && n.setBackground(e.background).catch((e) => console.error("Haruki 3D background:", e)), n;
}
function Mi(e, t) {
	let n = a(e, t);
	return {
		...n,
		setCharacterYawDegrees: n.setViewYawDegrees
	};
}
var Ni = ji, Pi = Mi;
//#endregion
export { Ae as C, j as S, je as T, P as _, Ai as a, Ie as b, Ur as c, En as d, en as f, ft as g, I as h, Pi as i, Cn as l, L as m, Mi as n, Ei as o, tn as p, Ni as r, Wr as s, ji as t, Dn as u, F as v, ke as w, Ne as x, it as y };
