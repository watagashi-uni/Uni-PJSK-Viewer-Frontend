import { j as e } from "./unityPrefabRuntime-BiYdXsAt.js";
//#region src/original/unityAnimationClip.ts
function t(e, t) {
	if (!e) throw Error(t);
}
var n = Math.fround, r = /* @__PURE__ */ function(e) {
	return e[e.Transform = 4] = "Transform", e[e.SkinnedMeshRenderer = 137] = "SkinnedMeshRenderer", e;
}({}), i = /* @__PURE__ */ function(e) {
	return e[e.Position = 1] = "Position", e[e.Rotation = 2] = "Rotation", e[e.Scale = 3] = "Scale", e[e.EulerAngles = 4] = "EulerAngles", e;
}({});
function a(e, t) {
	return e === 4 ? t === 2 ? 4 : t === 1 || t === 3 || t === 4 ? 3 : 1 : 1;
}
function o(e) {
	let n = e.m_Name, r = e.m_MuscleClip;
	t(!e.m_Legacy && !e.m_Compressed, `${n}: legacy / compressed clips are not built clips`), t(e.m_Events.length === 0, `${n}: animation events are not supported`), t(e.m_ClipBindingConstant.pptrCurveMapping.length === 0, `${n}: object reference curves are not supported`), t(!r.m_LoopBlend && !r.m_Mirror && r.m_CycleOffset === 0, `${n}: loop pose / mirror / cycle offset are not supported`);
	let i = r.m_Clip.data, o = i.m_StreamedClip, s = i.m_DenseClip, c = i.m_ConstantClip.data;
	t(o.discreteCurveCount === 0, `${n}: discrete streamed curves are not supported`), t(s.m_SampleArray.length === s.m_FrameCount * s.m_CurveCount, `${n}: truncated dense clip`);
	let l = [], u = 0;
	for (let r of e.m_ClipBindingConstant.genericBindings) {
		t(!r.isPPtrCurve && !r.isIntCurve && !r.isSerializeReferenceCurve, `${n}: object / integer curves are not supported`), t(r.typeID === 4 && r.customType === 0 && r.attribute >= 1 && r.attribute <= 3 || r.typeID === 4 && r.attribute === 4 && r.customType >= 0 && r.customType <= 5 || r.typeID === 137 && r.customType === 20, `${n}: unsupported binding type ${r.typeID} / custom ${r.customType} / attribute ${r.attribute}`);
		let e = a(r.typeID, r.attribute);
		l.push({
			path: r.path >>> 0,
			attribute: r.attribute >>> 0,
			typeID: r.typeID,
			customType: r.customType,
			offset: u,
			dimension: e
		}), u += e;
	}
	let d = o.curveCount + s.m_CurveCount + c.length;
	t(u === d, `${n}: bindings cover ${u} curves, the clip has ${d}`);
	let f = o.data, p = new DataView(f.buffer, f.byteOffset, f.byteLength), m = Array.from({ length: o.curveCount }, () => []), h = 0, g = -Infinity;
	for (; h < p.byteLength;) {
		let e = p.getFloat32(h, !0), r = p.getUint32(h + 4, !0);
		h += 8, t(e >= g, `${n}: streamed frames out of order`), g = e;
		for (let i = 0; i < r; i++, h += 20) {
			let r = p.getInt32(h, !0);
			t(r >= 0 && r < o.curveCount, `${n}: streamed key for curve ${r}`), m[r].push({
				time: e,
				at: h + 4
			});
		}
	}
	t(h === p.byteLength, `${n}: truncated streamed clip`);
	let _ = new Uint32Array(o.curveCount + 1), v = 0;
	for (let e = 0; e < o.curveCount; e++) _[e] = v, t(m[e].length > 0, `${n}: streamed curve ${e} has no keys`), v += m[e].length;
	_[o.curveCount] = v;
	let y = new Float32Array(v), b = new Float32Array(v * 4);
	for (let e = 0, t = 0; e < o.curveCount; e++) for (let n of m[e]) {
		y[t] = n.time;
		for (let e = 0; e < 4; e++) b[t * 4 + e] = p.getFloat32(n.at + e * 4, !0);
		t++;
	}
	return {
		name: n,
		startTime: r.m_StartTime,
		stopTime: r.m_StopTime,
		isLooping: r.m_LoopTime,
		bindings: l,
		curveCount: d,
		streamed: {
			curveCount: o.curveCount,
			keyStart: _,
			keyTimes: y,
			keyCoefficients: b
		},
		dense: {
			curveCount: s.m_CurveCount,
			frameCount: s.m_FrameCount,
			sampleRate: s.m_SampleRate,
			beginTime: s.m_BeginTime,
			samples: Float32Array.from(s.m_SampleArray)
		},
		constants: Float32Array.from(c)
	};
}
function s(e) {
	return n(e.stopTime - e.startTime);
}
function c(e, t, r) {
	let i = n(t), { streamed: a, dense: o, constants: s } = e, { keyStart: c, keyTimes: l, keyCoefficients: u } = a;
	for (let e = 0; e < a.curveCount; e++) {
		let t = c[e], a = c[e + 1] - 1;
		for (; t < a;) {
			let e = t + a + 1 >> 1;
			l[e] <= i ? t = e : a = e - 1;
		}
		let o = t * 4, s = n(i - l[t]);
		r[e] = n(n(n(n(n(n(u[o] * s) + u[o + 1]) * s) + u[o + 2]) * s) + u[o + 3]);
	}
	let d = a.curveCount;
	if (o.curveCount > 0) {
		let e = n(n(i - o.beginTime) * o.sampleRate), t = Math.floor(e), a = n(e - t), s = o.frameCount - 1, c = Math.min(Math.max(t, 0), s) * o.curveCount, l = Math.min(Math.max(t + 1, 0), s) * o.curveCount;
		for (let e = 0; e < o.curveCount; e++) {
			let t = o.samples[c + e];
			r[d + e] = n(t + n(n(o.samples[l + e] - t) * a));
		}
	}
	return r.set(s, d + o.curveCount), r;
}
//#endregion
//#region src/original/partSpring.ts
function l(e) {
	if (typeof e == "bigint") return Number(e);
	if (e instanceof Uint8Array || ArrayBuffer.isView(e)) return Array.from(e);
	if (Array.isArray(e)) return e.map(l);
	if (e && typeof e == "object") {
		let t = {};
		for (let [n, r] of Object.entries(e)) t[n] = l(r);
		return t;
	}
	return e;
}
function u(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) return;
	let n = e;
	if (t in n) return n[t];
	let r = t.toLowerCase();
	for (let e of Object.keys(n)) if (e.toLowerCase() === r) return n[e];
}
function d(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
var f = (e, t) => {
	let n = u(e, t);
	return typeof n == "number" ? Math.fround(n) : null;
}, p = (e, t) => {
	let n = u(e, t);
	return typeof n == "number" && n >= -2147483648 && n <= 2147483647 ? Math.trunc(n) : null;
}, m = (e, t) => {
	let n = u(e, t);
	return typeof n == "number" && Number.isInteger(n) ? n : null;
}, h = (e, t) => {
	let n = u(e, t);
	return typeof n == "boolean" ? n : typeof n == "number" ? Number.isInteger(n) ? n !== 0 : Math.abs(n) > 1e-5 : null;
}, g = (e, t) => {
	let n = u(e, t);
	return typeof n == "string" && n.trim() ? n : null;
}, _ = (e, t) => {
	let n = u(e, t);
	return d(n) ? v(n) : null;
};
function v(e) {
	let t = f(e, "x") ?? f(e, "X"), n = f(e, "y") ?? f(e, "Y"), r = f(e, "z") ?? f(e, "Z");
	return t !== null && n !== null && r !== null ? {
		x: t,
		y: n,
		z: r
	} : null;
}
var y = (e, t) => {
	let n = u(e, t);
	return Array.isArray(n) ? n : null;
};
function b(e) {
	if (e == null) return null;
	if (typeof e == "boolean") return e;
	if (typeof e == "number" || typeof e == "bigint") return Number(e) === 1 || Number(e) !== 0 && null;
	let t = String(e).trim().toLowerCase();
	return t === "true" || t !== "false" && null;
}
var x = (e, t, n) => b(e[t]) ?? n, S = (e, t, n) => {
	let r = e[t];
	return typeof r == "number" ? Math.fround(r) : n;
}, C = (e, t) => {
	let n = e[t];
	return typeof n == "number" ? Math.fround(n) : null;
}, w = (e, t) => {
	let n = e[t];
	return d(n) ? {
		x: S(n, "x", S(n, "X", 0)),
		y: S(n, "y", S(n, "Y", 0)),
		z: S(n, "z", S(n, "Z", 0))
	} : null;
};
function T(e, t) {
	return e === t ? 0 : e == null ? -1 : t == null ? 1 : e < t ? -1 : 1;
}
function E(e, ...t) {
	return [...e].sort((e, n) => {
		for (let r of t) {
			let t = r(e), i = r(n), a = typeof t == "string" || typeof i == "string" || t === null || i === null || t === void 0 || i === void 0 ? T(t, i) : t < i ? -1 : +(t > i);
			if (a) return a;
		}
		return 0;
	});
}
var D = (e) => {
	if (!e || !e.trim()) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
};
function O(e) {
	for (let t of Object.keys(e)) (e[t] === null || e[t] === void 0) && delete e[t];
	return e;
}
var k = {
	1818360609: "RotationConstraint",
	1773428102: "ParentConstraint",
	895512359: "AimConstraint",
	1818360608: "PositionConstraint"
}, A = [
	"RotationConstraint",
	"ParentConstraint",
	"AimConstraint",
	"PositionConstraint"
], j = {
	[e.MeshRenderer]: "MeshRenderer",
	[e.SkinnedMeshRenderer]: "SkinnedMeshRenderer"
}, ee = new Set([
	"SpringManager",
	"SpringBone",
	"SpringSphereCollider",
	"SpringCapsuleCollider",
	"SpringPanelCollider",
	"SpringBonePivot",
	"ExtraBone",
	"ForceVolume",
	"WindVolume",
	"WindVolumeOneSelf",
	"SekaiCharacterHair",
	"SekaiCharacterEye",
	"CharacterAccessoryTransformController",
	"CharacterAccessoryTransformData"
].map((e) => e.toLowerCase())), te = class {
	bundle;
	objects;
	refs = /* @__PURE__ */ new Map();
	activeSelf = /* @__PURE__ */ new Map();
	constructor(t, n) {
		this.bundle = t, this.objects = n;
		for (let r of n) {
			if (r.classId !== e.GameObject) continue;
			let n = r.read(), i = t.gameObjectTransform(n), a = i === null ? null : t.transformPath(i), o = this.goActiveSelf(r.pathId), s = this.goActiveInHierarchy(r.pathId, /* @__PURE__ */ new Set());
			this.refs.set(Number(r.pathId), {
				fileId: 0,
				pathId: Number(r.pathId),
				name: n.m_Name,
				transformPath: a,
				activeSelf: o,
				activeInHierarchy: s
			}), i !== null && this.refs.set(Number(i), {
				fileId: 0,
				pathId: Number(i),
				name: n.m_Name,
				transformPath: a,
				activeSelf: o,
				activeInHierarchy: s
			});
		}
		for (let r of n) if (r.classId === e.MonoBehaviour) {
			let e = r.read(), n = this.gameObjectRef(e.m_GameObject);
			this.refs.set(Number(r.pathId), {
				fileId: 0,
				pathId: Number(r.pathId),
				name: n?.name ?? t.script(e).name,
				transformPath: n?.transformPath,
				activeSelf: n?.activeSelf,
				activeInHierarchy: n?.activeInHierarchy
			});
		} else if (j[r.classId]) {
			let e = r.read(), t = this.gameObjectRef(e.m_GameObject);
			this.refs.set(Number(r.pathId), {
				fileId: 0,
				pathId: Number(r.pathId),
				name: t?.name ?? j[r.classId],
				transformPath: t?.transformPath,
				activeSelf: t?.activeSelf,
				activeInHierarchy: t?.activeInHierarchy
			});
		}
	}
	goActiveSelf(e) {
		if (!this.activeSelf.has(e)) {
			let t = this.bundle.object(e)?.read();
			this.activeSelf.set(e, t ? !!t.m_IsActive : null);
		}
		return this.activeSelf.get(e);
	}
	goActiveInHierarchy(e, t) {
		if (t.has(e)) return null;
		t.add(e);
		let n = this.goActiveSelf(e);
		if (n === !1) return !1;
		let r = this.bundle.object(e)?.read(), i = r ? this.bundle.gameObjectTransform(r) : null, a = i === null ? null : this.bundle.object(i)?.read(), o = a ? this.bundle.read(a.m_Father) : null, s = o ? this.bundle.local(o.m_GameObject) : null;
		if (!s) return n;
		let c = this.goActiveInHierarchy(s.pathId, t);
		return c === !1 ? !1 : n === null || c === null ? null : !0;
	}
	gameObjectRef(e) {
		if (!e || e.m_PathID === 0n) return null;
		let t = this.bundle.local(e);
		if (!t) return {
			fileId: e.m_FileID,
			pathId: Number(e.m_PathID),
			name: null,
			transformPath: null
		};
		let n = t.read(), r = this.bundle.gameObjectTransform(n);
		return {
			fileId: e.m_FileID,
			pathId: Number(e.m_PathID),
			name: n.m_Name,
			transformPath: r === null ? null : this.bundle.transformPath(r),
			transformPathId: r === null ? null : Number(r),
			activeSelf: this.goActiveSelf(t.pathId),
			activeInHierarchy: this.goActiveInHierarchy(t.pathId, /* @__PURE__ */ new Set())
		};
	}
	objectRef(e) {
		if (!d(e)) return null;
		let t = p(e, "m_FileID") ?? 0, n = m(e, "m_PathID") ?? 0;
		if (n === 0) return null;
		let r = this.refs.get(n);
		return r ? {
			...r,
			fileId: t,
			pathId: n
		} : {
			fileId: t,
			pathId: n,
			name: null,
			transformPath: null
		};
	}
}, M = (e) => e ? O({ ...e }) : null;
function N(e) {
	let t = [], n = (e, t) => {
		if (Array.isArray(e)) for (let r of e) n(r, t);
		else if (d(e)) {
			let r = p(e, "m_FileID"), i = m(e, "m_PathID");
			if (r !== null && i !== null) {
				t.push({
					fileId: r,
					pathId: i
				});
				return;
			}
			for (let r of Object.values(e)) n(r, t);
		}
	};
	for (let [r, i] of Object.entries(e)) {
		let e = [];
		if (n(i, e), !e.length) continue;
		let a = /* @__PURE__ */ new Set();
		t.push({
			fieldPath: r,
			references: e.filter((e) => {
				let t = `${e.fileId}:${e.pathId}`;
				return e.pathId === 0 || a.has(t) ? !1 : (a.add(t), !0);
			})
		});
	}
	return t;
}
function P(t, n, r, i) {
	let a = new te(t, n), o = n.filter((e) => j[e.classId]), s = new Map(o.map((e) => [Number(e.pathId), l(e.read())])), c = new Map(o.map((e) => [Number(e.pathId), h(s.get(Number(e.pathId)), "m_Enabled")])), g = n.filter((t) => t.classId === e.MonoBehaviour).map((e) => {
		let n = e.read(), r = t.script(n);
		return {
			object: e,
			pathId: Number(e.pathId),
			scriptName: r.name,
			scriptNamespace: r.namespace,
			raw: l(n)
		};
	}), v = (e, t) => e.scriptName.toLowerCase() === t.toLowerCase(), b = /* @__PURE__ */ new Set();
	for (let e of g.filter((e) => v(e, "SpringManager"))) for (let t of y(e.raw, "springBones") ?? []) {
		let e = a.objectRef(t);
		e && b.add(e.pathId);
	}
	let x = g.filter((e) => ee.has(e.scriptName.toLowerCase())), S = new Map(g.map((e) => [e.pathId, e])), C = [];
	for (let e of x) Object.keys(e.raw).length || C.push(`MonoBehaviour ${e.scriptName}:${e.pathId} has no readable typetree payload.`);
	let w = (e) => a.gameObjectRef(e.object.read().m_GameObject), T = (e) => ({
		pathId: e.pathId,
		scriptName: e.scriptName,
		gameObject: w(e),
		raw: e.raw
	}), E = x.filter((e) => v(e, "SpringManager")).map(T), D = [...b].map((e) => S.get(e)).filter((e) => !!e).map((e) => ({
		pathId: e.pathId,
		scriptName: e.scriptName,
		gameObject: w(e),
		pivotNode: a.objectRef(u(e.raw, "pivotNode")),
		radius: f(e.raw, "radius"),
		stiffnessForce: f(e.raw, "stiffnessForce"),
		dragForce: f(e.raw, "dragForce"),
		windInfluence: f(e.raw, "windInfluence"),
		springForce: _(e.raw, "springForce"),
		lengthLimitTargets: (y(e.raw, "lengthLimitTargets") ?? []).map((e) => a.objectRef(e)).filter((e) => !!e),
		colliders: [
			"colliders",
			"sphereColliders",
			"capsuleColliders",
			"panelColliders"
		].flatMap((t) => y(e.raw, t) ?? []).map((e) => a.objectRef(e)).filter((e) => !!e),
		raw: e.raw
	}));
	for (let e of b) S.has(e) || C.push(`SpringManager referenced missing spring bone MonoBehaviour PathID ${e}.`);
	let O = (e) => {
		let t = u(e.raw, "linkedRenderer"), n = d(t) ? m(t, "m_PathID") : null, r = n !== null && c.has(n) ? c.get(n) : null;
		return {
			pathId: e.pathId,
			scriptName: e.scriptName,
			gameObject: w(e),
			linkedRenderer: a.objectRef(t),
			linkedRendererEnabled: r,
			radius: f(e.raw, "radius"),
			height: f(e.raw, "height") ?? f(e.raw, "length"),
			center: _(e.raw, "center") ?? _(e.raw, "offset"),
			direction: _(e.raw, "direction"),
			raw: e.raw
		};
	}, k = x.filter((e) => v(e, "SpringSphereCollider")).map(O), A = x.filter((e) => v(e, "SpringCapsuleCollider")).map(O), M = x.filter((e) => v(e, "SpringPanelCollider")).map(O), N = g.filter((e) => v(e, "ForceVolume") || v(e, "WindVolume") || v(e, "WindVolumeOneSelf")).map(T), P = x.filter((e) => v(e, "SpringBonePivot")).map(T), F = x.filter((e) => v(e, "ExtraBone")).map((e) => ({
		pathId: e.pathId,
		scriptName: e.scriptName,
		gameObject: w(e),
		referenceBone: a.objectRef(u(e.raw, "referenceBone")),
		rotationOrder: p(e.raw, "rotationOrder"),
		coefficient: f(e.raw, "coefficient"),
		defaultEulerAngles: _(e.raw, "defaultEulerAngles"),
		axisX: p(e.raw, "axisX"),
		axisY: p(e.raw, "axisY"),
		axisZ: p(e.raw, "axisZ"),
		raw: e.raw
	})), re = ae(g), I = ie(g), L = x.find((e) => v(e, "SekaiCharacterHair")), R = L ? {
		pathId: L.pathId,
		scriptName: L.scriptName,
		gameObject: w(L),
		headTransform: a.objectRef(u(L.raw, "headTransform")),
		offset: _(L.raw, "offset"),
		raw: L.raw
	} : null, z = x.find((e) => v(e, "SekaiCharacterEye")), B = (e, t) => {
		let n = u(e, t);
		if (!d(n)) return null;
		let r = p(n, "TileX"), i = p(n, "TileY"), a = p(n, "Sample");
		return r !== null && i !== null && a !== null ? {
			tileX: r,
			tileY: i,
			sample: a
		} : null;
	}, V = (e, t) => {
		let n = u(e, t);
		if (!d(n)) return null;
		let r = f(n, "r") ?? f(n, "R"), i = f(n, "g") ?? f(n, "G"), a = f(n, "b") ?? f(n, "B"), o = f(n, "a") ?? f(n, "A");
		return r !== null && i !== null && a !== null && o !== null ? {
			r,
			g: i,
			b: a,
			a: o
		} : null;
	}, H = z ? {
		pathId: z.pathId,
		scriptName: z.scriptName,
		gameObject: w(z),
		lightInfluence: f(z.raw, "lightInfluence"),
		lightInfluenceForEyeHighlight: f(z.raw, "lightInfluenceForEyeHighlight"),
		tintColor: V(z.raw, "tintColor"),
		emissionColor: V(z.raw, "emissionColor"),
		baseTiling: B(z.raw, "baseTiling"),
		highlightTiling: B(z.raw, "highlightTiling"),
		leftEyeCloseBlendShapeValue: f(z.raw, "leftEyeCloseBlendShapeValue"),
		rightEyeCloseBlendShapeValue: f(z.raw, "rightEyeCloseBlendShapeValue"),
		raw: z.raw
	} : null;
	return x.length || C.push("No SpringManager/SpringBone/Spring*Collider MonoBehaviours found."), !E.length && D.length && C.push("SpringBone entries were found, but SpringManager was not found."), {
		version: 1,
		bundlePath: i,
		partKind: r,
		prefabGraph: ne(a, r, i, g, s),
		managers: E,
		bones: D,
		sphereColliders: k,
		capsuleColliders: A,
		panelColliders: M,
		forceProviders: N,
		springBonePivots: P,
		extraBones: F,
		accessoryTransformAdjustments: re,
		funit: I,
		characterHair: R,
		characterEye: H,
		warnings: C
	};
}
function ne(t, n, r, i, a) {
	let { bundle: o, objects: s } = t, c = E(s.filter((t) => t.classId === e.GameObject).map((e) => {
		let t = e.read(), n = o.gameObjectTransform(t);
		return {
			o: e,
			go: t,
			t: n,
			path: n === null ? t.m_Name : o.transformPath(n)
		};
	}), (e) => e.path, (e) => e.o.pathId).map((e) => O({
		pathId: Number(e.o.pathId),
		name: e.go.m_Name,
		activeSelf: t.goActiveSelf(e.o.pathId),
		activeInHierarchy: t.goActiveInHierarchy(e.o.pathId, /* @__PURE__ */ new Set()),
		transformPathId: e.t === null ? null : Number(e.t),
		transformPath: e.t === null ? null : o.transformPath(e.t),
		componentPathIds: e.go.m_Component.map((e) => Number(e.component.m_PathID)).filter((e) => e !== 0)
	})), d = E(s.filter((t) => t.classId === e.Transform).map((e) => ({
		o: e,
		t: e.read(),
		path: o.transformPath(e.pathId)
	})), (e) => e.path, (e) => e.o.pathId).map((e) => {
		let t = o.read(e.t.m_GameObject);
		return O({
			pathId: Number(e.o.pathId),
			gameObjectPathId: e.t.m_GameObject.m_PathID === 0n ? null : Number(e.t.m_GameObject.m_PathID),
			name: t?.m_Name ?? null,
			transformPath: e.path,
			poseRoot: D(e.path),
			parentPathId: e.t.m_Father.m_PathID === 0n ? null : Number(e.t.m_Father.m_PathID),
			childPathIds: e.t.m_Children.map((e) => Number(e.m_PathID)).filter((e) => e !== 0),
			localPosition: { ...e.t.m_LocalPosition },
			localRotation: { ...e.t.m_LocalRotation },
			localScale: { ...e.t.m_LocalScale }
		});
	}), f = E(s.filter((e) => j[e.classId]).map((e) => {
		let n = e.read();
		return {
			o: e,
			r: n,
			go: t.gameObjectRef(n.m_GameObject)
		};
	}), (e) => e.go?.transformPath, (e) => e.o.pathId).map((n) => {
		let r = n.o.classId === e.SkinnedMeshRenderer, i = null;
		if (r) i = n.r.m_Mesh ?? null;
		else {
			let r = t.bundle.read(n.r.m_GameObject)?.m_Component.map((e) => t.bundle.local(e.component)).find((t) => t?.classId === e.MeshFilter);
			i = r ? r.read().m_Mesh : null;
		}
		let o = i ? t.bundle.read(i) : null, s = a.get(Number(n.o.pathId));
		return O({
			pathId: Number(n.o.pathId),
			typeName: j[n.o.classId],
			gameObjectPathId: n.r.m_GameObject.m_PathID === 0n ? null : Number(n.r.m_GameObject.m_PathID),
			transformPathId: n.go?.transformPathId ?? null,
			name: n.go?.name ?? null,
			transformPath: n.go?.transformPath ?? null,
			poseRoot: D(n.go?.transformPath),
			activeSelf: n.go?.activeSelf ?? null,
			activeInHierarchy: n.go?.activeInHierarchy ?? null,
			enabled: h(s, "m_Enabled") ?? !1,
			meshPathId: i && i.m_PathID !== 0n ? Number(i.m_PathID) : null,
			meshName: o?.m_Name ?? null,
			skinnedMeshBones: r ? (n.r.m_Bones ?? []).map((e) => Number(e.m_PathID)).filter((e) => e !== 0) : [],
			rootBonePathId: s ? t.objectRef(u(s, "m_RootBone"))?.pathId ?? null : null,
			materialFileIds: n.r.m_Materials.map((e) => e.m_FileID),
			materialPathIds: n.r.m_Materials.map((e) => Number(e.m_PathID))
		});
	}), p = E(s.filter((t) => t.classId === e.Animator).map((e) => {
		let n = e.read();
		return {
			o: e,
			a: n,
			go: t.gameObjectRef(n.m_GameObject)
		};
	}), (e) => e.go?.transformPath, (e) => e.o.pathId).map((e) => O({
		pathId: Number(e.o.pathId),
		gameObjectPathId: e.a.m_GameObject.m_PathID === 0n ? null : Number(e.a.m_GameObject.m_PathID),
		name: e.go?.name ?? null,
		transformPath: e.go?.transformPath ?? null,
		poseRoot: D(e.go?.transformPath),
		enabled: Number(e.a.m_Enabled) !== 0,
		hasTransformHierarchy: !!e.a.m_HasTransformHierarchy,
		avatarPathId: e.a.m_Avatar.m_PathID === 0n ? null : Number(e.a.m_Avatar.m_PathID),
		controllerPathId: e.a.m_Controller.m_PathID === 0n ? null : Number(e.a.m_Controller.m_PathID)
	})), m = E(i.map((e) => ({
		m: e,
		go: t.gameObjectRef(e.object.read().m_GameObject)
	})), (e) => e.go?.transformPath, (e) => e.m.scriptName, (e) => e.m.object.pathId).map((e) => {
		let t = e.m.object.read().m_GameObject;
		return O({
			pathId: e.m.pathId,
			scriptName: e.m.scriptName,
			gameObjectPathId: t.m_PathID === 0n ? null : Number(t.m_PathID),
			name: e.go?.name ?? null,
			transformPath: e.go?.transformPath ?? null,
			poseRoot: D(e.go?.transformPath),
			enabled: h(e.m.raw, "m_Enabled"),
			objectReferenceFields: N(e.m.raw)
		});
	}), g = E(s.filter((e) => k[e.classId]).map((e) => {
		let n = l(e.read());
		return {
			o: e,
			raw: n,
			owner: t.objectRef(u(n, "m_GameObject")),
			typeName: k[e.classId]
		};
	}), (e) => e.owner?.transformPath, (e) => e.typeName, (e) => e.o.pathId).map((e) => re(t, e.o, e.raw, e.owner, e.typeName)), _ = d.filter((e) => e.parentPathId === void 0).map((e) => e.pathId);
	return {
		version: 1,
		partKind: n,
		bundlePath: r,
		gameObjects: c,
		transforms: d,
		renderers: f,
		animators: p,
		monoBehaviours: m,
		constraints: g,
		constraintCapability: {
			requestedTypes: A,
			supportedTypes: A,
			missingTypes: []
		},
		rootTransformPathIds: _
	};
}
function F(e, t) {
	let n = h(e, `${t}X`), r = h(e, `${t}Y`), i = h(e, `${t}Z`);
	return n === null && r === null && i === null ? null : !!n | (r ? 2 : 0) | (i ? 4 : 0);
}
function re(e, t, n, r, i) {
	let a = e.objectRef(u(n, "m_WorldUpObject") ?? u(n, "worldUpObject") ?? u(n, "WorldUpObject")), o = (e) => {
		if (Array.isArray(e)) return e;
		if (!d(e)) return null;
		for (let t of [
			"data",
			"Array",
			"items"
		]) if (u(e, t) !== void 0) return o(u(e, t));
		return null;
	}, s = (...e) => {
		for (let t of e) {
			let e = u(n, t);
			if (e === void 0) continue;
			let r = o(e);
			if (r) return r;
		}
		return null;
	}, c = s("m_Sources", "sources", "Sources") ?? [], l = s("m_TranslationOffsets", "translationOffsets", "TranslationOffsets"), m = s("m_RotationOffsets", "rotationOffsets", "RotationOffsets"), g = (e, t) => e && d(e[t]) ? v(e[t]) : null, y = c.flatMap((t, n) => {
		if (!d(t)) return [];
		let r = e.objectRef(u(t, "sourceTransform") ?? u(t, "m_SourceTransform") ?? u(t, "transform") ?? u(t, "Transform"));
		return [O({
			sourcePathId: r?.pathId ?? null,
			sourceName: r?.name ?? null,
			sourcePath: r?.transformPath ?? null,
			weight: f(t, "weight") ?? f(t, "m_Weight") ?? 1,
			translationOffset: _(t, "translationOffset") ?? _(t, "m_TranslationOffset") ?? _(t, "offset") ?? _(t, "m_Offset") ?? g(l, n),
			rotationOffset: _(t, "rotationOffset") ?? _(t, "m_RotationOffset") ?? g(m, n)
		})];
	}), b = i === "RotationConstraint" ? "rotation" : i === "ParentConstraint" ? "parent" : i === "PositionConstraint" ? "position" : "aim";
	return O({
		pathId: Number(t.pathId),
		type: b,
		typeName: i,
		gameObjectPathId: r?.pathId ?? null,
		ownerName: r?.name ?? null,
		ownerPath: r?.transformPath ?? null,
		poseRoot: D(r?.transformPath),
		enabled: h(n, "m_Enabled"),
		active: h(n, "m_ConstraintActive") ?? h(n, "constraintActive") ?? h(n, "m_Active"),
		weight: f(n, "m_Weight") ?? f(n, "weight") ?? 1,
		locked: h(n, "m_Locked") ?? h(n, "locked"),
		translationAxis: F(n, "m_AffectTranslation") ?? p(n, "m_TranslationAxes") ?? p(n, "m_TranslationAxis") ?? p(n, "translationAxis"),
		rotationAxis: F(n, "m_AffectRotation") ?? p(n, "m_RotationAxes") ?? p(n, "m_RotationAxis") ?? p(n, "m_Axes") ?? p(n, "rotationAxis"),
		translationAtRest: _(n, "m_TranslationAtRest") ?? _(n, "translationAtRest"),
		rotationAtRest: _(n, "m_RotationAtRest") ?? _(n, "rotationAtRest"),
		translationOffset: _(n, "m_TranslationOffset") ?? _(n, "translationOffset"),
		rotationOffset: _(n, "m_RotationOffset") ?? _(n, "rotationOffset"),
		aimVector: _(n, "m_AimVector") ?? _(n, "aimVector"),
		upVector: _(n, "m_UpVector") ?? _(n, "upVector"),
		worldUpVector: _(n, "m_WorldUpVector") ?? _(n, "worldUpVector"),
		worldUpType: p(n, "m_UpType") ?? p(n, "m_WorldUpType") ?? p(n, "worldUpType"),
		worldUpObjectPathId: a?.pathId ?? null,
		worldUpObjectName: a?.name ?? null,
		worldUpObjectPath: a?.transformPath ?? null,
		sources: y,
		objectReferenceFields: N(n)
	});
}
function ie(e) {
	let t = e.filter((e) => e.scriptNamespace === "FUnit" || e.scriptNamespace.startsWith("FUnit.")), n = [...new Set(t.map((e) => e.scriptNamespace.trim() ? `${e.scriptNamespace}.${e.scriptName}` : e.scriptName))].sort(T), r = (e) => t.filter((t) => t.scriptName.toLowerCase() === e.toLowerCase()).length;
	return {
		present: t.length > 0,
		scriptCount: t.length,
		springManagerCount: r("SpringManager"),
		springBoneCount: r("SpringBone"),
		sphereColliderCount: r("SpringSphereCollider"),
		capsuleColliderCount: r("SpringCapsuleCollider"),
		panelColliderCount: r("SpringPanelCollider"),
		detectedScripts: n,
		policy: "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function ae(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.filter((e) => e.scriptName.toLowerCase() === "characteraccessorytransformcontroller")) {
		let e = u(n.raw, "_characterAccessoryTransformData") ?? u(n.raw, "characterAccessoryTransformData"), r = d(e) ? m(e, "m_PathID") : null;
		r !== null && t.add(r);
	}
	let n = e.filter((e) => e.scriptName.toLowerCase() === "characteraccessorytransformdata" && (!t.size || t.has(e.pathId))), r = /* @__PURE__ */ new Map();
	for (let e of n) {
		let t = u(e.raw, "_faceIdAccessoryTransformDict") ?? u(e.raw, "faceIdAccessoryTransformDict") ?? u(e.raw, "FaceIdAccessoryTransformDict") ?? e.raw, n = [];
		z(t, null, n);
		for (let e of n) r.has(e.faceId) || r.set(e.faceId, e);
	}
	return [...r.values()].sort((e, t) => T(e.faceId, t.faceId));
}
function I(e, t) {
	return d(u(e, t));
}
function L(e, t) {
	return !t || !t.trim() || !d(e) || ![
		"pos",
		"position",
		"rot",
		"rotation",
		"rotationEulerDegrees",
		"scale"
	].some((t) => I(e, t)) ? null : {
		faceId: t,
		position: _(e, "pos") ?? _(e, "position") ?? {
			x: 0,
			y: 0,
			z: 0
		},
		rotationEulerDegrees: _(e, "rot") ?? _(e, "rotation") ?? _(e, "rotationEulerDegrees") ?? {
			x: 0,
			y: 0,
			z: 0
		},
		scale: _(e, "scale") ?? {
			x: 1,
			y: 1,
			z: 1
		}
	};
}
function R(e) {
	let t = e.split("/");
	return t.length === 2 && t.every((e) => e.trim());
}
function z(e, t, n) {
	if (Array.isArray(e)) {
		for (let r of e) z(r, t, n);
		return;
	}
	if (!d(e)) return;
	let r = g(e, "key") ?? g(e, "Key") ?? g(e, "faceId") ?? g(e, "FaceId") ?? t, i = u(e, "value") ?? u(e, "Value");
	if (i != null) {
		let e = L(i, r);
		e && n.push(e), z(i, r, n);
		return;
	}
	let a = L(e, r);
	if (a) {
		n.push(a);
		return;
	}
	let o = y(e, "keys") ?? y(e, "Keys") ?? y(e, "_keys") ?? y(e, "m_keys"), s = y(e, "values") ?? y(e, "Values") ?? y(e, "_values") ?? y(e, "m_values");
	if (o && s) {
		for (let e = 0; e < Math.min(o.length, s.length); e++) {
			let t = typeof o[e] == "string" && o[e].trim() ? o[e] : null, r = L(s[e], t);
			r && n.push(r);
		}
		return;
	}
	for (let [t, i] of Object.entries(e)) {
		let e = R(t) ? t : r, a = L(i, e);
		if (a) {
			n.push(a);
			continue;
		}
		z(i, e, n);
	}
}
var B = .01, V = .05, H = [
	{
		mask: 1,
		prefix: "CL_Hip"
	},
	{
		mask: 2,
		prefix: "CL_Chest"
	},
	{
		mask: 4,
		prefix: "CL_Left_Arm"
	},
	{
		mask: 8,
		prefix: "CL_Right_Arm"
	},
	{
		mask: 16,
		prefix: "CL_Left_Elbow"
	},
	{
		mask: 32,
		prefix: "CL_Right_Elbow"
	}
], U = (e, t, n) => e?.name && e.name.trim() ? e.name : `${t}:${n}`, W = (e) => e ? [
	e.x,
	e.y,
	e.z
] : [
	0,
	0,
	0
], G = (e, t) => !!e && e.trim() !== "" && (e === t || e.startsWith(`${t}/`)), K = (e) => !e || !e.trim() ? 2 ** 53 - 1 : e.split("/").length - 1, oe = (e) => {
	let t = e.lastIndexOf("/");
	return t <= 0 ? null : e.slice(0, t);
};
function se(e) {
	let t = [], n = [], r = /* @__PURE__ */ new Map(), i = (t, i) => {
		if (r.has(t.pathId)) return;
		let a = n.length;
		n.push(O({
			index: a,
			partKind: e.partKind,
			name: `${e.partKind}:${U(t.gameObject, t.scriptName, t.pathId)}`,
			sourcePathId: t.pathId,
			scriptName: t.scriptName,
			enabled: (h(t.raw, "m_Enabled") ?? !0) && t.linkedRendererEnabled !== !1,
			linkedRenderer: t.linkedRenderer ? O({
				pathId: t.linkedRenderer.pathId,
				name: t.linkedRenderer.name,
				path: t.linkedRenderer.transformPath
			}) : null,
			linkedRendererEnabled: t.linkedRendererEnabled,
			nodeName: t.gameObject?.name ?? null,
			nodePath: t.gameObject?.transformPath ?? null,
			poseRoot: D(t.gameObject?.transformPath),
			shape: i
		})), r.set(t.pathId, a);
	};
	for (let t of e.sphereColliders) i(t, { sphere: {
		offset: W(t.center),
		radius: Math.max(0, t.radius ?? B)
	} });
	for (let t of e.capsuleColliders) {
		let e = Math.max(0, t.height ?? V);
		i(t, { capsule: {
			offset: W(t.center),
			radius: Math.max(0, t.radius ?? B),
			tail: [
				0,
				Math.fround(e),
				0
			]
		} });
	}
	for (let n of e.panelColliders) i(n, { panel: {
		width: Math.max(0, f(n.raw, "width") ?? n.radius ?? 0),
		height: Math.max(0, f(n.raw, "height") ?? n.height ?? 0)
	} }), t.push(`${e.partKind}: SpringPanelCollider ${U(n.gameObject, n.scriptName, n.pathId)} was preserved for PJSK runtime; VRMC_springBone has no direct panel collider shape.`);
	let a = [], o = new Map(e.bones.map((e) => [e.pathId, e])), s = (e) => [
		"colliders",
		"sphereColliders",
		"capsuleColliders",
		"panelColliders"
	].flatMap((t) => (y(e, t) ?? []).flatMap((e) => {
		if (!d(e)) return [];
		let t = m(e, "m_PathID") ?? 0;
		return t === 0 ? [] : [t];
	}));
	for (let n of e.managers) {
		let i = n.gameObject?.transformPath, c;
		i && i.trim() ? (c = E(e.bones.filter((e) => G(e.gameObject?.transformPath, i)), (e) => K(e.gameObject?.transformPath), (e) => e.gameObject?.transformPath), c.length || t.push(`${e.partKind}: SpringManager ${n.pathId} has no SpringBone under ${i}; runtime FindSpringBones(true) would return none.`)) : (t.push(`${e.partKind}: SpringManager ${n.pathId} has no transform path; falling back to serialized springBones.`), c = (y(n.raw, "springBones") ?? []).flatMap((r) => {
			let i = d(r) ? m(r, "m_PathID") ?? 0 : 0;
			if (i === 0) return [];
			let a = o.get(i);
			return a || t.push(`${e.partKind}: SpringManager ${n.pathId} references missing SpringBone PathID ${i}.`), a ? [a] : [];
		}));
		for (let n of ce(c)) {
			for (let i of n.bones) {
				let n = s(i.raw), o = [];
				for (let a of n) {
					let n = r.get(a);
					n === void 0 ? t.push(`${e.partKind}: SpringBone ${U(i.gameObject, i.scriptName, i.pathId)} references unsupported or missing collider PathID ${a}.`) : o.push(n);
				}
				o.length && a.push(O({
					index: a.length,
					name: `${e.partKind}:${U(i.gameObject, i.scriptName, i.pathId)}:colliders`,
					partKind: e.partKind,
					sourceSpringBonePathId: i.pathId,
					colliders: o,
					sourceColliderPathIds: n,
					sourceKind: "direct",
					defaultRoot: D(i.gameObject?.transformPath)
				}));
			}
			if (n.bones.length) for (let i of n.bones) {
				let o = p(i.raw, "colliderFlag") ?? 0;
				if (o === 0) continue;
				let s = e.partKind.toLowerCase() === "head" ? null : e, c = H.filter((e) => (o & e.mask) !== 0), l = s ? [...s.capsuleColliders, ...s.sphereColliders].filter((e) => e.gameObject?.activeInHierarchy !== !1).filter((e) => c.some((t) => (e.gameObject?.name ?? "").toLowerCase().startsWith(t.prefix.toLowerCase()))) : [], u = l.map((e) => ({
					c: e,
					index: r.get(e.pathId)
				})).filter((e) => e.index !== void 0), d = /* @__PURE__ */ new Map();
				for (let e of u) {
					let t = D(e.c.gameObject?.transformPath) ?? "unknown", n = d.get(t) ?? [];
					n.includes(e.index) || n.push(e.index), d.set(t, n);
				}
				let f = D(i.gameObject?.transformPath), m = f === "body" || f === "sit_body" || f === "guitar_body" ? f : e.partKind.toLowerCase() === "head" || f === "face" ? "body" : null, h = m && d.get(m)?.length ? [...d.get(m)] : [...new Set(u.map((e) => e.index))];
				if (!h.length) {
					t.push(`${e.partKind}: Spring chain ${n.rootName} has colliderFlag ${o}, but no body colliders matched runtime CL_* prefixes [${c.map((e) => e.prefix).join(", ")}].`);
					continue;
				}
				a.push(O({
					index: a.length,
					name: `${e.partKind}:${n.rootName}:${U(i.gameObject, i.scriptName, i.pathId)}:colliderFlag:${o}:runtime_body`,
					partKind: (s ?? e).partKind,
					sourceSpringBonePathId: i.pathId,
					colliders: h,
					sourceColliderPathIds: l.map((e) => e.pathId),
					sourceKind: "colliderFlag",
					colliderFlag: o,
					matchedPrefixes: c.map((e) => e.prefix),
					collidersByRoot: d.size ? Object.fromEntries(d) : null,
					defaultRoot: m
				}));
			}
		}
	}
	return {
		colliders: n,
		groups: a,
		warnings: t
	};
}
function ce(e) {
	if (!e.length) return [];
	let t = new Map(e.map((e, t) => [e.pathId, t])), n = (e) => E(e, (e) => K(e.gameObject?.transformPath), (e) => t.get(e.pathId) ?? 2 ** 53 - 1), r = new Set(e.flatMap((e) => [e.pivotNode?.transformPath, e.gameObject?.transformPath]).filter((e) => !!e && !!e.trim())), i = E([...r].filter((e) => {
		let t = oe(e);
		return t === null || !r.has(t);
	}), (e) => K(e), (e) => e);
	if (!i.length) return [{
		rootName: "unresolved",
		bones: n(e)
	}];
	let a = /* @__PURE__ */ new Set(), o = [];
	for (let t of i) {
		let r = e.filter((e) => !a.has(e.pathId) && (G(e.gameObject?.transformPath, t) || G(e.pivotNode?.transformPath, t)));
		if (r.length) {
			for (let e of r) a.add(e.pathId);
			o.push({
				rootName: t.split("/").pop(),
				bones: n(r)
			});
		}
	}
	let s = e.filter((e) => !a.has(e.pathId));
	return s.length && o.push({
		rootName: "unresolved",
		bones: n(s)
	}), o;
}
function q(e, t) {
	let n = e[t];
	if (!d(n)) return null;
	let r = (e) => b(n[e]);
	return O({
		active: r("active") ?? r("enabled") ?? r("Active") ?? r("Enabled") ?? r("m_Enabled") ?? !0,
		min: C(n, "min"),
		max: C(n, "max")
	});
}
function le(e, t) {
	let n = (e, t) => (y(e, t) ?? []).flatMap((e) => {
		let t = d(e) ? m(e, "m_PathID") : null;
		return t !== null && t !== 0 ? [t] : [];
	});
	return e.forceProviders.filter((e) => {
		let r = [
			...n(e.raw, "springManager"),
			...n(e.raw, "springManagers"),
			...n(e.raw, "SpringManager"),
			...n(e.raw, "<SpringManager>k__BackingField"),
			...n(e.raw, "_SpringManager_k__BackingField")
		][0] ?? 0;
		return r === t.pathId || r === 0 && D(e.gameObject?.transformPath) === D(t.gameObject?.transformPath);
	}).map((e) => O({
		sourcePathId: e.pathId,
		scriptName: e.scriptName,
		nodeName: e.gameObject?.name ?? null,
		nodePath: e.gameObject?.transformPath ?? null,
		activeSelf: e.gameObject?.activeSelf ?? null,
		activeInHierarchy: e.gameObject?.activeInHierarchy ?? null,
		springManagerPathId: t.pathId,
		raw: e.raw
	}));
}
var ue = [
	"CL_Hip",
	"CL_Chest",
	"CL_Left_Arm",
	"CL_Right_Arm",
	"CL_Left_Elbow",
	"CL_Right_Elbow"
];
function de(e, t) {
	let n = e === "body" ? "Body" : "Head", r = se(t), i = t.managers.map((e) => O({
		partKind: n,
		pathId: e.pathId,
		nodeName: e.gameObject?.name ?? null,
		nodePath: e.gameObject?.transformPath ?? null,
		poseRoot: D(e.gameObject?.transformPath),
		activeSelf: e.gameObject?.activeSelf ?? null,
		activeInHierarchy: e.gameObject?.activeInHierarchy ?? null,
		enabled: x(e.raw, "m_Enabled", !0),
		automaticUpdates: x(e.raw, "automaticUpdates", !0),
		enableLengthLimits: x(e.raw, "enableLengthLimits", !0),
		enableAngleLimits: x(e.raw, "enableAngleLimits", !0),
		enableCollision: x(e.raw, "enableCollision", !0),
		collideWithGround: x(e.raw, "collideWithGround", !1),
		groundHeight: S(e.raw, "groundHeight", 0),
		isSumOfForcesOnBone: x(e.raw, "isSumOfForcesOnBone", !0),
		isPaused: x(e.raw, "isPaused", !1),
		dynamicRatio: S(e.raw, "dynamicRatio", 1),
		simulationFrameRate: Math.trunc(S(e.raw, "simulationFrameRate", 60)),
		slowMotionScale: S(e.raw, "slowMotionScale", 1),
		bounce: S(e.raw, "bounce", 0),
		friction: S(e.raw, "friction", 0),
		animatedBoneNames: [],
		rawGravity: w(e.raw, "gravity"),
		forceProviders: le(t, e),
		bonePathIds: t.bones.filter((t) => {
			let n = t.raw.m_manager, r = d(n) ? Number(String(n.m_PathID)) : NaN;
			return Number.isFinite(r) && r === e.pathId;
		}).map((e) => e.pathId)
	})), a = t.bones.map((e) => {
		let t = w(e.raw, "gravityDir");
		return O({
			partKind: n,
			pathId: e.pathId,
			nodeName: e.gameObject?.name ?? null,
			nodePath: e.gameObject?.transformPath ?? null,
			poseRoot: D(e.gameObject?.transformPath),
			activeSelf: e.gameObject?.activeSelf ?? null,
			activeInHierarchy: e.gameObject?.activeInHierarchy ?? null,
			enabled: x(e.raw, "m_Enabled", !0),
			pivotNodePath: e.pivotNode?.transformPath ?? null,
			pivotNodeName: e.pivotNode?.name ?? null,
			pivotSourcePathId: e.pivotNode?.pathId ?? null,
			hitRadius: e.radius ?? 0,
			stiffness: e.stiffnessForce ?? 0,
			dragForce: e.dragForce ?? 0,
			gravityPower: S(e.raw, "gravityPower", 0),
			gravityDir: t ? [
				t.x,
				t.y,
				t.z
			] : [
				0,
				-1,
				0
			],
			rawStiffnessForce: e.stiffnessForce,
			rawDragForce: e.dragForce,
			rawSpringForce: e.springForce,
			rawWindInfluence: e.windInfluence,
			rawAngularStiffness: C(e.raw, "angularStiffness"),
			rawSpringConstant: C(e.raw, "SpringConstant") ?? C(e.raw, "springConstant"),
			lengthLimitTargets: e.lengthLimitTargets.map((e) => O({
				name: e.name ?? null,
				path: e.transformPath ?? null,
				pathId: e.pathId
			})),
			rawAngleLimits: O({
				y: q(e.raw, "yAngleLimits"),
				z: q(e.raw, "zAngleLimits")
			}),
			directColliderPathIds: e.colliders.map((e) => e.pathId),
			colliderFlag: Math.trunc(S(e.raw, "colliderFlag", 0))
		});
	}), o = r.colliders.filter((e) => String(e.partKind).toLowerCase() === n.toLowerCase()).map((e) => O({
		partKind: e.partKind,
		index: e.index,
		pathId: e.sourcePathId,
		scriptName: e.scriptName,
		nodeName: e.nodeName,
		nodePath: e.nodePath,
		poseRoot: e.poseRoot,
		enabled: e.enabled,
		linkedRenderer: e.linkedRenderer,
		linkedRendererEnabled: e.linkedRendererEnabled,
		shape: e.shape
	})), s = n === "Head" ? a.filter((e) => e.colliderFlag > 0).map((e) => {
		let t = e.colliderFlag, r = ue.filter((e, n) => (t & 1 << n) != 0);
		return O({
			sourceKind: "deferred_body_colliderFlag",
			partKind: n,
			sourceSpringBonePathId: e.pathId,
			colliderFlag: t,
			matchedPrefixes: r,
			collidersByRoot: r.length ? { body: [] } : null,
			defaultRoot: "body",
			sourceColliderPathIds: [],
			colliders: []
		});
	}) : [], c = [...r.groups.filter((e) => String(e.partKind).toLowerCase() === n.toLowerCase()).map((e) => O({
		sourceKind: e.sourceKind ?? "direct",
		partKind: e.partKind,
		sourceSpringBonePathId: e.sourceSpringBonePathId,
		colliderFlag: e.colliderFlag ?? null,
		matchedPrefixes: e.matchedPrefixes ?? null,
		collidersByRoot: e.collidersByRoot ?? null,
		defaultRoot: e.defaultRoot ?? null,
		sourceColliderPathIds: e.sourceColliderPathIds,
		colliders: e.colliders
	})), ...s], l = [...new Set(t.prefabGraph.transforms.map((e) => D(e.transformPath)).filter((e) => !!e))].sort(T), u = l[0] ?? (e === "body" ? "body" : "face"), f = t.prefabGraph.constraints.map((e) => fe(t.prefabGraph.partKind, e)), p = f.length ? [...new Set(f.filter((e) => e.status !== "resolved").map((e) => `Constraint ${e.type} at ${e.ownerPath ?? e.ownerName ?? String(e.pathId)} is ${e.status}: ${e.reason}`))] : [`No Unity constraint components were found in this package. AssetStudio supports [${[...A].sort(T).join(", ")}]; missing [].`];
	return {
		partKind: n,
		prefabGraph: t.prefabGraph,
		managers: i,
		bones: a,
		extraBones: t.extraBones.map((e) => O({
			...e,
			gameObject: M(e.gameObject),
			referenceBone: M(e.referenceBone)
		})),
		colliders: o,
		colliderBindings: c,
		managerColliderCaches: i.map((e) => O({
			managerPathId: e.pathId,
			partKind: e.partKind,
			sourcePoseRoot: e.poseRoot ?? null,
			runtimeRoot: e.poseRoot ?? "unknown",
			managerNodeName: e.nodeName ?? null,
			managerNodePath: e.nodePath ?? null,
			springBonePathIds: e.bonePathIds,
			sphereColliderIndexes: o.filter((e) => d(e.shape) && "sphere" in e.shape).map((e) => e.index),
			capsuleColliderIndexes: o.filter((e) => d(e.shape) && "capsule" in e.shape).map((e) => e.index),
			panelColliderIndexes: o.filter((e) => d(e.shape) && "panel" in e.shape).map((e) => e.index),
			reason: "single-part package cache; viewer composer must re-filter after body collider merge"
		})),
		activeRootProfile: {
			defaultBodyRoot: u,
			activeRoots: l.length ? l : [u],
			inactiveRoots: []
		},
		funit: t.funit,
		constraintSetup: {
			version: "0414",
			sourceKind: "single_part_runtime_package",
			constraints: f,
			warnings: p
		},
		warnings: [.../* @__PURE__ */ new Set([...t.warnings, ...r.warnings])]
	};
}
function fe(e, t) {
	let n = t.sources.map((e) => O({
		sourcePathId: e.sourcePathId,
		sourceName: e.sourceName,
		sourcePath: e.sourcePath,
		weight: e.weight,
		translationOffset: e.translationOffset,
		rotationOffset: e.rotationOffset
	})), r = n.length > 0 && n.every((e) => typeof e.sourcePath == "string" && e.sourcePath.trim() || typeof e.sourceName == "string" && e.sourceName.trim()), i = (typeof t.ownerPath == "string" && t.ownerPath.trim() || typeof t.ownerName == "string" && t.ownerName.trim()) && r ? "resolved" : "unresolved_source";
	return O({
		partKind: e,
		type: t.type,
		pathId: t.pathId,
		ownerPath: t.ownerPath,
		ownerName: t.ownerName,
		enabled: t.enabled,
		active: t.active,
		weight: t.weight,
		locked: t.locked,
		translationAxis: t.translationAxis,
		rotationAxis: t.rotationAxis,
		translationAtRest: t.translationAtRest,
		rotationAtRest: t.rotationAtRest,
		translationOffset: t.translationOffset,
		rotationOffset: t.rotationOffset,
		aimVector: t.aimVector,
		upVector: t.upVector,
		worldUpVector: t.worldUpVector,
		worldUpType: t.worldUpType,
		worldUpObjectPathId: t.worldUpObjectPathId,
		worldUpObjectName: t.worldUpObjectName,
		worldUpObjectPath: t.worldUpObjectPath,
		sources: n,
		status: i,
		reason: i === "resolved" ? "Constraint source transforms were exported by the AssetStudio runtime payload." : "Constraint component was detected, but owner/source transform path or name is incomplete in the normalized payload."
	});
}
function pe(e) {
	let t = {};
	if (e.characterHair) {
		let n = e.characterHair;
		t.hair = O({
			pathId: n.pathId,
			scriptName: n.scriptName,
			gameObject: M(n.gameObject),
			headTransform: M(n.headTransform),
			offset: n.offset,
			raw: n.raw
		});
	}
	if (e.characterEye) {
		let n = e.characterEye;
		t.eye = O({
			...n,
			gameObject: M(n.gameObject)
		});
	}
	return t;
}
//#endregion
//#region src/original/unityMesh.ts
function J(e, t) {
	if (!e) throw Error(t);
}
var Y = [
	4,
	2,
	1,
	1,
	2,
	2,
	1,
	1,
	2,
	2,
	4,
	4
];
function me(e) {
	let t = (e & 32768) >> 15, n = (e & 31744) >> 10, r = e & 1023;
	return n === 0 ? (t ? -1 : 1) * 2 ** -14 * (r / 1024) : n === 31 ? r ? NaN : (t ? -1 : 1) * Infinity : (t ? -1 : 1) * 2 ** (n - 15) * (1 + r / 1024);
}
function he(e, t) {
	let n = e.m_VertexCount, r = e.m_Channels, i = t ?? e.m_DataSize, a = [];
	for (let e of r) {
		let t = e.dimension & 15;
		t && (J(Y[e.format] !== void 0, `vertex format ${e.format}`), a[e.stream] = Math.max(a[e.stream] ?? 0, e.offset + t * Y[e.format]));
	}
	let o = [], s = 0;
	for (let e = 0; e < a.length; e++) o[e] = s, s += (a[e] ?? 0) * n, s = Math.ceil(s / 16) * 16;
	J(i.length >= s - 15, `vertex data ${i.length} bytes, layout needs ${s}`);
	let c = new DataView(i.buffer, i.byteOffset, i.byteLength);
	return {
		vertexCount: n,
		channel(e) {
			let t = r[e], s = t ? t.dimension & 15 : 0;
			if (!t || !s) return null;
			let l = Y[t.format], u = a[t.stream], d = o[t.stream] + t.offset;
			J(d + u * (n - 1) + s * l <= i.length, `channel ${e} exceeds vertex data`);
			let f = t.format >= 6 ? new Uint32Array(n * s) : new Float32Array(n * s);
			for (let e = 0; e < n; e++) for (let n = 0; n < s; n++) {
				let r = d + e * u + n * l, i;
				switch (t.format) {
					case 0:
						i = c.getFloat32(r, !0);
						break;
					case 1:
						i = me(c.getUint16(r, !0));
						break;
					case 2:
						i = c.getUint8(r) / 255;
						break;
					case 3:
						i = Math.max(c.getInt8(r) / 127, -1);
						break;
					case 4:
						i = c.getUint16(r, !0) / 65535;
						break;
					case 5:
						i = Math.max(c.getInt16(r, !0) / 32767, -1);
						break;
					case 6:
						i = c.getUint8(r);
						break;
					case 7:
						i = c.getInt8(r);
						break;
					case 8:
						i = c.getUint16(r, !0);
						break;
					case 9:
						i = c.getInt16(r, !0);
						break;
					case 10:
						i = c.getUint32(r, !0);
						break;
					default:
						i = c.getInt32(r, !0);
						break;
				}
				f[e * s + n] = i;
			}
			return {
				dimension: s,
				values: f
			};
		}
	};
}
function ge(e, t, n) {
	let r = (t, n) => e[`e${t}${n}`], i = (e, t) => e === 0 == (t === 0) ? 1 : -1;
	for (let e = 0; e < 4; e++) for (let a = 0; a < 4; a++) t[n + e * 4 + a] = i(a, e) * r(a, e);
}
function _e(e, t) {
	J(e.m_MeshCompression === 0, `${e.m_Name}: compressed meshes are not supported`), J(e.m_VariableBoneCountWeights.m_Data.length === 0, `${e.m_Name}: variable bone count weights`);
	let n = e.m_StreamData.path ? t(e.m_StreamData.path, Number(e.m_StreamData.offset), e.m_StreamData.size) : null, r = he(e.m_VertexData, n), i = r.vertexCount, a = (e, t = !1) => {
		if (!e) return null;
		let n = e.dimension, r = new Float32Array(i * (t ? 4 : 3));
		for (let a = 0; a < i; a++) r[a * (t ? 4 : 3)] = -e.values[a * n], r[a * (t ? 4 : 3) + 1] = e.values[a * n + 1], r[a * (t ? 4 : 3) + 2] = e.values[a * n + 2], t && (r[a * 4 + 3] = -e.values[a * n + 3]);
		return r;
	}, o = r.channel(0);
	J(o && o.dimension >= 3, `${e.m_Name}: no position channel`);
	let s = a(o), c = a(r.channel(1)), l = r.channel(2), u = l && l.dimension === 4 ? a(l, !0) : null, d = r.channel(3), f = null;
	if (d) {
		f = new Float32Array(i * 4);
		for (let e = 0; e < i; e++) for (let t = 0; t < 4; t++) f[e * 4 + t] = t < d.dimension ? d.values[e * d.dimension + t] : 1;
	}
	let p = [
		4,
		5,
		6
	].map((e) => {
		let t = r.channel(e);
		if (!t) return null;
		let n = new Float32Array(i * 2);
		for (let e = 0; e < i; e++) n[e * 2] = t.values[e * t.dimension], n[e * 2 + 1] = t.dimension > 1 ? t.values[e * t.dimension + 1] : 0;
		return n;
	}), m = r.channel(13), h = r.channel(12), g = null, _ = null;
	if (m) {
		g = new Uint16Array(i * 4), _ = new Float32Array(i * 4);
		let t = m.dimension, n = h?.dimension ?? 0;
		J(!h || n === t || t === 1 && !h, `${e.m_Name}: bone index / weight dimensions ${t} / ${n}`);
		for (let e = 0; e < i; e++) for (let r = 0; r < t; r++) g[e * 4 + r] = m.values[e * t + r], _[e * 4 + r] = h ? h.values[e * n + r] : 1;
	}
	let v = e.m_IndexFormat === 0 ? 2 : 4, y = e.m_IndexBuffer, b = new DataView(y.buffer, y.byteOffset, y.byteLength), x = [], S = 0;
	for (let t of e.m_SubMeshes) {
		J(t.topology === 0, `${e.m_Name}: sub-mesh topology ${t.topology} (only triangles)`), J(t.indexCount % 3 == 0, `${e.m_Name}: index count ${t.indexCount}`);
		let n = new Uint32Array(t.indexCount), r = t.firstByte;
		J(r + t.indexCount * v <= y.length, `${e.m_Name}: sub-mesh exceeds index buffer`);
		let a = (e) => (v === 2 ? b.getUint16(r + e * 2, !0) : b.getUint32(r + e * 4, !0)) + t.baseVertex;
		for (let e = 0; e < t.indexCount; e += 3) n[e] = a(e + 2), n[e + 1] = a(e + 1), n[e + 2] = a(e);
		for (let t of n) J(t < i, `${e.m_Name}: vertex index ${t} out of range`);
		x.push({
			start: S,
			count: n.length,
			indices: n
		}), S += n.length;
	}
	let C = new Float32Array(e.m_BindPose.length * 16);
	e.m_BindPose.forEach((e, t) => ge(e, C, t * 16));
	let w = e.m_Shapes, T = w.channels.map((t) => {
		J(t.frameCount === 1, `${e.m_Name}: blend shape ${t.name} has ${t.frameCount} frames`), J(w.fullWeights[t.frameIndex] === 100, `${e.m_Name}: blend shape ${t.name} full weight ${w.fullWeights[t.frameIndex]}`);
		let n = w.shapes[t.frameIndex], r = n.vertexCount, a = new Uint32Array(r), o = new Float32Array(r * 3), s = n.hasNormals ? new Float32Array(r * 3) : null, c = n.hasTangents ? new Float32Array(r * 3) : null;
		for (let l = 0; l < r; l++) {
			let r = w.vertices[n.firstVertex + l];
			J(r.index < i, `${e.m_Name}: blend shape vertex ${r.index}`), J(l === 0 || r.index > a[l - 1], `${e.m_Name}: blend shape ${t.name} vertices not ascending`), a[l] = r.index, o[l * 3] = -r.vertex.x, o[l * 3 + 1] = r.vertex.y, o[l * 3 + 2] = r.vertex.z, s && (s[l * 3] = -r.normal.x, s[l * 3 + 1] = r.normal.y, s[l * 3 + 2] = r.normal.z), c && (c[l * 3] = -r.tangent.x, c[l * 3 + 1] = r.tangent.y, c[l * 3 + 2] = r.tangent.z);
		}
		return {
			name: t.name,
			indices: a,
			positionDeltas: o,
			normalDeltas: s,
			tangentDeltas: c
		};
	});
	return {
		name: e.m_Name,
		vertexCount: i,
		positions: s,
		normals: c,
		tangents: u,
		colors: f,
		uv: p,
		skinIndices: g,
		skinWeights: _,
		submeshes: x,
		bindPoses: C,
		morphs: T
	};
}
//#endregion
//#region src/original/partBuilder.ts
function X(e, t) {
	if (!e) throw Error(t);
}
var ve = (e, t) => `original:${e}:${t}`, ye = (() => {
	let e = /* @__PURE__ */ new Uint32Array(256);
	for (let t = 0; t < 256; t++) {
		let n = t;
		for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
		e[t] = n >>> 0;
	}
	return e;
})();
function Z(e) {
	let t = new TextEncoder().encode(e), n = 4294967295;
	for (let e of t) n = ye[(n ^ e) & 255] ^ n >>> 8;
	return (n ^ 4294967295) >>> 0;
}
function be(t, n, r) {
	if (n.m_PathID === 0n) return null;
	let i = n.m_FileID === 0 ? t : (() => {
		let e = t.externalCab(n.m_FileID);
		return e ? r(e) : null;
	})();
	X(i, `${t.name}: texture ${n.m_FileID}:${n.m_PathID} is in a bundle that is not loaded`);
	let a = i.object(n.m_PathID);
	return X(a && a.classId === e.Texture2D, `${i.name}: ${n.m_PathID} is not a Texture2D`), {
		bundle: i,
		object: a
	};
}
function Q(e, t, n, r) {
	let i = r?.object.read();
	return {
		name: e,
		textureName: i?.m_Name ?? null,
		textureFileId: t.m_FileID,
		texturePathId: Number(t.m_PathID),
		textureKey: t.m_PathID === 0n ? null : `ref:${t.m_FileID}:${t.m_PathID}`,
		scaleX: n.m_Scale.x,
		scaleY: n.m_Scale.y,
		offsetX: n.m_Offset.x,
		offsetY: n.m_Offset.y,
		colorSpace: i?.m_ColorSpace ?? 0,
		uri: r ? ve(r.bundle.cabName, r.object.pathId) : null,
		sourceWidth: i?.m_Width ?? 0,
		sourceHeight: i?.m_Height ?? 0,
		sourceMipCount: i?.m_MipCount ?? 0,
		sourceFormat: i?.m_TextureFormat ?? 0,
		filterMode: i?.m_TextureSettings.m_FilterMode ?? 0,
		anisoLevel: i?.m_TextureSettings.m_Aniso ?? 0,
		mipBias: i?.m_TextureSettings.m_MipBias ?? 0,
		wrapU: i?.m_TextureSettings.m_WrapU ?? 0,
		wrapV: i?.m_TextureSettings.m_WrapV ?? 0,
		wrapW: i?.m_TextureSettings.m_WrapW ?? 0
	};
}
function xe(e, t, n) {
	let r = t.m_SavedProperties;
	return {
		shaderFileId: t.m_Shader.m_FileID,
		shaderPathId: Number(t.m_Shader.m_PathID),
		shaderKey: `ref:${t.m_Shader.m_FileID}:${t.m_Shader.m_PathID}`,
		textureProperties: r.m_TexEnvs.map((t) => Q(t.first, t.second.m_Texture, t.second, be(e, t.second.m_Texture, n))),
		colorProperties: r.m_Colors.map((e) => ({
			name: e.first,
			...e.second
		})),
		floatProperties: r.m_Floats.map((e) => ({
			name: e.first,
			value: e.second
		})),
		intProperties: r.m_Ints.map((e) => ({
			name: e.first,
			value: e.second
		})),
		validKeywords: [...t.m_ValidKeywords],
		invalidKeywords: [...t.m_InvalidKeywords],
		lightmapFlags: t.m_LightmapFlags,
		enableInstancingVariants: t.m_EnableInstancingVariants,
		doubleSidedGi: t.m_DoubleSidedGI,
		customRenderQueue: t.m_CustomRenderQueue,
		stringTags: Object.fromEntries(t.stringTagMap.map((e) => [e.first, e.second])),
		disabledShaderPasses: [...t.disabledShaderPasses]
	};
}
function Se(e, t, n) {
	let r = t.toLowerCase();
	return e === "body" ? r.includes("skin") ? "skin" : "body" : e === "head_optional" ? "accessory" : r.includes("eyelash") ? "eyelash" : r.includes("eyebrow") ? "eyebrow" : r.includes("eye_highlight") || r.includes("_ehl_") ? "eyelight" : r.includes("_eye") ? "eye" : r.includes("_hair_") ? "hair" : r.includes("_acc_") ? "accessory" : n ? "face_sdf" : "face";
}
function $(t, n) {
	let r = t.assetBundle.m_Container.filter((r) => {
		let i = r.first.split("/").pop().replace(/\.[^.]+$/, "");
		return t.local(r.second.asset)?.classId === e.Texture2D && i.toLowerCase() === n.toLowerCase();
	});
	return X(r.length === 1, `${t.name}: ${r.length} textures named ${n}`), t.local(r[0].second.asset);
}
var Ce = {
	body: "body",
	head: "face",
	hair: "face",
	head_optional: "optional"
};
function we(t) {
	let { entry: n, partType: r, bundle: i } = t, a = Ce[r], o = i.resource(a, `/${i.name}/${a}.prefab`), s = r === "body" ? "Body" : "Head", c = P(i, o.objects, s, i.name), l = de(r, c), u = r === "body" ? "Body" : r === "head_optional" ? "Accessory" : "Head", d = c.prefabGraph, f = new Map(d.transforms.map((e) => [e.pathId, e.transformPath])), p = [], m = [], h = [], g = [], _ = /* @__PURE__ */ new Set();
	for (let n of d.renderers) {
		if (!n.enabled) continue;
		let a = o.objects.find((e) => Number(e.pathId) === n.pathId), s = a.read(), c = null;
		if (a.classId === e.SkinnedMeshRenderer) c = s.m_Mesh ?? null;
		else {
			let t = i.read(s.m_GameObject).m_Component.map((e) => i.local(e.component)).find((t) => t?.classId === e.MeshFilter);
			c = t ? t.read().m_Mesh : null;
		}
		let l = i.local(c);
		if (!l) {
			p.push(`${u} renderer '${n.transformPath}' has no mesh.`);
			continue;
		}
		let d = _e(l.read(), (e, t, n) => i.stream(e, t, n)), v = d.bindPoses.length / 16, y = s.m_Bones ?? [];
		X(y.length === 0 || y.length >= v, `${n.transformPath}: ${y.length} bones for ${v} bind poses`);
		let b = y.slice(0, v);
		if (d.skinIndices && d.skinWeights) for (let e = 0; e < d.skinIndices.length; e++) X(d.skinWeights[e] === 0 || d.skinIndices[e] < b.length, `${n.transformPath}: vertex bone index ${d.skinIndices[e]} >= ${b.length}`);
		let x = b.map((e) => {
			let t = f.get(Number(e.m_PathID));
			return X(t, `${n.transformPath}: bone ${e.m_PathID} is not in the prefab`), t;
		});
		X(d.submeshes.length <= s.m_Materials.length, `${n.transformPath}: ${d.submeshes.length} sub-meshes, ${s.m_Materials.length} materials`);
		let S = n.transformPath.split("/").pop(), C = n.rootBonePathId === void 0 ? null : f.get(n.rootBonePathId) ?? null, w = d.submeshes.map((e, a) => {
			let o = s.m_Materials[a];
			X(o.m_PathID !== 0n && o.m_FileID === 0, `${n.transformPath}: material slot ${a} is empty or external`);
			let c = i.local(o).read(), l = `${o.m_FileID}:${o.m_PathID}`, u = `${S}::${a}::${l}`;
			if (!_.has(u)) {
				_.add(u);
				let e = xe(i, c, t.resolveBundle), s = e.textureProperties.some((e) => e.name === "_FaceShadowTex" && e.texturePathId !== 0);
				h.push({
					part: r,
					meshName: S,
					slotIndex: a,
					materialKey: l,
					materialFileId: o.m_FileID,
					materialPathId: Number(o.m_PathID),
					materialName: c.m_Name,
					materialKind: Se(r, c.m_Name, s),
					isAccessory: r === "head_optional",
					rawMaterial: e,
					rendererPathId: n.pathId
				});
			}
			return {
				slotIndex: a,
				materialKey: l,
				materialFileId: o.m_FileID,
				materialPathId: Number(o.m_PathID),
				materialName: c.m_Name,
				start: e.start,
				count: e.count,
				indices: e.indices
			};
		}), T = d.vertexCount;
		if (m.push({
			partKind: u,
			meshPath: n.transformPath,
			meshName: S,
			rendererPathId: n.pathId,
			rendererTransformPathId: n.transformPathId,
			rendererTransformPath: n.transformPath,
			rootBonePathId: n.rootBonePathId ?? null,
			rootBonePath: C,
			bonePathIds: b.map((e) => Number(e.m_PathID)),
			bonePaths: x,
			boneInverseBindMatrices: b.length ? d.bindPoses : /* @__PURE__ */ new Float32Array(),
			submeshes: w,
			positions: d.positions,
			normals: d.normals ?? new Float32Array(T * 3).map((e, t) => +(t % 3 == 1)),
			tangents: d.tangents ?? /* @__PURE__ */ new Float32Array(),
			uv0: d.uv[0] ?? new Float32Array(T * 2),
			uv1: d.uv[1] ?? /* @__PURE__ */ new Float32Array(),
			uv2: d.uv[2] ?? /* @__PURE__ */ new Float32Array(),
			...d.colors ? { colors: d.colors } : {},
			...b.length && d.skinIndices ? {
				skinIndices: d.skinIndices,
				skinWeights: d.skinWeights
			} : {},
			morphTargets: d.morphs.map((e) => ({
				name: e.name,
				indices: e.indices,
				hasPositionDeltas: !0,
				positionDeltas: e.positionDeltas,
				hasNormalDeltas: e.normalDeltas !== null,
				normalDeltas: e.normalDeltas ?? /* @__PURE__ */ new Float32Array(),
				hasTangentDeltas: e.tangentDeltas !== null,
				tangentDeltas: e.tangentDeltas ?? /* @__PURE__ */ new Float32Array()
			}))
		}), (r === "head" || r === "hair") && /(^|\/)Face$/i.test(n.transformPath)) for (let e of d.morphs) g.some((t) => t.name.toLowerCase() === e.name.toLowerCase()) || g.push({
			name: e.name,
			sourceName: e.name,
			nameHash: Z(e.name),
			curveHash: Z(`blendShape.${e.name}`)
		});
	}
	if (X(m.length > 0 || r === "head_optional", `${i.name}: ${a} has no renderers`), t.colorBundle && (r === "body" || r === "head_optional")) {
		let e = r === "body" ? "tex_body" : "tex_acc", n = r === "body" ? d.renderers.find((e) => e.typeName === "SkinnedMeshRenderer") : d.renderers.find((e) => e.typeName === "MeshRenderer");
		X(n, `${i.name}: no renderer for the color variation`);
		let a = h.find((e) => e.rendererPathId === n.pathId && e.slotIndex === 0);
		X(a, `${i.name}: renderer ${n.transformPath} has no material`);
		let o = t.colorBundle, s = {
			_MainTex: $(o, `${e}_C`),
			_ShadowTex: $(o, `${e}_S`),
			_ValueTex: $(o, `${e}_H`)
		}, c = a.rawMaterial;
		c.textureProperties = c.textureProperties.map((e) => {
			let t = s[e.name];
			if (!t) return e;
			let n = {
				m_FileID: 0,
				m_PathID: t.pathId
			};
			return {
				...Q(e.name, n, {
					m_Scale: {
						x: e.scaleX,
						y: e.scaleY
					},
					m_Offset: {
						x: e.offsetX,
						y: e.offsetY
					}
				}, {
					bundle: o,
					object: t
				}),
				textureKey: `ref:color:${t.pathId}`
			};
		});
	}
	for (let e of h) delete e.rendererPathId;
	let v = String(n.characterId).padStart(2, "0"), y = o.root.read().m_Name, b = r === "body" ? {
		bodyColor: "#f2d0c3",
		shadowColor: "#f2d0c3",
		bodyScale: 1,
		torsoLength: 2.2,
		shoulderWidth: 1.1
	} : {
		faceColor: "#fde2d9",
		faceShadeColor: "#fde2d9",
		skinColorDefault: "#fde2d9",
		skinColor1: "#fde2d9",
		skinColor2: "#fde2d9",
		hairColor: "#7b5b4a",
		hairShadowColor: "#513d33",
		headRadius: .74,
		faceDepth: .82,
		hairArc: .98
	}, x = r === "head_optional" && c.accessoryTransformAdjustments.length ? Object.fromEntries(c.accessoryTransformAdjustments.map((e) => [e.faceId, {
		position: e.position,
		rotationEulerDegrees: e.rotationEulerDegrees,
		scale: e.scale
	}])) : null;
	return {
		version: "original-1",
		packagePath: n.packagePath,
		part: {
			costume3dId: n.costume3dId,
			partType: r,
			characterId: n.characterId,
			unit: n.unit ?? null,
			name: n.name ?? null,
			colorId: n.colorId ?? null,
			colorName: n.colorName ?? null,
			costume3dGroupId: n.costume3dGroupId ?? null,
			modelAssetbundleName: n.modelAssetbundleName ?? null,
			headCostume3dAssetbundleType: n.headCostume3dAssetbundleType ?? null
		},
		source: {
			bundlePath: i.name,
			colorVariationBundlePath: t.colorBundle?.name ?? null,
			logicalBundleName: i.name,
			dependencyBundleNames: [...i.assetBundle.m_Dependencies],
			colorVariationLogicalBundleName: t.colorBundle?.name ?? null,
			unityResourceName: y,
			unityObjectType: "GameObject"
		},
		mount: {
			mountKind: r === "body" ? "character_root" : r === "head_optional" ? "attach_node" : "head_origin",
			rootNodeName: y,
			attachNode: t.attachNode ?? null,
			expectedSkeletonId: v,
			...x ? { accessoryTransformAdjustments: x } : {}
		},
		manifest: {
			id: `${r}-${v}-${n.costume3dId}-${n.unit ?? "default"}`,
			displayName: n.name,
			characterId: v,
			characterHeightMeters: t.characterHeightMeters,
			materialPipeline: "embedded",
			source: {
				bundleRoot: i.name,
				meshUrl: "original",
				manifestUrl: "original"
			},
			rootNodeName: y,
			attachNode: t.attachNode ?? null,
			proxy: b
		},
		nativeMeshes: {
			version: "0414",
			coordinateSpace: "assetstudio-modelconverter-viewer-space",
			meshes: m,
			warnings: p
		},
		materialSlots: h,
		springBone: l,
		characterControllers: pe(c),
		morphChannelBindings: g,
		warnings: [...l.warnings, ...p]
	};
}
//#endregion
export { a, s as c, i, Z as n, o, r, c as s, we as t };
