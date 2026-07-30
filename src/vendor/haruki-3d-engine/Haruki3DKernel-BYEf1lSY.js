import * as e from "three";
import { CompressedArrayTexture as t, CompressedCubeTexture as n, CompressedTexture as r, Data3DTexture as i, DataTexture as a, FileLoader as o, FloatType as s, HalfFloatType as c, LinearFilter as l, LinearMipmapLinearFilter as u, LinearSRGBColorSpace as d, Loader as f, NoColorSpace as p, RGBAFormat as m, RGBA_ASTC_4x4_Format as h, RGBA_ASTC_6x6_Format as g, RGBA_BPTC_Format as _, RGBA_ETC2_EAC_Format as v, RGBA_PVRTC_4BPPV1_Format as y, RGBA_S3TC_DXT1_Format as b, RGBA_S3TC_DXT3_Format as ee, RGBA_S3TC_DXT5_Format as te, RGB_BPTC_UNSIGNED_Format as ne, RGB_ETC1_Format as re, RGB_ETC2_Format as ie, RGB_PVRTC_4BPPV1_Format as ae, RGB_S3TC_DXT1_Format as oe, RGFormat as se, RedFormat as ce, SRGBColorSpace as le, UnsignedByteType as x } from "three";
//#region src/data/sampleScene.ts
var ue = {
	x: -15,
	y: 50,
	z: 0
}, de = {
	x: -.7127446532249451,
	y: .258819043636322,
	z: .6519262194633484
}, S = {
	x: .833125114440918,
	y: -.3420201539993286,
	z: .43465474247932434
}, C = {
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
}, fe = de, pe = {
	x: fe.x,
	y: fe.y,
	z: fe.z,
	intensity: 1,
	ambient: 0,
	shadowThreshold: .40625,
	shadowWeight: 1,
	characterAmbient: C.ambientIntensity,
	rimColorAlpha: C.rimColorAlpha,
	rimRange: C.rimRange,
	rimEdgeSmoothness: C.rimEdgeSmoothness,
	rimEmission: C.rimEmission,
	rimLightInfluence: C.rimLightInfluence,
	rimShadowSharpness: C.rimShadowSharpness,
	characterHeight: 1
};
C.ambientIntensity, C.rimColorAlpha, C.rimRange, C.rimEdgeSmoothness, C.rimEmission, C.rimLightInfluence, C.rimShadowSharpness;
//#endregion
//#region part-runtime-core.mjs
function me(e, t) {
	let { corePath: n, warnings: r, ...i } = e;
	return {
		...t,
		...i,
		warnings: [...t.warnings ?? [], ...r ?? []]
	};
}
//#endregion
//#region src/parts/runtimePartComposer.ts
var he = /* @__PURE__ */ new WeakMap();
function ge(e) {
	let t = e.toLowerCase();
	if (t === "head_optional" || t === "accessory") return "head_optional";
	if (t === "body" || t === "head" || t === "hair") return t;
	throw Error(`Unsupported runtime part type: ${e}`);
}
function w(e) {
	let t = ge(e.partType);
	return (t === "head" || t === "head_optional") && _e(e.headCostume3dAssetbundleType) ? "head" : t === "head" && ve(e.headCostume3dAssetbundleType) ? "head_optional" : t;
}
function T(e) {
	try {
		return w(e);
	} catch {
		return null;
	}
}
function _e(e) {
	return (e ?? "").trim().toLowerCase() === "head_and_hair";
}
function ve(e) {
	let t = (e ?? "").trim().toLowerCase();
	return t === "head_only" || t === "head_all" || t === "head_front" || t === "head_back";
}
function E(e, t) {
	return `${e}:${We(t)}`;
}
function ye(e) {
	let t = e.roles.find((t) => Ee(e, t.characterId, t.unit ?? null, "body", t.bodyCostume3dId) && De(e, t.characterId, t.unit ?? null, t.headCostume3dId) && Ee(e, t.characterId, t.unit ?? null, "hair", t.hairCostume3dId));
	if (t) {
		let n = t.bodyCostume3dId, r = t.headCostume3dId, i = t.hairCostume3dId;
		return {
			characterId: t.characterId,
			unit: t.unit ?? null,
			bodyCostume3dId: n,
			headCostume3dId: r,
			headPackagePath: Le(e, t.characterId, t.unit ?? null, r),
			hairCostume3dId: i,
			headOptionalCostume3dId: null
		};
	}
	let n = we(e, "body");
	if (!n) return null;
	let r = Te(e, n.characterId, n.unit ?? null);
	if (!r) return null;
	let { head: i, hair: a } = r;
	return {
		characterId: n.characterId,
		unit: n.unit ?? i.unit ?? a.unit ?? null,
		bodyCostume3dId: n.costume3dId,
		headCostume3dId: i.costume3dId,
		headPackagePath: i.packagePath,
		hairCostume3dId: a.costume3dId,
		headOptionalCostume3dId: null
	};
}
function be(e, t, n, r = {}) {
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || Ge(e.unit, r.unit)).filter((e) => T(e) === n).filter(Re).filter((t) => !r.loadedOnly || ze(t) || e.packages.has(t.packagePath)).sort((e, t) => e.costume3dId - t.costume3dId);
}
function xe(e) {
	let { partSet: t, selection: n, activeRoleId: r, resolveUrl: i } = e, a = E(n.characterId, n.unit), o = n.bodyCharacterId ?? n.characterId, s = n.bodyUnit === void 0 ? n.unit : n.bodyUnit, c = E(o, s);
	if (r !== null && a !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${a}.`);
	let l = Oe(t, o, s, "body", n.bodyCostume3dId), u = Oe(t, n.characterId, n.unit, "hair", n.hairCostume3dId), d = ke(t, n), f = {
		...n,
		headPackagePath: d.packagePath
	}, p = Ae(t, f, d), m = p && w(p.part) === "head" ? p : u, h = w(d) === "head" ? Ce(t, n) : null, g = h ? t.packages.get(h.packagePath) ?? null : null, _ = p && w(p.part) === "head_optional" ? p : null, v = je(t, n);
	Fe(l, "body"), m && Fe(m, "head"), Be(o, s, [l]), Be(n.characterId, n.unit, [
		m,
		_,
		v
	].filter(Boolean)), Ve(t.compatibility, f, w(d));
	let y = [
		l,
		m,
		_,
		v
	].filter(Boolean), b = Qe(d), ee = $e(y, b), te = t.roleRuntimes.get(a) ?? null, ne = t.roles.find((e) => E(e.characterId, e.unit) === a), re = Se(t, t.roles.find((e) => E(e.characterId, e.unit) === c), l), ie = Ke(l, i);
	ie.characterHeightMeters = re, qe(ie, te);
	let ae = Je($e([
		m,
		_,
		v
	].filter(Boolean), b), f, i, g);
	ae.characterHeightMeters = re;
	let oe = tt(ee, ie, ae, te);
	return {
		id: `custom-${[
			t.baseUrl,
			t.masterVersion ?? "unknown-master",
			a,
			`body-role:${c}`,
			`requested:${n.bodyCostume3dId}:${n.headCostume3dId}:${n.hairCostume3dId}:${n.headOptionalCostume3dId ?? "none"}`,
			`body:${l.packagePath ?? "unknown"}`,
			`head:${d.packagePath}`,
			`hair:${u.packagePath ?? "unknown"}`,
			`accessory:${v?.packagePath ?? _?.packagePath ?? "none"}`,
			`motion:${te?.motionPackage?.sourcePath ?? "none"}`
		].map(encodeURIComponent).join("-")}`,
		displayName: `Custom ${a}`,
		meshUrl: "",
		unityRuntimeJsonUrl: `haruki-composed://role-${a}/unity-runtime.msgpack.br`,
		unityRuntimeJsonPath: "viewer-composed-part-runtime",
		bodyAsset: ie,
		headAsset: ae,
		skinColors: ne?.skinColors,
		runtimeExtension: oe
	};
}
function Se(e, t, n) {
	if (!t) {
		let e = (k(n.manifest) ? n.manifest : null)?.characterHeightMeters;
		if (typeof e == "number" && Number.isFinite(e) && e > 0) return e;
		throw Error("Runtime role catalog entry is missing.");
	}
	if (typeof t.characterHeightMeters == "number" && Number.isFinite(t.characterHeightMeters) && t.characterHeightMeters > 0) return t.characterHeightMeters;
	let r = Ie(e, t.characterId, t.unit, "body", t.bodyCostume3dId), i = r ? e.packages.get(r.packagePath) : null, a = (k(i?.manifest) ? i.manifest : null)?.characterHeightMeters;
	if (typeof a == "number" && Number.isFinite(a) && a > 0) return a;
	throw Error(`Runtime role ${E(t.characterId, t.unit)} is missing master characterHeightMeters.`);
}
function Ce(e, t) {
	let n = e.roles.find((e) => e.characterId === t.characterId && Ge(e.unit, t.unit));
	return n ? e.registry.find((e) => e.characterId === n.characterId && Ge(e.unit, n.unit) && e.costume3dId === n.hairCostume3dId && T(e) === "hair" && Re(e)) ?? null : null;
}
function we(e, t, n, r) {
	return e.registry.find((i) => T(i) === t && (n === void 0 || i.characterId === n) && (r === void 0 || Ge(i.unit, r)) && i.status !== "missing" && e.packages.has(i.packagePath));
}
function Te(e, t, n) {
	let r = [...be(e, t, "head", {
		unit: n,
		loadedOnly: !1
	}), ...be(e, t, "head_optional", {
		unit: n,
		loadedOnly: !1
	})], i = [...be(e, t, "head", {
		unit: n,
		loadedOnly: !0
	}), ...be(e, t, "head_optional", {
		unit: n,
		loadedOnly: !0
	}).filter((e) => !ze(e))], a = /* @__PURE__ */ new Map();
	for (let e of r) {
		let t = a.get(e.costume3dId) ?? /* @__PURE__ */ new Set();
		t.add(`${w(e)}|${e.packagePath}`), a.set(e.costume3dId, t);
	}
	let o = i.filter((e) => a.get(e.costume3dId)?.size === 1).sort((e, t) => e.costume3dId - t.costume3dId || e.packagePath.localeCompare(t.packagePath)), s = be(e, t, "hair", {
		unit: n,
		loadedOnly: !0
	});
	for (let r of o) for (let i of s) {
		let a = {
			characterId: t,
			unit: n,
			bodyCostume3dId: 0,
			headCostume3dId: r.costume3dId,
			hairCostume3dId: i.costume3dId,
			headOptionalCostume3dId: null
		};
		try {
			return Ve(e.compatibility, a, w(r)), {
				head: r,
				hair: i
			};
		} catch {}
	}
	return null;
}
function Ee(e, t, n, r, i) {
	let a = Ie(e, t, n, r, i);
	return !!(a && (ze(a) || e.packages.has(a.packagePath)));
}
function De(e, t, n, r) {
	return Ee(e, t, n, "head", r) || Ee(e, t, n, "head_optional", r);
}
function Oe(e, t, n, r, i) {
	let a = Ie(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${E(t, n)}, costume3dId ${i}.`);
	if (!e.packages.has(a.packagePath)) throw Error(`Missing loaded ${r} package for role ${E(t, n)}, ${Ne(a)}.`);
	return Pe(e.packages.get(a.packagePath), a);
}
function ke(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && Ge(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(T(e) ?? "") && Re(e) && (n === null || e.packagePath === n)).sort((e, t) => {
		let n = e.packagePath.localeCompare(t.packagePath);
		return n === 0 ? w(e).localeCompare(w(t)) : n;
	});
	if (r.length === 0) {
		let e = n ? `, packagePath ${n}` : "";
		throw Error(`Missing head registry entry for role ${E(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}${e}.`);
	}
	if (new Set(r.map((e) => `${w(e)}|${e.packagePath}`)).size > 1) {
		let e = r.map((e) => `${w(e)}:${e.packagePath}`).join(", ");
		throw Error(`Ambiguous head registry entry for role ${E(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}; specify headPackagePath. Candidates: ${e}.`);
	}
	return r[0];
}
function Ae(e, t, n = ke(e, t)) {
	if (ze(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${E(t.characterId, t.unit)}, ${Ne(n)}.`);
	return Pe(e.packages.get(n.packagePath), n);
}
function je(e, t) {
	let n = Me(e, t);
	if (!n || ze(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${E(t.characterId, t.unit)}, ${Ne(n)}.`);
	return Pe(e.packages.get(n.packagePath), n);
}
function Me(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && Ge(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && T(e) === "head_optional" && Re(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${E(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${E(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function Ne(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${w(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function Pe(e, t) {
	let n = T(t) ?? e.part.partType, r = k(e.manifest) ? ln(e.manifest) : e.manifest;
	if (k(r) && (r.id = `${n}-${t.characterId}-${t.costume3dId}-${t.unit ?? "default"}`, r.displayName = t.name ?? D(r.displayName) ?? r.id, r.characterId = String(t.characterId).padStart(2, "0"), typeof r.characterHeightMeters != "number" || r.characterHeightMeters <= 0)) throw Error(`Part runtime ${t.packagePath} is missing characterHeightMeters.`);
	return {
		...e,
		packagePath: t.packagePath,
		part: {
			...e.part,
			costume3dId: t.costume3dId,
			partType: n,
			characterId: t.characterId,
			unit: t.unit,
			name: t.name ?? e.part.name,
			colorId: typeof t.colorId == "number" ? t.colorId : e.part.colorId,
			colorName: t.colorName ?? e.part.colorName,
			costume3dGroupId: typeof t.costume3dGroupId == "number" ? t.costume3dGroupId : e.part.costume3dGroupId,
			modelAssetbundleName: t.modelAssetbundleName ?? e.part.modelAssetbundleName,
			headCostume3dAssetbundleType: t.headCostume3dAssetbundleType ?? e.part.headCostume3dAssetbundleType
		},
		manifest: r,
		mount: {
			...e.mount ?? {},
			packagePath: t.packagePath,
			expectedSkeletonId: String(t.characterId).padStart(2, "0")
		}
	};
}
function Fe(e, t) {
	let n = k(e.manifest) ? e.manifest : {};
	if (!k(n.proxy ?? n.Proxy)) throw Error(`Part runtime package '${e.packagePath ?? e.part.costume3dId}' is missing manifest.proxy material metadata for ${t}; regenerate it with a current Haruki-3D-Exporter before capture.`);
}
function Ie(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && Ge(e.unit, n) && e.costume3dId === i && T(e) === r && Re(e));
}
function Le(e, t, n, r) {
	let i = new Set(e.registry.filter((e) => e.characterId === t && Ge(e.unit, n) && e.costume3dId === r && ["head", "head_optional"].includes(T(e) ?? "") && Re(e)).map((e) => e.packagePath));
	return i.size === 1 ? [...i][0] : null;
}
function Re(e) {
	return e.status !== "missing";
}
function ze(e) {
	return e.status === "empty" && T(e) === "head_optional";
}
function Be(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !Ge(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${E(r.part.characterId, r.part.unit)}, not ${E(e, t)}.`);
}
function Ve(e, t, n) {
	if (!e || n === "head") return;
	let r = Ue(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (He(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function He(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = he.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => Ue(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return he.set(e, n), n;
}
function Ue(e, t, n) {
	return `${We(e)}|${t}|${n}`;
}
function We(e) {
	return e ?? "";
}
function Ge(e, t) {
	return We(e) === We(t);
}
function Ke(e, t) {
	let n = ln(e.manifest);
	if (n.id ||= `body-${e.part.costume3dId}`, n.displayName ||= e.part.name ?? n.id, n.characterId = String(e.part.characterId).padStart(2, "0"), typeof n.characterHeightMeters != "number" || n.characterHeightMeters <= 0) throw Error(`Body part runtime ${e.packagePath} is missing characterHeightMeters.`);
	n.materialPipeline ??= "embedded", n.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, n.neckAnchor = Ze(n.neckAnchor, {
		x: 0,
		y: 1.75,
		z: .15
	}), n.skeleton ||= {}, n.skeleton.neckAttach ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, n.skeleton.neckAttach.fallbackPosition = Ze(n.skeleton.neckAttach.fallbackPosition, {
		x: 0,
		y: 1.75,
		z: .15
	}), n.proxy ||= {}, n.proxy = {
		bodyColor: n.proxy.bodyColor ?? "#f2d0c3",
		shadowColor: n.proxy.shadowColor ?? "#bf958a",
		bodyScale: n.proxy.bodyScale ?? 1,
		torsoLength: n.proxy.torsoLength ?? 2.2,
		shoulderWidth: n.proxy.shoulderWidth ?? 1.1
	}, n.bodyMaterials ||= [];
	let r = Ye(e, t);
	return n.source = {
		...n.source,
		meshUrl: cn(n.source?.meshUrl, r),
		skeletonUrl: sn(n.source?.skeletonUrl, r),
		animationUrls: n.source?.animationUrls?.map((e) => cn(e, r))
	}, n.bodyMaterials = an(n.bodyMaterials, [e], t), n;
}
function qe(e, t) {
	let n = t?.motionPackage?.unityMotionJson;
	n && (e.source = {
		...e.source,
		animationUrls: [n]
	});
}
function Je(e, t, n, r) {
	let i = e.find((e) => w(e.part) === "head") ?? e[0], a = ln(i.manifest);
	if (a.id = `head-${t.headCostume3dId}-source-${encodeURIComponent(t.headPackagePath ?? "auto")}-hair-${t.hairCostume3dId}`, a.displayName = `Head ${t.headCostume3dId} / Hair ${t.hairCostume3dId}`, a.characterId = String(t.characterId).padStart(2, "0"), typeof a.characterHeightMeters != "number" || a.characterHeightMeters <= 0) throw Error(`Head part runtime ${i.packagePath} is missing characterHeightMeters.`);
	a.materialPipeline ??= "embedded", a.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, a.rawImportOffset = Ze(a.rawImportOffset, {
		x: 0,
		y: 0,
		z: 0
	}), a.assembly ||= {}, a.assembly.attachOrigin ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, a.assembly.attachOrigin.fallbackPosition = Ze(a.assembly.attachOrigin.fallbackPosition, {
		x: 0,
		y: 1.75,
		z: .15
	}), a.proxy ||= {}, a.proxy = {
		faceColor: a.proxy.faceColor ?? "#fde2d9",
		faceShadeColor: a.proxy.faceShadeColor ?? "#f7cdbf",
		skinColorDefault: a.proxy.skinColorDefault ?? a.proxy.faceColor ?? "#fde2d9",
		skinColor1: a.proxy.skinColor1 ?? a.proxy.faceShadeColor ?? "#f7cdbf",
		skinColor2: a.proxy.skinColor2 ?? a.proxy.faceShadeColor ?? "#f7cdbf",
		hairColor: a.proxy.hairColor ?? "#7b5b4a",
		hairShadowColor: a.proxy.hairShadowColor ?? "#513d33",
		headRadius: a.proxy.headRadius ?? .74,
		faceDepth: a.proxy.faceDepth ?? .82,
		hairArc: a.proxy.hairArc ?? .98
	}, a.faceMaterials ||= [];
	let o = Ye(i, n);
	return a.source = {
		...a.source,
		meshUrl: cn(a.source?.meshUrl, o),
		skeletonUrl: sn(a.source?.skeletonUrl, o),
		animationUrls: a.source?.animationUrls?.map((e) => cn(e, o))
	}, a.faceMaterials = rn(an(a.faceMaterials, e, n), r, n), a.morphChannelBindings = e.flatMap((e) => Array.isArray(e.morphChannelBindings) ? e.morphChannelBindings : []), a;
}
function Ye(e, t) {
	let n = D(e.packagePath) || D(e.mount?.packagePath) || "";
	return (e) => t(Xe(n, e));
}
function Xe(e, t) {
	if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith("/")) return t;
	let n = e.replace(/\/+$/, "");
	return !n || t.startsWith(`${n}/`) ? t : `${n}/${t.replace(/^\/+/, "")}`;
}
function Ze(e, t) {
	return {
		x: typeof e?.x == "number" ? e.x : t.x,
		y: typeof e?.y == "number" ? e.y : t.y,
		z: typeof e?.z == "number" ? e.z : t.z
	};
}
function Qe(e) {
	return w(e) === "head_optional" ? {
		kind: "resolved_head_optional_source",
		activePartTypes: /* @__PURE__ */ new Set([
			"body",
			"hair",
			"head_optional"
		])
	} : {
		kind: "resolved_complete_head_source",
		activePartTypes: /* @__PURE__ */ new Set([
			"body",
			"head",
			"head_optional"
		])
	};
}
function $e(e, t) {
	return e.filter((e) => et(e, t));
}
function et(e, t) {
	return t.activePartTypes.has(w(e.part));
}
function D(e) {
	return typeof e == "string" ? e : "";
}
function tt(e, t, n, r) {
	let i = rt(e);
	return {
		version: "0414",
		sourceKind: "viewer_composed_part_runtime_package",
		bodyAsset: t,
		headAsset: n,
		bodyManifest: t,
		headManifest: n,
		materialSlots: {
			body: t.bodyMaterials,
			head: n.faceMaterials,
			accessory: []
		},
		textureRoles: e.flatMap((e) => e.textureRoles ?? []),
		characterTextures: Object.assign({}, ...e.map((e) => e.characterTextures ?? {})),
		characterControllers: nt(e),
		nativeMeshes: Yt(e, i),
		motionPackage: r?.motionPackage ?? null,
		morphChannelBindings: n.morphChannelBindings ?? [],
		pjskSpringBone: {
			raw: i.raw,
			runtimeUnitySetup: i
		},
		warnings: [...i.warnings ?? [], ...r?.warnings ?? []]
	};
}
function nt(e) {
	return e.find((e) => {
		let t = w(e.part);
		return t === "head" || t === "hair";
	})?.characterControllers ?? {};
}
function rt(e) {
	let t = e.map((e, t) => vt(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = pn(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = Ft(t), f = it(i, d), p = Bt(t, d), m = zt(s, d), h = pt(r);
	if (!h) throw Error("Composed parts do not provide the official model_combine_setup body/head paths.");
	let g = {
		...n,
		version: "0414",
		prefabGraphs: r,
		bodyHeadAssembly: h,
		rootSelectionProfile: {
			policy: "viewer_composed_active_parts",
			rootCandidates: []
		},
		setupPlan: {
			discoveryMode: "viewer_composed_part_runtime_package",
			rootPolicy: "active_custom_parts; manager ownership is rebuilt from composed hierarchy",
			orderedSteps: [
				"load active part packages",
				"merge part native meshes",
				"merge active part springbone records",
				"rebuild SpringManager ownership from composed hierarchy",
				"repair constraints after composition",
				"rebind colliderFlag springs to current body colliders",
				"reset spring runtime"
			],
			directBindingCount: d.filter((e) => e.sourceKind === "direct").length,
			colliderFlagBindingCount: d.filter((e) => e.sourceKind === "colliderFlag").length
		},
		activeRootProfile: {
			defaultBodyRoot: a[0] ?? "body",
			activeRoots: a.length ? a : ["body", "face"],
			inactiveRoots: []
		},
		funit: dt(e),
		raw: ft(t),
		managers: o,
		bones: s,
		extraBones: c,
		colliders: l,
		colliderBindings: d,
		bindingDecisions: m,
		constraintSetup: {
			version: "0414",
			sourceKind: "viewer_composed_part_runtime_package",
			constraints: u,
			warnings: pn(t.flatMap((e) => dn(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return at(t, g, Xt(e)), g;
}
function it(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => fn(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function at(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = nn(D(r.runtime.mount?.attachNode)), o = a ? ot(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && D(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${D(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => D(e.scriptName) === "CharacterAccessoryTransformController" && ct(D(e.transformPath), "optional"));
		if (c) {
			let e = D(c.transformPath), a = (i.transforms ?? []).find((t) => D(t.transformPath) === e);
			a ? (lt(a, Qt(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
		} else s.localPosition = {
			X: 0,
			Y: 0,
			Z: 0
		}, s.localRotation = {
			x: 0,
			y: 0,
			z: 0,
			w: 1
		};
		st(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = D(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function ot(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(A(n.prefabGraph.gameObjects).map((e) => [tn(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (D(e.name) === t || nn(D(e.transformPath)) === t) return e;
			for (let t of e.childPathIds ?? []) {
				let e = r.get(t), n = e ? o(e) : null;
				if (n) return n;
			}
			return null;
		};
		for (let t of n.activeRoots) {
			let n = e.find((e) => e.parentPathId == null && D(e.transformPath) === t), r = n ? o(n) : null;
			if (r) return r;
		}
	}
	return null;
}
function st(e, t) {
	let n = (e) => ct(D(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = A(e.gameObjects).filter(n), e.renderers = A(e.renderers).filter(n), e.animators = A(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = A(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => D(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function ct(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function lt(e, t) {
	let n = en(t?.position, 0, 0, 0), r = en(t?.rotationEulerDegrees, 0, 0, 0), i = en(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = ut(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function ut(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function dt(e) {
	let t = e.map((e) => un(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = pn(t.flatMap((e) => dn(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
	return {
		present: t.some((e) => e.present === !0),
		scriptCount: t.reduce((e, t) => e + n(t, "scriptCount"), 0),
		springManagerCount: t.reduce((e, t) => e + n(t, "springManagerCount"), 0),
		springBoneCount: t.reduce((e, t) => e + n(t, "springBoneCount"), 0),
		sphereColliderCount: t.reduce((e, t) => e + n(t, "sphereColliderCount"), 0),
		capsuleColliderCount: t.reduce((e, t) => e + n(t, "capsuleColliderCount"), 0),
		panelColliderCount: t.reduce((e, t) => e + n(t, "panelColliderCount"), 0),
		detectedScripts: r,
		policy: "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function ft(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function pt(e) {
	let t = mt(e), n = ht(e);
	return !t || !gt(e, "face") || !n ? null : {
		version: "0414",
		sourceKind: "viewer_composed_part_runtime_package",
		parentRootPath: "body",
		parentAttachPath: t,
		childRootPath: "face",
		childOriginPath: n,
		parentingMode: "model_combine_setup",
		coordinateSpace: "unity-left-handed",
		faceRendererName: "Face",
		combineNodeAName: "Neck",
		combineNodeBName: "Head",
		childMoveSuffix: "_target",
		parentCombineNodeAPath: t,
		parentCombineNodeBPath: `${t}/Head`,
		childCombineNodeAPath: n,
		childCombineNodeBPath: `${n}/Head`
	};
}
function mt(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => gt(e, t)) ?? null;
}
function ht(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => gt(e, t)) ?? null;
}
function gt(e, t) {
	return e.some((e) => A(e?.transforms).some((e) => D(e.transformPath) === t));
}
function _t(e) {
	let t = e.springBone ?? {};
	return {
		managers: t.managers,
		bones: t.bones,
		extraBones: t.extraBones,
		colliders: t.colliders,
		colliderBindings: t.colliderBindings,
		managerColliderCaches: t.managerColliderCaches,
		activeRootProfile: t.activeRootProfile,
		funit: t.funit,
		bindingDecisions: t.bindingDecisions,
		constraintSetup: t.constraintSetup
	};
}
function vt(e, t) {
	let n = _t(e), r = w(e.part), i = yt(r, dn(n.activeRootProfile?.activeRoots)), a = bt(kt(n.managers, t, r), i), o = bt(kt(n.bones, t, r), i), s = bt(xt(n.extraBones, t, r), i), c = bt(kt(n.colliders, t, r), i), l = Ct(kt(n.colliderBindings, t, r), o), u = wt(kt(n.managerColliderCaches, t, r), a), d = Tt(n.constraintSetup, t, r, i);
	return Dt(a, o, u), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: Et(e.springBone?.prefabGraph, t),
		managers: a,
		bones: o,
		extraBones: s,
		colliders: c,
		colliderBindings: l,
		managerColliderCaches: u,
		constraints: d,
		activeRoots: i
	};
}
function yt(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function bt(e, t) {
	let n = new Set(t.map((e) => qt(e)));
	return e.filter((e) => {
		let t = qt(Jt(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function xt(e, t, n) {
	return kt(e, t, n).map((e) => {
		let n = e, r = St(n.gameObject ?? n.GameObject, t), i = St(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = Jt(n.nodePath) ?? null, n;
	});
}
function St(e, t) {
	if (!k(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = O(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = O(n.PathId, t)), n;
}
function Ct(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function wt(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Tt(e, t, n, r) {
	let i = new Set(r.map((e) => qt(e)));
	return kt(e?.constraints, t, n).map((e) => {
		let n = A(e.sources).map((e) => {
			let n = { ...e };
			return typeof n.sourcePathId == "number" && (n.sourcePathId = O(n.sourcePathId, t)), n;
		});
		return typeof e.worldUpObjectPathId == "number" && (e.worldUpObjectPathId = O(e.worldUpObjectPathId, t)), {
			...e,
			sources: n
		};
	}).filter((e) => {
		let t = qt(Jt(e.ownerPath));
		return !t || i.has(t);
	});
}
function Et(e, t) {
	if (!k(e)) return null;
	let n = { ...e };
	return n.runtimePartIndex = t, n.transforms = A(e.transforms).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = O(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = O(n.PathId, t)), typeof n.parentPathId == "number" && (n.parentPathId = O(n.parentPathId, t)), Array.isArray(n.childPathIds) && (n.childPathIds = n.childPathIds.map((e) => typeof e == "number" ? O(e, t) : e)), n;
	}), n.monoBehaviours = A(e.monoBehaviours).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = O(n.pathId, t)), n;
	}), n;
}
function Dt(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => Ot(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function Ot(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function kt(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!k(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, typeof r.pathId == "number" && (r.pathId = O(r.pathId, t)), typeof r.index == "number" && (r.index = O(r.index, t)), typeof r.managerPathId == "number" && (r.managerPathId = O(r.managerPathId, t)), typeof r.pivotSourcePathId == "number" && (r.pivotSourcePathId = O(r.pivotSourcePathId, t)), typeof r.sourceSpringBonePathId == "number" && (r.sourceSpringBonePathId = O(r.sourceSpringBonePathId, t)), Array.isArray(r.bonePathIds) && (r.bonePathIds = r.bonePathIds.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.forceProviders) && (r.forceProviders = At(r.forceProviders, t)), Array.isArray(r.directColliderPathIds) && (r.directColliderPathIds = r.directColliderPathIds.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.sourceColliderPathIds) && (r.sourceColliderPathIds = r.sourceColliderPathIds.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.colliders) && (r.colliders = r.colliders.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.selectedColliderIndexes) && (r.selectedColliderIndexes = r.selectedColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.sphereColliderIndexes) && (r.sphereColliderIndexes = r.sphereColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.capsuleColliderIndexes) && (r.capsuleColliderIndexes = r.capsuleColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.panelColliderIndexes) && (r.panelColliderIndexes = r.panelColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.springBonePathIds) && (r.springBonePathIds = r.springBonePathIds.map((e) => typeof e == "number" ? O(e, t) : e)), k(r.collidersByRoot) && (r.collidersByRoot = jt(r.collidersByRoot, t)), k(r.candidateRoots) && (r.candidateRoots = jt(r.candidateRoots, t)), r;
	}) : [];
}
function At(e, t) {
	return e.map((e) => {
		if (!k(e)) return e;
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.sourcePathId == "number" && (n.sourcePathId = O(n.sourcePathId, t)), typeof n.springManagerPathId == "number" && (n.springManagerPathId = O(n.springManagerPathId, t)), n;
	});
}
function O(e, t) {
	return (t + 1) * 1e9 + e;
}
function jt(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? O(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var Mt = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function Nt(e) {
	return Mt.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function Pt(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: Nt(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function Ft(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = Ut(t);
	return Pt(e).map((e) => It(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return It(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !Wt(n)) return r;
		let i = Gt(n);
		return {
			...r,
			collidersByRoot: n,
			defaultRoot: i.root,
			colliders: i.indexes,
			sourceColliderPathIds: i.indexes.map((e) => t.find((t) => t.index === e)?.pathId).filter((e) => typeof e == "number"),
			rebindReason: "viewer_composed_current_body_colliders"
		};
	})));
}
function It(e, t) {
	let n = Lt(e, t);
	return {
		...e,
		sourceKind: "colliderFlag",
		originalSourceKind: "deferred_body_colliderFlag",
		collidersByRoot: n.byRoot,
		defaultRoot: n.defaultRoot,
		colliders: n.indexes,
		sourceColliderPathIds: n.indexes.map((e) => t.find((t) => t.index === e)?.pathId).filter((e) => typeof e == "number"),
		rebindReason: "viewer_composed_deferred_body_colliderFlag"
	};
}
function Lt(e, t) {
	let n = dn(e.matchedPrefixes), r = Ut(t.filter((e) => typeof e.index == "number" && Rt(e, n))), i = Wt(r) ? Gt(r).root : qt(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function Rt(e, t) {
	if (!t.length) return !1;
	let n = D(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function zt(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = Wt(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
		return {
			sourceKind: e.sourceKind ?? "direct",
			partKind: e.partKind ?? t?.partKind ?? "Unknown",
			sourceSpringBonePathId: e.sourceSpringBonePathId,
			nodePath: t?.nodePath ?? null,
			poseRoot: t?.poseRoot ?? null,
			colliderFlag: typeof e.colliderFlag == "number" ? e.colliderFlag : null,
			directColliderPathIds: e.sourceKind === "direct" ? e.sourceColliderPathIds ?? [] : [],
			candidateRoots: r,
			defaultRoot: e.defaultRoot ?? null,
			selectedColliderIndexes: e.colliders ?? [],
			reason: e.sourceKind === "colliderFlag" ? "viewer custom composer rebound colliderFlag candidates to current body colliders" : "direct serialized collider references"
		};
	});
}
function Bt(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? Vt(r, t, n) : Ht(r, n)));
}
function Vt(e, t, n) {
	let r = new Set(fn(e.springBonePathIds)), i = mn(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => fn(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => D(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => D(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => D(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : Ht(e, n);
}
function Ht(e, t) {
	return {
		...e,
		sphereColliderIndexes: fn(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: fn(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: fn(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function Ut(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = qt(Jt(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function Wt(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function Gt(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => Kt(e) - Kt(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function Kt(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function qt(e) {
	return (e ?? "").trim() || "body";
}
function Jt(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function Yt(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = w(a.part);
		for (let o of A(a.nativeMeshes?.meshes)) {
			if (e !== "head_optional") {
				r.push(o);
				continue;
			}
			let a = D(o.rendererTransformPath), s = A(t.prefabGraphs).find((e) => tn(e.runtimePartIndex, -1) === i && !!D(e.headOptionalAttachPath)), c = D(s?.headOptionalPrefabRootPath);
			if (!s || !c) {
				n.push(`Head optional mesh '${D(o.meshPath) || D(o.meshName) || "<unnamed>"}' was skipped because the official prefab could not be mounted.`);
				continue;
			}
			a !== c && !a.startsWith(`${c}/`) || r.push({
				...o,
				sourceRendererTransformPath: a,
				rendererTransformPath: a
			});
		}
	}
	return {
		version: "0414",
		meshes: r,
		warnings: n
	};
}
function Xt(e) {
	let t = [
		...e.filter((e) => w(e.part) === "head"),
		...e.filter((e) => w(e.part) === "hair"),
		...e.filter((e) => w(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = Zt(D(e.source?.bundlePath));
		if (t) return t;
		let n = Zt(D(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function Zt(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function Qt(e, t) {
	if (!t) return null;
	let n = $t(e)[t];
	return k(n) ? n : null;
}
function $t(e) {
	return un(e.mount?.accessoryTransformAdjustments);
}
function en(e, t, n, r) {
	let i = un(e);
	return {
		x: tn(i.x ?? i.X, t),
		y: tn(i.y ?? i.Y, n),
		z: tn(i.z ?? i.Z, r)
	};
}
function tn(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function nn(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function rn(e, t, n) {
	if (!t) return e;
	let r = an([], [t], n), i = new Map(r.filter((e) => e.materialKind === "eye" || e.materialKind === "eyelight").map((e) => [e.materialKind, e]));
	return e.map((e) => {
		if (e.mainTex || e.materialKind !== "eye" && e.materialKind !== "eyelight") return e;
		let t = i.get(e.materialKind);
		return t?.mainTex ? {
			...e,
			mainTex: t.mainTex
		} : e;
	});
}
function an(e, t, n) {
	let r = t.flatMap((e) => {
		let t = Ye(e, n);
		return (e.materialSlots ?? []).map((e) => on(e, t));
	});
	if (r.length) return r;
	let i = t[0] ? Ye(t[0], n) : n;
	return [...e ?? []].map((e) => on(e, i));
}
function on(e, t) {
	return {
		...e,
		mainTex: sn(e.mainTex ?? void 0, t) ?? e.mainTex,
		shadowTex: sn(e.shadowTex ?? void 0, t) ?? e.shadowTex,
		valueTex: sn(e.valueTex ?? void 0, t) ?? e.valueTex,
		faceShadowTex: sn(e.faceShadowTex ?? void 0, t) ?? e.faceShadowTex,
		rawMaterial: e.rawMaterial ? {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => ({
				...e,
				uri: sn(e.uri ?? void 0, t) ?? e.uri
			}))
		} : e.rawMaterial
	};
}
function sn(e, t) {
	return e && t(e);
}
function cn(e, t) {
	return e ? t(e) : "";
}
function ln(e) {
	return JSON.parse(JSON.stringify(e));
}
function k(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function un(e) {
	return k(e) ? e : {};
}
function dn(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function A(e) {
	return Array.isArray(e) ? e.filter((e) => k(e)) : [];
}
function fn(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "number") : [];
}
function pn(e) {
	return [...new Set(e)];
}
function mn(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
//#endregion
//#region src/parts/customWardrobeController.ts
var hn = class {
	options;
	partSet = null;
	selection = null;
	activeRoleId = null;
	combined = null;
	constructor(e) {
		this.options = e;
	}
	loadPartPackageSet(e, t = {}) {
		this.partSet = e;
		let n = t.composeDefault ?? !0;
		return this.selection = n ? ye(e) : null, this.activeRoleId = this.selection ? E(this.selection.characterId, this.selection.unit) : null, this.combined = this.selection ? this.compose(this.selection) : null, this.combined;
	}
	clear() {
		this.partSet = null, this.selection = null, this.activeRoleId = null, this.combined = null;
	}
	getPartPackageSet() {
		return this.partSet;
	}
	getCustomSelection() {
		return this.selection ? { ...this.selection } : null;
	}
	getActiveCharacterId() {
		return this.selection?.characterId ?? null;
	}
	getActiveRoleId() {
		return this.activeRoleId;
	}
	selectRole(e, t) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		this.activeRoleId = E(e, t), this.selection && E(this.selection.characterId, this.selection.unit) !== this.activeRoleId && (this.selection = null, this.combined = null);
	}
	getCombinedCharacter() {
		return this.combined;
	}
	listCustomParts(e, t, n = {}) {
		return this.partSet ? be(this.partSet, e, t, n) : [];
	}
	async setCustomSelection(e, t = () => !0) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let n = this.resolveHeadSource(e);
		if (this.assertSameActiveCharacter(n), await this.ensureSelectionPackages(n), await this.options.ensureCompatibility?.(n), !t()) throw gn();
		this.activeRoleId ??= E(n.characterId, n.unit);
		let r = this.compose(n);
		return this.selection = { ...n }, this.combined = r, r;
	}
	updateCustomSelection(e, t) {
		if (!this.selection) throw Error("No custom selection is active.");
		let n = {
			...this.selection,
			bodyCostume3dId: e === "body" && t !== null ? t : this.selection.bodyCostume3dId,
			headCostume3dId: e === "head" && t !== null ? t : this.selection.headCostume3dId,
			headPackagePath: e === "head" && t !== null ? null : this.selection.headPackagePath,
			hairCostume3dId: e === "hair" && t !== null ? t : this.selection.hairCostume3dId,
			headOptionalCostume3dId: e === "head_optional" ? t : this.selection.headOptionalCostume3dId
		};
		return this.setCustomSelection(n);
	}
	async composeCustomCharacter(e) {
		let t = this.resolveHeadSource(e);
		return this.assertSameActiveCharacter(t), await this.ensureSelectionPackages(t), await this.options.ensureCompatibility?.(t), this.compose(t);
	}
	resolveHeadSource(e) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let t = ke(this.partSet, e);
		return {
			...e,
			headPackagePath: t.packagePath
		};
	}
	assertSameActiveCharacter(e) {
		let t = E(e.characterId, e.unit);
		if (this.activeRoleId !== null && t !== this.activeRoleId) throw Error(`Custom switching is limited to active role ${this.activeRoleId}. Select/reload role ${t} before switching parts.`);
	}
	async ensureSelectionPackages(e) {
		if (!this.partSet || !this.options.loadPartRuntime) return;
		let t = ke(this.partSet, e), n = e.bodyCharacterId ?? e.characterId, r = e.bodyUnit === void 0 ? e.unit : e.bodyUnit, i = this.partSet.roles.find((e) => E(e.characterId, e.unit) === E(n, r)), a = [
			this.findRegistryEntryForRole(n, r, "body", e.bodyCostume3dId),
			i ? this.findRegistryEntryForRole(n, r, "body", i.bodyCostume3dId) : null,
			t,
			this.findRegistryEntry(e, "hair", e.hairCostume3dId),
			Me(this.partSet, e),
			T(t) === "head" ? Ce(this.partSet, e) : null
		].filter((e) => e !== null && e.status !== "empty");
		await Promise.all(a.map(async (e) => {
			if (!this.partSet.packages.has(e.packagePath) && !await this.options.loadPartRuntime(e)) throw Error(`Failed to load ${e.partType} package ${e.packagePath}.`);
		}));
	}
	findRegistryEntry(e, t, n) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let r = be(this.partSet, e.characterId, t, {
			unit: e.unit,
			loadedOnly: !1
		}).find((e) => e.costume3dId === n);
		if (!r) throw Error(`No ${t} registry entry for role ${E(e.characterId, e.unit)}, costume3dId ${n}.`);
		return r;
	}
	findRegistryEntryForRole(e, t, n, r) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let i = be(this.partSet, e, n, {
			unit: t,
			loadedOnly: !1
		}).find((e) => e.costume3dId === r);
		if (!i) throw Error(`No ${n} registry entry for role ${E(e, t)}, costume3dId ${r}.`);
		return i;
	}
	compose(e) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		return xe({
			partSet: this.partSet,
			selection: e,
			activeRoleId: this.activeRoleId ?? E(e.characterId, e.unit),
			resolveUrl: this.options.resolveUrl
		});
	}
};
function gn() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
//#endregion
//#region src/runtime/brotliWasmAsset.ts
var _n = "" + new URL("assets/brotli_wasm_bg-NfWIZley.wasm", import.meta.url).href, vn = 64 * 1024, j = null, yn = 1, bn = /* @__PURE__ */ new Map();
async function xn(e) {
	if (e.byteLength < vn || typeof Worker > "u") return Sn(e);
	let t = Cn();
	if (!t) return Sn(e);
	let n = yn++;
	return new Promise((r, i) => {
		bn.set(n, {
			resolve: r,
			reject: i
		}), t.postMessage({
			id: n,
			bytes: e,
			wasmUrl: _n
		}, [e]);
	});
}
async function Sn(e) {
	let { decodeRuntimeMessagePackBrotliDirect: t } = await import("./runtimeMessagePackDecodeCore-BptdOkvu.js");
	return t(e, _n);
}
function Cn() {
	if (j) return j;
	try {
		return j = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/runtimeDecodeWorker-ztxrM9TB.js", import.meta.url).href,
			"" + import.meta.url
		), {
			type: "module",
			name: "haruki-runtime-decoder"
		}), j.onmessage = ({ data: e }) => {
			let t = bn.get(e.id);
			t && (bn.delete(e.id), e.error ? t.reject(Error(e.error)) : t.resolve(e.value));
		}, j.onerror = () => wn("Runtime decode worker failed."), j;
	} catch {
		return j = null, null;
	}
}
function wn(e) {
	j?.terminate(), j = null;
	for (let t of bn.values()) t.reject(Error(e));
	bn.clear();
}
//#endregion
//#region src/runtime/runtimePackageLoader.ts
var Tn = /* @__PURE__ */ new Map(), En = 16, Dn = /* @__PURE__ */ new Map();
async function On(e, t) {
	let n = /* @__PURE__ */ new Map(), r = await jn(e, t), i = new hn({
		resolveUrl: (t) => M(e, t),
		loadPartRuntime: async (t) => In(r, t, e),
		ensureCompatibility: async (t) => zn(r, t.unit, e)
	}), a = i.loadPartPackageSet(r, { composeDefault: !t.deferDefaultSelection });
	if (!a && !t.deferDefaultSelection) throw Error(`Part registry package did not expose a default custom selection from ${e}.`);
	return {
		kind: "part-registry",
		combinedCharacter: a,
		previewLight: null,
		faceMotion: null,
		displayNameByUrl: n,
		partSet: r,
		wardrobe: i
	};
}
async function kn(e, t, n) {
	let r = E(t, n), i = e.roles.some((e) => E(e.characterId, e.unit) === r), a = e.registry.some((e) => e.characterId === t && E(e.characterId, e.unit) === r);
	if (i && a) return;
	let o = `parts/by-role/${t}/${Wn(n)}`, s = await Kn(M(e.baseUrl, `${o}/runtime-role-catalog.msgpack.br`)), c = Vn(s, t, n);
	if (e.masterVersion && e.masterVersion !== s.masterVersion) throw Error(`Cross-role registry version mismatch: ${e.masterVersion} != ${s.masterVersion}.`);
	let l = Xn(await Kn(An(M(e.baseUrl, `${o}/part-registry.msgpack.br`), s.masterVersion)));
	i || e.roles.push(...c), a || e.registry.push(...l);
}
function M(e, t) {
	let n = new URL(e, window.location.href);
	n.pathname.endsWith("/") || (n.pathname = `${n.pathname}/`);
	let r = t.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter((e) => e.length > 0);
	if (r.length === 0 || r.some((e) => e === "." || e === "..")) throw Error(`Invalid runtime package relative path: ${t}`);
	let i = r.map((e) => encodeURIComponent(e)).join("/");
	return new URL(i, n).toString();
}
function An(e, t) {
	if (!t) return e;
	let n = new URL(e, window.location.href);
	return n.searchParams.set("masterVersion", t), n.toString();
}
async function jn(e, t) {
	let n = Bn(t.roleId), r = `parts/by-role/${n.characterId}/${Wn(n.unit)}`, i = await Kn(M(e, `${r}/runtime-role-catalog.msgpack.br`)), a = Vn(i, n.characterId, n.unit), o = Xn(await Kn(An(M(e, `${r}/part-registry.msgpack.br`), i.masterVersion))), s = /* @__PURE__ */ new Map();
	if (t.deferDefaultSelection) return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	};
	let c = Zn(o, a, null);
	for (let t = 0; t < Math.min(c.length, 720); t += 24) {
		let n = c.slice(t, t + 24), r = await Promise.all(n.map(async (t) => ({
			entry: t,
			runtime: await Rn(e, t)
		})));
		for (let e of r) e.runtime && s.set(e.entry.packagePath, Gn(e.runtime, e.entry));
		if (er(o, a, null, s, e)) break;
	}
	if (!er(o, a, null, s, e)) throw Error(`Part registry package did not expose a compatible loaded body/head/hair selection from ${e}.`);
	let l = ye({
		registry: o,
		roles: a,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	}), u = l ? /* @__PURE__ */ new Set([E(l.characterId, l.unit)]) : null, d = await Nn(e, a, i.masterVersion, u);
	return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: d,
		baseUrl: e
	};
}
async function Mn(e, t, n) {
	let r = E(t, n), i = e.roleRuntimes.get(r);
	if (i) return i;
	let a = e.roles.find((e) => e.roleRuntimePath && e.characterId === t && E(e.characterId, e.unit ?? null) === r);
	if (!a?.roleRuntimePath) return null;
	let o = await Yn(An(M(e.baseUrl, a.roleRuntimePath), e.masterVersion));
	if (!o) return null;
	let s = Pn(e.baseUrl, a.roleRuntimePath, o, e.masterVersion), c = s.role?.characterId ?? t, l = s.role?.unit ?? n;
	return e.roleRuntimes.set(E(c, l), s), s;
}
async function Nn(e, t, n, r = null) {
	let i = /* @__PURE__ */ new Map(), a = t.filter((e) => e.roleRuntimePath && (!r || r.has(E(e.characterId, e.unit ?? null)))), o = await Promise.all(a.map(async (t) => ({
		entry: t,
		runtime: await Yn(An(M(e, t.roleRuntimePath), n))
	})));
	for (let t of o) {
		if (!t.runtime) continue;
		let r = t.runtime.role?.characterId ?? t.entry.characterId, a = t.runtime.role?.unit ?? t.entry.unit ?? null, o = Pn(e, t.entry.roleRuntimePath, t.runtime, n);
		i.set(E(r, a), o);
	}
	return i;
}
function Pn(e, t, n, r) {
	let i = n.motionPackage, a = i?.unityMotionJson;
	if (!a) return n;
	let o = /^[a-z][a-z0-9+.-]*:/i.test(a) || a.startsWith("/") ? new URL(a, window.location.href).toString() : M(e, Fn(t, a));
	return {
		...n,
		motionPackage: {
			...i,
			unityMotionJson: An(o, r)
		}
	};
}
function Fn(e, t) {
	let n = e.replace(/\\/g, "/").split("/").slice(0, -1).join("/");
	return n ? `${n}/${t.replace(/^\/+/, "")}` : t;
}
async function In(e, t, n = e.baseUrl) {
	let r = e.packages.get(t.packagePath);
	if (r) return r;
	let i = Gn(await Ln(n, t), t);
	return e.packages.set(t.packagePath, i), i;
}
async function Ln(e, t) {
	let n = await Kn(M(e, `${t.packagePath}/part-runtime.msgpack.br`));
	if (!n.corePath?.endsWith(".msgpack.br")) throw Error(`Part runtime must reference a .msgpack.br shared core: ${t.packagePath}.`);
	return me(n, await Kn(M(e, n.corePath)));
}
async function Rn(e, t) {
	try {
		return await Ln(e, t);
	} catch {
		return null;
	}
}
async function zn(e, t, n = e.baseUrl) {
	e.compatibility ||= await Kn(An(M(n, `parts/compat/by-unit/${Wn(t)}/head-hair-compatibility.msgpack.br`), e.masterVersion));
}
function Bn(e) {
	if (!e) throw Error("Runtime role id is required.");
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid runtime role id: ${e}`);
	return {
		characterId: r,
		unit: n.join(":") || null
	};
}
function Vn(e, t, n) {
	let r = (e?.version === 2 || e?.version === 3 || e?.version === 4) && typeof e.masterVersion == "string" && e.masterVersion.length > 0 && Array.isArray(e.roles) ? e.roles : [];
	if (r.length !== 1) throw Error(`Runtime role catalog must contain exactly one scoped role for ${E(t, n)}.`);
	let i = r[0], a = Un(i.roleId), o = a ? `roles/${a.characterId}/${Wn(a.unit)}/role-runtime.msgpack.br` : "";
	if (!a || i.characterId !== t || E(i.characterId, i.unit) !== E(t, n) || i.characterId !== a.characterId || E(i.characterId, i.unit) !== E(a.characterId, a.unit) || !Number.isInteger(i.roleId) || i.roleId < 1 || i.roleId > 31 || !Number.isInteger(i.bodyCostume3dId) || i.bodyCostume3dId <= 0 || !Number.isInteger(i.headCostume3dId) || i.headCostume3dId <= 0 || !Number.isInteger(i.hairCostume3dId) || i.hairCostume3dId <= 0 || e.version >= 3 && !Hn(i.skinColors) || e.version >= 4 && (typeof i.characterHeightMeters != "number" || !Number.isFinite(i.characterHeightMeters) || i.characterHeightMeters <= 0) || i.roleRuntimePath !== o) throw Error(`Runtime role catalog is invalid for ${E(t, n)}.`);
	return r;
}
function Hn(e) {
	let t = (e) => typeof e == "string" && /^#[0-9a-f]{6}$/i.test(e);
	return !!(e && t(e.default) && t(e.shadow1) && t(e.shadow2));
}
function Un(e) {
	return !Number.isInteger(e) || e < 1 || e > 31 ? null : e <= 20 ? {
		characterId: e,
		unit: e <= 4 ? "light_sound" : e <= 8 ? "idol" : e <= 12 ? "street" : e <= 16 ? "theme_park" : "school_refusal"
	} : e <= 26 ? {
		characterId: 21,
		unit: [
			"piapro",
			"idol",
			"light_sound",
			"street",
			"theme_park",
			"school_refusal"
		][e - 21]
	} : {
		characterId: e - 5,
		unit: "piapro"
	};
}
function Wn(e) {
	return e || "default";
}
function Gn(e, t) {
	return {
		...e,
		packagePath: t.packagePath,
		mount: {
			...e.mount ?? {},
			packagePath: t.packagePath
		}
	};
}
async function Kn(e) {
	if (!/\.msgpack\.br(?:[?#]|$)/i.test(e)) throw Error(`Runtime metadata must use .msgpack.br: ${e}`);
	let t = Dn.get(e);
	if (t) return t;
	let n = (async () => {
		let t = await fetch(e);
		if (!t.ok) throw Error(`Failed to load ${e}: HTTP ${t.status}`);
		return qn(t, e);
	})();
	Dn.set(e, n);
	try {
		return await n;
	} finally {
		Dn.get(e) === n && Dn.delete(e);
	}
}
async function qn(e, t) {
	try {
		let n = e.headers.get("x-haruki-file-version"), r = n && Jn(t) ? Tn.get(t) : null;
		if (r?.version === n) return Tn.delete(t), Tn.set(t, r), await e.body?.cancel(), r.value;
		let i = await xn(await e.arrayBuffer());
		if (n && Jn(t)) for (Tn.delete(t), Tn.set(t, {
			version: n,
			value: i
		}); Tn.size > En;) Tn.delete(Tn.keys().next().value);
		return i;
	} catch (e) {
		throw e instanceof Error ? e : /* @__PURE__ */ Error(`Failed to decode ${t}: ${String(e)}`);
	}
}
function Jn(e) {
	let t = e.split(/[?#]/, 1)[0] ?? e;
	return /\/parts\/by-role\/[^/]+\/[^/]+\/(?:part-registry|runtime-role-catalog)\.msgpack\.br$/.test(t) || /\/parts\/compat\/by-unit\/[^/]+\/head-hair-compatibility\.msgpack\.br$/.test(t) || /\/roles\/[^/]+\/[^/]+\/(?:role-runtime|motion\/unity-motion)\.msgpack\.br$/.test(t);
}
async function Yn(e) {
	try {
		return await Kn(e);
	} catch {
		return null;
	}
}
function Xn(e) {
	return Array.isArray(e) ? e : e.entries ?? e.parts ?? [];
}
function Zn(e, t, n) {
	let r = t.find((e) => typeof e.characterId == "number")?.characterId ?? e.find($n)?.characterId ?? null, i = [], a = /* @__PURE__ */ new Set(), o = (e) => {
		if (!e || !$n(e)) return;
		let t = e.packagePath;
		a.has(t) || (a.add(t), i.push(e));
	}, s = (t, n, r, i) => e.find((e) => e.characterId === t && e.costume3dId === r && T(e) === n && (i === void 0 || e.unit === i) && Qn(e)), c = He(n);
	if (r !== null) {
		for (let e of t) e.characterId === r && (typeof e.bodyCostume3dId == "number" && o(s(e.characterId, "body", e.bodyCostume3dId, e.unit)), typeof e.headCostume3dId == "number" && (o(s(e.characterId, "head", e.headCostume3dId, e.unit)), o(s(e.characterId, "head_optional", e.headCostume3dId, e.unit))), typeof e.hairCostume3dId == "number" && o(s(e.characterId, "hair", e.hairCostume3dId, e.unit)));
		o(e.filter((e) => e.characterId === r && T(e) === "body" && Qn(e)).sort((e, t) => e.costume3dId - t.costume3dId)[0]);
		let n = e.filter((e) => e.characterId === r && ["head", "head_optional"].includes(T(e) ?? "") && Qn(e)).sort((e, t) => e.costume3dId - t.costume3dId), i = e.filter((e) => e.characterId === r && T(e) === "hair" && Qn(e)).sort((e, t) => e.costume3dId - t.costume3dId);
		for (let e of n) for (let t of i) T(e) !== "head" && c.has(Ue(e.unit ?? t.unit, e.costume3dId, t.costume3dId)) || (o(e), o(t));
	}
	let l = /* @__PURE__ */ new Set();
	for (let e of t) if (!(r !== null && e.characterId !== r)) for (let t of [
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.hairCostume3dId
	]) typeof t == "number" && l.add(t);
	let u = e.filter($n).filter((e) => !a.has(e.packagePath)).map((e, t) => ({
		entry: e,
		index: t,
		score: (r !== null && e.characterId === r ? 0 : 1e6) + (l.has(e.costume3dId) ? 0 : 1e4) + tr(e) + Math.min(e.costume3dId, 9999)
	})).sort((e, t) => e.score - t.score || e.index - t.index);
	return [...i, ...u.map((e) => e.entry)];
}
function Qn(e) {
	return e.status !== "missing";
}
function $n(e) {
	return Qn(e) && e.status !== "empty";
}
function er(e, t, n, r, i) {
	let a = new Set(e.filter((e) => r.has(e.packagePath)).map((e) => T(e)).filter(Boolean));
	return !a.has("body") || !a.has("head") && !a.has("head_optional") || !a.has("hair") ? !1 : !!ye({
		registry: e,
		roles: t,
		compatibility: n,
		packages: r,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: i
	});
}
function tr(e) {
	switch (T(e)) {
		case "body": return 0;
		case "head": return 100;
		case "hair": return 200;
		case "head_optional": return 300;
		default: return 1e3;
	}
}
//#endregion
//#region src/materials/sekaiCharacterLighting.ts
function N(e) {
	return Math.min(Math.max(e, 0), 1);
}
function nr(e) {
	let t = N(e);
	return t * t * (3 - 2 * t);
}
function rr(e) {
	let t = e.normalDotLight * .5 + .5, n = N((e.useLambert ? t : 1) + 2 * (e.useValueTex ? e.valueB : .5) - 1), r = N(e.threshold), i = N(e.width), a = e.fadeMode < .5 ? Math.max(r * i, 1e-5) : Math.max((1 - r) * i, 1e-5);
	return {
		rawLight: n,
		shadow: 1 - nr(e.fadeMode < .5 ? N((n - r * (1 - i)) / a) : N((n - r) / a))
	};
}
function ir(e) {
	let t = e.headDotX <= 0 ? e.mirroredSdf : e.sdf, n = N(e.useLimiter ? Math.min(Math.max((1 - Math.abs(2 * e.headDotY - 1)) * .5, 0), e.rangeLimit) : e.headDotY), r = N(e.width), i = e.fadeMode < .5 ? N((n - t) / Math.max((1 - t) * r, 1e-5)) : N((t - n) / Math.max((1 - n) * r, 1e-5));
	return {
		sdf: t,
		threshold: n,
		shadow: e.fadeMode < .5 ? nr(i) : 1 - nr(i)
	};
}
function ar(e) {
	let t = N(e.skinValue * 2), n = N(e.skinValue * 2 - 1);
	return e.defaultSkin.map((r, i) => {
		let a = e.shadow1Skin[i] * e.globalShadow[i], o = e.shadow2Skin[i] * e.globalShadow[i];
		return o + (a + (r - a) * n - o) * t;
	});
}
var or = "\nfloat sekaiSmooth01(float value) {\n  float x = clamp(value, 0.0, 1.0);\n  return x * x * (3.0 - 2.0 * x);\n}\n\nfloat sekaiBaseShadow(\n  float normalDotLight,\n  float valueB,\n  float useLambert,\n  float useValueTex,\n  float threshold,\n  float width,\n  float fadeMode\n) {\n  float halfLambert = normalDotLight * 0.5 + 0.5;\n  float baseLight = useLambert > 0.5 ? halfLambert : 1.0;\n  float selectedValueB = useValueTex > 0.5 ? valueB : 0.5;\n  float rawLight = clamp(baseLight + 2.0 * selectedValueB - 1.0, 0.0, 1.0);\n  float t = clamp(threshold, 0.0, 1.0);\n  float w = clamp(width, 0.0, 1.0);\n  float q = fadeMode < 0.5\n    ? clamp((rawLight - t * (1.0 - w)) / max(t * w, 0.00001), 0.0, 1.0)\n    : clamp((rawLight - t) / max((1.0 - t) * w, 0.00001), 0.0, 1.0);\n  return 1.0 - sekaiSmooth01(q);\n}\n\nfloat sekaiFaceShadow(\n  float sdf,\n  float threshold,\n  float width,\n  float fadeMode\n) {\n  float w = clamp(width, 0.0, 1.0);\n  float q = fadeMode < 0.5\n    ? clamp((threshold - sdf) / max((1.0 - sdf) * w, 0.00001), 0.0, 1.0)\n    : clamp((sdf - threshold) / max((1.0 - threshold) * w, 0.00001), 0.0, 1.0);\n  return fadeMode < 0.5 ? sekaiSmooth01(q) : 1.0 - sekaiSmooth01(q);\n}\n", sr = "\nvec3 sekaiApplyHsvc(\n  vec3 color,\n  float hueSin,\n  float hueCos,\n  float saturation,\n  float value,\n  float contrast\n) {\n  vec3 axis = vec3(0.577350259);\n  vec3 rotated =\n    color * hueCos +\n    cross(axis, color) * hueSin +\n    axis * dot(axis, color) * (1.0 - hueCos);\n  rotated =\n    (rotated - vec3(0.5)) * (contrast * 2.0) +\n    vec3(value * 2.0 - 0.5);\n  float luma = dot(rotated, vec3(0.22, 0.707, 0.071));\n  return (rotated - vec3(luma)) * (saturation * 2.0) + vec3(luma);\n}\n\nvec3 sekaiSkinRamp(\n  float skinValue,\n  vec3 globalShadow,\n  vec3 defaultSkin,\n  vec3 shadow1Skin,\n  vec3 shadow2Skin\n) {\n  vec3 mid = globalShadow * shadow1Skin;\n  vec3 dark = globalShadow * shadow2Skin;\n  vec3 upperBand = mix(mid, defaultSkin, clamp(skinValue * 2.0 - 1.0, 0.0, 1.0));\n  return mix(dark, upperBand, clamp(skinValue * 2.0, 0.0, 1.0));\n}\n\nvec3 sekaiOverlay(vec3 base, vec3 blend) {\n  vec3 multiplyBranch = 2.0 * base * blend;\n  vec3 screenBranch = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);\n  return mix(multiplyBranch, screenBranch, step(vec3(0.5), base));\n}\n\nvec3 sekaiApplyCharacterAmbient(\n  vec3 color,\n  vec3 ambientColor,\n  float ambientIntensity,\n  vec4 partsAmbientColor\n) {\n  vec3 overlaid = sekaiOverlay(color, ambientColor);\n  float intensity = ambientIntensity;\n  vec3 multiplied = overlaid * intensity * partsAmbientColor.rgb;\n  vec3 screened =\n    1.0 -\n    2.0 * (1.0 - overlaid * intensity) * (1.0 - partsAmbientColor.rgb);\n  return mix(screened, multiplied, clamp(partsAmbientColor.a, 0.0, 1.0));\n}\n\n";
//#endregion
//#region src/materials/sekaiCharacterShader.ts
function P(t, n) {
	return n instanceof e.Color ? t.copy(n) : typeof n == "number" ? t.setHex(n, e.LinearSRGBColorSpace) : t.setStyle(n, e.LinearSRGBColorSpace);
}
function F(t) {
	return P(new e.Color(), t);
}
function cr(t, n) {
	return t === void 0 ? new e.Color().setRGB(n.r, n.g, n.b) : F(t);
}
function lr(t) {
	return t ? (t.updateMatrix(), t.matrix.clone()) : new e.Matrix3();
}
var ur = "\n  vec3 sekaiGammaTexture(vec3 linearColor) {\n    vec3 safeColor = max(linearColor, vec3(0.0));\n    vec3 low = safeColor * 12.92;\n    vec3 high = pow(safeColor, vec3(1.0 / 2.4)) * 1.055 - vec3(0.055);\n    return mix(low, high, step(vec3(0.0031308), safeColor));\n  }\n\n  vec4 sekaiGammaTexture(vec4 linearColor) {\n    return vec4(sekaiGammaTexture(linearColor.rgb), linearColor.a);\n  }\n";
function dr(t) {
	return new e.ShaderMaterial({
		transparent: !1,
		depthWrite: !0,
		side: e.FrontSide,
		vertexColors: !0,
		uniforms: {
			uBaseColor: { value: F(t.baseColor) },
			uShadowColor: { value: F(t.shadowColor) },
			uSkinColorDefault: { value: F(t.skinColorDefault ?? t.baseColor) },
			uSkinColor1: { value: F(t.skinColor1 ?? t.shadowColor) },
			uSkinColor2: { value: F(t.skinColor2 ?? t.skinColor1 ?? t.shadowColor) },
			uPartsAmbientColor: { value: F(t.partsAmbientColor ?? "#ffffff") },
			uPartsAmbientAlpha: { value: t.partsAmbientAlpha ?? 0 },
			uReflectionBlendColor: { value: F(t.reflectionBlendColor ?? "#ffffff") },
			uGlobalShadowColor: { value: F(t.globalShadowColor ?? "#ffffff") },
			uGlobalShadowAlpha: { value: t.globalShadowAlpha ?? 1 },
			uControllerAmbientColor: { value: cr(t.controllerAmbientColor, C.ambientColor) },
			uControllerAmbientIntensity: { value: t.controllerAmbientIntensity ?? 1 },
			uControllerSpecularColor: { value: F(t.controllerSpecularColor ?? "#ffffff") },
			uControllerSpecularIntensity: { value: t.controllerSpecularIntensity ?? 1 },
			uControllerRimColor: { value: cr(t.controllerRimColor, C.rimColor) },
			uControllerShadowRimColor: { value: cr(t.controllerShadowRimColor, C.shadowRimColor) },
			uControllerRimColorWeight: { value: t.controllerRimColorWeight ?? 1 },
			uControllerShadowRimColorWeight: { value: t.controllerShadowRimColorWeight ?? 1 },
			uControllerRimRange: { value: t.controllerRimRange ?? C.rimRange },
			uControllerRimEdgeSmoothness: { value: t.controllerRimEdgeSmoothness ?? C.rimEdgeSmoothness },
			uControllerRimEmission: { value: t.controllerRimEmission ?? C.rimEmission },
			uControllerRimLightInfluence: { value: t.controllerRimLightInfluence ?? C.rimLightInfluence },
			uControllerRimShadowSharpness: { value: t.controllerRimShadowSharpness ?? C.rimShadowSharpness },
			uBodyDebugMode: { value: t.bodyDebugMode ?? 0 },
			uMainTex: { value: t.mainTex ?? null },
			uShadowTex: { value: t.shadowTex ?? null },
			uValueTex: { value: t.valueTex ?? null },
			uMainTexTransform: { value: lr(t.mainTex) },
			uUseMainTex: { value: +!!t.mainTex },
			uUseShadowTex: { value: +!!t.shadowTex },
			uHasValueTex: { value: +!!t.valueTex },
			uUseValueTex: { value: t.useValueTex ?? !!t.valueTex ? 1 : 0 },
			uLightDirection: { value: t.lightDirection.clone().normalize() },
			uCameraPosition: { value: new e.Vector3() },
			uLightIntensity: { value: t.lightIntensity },
			uAmbientIntensity: { value: t.ambientIntensity },
			uShadowThreshold: { value: t.shadowThreshold },
			uShadowWeight: { value: t.shadowWeight },
			uShadowWidth: { value: t.shadowWidth ?? 0 },
			uShadowFade: { value: t.shadowFade ?? 0 },
			uShadowWidthOverride: { value: t.shadowWidthOverride ?? -1 },
			uValueShadowInfluence: { value: t.valueShadowInfluence ?? 0 },
			uCharacterAmbientIntensity: { value: t.characterAmbientIntensity ?? .3 },
			uRimColorAlpha: { value: t.rimColorAlpha ?? C.rimColorAlpha },
			uRimDirection: { value: (t.rimDirection ?? new e.Vector3(S.x, S.y, S.z)).clone().normalize() },
			uSpecularPower: { value: t.specularPower ?? 0 },
			uRimThreshold: { value: t.rimThreshold ?? .2 },
			uShadowTexWeight: { value: t.shadowTexWeight ?? 1 },
			uFadeMode: { value: t.fadeMode ?? 0 },
			uHueSinAngle: { value: t.hueSinAngle ?? 0 },
			uHueCosAngle: { value: t.hueCosAngle ?? 1 },
			uHairShadowEnabled: { value: +!!t.hairShadowEnabled },
			uUseLambert: { value: t.useLambert === !1 ? 0 : 1 },
			uHeadPosition: { value: (t.headPosition ?? new e.Vector3()).clone() },
			uHeadNormalBlend: { value: t.headNormalBlend ?? .7 },
			uSaturation: { value: t.saturation ?? .5 },
			uValue: { value: t.value ?? .5 },
			uContrast: { value: t.contrast ?? .5 },
			uAlphaCutoff: { value: t.alphaCutoff ?? 0 }
		},
		vertexShader: "\n      #include <common>\n      #include <uv_pars_vertex>\n      #include <color_pars_vertex>\n      #include <skinning_pars_vertex>\n\n      varying vec3 vWorldPosition;\n      varying vec3 vWorldNormal;\n      varying vec3 vViewPosition;\n      varying vec3 vModelPosition;\n      varying vec2 vUv;\n\n      uniform float uHairShadowEnabled;\n      uniform vec3 uHeadPosition;\n      uniform float uHeadNormalBlend;\n\n      void main() {\n        #include <uv_vertex>\n        #include <color_vertex>\n        #include <skinbase_vertex>\n        #include <beginnormal_vertex>\n        #include <skinnormal_vertex>\n        #include <defaultnormal_vertex>\n        #include <begin_vertex>\n        #include <skinning_vertex>\n\n        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);\n        vec4 viewPosition = viewMatrix * worldPosition;\n        vWorldPosition = worldPosition.xyz;\n        vec3 worldNormal = inverseTransformDirection(\n          transformedNormal,\n          viewMatrix\n        );\n        vWorldNormal = worldNormal;\n        vViewPosition = viewPosition.xyz;\n        vModelPosition = transformed;\n        vUv = uv;\n        gl_Position = projectionMatrix * viewPosition;\n      }\n    ",
		fragmentShader: `
      #include <common>
      #include <color_pars_fragment>

      uniform vec3 uBaseColor;
      uniform vec3 uShadowColor;
      uniform vec3 uSkinColorDefault;
      uniform vec3 uSkinColor1;
      uniform vec3 uSkinColor2;
      uniform vec3 uPartsAmbientColor;
      uniform float uPartsAmbientAlpha;
      uniform vec3 uReflectionBlendColor;
      uniform vec3 uGlobalShadowColor;
      uniform float uGlobalShadowAlpha;
      uniform vec3 uControllerAmbientColor;
      uniform float uControllerAmbientIntensity;
      uniform vec3 uControllerSpecularColor;
      uniform float uControllerSpecularIntensity;
      uniform vec3 uControllerRimColor;
      uniform vec3 uControllerShadowRimColor;
      uniform float uControllerRimColorWeight;
      uniform float uControllerShadowRimColorWeight;
      uniform float uControllerRimRange;
      uniform float uControllerRimEdgeSmoothness;
      uniform float uControllerRimEmission;
      uniform float uControllerRimLightInfluence;
      uniform float uControllerRimShadowSharpness;
      uniform float uBodyDebugMode;
      uniform sampler2D uMainTex;
      uniform sampler2D uShadowTex;
      uniform sampler2D uValueTex;
      uniform mat3 uMainTexTransform;
      uniform float uUseMainTex;
      uniform float uUseShadowTex;
      uniform float uHasValueTex;
      uniform float uUseValueTex;
      uniform vec3 uLightDirection;
      uniform vec3 uCameraPosition;
      uniform float uLightIntensity;
      uniform float uAmbientIntensity;
      uniform float uShadowThreshold;
      uniform float uShadowWeight;
      uniform float uShadowWidth;
      uniform float uShadowFade;
      uniform float uShadowWidthOverride;
      uniform float uValueShadowInfluence;
      uniform float uCharacterAmbientIntensity;
      uniform float uRimColorAlpha;
      uniform vec3 uRimDirection;
      uniform float uSpecularPower;
      uniform float uRimThreshold;
      uniform float uShadowTexWeight;
      uniform float uFadeMode;
      uniform float uHueSinAngle;
      uniform float uHueCosAngle;
      uniform float uUseLambert;
      uniform float uSaturation;
      uniform float uValue;
      uniform float uContrast;
      uniform float uAlphaCutoff;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;
      varying vec3 vModelPosition;
      varying vec2 vUv;

      ${or}
      ${sr}
      ${ur}

      vec3 outputColor(vec3 color) {
        return color;
      }

      vec3 applyMaterialHsvc(vec3 color) {
        return sekaiApplyHsvc(
          color,
          uHueSinAngle,
          uHueCosAngle,
          uSaturation,
          uValue,
          uContrast
        );
      }

      float toonBand(float value, float threshold, float width) {
        return width <= 0.0001
          ? step(threshold, value)
          : smoothstep(threshold - width, threshold + width, value);
      }

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 lightDir = normalize(uLightDirection);
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        float ndl = dot(normal, lightDir);
        vec2 mainUv = (uMainTexTransform * vec3(vUv, 1.0)).xy;
        vec4 mainSample = vec4(1.0);
        vec3 mainColor = uBaseColor;
        if (uUseMainTex > 0.5) {
          mainSample = sekaiGammaTexture(texture2D(uMainTex, mainUv));
          if (uAlphaCutoff > 0.0 && mainSample.a < uAlphaCutoff) {
            discard;
          }
          mainColor = mainSample.rgb;
        }
        vec3 shadowValue = mainColor;
        if (uUseShadowTex > 0.5) {
          shadowValue = mix(
            shadowValue,
            sekaiGammaTexture(texture2D(uShadowTex, mainUv).rgb),
            clamp(uShadowTexWeight, 0.0, 1.0)
          );
        }
        vec4 valueSample = vec4(0.0, 0.0, 0.5, 0.0);
        if (uHasValueTex > 0.5) {
          valueSample = texture2D(uValueTex, mainUv);
        }
        float skinMask = uHasValueTex > 0.5
          ? step(0.5, valueSample.r)
          : 0.0;
        float hMask = valueSample.b;
        float hAlpha = valueSample.a;
        float vertexOutlineIntensity = 1.0;
        float vertexRimMask = 1.0;
        #ifdef USE_COLOR
        vertexOutlineIntensity = clamp(vColor.r, 0.0, 1.0);
        vertexRimMask = clamp(vColor.g, 0.0, 1.0);
        #endif

        float halfNdl = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
        float materialShadowThreshold = clamp(uShadowThreshold, 0.0, 1.0);
        float shadowWidth = (uShadowWidthOverride >= 0.0)
          ? uShadowWidthOverride
          : uShadowWidth;
        float toonLuma = clamp((uUseLambert > 0.5 ? halfNdl : 1.0) + (uUseValueTex > 0.5 ? hMask * 2.0 - 1.0 : 0.0), 0.0, 1.0);
        float officialShadowBand = sekaiBaseShadow(
          ndl,
          hMask,
          uUseLambert,
          uUseValueTex,
          materialShadowThreshold,
          shadowWidth,
          uFadeMode
        );
        float valueShadowInfluence = clamp(uValueShadowInfluence, 0.0, 1.0);
        float geometricShadowBand = sekaiBaseShadow(
          ndl,
          0.5,
          uUseLambert,
          0.0,
          materialShadowThreshold,
          shadowWidth,
          uFadeMode
        );
        float shadowBand = mix(geometricShadowBand, officialShadowBand, valueShadowInfluence) * uShadowWeight;
        float litBand = clamp(1.0 - shadowBand, 0.0, 1.0);

        vec3 adjustedMainColor = applyMaterialHsvc(mainColor);
        vec3 fallbackShadowColor = mainColor * uShadowColor;
        vec3 weightedShadowColor = uUseShadowTex > 0.5
          ? shadowValue
          : mix(adjustedMainColor, fallbackShadowColor, clamp(uShadowTexWeight, 0.0, 1.0));
        vec3 shadowColor = weightedShadowColor;
        if (uBodyDebugMode > 0.5 && uBodyDebugMode < 12.5) {
          float debugValue = skinMask;
          if (uBodyDebugMode > 1.5 && uBodyDebugMode < 2.5) {
            gl_FragColor = vec4(outputColor(clamp(mainColor, 0.0, 1.0)), 1.0);
            return;
          } else if (uBodyDebugMode > 2.5 && uBodyDebugMode < 3.5) {
            float debugSkinValue = mix(
              mainColor.r,
              shadowValue.r,
              clamp(shadowBand, 0.0, 1.0)
            );
            vec3 debugSkinColor = applyMaterialHsvc(sekaiSkinRamp(
              debugSkinValue,
              mix(vec3(1.0), uGlobalShadowColor, clamp(uGlobalShadowAlpha, 0.0, 1.0)),
              uSkinColorDefault,
              uSkinColor1,
              uSkinColor2
            ));
            gl_FragColor = vec4(outputColor(clamp(debugSkinColor, 0.0, 1.0)), 1.0);
            return;
          } else if (uBodyDebugMode > 3.5 && uBodyDebugMode < 4.5) {
            debugValue = valueSample.r;
          } else if (uBodyDebugMode > 4.5 && uBodyDebugMode < 5.5) {
            debugValue = valueSample.g;
          } else if (uBodyDebugMode > 5.5 && uBodyDebugMode < 6.5) {
            debugValue = valueSample.b;
          } else if (uBodyDebugMode > 6.5 && uBodyDebugMode < 7.5) {
            debugValue = valueSample.a;
          } else if (uBodyDebugMode > 7.5 && uBodyDebugMode < 8.5) {
            debugValue = vertexOutlineIntensity;
          } else if (uBodyDebugMode > 8.5 && uBodyDebugMode < 9.5) {
            debugValue = vertexRimMask;
          } else if (uBodyDebugMode > 9.5 && uBodyDebugMode < 10.5) {
            debugValue = shadowBand;
          } else if (uBodyDebugMode > 10.5 && uBodyDebugMode < 11.5) {
            debugValue = halfNdl;
          } else if (uBodyDebugMode > 11.5 && uBodyDebugMode < 12.5) {
            debugValue = officialShadowBand;
          }
          gl_FragColor = vec4(outputColor(vec3(debugValue)), 1.0);
          return;
        }
        if (uBodyDebugMode > 23.5 && uBodyDebugMode < 24.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(toonLuma, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 24.5 && uBodyDebugMode < 25.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(1.0 - litBand, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 25.5 && uBodyDebugMode < 26.5) {
          gl_FragColor = vec4(outputColor(clamp(shadowColor, 0.0, 1.0)), 1.0);
          return;
        }
        vec3 globalShadow = mix(
          vec3(1.0),
          uGlobalShadowColor,
          clamp(uGlobalShadowAlpha, 0.0, 1.0)
        );
        vec3 baseShadedColor = mix(
          adjustedMainColor,
          weightedShadowColor * globalShadow,
          shadowBand
        );
        float skinValue = mix(
          mainColor.r,
          shadowValue.r,
          clamp(shadowBand, 0.0, 1.0)
        );
        vec3 skinColor = applyMaterialHsvc(sekaiSkinRamp(
          skinValue,
          globalShadow,
          uSkinColorDefault,
          uSkinColor1,
          uSkinColor2
        ));
        vec3 color = mix(baseShadedColor, skinColor, skinMask);

        float halfLambert = clamp(dot(normal, normalize(lightDir + viewDir)), 0.0, 1.0);
        float specEnabled = step(0.0001, uSpecularPower);
        float specPower = 10.0 / max(uSpecularPower, 0.0001);
        float specMask = hAlpha * specEnabled;
        float specular = pow(halfLambert, specPower) * specMask;
        vec3 specularAdd =
          uControllerSpecularColor *
          uControllerSpecularIntensity *
          specular;

        float nDotV = clamp(dot(normal, viewDir), 0.0, 1.0);
        vec3 rimDirection = normalize(uRimDirection);
        float nDotRim = dot(normal, rimDirection);
        float vDotRim = clamp(dot(viewDir, rimDirection), 0.0, 1.0);
        float rimFactorX = max(uControllerRimRange, 0.0);
        rimFactorX = rimFactorX > 10.0 ? rimFactorX * 0.01 : rimFactorX;
        rimFactorX = min(rimFactorX, 10.0);
        float rimFactorY = max(uControllerRimEdgeSmoothness, 0.00001);
        float rimFactorW = clamp(uControllerRimLightInfluence, 0.0, 1.0);
        float viewFresnel = pow(
          1.0 - nDotV,
          max(10.0 - clamp(rimFactorX, 0.0, 10.0), 0.001)
        );
        float directedRim = viewFresnel * mix(1.0, vDotRim, rimFactorW);
        float sidedRim = nDotRim < 0.05
          ? directedRim
          : directedRim * (1.0 - 2.0 * rimFactorW);
        float rim = sekaiSmooth01(clamp(
          (sidedRim - uRimThreshold) / rimFactorY,
          0.0,
          1.0
        ));
        float rimMask = vertexRimMask;
        vec3 controllerRimBase = mix(
          vec3(0.5),
          uControllerRimColor,
          clamp(uControllerRimColorWeight, 0.0, 1.0)
        );
        vec3 controllerShadowRimBase = mix(
          controllerRimBase,
          uControllerShadowRimColor,
          clamp(uControllerShadowRimColorWeight, 0.0, 1.0)
        );
        float rimShadowSharpness = clamp(
          uControllerRimShadowSharpness,
          0.0,
          1.0
        );
        float rimColorMix = sekaiSmooth01(clamp(
          (nDotRim - (rimShadowSharpness - 1.0)) /
            max(2.0 * (1.0 - rimShadowSharpness), 0.00001),
          0.0,
          1.0
        ));
        vec3 rimColor = mix(
          controllerRimBase,
          controllerShadowRimBase,
          rimColorMix
        );
        float rimGate = rimMask * max(uRimColorAlpha, 0.0);
        float rimScalar = rim * rimGate;
        vec3 rimAdd = rimColor * rimScalar;
        if (uBodyDebugMode > 15.5 && uBodyDebugMode < 16.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(specular, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 21.5 && uBodyDebugMode < 22.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(specMask, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 22.5 && uBodyDebugMode < 23.5) {
          gl_FragColor = vec4(outputColor(clamp(specularAdd * 8.0, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 16.5 && uBodyDebugMode < 17.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(rim, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 17.5 && uBodyDebugMode < 18.5) {
          gl_FragColor = vec4(outputColor(clamp(rimAdd * 4.0, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 18.5 && uBodyDebugMode < 19.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(rimGate * 4.0, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 19.5 && uBodyDebugMode < 20.5) {
          gl_FragColor = vec4(outputColor(clamp(rimColor, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 20.5 && uBodyDebugMode < 21.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(rimScalar * 8.0, 0.0, 1.0))), 1.0);
          return;
        }
        color += rimAdd;
        color += rimAdd * uControllerRimEmission;
        color += specularAdd;

        vec3 ambientTarget = sekaiApplyCharacterAmbient(
          color,
          uControllerAmbientColor,
          uControllerAmbientIntensity,
          vec4(uPartsAmbientColor, uPartsAmbientAlpha)
        );
        if (uBodyDebugMode > 12.5 && uBodyDebugMode < 13.5) {
          gl_FragColor = vec4(outputColor(clamp(ambientTarget, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 13.5 && uBodyDebugMode < 14.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(uControllerAmbientIntensity, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 14.5 && uBodyDebugMode < 15.5) {
          gl_FragColor = vec4(outputColor(clamp(uControllerAmbientColor, 0.0, 1.0)), 1.0);
          return;
        }
        color = ambientTarget;
        gl_FragColor = vec4(
          outputColor(clamp(color, 0.0, 1.0)),
          uUseMainTex > 0.5 ? mainSample.a : 1.0
        );
      }
    `
	});
}
function fr(t, n) {
	P(t.uniforms.uBaseColor.value, n.baseColor), P(t.uniforms.uShadowColor.value, n.shadowColor), P(t.uniforms.uSkinColorDefault.value, n.skinColorDefault ?? n.baseColor), P(t.uniforms.uSkinColor1.value, n.skinColor1 ?? n.shadowColor), P(t.uniforms.uSkinColor2.value, n.skinColor2 ?? n.skinColor1 ?? n.shadowColor), P(t.uniforms.uPartsAmbientColor.value, n.partsAmbientColor ?? "#ffffff"), t.uniforms.uPartsAmbientAlpha.value = n.partsAmbientAlpha ?? t.uniforms.uPartsAmbientAlpha.value, P(t.uniforms.uReflectionBlendColor.value, n.reflectionBlendColor ?? "#ffffff"), P(t.uniforms.uGlobalShadowColor.value, n.globalShadowColor ?? "#ffffff"), t.uniforms.uGlobalShadowAlpha.value = n.globalShadowAlpha ?? t.uniforms.uGlobalShadowAlpha.value, n.controllerAmbientColor !== void 0 && P(t.uniforms.uControllerAmbientColor.value, n.controllerAmbientColor), t.uniforms.uControllerAmbientIntensity.value = n.controllerAmbientIntensity ?? t.uniforms.uControllerAmbientIntensity.value, P(t.uniforms.uControllerSpecularColor.value, n.controllerSpecularColor ?? "#ffffff"), t.uniforms.uControllerSpecularIntensity.value = n.controllerSpecularIntensity ?? t.uniforms.uControllerSpecularIntensity.value, n.controllerRimColor !== void 0 && P(t.uniforms.uControllerRimColor.value, n.controllerRimColor), n.controllerShadowRimColor !== void 0 && P(t.uniforms.uControllerShadowRimColor.value, n.controllerShadowRimColor), t.uniforms.uControllerRimColorWeight.value = n.controllerRimColorWeight ?? t.uniforms.uControllerRimColorWeight.value, t.uniforms.uControllerShadowRimColorWeight.value = n.controllerShadowRimColorWeight ?? t.uniforms.uControllerShadowRimColorWeight.value, t.uniforms.uControllerRimRange.value = n.controllerRimRange ?? t.uniforms.uControllerRimRange.value, t.uniforms.uControllerRimEdgeSmoothness.value = n.controllerRimEdgeSmoothness ?? t.uniforms.uControllerRimEdgeSmoothness.value, t.uniforms.uControllerRimEmission.value = n.controllerRimEmission ?? t.uniforms.uControllerRimEmission.value, t.uniforms.uControllerRimLightInfluence.value = n.controllerRimLightInfluence ?? t.uniforms.uControllerRimLightInfluence.value, t.uniforms.uControllerRimShadowSharpness.value = n.controllerRimShadowSharpness ?? t.uniforms.uControllerRimShadowSharpness.value, n.bodyDebugMode !== void 0 && t.uniforms.uBodyDebugMode && (t.uniforms.uBodyDebugMode.value = n.bodyDebugMode), t.uniforms.uMainTex.value = n.mainTex ?? null, t.uniforms.uShadowTex.value = n.shadowTex ?? null, t.uniforms.uValueTex.value = n.valueTex ?? null, t.uniforms.uMainTexTransform.value = lr(n.mainTex), t.uniforms.uUseMainTex.value = +!!n.mainTex, t.uniforms.uUseShadowTex.value = +!!n.shadowTex, t.uniforms.uHasValueTex.value = +!!n.valueTex, t.uniforms.uUseValueTex.value = n.useValueTex ?? !!n.valueTex ? 1 : 0, t.uniforms.uAlphaCutoff && (t.uniforms.uAlphaCutoff.value = n.alphaCutoff ?? 0), t.uniforms.uLightDirection.value.copy(n.lightDirection.clone().normalize()), t.uniforms.uLightIntensity.value = n.lightIntensity, t.uniforms.uAmbientIntensity.value = n.ambientIntensity, t.uniforms.uShadowThreshold.value = n.shadowThreshold, t.uniforms.uShadowWeight.value = n.shadowWeight, t.uniforms.uShadowWidth.value = n.shadowWidth ?? t.uniforms.uShadowWidth.value, n.shadowFade !== void 0 && t.uniforms.uShadowFade && (t.uniforms.uShadowFade.value = n.shadowFade), n.shadowWidthOverride !== void 0 && t.uniforms.uShadowWidthOverride && (t.uniforms.uShadowWidthOverride.value = n.shadowWidthOverride ?? -1), n.valueShadowInfluence !== void 0 && t.uniforms.uValueShadowInfluence && (t.uniforms.uValueShadowInfluence.value = n.valueShadowInfluence), n.hairShadowEnabled !== void 0 && t.uniforms.uHairShadowEnabled && (t.uniforms.uHairShadowEnabled.value = +!!n.hairShadowEnabled), n.useLambert !== void 0 && t.uniforms.uUseLambert && (t.uniforms.uUseLambert.value = +!!n.useLambert), n.headPosition && t.uniforms.uHeadPosition && t.uniforms.uHeadPosition.value.copy(n.headPosition), n.headNormalBlend !== void 0 && t.uniforms.uHeadNormalBlend && (t.uniforms.uHeadNormalBlend.value = n.headNormalBlend), t.uniforms.uCharacterAmbientIntensity.value = n.characterAmbientIntensity ?? .3, t.uniforms.uRimColorAlpha.value = n.rimColorAlpha ?? t.uniforms.uRimColorAlpha.value, t.uniforms.uRimDirection.value.copy((n.rimDirection ?? new e.Vector3(S.x, S.y, S.z)).clone().normalize()), t.uniforms.uSpecularPower.value = n.specularPower ?? 0, t.uniforms.uRimThreshold.value = n.rimThreshold ?? .2, t.uniforms.uShadowTexWeight.value = n.shadowTexWeight ?? 1, t.uniforms.uFadeMode && (t.uniforms.uFadeMode.value = n.fadeMode ?? t.uniforms.uFadeMode.value), t.uniforms.uHueSinAngle && (t.uniforms.uHueSinAngle.value = n.hueSinAngle ?? t.uniforms.uHueSinAngle.value), t.uniforms.uHueCosAngle && (t.uniforms.uHueCosAngle.value = n.hueCosAngle ?? t.uniforms.uHueCosAngle.value), t.uniforms.uSaturation.value = n.saturation ?? t.uniforms.uSaturation.value, t.uniforms.uValue && (t.uniforms.uValue.value = n.value ?? t.uniforms.uValue.value), t.uniforms.uContrast && (t.uniforms.uContrast.value = n.contrast ?? t.uniforms.uContrast.value);
}
function pr(e, t) {
	e.uniforms.uCameraPosition.value.copy(t);
}
function mr(t) {
	return new e.ShaderMaterial({
		defines: { USE_UV1: "" },
		transparent: !1,
		depthWrite: !0,
		side: e.FrontSide,
		uniforms: {
			uBaseColor: { value: F(t.baseColor) },
			uWarmColor: { value: F(t.warmColor) },
			uSkinColorDefault: { value: F(t.skinColorDefault ?? t.baseColor) },
			uSkinColor1: { value: F(t.skinColor1 ?? t.warmColor) },
			uSkinColor2: { value: F(t.skinColor2 ?? t.warmColor) },
			uMainTex: { value: t.mainTex ?? null },
			uShadowTex: { value: t.shadowTex ?? null },
			uValueTex: { value: t.valueTex ?? null },
			uFaceShadowTex: { value: t.faceShadowTex ?? null },
			uMainTexTransform: { value: lr(t.mainTex) },
			uUseMainTex: { value: +!!t.mainTex },
			uUseShadowTex: { value: +!!t.shadowTex },
			uHasValueTex: { value: +!!t.valueTex },
			uUseValueTex: { value: t.useValueTex ?? !!t.valueTex ? 1 : 0 },
			uUseFaceShadowTex: { value: +!!t.faceShadowTex },
			uLightDirection: { value: t.lightDirection.clone().normalize() },
			uCameraPosition: { value: new e.Vector3() },
			uHeadDotDirectionalLight: { value: (t.headDotDirectionalLight ?? new e.Vector2(0, 0)).clone() },
			uUseFaceShadowLimiter: { value: t.useFaceShadowLimiter === !1 ? 0 : 1 },
			uFaceShadowLimitRange: { value: t.faceShadowLimitRange ?? 0 },
			uLightIntensity: { value: t.lightIntensity },
			uAmbientIntensity: { value: t.ambientIntensity },
			uFaceDebugMode: { value: t.faceDebugMode ?? 0 },
			uFaceSdfEnabled: { value: t.faceSdfEnabled && t.faceShadowTex ? 1 : 0 },
			uShadowThreshold: { value: t.shadowThreshold ?? .5 },
			uShadowWeight: { value: t.shadowWeight ?? 1 },
			uShadowWidth: { value: t.shadowWidth ?? 0 },
			uFadeMode: { value: t.fadeMode ?? 0 },
			uUseLambert: { value: t.useLambert === !1 ? 0 : 1 },
			uShadowTexWeight: { value: t.shadowTexWeight ?? 1 },
			uHueSinAngle: { value: t.hueSinAngle ?? 0 },
			uHueCosAngle: { value: t.hueCosAngle ?? 1 },
			uSaturation: { value: t.saturation ?? .5 },
			uValue: { value: t.value ?? .5 },
			uContrast: { value: t.contrast ?? .5 },
			uPartsAmbientColor: { value: F(t.partsAmbientColor ?? "#ffffff") },
			uPartsAmbientAlpha: { value: t.partsAmbientAlpha ?? 0 },
			uControllerAmbientColor: { value: cr(t.controllerAmbientColor, C.ambientColor) },
			uControllerAmbientIntensity: { value: t.controllerAmbientIntensity ?? 1 },
			uControllerSpecularColor: { value: cr(t.controllerSpecularColor, C.specularColor) },
			uControllerSpecularIntensity: { value: t.controllerSpecularIntensity ?? 1 },
			uControllerRimColor: { value: cr(t.controllerRimColor, C.rimColor) },
			uControllerShadowRimColor: { value: cr(t.controllerShadowRimColor, C.shadowRimColor) },
			uControllerRimColorWeight: { value: t.controllerRimColorWeight ?? 1 },
			uControllerShadowRimColorWeight: { value: t.controllerShadowRimColorWeight ?? 1 },
			uControllerRimRange: { value: t.controllerRimRange ?? C.rimRange },
			uControllerRimEdgeSmoothness: { value: t.controllerRimEdgeSmoothness ?? C.rimEdgeSmoothness },
			uControllerRimEmission: { value: t.controllerRimEmission ?? C.rimEmission },
			uControllerRimLightInfluence: { value: t.controllerRimLightInfluence ?? C.rimLightInfluence },
			uControllerRimShadowSharpness: { value: t.controllerRimShadowSharpness ?? C.rimShadowSharpness },
			uRimColorAlpha: { value: t.rimColorAlpha ?? C.rimColorAlpha },
			uRimDirection: { value: (t.rimDirection ?? new e.Vector3(S.x, S.y, S.z)).clone().normalize() },
			uSpecularPower: { value: t.specularPower ?? 0 },
			uRimThreshold: { value: t.rimThreshold ?? .2 },
			uGlobalShadowColor: { value: F(t.globalShadowColor ?? "#ffffff") },
			uGlobalShadowAlpha: { value: t.globalShadowAlpha ?? 1 },
			uAlphaCutoff: { value: t.alphaCutoff ?? 0 }
		},
		vertexColors: !0,
		vertexShader: "\n      #include <common>\n      #include <uv_pars_vertex>\n      #include <color_pars_vertex>\n      #include <skinning_pars_vertex>\n      #include <morphtarget_pars_vertex>\n\n      varying vec3 vWorldPosition;\n      varying vec3 vWorldNormal;\n      varying vec2 vUv;\n      varying vec2 vFaceShadowUv;\n\n      void main() {\n        #include <uv_vertex>\n        #include <color_vertex>\n        #include <beginnormal_vertex>\n        #include <morphnormal_vertex>\n        #include <skinbase_vertex>\n        #include <skinnormal_vertex>\n        #include <defaultnormal_vertex>\n        #include <begin_vertex>\n        #include <morphtarget_vertex>\n        #include <skinning_vertex>\n\n        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);\n        vWorldPosition = worldPosition.xyz;\n        vWorldNormal = inverseTransformDirection(\n          transformedNormal,\n          viewMatrix\n        );\n        vUv = uv;\n        #ifdef USE_UV1\n          vFaceShadowUv = uv1;\n        #else\n          vFaceShadowUv = uv;\n        #endif\n        gl_Position = projectionMatrix * viewMatrix * worldPosition;\n      }\n    ",
		fragmentShader: `
      #include <common>
      #include <color_pars_fragment>

      uniform vec3 uBaseColor;
      uniform vec3 uWarmColor;
      uniform vec3 uSkinColorDefault;
      uniform vec3 uSkinColor1;
      uniform vec3 uSkinColor2;
      uniform sampler2D uMainTex;
      uniform sampler2D uShadowTex;
      uniform sampler2D uValueTex;
      uniform sampler2D uFaceShadowTex;
      uniform mat3 uMainTexTransform;
      uniform float uUseMainTex;
      uniform float uUseShadowTex;
      uniform float uHasValueTex;
      uniform float uUseValueTex;
      uniform float uUseFaceShadowTex;
      uniform vec3 uLightDirection;
      uniform vec3 uCameraPosition;
      uniform vec2 uHeadDotDirectionalLight;
      uniform float uUseFaceShadowLimiter;
      uniform float uFaceShadowLimitRange;
      uniform float uLightIntensity;
      uniform float uAmbientIntensity;
      uniform float uFaceDebugMode;
      uniform float uFaceSdfEnabled;
      uniform float uShadowThreshold;
      uniform float uShadowWeight;
      uniform float uShadowWidth;
      uniform float uFadeMode;
      uniform float uUseLambert;
      uniform float uShadowTexWeight;
      uniform float uHueSinAngle;
      uniform float uHueCosAngle;
      uniform float uSaturation;
      uniform float uValue;
      uniform float uContrast;
      uniform vec3 uPartsAmbientColor;
      uniform float uPartsAmbientAlpha;
      uniform vec3 uControllerAmbientColor;
      uniform float uControllerAmbientIntensity;
      uniform vec3 uControllerSpecularColor;
      uniform float uControllerSpecularIntensity;
      uniform vec3 uControllerRimColor;
      uniform vec3 uControllerShadowRimColor;
      uniform float uControllerRimColorWeight;
      uniform float uControllerShadowRimColorWeight;
      uniform float uControllerRimRange;
      uniform float uControllerRimEdgeSmoothness;
      uniform float uControllerRimEmission;
      uniform float uControllerRimLightInfluence;
      uniform float uControllerRimShadowSharpness;
      uniform float uRimColorAlpha;
      uniform vec3 uRimDirection;
      uniform float uSpecularPower;
      uniform float uRimThreshold;
      uniform vec3 uGlobalShadowColor;
      uniform float uGlobalShadowAlpha;
      uniform float uAlphaCutoff;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      varying vec2 vFaceShadowUv;

      ${or}
      ${sr}
      ${ur}

      vec3 outputColor(vec3 color) {
        return color;
      }

      void main() {
        vec2 mainUv = (uMainTexTransform * vec3(vUv, 1.0)).xy;
        vec2 faceShadowUv = vFaceShadowUv;
        vec4 mainSample = vec4(1.0);
        vec3 mainColor = uBaseColor;
        if (uUseMainTex > 0.5) {
          mainSample = sekaiGammaTexture(texture2D(uMainTex, mainUv));
          if (uAlphaCutoff > 0.0 && mainSample.a < uAlphaCutoff) {
            discard;
          }
          mainColor = mainSample.rgb;
        }

        vec3 sampledShadow = uUseShadowTex > 0.5
          ? sekaiGammaTexture(texture2D(uShadowTex, mainUv).rgb)
          : uWarmColor;
        vec3 shadowColor = mix(mainColor, sampledShadow, clamp(uShadowTexWeight, 0.0, 1.0));
        vec4 valueSample = vec4(0.0, 0.0, 0.5, 0.0);
        if (uHasValueTex > 0.5) {
          valueSample = texture2D(uValueTex, mainUv);
        }
        float skinMask = uHasValueTex > 0.5
          ? step(0.5, valueSample.r)
          : 0.0;
        float shadowBand = sekaiBaseShadow(
          dot(normalize(vWorldNormal), normalize(uLightDirection)),
          valueSample.b,
          uUseLambert,
          uUseValueTex,
          uShadowThreshold,
          uShadowWidth,
          uFadeMode
        ) * uShadowWeight;
        float sdfValue = 0.0;
        float faceThreshold = 0.0;
        float faceShadow = 0.0;
        if ((uFaceSdfEnabled > 0.5 || uFaceDebugMode > 0.5) && uUseFaceShadowTex > 0.5) {
          float sdf0 = texture2D(uFaceShadowTex, faceShadowUv).r;
          float sdf1 = texture2D(
            uFaceShadowTex,
            vec2(-faceShadowUv.x, faceShadowUv.y)
          ).r;
          sdfValue = uHeadDotDirectionalLight.x <= 0.0 ? sdf1 : sdf0;
          faceThreshold = uHeadDotDirectionalLight.y;
          if (uUseFaceShadowLimiter > 0.5) {
            faceThreshold = min(
              max((1.0 - abs(2.0 * uHeadDotDirectionalLight.y - 1.0)) * 0.5, 0.0),
              uFaceShadowLimitRange
            );
          }
          faceThreshold = clamp(faceThreshold, 0.0, 1.0);
          faceShadow = sekaiFaceShadow(sdfValue, faceThreshold, uShadowWidth, uFadeMode);
          if (uFaceDebugMode > 0.5) {
            if (uFaceDebugMode < 1.5) {
              gl_FragColor = vec4(outputColor(vec3(sdfValue)), 1.0);
              return;
            }
            if (uFaceDebugMode < 2.5) {
              gl_FragColor = vec4(outputColor(vec3(faceShadow)), 1.0);
              return;
            }
            if (uFaceDebugMode < 3.5) {
              gl_FragColor = vec4(outputColor(vec3(faceThreshold)), 1.0);
              return;
            }
            if (uFaceDebugMode < 4.5) {
              gl_FragColor = vec4(outputColor(vec3(
                max(uHeadDotDirectionalLight.x, 0.0),
                max(-uHeadDotDirectionalLight.x, 0.0),
                uHeadDotDirectionalLight.y
              )), 1.0);
              return;
            }
            gl_FragColor = vec4(outputColor(vec3(uHeadDotDirectionalLight.y)), 1.0);
            return;
          }
          if (uFaceSdfEnabled > 0.5) {
            shadowBand = max(shadowBand, faceShadow);
          }
        }
        vec3 adjustedMainColor = sekaiApplyHsvc(
          mainColor,
          uHueSinAngle,
          uHueCosAngle,
          uSaturation,
          uValue,
          uContrast
        );
        vec3 globalShadow = mix(
          vec3(1.0),
          uGlobalShadowColor,
          clamp(uGlobalShadowAlpha, 0.0, 1.0)
        );
        vec3 baseShadedColor = mix(
          adjustedMainColor,
          shadowColor * globalShadow,
          clamp(shadowBand, 0.0, 1.0)
        );
        float skinValue = mix(
          mainColor.r,
          mix(mainColor.r, sampledShadow.r, clamp(uShadowTexWeight, 0.0, 1.0)),
          clamp(shadowBand, 0.0, 1.0)
        );
        vec3 skinColor = sekaiApplyHsvc(
          sekaiSkinRamp(
            skinValue,
            globalShadow,
            uSkinColorDefault,
            uSkinColor1,
            uSkinColor2
          ),
          uHueSinAngle,
          uHueCosAngle,
          uSaturation,
          uValue,
          uContrast
        );
        vec3 color = mix(baseShadedColor, skinColor, skinMask);

        vec3 normal = normalize(vWorldNormal);
        vec3 lightDir = normalize(uLightDirection);
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        float vertexRimMask = 1.0;
        #ifdef USE_COLOR
        vertexRimMask = clamp(vColor.g, 0.0, 1.0);
        #endif

        float halfLambert = clamp(
          dot(normal, normalize(lightDir + viewDir)),
          0.0,
          1.0
        );
        float specEnabled = step(0.0001, uSpecularPower);
        float specPower = 10.0 / max(uSpecularPower, 0.0001);
        float specular = pow(halfLambert, specPower) * valueSample.a * specEnabled;

        float nDotV = clamp(dot(normal, viewDir), 0.0, 1.0);
        vec3 rimDirection = normalize(uRimDirection);
        float nDotRim = dot(normal, rimDirection);
        float vDotRim = clamp(dot(viewDir, rimDirection), 0.0, 1.0);
        float rimRange = max(uControllerRimRange, 0.0);
        rimRange = rimRange > 10.0 ? rimRange * 0.01 : rimRange;
        rimRange = min(rimRange, 10.0);
        float rimSmoothness = max(uControllerRimEdgeSmoothness, 0.00001);
        float rimInfluence = clamp(uControllerRimLightInfluence, 0.0, 1.0);
        float viewFresnel = pow(
          1.0 - nDotV,
          max(10.0 - clamp(rimRange, 0.0, 10.0), 0.001)
        );
        float directedRim =
          viewFresnel * mix(1.0, vDotRim, rimInfluence);
        float sidedRim = nDotRim < 0.05
          ? directedRim
          : directedRim * (1.0 - 2.0 * rimInfluence);
        float rim = sekaiSmooth01(clamp(
          (sidedRim - uRimThreshold) / rimSmoothness,
          0.0,
          1.0
        ));
        vec3 controllerRimBase = mix(
          vec3(0.5),
          uControllerRimColor,
          clamp(uControllerRimColorWeight, 0.0, 1.0)
        );
        vec3 controllerShadowRimBase = mix(
          controllerRimBase,
          uControllerShadowRimColor,
          clamp(uControllerShadowRimColorWeight, 0.0, 1.0)
        );
        float rimShadowSharpness = clamp(
          uControllerRimShadowSharpness,
          0.0,
          1.0
        );
        float rimColorMix = sekaiSmooth01(clamp(
          (nDotRim - (rimShadowSharpness - 1.0)) /
            max(2.0 * (1.0 - rimShadowSharpness), 0.00001),
          0.0,
          1.0
        ));
        vec3 rimColor = mix(
          controllerRimBase,
          controllerShadowRimBase,
          rimColorMix
        );
        vec3 rimAdd = rimColor *
          rim *
          vertexRimMask *
          max(uRimColorAlpha, 0.0);
        color += rimAdd;
        color += rimAdd * uControllerRimEmission;
        color +=
          uControllerSpecularColor *
          uControllerSpecularIntensity *
          specular;

        color = sekaiApplyCharacterAmbient(
          color,
          uControllerAmbientColor,
          uControllerAmbientIntensity,
          vec4(uPartsAmbientColor, uPartsAmbientAlpha)
        );
        gl_FragColor = vec4(
          outputColor(clamp(color, 0.0, 1.0)),
          uUseMainTex > 0.5 ? mainSample.a : 1.0
        );
      }
    `
	});
}
function hr(e, t) {
	P(e.uniforms.uBaseColor.value, t.baseColor), P(e.uniforms.uWarmColor.value, t.warmColor), P(e.uniforms.uSkinColorDefault.value, t.skinColorDefault ?? t.baseColor), P(e.uniforms.uSkinColor1.value, t.skinColor1 ?? t.warmColor), P(e.uniforms.uSkinColor2.value, t.skinColor2 ?? t.warmColor), e.uniforms.uMainTex.value = t.mainTex ?? null, e.uniforms.uShadowTex.value = t.shadowTex ?? null, e.uniforms.uValueTex.value = t.valueTex ?? null, e.uniforms.uFaceShadowTex.value = t.faceShadowTex ?? null, e.uniforms.uMainTexTransform.value = lr(t.mainTex), e.uniforms.uUseMainTex.value = +!!t.mainTex, e.uniforms.uUseShadowTex.value = +!!t.shadowTex, e.uniforms.uHasValueTex.value = +!!t.valueTex, e.uniforms.uUseValueTex.value = t.useValueTex ?? !!t.valueTex ? 1 : 0, e.uniforms.uUseFaceShadowTex.value = +!!t.faceShadowTex, e.uniforms.uLightDirection.value.copy(t.lightDirection.clone().normalize()), gr(e, t.lightDirection, t.headDotDirectionalLight ?? e.uniforms.uHeadDotDirectionalLight?.value, t.useFaceShadowLimiter, t.faceShadowLimitRange), e.uniforms.uLightIntensity.value = t.lightIntensity, e.uniforms.uAmbientIntensity.value = t.ambientIntensity, e.uniforms.uShadowThreshold.value = t.shadowThreshold ?? e.uniforms.uShadowThreshold.value, e.uniforms.uShadowWeight.value = t.shadowWeight ?? e.uniforms.uShadowWeight.value, e.uniforms.uShadowWidth.value = t.shadowWidth ?? e.uniforms.uShadowWidth.value, e.uniforms.uFadeMode.value = t.fadeMode ?? e.uniforms.uFadeMode.value, e.uniforms.uUseLambert.value = t.useLambert === !1 ? 0 : 1, e.uniforms.uShadowTexWeight.value = t.shadowTexWeight ?? e.uniforms.uShadowTexWeight.value, e.uniforms.uHueSinAngle.value = t.hueSinAngle ?? e.uniforms.uHueSinAngle.value, e.uniforms.uHueCosAngle.value = t.hueCosAngle ?? e.uniforms.uHueCosAngle.value, e.uniforms.uSaturation.value = t.saturation ?? e.uniforms.uSaturation.value, e.uniforms.uValue.value = t.value ?? e.uniforms.uValue.value, e.uniforms.uContrast.value = t.contrast ?? e.uniforms.uContrast.value, P(e.uniforms.uPartsAmbientColor.value, t.partsAmbientColor ?? "#ffffff"), e.uniforms.uPartsAmbientAlpha.value = t.partsAmbientAlpha ?? e.uniforms.uPartsAmbientAlpha.value, t.controllerAmbientColor !== void 0 && P(e.uniforms.uControllerAmbientColor.value, t.controllerAmbientColor), e.uniforms.uControllerAmbientIntensity.value = t.controllerAmbientIntensity ?? e.uniforms.uControllerAmbientIntensity.value, t.controllerSpecularColor !== void 0 && P(e.uniforms.uControllerSpecularColor.value, t.controllerSpecularColor), e.uniforms.uControllerSpecularIntensity.value = t.controllerSpecularIntensity ?? e.uniforms.uControllerSpecularIntensity.value, t.controllerRimColor !== void 0 && P(e.uniforms.uControllerRimColor.value, t.controllerRimColor), t.controllerShadowRimColor !== void 0 && P(e.uniforms.uControllerShadowRimColor.value, t.controllerShadowRimColor), e.uniforms.uControllerRimColorWeight.value = t.controllerRimColorWeight ?? e.uniforms.uControllerRimColorWeight.value, e.uniforms.uControllerShadowRimColorWeight.value = t.controllerShadowRimColorWeight ?? e.uniforms.uControllerShadowRimColorWeight.value, e.uniforms.uControllerRimRange.value = t.controllerRimRange ?? e.uniforms.uControllerRimRange.value, e.uniforms.uControllerRimEdgeSmoothness.value = t.controllerRimEdgeSmoothness ?? e.uniforms.uControllerRimEdgeSmoothness.value, e.uniforms.uControllerRimEmission.value = t.controllerRimEmission ?? e.uniforms.uControllerRimEmission.value, e.uniforms.uControllerRimLightInfluence.value = t.controllerRimLightInfluence ?? e.uniforms.uControllerRimLightInfluence.value, e.uniforms.uControllerRimShadowSharpness.value = t.controllerRimShadowSharpness ?? e.uniforms.uControllerRimShadowSharpness.value, e.uniforms.uRimColorAlpha.value = t.rimColorAlpha ?? e.uniforms.uRimColorAlpha.value, t.rimDirection && e.uniforms.uRimDirection.value.copy(t.rimDirection).normalize(), e.uniforms.uSpecularPower.value = t.specularPower ?? e.uniforms.uSpecularPower.value, e.uniforms.uRimThreshold.value = t.rimThreshold ?? e.uniforms.uRimThreshold.value, P(e.uniforms.uGlobalShadowColor.value, t.globalShadowColor ?? "#ffffff"), e.uniforms.uGlobalShadowAlpha.value = t.globalShadowAlpha ?? e.uniforms.uGlobalShadowAlpha.value, e.uniforms.uAlphaCutoff.value = t.alphaCutoff ?? e.uniforms.uAlphaCutoff.value, t.faceDebugMode !== void 0 && (e.uniforms.uFaceDebugMode.value = t.faceDebugMode), e.uniforms.uFaceSdfEnabled && (e.uniforms.uFaceSdfEnabled.value = t.faceSdfEnabled && t.faceShadowTex ? 1 : 0);
}
function gr(e, t, n, r = !0, i = 0) {
	e.uniforms.uLightDirection?.value.copy(t).normalize(), n && e.uniforms.uHeadDotDirectionalLight && e.uniforms.uHeadDotDirectionalLight.value.copy(n), e.uniforms.uUseFaceShadowLimiter && (e.uniforms.uUseFaceShadowLimiter.value = +!!r), e.uniforms.uFaceShadowLimitRange && (e.uniforms.uFaceShadowLimitRange.value = i);
}
function _r(t, n = "alpha", r, i) {
	let a = n === "add" || n === "eyelight", o = n === "eyelight", s = r && r.tileX > 0 ? r.tileX : 1, c = r && r.tileY > 0 ? r.tileY : 1, l = Math.max(0, r?.sample ?? 0), u = (i?.vertexBViewOffset ?? 0) > 0, d = new e.ShaderMaterial({
		transparent: !0,
		depthWrite: !1,
		depthTest: !0,
		depthFunc: e.LessEqualDepth,
		side: e.DoubleSide,
		vertexColors: u,
		blending: a ? e.CustomBlending : e.NormalBlending,
		...a ? {
			blendSrc: e.SrcAlphaFactor,
			blendDst: e.OneFactor,
			blendEquation: e.AddEquation
		} : {},
		polygonOffset: !0,
		polygonOffsetFactor: o ? -.5 : -1,
		polygonOffsetUnits: o ? -.5 : -1,
		uniforms: {
			uMainTex: { value: t },
			uMainTexTransform: { value: lr(t) },
			uUseMainTex: { value: +!!t },
			uMode: { value: n === "eye" ? 1 : o ? 2 : 0 },
			uTintColor: { value: F(i?.tintColor ?? "#ffffff") },
			uEmissionColor: { value: F(i?.emissionColor ?? "#000000") },
			uAtlasTile: { value: new e.Vector2(s, c) },
			uAtlasSample: { value: l },
			uUseAtlas: { value: 0 },
			uTime: { value: 0 },
			uLightInfluence: { value: e.MathUtils.clamp(i?.lightInfluence ?? 1, 0, 1) },
			uHighlightInfluence: { value: e.MathUtils.clamp(i?.highlightInfluence ?? 1, 0, 1) },
			uVertexBViewOffset: { value: Math.max(0, i?.vertexBViewOffset ?? 0) },
			uDistortionFps: { value: Math.max(1, i?.distortionFps ?? 12) },
			uDistortionIntensity: { value: Math.max(0, i?.distortionIntensity ?? +!!o) },
			uDistortionIntensityXY: { value: new e.Vector2(Math.max(0, i?.distortionIntensityX ?? +!!o), Math.max(0, i?.distortionIntensityY ?? +!!o)) },
			uDistortionOffset: { value: new e.Vector2(i?.distortionOffsetX ?? 0, i?.distortionOffsetY ?? 0) },
			uDistortionScroll: { value: new e.Vector2(i?.distortionScrollX ?? .5, i?.distortionScrollY ?? .5) },
			uDistortionScrollSpeed: { value: i?.distortionScrollSpeed ?? 1 },
			uDistortionTexTiling: { value: new e.Vector2(Math.max(.001, i?.distortionTexTilingX ?? 1), Math.max(.001, i?.distortionTexTilingY ?? 1)) },
			uThreshold: { value: e.MathUtils.clamp(i?.threshold ?? .5, 0, 1) },
			uAlphaScale: { value: e.MathUtils.clamp(i?.alphaScale ?? 1, 0, 1) },
			uAlphaCutoff: { value: e.MathUtils.clamp(i?.alphaCutoff ?? .001, 0, 1) },
			uStrictAlpha: { value: +!!i?.strictAlpha },
			uAlphaSource: { value: 0 }
		},
		vertexShader: "\n      #include <common>\n      #include <uv_pars_vertex>\n      #include <color_pars_vertex>\n      #include <skinning_pars_vertex>\n      #include <morphtarget_pars_vertex>\n\n      uniform float uVertexBViewOffset;\n\n      varying vec2 vUv;\n      varying vec3 vViewNormal;\n\n      void main() {\n        #include <uv_vertex>\n        #include <color_vertex>\n        #include <beginnormal_vertex>\n        #include <morphnormal_vertex>\n        #include <skinbase_vertex>\n        #include <skinnormal_vertex>\n        #include <defaultnormal_vertex>\n        #include <begin_vertex>\n        #include <morphtarget_vertex>\n        #include <skinning_vertex>\n\n        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n        #ifdef USE_COLOR\n        mvPosition.z += clamp(vColor.b, 0.0, 1.0) * uVertexBViewOffset;\n        #endif\n        vUv = uv;\n        vViewNormal = normalize(normalMatrix * objectNormal);\n        gl_Position = projectionMatrix * mvPosition;\n      }\n    ",
		fragmentShader: `
      #include <common>

      uniform sampler2D uMainTex;
      uniform mat3 uMainTexTransform;
      uniform float uUseMainTex;
      uniform float uMode;
      uniform vec3 uTintColor;
      uniform vec3 uEmissionColor;
      uniform vec2 uAtlasTile;
      uniform float uAtlasSample;
      uniform float uUseAtlas;
      uniform float uTime;
      uniform float uLightInfluence;
      uniform float uHighlightInfluence;
      uniform float uDistortionFps;
      uniform float uDistortionIntensity;
      uniform vec2 uDistortionIntensityXY;
      uniform vec2 uDistortionOffset;
      uniform vec2 uDistortionScroll;
      uniform float uDistortionScrollSpeed;
      uniform vec2 uDistortionTexTiling;
      uniform float uThreshold;
      uniform float uAlphaScale;
      uniform float uAlphaCutoff;
      uniform float uStrictAlpha;
      uniform float uAlphaSource;

      varying vec2 vUv;
      varying vec3 vViewNormal;

      ${ur}

      vec3 outputColor(vec3 color) {
        return color;
      }

      void main() {
        vec2 uv = (uMainTexTransform * vec3(vUv, 1.0)).xy;
        if (uUseAtlas > 0.5) {
          vec2 tile = max(uAtlasTile, vec2(1.0));
          float sampleIndex = floor(max(uAtlasSample, 0.0));
          float tileX = mod(sampleIndex, tile.x);
          float tileY = floor(sampleIndex / tile.x);
          uv = (uv + vec2(tileX, tileY)) / tile;
        }
        if (uMode > 1.5) {
          float steppedTime = floor(uTime * uDistortionFps) / uDistortionFps;
          vec2 distortionUv = uv * uDistortionTexTiling
            + uDistortionOffset
            + uDistortionScroll * steppedTime * uDistortionScrollSpeed;
          vec2 proceduralDistortion = vec2(
            sin((distortionUv.x + distortionUv.y) * 6.2831853),
            cos((distortionUv.x - distortionUv.y) * 6.2831853)
          ) * 0.5 + vec2(
            sin(distortionUv.y * 12.5663706 + steppedTime),
            cos(distortionUv.x * 12.5663706 - steppedTime)
          ) * 0.25;
          float edge = 1.0 - clamp(abs(vViewNormal.z), 0.0, 1.0);
          vec2 normalDrift = normalize(vViewNormal.xy + vec2(0.0001)) * edge * 0.0045;
          vec2 distortion = proceduralDistortion * uDistortionIntensityXY * 0.0032 * uDistortionIntensity;
          uv += (normalDrift + distortion) * mix(0.25, 1.0, uHighlightInfluence);
        }
        vec4 sampleColor = uUseMainTex > 0.5
          ? sekaiGammaTexture(texture2D(uMainTex, uv))
          : vec4(1.0);
        float textureAlpha = sampleColor.a;
        float alpha = uAlphaSource > 1.5
          ? sampleColor.r
          : (uAlphaSource > 0.5 ? 1.0 : textureAlpha);
        if (uAlphaSource > 1.5 && sampleColor.r < uThreshold) {
          discard;
        }
        if (uAlphaSource < 0.5 && uMode > 1.5 && uStrictAlpha < 0.5) {
          float brightness = max(max(sampleColor.r, sampleColor.g), sampleColor.b);
          float alphaLow = mix(0.06, 0.16, uThreshold);
          float alphaHigh = mix(0.32, 0.55, uThreshold);
          float brightnessMask = smoothstep(alphaLow, alphaHigh, brightness);
          alpha = textureAlpha * brightnessMask;
        }
        if (alpha < max(uAlphaCutoff, 0.001)) {
          discard;
        }
        alpha *= uAlphaScale;
        if (alpha < 0.001) {
          discard;
        }
        vec3 color = sampleColor.rgb * uTintColor + uEmissionColor;
        if (uMode > 0.5 && uMode < 1.5) {
          color *= mix(1.0, 1.04, uLightInfluence);
        }
        if (uMode > 1.5) {
          float brightness = max(max(sampleColor.r, sampleColor.g), sampleColor.b);
          color = max(color, vec3(brightness) * uTintColor);
          color *= 1.05 + alpha * mix(0.65, 1.05, uHighlightInfluence);
          if (uAlphaSource < 0.5) {
            alpha = clamp(alpha * mix(1.1, 1.55, uHighlightInfluence), 0.0, 1.0);
          }
        }
        gl_FragColor = vec4(outputColor(clamp(color, 0.0, 1.0)), alpha);
      }
    `
	});
	return d.forceSinglePass = !0, d;
}
//#endregion
//#region src/engine/utjSpringBoneRuntime.ts
var vr = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), I = 1e-5, yr = .001, br = new e.Vector3(1, 0, 0);
function xr(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function Sr(e) {
	let t = e.parentRotation.clone().multiply(e.initialLocalRotation), n = e.boneAxis.clone().applyQuaternion(t);
	return e.headPosition.clone().addScaledVector(n, e.springLength);
}
function Cr(e, t) {
	let n = e.currTipPos.clone(), r = Sr(t).sub(e.currTipPos).multiplyScalar(t.stiffnessForce), i = t.springForce.clone().add(t.externalForce).add(r), a = e.currTipPos.clone().sub(e.prevTipPos).multiplyScalar(1 - t.dragForce);
	e.currTipPos.add(a).addScaledVector(i, t.deltaTime * t.deltaTime * .5), e.prevTipPos.copy(n), Tr(e.currTipPos, t.headPosition, t.springLength, t.lengthFallbackDirection ?? t.boneAxis);
}
function wr(e, t) {
	e.cachedMovement.copy(t).sub(e.cachedPosition), e.cachedPosition.copy(t);
}
function Tr(e, t, n, r = br) {
	let i = e.clone().sub(t);
	i.lengthSq() <= yr * yr && i.copy(r), i.normalize(), e.copy(t).addScaledVector(i, n);
}
function Er(t, n, r, i, a, o = br) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= yr) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function Dr(t) {
	if (t.targets.length === 0) return;
	let n = t.springConstant * t.deltaTime * t.deltaTime, r = new e.Vector3();
	for (let e of t.targets) {
		let i = t.currTipPos.clone().sub(e.position), a = i.length(), o = a - e.initialLength;
		r.addScaledVector(i, -(n * o) / a);
	}
	t.currTipPos.add(r);
}
function Or(e, t) {
	let n = 0, r = null;
	e.currTipPos.clone();
	for (let i of Gr(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = jr(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: kr(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && Hr(e, r, t.bounce, t.friction), n;
}
function kr(e, t, n, r, i) {
	return e.kind === "sphere" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i * e.worldToLocalRadiusScale,
		localSphereOrigin: e.localOffset.clone(),
		localSphereRadius: e.radius
	} : e.kind === "capsuleLocal" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i * e.worldToLocalRadiusScale,
		localCapsuleStart: e.localStart.clone(),
		localCapsuleEnd: e.localEnd.clone(),
		capsuleRadius: e.radius
	} : e.kind === "panel" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i * e.worldToLocalRadiusScale,
		panelWidth: e.width,
		panelHeight: e.height
	} : {
		kind: e.kind,
		localHeadPosition: t.clone(),
		localTailPositionBefore: n.clone(),
		localTailPositionAfter: r.clone(),
		localTailRadius: i,
		localCapsuleStart: e.start.clone(),
		localCapsuleEnd: e.end.clone(),
		capsuleRadius: e.radius
	};
}
function Ar(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, Nr(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, Er(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function jr(e, t, n, r, i) {
	return e.kind === "sphere" ? Fr(t, n, r, e) : e.kind === "capsule" ? Ir(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? Mr(t, n, r, i, e) : Lr(t, n, r, e);
}
function Mr(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r * a.worldToLocalRadiusScale;
	if (o.z >= s) return L(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return L(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i * a.worldToLocalLengthScale, f = 0, p = o.clone();
	if (o.z > 0 || u.z > 0) if (Math.abs(o.y) <= l && Math.abs(o.x) <= c) {
		if (f = Nr(u, d, p, s, 2), f === 0) return L(n);
	} else if (Math.abs(o.y) > l) {
		let t = o.y >= 0 ? l : -l, n = new e.Vector3(0, o.y - t, o.z);
		n.lengthSq() <= I * I ? n.set(0, 0, 0) : n.normalize(), p.set(o.x + n.x * s, t + n.y * s, n.z * s), f = 2;
	} else {
		let t = o.x >= 0 ? c : -c, n = new e.Vector3(o.x - t, 0, o.z);
		n.lengthSq() <= I * I ? n.set(0, 0, 0) : n.normalize(), p.set(t + n.x * s, o.y + n.y * s, n.z * s), f = 2;
	}
	else Math.abs(u.y) <= l ? Math.abs(u.x) <= c ? (f = 1, p.set(u.x, u.y, s)) : (f = 2, p.set(o.x < 0 ? -c : c, o.y, o.z)) : (f = 2, p.set(o.x, o.y >= 0 ? l : -l, o.z));
	return {
		status: f,
		tailPosition: p.applyMatrix4(a.localToWorldMatrix),
		hitNormal: Jr(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function Nr(e, t, n, r, i) {
	if (Yr(n, i) >= r) return 0;
	let a = Yr(e, i);
	if (a + t <= r) return n.copy(e), Xr(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = Yr(n, o) - Yr(e, o), l = Yr(n, s) - Yr(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		Xr(n, o, Yr(e, o) + c * f), Xr(n, s, Yr(e, s) + l * f), Xr(n, i, r);
	} else n.copy(e);
	return 2;
}
function Pr(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return L(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : qr(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= I * I ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = Br(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: qr(n.clone().sub(i), l)
	} : L(n);
	let d = Vr(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: qr(d.clone().sub(i), l)
	};
}
function Fr(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n * r.worldToLocalRadiusScale, s = r.radius, c = Pr(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? L(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: Jr(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function Ir(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= I * I) return Pr(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return L(n);
	if (l <= I) return Pr(t, n, r, i, o);
	if (l >= 1 - I) return Pr(t, n, r, a, o);
	let p = qr(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function Lr(e, t, n, r) {
	let i = Rr(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n * r.worldToLocalRadiusScale, r.localStart, r.localEnd, r.radius, 1);
	if (i.status === 0) return L(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = Jr(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function Rr(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return L(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? Pr(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : zr(t, n, r, o, s);
}
function zr(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return L(n);
	let c = Math.sqrt(s), l = c > I ? n.x / c : 0, u = c > I ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function Br(e, t, n, r) {
	let i = n.clone().sub(e), a = i.lengthSq(), o = Math.sqrt(a);
	if (o <= 0) return null;
	let s = i.multiplyScalar(1 / o), c = t * t, l = c + a - r * r, u = .5 / o, d = a * 4 * c - l * l;
	if (d < 0) return null;
	let f = l * u;
	return {
		origin: e.clone().addScaledVector(s, f),
		upVector: s,
		radius: u * Math.sqrt(d)
	};
}
function Vr(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= I || e.radius <= I ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function Hr(e, t, n, r, i = e.currTipPos) {
	let a = qr(t, br), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function Ur(e) {
	if (!e.limit.active) return !1;
	let t = e.vector, n = e.basisUp.dot(t), r = e.basisUp.clone().multiplyScalar(n), i = t.clone().sub(r), a = i.length(), o = i.multiplyScalar(1 / a), s = e.basisSide.dot(o), c = 180 / Math.PI * Math.asin(s < -1 ? -1 : Number.isNaN(s) ? 1 : Math.min(s, 1)), l = c - c * e.springStrength * e.deltaTime * e.deltaTime, u = l <= e.limit.max ? l : e.limit.max, d = l < e.limit.min ? e.limit.min : u, f = d >= 0 ? e.limit.max : e.limit.min, p = 0;
	if (f < -1e-4 || f > 1e-4) {
		let e = d / f;
		e >= 0 && (p = Math.min(e, 1));
	}
	let m = f * p, h = Math.PI / 180 * m, g = e.basisSide.clone().multiplyScalar(Math.sin(h)).addScaledVector(e.basisForward, Math.cos(h)).multiplyScalar(a);
	return t.copy(r).add(g), m !== l;
}
function Wr(t, n, r, i, a) {
	let o = r.clone().multiply(i), s = n.clone().sub(t).applyQuaternion(o.clone().invert());
	s.multiplyScalar(1 / s.length());
	let c = new e.Quaternion().setFromUnitVectors(a.clone(), s);
	return i.clone().multiply(c);
}
function L(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function Gr(e) {
	return [...e].sort((e, t) => Kr(e) - Kr(t));
}
function Kr(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function qr(e, t) {
	return e.lengthSq() <= I * I && e.copy(t), e.lengthSq() <= I * I && e.copy(br), e.normalize();
}
function Jr(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), qr(e, br);
}
function Yr(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function Xr(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityCoordinateConversion.ts
var Zr = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function Qr(t, n) {
	if (!t) return n.clone();
	let r = ii(t.x ?? t.X), i = ii(t.y ?? t.Y), a = ii(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function $r(t) {
	if (!t) return new e.Quaternion();
	let n = ii(t.x ?? t.X), r = ii(t.y ?? t.Y), i = ii(t.z ?? t.Z), a = ii(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : new e.Quaternion(n, r, i, a).normalize();
}
function ei(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function ti(e) {
	return ei(e);
}
function ni(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w).normalize();
}
function ri(e) {
	return ti(Zr[e]);
}
function ii(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var ai = 1401298464324817e-60, oi = ri("right"), si = ri("left"), ci = ri("back"), li = ri("down"), ui = class t {
	bones;
	missingNodes;
	skinnedBones;
	setupDiagnostics;
	externalForce = new e.Vector3(0, 0, 0);
	parentRotation = new e.Quaternion();
	headPosition = new e.Vector3();
	localRotation = new e.Quaternion();
	skinAnimationLocalRotation = new e.Quaternion();
	colliderLocalToWorld = new e.Matrix4();
	colliderWorldToLocal = new e.Matrix4();
	frameColliderCache = /* @__PURE__ */ new Map();
	angleVector = new e.Vector3();
	debugAnimatedTip = new e.Vector3();
	providerForce = new e.Vector3();
	providerWorldToLocal = new e.Matrix4();
	waveAxis = new e.Vector3();
	providerRight = new e.Vector3();
	providerUp = new e.Vector3();
	mainWindDirection = new e.Vector3();
	localBonePosition = new e.Vector3();
	additionalDirection = new e.Vector3();
	traceFilters = [];
	traceMaxEvents = 240;
	traceSequence = 0;
	traceEvents = [];
	constructor(e, t, n, r) {
		this.bones = e, this.missingNodes = t, this.skinnedBones = n, this.setupDiagnostics = r;
	}
	static fromPjskRuntimeExtension(e, n) {
		let r = ea(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = wi(n), a = Ci(r), o = Ai(n), s = [], c = Ii(r), l = _i(r, i, s, c), u = Mi(r), d = Ni(r), f = Pi(r, l), p = ji(r), m = vi(r, c), h = /* @__PURE__ */ new Set(), g = /* @__PURE__ */ new Map(), _ = [];
		for (let e of r.managers ?? []) {
			if (!Li(e.nodePath ?? e.poseRoot, c)) continue;
			let t = pi(i, e, g);
			for (let n of e.bonePathIds ?? []) {
				let o = p.get(n);
				if (!o || !Li(o.nodePath, c)) continue;
				let m = Ei(i, o.nodePath, o.runtimePartIndex);
				if (!m) {
					s.push(o.nodePath ?? o.nodeName ?? `bone:${n}`);
					continue;
				}
				if (h.has(m)) continue;
				let g = bi(o, m, a, i), v = Ei(i, o.pivotNodePath, o.runtimePartIndex), y = yi(r, e, o, u.get(n), d.get(n), e.pathId === void 0 ? void 0 : f.get(e.pathId), l), b = fi(e, o, m, g, v, Ri(i, o), t, y);
				b && (_.push(b), h.add(m));
			}
		}
		return _.sort((e, t) => Da(e.node) - Da(t.node)), _.length > 0 ? new t(_, s, o, m) : null;
	}
	getControlledTrackNodeNames() {
		return new Set(this.bones.map((e) => e.node.name).filter(Boolean));
	}
	setTraceBoneFilters(e, t = 240) {
		this.traceFilters = e.map((e) => e.trim().toLowerCase()).filter(Boolean), this.traceMaxEvents = Math.max(1, Math.trunc(t) || 240), this.traceSequence = 0, this.traceEvents.length = 0;
	}
	getTraceSnapshot() {
		return {
			filters: [...this.traceFilters],
			eventCount: this.traceEvents.length,
			events: this.traceEvents.map((e) => ({
				...e,
				collisionChecks: e.collisionChecks.map((e) => ({ ...e }))
			}))
		};
	}
	setTimelineControl(e) {
		for (let t of this.bones) t.stiffnessForce = va(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = va(e.dragForce, t.originalDragForce), t.windInfluence = va(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = va(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(e) {
		this.bones.some((e) => e.automaticUpdates && e.enabled && !e.isPaused) && this.preUpdateColliders();
		let t = this.collectWindVolumeOneSelfProviders(), n = new Set(t.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), r = new Set(t.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let t of this.bones) if (!(!t.automaticUpdates || !t.enabled)) {
			if (t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition), t.isPaused) {
				this.applyBoneRotation(t, Yi(t));
				continue;
			}
			!(t.managerPathId !== null && r.has(t.managerPathId) || t.isSumOfForcesOnBone) || t.managerPathId !== null && n.has(t.managerPathId) || (this.computeExternalForce(t, e), this.updateBoneSpringAndRotation(t, $i(e, t.simulationFrameRate, t.slowMotionScale), this.externalForce, Yi(t)));
		}
		for (let n of t) n.isActive && this.updateWindVolumeOneSelfLateUpdate(n, e);
	}
	collectWindVolumeOneSelfProviders() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.bones) for (let n of t.forceProviders) n.kind === "WindVolumeOneSelf" && e.add(n);
		return [...e];
	}
	updateWindVolumeOneSelfLateUpdate(e, t) {
		if (e.springManagerPathId === null) return;
		let n = e.simulationFrameRate > 0 ? 1 / e.simulationFrameRate : t;
		for (let r of this.bones) r.managerPathId !== e.springManagerPathId || !r.automaticUpdates || !r.enabled || r.isPaused || (this.computeWindVolumeOneSelfForce(e, r, t), this.externalForce.copy(r.gravity).add(this.providerForce), this.updateBoneSpringAndRotation(r, n, this.externalForce, r.isAnimated ? e.dynamicRatio : 1));
	}
	computeExternalForce(e, t) {
		this.externalForce.copy(e.gravity);
		for (let n of e.forceProviders) this.externalForce.add(this.computeForceProvider(n, e, t));
		return this.externalForce;
	}
	computeForceProvider(e, t, n) {
		return e.kind === "ForceVolume" ? (e.node.updateMatrixWorld(!0), this.providerForce.set(0, 0, 1).transformDirection(e.node.matrixWorld).multiplyScalar(e.strength)) : e.kind === "WindVolume" ? this.computeWindVolume(e, t) : this.computeWindVolumeOneSelfForce(e, t, n);
	}
	computeWindVolume(e, t) {
		let n = e.weight * e.strength;
		if (n <= ai || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).transformDirection(e.node.matrixWorld).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= ai || t.period <= ai) return this.providerForce.set(0, 0, 0);
		t.currentTime = _a(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), this.waveAxis.set(0, 1, 0).transformDirection(t.node.matrixWorld), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = _a(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(oi).transformDirection(t.node.matrixWorld), this.providerUp.set(0, 1, 0).transformDirection(t.node.matrixWorld), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, ai);
		n.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(t.node.matrixWorld).invert());
		let s = Math.PI * 2 / o, c = -this.localBonePosition.x, l = Math.sin(a + Math.sin(s * c) + Math.cos(s * this.localBonePosition.z));
		return this.mainWindDirection.set(0, 0, 1).transformDirection(t.node.matrixWorld).addScaledVector(this.waveAxis, t.amplitude * l).normalize(), this.additionalDirection.set(-Math.cos(e.MathUtils.degToRad(t.additionalWindAngle)), 0, -Math.sin(e.MathUtils.degToRad(t.additionalWindAngle))).normalize(), this.providerForce.copy(this.mainWindDirection).multiplyScalar(i).addScaledVector(this.additionalDirection, t.additionalWindStrength).multiplyScalar(n.windInfluence);
	}
	settleCurrentPose(e = 60, t = 1 / 60) {
		let n = Math.max(0, Math.floor(e));
		for (let e = 0; e < n; e += 1) this.update(t);
	}
	resetPose() {
		for (let e of this.bones) e.node.quaternion.copy(e.initialLocalRotation), e.skinAnimationLocalRotation.copy(e.initialLocalRotation), e.lastAppliedLocalRotation.copy(e.initialLocalRotation), e.hasAppliedLocalRotation = !1, e.node.scale.copy(e.initialLocalScale), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetStateToCurrentPose() {
		for (let e of this.bones) e.node.parent?.getWorldQuaternion(this.parentRotation), e.node.getWorldPosition(this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(Sr({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip), e.state.cachedPosition.copy(this.headPosition), e.state.cachedMovement.set(0, 0, 0), e.state.hitNormal.set(0, 0, 0), e.lastAppliedLocalRotation.copy(e.node.quaternion), e.hasAppliedLocalRotation = !1;
	}
	getSnapshot(t = !0, n = {}) {
		let r = /* @__PURE__ */ new Set(), i = [], a = [], o = 0, s = 0, c = 0, l = 0;
		for (let t of this.bones) {
			for (let e of t.colliders) r.add(e);
			t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition), this.debugAnimatedTip.copy(Sr({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: t.initialLocalRotation,
				boneAxis: t.boneAxis,
				springLength: t.springLength
			}));
			let n = this.debugAnimatedTip.distanceTo(t.state.currTipPos), u = t.node.name.toLowerCase(), d = t.state.currTipPos.clone().sub(this.debugAnimatedTip), f = t.state.currTipPos.clone().sub(t.state.prevTipPos), p = this.skinnedBones.has(t.node);
			u.includes("sleeve") && (o = Math.max(o, n)), u.includes("skirt") && (s = Math.max(s, n)), p ? c += 1 : l += 1, i.push({
				name: t.node.name,
				path: H(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: sa(t.tailBinding),
				offset: n,
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: Yi(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: na(t),
				animatedTipDelta: R(d),
				velocity: R(f),
				springForce: R(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(Wi)
			}), u.includes("skirt") && a.push({
				name: t.node.name,
				path: H(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: sa(t.tailBinding),
				offset: n,
				appliedRotationDegrees: e.MathUtils.radToDeg(t.skinAnimationLocalRotation.angleTo(t.node.quaternion)),
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastCollisionHitNormal: t.lastCollisionInfo ? R(t.lastCollisionInfo.hitNormal) : null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				dragForce: t.dragForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: Yi(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: na(t),
				animatedTipDelta: R(d),
				velocity: R(f),
				headMovement: R(t.state.cachedMovement),
				gravity: R(t.gravity),
				springForce: R(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(Wi)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = ta(i, n), d = di(this.bones, this.skinnedBones);
		return {
			runtimeMode: "unity-prefab",
			enabled: t,
			springCount: new Set(this.bones.map((e) => e.springName)).size,
			boneCount: this.bones.length,
			colliderCount: r.size,
			missingNodeCount: this.missingNodes.length,
			missingNodeSamples: this.missingNodes.slice(0, 96),
			setupDiagnostics: {
				...this.setupDiagnostics,
				activeRoots: [...this.setupDiagnostics.activeRoots]
			},
			maxSleeveOffset: o,
			maxSkirtOffset: s,
			topOffsets: i.slice(0, 8),
			debugOffsets: u,
			controlledPartCounts: d.counts,
			controlledHairSamples: d.hairSamples,
			skirtOffsets: a,
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(Wi),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(t, n, r, i) {
		t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition);
		let a = this.shouldTraceBone(t) ? this.createTraceEvent(t, n, r, i) : null;
		this.captureSkinAnimationLocalRotation(t), a && (a.skinAnimationLocalRotation = ia(t.skinAnimationLocalRotation)), wr(t.state, this.headPosition), a && (a.stateAfterCache = z(t.state)), Cr(t.state, {
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: t.initialLocalRotation,
			boneAxis: t.boneAxis,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(t.node.getWorldQuaternion(new e.Quaternion())),
			springLength: t.springLength,
			stiffnessForce: t.stiffnessForce,
			dragForce: t.dragForce,
			springForce: t.springForce,
			externalForce: r,
			deltaTime: n
		}), a && (a.stateAfterUpdateSpring = z(t.state)), this.applyLengthLimits(t, n), a && (a.stateAfterLengthLimits = z(t.state));
		let o = Math.abs(t.radius) * wa(t.node);
		a && (a.tailRadius = o);
		let s = t.collideWithGround ? Ar(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(t.node.getWorldQuaternion(new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		a && (a.groundHit = s, a.stateAfterGround = z(t.state)), t.lastCollisionInfo = null;
		let c = [], l = t.enableCollision ? this.buildWorldColliders(t.colliders) : [];
		t.lastCollisionStatus = !s && t.enableCollision ? Or(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			colliders: l,
			bounce: t.bounce,
			friction: t.friction,
			onColliderCheck: a ? (e, t) => {
				c.push(oa(e, t));
			} : void 0,
			onCollision: (e, n) => {
				t.lastCollisionInfo = {
					kind: e.kind,
					name: e.debugName ?? null,
					path: e.debugPath ?? null,
					sourcePathId: e.debugSourcePathId ?? null,
					hitNormal: n.hitNormal.clone()
				};
			}
		}) : 0, a && (a.collisionChecks = c, a.collisionStatus = t.lastCollisionStatus, a.stateAfterCollisions = z(t.state));
		let u = a ? aa(t) : void 0;
		t.lastAngleLimitApplied = t.enableAngleLimits ? this.applyAngleLimits(t, n, u) : !1, a && u && (a.angleLimit = u, a.stateAfterAngleLimits = z(t.state)), this.resetInvalidTipPosition(t), this.applyBoneRotation(t, i), a && (a.finalLocalRotation = ia(t.node.quaternion), this.pushTraceEvent(a));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: t.node.getWorldPosition(new e.Vector3()),
			initialLength: t.initialLength
		}));
		Dr({
			currTipPos: t.state.currTipPos,
			springConstant: t.springConstant,
			deltaTime: n,
			targets: r
		});
	}
	applyAngleLimits(e, t, n) {
		if (!e.yAngleLimit && !e.zAngleLimit) return !1;
		let r = e.pivotNode ?? e.node.parent ?? e.node;
		r.updateMatrixWorld(!0), this.angleVector.copy(e.state.currTipPos).sub(e.state.cachedPosition);
		let i = si.clone().transformDirection(r.matrixWorld), a = ci.clone().transformDirection(r.matrixWorld), o = li.clone().transformDirection(r.matrixWorld);
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = H(r) || null, n.vectorBefore = R(this.angleVector), n.forward = R(i), n.back = R(a), n.down = R(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = Ur({
				basisSide: o,
				basisUp: a,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.yAngleLimit,
				vector: this.angleVector
			});
			n && (n.yApplied = r, n.afterY = R(this.angleVector)), s = r || s;
		}
		if (e.zAngleLimit) {
			let r = Ur({
				basisSide: a,
				basisUp: o,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.zAngleLimit,
				vector: this.angleVector
			});
			n && (n.zApplied = r, n.afterZ = R(this.angleVector)), s = r || s;
		}
		return e.state.currTipPos.copy(e.state.cachedPosition).add(this.angleVector), n && (n.vectorAfter = R(this.angleVector)), s;
	}
	applyBoneRotation(e, t = e.dynamicRatio) {
		this.resetInvalidTipPosition(e), this.localRotation.copy(Wr(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy(Oa(e.skinAnimationLocalRotation, this.localRotation, t)), e.lastAppliedLocalRotation.copy(e.node.quaternion), e.hasAppliedLocalRotation = !0, e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	captureSkinAnimationLocalRotation(e) {
		this.skinAnimationLocalRotation.copy(e.node.quaternion), !(e.hasAppliedLocalRotation && ka(this.skinAnimationLocalRotation, e.lastAppliedLocalRotation)) && e.skinAnimationLocalRotation.copy(this.skinAnimationLocalRotation);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(Sr({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip));
	}
	shouldTraceBone(e) {
		if (this.traceFilters.length === 0) return !1;
		let t = e.node.name.toLowerCase(), n = H(e.node).toLowerCase(), r = e.springName.toLowerCase();
		return this.traceFilters.some((e) => t.includes(e) || n.includes(e) || r.includes(e));
	}
	createTraceEvent(e, t, n, r) {
		return {
			sequence: this.traceSequence,
			springName: e.springName,
			boneName: e.node.name,
			bonePath: H(e.node),
			sourceBoneName: e.sourceBoneName,
			sourceBonePath: e.sourceBonePath,
			sourceBonePathId: e.sourceBonePathId,
			pivotSourceName: e.pivotSourceName,
			pivotSourcePath: e.pivotSourcePath,
			pivotResolvedPath: e.pivotResolvedPath,
			tailBinding: sa(e.tailBinding),
			managerPathId: e.managerPathId,
			deltaTime: t,
			dynamicRatio: r,
			automaticUpdates: e.automaticUpdates,
			enabled: e.enabled,
			enableCollision: e.enableCollision,
			enableAngleLimits: e.enableAngleLimits,
			enableLengthLimits: e.enableLengthLimits,
			colliderCount: e.colliders.length,
			forceProviderCount: e.forceProviders.length,
			headPosition: R(this.headPosition),
			parentRotation: ia(this.parentRotation),
			initialLocalRotation: ia(e.initialLocalRotation),
			skinAnimationLocalRotation: ia(e.skinAnimationLocalRotation),
			boneAxis: R(e.boneAxis),
			boneAxisSource: e.boneAxisSource,
			springLength: e.springLength,
			radius: e.radius,
			tailRadius: 0,
			stiffnessForce: e.stiffnessForce,
			dragForce: e.dragForce,
			springForce: R(e.springForce),
			gravity: R(e.gravity),
			externalForce: R(n),
			stateBefore: z(e.state),
			stateAfterCache: z(e.state),
			animatedTip: R(Sr({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: e.initialLocalRotation,
				boneAxis: e.boneAxis,
				springLength: e.springLength
			})),
			stateAfterUpdateSpring: z(e.state),
			stateAfterLengthLimits: z(e.state),
			groundHit: !1,
			stateAfterGround: z(e.state),
			collisionStatus: 0,
			collisionChecks: [],
			stateAfterCollisions: z(e.state),
			angleLimit: aa(e),
			stateAfterAngleLimits: z(e.state),
			finalLocalRotation: ia(e.node.quaternion)
		};
	}
	pushTraceEvent(e) {
		for (this.traceSequence += 1, this.traceEvents.push({ ...e }); this.traceEvents.length > this.traceMaxEvents;) this.traceEvents.shift();
	}
	buildWorldColliders(e) {
		let t = [];
		for (let n of e) {
			let e = this.frameColliderCache.get(n) ?? this.createWorldCollider(n);
			e && t.push(e);
		}
		return t;
	}
	preUpdateColliders() {
		this.frameColliderCache.clear();
		let e = /* @__PURE__ */ new Set();
		for (let t of this.bones) for (let n of t.colliders) e.add(n);
		let t = [...e].sort((e, t) => Sa(e.source) - Sa(t.source));
		for (let e of t) {
			let t = this.createWorldCollider(e);
			t && this.frameColliderCache.set(e, t);
		}
	}
	createWorldCollider(e) {
		let t = e.source.shape, n = e.source.enabled !== !1, r = n && e.source.linkedRendererEnabled !== !1;
		return t?.sphere ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "sphere",
			enabled: n,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? H(e.node),
			debugSourcePathId: e.source.pathId,
			localOffset: ua(t.sphere.offset),
			radius: Math.max(0, t.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ta(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Ea(this.colliderLocalToWorld),
			lossyScaleX: Ca(e.node)
		}) : t?.capsule ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: r,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? H(e.node),
			debugSourcePathId: e.source.pathId,
			localStart: ua(t.capsule.offset),
			localEnd: ua(t.capsule.tail),
			radius: Math.max(0, t.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ta(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Ea(this.colliderLocalToWorld),
			lossyScaleX: Ca(e.node)
		}) : t?.panel ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "panel",
			enabled: r,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? H(e.node),
			debugSourcePathId: e.source.pathId,
			width: Math.max(0, t.panel.width ?? 0),
			height: Math.max(0, t.panel.height ?? 0),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ta(this.colliderWorldToLocal),
			worldToLocalLengthScale: Ta(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Ea(this.colliderLocalToWorld)
		}) : null;
	}
};
function di(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = ca(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
		o || (o = {
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			sourceRoot: e,
			count: 0,
			sampleNames: [],
			samplePaths: []
		}, n.set(a, o)), o.count += 1, o.sampleNames.length < 6 && (o.sampleNames.push(i.node.name), o.samplePaths.push(H(i.node))), r.length < 12 && (i.runtimePartType === "hair" || i.node.name.toLowerCase().includes("hair") || (i.sourceBonePath ?? "").toLowerCase().includes("hair")) && r.push({
			name: i.node.name,
			path: H(i.node),
			sourceBonePath: i.sourceBonePath,
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			resolvedIsSkinnedBone: t.has(i.node)
		});
	}
	return {
		counts: [...n.values()].sort((e, t) => (e.runtimePartIndex ?? -1) - (t.runtimePartIndex ?? -1) || String(e.runtimePartType ?? "").localeCompare(String(t.runtimePartType ?? "")) || String(e.sourceRoot ?? "").localeCompare(String(t.sourceRoot ?? ""))),
		hairSamples: r
	};
}
function fi(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = r.getWorldPosition(new e.Vector3()), d = l.clone().sub(u).length(), f = r.quaternion.clone(), p = da(r, l), m = e.MathUtils.clamp(V(t.dynamicRatio) ?? .5, 0, 1), h = o.map((t) => ({
		node: t.node,
		initialLength: t.node.getWorldPosition(new e.Vector3()).distanceTo(l)
	})), g = n.rawStiffnessForce ?? 300, _ = n.rawDragForce ?? n.dragForce ?? .4, v = Math.max(0, n.rawWindInfluence ?? 1), y = V(t.slowMotionScale) ?? 1, b = t.isPaused === !0;
	return {
		managerPathId: V(t.pathId),
		runtimePartIndex: V(n.runtimePartIndex) ?? V(t.runtimePartIndex),
		runtimePartType: n.runtimePartType ?? t.runtimePartType ?? n.partKind ?? t.partKind ?? null,
		springName: `${t.partKind ?? n.partKind ?? "Part"}:${t.nodeName ?? t.pathId ?? "manager"}`,
		sourceBoneName: n.nodeName ?? null,
		sourceBonePath: n.nodePath ?? null,
		sourceBonePathId: V(n.pathId),
		pivotSourceName: n.pivotNodeName ?? null,
		pivotSourcePath: n.pivotNodePath ?? null,
		pivotResolvedPath: a ? H(a) : null,
		tailBinding: i,
		automaticUpdates: t.automaticUpdates !== !1,
		enabled: t.enabled !== !1 && n.enabled !== !1,
		enableLengthLimits: t.enableLengthLimits !== !1,
		enableAngleLimits: t.enableAngleLimits !== !1,
		enableCollision: t.enableCollision !== !1,
		collideWithGround: t.collideWithGround === !0,
		groundHeight: t.groundHeight ?? 0,
		isSumOfForcesOnBone: t.isSumOfForcesOnBone !== !1,
		isPaused: b,
		gravity: ua(t.rawGravity),
		forceProviders: s,
		node: r,
		state: xr(u, l),
		initialLocalRotation: f,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: f.clone(),
		lastAppliedLocalRotation: f.clone(),
		hasAppliedLocalRotation: !1,
		boneAxis: p.axis,
		boneAxisSource: p.source,
		springLength: d,
		dynamicRatio: m,
		isAnimated: Xi(n, r, t),
		simulationFrameRate: V(t.simulationFrameRate) ?? 60,
		slowMotionScale: y,
		bounce: V(t.bounce) ?? 0,
		friction: V(t.friction) ?? 1,
		radius: Math.max(0, n.hitRadius ?? .05),
		stiffnessForce: g,
		dragForce: _,
		windInfluence: v,
		originalStiffnessForce: g,
		originalDragForce: _,
		originalWindInfluence: v,
		springForce: ua(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: h,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: Ji(n.rawAngleLimits?.y),
		zAngleLimit: Ji(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function pi(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = mi(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = hi(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function mi(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function hi(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = Ei(t, n.nodePath, n.runtimePartIndex) ?? gi(t, n.nodeName), c = n.raw ?? {};
	if (!s || !ma(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: V(n.sourcePathId),
		node: s,
		springManagerPathId: V(n.springManagerPathId) ?? ha(c, "<SpringManager>k__BackingField") ?? ha(c, "_SpringManager_k__BackingField") ?? ha(c, "springManager")
	};
	return o ? {
		kind: "ForceVolume",
		...l,
		strength: B(c, "strength", 0)
	} : a ? {
		kind: "WindVolume",
		...l,
		weight: B(c, "weight", 0),
		strength: B(c, "strength", 0),
		period: B(c, "period", 0),
		positionalMultiplier: B(c, "positionalMultiplier", 0),
		timeFactor: B(c, "timeFactor", 0),
		offsetVector: pa(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: ma(c, "isActive", !1),
		dynamicRatio: e.MathUtils.clamp(B(c, "dynamicRatio", .5), 0, 1),
		simulationFrameRate: Math.max(0, B(c, "simulationFrameRate", 60)),
		weight: B(c, "weight", 0),
		strength: B(c, "strength", 0),
		period: B(c, "period", 0),
		currentTime: B(c, "currentTime", 0),
		spinPeriod: B(c, "spinPeriod", 0),
		spinTime: B(c, "spinTime", 0),
		amplitude: B(c, "amplitude", 0),
		peakDistance: B(c, "peakDistance", 0),
		additionalWindAngle: B(c, "additionalWindAngle", 0),
		additionalWindStrength: B(c, "additionalWindStrength", 0)
	};
}
function gi(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function _i(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !Li(a.nodePath, r)) continue;
		let e = Ei(t, a.nodePath, a.runtimePartIndex);
		if (!e) {
			n.push(a.nodePath ?? a.nodeName ?? `collider:${a.index}`);
			continue;
		}
		i.set(a.index, {
			source: a,
			node: e
		});
	}
	return i;
}
function vi(e, t) {
	return {
		managerCount: e.managers?.length ?? 0,
		boneSourceCount: e.bones?.length ?? 0,
		colliderSourceCount: e.colliders?.length ?? 0,
		bindingDecisionCount: e.bindingDecisions?.length ?? 0,
		managerColliderCacheCount: e.managerColliderCaches?.length ?? 0,
		activeRootCount: t.size,
		activeRoots: [...t].sort()
	};
}
function yi(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [Ui(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${qi(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = zi(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = Vi(c, a), s = Hi(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [Ui(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${qi(a)}`, l)]
		};
	}
	let l = Gi((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [Ui(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${qi(a)}`, l)]
	};
}
function bi(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = n.getWorldPosition(new e.Vector3()), o = ri("right").transformDirection(n.matrixWorld), s = a.clone().addScaledVector(o, -.1), c = t.nodePath ? Di(r, t.nodePath, t.runtimePartIndex) : void 0, l = c ? xi(c, r, i, t.runtimePartIndex) : [], u = l.map((e) => e.source.name ?? e.node.name), d = l.map((e) => e.source.transformPath ?? H(e.node));
	if (l.length === 0) return {
		mode: "fallback",
		childCount: 0,
		childNames: u,
		childPaths: d,
		childSources: [],
		tailPosition: s
	};
	if (l.length === 1) return {
		mode: "singleChild",
		childCount: 1,
		childNames: u,
		childPaths: d,
		childSources: l.map((e) => e.source),
		tailPosition: l[0].node.getWorldPosition(new e.Vector3())
	};
	let f = new e.Vector3(), p = 0;
	for (let t of l) {
		let n = t.node.getWorldPosition(new e.Vector3());
		f.add(n), p += n.distanceTo(a);
	}
	f.multiplyScalar(1 / l.length), p /= l.length;
	let m = f.sub(a);
	return {
		mode: "averageChildren",
		childCount: l.length,
		childNames: u,
		childPaths: d,
		childSources: l.map((e) => e.source),
		tailPosition: m.lengthSq() <= 1e-8 ? a.clone() : a.clone().addScaledVector(m.normalize(), p)
	};
}
function xi(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !Si(e, t)) continue;
		let o = Ei(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function Si(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function Ci(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(Oi(e.runtimePartIndex, e.transformPath), e));
	for (let t of e.prefabGraphs ?? []) for (let e of t.monoBehaviours ?? []) if (e.scriptName?.toLowerCase() === "springbonepivot" && e.transformPath) {
		a.add(e.transformPath);
		let t = n.get(e.transformPath);
		typeof t?.pathId == "number" && i.add(t.pathId);
	}
	return {
		transformByPathId: t,
		transformByPath: n,
		transformByPartPath: r,
		pivotTransformPathIds: i,
		pivotTransformPaths: a
	};
}
function wi(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = H(i, e);
		if (!a) return;
		t.set(a, i);
		let o = ba(i, e);
		o && o !== a && r.set(o, i);
		let s = ki(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(Oi(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function Ti(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function Ei(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(Oi(n, t));
		if (r) return r;
	}
	return Ti(e, t);
}
function Di(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(Oi(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function Oi(e, t) {
	return `${e}:${t}`;
}
function ki(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function Ai(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function ji(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function Mi(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Ni(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Pi(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e.managerColliderCaches ?? []) {
		if (typeof r.managerPathId != "number") continue;
		let e = /* @__PURE__ */ new Set();
		for (let n of [
			...r.sphereColliderIndexes ?? [],
			...r.capsuleColliderIndexes ?? [],
			...r.panelColliderIndexes ?? []
		]) {
			let i = typeof n == "number" ? t.get(n) : void 0;
			typeof n == "number" && i && Fi(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function Fi(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function Ii(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => la(e)).filter((e) => !!e));
}
function Li(e, t) {
	if (t.size === 0) return !0;
	let n = la(ca(e));
	return n !== null && t.has(n);
}
function Ri(e, t) {
	let n = [];
	for (let r of t.lengthLimitTargets ?? []) {
		let i = Ei(e, r.nodePath, r.runtimePartIndex ?? t.runtimePartIndex);
		i && n.push({
			node: i,
			initialLength: 0
		});
	}
	return n;
}
function zi(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function Bi(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function Vi(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = Bi(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function Hi(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = la(ca(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	if (t.partKind === "Head" || o === "face") {
		let t = la(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
		if (t && a.has(t)) return {
			root: t,
			reason: "head/face uses runtime defaultBodyRoot"
		};
		if (a.has("body")) return {
			root: "body",
			reason: "head/face body fallback"
		};
	}
	let s = la(r?.defaultRoot);
	if (s && a.has(s)) return {
		root: s,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = la(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let c = la(i?.defaultRoot);
	return c && a.has(c) ? {
		root: c,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: c ? `binding.defaultRoot ${c} not available after manager cache` : "no matching root"
	};
}
function Ui(e, t, n, r, i, a, o, s, c) {
	return {
		sourceKind: r?.sourceKind ?? n?.sourceKind ?? "direct",
		colliderFlag: r?.colliderFlag ?? n?.colliderFlag ?? null,
		colliderGroupIndex: null,
		springName: `${e.partKind ?? t.partKind ?? "Part"}:${e.nodeName ?? e.pathId ?? "manager"}`,
		boneName: t.nodeName ?? null,
		bonePath: t.nodePath ?? null,
		sourceSpringBonePathId: V(t.pathId),
		candidateRoots: i ? [...i.entries()].map(([e, t]) => ({
			root: e,
			colliderCount: t.length,
			colliderSourcePathIds: t.map((e) => e.source.pathId).filter((e) => typeof e == "number")
		})) : [],
		defaultRoot: la(a),
		selectedRoot: o,
		selectedColliderCount: c.length,
		selectedColliderSourcePathIds: c.map((e) => e.source.pathId).filter((e) => typeof e == "number"),
		selectionReason: s
	};
}
function Wi(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function Gi(e, t, n) {
	let r = Ki(t, n);
	if (!r) return e;
	let i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t.source.nodeName ?? t.source.scriptName ?? "", n = i.get(e);
		n ? n.push(t) : i.set(e, [t]);
	}
	return e.filter((e) => {
		let t = e.source.nodeName ?? e.source.scriptName ?? "", n = i.get(t);
		return !n || n.length <= 1 || !n.some((e) => e.source.nodePath?.startsWith(r)) || e.source.nodePath?.startsWith(r);
	});
}
function Ki(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function qi(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function Ji(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function Yi(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function Xi(e, t, n) {
	let r = Qi(n.animatedBoneNames);
	return r.size === 0 ? !1 : Zi(t.name, r) || typeof e.nodeName == "string" && Zi(e.nodeName, r);
}
function Zi(e, t) {
	if (t.has(e)) return !0;
	for (let n of t) if (n.length > 0 && e.includes(n)) return !0;
	return !1;
}
function Qi(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function $i(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function ea(e) {
	let t = ya(e), n = ya(t?.pjskSpringBone ?? t?.PjskSpringBone), r = ya(n?.runtimeUnitySetup ?? n?.RuntimeUnitySetup), i = r?.version;
	return i === "0414" || i === 414 ? r : null;
}
function R(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		length: e.length()
	};
}
function ta(e, t) {
	if (t.springDebugAllOffsets) return e;
	let n = (t.springDebugBones ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean);
	return n.length === 0 ? [] : e.filter((e) => {
		let t = [
			e.name,
			e.path,
			e.springName,
			e.sourceBoneName,
			e.sourceBonePath,
			e.pivotSourceName,
			e.pivotSourcePath,
			e.pivotResolvedPath
		].filter((e) => typeof e == "string").join("\n").toLowerCase();
		return n.some((e) => t.includes(e));
	});
}
function na(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function ra(e) {
	return e ? R(e) : null;
}
function ia(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		w: e.w
	};
}
function z(e) {
	return {
		currTipPos: R(e.currTipPos),
		prevTipPos: R(e.prevTipPos),
		hitNormal: R(e.hitNormal),
		cachedPosition: R(e.cachedPosition),
		cachedMovement: R(e.cachedMovement)
	};
}
function aa(e) {
	return {
		enabled: e.enableAngleLimits,
		hasPivot: !!e.pivotNode,
		pivotName: e.pivotNode?.name || null,
		pivotPath: e.pivotNode && H(e.pivotNode) || null,
		vectorBefore: null,
		forward: null,
		back: null,
		down: null,
		yApplied: !1,
		zApplied: !1,
		afterY: null,
		afterZ: null,
		vectorAfter: null
	};
}
function oa(e, t) {
	return {
		kind: e.kind,
		name: e.debugName ?? null,
		path: e.debugPath ?? null,
		sourcePathId: e.debugSourcePathId ?? null,
		enabled: e.enabled !== !1,
		status: t.status,
		beforeTailPosition: R(t.beforeTailPosition),
		afterTailPosition: R(t.afterTailPosition),
		hitNormal: R(t.hitNormal),
		localHeadPosition: ra(t.details.localHeadPosition),
		localTailPositionBefore: ra(t.details.localTailPositionBefore),
		localTailPositionAfter: ra(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: ra(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: ra(t.details.localCapsuleStart),
		localCapsuleEnd: ra(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function sa(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: R(e.tailPosition)
	};
}
function ca(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function la(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function ua(t) {
	return ti(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : Qr(t, new e.Vector3()));
}
function da(e, t) {
	e.updateMatrixWorld(!0);
	let n = fa(e.worldToLocal(t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: oi.clone(),
		source: "fallback-local-tip"
	};
}
function fa(e) {
	return e.lengthSq() <= 1e-5 * 1e-5 ? null : e.clone().normalize();
}
function B(e, t, n) {
	return V(e[t] ?? e[ga(t)]) ?? n;
}
function pa(t, n) {
	let r = t[n] ?? t[ga(n)];
	return Array.isArray(r) || typeof r == "object" && r ? ua(r) : new e.Vector3();
}
function ma(e, t, n) {
	let r = e[t] ?? e[ga(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function ha(e, t) {
	let n = ya(e[t] ?? e[ga(t)]);
	return V(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function ga(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function _a(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function va(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function V(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function ya(e) {
	return e && typeof e == "object" ? e : null;
}
function H(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function ba(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(xa(r.name)), r = r.parent;
	return n.join("/");
}
function xa(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function Sa(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function Ca(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function wa(e) {
	let t = e.matrixWorld.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Ta(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Ea(e) {
	let t = e.clone();
	return t.setPosition(0, 0, 0), t.invert().transpose();
}
function Da(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function Oa(t, n, r) {
	let i = e.MathUtils.clamp(r, 0, 1), a = n.x, o = n.y, s = n.z, c = n.w;
	return t.dot(n) < 0 && (a = -a, o = -o, s = -s, c = -c), new e.Quaternion(t.x + (a - t.x) * i, t.y + (o - t.y) * i, t.z + (s - t.z) * i, t.w + (c - t.w) * i).normalize();
}
function ka(e, t) {
	return Math.abs(e.x - t.x) < 1e-6 && Math.abs(e.y - t.y) < 1e-6 && Math.abs(e.z - t.z) < 1e-6 && Math.abs(e.w - t.w) < 1e-6;
}
//#endregion
//#region src/engine/sekaiExtraBoneRuntime.ts
var Aa = Math.PI / 180, ja = [
	"XYZ",
	"XZY",
	"YXZ",
	"YZX",
	"ZXY",
	"ZYX"
], Ma = class t {
	entries;
	sourceEuler = new e.Euler();
	targetEuler = new e.Euler();
	targetQuaternion = new e.Quaternion();
	constructor(e) {
		this.entries = e;
	}
	static fromPjskRuntimeExtension(n, r) {
		let i = Pa(n);
		if (!i.length) return null;
		r.updateMatrixWorld(!0);
		let a = Ia(r), o = [];
		for (let t of i) {
			let n = t.GameObject ?? t.gameObject ?? null, r = t.ReferenceBone ?? t.referenceBone ?? null, i = za(a, Ga(n?.TransformPath ?? n?.transformPath), Ga(n?.Name ?? n?.name)), s = za(a, Ga(r?.TransformPath ?? r?.transformPath), Ga(r?.Name ?? r?.name));
			if (!i || !s) continue;
			let c = ja[Wa(t.RotationOrder ?? t.rotationOrder, 0)] ?? "XYZ", l = Fa(t, c);
			o.push({
				node: i,
				referenceNode: s,
				coefficient: Wa(t.Coefficient ?? t.coefficient, 1),
				defaultQuaternion: new e.Quaternion().setFromEuler(l),
				axisX: Ka(t.AxisX ?? t.axisX, !0),
				axisY: Ka(t.AxisY ?? t.axisY, !0),
				axisZ: Ka(t.AxisZ ?? t.axisZ, !0),
				order: c
			});
		}
		return o.sort((e, t) => Va(e.referenceNode) - Va(t.referenceNode)), o.length ? new t(o) : null;
	}
	update() {
		for (let e of this.entries) {
			this.sourceEuler.setFromQuaternion(e.referenceNode.quaternion, e.order);
			let t = Math.sign(e.coefficient);
			this.targetEuler.set(0, 0, 0, e.order), e.axisX && (this.targetEuler.x = this.sourceEuler.x * t), e.axisY && (this.targetEuler.y = this.sourceEuler.y * t), e.axisZ && (this.targetEuler.z = this.sourceEuler.z * t), this.targetQuaternion.setFromEuler(this.targetEuler), Na(e.node.quaternion, e.defaultQuaternion, this.targetQuaternion, Math.abs(e.coefficient)), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
		}
	}
	getControlledTrackNodeNames() {
		return new Set(this.entries.map((e) => e.node.name).filter(Boolean));
	}
};
function Na(t, n, r, i) {
	let a = e.MathUtils.clamp(i, 0, 1), o = n.dot(r) < 0 ? -1 : 1;
	return t.set(e.MathUtils.lerp(n.x, r.x * o, a), e.MathUtils.lerp(n.y, r.y * o, a), e.MathUtils.lerp(n.z, r.z * o, a), e.MathUtils.lerp(n.w, r.w * o, a)).normalize();
}
function Pa(e) {
	let t = Ha(e), n = Ha(t?.pjskSpringBone ?? t?.PjskSpringBone), r = Ha(n?.raw ?? n?.Raw), i = [];
	for (let e of [r?.body ?? r?.Body, r?.head ?? r?.Head]) {
		let t = Ha(e), n = t?.extraBones ?? t?.ExtraBones;
		Array.isArray(n) && i.push(...n.filter(Ua));
	}
	return i;
}
function Fa(t, n) {
	let r = Ha(t.DefaultEulerAngles ?? t.defaultEulerAngles) ?? {}, i = Wa(r.X ?? r.x, 0), a = Wa(r.Y ?? r.y, 0), o = Wa(r.Z ?? r.z, 0);
	return new e.Euler(i * Aa, -a * Aa, -o * Aa, n);
}
function Ia(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	return e.traverse((r) => {
		if (r !== e) {
			let e = n.get(r.name) ?? [];
			e.push(r), n.set(r.name, e);
		}
		for (let n of La(e, r)) t.set(n, r);
	}), {
		nodeByPath: t,
		nodeByName: n
	};
}
function La(e, t) {
	let n = Ra(t, e);
	if (!n) return [];
	let r = [n];
	return n.startsWith("body/") && r.push(`sit_body/${n.slice(5)}`), r;
}
function Ra(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function za(e, t, n) {
	for (let n of Ba(t)) {
		let t = e.nodeByPath.get(n);
		if (t) return t;
	}
	return n ? e.nodeByName.get(n)?.[0] ?? null : null;
}
function Ba(e) {
	if (!e) return [];
	let t = [e];
	return e.startsWith("sit_body/") && t.push(`body/${e.slice(9)}`), t;
}
function Va(e) {
	let t = 0, n = e.parent;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function Ha(e) {
	return e && typeof e == "object" ? e : null;
}
function Ua(e) {
	return !!Ha(e);
}
function Wa(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Ga(e) {
	return typeof e == "string" ? e : null;
}
function Ka(e, t) {
	return typeof e == "boolean" ? e : typeof e == "number" ? e !== 0 : t;
}
//#endregion
//#region src/kernel/renderRecipe.ts
function qa(e) {
	let t = String(e.roleId ?? "").trim();
	if (!/^\d+(?::[A-Za-z0-9_/-]+)?$/.test(t)) throw Error("roleId must be '<characterId>:<unit>' or '<characterId>'.");
	let n = e.bodyRoleId == null ? t : String(e.bodyRoleId).trim();
	if (!/^\d+(?::[A-Za-z0-9_/-]+)?$/.test(n)) throw Error("bodyRoleId must be '<characterId>:<unit>', '<characterId>', or null.");
	let r = (t) => {
		let n = e[t];
		if (!Number.isInteger(n) || Number(n) <= 0) throw Error(`${t} must be a positive integer.`);
		return Number(n);
	}, i = e.headPackagePath, a = i == null ? null : String(i).trim();
	if (a !== null && (a.length === 0 || a.length > 1024 || a.includes("\0"))) throw Error("headPackagePath must be null or a non-empty string of at most 1024 characters without NUL bytes.");
	let o = e.headOptionalCostume3dId == null ? null : r("headOptionalCostume3dId");
	return {
		roleId: t,
		bodyRoleId: n,
		bodyCostume3dId: r("bodyCostume3dId"),
		headCostume3dId: r("headCostume3dId"),
		headPackagePath: a,
		hairCostume3dId: r("hairCostume3dId"),
		headOptionalCostume3dId: o
	};
}
//#endregion
//#region src/engine/cameraRuntime.ts
var Ja = new e.Vector3(.04835, .48222, .07241), Ya = new e.Vector3(-.08532, .12848, 1.93551), Xa = 35, Za = -.0245, Qa = .765, U = {
	zoomDuration: .35,
	bottomLowerLimitPosition: .4,
	bottomUpperLimitPosition: .85,
	topLowerLimitPosition: 1.25,
	topUpperLimitPosition: .85,
	nearZ: 2.3,
	farZ: 4.5,
	fov: 25
};
function $a(e) {
	let t = Ja.clone().multiplyScalar(e);
	return {
		target: t,
		position: t.clone().add(Ya.clone().multiplyScalar(e)),
		fov: Xa,
		costumeShopState: null
	};
}
function eo(t) {
	let n = t === "official-default" ? {
		cameraRootYawDegrees: 0,
		zoomValue: 0,
		zoomMoveValue: 1
	} : {
		cameraRootYawDegrees: 0,
		zoomValue: U.zoomDuration,
		zoomMoveValue: 0
	}, r = e.MathUtils.clamp(n.zoomValue, 0, U.zoomDuration), i = U.zoomDuration > 0 ? r / U.zoomDuration : 0, a = e.MathUtils.lerp(U.bottomLowerLimitPosition, U.bottomUpperLimitPosition, i), o = e.MathUtils.lerp(U.topLowerLimitPosition, U.topUpperLimitPosition, i), s = e.MathUtils.clamp(n.zoomMoveValue, 0, 1), c = t === "full-body" ? Qa : e.MathUtils.lerp(a, o, s), l = e.MathUtils.lerp(U.nearZ, U.farZ, i), u = e.MathUtils.degToRad(n.cameraRootYawDegrees), d = new e.Vector3(0, c, l);
	return {
		target: new e.Vector3(0, c, 0),
		position: d.clone().applyAxisAngle(new e.Vector3(0, 1, 0), u),
		fov: U.fov,
		costumeShopState: {
			cameraRootYawDegrees: n.cameraRootYawDegrees,
			zoomValue: r,
			zoomMoveValue: s,
			zoomRatio: i,
			localCameraPosition: d,
			localCameraRotationYDegrees: 180
		}
	};
}
function to(t, n, r, i) {
	let a = n.clone().sub(t).normalize(), o = new e.Vector3().crossVectors(a, new e.Vector3(0, 1, 0)).normalize().multiplyScalar(Za * r * i);
	return {
		target: n.clone().add(o),
		position: t.clone().add(o)
	};
}
//#endregion
//#region src/engine/captureBackground.ts
function no(t, n) {
	let r = io(t, n), i = new e.CanvasTexture(r);
	return i.colorSpace = e.SRGBColorSpace, i;
}
function ro(e) {
	let t = e >>> 0;
	return () => (t = t * 1664525 + 1013904223 >>> 0, t / 4294967296);
}
function io(e, t) {
	let n = document.createElement("canvas");
	n.width = e, n.height = t;
	let r = n.getContext("2d");
	if (!r) return n;
	let i = r.createLinearGradient(0, t, e, 0);
	i.addColorStop(0, "#f9fffe"), i.addColorStop(.52, "#edfaff"), i.addColorStop(1, "#fff8fe"), r.fillStyle = i, r.fillRect(0, 0, e, t);
	let a = r.createLinearGradient(0, 0, e, t);
	a.addColorStop(0, "rgba(255, 246, 252, 0.34)"), a.addColorStop(1, "rgba(219, 246, 255, 0.40)"), r.fillStyle = a, r.fillRect(0, 0, e, t), r.fillStyle = "rgba(255, 255, 255, 0.48)", r.fillRect(0, 0, e, t);
	let o = ro(e * 73856093 ^ t * 19349663), s = [
		[
			166,
			236,
			255
		],
		[
			214,
			206,
			255
		],
		[
			255,
			204,
			238
		],
		[
			255,
			237,
			182
		]
	], c = e / Math.max(t, 1), l = Math.min(.12, Math.max(0, (c - 1) * .08)), u = (e, t, n, i, a, o) => {
		r.save(), r.translate(e, t), r.rotate(n), r.beginPath();
		for (let e = 0; e < 3; e += 1) {
			let t = -Math.PI / 2 + e * Math.PI * 2 / 3, n = Math.cos(t) * i * .56, a = Math.sin(t) * i * .56;
			e === 0 ? r.moveTo(n, a) : r.lineTo(n, a);
		}
		r.closePath(), r.fillStyle = `rgba(${a[0]}, ${a[1]}, ${a[2]}, ${o})`, r.fill(), r.restore();
	}, d = (n, r) => {
		for (let i = 0; i < n; i += 1) {
			let n = o(), i, a;
			if (n < .78) {
				let n = o();
				n < .26 ? (i = (-.04 + o() * .22) * e, a = o() * t) : n < .5 ? (i = (.82 - l + o() * (.21 + l)) * e, a = o() * t) : n < .78 ? (i = o() * e, a = (-.04 + o() * (.24 + l * .5)) * t) : (i = o() * e, a = (.8 - l * .8 + o() * (.23 + l * .8)) * t);
			} else i = (.12 + o() * .76) * e, a = (.12 + o() * .76) * t;
			let c = (i - e * .5) / e * 2, d = (a - t * .5) / t * 2, f = Math.max(.28, c * c + d * d), p = r * (.72 + o() * .46) * f, m = (.08 + o() * .13) * Math.min(1.25, f + .25);
			u(i, a, o() * Math.PI * 2, p, s[Math.floor(o() * s.length)], m);
		}
	}, f = Math.min(e, t) / 1e3;
	return d(Math.max(8, Math.round(18 * f)), 150 * f), d(Math.max(24, Math.round(80 * f)), 72 * f), n;
}
//#endregion
//#region src/engine/projectedShadow.ts
var ao = ["Left_Toe", "Right_Toe"], oo = .015, so = .01, co = {
	width: .72,
	height: 1.06,
	opacity: .28,
	crossSize: .46,
	crossOpacity: .22,
	floorY: 0,
	adjustShadow: !1,
	adjustAlpha: !0,
	invisibleHeight: .2,
	directionalShadow: !1
}, lo = class {
	group = new e.Group();
	defaultDirection = new e.Vector3(-.35, 0, .94).normalize();
	settings = { ...co };
	pairs = [];
	constructor() {
		let t = uo();
		for (let n of ao) {
			let r = this.createShadowMaterial(t, this.settings.opacity), i = this.createShadowMaterial(t, this.settings.crossOpacity), a = new e.Group(), o = new e.Group(), s = new e.Mesh(new e.PlaneGeometry(1, 1), r);
			s.name = `CharacterDirectionalShadow_${n}`, s.rotation.x = -Math.PI / 2, s.renderOrder = -100, s.scale.set(this.settings.width, this.settings.height, 1), a.add(s);
			let c = new e.Mesh(new e.PlaneGeometry(1, 1), i);
			c.name = `CharacterCrossShadow_${n}`, c.rotation.x = -Math.PI / 2, c.renderOrder = -99, c.scale.set(this.settings.crossSize, this.settings.crossSize, 1), o.add(c), a.visible = this.settings.directionalShadow, o.visible = !this.settings.directionalShadow, this.group.add(a, o), this.pairs.push({
				targetWorldPosition: new e.Vector3(),
				initialToeHeight: null,
				directionalAnchor: a,
				crossAnchor: o,
				directionalMaterial: r,
				crossMaterial: i,
				directionalAlpha: this.settings.opacity
			});
		}
		this.group.name = "CharacterProjectedShadow", this.group.visible = !1;
	}
	setSettings(e = {}) {
		this.settings = fo(e, this.settings);
		for (let e of this.pairs) e.directionalAnchor.children[0]?.scale.set(this.settings.width, this.settings.height, 1), e.crossAnchor.children[0]?.scale.set(this.settings.crossSize, this.settings.crossSize, 1), e.directionalAnchor.visible = this.settings.directionalShadow, e.crossAnchor.visible = !this.settings.directionalShadow;
	}
	update(e) {
		let t = e.targetWorldPositions;
		if (this.group.visible = e.visible && t.length > 0, !this.group.visible) {
			for (let e of this.pairs) e.initialToeHeight = null, e.targetWorldPosition.set(0, 0, 0);
			return;
		}
		for (let [n, r] of this.pairs.entries()) {
			let i = t[n];
			if (!i) {
				r.directionalAnchor.visible = !1, r.crossAnchor.visible = !1, r.initialToeHeight = null, r.targetWorldPosition.set(0, 0, 0);
				continue;
			}
			r.targetWorldPosition.copy(i), r.initialToeHeight ??= i.y, r.directionalAnchor.visible = this.settings.directionalShadow, r.crossAnchor.visible = !this.settings.directionalShadow;
			let a = this.resolveDirection(i, e.lightWorldPosition), o = (i.y - this.settings.floorY) / Math.max(.001, e.characterHeight), s = this.settings.height * o, c = i.x + a.x * s, l = i.z + a.z * s;
			r.directionalAnchor.position.set(this.settings.adjustShadow ? i.x : c, this.settings.floorY + so, this.settings.adjustShadow ? i.z : l), r.directionalAnchor.rotation.y = Math.atan2(a.x, a.z), r.directionalAlpha = this.calculateDirectionalAlpha(r, i.y), r.directionalMaterial.opacity = r.directionalAlpha;
			let u = (i.y - this.settings.floorY) / this.settings.invisibleHeight, d = u < 0 ? 1 : 1 - Math.min(u, 1);
			r.crossAnchor.position.set(i.x, this.settings.floorY + oo, i.z), r.crossMaterial.opacity = this.settings.crossOpacity * d;
		}
	}
	getDebugSnapshot(t) {
		let n = this.pairs[0];
		n.directionalAnchor.updateMatrixWorld(!0), n.crossAnchor.updateMatrixWorld(!0);
		let r = new e.Vector3(0, 0, 1).applyQuaternion(n.directionalAnchor.getWorldQuaternion(new e.Quaternion())).normalize(), i = this.pairs.reduce((e, t) => e.add(t.targetWorldPosition), new e.Vector3()).multiplyScalar(1 / Math.max(this.pairs.length, 1));
		return {
			visible: this.group.visible,
			floorY: Number(this.settings.floorY.toFixed(4)),
			characterHeight: Number(t.toFixed(4)),
			settings: { ...this.settings },
			targetPosition: po(i),
			targetPositions: this.pairs.map((e) => po(e.targetWorldPosition)),
			directional: {
				position: po(n.directionalAnchor.position),
				forward: po(r),
				scale: po(new e.Vector3(this.settings.width, 1, this.settings.height)),
				opacity: Number(n.directionalMaterial.opacity.toFixed(4)),
				alpha: Number(n.directionalAlpha.toFixed(4))
			},
			cross: {
				position: po(n.crossAnchor.position),
				scale: po(new e.Vector3(this.settings.crossSize, 1, this.settings.crossSize)),
				opacity: Number(n.crossMaterial.opacity.toFixed(4))
			},
			pairs: this.pairs.map((e) => ({
				targetPosition: po(e.targetWorldPosition),
				directionalOpacity: Number(e.directionalMaterial.opacity.toFixed(4)),
				crossOpacity: Number(e.crossMaterial.opacity.toFixed(4))
			}))
		};
	}
	dispose() {
		let e = /* @__PURE__ */ new Set();
		this.group.traverse((t) => {
			let n = t;
			if (!n.isMesh) return;
			n.geometry.dispose();
			let r = Array.isArray(n.material) ? n.material : [n.material];
			for (let t of r) {
				let n = t.map;
				n && e.add(n), t.dispose();
			}
		});
		for (let t of e) t.dispose();
	}
	createShadowMaterial(t, n) {
		return new e.MeshBasicMaterial({
			color: "#000000",
			map: t,
			transparent: !0,
			opacity: n,
			depthWrite: !1,
			depthTest: !0,
			polygonOffset: !0,
			polygonOffsetFactor: -1,
			side: e.DoubleSide
		});
	}
	calculateDirectionalAlpha(e, t) {
		if (!this.settings.adjustAlpha) return this.settings.opacity;
		let n = (t - (e.initialToeHeight ?? this.settings.floorY)) / this.settings.invisibleHeight, r = n < 0 ? 1 : 1 - Math.min(n, 1);
		return this.settings.opacity * r;
	}
	resolveDirection(t, n) {
		if (!n) return this.defaultDirection.clone();
		let r = new e.Vector3(t.x - n.x, 0, t.z - n.z);
		return r.lengthSq() < 1e-6 ? this.defaultDirection.clone() : r.normalize();
	}
};
function uo(t = 128) {
	let n = document.createElement("canvas");
	n.width = t, n.height = t;
	let r = n.getContext("2d");
	if (!r) throw Error("Canvas 2D context is required for projected shadow texture.");
	let i = r.createRadialGradient(t * .5, t * .5, t * .05, t * .5, t * .5, t * .5);
	i.addColorStop(0, "rgba(0, 0, 0, 0.72)"), i.addColorStop(.45, "rgba(0, 0, 0, 0.32)"), i.addColorStop(1, "rgba(0, 0, 0, 0.0)"), r.fillStyle = i, r.fillRect(0, 0, t, t);
	let a = new e.CanvasTexture(n);
	return a.colorSpace = e.NoColorSpace, a.wrapS = e.ClampToEdgeWrapping, a.wrapT = e.ClampToEdgeWrapping, a.needsUpdate = !0, a;
}
function fo(t, n) {
	let r = (e, t, n = 0) => Number.isFinite(e) ? Math.max(e, n) : t, i = (t, n) => Number.isFinite(t) ? e.MathUtils.clamp(t, 0, 1) : n;
	return {
		width: r(t.width, n.width, .001),
		height: r(t.height, n.height, .001),
		opacity: i(t.opacity, n.opacity),
		crossSize: r(t.crossSize, n.crossSize, .001),
		crossOpacity: i(t.crossOpacity, n.crossOpacity),
		floorY: Number.isFinite(t.floorY) ? t.floorY : n.floorY,
		adjustShadow: t.adjustShadow ?? n.adjustShadow,
		adjustAlpha: t.adjustAlpha ?? n.adjustAlpha,
		invisibleHeight: r(t.invisibleHeight, n.invisibleHeight, .001),
		directionalShadow: t.directionalShadow ?? n.directionalShadow
	};
}
function po(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
//#endregion
//#region src/engine/prefabNodeLookup.ts
function mo(e) {
	let t = /* @__PURE__ */ new Map();
	return e.traverse((n) => {
		if (n === e || !n.name) return;
		let r = [], i = [], a = n;
		for (; a && a !== e;) a.name && (r.push(a.name), i.push(a.name.replace(/_\d+$/, ""))), a = a.parent;
		r.reverse(), i.reverse();
		for (let e = 0; e < r.length; e += 1) {
			let a = r.slice(e).join("/");
			a && t.set(a, n);
			let o = i.slice(e).join("/");
			o && t.set(o, n);
		}
	}), t;
}
//#endregion
//#region src/engine/unityConstraintRuntime.ts
var ho = new e.Vector3(), go = new e.Quaternion(), _o = new e.Vector3(), W = new e.Vector3(), vo = new e.Quaternion(), yo = new e.Quaternion(), G = new e.Vector3(), bo = new e.Vector3(), xo = new e.Vector3(0, 1, 0), So = 7, Co = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => Eo(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(Do);
		return this.graph.root.updateMatrixWorld(!0), To(this.setup, e);
	}
};
function wo(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => Eo(e, t, n)).map(Do);
	return e.root.updateMatrixWorld(!0), To(t, i);
}
function To(e, t) {
	let n = t.filter((e) => e.resolvedOwner && e.sources.length > 0 && e.sources.every((e) => e.resolvedSource)).length;
	return {
		version: e.version ?? null,
		sourceKind: e.sourceKind ?? null,
		constraintCount: t.length,
		resolvedCount: n,
		unresolvedCount: t.length - n,
		appliedCount: t.filter((e) => e.applied).length,
		warnings: Array.isArray(e.warnings) ? e.warnings.filter((e) => typeof e == "string") : [],
		constraints: t
	};
}
function Eo(e, t, n) {
	let r = Zo(t.type) ?? "unknown", i = Zo(t.ownerPath), a = Zo(t.ownerName), o = Mo(e, i, a), s = Mo(e, Zo(t.worldUpObjectPath), Zo(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => ko(e, t, n));
	return {
		source: t,
		type: r,
		ownerPath: i,
		ownerName: a,
		owner: o,
		worldUpObject: s,
		sources: c,
		sourceDebug: c.map((e) => e.debug)
	};
}
function Do(t) {
	let { source: n, type: r, ownerPath: i, ownerName: a, owner: o, worldUpObject: s, sources: c, sourceDebug: l } = t, u = (e, t) => ({
		type: r,
		status: e,
		reason: t,
		ownerPath: i,
		ownerName: a,
		resolvedOwner: !!o.node,
		applied: !1,
		sources: l
	});
	if (n.enabled === !1 || n.active === !1) return u("skipped", "constraint component is disabled");
	if (!o.node) return u("unresolved", o.reason);
	if (c.length === 0) return u("unresolved", "constraint has no source transforms");
	let d = c.find((e) => !e.node);
	if (d) return u("unresolved", d.debug.sourceName ? `source transform ${d.debug.sourceName} was not uniquely resolved` : "constraint source transform was not resolved");
	let f = c.filter(jo), p = o.node.position.clone(), m = o.node.quaternion.clone();
	if (r === "parent") return No(o.node, f) ? (Ro(o.node, n, p, m, !0, !0), Oo(r, i, a, l, "parent constraint applied with height-scaled translation offsets")) : u("skipped", "parent constraint has no positive source weight");
	if (r === "rotation") return Po(o.node, f, n.rotationOffset) ? (Ro(o.node, n, p, m, !1, !0), Oo(r, i, a, l, "rotation constraint applied with weighted source rotations")) : u("skipped", "rotation constraint has no positive source weight");
	if (r === "aim") {
		let t = qo(n.aimVector, new e.Vector3(0, 0, 1)), c = qo(n.upVector, new e.Vector3(0, 1, 0)), d = Io(o.node, s, n.worldUpType, n.worldUpVector);
		return Fo(o.node, f, t, c, d, n.rotationOffset) ? (Ro(o.node, n, p, m, !1, !0), Oo(r, i, a, l, "aim constraint applied with exported aim/up vectors")) : u("skipped", "aim constraint target direction or source weight was invalid");
	}
	return u("skipped", `unsupported constraint type ${r}`);
}
function Oo(e, t, n, r, i) {
	return {
		type: e,
		status: "applied",
		reason: i,
		ownerPath: t,
		ownerName: n,
		resolvedOwner: !0,
		applied: !0,
		sources: r
	};
}
function ko(e, t, n) {
	let r = Zo(t.sourcePath), i = Zo(t.sourceName), a = Ao(e, r, i), o = Qo(t.weight) ?? 1, s = Go(t.translationOffset, n), c = Ko(t.rotationOffset);
	return {
		node: a.node,
		weight: o,
		translationOffset: s,
		rotationOffset: c,
		debug: {
			sourcePath: r,
			sourceName: i,
			weight: o,
			resolvedSource: !!a.node,
			translationOffset: s ? {
				x: s.x,
				y: s.y,
				z: s.z
			} : null,
			rotationOffset: c ? {
				x: c.x,
				y: c.y,
				z: c.z
			} : null
		}
	};
}
function Ao(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return Mo(e, t, n);
}
function jo(e) {
	return !!e.node;
}
function Mo(e, t, n) {
	if (t) {
		let n = e.nodeByPath.get(t);
		if (n) return {
			node: n,
			reason: "resolved by transform path"
		};
	}
	if (!n) return {
		node: null,
		reason: "constraint transform path and name are missing"
	};
	let r = [];
	for (let t of e.nodeByPath.values()) t.name === n && r.push(t);
	return r.length === 1 ? {
		node: r[0],
		reason: "resolved by exact transform name"
	} : r.length > 1 ? {
		node: null,
		reason: `transform name ${n} matched ${r.length} nodes`
	} : {
		node: null,
		reason: `transform name ${n} was not found`
	};
}
function No(t, n) {
	let r = n.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return !1;
	W.set(0, 0, 0);
	let i = null, a = 0;
	for (let t of n) {
		let n = Math.max(0, t.weight);
		if (n <= 0) continue;
		t.node.updateMatrixWorld(!0), t.node.matrixWorld.decompose(ho, go, _o);
		let o = ho.clone().add((t.translationOffset ?? new e.Vector3()).clone().applyQuaternion(go));
		W.addScaledVector(o, n / r), i = Uo(i, Lo(go, t.rotationOffset), a, n), a += n;
	}
	return i ? (Ho(t, W, i), !0) : !1;
}
function Po(e, t, n) {
	let r = Wo(t);
	return r ? (e.getWorldPosition(W), Ho(e, W, Lo(r, Ko(n))), !0) : !1;
}
function Fo(t, n, r, i, a, o) {
	let s = n.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (s <= 0) return !1;
	t.updateMatrixWorld(!0), t.getWorldPosition(W), G.set(0, 0, 0);
	for (let e of n) {
		let t = Math.max(0, e.weight);
		t <= 0 || (e.node.updateMatrixWorld(!0), e.node.getWorldPosition(ho), G.addScaledVector(ho, t / s));
	}
	if (G.sub(W), G.lengthSq() < 1e-6) return !1;
	G.normalize();
	let c = Yo(r, new e.Vector3(0, 0, 1)), l = Yo(i, new e.Vector3(0, 1, 0));
	if (vo.setFromUnitVectors(c, G), bo.copy(l).applyQuaternion(vo), a) {
		let t = Yo(a, xo), n = Xo(bo, G), r = Xo(t, G);
		if (n.lengthSq() > 1e-6 && r.lengthSq() > 1e-6) {
			n.normalize(), r.normalize();
			let t = Math.atan2(G.dot(new e.Vector3().crossVectors(n, r)), e.MathUtils.clamp(n.dot(r), -1, 1));
			vo.premultiply(new e.Quaternion().setFromAxisAngle(G, t));
		}
	}
	return Ho(t, W, Lo(vo, Ko(o))), !0;
}
function Io(e, t, n, r) {
	switch (Qo(n) ?? 0) {
		case 1: return t ? (e.getWorldPosition(W), t.getWorldPosition(ho), ho.clone().sub(W)) : xo.clone();
		case 2: return t ? Jo(t, qo(r, xo)) : qo(r, xo);
		case 3: return qo(r, xo);
		case 4: return null;
		default: return xo.clone();
	}
}
function Lo(e, t) {
	return t ? e.clone().multiply(Vo(t)).normalize() : e.clone();
}
function Ro(t, n, r, i, a, o) {
	let s = e.MathUtils.clamp(Qo(n.weight) ?? 1, 0, 1), c = t.position.clone(), l = t.quaternion.clone(), u = Go(n.translationAtRest, 1) ?? r, d = n.rotationAtRest ? Vo(Bo(n.rotationAtRest)) : i;
	if (a) {
		let e = Qo(n.translationAxis) ?? So, r = u.clone().lerp(c, s);
		t.position.set(zo(e, 1) ? r.x : u.x, zo(e, 2) ? r.y : u.y, zo(e, 4) ? r.z : u.z);
	} else t.position.copy(r);
	if (o) {
		let r = Qo(n.rotationAxis) ?? So, i = new e.Euler().setFromQuaternion(d, "ZXY"), a = new e.Euler().setFromQuaternion(l, "ZXY"), o = new e.Euler(zo(r, 1) ? a.x : i.x, zo(r, 2) ? a.y : i.y, zo(r, 4) ? a.z : i.z, "ZXY");
		t.quaternion.copy(d).slerp(new e.Quaternion().setFromEuler(o), s).normalize();
	} else t.quaternion.copy(i);
	t.updateMatrix(), t.updateMatrixWorld(!0);
}
function zo(e, t) {
	return (e & t) !== 0;
}
function Bo(t) {
	return Qr(t, new e.Vector3());
}
function Vo(t) {
	return ni(new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "ZXY")));
}
function Ho(e, t, n) {
	let r = t.clone(), i = n.clone();
	e.parent && (e.parent.updateMatrixWorld(!0), e.parent.worldToLocal(r), e.parent.getWorldQuaternion(yo), i.premultiply(yo.invert())), e.position.copy(r), e.quaternion.copy(i.normalize()), e.updateMatrix(), e.updateMatrixWorld(!0);
}
function Uo(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function Wo(e) {
	let t = null, n = 0;
	for (let r of e) {
		let e = Math.max(0, r.weight);
		e <= 0 || (r.node.updateMatrixWorld(!0), r.node.getWorldQuaternion(go), t = Uo(t, go, n, e), n += e);
	}
	return t;
}
function Go(t, n) {
	return !t || typeof t != "object" ? null : ei(Qr(t, new e.Vector3())).multiplyScalar(n);
}
function Ko(t) {
	return !t || typeof t != "object" ? null : Qr(t, new e.Vector3());
}
function qo(e, t) {
	return !e || typeof e != "object" ? t.clone() : ti(Qr(e, t));
}
function Jo(e, t) {
	return e.updateMatrixWorld(!0), e.getWorldQuaternion(vo), t.clone().applyQuaternion(vo);
}
function Yo(e, t) {
	return e.lengthSq() > 1e-6 ? e.clone().normalize() : t.clone().normalize();
}
function Xo(e, t) {
	return e.clone().addScaledVector(t, -e.dot(t));
}
function Zo(e) {
	return typeof e == "string" ? e : null;
}
function Qo(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function $o(t, n) {
	let r = e.MathUtils.clamp(n || 1, .5, 2), i = t.nodeByPath.get("body/Position");
	if (!i) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return i.scale.setScalar(r), i.updateMatrix(), t.root.updateMatrixWorld(!0), i;
}
function K(e) {
	return e && typeof e == "object" ? e : {};
}
function es(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function ts(e) {
	let t = K(e), n = K(t.pjskSpringBone ?? t.PjskSpringBone), r = K(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version;
	return i === "0414" || i === 414 ? r : null;
}
function ns(e) {
	let t = K(e), n = K(t.nativeMeshes ?? t.NativeMeshes), r = n.version;
	return r === "0414" || r === 414 ? n : null;
}
function q(e, t) {
	for (let n of t) {
		if (!n) continue;
		let t = e.get(n);
		if (t) return {
			path: n,
			node: t
		};
	}
	return null;
}
function rs(e) {
	return e?.parentingMode === "model_combine_setup";
}
function is(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function as(e, t) {
	for (; e.children.length > 0;) is(e.children[0], t);
}
function os(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (is(t, n), i.add(t), r.push(a));
	}
	return r;
}
function ss(e, t) {
	e.parent && e.parent.remove(e), e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0;
		for (let [n, r] of t.entries()) r === e && t.delete(n);
	});
}
function cs(e, t, n, r) {
	let i = n.childMoveSuffix ?? "_target", a = n.parentRootPath, o = n.childRootPath, s = q(t, [n.parentCombineNodeAPath ?? n.parentAttachPath]), c = q(t, [n.parentCombineNodeBPath]), l = q(t, [n.childCombineNodeAPath ?? n.childOriginPath]), u = q(t, [n.childCombineNodeBPath]), d = q(t, [o]);
	if (!a || !o || !s || !c || !l || !u || !d) throw Error("Official model_combine_setup paths were not fully resolved.");
	as(c.node, u.node);
	let f = s.node.parent, p = l.node.parent;
	if (f && p) {
		for (let e of [...f.children]) e.name.endsWith(i) && is(e, p);
		let e = os(t, r, t.get(a) ?? f), s = r.filter((t) => !e.includes(t));
		if (s.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${s.join(", ")}.`);
		let c = `${o}/${n.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		is(l.node, f);
	}
	return l.node.position.copy(s.node.position), l.node.quaternion.copy(s.node.quaternion), l.node.scale.copy(s.node.scale), l.node.updateMatrix(), u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), ss(c.node, t), ss(s.node, t), ss(d.node, t), t.set(s.path, l.node), t.set(c.path, u.node), n.parentAttachPath && t.set(n.parentAttachPath, l.node), n.parentCombineNodeBPath && t.set(n.parentCombineNodeBPath, u.node), e.updateMatrixWorld(!0), {
		bodyNodeA: s,
		bodyNodeB: c,
		faceNodeA: l,
		faceNodeB: u
	};
}
function ls(e, t) {
	return [...new Set((ns(e)?.meshes ?? []).map((e) => e.rendererTransformPath).filter((e) => typeof e == "string" && e.startsWith(`${t}/`)))];
}
function us(e, t) {
	return (ns(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function ds(t, n) {
	let r = ts(t);
	if (!r?.prefabGraphs?.length) return null;
	let i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = ps(t);
	i.scale.setScalar(a.scale), i.userData.pjskSourceScaleCorrection = a;
	let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
	for (let t of r.prefabGraphs) for (let n of t.transforms ?? []) {
		if (typeof n.pathId != "number" || !n.transformPath) continue;
		let t = new e.Object3D();
		t.name = n.name ?? n.transformPath.split("/").pop() ?? `path_${n.pathId}`, t.userData.pjskTransformPath = n.transformPath, t.userData.pjskRuntimePartIndex = n.runtimePartIndex, t.userData.pjskPoseRoot = n.poseRoot ?? null, t.position.copy(ei(Qr(n.localPosition, new e.Vector3()))), t.quaternion.copy(ni($r(n.localRotation))), t.scale.copy(Qr(n.localScale, new e.Vector3(1, 1, 1))), t.updateMatrix(), o.set(n.pathId, t), s.set(n.pathId, n), c.set(n.transformPath, t);
	}
	for (let [e, t] of o.entries()) {
		let n = s.get(e)?.parentPathId;
		((typeof n == "number" ? o.get(n) : null) ?? i).add(t);
	}
	i.updateMatrixWorld(!0);
	let l = fs(i), u = r.bodyHeadAssembly;
	if (!rs(u)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let d = q(c, [u.parentAttachPath]), f = q(c, [u.childRootPath]), p = q(c, [u.childOriginPath]);
	if (!d || !f || !p) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let m = ls(t, f.path), h = cs(i, c, u, m), g = us(t, d.path.split("/")[0]), _ = g ? c.get(g) ?? null : null, v = fs(i), y = l - v, b = [];
	if (n) {
		let e = mo(n);
		for (let [t, n] of c.entries()) {
			let r = e.get(t);
			r && b.push({
				source: n,
				target: r
			});
		}
	}
	let ee = {
		active: !0,
		sourcePath: h.bodyNodeA.path,
		targetPath: h.faceNodeA.path,
		reason: null,
		setupVersion: String(r.version ?? ""),
		sourceScaleCorrection: a,
		mountedHeadRootCount: 1,
		mountedHeadOriginPaths: [h.faceNodeA.path],
		assemblyCounts: {
			inputTransforms: l,
			retainedTransforms: v,
			removedTransforms: y,
			capturedCommonRemovedTransforms: 14,
			removedAtLeastCapturedCommonCount: y >= 14
		},
		targetCount: b.length,
		targetPaths: b.slice(0, 24).map((e) => String(e.source.userData.pjskTransformPath ?? e.source.name)),
		keyNodes: {
			runtimeMount: null,
			modelCombineBodyNeck: Os(h.bodyNodeA.node, i),
			modelCombineFaceNeck: Os(h.faceNodeA.node, i)
		}
	};
	return {
		root: i,
		nodeByPath: c,
		meshCarrierBindings: b,
		bodyAttach: h.faceNodeA.node,
		bodyAttachPath: d.path,
		headRoot: h.faceNodeA.node,
		headRootPath: h.faceNodeA.path,
		headOrigin: h.faceNodeA.node,
		headOriginPath: h.faceNodeA.path,
		bodyRootBone: _,
		bodyRootBonePath: g,
		headRendererPaths: m,
		debug: ee
	};
}
function fs(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function ps(e) {
	let t = K(e), n = K(t.character ?? t.Character), r = K(t.bodyManifest ?? t.BodyManifest), i = es(n.characterHeightMeters ?? n.CharacterHeightMeters ?? r.CharacterHeightMeters ?? r.characterHeightMeters);
	return {
		characterHeightMeters: i,
		characterModelScaleMeters: i,
		scale: 1,
		reason: "master-character-height-via-position-note"
	};
}
function ms(t, n) {
	let r = ns(n), i = r?.meshes ?? [];
	if (!r || i.length === 0) return {
		meshCount: 0,
		boneCount: t.nodeByPath.size,
		skinnedMeshCount: 0,
		skinBindings: [],
		error: "Unity runtime nativeMeshes version 0414 is missing or empty.",
		warnings: r?.warnings ?? []
	};
	let a = 0, o = 0, s = [], c = [...r.warnings ?? []];
	t.root.updateMatrixWorld(!0);
	for (let n of i) {
		let r = n.rendererTransformPath, i = r ? t.nodeByPath.get(r) : null;
		if (!i) {
			c.push(`Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' skipped: renderer transform '${r ?? "<null>"}' was not found.`);
			continue;
		}
		let l = vs(n);
		if (!l) {
			c.push(`Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' skipped: invalid geometry payload.`);
			continue;
		}
		let u = (n.submeshes ?? []).map((t) => {
			if (!t.materialKey || typeof t.slotIndex != "number") throw Error(`Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' has a submesh without material identity; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			let r = new e.MeshBasicMaterial({
				color: 16777215,
				vertexColors: l.hasAttribute("color")
			});
			return r.name = t.materialName ?? n.meshName ?? n.meshPath ?? "native_material", r.userData.pjskMaterialKey = t.materialKey, r.userData.pjskMaterialSlotIndex = t.slotIndex, r;
		}), d = u.length > 0 ? u : [new e.MeshBasicMaterial({ color: 16777215 })], f = n.meshName ?? n.meshPath?.split("/").pop() ?? "UnityNativeMesh", p = n.bonePaths ?? [], m = p.map((e) => t.nodeByPath.get(e)).filter((e) => !!e), h, g = null, _ = [];
		if (p.length > 0) {
			if (m.length !== p.length) {
				c.push(`Native mesh '${n.meshPath ?? f}' skipped: ${p.length - m.length} skin bones were unresolved.`), l.dispose();
				continue;
			}
			let t = new e.SkinnedMesh(l, d);
			h = t, g = t, _ = m, o += 1;
		} else h = new e.Mesh(l, d);
		if (h.name = f, h.userData.pjskNativeUnityMesh = !0, h.userData.pjskPartKind = n.partKind ?? null, h.userData.pjskRendererPathId = n.rendererPathId ?? null, h.frustumCulled = !1, i.add(h), g) {
			t.root.updateMatrixWorld(!0), g.updateMatrixWorld(!0);
			let i = _s(n, _.length, c), a = g.matrixWorld.clone();
			if (i.length > 0) {
				let e = a.clone().invert();
				for (let t of i) t.multiply(e);
			}
			let o = new e.Skeleton(_, i.length > 0 ? i : void 0);
			i.length === 0 && o.calculateInverses(), g.bind(o, a);
			let l = hs(_[0], o.boneInverses[0]), u = gs(_, o.boneInverses);
			s.push({
				meshName: f,
				partKind: n.partKind ?? null,
				rendererTransformPath: r ?? null,
				rootBonePath: n.rootBonePath ?? null,
				rootBoneResolved: n.rootBonePath ? t.nodeByPath.has(n.rootBonePath) : !1,
				effectiveRootBonePath: r && t.headRendererPaths.includes(r) ? t.bodyRootBonePath : n.rootBonePath ?? null,
				effectiveRootBoneResolved: r && t.headRendererPaths.includes(r) ? !!t.bodyRootBone : n.rootBonePath ? t.nodeByPath.has(n.rootBonePath) : !1,
				boneCount: _.length,
				...l,
				...u
			});
		}
		a += 1;
	}
	return t.root.updateMatrixWorld(!0), {
		meshCount: a,
		boneCount: t.nodeByPath.size,
		skinnedMeshCount: o,
		skinBindings: s,
		error: a > 0 ? null : "Unity runtime nativeMeshes did not produce any renderable mesh.",
		warnings: c
	};
}
function hs(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: Es(i),
		restScale: Es(o)
	};
}
function gs(t, n) {
	if (t.length < 2 || n.length !== t.length) return {
		restMatrixSpread: 0,
		restMatrixSpreadBonePath: null
	};
	let r = new e.Matrix4().multiplyMatrices(t[0].matrixWorld, n[0]), i = new e.Matrix4(), a = 0, o = null;
	for (let e = 1; e < t.length; e += 1) {
		i.multiplyMatrices(t[e].matrixWorld, n[e]);
		for (let n = 0; n < 16; n += 1) {
			let s = Math.abs(i.elements[n] - r.elements[n]);
			s > a && (a = s, o = String(t[e].userData.pjskTransformPath ?? t[e].name));
		}
	}
	let s = Number(a.toFixed(6));
	return {
		restMatrixSpread: s,
		restMatrixSpreadBonePath: s > 0 ? o : null
	};
}
function _s(t, n, r) {
	let i = t.boneInverseBindMatrices ?? [];
	if (n === 0 || i.length === 0) return [];
	if (i.length !== n * 16) return r.push(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has ${i.length} inverse bind matrix floats for ${n} bones; expected ${n * 16}.`), [];
	let a = [];
	for (let t = 0; t < i.length; t += 16) a.push(new e.Matrix4().fromArray(i, t));
	return a;
}
function vs(t) {
	let n = t.positions ?? [];
	if (n.length === 0 || n.length % 3 != 0) return null;
	let r = n.length / 3, i = new e.BufferGeometry();
	i.setAttribute("position", new e.Float32BufferAttribute(n, 3)), (t.normals?.length ?? 0) === r * 3 && i.setAttribute("normal", new e.Float32BufferAttribute(t.normals, 3)), (t.tangents?.length ?? 0) === r * 4 && i.setAttribute("tangent", new e.Float32BufferAttribute(t.tangents, 4)), (t.uv0?.length ?? 0) === r * 2 && i.setAttribute("uv", new e.Float32BufferAttribute(t.uv0, 2)), (t.uv1?.length ?? 0) === r * 2 && i.setAttribute("uv1", new e.Float32BufferAttribute(t.uv1, 2)), (t.uv2?.length ?? 0) === r * 2 && i.setAttribute("uv2", new e.Float32BufferAttribute(t.uv2, 2)), (t.colors?.length ?? 0) === r * 4 && i.setAttribute("color", new e.Float32BufferAttribute(t.colors, 4)), (t.skinIndices?.length ?? 0) === r * 4 && i.setAttribute("skinIndex", new e.Uint16BufferAttribute(t.skinIndices, 4)), (t.skinWeights?.length ?? 0) === r * 4 && i.setAttribute("skinWeight", new e.Float32BufferAttribute(t.skinWeights, 4));
	let a = [];
	for (let e of t.submeshes ?? []) {
		let t = a.length, n = e.indices ?? [];
		a.push(...n), i.addGroup(t, n.length, i.groups.length);
	}
	a.length > 0 && i.setIndex(a);
	let o = [], s = [];
	for (let n of t.morphTargets ?? []) {
		let t = n.indices ?? [], i = n.positionDeltas ?? [];
		if (t.length === 0 || i.length !== t.length * 3) continue;
		let a = new Float32Array(r * 3), c = n.normalDeltas?.length === t.length * 3 ? new Float32Array(r * 3) : null;
		for (let e = 0; e < t.length; e += 1) {
			let o = t[e];
			!Number.isInteger(o) || o < 0 || o >= r || (a[o * 3] = i[e * 3] ?? 0, a[o * 3 + 1] = i[e * 3 + 1] ?? 0, a[o * 3 + 2] = i[e * 3 + 2] ?? 0, c && n.normalDeltas && (c[o * 3] = n.normalDeltas[e * 3] ?? 0, c[o * 3 + 1] = n.normalDeltas[e * 3 + 1] ?? 0, c[o * 3 + 2] = n.normalDeltas[e * 3 + 2] ?? 0));
		}
		let l = new e.BufferAttribute(a, 3);
		if (l.name = n.name ?? `morph_${o.length}`, o.push(l), c) {
			let t = new e.BufferAttribute(c, 3);
			t.name = l.name, s.push(t);
		}
	}
	return o.length > 0 && (i.morphAttributes.position = o, i.morphTargetsRelative = !0), s.length === o.length && s.length > 0 && (i.morphAttributes.normal = s), i.computeBoundingSphere(), i;
}
function ys(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : wo(e, ts(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function bs(e, t, n) {
	let r = ts(t)?.constraintSetup;
	return r ? new Co(e, r, n) : null;
}
function xs(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: Ss(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = ts(t)?.bodyHeadAssembly, o = mo(i), s = (t) => {
		let n = q(e.nodeByPath, t) ?? Cs(o, t);
		return n ? Os(n.node, i) : null;
	}, c = s([
		a?.parentCombineNodeAPath ?? "",
		e.debug.sourcePath ?? "",
		"body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck",
		"body/Position/Hip/Waist/Spine/Chest/Neck"
	]), l = s([
		a?.parentCombineNodeBPath ?? "",
		e.debug.sourcePath ? `${e.debug.sourcePath}/Head` : "",
		"body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck/Head",
		"body/Position/Hip/Waist/Spine/Chest/Neck/Head"
	]), u = s(["face/Position"]), d = s([
		a?.childCombineNodeAPath ?? "",
		e.debug.targetPath ?? "",
		"face/Position/Hip/Waist/Spine/Chest/Neck"
	]), f = s([
		a?.childCombineNodeBPath ?? "",
		e.debug.targetPath ? `${e.debug.targetPath}/Head` : "",
		"face/Position/Hip/Waist/Spine/Chest/Neck/Head"
	]), p = s(["mdl_chr_IDL_A_00/Position", "mdl_chr_IDL_A_00/Position_4"]);
	return {
		...r,
		positionRoots: ks(i),
		assemblyDistances: {
			bodyNeckToFaceNeck: null,
			bodyHeadToFaceHead: null
		},
		keyNodes: {
			...r.keyNodes ?? {},
			bodyNeck: c,
			bodyHead: l,
			facePosition: u,
			faceNeck: d,
			faceHead: f,
			meshContainerPosition: p
		}
	};
}
function Ss(e) {
	let t = K(e), n = K(t.pjskSpringBone ?? t.PjskSpringBone), r = K(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup);
	return String(r.version ?? r.Version ?? "");
}
function Cs(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function ws(e) {
	return e.replace(/_\d+$/, "");
}
function Ts(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? ws(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function Es(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function Ds(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function Os(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), t.getWorldQuaternion(i), a.applyQuaternion(i).normalize(), {
		path: Ts(t, n),
		canonicalPath: Ts(t, n, !0),
		parentPath: t.parent && t.parent !== n ? Ts(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: Es(t.position),
		localQuaternion: Ds(t.quaternion),
		worldPosition: Es(r),
		worldQuaternion: Ds(i),
		worldForward: Es(a)
	};
}
function ks(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = Ts(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(Os(r, e)));
	}), t;
}
//#endregion
//#region src/engine/runtimeMotion.ts
function J(e) {
	return e && typeof e == "object" ? e : {};
}
function As(e, t) {
	return /(?:^|[_-])loop$/i.test(e ?? "") || /(?:^|[_-])loop(?:\.json)?$/i.test(t?.split("/").pop() ?? "");
}
function js(e, t, n, r, i = 1e-4) {
	let a = n * t, o = r * t;
	for (let n = 0; n < t; n += 1) if (Math.abs(e[a + n] - e[o + n]) > i) return !1;
	return !0;
}
function Ms(e, t) {
	let n = e[t], r = e[t + 1], i = e[t + 2], a = e[t + 3], o = Math.hypot(n, r, i, a);
	if (o < 1e-8) {
		e[t] = 0, e[t + 1] = 0, e[t + 2] = 0, e[t + 3] = 1;
		return;
	}
	e[t] = n / o, e[t + 1] = r / o, e[t + 2] = i / o, e[t + 3] = a / o;
}
function Ns(e, t) {
	if (t === 4) for (let n = t; n < e.length; n += t) {
		let r = n - t;
		e[r] * e[n] + e[r + 1] * e[n + 1] + e[r + 2] * e[n + 2] + e[r + 3] * e[n + 3] < 0 && (e[n] *= -1, e[n + 1] *= -1, e[n + 2] *= -1, e[n + 3] *= -1);
	}
}
function Ps(t, n, r, i, a, o, s, c, l) {
	let u = Math.max(s - o, 1e-6), d = e.MathUtils.clamp((l - o) / u, 0, 1), f = d * d, p = f * d, m = (r - t) / Math.max(s - a, 1e-6), h = (i - n) / Math.max(c - o, 1e-6), g = 2 * p - 3 * f + 1, _ = p - 2 * f + d, v = -2 * p + 3 * f, y = p - f;
	return g * n + _ * u * m + v * r + y * u * h;
}
function Fs(t, n, r) {
	let i = t instanceof e.QuaternionKeyframeTrack, a = t instanceof e.VectorKeyframeTrack && t.name.endsWith(".position");
	if (!i && !a) return t.clone();
	let o = t.getValueSize(), s = Array.from(t.times), c = Array.from(t.values), l = s.length;
	if (l < 3 || n <= 0 || (Math.abs(s[l - 1] - n) < .001 && js(c, o, 0, l - 1) && --l, l < 3)) return t.clone();
	let u = s.slice(0, l), d = c.slice(0, l * o);
	i && Ns(d, o);
	let f = Math.max(2, Math.round(n * r)), p = new Float32Array(f + 1), m = new Float32Array((f + 1) * o), h = 0;
	for (let e = 0; e <= f; e += 1) {
		let t = e * o, r = e === f ? n : n * e / f;
		if (p[e] = r, e === f) {
			for (let e = 0; e < o; e += 1) m[t + e] = m[e];
			continue;
		}
		for (; h < l - 1 && r > u[h + 1];) h += 1;
		let a = h, s = h + 1 < l ? h + 1 : 0, c = (a - 1 + l) % l, g = (s + 1) % l, _ = u[c], v = u[a], y = u[s], b = u[g];
		c >= a && (_ -= n), s <= a && (y += n), g <= a && (b += n);
		for (let e = 0; e < o; e += 1) m[t + e] = Ps(d[c * o + e], d[a * o + e], d[s * o + e], d[g * o + e], _, v, y, b, r);
		i && Ms(m, t);
	}
	return i ? new e.QuaternionKeyframeTrack(t.name, p, m) : new e.VectorKeyframeTrack(t.name, p, m);
}
function Is(e) {
	let t = e.tracks.filter((e) => e.times.length > 2);
	return t.length ? t.some((t) => t.times.length < Math.max(12, e.duration * 24)) : !1;
}
function Ls(t, n = 60) {
	return Is(t) ? new e.AnimationClip(t.name, t.duration, t.tracks.map((e) => Fs(e, t.duration, n))) : t;
}
function Rs(e) {
	return /^(Head|Neck)\.(position|quaternion|scale)$/.test(e.name);
}
function zs(e, t = /* @__PURE__ */ new Set()) {
	if (!e) return null;
	let n = e.tracks.filter((e) => /hair/i.test(e.name)), r = e.tracks.filter((e) => /^Head\./.test(e.name)), i = e.tracks.filter((e) => /^Neck\./.test(e.name)), a = e.tracks.filter((e) => /^(Position|Hip|Waist|Spine|Chest|Neck|Head)\./.test(e.name)), o = e.tracks.filter((e) => /\.(position|quaternion|scale)$/.test(e.name)), s = e.tracks.filter((e) => Bs(e, t));
	return {
		trackCount: e.tracks.length,
		transformTrackCount: o.length,
		hairTrackCount: n.length,
		headTrackCount: r.length,
		neckTrackCount: i.length,
		upperBodyTrackCount: a.length,
		utjControlledTrackCount: s.length,
		sampleHairTracks: n.slice(0, 12).map((e) => e.name),
		sampleHeadTracks: [...r, ...i].slice(0, 12).map((e) => e.name),
		sampleUtjControlledTracks: s.slice(0, 12).map((e) => e.name)
	};
}
function Bs(e, t) {
	if (t.size === 0) return !1;
	let n = e.name.split(".")[0];
	return t.has(n);
}
function Vs(t) {
	return t.tracks.some(Rs) ? new e.AnimationClip(`${t.name || "motion"}_no_head_tracks`, t.duration, t.tracks.filter((e) => !Rs(e))) : t;
}
function Hs(e, t) {
	return t ? e : Vs(e);
}
function Us(e) {
	return /(?:^|\/)unity-motion\.msgpack\.br(?:$|[?#])/i.test(e);
}
function Ws(e, t) {
	return e ? t ?? (Us(e) ? "unity-json" : null) : null;
}
function Gs(e, t) {
	return `${t ?? "unknown"}:${e}`;
}
function Ks(e) {
	let t = J(e), n = String(t.version ?? t.Version ?? ""), r = t.clips ?? t.Clips;
	if (n !== "0414" || !Array.isArray(r)) throw Error("Unity motion runtime must be version 0414 and contain clips.");
	let i = r.map(qs);
	if (!i.length) throw Error("Unity motion runtime contains no clips.");
	return {
		version: n,
		clips: i
	};
}
function qs(e) {
	let t = J(e), n = String(t.name ?? t.Name ?? "motion"), r = t.tracks ?? t.Tracks;
	if (!Array.isArray(r)) throw Error(`Unity motion clip ${n} contains no tracks.`);
	let i = r.map(Js);
	if (!i.length) throw Error(`Unity motion clip ${n} contains no valid tracks.`);
	return {
		name: n,
		tracks: i
	};
}
function Js(e) {
	let t = J(e), n = String(t.nodeKey ?? t.NodeKey ?? ""), r = String(t.property ?? t.Property ?? ""), i = Number(t.componentCount ?? t.ComponentCount), a = Ys(t.times ?? t.Times), o = Ys(t.values ?? t.Values);
	if (!n || !r || !Number.isInteger(i)) throw Error("Unity motion track is missing nodeKey, property, or componentCount.");
	if (!a.length || o.length !== a.length * i) throw Error(`Unity motion track ${n}.${r} has inconsistent sample arrays.`);
	return {
		nodeKey: n,
		property: r,
		componentCount: i,
		times: a,
		values: o
	};
}
function Ys(e) {
	if (e instanceof Float32Array || e instanceof Uint16Array || e instanceof Uint32Array) return e;
	if (!Array.isArray(e)) return [];
	if (e.every((e) => typeof e == "number" && Number.isFinite(e))) return e;
	let t = e.map(Number);
	if (!t.every(Number.isFinite)) throw Error("Unity motion numeric array contains non-finite values.");
	return t;
}
function Xs(t) {
	let n = t.property === "translation" ? "position" : t.property === "rotation" ? "quaternion" : t.property, r = `${t.nodeKey}.${n}`;
	if (n === "position" || n === "scale") {
		if (t.componentCount !== 3) throw Error(`Unity motion track ${r} must have 3 components.`);
		return new e.VectorKeyframeTrack(r, t.times, t.values);
	}
	if (n === "quaternion") {
		if (t.componentCount !== 4) throw Error(`Unity motion track ${r} must have 4 components.`);
		return new e.QuaternionKeyframeTrack(r, t.times, t.values);
	}
	throw Error(`Unsupported Unity motion property: ${t.property}`);
}
function Zs(t) {
	return Ks(t).clips.map((t) => {
		let n = t.tracks.map(Xs), r = n.flatMap((e) => Array.from(e.times)).reduce((e, t) => Math.max(e, t), 0);
		return new e.AnimationClip(t.name, r, n);
	});
}
function Qs(e) {
	let t = J(e), n = J(t.motionPackage ?? t.MotionPackage), r = J(n.bodyMotionBindings ?? n.BodyMotionBindings), i = r.bindings ?? r.Bindings;
	return Array.isArray(i) ? {
		version: String(r.version ?? r.Version ?? ""),
		bindingMode: String(r.bindingMode ?? r.BindingMode ?? ""),
		warnings: ic(r.warnings ?? r.Warnings),
		bindings: i.map($s).filter((e) => !!e)
	} : null;
}
function $s(e) {
	let t = J(e), n = Number(t.pathCrc ?? t.PathCrc), r = String(t.nodeKey ?? t.NodeKey ?? ""), i = String(t.leafName ?? t.LeafName ?? ""), a = t.targets ?? t.Targets;
	if (!Number.isFinite(n) || !r || !Array.isArray(a)) return null;
	let o = a.map(ec).filter((e) => !!e);
	return {
		pathCrc: n,
		nodeKey: r,
		leafName: i,
		importedPath: ac(t.importedPath ?? t.ImportedPath),
		sourceRest: tc(t.sourceRest ?? t.SourceRest),
		targetCount: Number(t.targetCount ?? t.TargetCount ?? o.length),
		targets: o
	};
}
function ec(e) {
	let t = J(e), n = String(t.poseRoot ?? t.PoseRoot ?? ""), r = String(t.transformPath ?? t.TransformPath ?? ""), i = Number(t.pathId ?? t.PathId);
	return !n || !r || !Number.isFinite(i) ? null : {
		poseRoot: n,
		transformPath: r,
		pathId: i,
		rest: tc(t.rest ?? t.Rest)
	};
}
function tc(e) {
	let t = J(e), n = nc(t.position ?? t.Position), r = rc(t.rotation ?? t.Rotation), i = nc(t.scale ?? t.Scale);
	return !n || !r || !i ? null : {
		position: n,
		rotation: r,
		scale: i
	};
}
function nc(t) {
	let n = J(t), r = Number(n.x ?? n.X), i = Number(n.y ?? n.Y), a = Number(n.z ?? n.Z);
	return Number.isFinite(r) && Number.isFinite(i) && Number.isFinite(a) ? new e.Vector3(r, i, a) : null;
}
function rc(t) {
	let n = J(t), r = Number(n.x ?? n.X), i = Number(n.y ?? n.Y), a = Number(n.z ?? n.Z), o = Number(n.w ?? n.W);
	return !Number.isFinite(r) || !Number.isFinite(i) || !Number.isFinite(a) || !Number.isFinite(o) ? null : new e.Quaternion(r, i, a, o).normalize();
}
function ic(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function ac(e) {
	return typeof e == "string" && e.length > 0 ? e : null;
}
function oc(e, t) {
	let n = e.clone();
	return n.name = t, n;
}
function sc(t, n, r, i, a) {
	if (a.poseRoot !== "face") return oc(t, n);
	if (!i.sourceRest || !a.rest) return null;
	if (r === "position") {
		let r = [];
		for (let n = 0; n < t.values.length; n += 3) {
			let o = new e.Vector3(t.values[n], t.values[n + 1], t.values[n + 2]), s = a.rest.position.clone().add(o.sub(i.sourceRest.position));
			r.push(s.x, s.y, s.z);
		}
		return new e.VectorKeyframeTrack(n, t.times, r);
	}
	if (r === "quaternion") {
		let r = [], o = i.sourceRest.rotation.clone().invert();
		for (let n = 0; n < t.values.length; n += 4) {
			let i = new e.Quaternion(t.values[n], t.values[n + 1], t.values[n + 2], t.values[n + 3]).normalize(), s = a.rest.rotation.clone().multiply(o).multiply(i).normalize();
			r.push(s.x, s.y, s.z, s.w);
		}
		return new e.QuaternionKeyframeTrack(n, t.times, r);
	}
	if (r === "scale") {
		let r = [], o = i.sourceRest.scale, s = a.rest.scale;
		if (o.x === 0 || o.y === 0 || o.z === 0) return null;
		for (let e = 0; e < t.values.length; e += 3) r.push(s.x * (t.values[e] / o.x), s.y * (t.values[e + 1] / o.y), s.z * (t.values[e + 2] / o.z));
		return new e.VectorKeyframeTrack(n, t.times, r);
	}
	return oc(t, n);
}
function cc(e) {
	return e.poseRoot === "face" && /^face\/Position(?:\/Hip(?:\/Waist(?:\/Spine(?:\/Chest(?:\/Neck(?:\/Head)?)?)?)?)?)?$/.test(e.transformPath);
}
function lc(e) {
	let t = J(e), n = J(t.pjskSpringBone ?? t.PjskSpringBone), r = J(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version, a = i === "0414" || i === 414 ? J(r.bodyHeadAssembly) : {};
	return !!(a.parentingMode === "model_combine_setup" && a.parentAttachPath && a.childRootPath && a.childOriginPath);
}
function uc(t, n, r) {
	let i = Qs(r), a = {
		mode: "unity-prefab",
		bindingCount: i?.bindings.length ?? 0,
		sourceTrackCount: t.tracks.length,
		emittedTrackCount: 0,
		resolvedTargetCount: 0,
		resolvedBodyTargetCount: 0,
		resolvedFaceTargetCount: 0,
		unresolvedTrackCount: 0,
		duplicateTargetTrackCount: 0,
		sampleUnresolvedTracks: [],
		sampleResolvedHeadTargets: []
	};
	if (!i || i.version !== "0414" || i.bindings.length === 0) return {
		clip: null,
		debug: a,
		error: "Unity Prefab animation requires motionPackage.bodyMotionBindings version 0414."
	};
	let o = new Map(i.bindings.map((e) => [e.nodeKey, e])), s = mo(n), c = lc(r), l = [], u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set();
	for (let e of t.tracks) {
		let t = e.name.lastIndexOf("."), n = t > 0 ? e.name.slice(0, t) : "", r = t > 0 ? e.name.slice(t + 1) : "", i = o.get(n);
		if (!i || !r) {
			a.unresolvedTrackCount += 1, a.sampleUnresolvedTracks.length < 16 && a.sampleUnresolvedTracks.push(e.name);
			continue;
		}
		let m = 0;
		for (let t of i.targets) {
			if (c && cc(t)) continue;
			let n = s.get(t.transformPath);
			if (!n) continue;
			let o = `${n.uuid}.${r}`;
			if (u.has(o)) {
				a.duplicateTargetTrackCount += 1;
				continue;
			}
			let h = sc(e, o, r, i, t);
			h && (u.add(o), l.push(h), t.poseRoot === "body" ? d.add(t.transformPath) : t.poseRoot === "face" && f.add(t.transformPath), p.size < 16 && /(?:^|\/)(Position|Hip|Waist|Spine|Chest|Neck|Head)$/.test(t.transformPath) && p.add(t.transformPath), m += 1);
		}
		m === 0 ? (a.unresolvedTrackCount += 1, a.sampleUnresolvedTracks.length < 16 && a.sampleUnresolvedTracks.push(e.name)) : a.resolvedTargetCount += m;
	}
	return a.emittedTrackCount = l.length, a.resolvedBodyTargetCount = d.size, a.resolvedFaceTargetCount = f.size, a.sampleResolvedHeadTargets = [...p], l.length === 0 || a.unresolvedTrackCount > 0 ? {
		clip: null,
		debug: a,
		error: `Unity Prefab animation retarget failed: ${a.unresolvedTrackCount} unresolved tracks.`
	} : {
		clip: new e.AnimationClip(`${t.name || "motion"}_unity_prefab`, t.duration, l),
		debug: a,
		error: null
	};
}
//#endregion
//#region src/engine/animationPlaybackRuntime.ts
function dc(e) {
	return e instanceof Error ? e.message : String(e);
}
async function fc(e) {
	return Zs(await Kn(e));
}
var pc = class {
	loadClips;
	onLoopPromoted;
	clipCache = /* @__PURE__ */ new Map();
	smoothedLoopClipCache = /* @__PURE__ */ new WeakMap();
	context = null;
	motionUrl = null;
	motionKind = null;
	loopUrl = null;
	loopKind = null;
	activeClipName = null;
	duration = 0;
	action = null;
	loopAction = null;
	mixer = null;
	finishedHandler = null;
	error = null;
	retargetDebug = null;
	queuedLoopClipName = null;
	speed = 1;
	paused = !1;
	bodyHeadTracksEnabled = !0;
	revision = 0;
	constructor(e = {}) {
		this.loadClips = e.loadClips ?? fc, this.onLoopPromoted = e.onLoopPromoted ?? (() => void 0);
	}
	setSelection(e) {
		this.motionUrl = e?.motionUrl ?? null, this.motionKind = Ws(this.motionUrl, e?.motionKind), this.loopUrl = e?.loopUrl ?? null, this.loopKind = Ws(this.loopUrl, e?.loopKind);
	}
	hasSelection() {
		return this.motionUrl !== null;
	}
	matchesSelection(e, t) {
		return this.motionUrl === e && this.loopUrl === t;
	}
	capturePosition() {
		return {
			activeClipName: this.activeClipName,
			currentTime: this.action?.time ?? 0
		};
	}
	setPaused(e) {
		this.paused = e, this.applySettings();
	}
	setSpeed(e) {
		this.speed = e, this.applySettings();
	}
	getSpeed() {
		return this.speed;
	}
	isPaused() {
		return this.paused;
	}
	setBodyHeadTracksEnabled(e) {
		return this.bodyHeadTracksEnabled === e ? !1 : (this.bodyHeadTracksEnabled = e, !0);
	}
	step(e) {
		this.mixer?.update(Math.max(0, e));
	}
	seek(t) {
		let n = Math.max(this.duration, 0), r = n > 0 ? e.MathUtils.clamp(t, 0, n) : Math.max(t, 0);
		return this.paused = !0, this.applySettings(), this.action && (this.action.paused = !1, this.action.time = r), this.mixer?.update(0), this.applySettings(), r;
	}
	seekPhase(t) {
		let n = e.MathUtils.clamp(Number.isFinite(t) ? t : 0, 0, 1);
		return this.seek(Math.max(this.duration, 0) * n);
	}
	seekLoopPhase(e) {
		return this.promoteQueuedLoop(), this.seekPhase(e);
	}
	restorePosition(t) {
		if (!this.action) return;
		let n = !!(this.loopUrl && t.activeClipName && (t.activeClipName === this.queuedLoopClipName || As(t.activeClipName, this.loopUrl)));
		n && this.promoteQueuedLoop();
		let r = Math.max(this.duration, 0);
		this.action.time = r > 0 ? n ? e.MathUtils.euclideanModulo(t.currentTime, r) : e.MathUtils.clamp(t.currentTime, 0, r) : Math.max(t.currentTime, 0), this.mixer?.update(0);
	}
	async refresh(e) {
		let t = ++this.revision;
		if (this.context = e, this.stopPlayback(), this.error = null, !this.motionUrl || !e.root) return { poseApplied: !0 };
		let n = await this.loadCachedClips(this.motionUrl, this.motionKind, !1, t);
		if (t !== this.revision || !n) return { poseApplied: !1 };
		if (!n.length) return this.error = `No clips found in ${this.motionUrl}`, { poseApplied: !1 };
		let r = n.find((e) => !As(e.name, this.motionUrl)) ?? n[0], i = this.preparePlayableClip(r, e, !0);
		if (!i) return { poseApplied: !1 };
		let a = null;
		if (this.loopUrl === this.motionUrl) {
			let t = n.find((e) => As(e.name, this.loopUrl)) ?? n.find((e) => e !== r) ?? null;
			a = t ? this.preparePlayableClip(t, e, !1) : null;
		} else if (this.loopUrl) {
			let n = await this.loadCachedClips(this.loopUrl, this.loopKind, !0, t);
			if (t !== this.revision) return { poseApplied: !1 };
			let r = n?.[0] ?? null;
			a = r ? this.preparePlayableClip(r, e, !1) : null;
		}
		return t === this.revision ? (this.installPlayback(e.root, i, a), { poseApplied: !0 }) : { poseApplied: !1 };
	}
	release(e = {}) {
		this.revision += 1, this.stopPlayback(), this.context = null, e.preserveSelection || this.setSelection(null), e.clearCache && this.clipCache.clear();
	}
	getSnapshot(e = {}) {
		let t = e.utjControlledNodeNames ?? /* @__PURE__ */ new Set(), n = this.context?.prefabHeadFollow, r = this.retargetDebug ? {
			...this.retargetDebug,
			prefabHeadFollow: n
		} : this.context?.retargetWithUnityPrefab ? {
			mode: "unity-prefab",
			bindingCount: 0,
			sourceTrackCount: 0,
			emittedTrackCount: 0,
			resolvedTargetCount: 0,
			resolvedBodyTargetCount: 0,
			resolvedFaceTargetCount: 0,
			unresolvedTrackCount: 0,
			duplicateTargetTrackCount: 0,
			sampleUnresolvedTracks: [],
			sampleResolvedHeadTargets: [],
			prefabHeadFollow: n
		} : null;
		return {
			selectedUrl: this.motionUrl,
			selectedLoopUrl: this.loopUrl,
			activeClipName: this.activeClipName,
			queuedLoopClipName: this.queuedLoopClipName,
			currentTime: this.action?.time ?? 0,
			duration: this.duration,
			paused: this.paused,
			speed: this.speed,
			faceMotionEnabled: e.faceMotionEnabled ?? !1,
			bodyHeadTracksEnabled: this.bodyHeadTracksEnabled,
			bodyTrackDebug: zs(this.action?.getClip() ?? null, t),
			bodyLoopTrackDebug: zs(this.loopAction?.getClip() ?? null, t),
			bodyRetargetDebug: r,
			error: this.error
		};
	}
	async loadCachedClips(e, t, n, r) {
		let i = Gs(e, t), a = this.clipCache.get(i);
		if (a) return a;
		if (t !== "unity-json") return n || (this.error = `Unity motion .msgpack.br is required for ${e}.`), null;
		try {
			let n = await this.loadClips(e, t);
			return this.clipCache.set(i, n), n;
		} catch (e) {
			return !n && r === this.revision && (this.error = dc(e)), null;
		}
	}
	preparePlayableClip(e, t, n) {
		let r = Hs(e, this.bodyHeadTracksEnabled);
		if (!t.retargetWithUnityPrefab) return n && (this.retargetDebug = {
			mode: "none",
			bindingCount: 0,
			sourceTrackCount: r.tracks.length,
			emittedTrackCount: r.tracks.length,
			resolvedTargetCount: r.tracks.length,
			resolvedBodyTargetCount: 0,
			resolvedFaceTargetCount: 0,
			unresolvedTrackCount: 0,
			duplicateTargetTrackCount: 0,
			sampleUnresolvedTracks: [],
			sampleResolvedHeadTargets: [],
			prefabHeadFollow: t.prefabHeadFollow
		}), r;
		if (!t.root) return this.error = "Unity Prefab animation requires a loaded prefab root.", null;
		let i = uc(r, t.root, t.runtimeExtension);
		return n && (this.retargetDebug = {
			...i.debug,
			prefabHeadFollow: t.prefabHeadFollow
		}), i.error ? (this.error = i.error, null) : i.clip;
	}
	installPlayback(t, n, r) {
		this.mixer = new e.AnimationMixer(t);
		let i = n.name || this.motionUrl;
		if (this.activeClipName = i, this.duration = n.duration, this.action = this.mixer.clipAction(n, t), this.configureAction(this.action), this.action.reset(), r) {
			let n = this.getSmoothedLoopClip(r);
			this.loopAction = this.mixer.clipAction(n, t), this.configureAction(this.loopAction), this.loopAction.reset(), this.loopAction.enabled = !1, this.loopAction.loop = e.LoopRepeat, this.loopAction.clampWhenFinished = !1, this.action.loop = e.LoopOnce, this.action.clampWhenFinished = !0, this.queuedLoopClipName = n.name || this.loopUrl || `${i}_loop`, this.finishedHandler = (e) => {
				e.action === this.action && this.promoteQueuedLoop();
			}, this.mixer.addEventListener("finished", this.finishedHandler);
		} else this.action.loop = e.LoopRepeat, this.action.clampWhenFinished = !1, this.queuedLoopClipName = null;
		this.action.play(), this.applySettings(), this.mixer.update(0);
	}
	promoteQueuedLoop() {
		!this.loopAction || !this.mixer || !this.action || (this.removeFinishedHandler(), this.action.stop(), this.loopAction.enabled = !0, this.loopAction.reset(), this.loopAction.play(), this.action = this.loopAction, this.loopAction = null, this.activeClipName = this.queuedLoopClipName ?? this.action.getClip().name, this.duration = this.action.getClip().duration, this.queuedLoopClipName = null, this.onLoopPromoted(), this.applySettings());
	}
	applySettings() {
		for (let e of [this.action, this.loopAction]) e && (e.paused = this.paused, e.enabled = !0, e.setEffectiveTimeScale(this.paused ? 0 : this.speed));
	}
	configureAction(e) {
		e.zeroSlopeAtStart = !1, e.zeroSlopeAtEnd = !1;
	}
	getSmoothedLoopClip(e) {
		let t = this.smoothedLoopClipCache.get(e);
		if (t) return t;
		let n = Ls(e, 60);
		return n !== e && this.smoothedLoopClipCache.set(e, n), n;
	}
	removeFinishedHandler() {
		this.mixer && this.finishedHandler && (this.mixer.removeEventListener("finished", this.finishedHandler), this.finishedHandler = null);
	}
	stopPlayback() {
		this.removeFinishedHandler(), this.action?.stop(), this.loopAction?.stop(), this.mixer?.stopAllAction(), this.action = null, this.loopAction = null, this.mixer = null, this.activeClipName = null, this.duration = 0, this.retargetDebug = null, this.queuedLoopClipName = null;
	}
};
//#endregion
//#region src/engine/faceMotionRuntime.ts
function mc(e) {
	return e && typeof e == "object" ? e : {};
}
function hc(e) {
	let t = e;
	return !!t.isMesh && Array.isArray(t.morphTargetInfluences);
}
function gc(e, t) {
	if (!e.length) return 0;
	if (t <= e[0].time) return e[0].value;
	for (let n = 1; n < e.length; n += 1) {
		let r = e[n - 1], i = e[n];
		if (t > i.time) continue;
		let a = i.time - r.time;
		if (a <= 1e-6) return i.value;
		let o = (t - r.time) / a;
		return r.value + (i.value - r.value) * o;
	}
	return e[e.length - 1].value;
}
function _c(e) {
	let t = mc(mc(e).motionPackage ?? mc(e).MotionPackage);
	return (t.faceMotion ?? t.FaceMotion) || null;
}
var vc = class {
	motionSet = null;
	clip = null;
	loopClip = null;
	time = 0;
	error = null;
	enabled = !0;
	bindings = [];
	bind(e, t) {
		let n = t.morphChannels ?? [], r = t.morphChannelBindings ?? [], i = [];
		return this.bindings.length = 0, e.traverse((e) => {
			if (e.userData.pjskEyeThroughHairOverlay || e.userData.pjskEyeThroughHairStencilPrepass || !hc(e)) return;
			let t = e, a = t.morphTargetInfluences?.length ?? 0;
			if (!a) return;
			(!t.morphTargetDictionary || !Object.keys(t.morphTargetDictionary).length) && n.length === a && (t.morphTargetDictionary = Object.fromEntries(n.map((e, t) => [e, t])));
			let o = t.morphTargetDictionary ?? {}, s = /* @__PURE__ */ new Map(), c = [];
			for (let e of r) {
				let t = o[e.name];
				typeof t == "number" && (s.set(e.curveHash, t), c.push(t));
			}
			t.morphTargetInfluences?.fill(0), this.bindings.push({
				mesh: t,
				curveIndexByHash: s,
				controlledIndices: [...new Set(c)]
			});
			let l = Object.entries(o).sort((e, t) => e[1] - t[1]).map(([e]) => e);
			i.push({
				meshName: t.name,
				morphTargetCount: a,
				mappedChannelCount: s.size,
				sampleChannels: l.slice(0, 12)
			});
		}), i;
	}
	setMotion(e, t, n) {
		if (this.motionSet = e, this.error = null, this.time = 0, this.clip = null, this.loopClip = null, !e?.clips.length) {
			this.clearInfluences();
			return;
		}
		this.clip = e.clips.find((e) => e.name === t) ?? e.clips[0] ?? null, this.clip && (n && n !== this.clip.name && (this.loopClip = e.clips.find((e) => e.name === n) ?? null), this.applyCurrent());
	}
	hasMotion() {
		return this.motionSet !== null;
	}
	isEnabled() {
		return this.enabled;
	}
	setEnabled(e) {
		this.enabled = e, e ? this.applyCurrent() : this.clearInfluences();
	}
	step(e, t, n = !1) {
		if (n || !this.enabled || !this.clip || this.bindings.length === 0) return;
		this.time += e * t;
		let r = this.clip.duration;
		if (r > 0 && this.time > r) if (this.loopClip) {
			let e = this.time - r;
			this.clip = this.loopClip, this.loopClip = null, this.time = this.clip.duration > 0 ? e % this.clip.duration : 0;
		} else this.time %= r;
		this.applyCurrent();
	}
	seek(e) {
		this.time = e, this.applyCurrent();
	}
	promoteLoop() {
		this.loopClip && (this.clip = this.loopClip, this.loopClip = null, this.time = 0, this.applyCurrent());
	}
	applyCurrent() {
		if (!(!this.enabled || !this.clip)) for (let e of this.bindings) {
			let t = e.mesh.morphTargetInfluences;
			if (t) {
				for (let n of e.controlledIndices) t[n] = 0;
				for (let n of this.clip.curves) {
					let r = e.curveIndexByHash.get(n.curveHash);
					r !== void 0 && (t[r] = gc(n.keyframes, this.time) / 100);
				}
			}
		}
	}
	release(e = {}) {
		this.clearInfluences(), this.bindings.length = 0, e.preserveMotion || this.setMotion(null, null, null);
	}
	getSnapshot() {
		return {
			activeClipName: this.clip?.name ?? null,
			queuedLoopClipName: this.loopClip?.name ?? null,
			error: this.error,
			currentTime: this.time,
			mappedMeshCount: this.bindings.length,
			mappedCurveCount: this.bindings.reduce((e, t) => e + t.curveIndexByHash.size, 0)
		};
	}
	clearInfluences() {
		for (let e of this.bindings) {
			let t = e.mesh.morphTargetInfluences;
			if (t) for (let n of e.controlledIndices) t[n] = 0;
		}
	}
};
//#endregion
//#region src/engine/rawMaterialRuntime.ts
function yc(e, t) {
	return e.toLowerCase() === t.toLowerCase();
}
function Y(e, t) {
	let n = e?.floatProperties?.find((e) => yc(e.name, t));
	if (Number.isFinite(n?.value)) return n.value;
	let r = e?.intProperties?.find((e) => yc(e.name, t));
	return Number.isFinite(r?.value) ? r.value : null;
}
function bc(e, t, n) {
	let r = Y(e, t);
	return r === null ? n && (e?.validKeywords?.some((e) => yc(e, n)) || e?.invalidKeywords?.some((e) => yc(e, n))) ? !0 : null : r > .5;
}
function xc(e, t) {
	let n = e?.colorProperties?.find((e) => yc(e.name, t));
	return !n || !Number.isFinite(n.r) || !Number.isFinite(n.g) || !Number.isFinite(n.b) || !Number.isFinite(n.a) ? null : {
		r: n.r,
		g: n.g,
		b: n.b,
		a: n.a
	};
}
function Sc(e, t) {
	return e?.textureProperties?.find((e) => yc(e.name, t)) ?? null;
}
function Cc(t, n, r) {
	if (!t) return;
	let i = Sc(n, r);
	i && (t.repeat.set(i.scaleX, i.scaleY), t.offset.set(i.offsetX, i.offsetY), t.wrapS = wc(i.wrapU), t.wrapT = wc(i.wrapV), t.anisotropy = Math.max(1, i.anisoLevel || 1), i.filterMode === 0 ? (t.magFilter = e.NearestFilter, t.minFilter = e.NearestMipmapNearestFilter) : (t.magFilter = e.LinearFilter, t.minFilter = i.filterMode === 2 ? e.LinearMipmapLinearFilter : e.LinearMipmapNearestFilter)), t.updateMatrix(), t.needsUpdate = !0;
}
function wc(t) {
	switch (t) {
		case 1: return e.ClampToEdgeWrapping;
		case 2: return e.MirroredRepeatWrapping;
		case 3: return e.ClampToEdgeWrapping;
		default: return e.RepeatWrapping;
	}
}
//#endregion
//#region src/engine/characterMaterialRuntime.ts
var Tc = {
	eye: {
		opacity: .2,
		edge1: .9,
		edge2: .2
	},
	eyelash: {
		opacity: .2,
		edge1: .9,
		edge2: .2
	},
	eyebrow: {
		opacity: .5,
		edge1: .5,
		edge2: .1
	},
	eyelight: {
		opacity: .2,
		edge1: .9,
		edge2: .2
	}
};
function Ec() {
	return new e.Vector3(S.x, S.y, S.z);
}
function Dc(t, n) {
	let r = t.clone();
	return fr(r, {
		baseColor: n.baseColor ?? t.uniforms.uBaseColor.value.clone(),
		shadowColor: n.shadowColor ?? t.uniforms.uShadowColor.value.clone(),
		skinColorDefault: n.skinColorDefault ?? t.uniforms.uSkinColorDefault.value.clone(),
		skinColor1: n.skinColor1 ?? t.uniforms.uSkinColor1.value.clone(),
		skinColor2: n.skinColor2 ?? t.uniforms.uSkinColor2.value.clone(),
		mainTex: n.mainTex ?? null,
		shadowTex: n.shadowTex ?? null,
		valueTex: n.valueTex ?? null,
		useValueTex: n.lighting?.useValueTex ?? !!n.valueTex,
		lightDirection: t.uniforms.uLightDirection.value.clone(),
		lightIntensity: t.uniforms.uLightIntensity.value,
		ambientIntensity: t.uniforms.uAmbientIntensity.value,
		shadowThreshold: n.lighting?.sekaiShadowThreshold ?? t.uniforms.uShadowThreshold.value,
		shadowWeight: t.uniforms.uShadowWeight.value,
		characterAmbientIntensity: t.uniforms.uCharacterAmbientIntensity?.value ?? .3,
		rimColorAlpha: t.uniforms.uRimColorAlpha?.value ?? C.rimColorAlpha,
		controllerRimRange: t.uniforms.uControllerRimRange?.value ?? C.rimRange,
		controllerRimEdgeSmoothness: t.uniforms.uControllerRimEdgeSmoothness?.value ?? C.rimEdgeSmoothness,
		controllerRimEmission: t.uniforms.uControllerRimEmission?.value ?? C.rimEmission,
		controllerRimLightInfluence: t.uniforms.uControllerRimLightInfluence?.value ?? C.rimLightInfluence,
		rimDirection: t.uniforms.uRimDirection?.value.clone() ?? Ec(),
		specularPower: n.lighting?.specularPower ?? t.uniforms.uSpecularPower.value,
		rimThreshold: n.lighting?.rimThreshold ?? t.uniforms.uRimThreshold.value,
		shadowTexWeight: n.lighting?.shadowTexWeight ?? t.uniforms.uShadowTexWeight.value,
		fadeMode: n.lighting?.fadeMode ?? t.uniforms.uFadeMode?.value ?? 0,
		hueSinAngle: n.lighting?.hueSinAngle ?? t.uniforms.uHueSinAngle?.value ?? 0,
		hueCosAngle: n.lighting?.hueCosAngle ?? t.uniforms.uHueCosAngle?.value ?? 1,
		shadowWidth: n.lighting?.shadowWidth ?? t.uniforms.uShadowWidth.value,
		shadowWidthOverride: n.shadowWidthOverride ?? ((t.uniforms.uShadowWidthOverride?.value ?? -1) >= 0 ? t.uniforms.uShadowWidthOverride.value : null),
		valueShadowInfluence: n.valueShadowInfluence ?? t.uniforms.uValueShadowInfluence?.value ?? 0,
		hairShadowEnabled: n.hairShadowEnabled ?? (t.uniforms.uHairShadowEnabled?.value ?? 0) > .5,
		useLambert: n.useLambert ?? n.lighting?.useLambert ?? (t.uniforms.uUseLambert?.value ?? 1) > .5,
		headPosition: n.headPosition ?? t.uniforms.uHeadPosition?.value.clone(),
		headNormalBlend: n.lighting?.headNormalBlend ?? t.uniforms.uHeadNormalBlend?.value ?? .7,
		saturation: n.lighting?.saturation ?? t.uniforms.uSaturation.value,
		value: n.lighting?.value ?? t.uniforms.uValue?.value ?? .5,
		contrast: n.lighting?.contrast ?? t.uniforms.uContrast?.value ?? .5,
		partsAmbientColor: n.lighting?.partsAmbientColor ?? t.uniforms.uPartsAmbientColor.value.clone(),
		partsAmbientAlpha: t.uniforms.uPartsAmbientAlpha?.value ?? 0,
		reflectionBlendColor: n.lighting?.reflectionBlendColor ?? t.uniforms.uReflectionBlendColor.value.clone(),
		globalShadowColor: t.uniforms.uGlobalShadowColor ? t.uniforms.uGlobalShadowColor.value.clone() : "#ffffff",
		globalShadowAlpha: t.uniforms.uGlobalShadowAlpha?.value ?? 1,
		controllerAmbientColor: t.uniforms.uControllerAmbientColor ? t.uniforms.uControllerAmbientColor.value.clone() : new e.Color().setRGB(C.ambientColor.r, C.ambientColor.g, C.ambientColor.b),
		controllerAmbientIntensity: t.uniforms.uControllerAmbientIntensity?.value ?? 1,
		controllerSpecularColor: t.uniforms.uControllerSpecularColor ? t.uniforms.uControllerSpecularColor.value.clone() : "#ffffff",
		controllerSpecularIntensity: t.uniforms.uControllerSpecularIntensity?.value ?? 1,
		controllerRimColor: t.uniforms.uControllerRimColor ? t.uniforms.uControllerRimColor.value.clone() : new e.Color().setRGB(C.rimColor.r, C.rimColor.g, C.rimColor.b),
		controllerShadowRimColor: t.uniforms.uControllerShadowRimColor ? t.uniforms.uControllerShadowRimColor.value.clone() : new e.Color().setRGB(C.shadowRimColor.r, C.shadowRimColor.g, C.shadowRimColor.b),
		controllerRimColorWeight: t.uniforms.uControllerRimColorWeight?.value ?? 1,
		controllerShadowRimColorWeight: t.uniforms.uControllerShadowRimColorWeight?.value ?? 1,
		controllerRimShadowSharpness: t.uniforms.uControllerRimShadowSharpness?.value ?? C.rimShadowSharpness,
		bodyDebugMode: n.bodyDebugMode ?? t.uniforms.uBodyDebugMode?.value ?? 0,
		alphaCutoff: n.alphaCutoff ?? t.uniforms.uAlphaCutoff?.value ?? 0
	}), r;
}
async function Oc(t, n, r = e.SRGBColorSpace) {
	if (!n) return null;
	let i = `${r}\u0000${n}`, a = kc.get(t);
	a || (a = /* @__PURE__ */ new Map(), kc.set(t, a));
	let o = a.get(i);
	if (o) return o;
	let s = t.loadAsync(n).then((t) => (t.wrapS = e.RepeatWrapping, t.wrapT = e.RepeatWrapping, t.flipY = !1, t.colorSpace = r, t.needsUpdate = !0, t), () => null).finally(() => {
		a.get(i) === s && a.delete(i);
	});
	return a.set(i, s), s;
}
var kc = /* @__PURE__ */ new WeakMap();
function Ac(e) {
	return e.map ?? null;
}
function jc(t, n) {
	if (!n) return;
	let r = (e) => {
		e && (e.wrapS = n.wrapS, e.wrapT = n.wrapT, e.offset.copy(n.offset), e.repeat.copy(n.repeat), e.center.copy(n.center), e.rotation = n.rotation, e.magFilter = n.magFilter, e.minFilter = n.minFilter, e.anisotropy = n.anisotropy, e.flipY = n.flipY, e.updateMatrix(), e.needsUpdate = !0);
	};
	if (t instanceof e.MeshBasicMaterial) r(t.map);
	else if (t instanceof e.ShaderMaterial) {
		let n = t.uniforms.uMainTex?.value;
		r(n), n && t.uniforms.uMainTexTransform?.value instanceof e.Matrix3 && t.uniforms.uMainTexTransform.value.copy(n.matrix);
	}
}
function Mc(e) {
	let t = e.toLowerCase();
	return t.includes("face") ? "face" : t.includes("hair") ? "hair" : t.includes("acc") ? "acc" : t.includes("body") ? "body" : t;
}
function Nc(t, n, r) {
	if (!n) return;
	let i = (e, t) => Y(r, e) ?? t, a = (e, t, n) => bc(r, e, t) ?? n, o = (t) => Math.round(e.MathUtils.clamp(t, 0, 1) * 255).toString(16).padStart(2, "0"), s = (e, t) => {
		let n = xc(r, e);
		return n ? `#${o(n.r)}${o(n.g)}${o(n.b)}` : t;
	};
	return {
		...n,
		specularPower: i("_SpecularPower", n.specularPower),
		rimThreshold: i("_RimThreshold", n.rimThreshold),
		shadowTexWeight: i("_ShadowTexWeight", n.shadowTexWeight),
		fadeMode: i("_FadeMode", n.fadeMode),
		hueSinAngle: i("_HueSinAngle", n.hueSinAngle),
		hueCosAngle: i("_HueCosAngle", n.hueCosAngle),
		saturation: i("_Saturation", n.saturation),
		value: i("_Value", n.value),
		contrast: i("_Contrast", n.contrast),
		partsAmbientColor: s("_PartsAmbientColor", n.partsAmbientColor),
		reflectionBlendColor: s("_ReflectionBlendColor", n.reflectionBlendColor),
		outlineWidth: i("_OutlineWidth", n.outlineWidth),
		outlineOffset: i("_OutlineOffset", n.outlineOffset),
		outlineLightness: i("_OutlineL", n.outlineLightness),
		shadowWidth: i("_ShadowWidth", n.shadowWidth),
		useOutlineSecondNormal: Y(r, "_UseOutlineSecondNormal") ?? (bc(r, "_UseOutlineSecondNormal", "_OUTLINE_SECOND_NORMAL") === !0 ? 1 : n.useOutlineSecondNormal),
		sekaiShadowThreshold: Y(r, "_SekaiShadowThreshold") ?? n.sekaiShadowThreshold,
		useLambert: a("_UseLambert", "_LAMBERT", n.useLambert),
		useValueTex: a("_UseValueTex", void 0, n.useValueTex),
		useFaceSdf: a("_UseFaceSDF", "_USE_FACE_SDF", n.useFaceSdf),
		useFaceShadowLimiter: a("_UseFaceShadowLimiter", "_FACE_SHADOW_RANGE_LIMIT", n.useFaceShadowLimiter),
		rangeLimit: Y(r, "_RangeLimit") ?? n.rangeLimit,
		hairShadow: a("_HairShadow", "_HAIR_SHADOW", n.hairShadow),
		headNormalBlend: i("_HeadNormalBlend", n.headNormalBlend ?? .7)
	};
}
function Pc(t, n) {
	if (!(t instanceof e.ShaderMaterial) || !n) return;
	let r = t.uniforms, i = (e, t) => {
		let i = Y(n, t);
		i !== null && r[e] && (r[e].value = i);
	}, a = (e, t, i) => {
		let a = xc(n, t);
		a && (r[e]?.value?.setRGB(a.r, a.g, a.b), i && r[i] && (r[i].value = a.a));
	};
	a("uPartsAmbientColor", "_PartsAmbientColor", "uPartsAmbientAlpha"), a("uReflectionBlendColor", "_ReflectionBlendColor"), a("uSkinColorDefault", "_DefaultSkinColor"), a("uSkinColor1", "_Shadow1SkinColor"), a("uSkinColor2", "_Shadow2SkinColor"), i("uUseLambert", "_UseLambert"), i("uUseValueTex", "_UseValueTex"), i("uHeadNormalBlend", "_HeadNormalBlend");
	let o = bc(n, "_UseAlphaClip", "_ALPHATEST_ON");
	o !== null && r.uAlphaCutoff && (r.uAlphaCutoff.value = o ? e.MathUtils.clamp(Y(n, "_Cutoff") ?? .5, 0, 1) : 0);
}
function Fc(t) {
	t.stencilWrite = !0, t.stencilRef = 0, t.stencilFunc = e.AlwaysStencilFunc, t.stencilFuncMask = 255, t.stencilWriteMask = 255, t.stencilFail = e.KeepStencilOp, t.stencilZFail = e.KeepStencilOp, t.stencilZPass = e.ReplaceStencilOp;
}
function Ic(t, n, r, i) {
	if (t.side = e.FrontSide, t.transparent = !0, t.stencilWrite = !0, t.stencilRef = n, t.stencilFunc = e.EqualStencilFunc, t.stencilFuncMask = n, t.stencilWriteMask = n, t.stencilFail = e.KeepStencilOp, t.stencilZFail = e.KeepStencilOp, t.stencilZPass = e.KeepStencilOp, t.depthTest = !0, t.depthWrite = !1, t.depthFunc = e.AlwaysDepth, t.blending = e.CustomBlending, t.blendSrc = e.SrcAlphaFactor, t.blendDst = e.OneMinusSrcAlphaFactor, t.blendEquation = e.AddEquation, t.blendSrcAlpha = e.ZeroFactor, t.blendDstAlpha = e.OneFactor, t.blendEquationAlpha = e.AddEquation, t.polygonOffset = !1, r) {
		let n = Tc[r], a = (e, t) => Y(i, e) ?? xc(i, e)?.r ?? t, o = {
			opacity: a("_EyelashTransparent", n.opacity),
			edge1: a("_EyelashFaceCameraEdge1", n.edge1),
			edge2: a("_EyelashFaceCameraEdge2", n.edge2)
		};
		t.userData.pjskSekaiEyelashViewSettings = { ...o }, t instanceof e.ShaderMaterial && t.uniforms.uAlphaScale && (t.uniforms.uAlphaScale.value = o.opacity), t instanceof e.ShaderMaterial && t.uniforms.uAlphaSource && (t.uniforms.uAlphaSource.value = r === "eyelight" ? 2 : 1);
	}
}
function Lc(t, n) {
	let r = t.userData.pjskSekaiEyelashViewSettings;
	if (!r) return null;
	let i = r.edge1 - r.edge2, a = i === 0 ? +(n >= r.edge1) : e.MathUtils.clamp((n - r.edge2) / i, 0, 1), o = a * a * (3 - 2 * a) * r.opacity;
	return t instanceof e.ShaderMaterial && t.uniforms.uAlphaScale && (t.uniforms.uAlphaScale.value = o), o;
}
function Rc(t, n) {
	t.transparent = !1, t.colorWrite = !1, t.stencilWrite = !0, t.stencilRef = n, t.stencilFunc = e.AlwaysStencilFunc, t.stencilFuncMask = 255, t.stencilWriteMask = n, t.stencilFail = e.KeepStencilOp, t.stencilZFail = e.KeepStencilOp, t.stencilZPass = e.ReplaceStencilOp, t.depthTest = !0, t.depthWrite = !1, t.depthFunc = e.LessEqualDepth;
}
function zc(t, n) {
	t.stencilWrite = !0, t.stencilRef = 0, t.stencilFunc = e.AlwaysStencilFunc, t.stencilFuncMask = 255, t.stencilWriteMask = 255 & ~n, t.stencilFail = e.KeepStencilOp, t.stencilZFail = e.KeepStencilOp, t.stencilZPass = e.ReplaceStencilOp;
}
function Bc(e) {
	switch (e) {
		case "face_sdf":
		case "face":
		case "accessory":
		case "body":
		case "eyelight": return 2e3;
		case "eye_stencil_prepass": return 2001;
		case "eyelash_stencil_prepass": return 2001.1;
		case "eyebrow_stencil_prepass": return 2001.2;
		case "eyelash":
		case "eyebrow": return 2001;
		case "eye": return 2002;
		case "hair": return 2451;
		case "eye_through_hair": return 2452;
		case "eyelash_through_hair": return 2453;
		case "eyebrow_through_hair": return 2454;
		case "eyelight_through_hair": return 2455;
		default: return 2e3;
	}
}
function Vc(e, t) {
	if (t.length < 2 || e.geometry.groups.length < 2) return;
	let n = e.geometry.groups.map((e, n) => {
		let r = t[e.materialIndex ?? 0], i = typeof r?.userData.pjskMaterialKind == "string" ? r.userData.pjskMaterialKind : "";
		return {
			start: e.start,
			count: e.count,
			materialIndex: e.materialIndex ?? 0,
			order: Bc(i),
			index: n
		};
	}).sort((e, t) => e.order - t.order || e.index - t.index);
	e.geometry.clearGroups();
	for (let t of n) e.geometry.addGroup(t.start, t.count, t.materialIndex);
}
function Hc(t, n, r, i) {
	if (n.length === 0 || r.length === 0) return null;
	let a = t.geometry.clone();
	a.clearGroups();
	for (let e of n) a.addGroup(e.start, e.count, e.materialIndex);
	let o = t, s = o.isSkinnedMesh ? new e.SkinnedMesh(a, r) : new e.Mesh(a, r);
	if (s.name = `${t.name}_${i}`, s.position.copy(t.position), s.quaternion.copy(t.quaternion), s.scale.copy(t.scale), s.matrix.copy(t.matrix), s.matrixAutoUpdate = t.matrixAutoUpdate, s.matrixWorldAutoUpdate = t.matrixWorldAutoUpdate, s.layers.mask = t.layers.mask, s.visible = t.visible, s.renderOrder = Math.min(...r.map((e) => Bc(typeof e.userData.pjskMaterialKind == "string" ? e.userData.pjskMaterialKind : ""))), s.frustumCulled = t.frustumCulled, s.castShadow = !1, s.receiveShadow = !1, s.morphTargetDictionary = t.morphTargetDictionary, s.morphTargetInfluences = t.morphTargetInfluences, Vc(s, r), s.isSkinnedMesh && o.isSkinnedMesh) {
		let e = s;
		e.bind(o.skeleton, o.bindMatrix), e.bindMode = o.bindMode, e.bindMatrix.copy(o.bindMatrix), e.bindMatrixInverse.copy(o.bindMatrixInverse);
	}
	return s;
}
function Uc(e, t, n) {
	let r = Hc(e, t, n, "through_hair_overlay");
	if (!r) return null;
	let i = typeof n[0]?.userData.pjskMaterialKind == "string" ? n[0].userData.pjskMaterialKind : "", a = i.startsWith("eyelash_") ? "eyelash" : i.startsWith("eyebrow_") ? "eyebrow" : i.startsWith("eyelight_") ? "eyelight" : i.startsWith("eye_") ? "eye" : "";
	return r.userData.pjskEyeThroughHairSource = e, r.userData.pjskEyeThroughHairSourceKind = a, r.userData.pjskEyeThroughHairPassKind = "overlay", r.userData.pjskEyeThroughHairOverlay = !0, r;
}
async function Wc({ root: t, bodyAsset: n, headAsset: r, textureLoader: i, template: a, bodyDebugMode: o, debug: s = [] }) {
	let c = await Promise.all(n.bodyMaterials.map(async (t) => {
		if (!t.materialKind) throw Error(`Body material ${t.materialName ?? t.materialKey} is missing materialKind.`);
		let [s, c, l] = await Promise.all([
			Oc(i, t.mainTex),
			Oc(i, t.shadowTex),
			Oc(i, t.valueTex, e.NoColorSpace)
		]);
		Cc(s, t.rawMaterial, "_MainTex"), Cc(c, t.rawMaterial, "_ShadowTex"), Cc(l, t.rawMaterial, "_ValueTex");
		let u = Nc(t.materialKind, t.lighting, t.rawMaterial), d = Dc(a, {
			mainTex: s,
			shadowTex: c,
			valueTex: l,
			baseColor: n.proxy.bodyColor,
			shadowColor: n.proxy.shadowColor,
			skinColorDefault: r?.proxy.skinColorDefault ?? r?.proxy.faceColor ?? n.proxy.bodyColor,
			skinColor1: r?.proxy.skinColor1 ?? r?.proxy.faceShadeColor ?? n.proxy.shadowColor,
			skinColor2: r?.proxy.skinColor2 ?? r?.proxy.faceShadeColor ?? n.proxy.shadowColor,
			lighting: u,
			bodyDebugMode: o
		});
		return Pc(d, t.rawMaterial), Fc(d), d.userData.pjskLighting = u, d.userData.pjskRawMaterial = t.rawMaterial, d.userData.pjskMaterialKind = t.materialKind, d.userData.pjskMaterialKey = t.materialKey, d.userData.pjskMaterialSlotIndex = t.slotIndex, {
			key: t.materialKey,
			meshKey: Mc(t.meshName),
			materialKey: t.materialKey,
			materialKind: t.materialKind,
			mainTex: t.mainTex ?? null,
			shadowTex: t.shadowTex ?? null,
			valueTex: t.valueTex ?? null,
			material: d
		};
	}));
	return t.traverse((t) => {
		let n = t;
		if (!n.isMesh) return;
		let r = Array.isArray(n.material) ? n.material : [n.material], i = c.filter((e) => e.meshKey === Mc(n.name));
		if (i.length === 0) return;
		let a = r.map((t) => {
			let r = typeof t.userData.pjskMaterialKey == "string" ? t.userData.pjskMaterialKey : "";
			if (!r) throw Error(`Body mesh '${n.name}' material '${t.name}' is missing pjskMaterialKey; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			let a = i.find((e) => e.materialKey === r);
			if (!a) throw Error(`Body mesh '${n.name}' material key '${r}' was not found in body material slots.`);
			let o = Ac(t);
			jc(a.material, o), n.userData.pjskMaterialKind = a.materialKind;
			let c = !1;
			!a.material.uniforms.uMainTex.value && o && (a.material.uniforms.uMainTex.value = o, a.material.uniforms.uMainTexTransform.value.copy(o.matrix), a.material.uniforms.uUseMainTex.value = 1, a.material.uniforms.uBaseColor.value.set("#ffffff"), c = !0);
			let l = a.material.uniforms;
			return s.push({
				meshName: n.name,
				sourceMaterialName: t.name,
				resolvedKey: a.key,
				resolvedKind: a.materialKind,
				usedOriginalMap: c,
				boundMainTex: a.mainTex,
				boundShadowTex: a.shadowTex,
				boundValueTex: a.valueTex,
				boundFaceShadowTex: null,
				finalMaterialType: a.material.type,
				shaderHasMainTex: l.uUseMainTex?.value ?? null,
				shaderHasShadowTex: l.uUseShadowTex?.value ?? null,
				shaderHasValueTex: l.uUseValueTex?.value ?? null,
				shaderLightDirectionX: l.uLightDirection?.value?.x ?? null,
				shaderLightDirectionY: l.uLightDirection?.value?.y ?? null,
				shaderLightDirectionZ: l.uLightDirection?.value?.z ?? null,
				shaderShadowThreshold: l.uShadowThreshold?.value ?? null,
				shaderShadowWeight: l.uShadowWeight?.value ?? null,
				shaderShadowWidthOverride: l.uShadowWidthOverride?.value ?? null,
				shaderValueShadowInfluence: l.uValueShadowInfluence?.value ?? null,
				shaderLambertEnabled: l.uUseLambert?.value ?? null,
				shaderHeadNormalBlend: l.uHeadNormalBlend?.value ?? null,
				shaderSpecularPower: l.uSpecularPower?.value ?? null,
				shaderRimThreshold: l.uRimThreshold?.value ?? null,
				shaderControllerRimRange: l.uControllerRimRange?.value ?? null,
				shaderControllerRimEdgeSmoothness: l.uControllerRimEdgeSmoothness?.value ?? null,
				shaderRimColorAlpha: l.uRimColorAlpha?.value ?? null,
				shaderControllerRimEmission: l.uControllerRimEmission?.value ?? null,
				shaderControllerRimLightInfluence: l.uControllerRimLightInfluence?.value ?? null,
				shaderCharacterAmbient: l.uCharacterAmbientIntensity?.value ?? null,
				shaderShadowTexWeight: l.uShadowTexWeight?.value ?? null,
				shaderSaturation: l.uSaturation?.value ?? null,
				shaderPartsAmbientAlpha: l.uPartsAmbientAlpha?.value ?? null,
				shaderSkinColorDefault: l.uSkinColorDefault?.value ? `#${l.uSkinColorDefault.value.getHexString(e.LinearSRGBColorSpace)}` : null,
				shaderSkinColor1: l.uSkinColor1?.value ? `#${l.uSkinColor1.value.getHexString(e.LinearSRGBColorSpace)}` : null,
				shaderSkinColor2: l.uSkinColor2?.value ? `#${l.uSkinColor2.value.getHexString(e.LinearSRGBColorSpace)}` : null,
				shaderBodyDebugMode: l.uBodyDebugMode?.value ?? null
			}), a.material;
		}), o = new Set(a);
		r.forEach((e) => {
			o.has(e) || e.dispose();
		}), n.material = Array.isArray(n.material) ? a : a[0], n.castShadow = !1, n.receiveShadow = !1;
	}), s;
}
//#endregion
//#region src/engine/headMaterialRuntime.ts
var Gc = 1, Kc = .02, qc = .02;
function Jc(t, n, r, i, a, o, s) {
	let c = i.material instanceof e.ShaderMaterial ? i.material.uniforms : null;
	t.push({
		meshName: n.name,
		sourceMaterialName: r.name,
		resolvedKey: i.key,
		resolvedKind: i.materialKind,
		usedOriginalMap: a,
		boundMainTex: i.mainTex,
		boundShadowTex: i.shadowTex,
		boundValueTex: i.valueTex,
		boundFaceShadowTex: i.faceShadowTex,
		finalMaterialType: i.material.type,
		shaderHasMainTex: c?.uUseMainTex?.value ?? null,
		shaderHasShadowTex: c?.uUseShadowTex?.value ?? null,
		shaderHasFaceShadowTex: c?.uUseFaceShadowTex?.value ?? null,
		shaderHasValueTex: c?.uUseValueTex?.value ?? null,
		shaderLightDirectionX: c?.uLightDirection?.value?.x ?? null,
		shaderLightDirectionY: c?.uLightDirection?.value?.y ?? null,
		shaderLightDirectionZ: c?.uLightDirection?.value?.z ?? null,
		shaderShadowThreshold: c?.uShadowThreshold?.value ?? null,
		shaderShadowWeight: c?.uShadowWeight?.value ?? null,
		shaderShadowWidthOverride: c?.uShadowWidthOverride?.value ?? null,
		shaderValueShadowInfluence: c?.uValueShadowInfluence?.value ?? null,
		shaderHairShadowEnabled: i.materialKind === "hair" ? c?.uHairShadowEnabled?.value ?? null : null,
		shaderHeadNormalBlend: i.materialKind === "hair" ? c?.uHeadNormalBlend?.value ?? null : null,
		shaderLambertEnabled: c?.uUseLambert?.value ?? null,
		shaderBodyDebugMode: c?.uBodyDebugMode?.value ?? null,
		shaderSpecularPower: c?.uSpecularPower?.value ?? null,
		shaderRimThreshold: c?.uRimThreshold?.value ?? null,
		shaderControllerRimRange: c?.uControllerRimRange?.value ?? null,
		shaderControllerRimEdgeSmoothness: c?.uControllerRimEdgeSmoothness?.value ?? null,
		shaderRimColorAlpha: c?.uRimColorAlpha?.value ?? null,
		shaderControllerRimEmission: c?.uControllerRimEmission?.value ?? null,
		shaderControllerRimLightInfluence: c?.uControllerRimLightInfluence?.value ?? null,
		shaderCharacterAmbient: c?.uCharacterAmbientIntensity?.value ?? null,
		shaderShadowTexWeight: c?.uShadowTexWeight?.value ?? null,
		shaderSaturation: c?.uSaturation?.value ?? null,
		shaderPartsAmbientAlpha: c?.uPartsAmbientAlpha?.value ?? null,
		shaderSkinColorDefault: c?.uSkinColorDefault?.value ? `#${c.uSkinColorDefault.value.getHexString(e.LinearSRGBColorSpace)}` : null,
		shaderSkinColor1: c?.uSkinColor1?.value ? `#${c.uSkinColor1.value.getHexString(e.LinearSRGBColorSpace)}` : null,
		shaderSkinColor2: c?.uSkinColor2?.value ? `#${c.uSkinColor2.value.getHexString(e.LinearSRGBColorSpace)}` : null,
		shaderFaceDebugMode: c?.uFaceDebugMode?.value ?? null,
		shaderFaceSdfEnabled: c?.uFaceSdfEnabled?.value ?? null,
		faceSdfCapable: o,
		faceSdfUv1Available: s,
		shaderAtlasTileX: c?.uAtlasTile?.value?.x ?? null,
		shaderAtlasTileY: c?.uAtlasTile?.value?.y ?? null,
		shaderAtlasSample: c?.uAtlasSample?.value ?? null,
		shaderUseAtlas: c?.uUseAtlas?.value ?? null,
		shaderAlphaScale: c?.uAlphaScale?.value ?? null,
		shaderAlphaCutoff: c?.uAlphaCutoff?.value ?? null,
		shaderStrictAlpha: c?.uStrictAlpha?.value ?? null,
		shaderStencilWrite: i.material.stencilWrite ?? null,
		shaderStencilRef: i.material.stencilRef ?? null,
		shaderStencilFunc: i.material.stencilFunc ?? null,
		shaderStencilFuncMask: i.material.stencilFuncMask ?? null,
		shaderStencilWriteMask: i.material.stencilWriteMask ?? null,
		shaderStencilZPass: i.material.stencilZPass ?? null,
		shaderDepthFunc: i.material.depthFunc ?? null,
		shaderDepthWrite: i.material.depthWrite ?? null,
		shaderTransparent: i.material.transparent ?? null,
		renderOrder: n.renderOrder
	});
}
function Yc(t, n, r, i, a = !0) {
	let o = i instanceof e.ShaderMaterial ? i.uniforms : null;
	t.push({
		meshName: n,
		sourceMaterialName: r,
		resolvedKey: null,
		resolvedKind: typeof i.userData.pjskMaterialKind == "string" ? i.userData.pjskMaterialKind : null,
		usedOriginalMap: !1,
		boundMainTex: null,
		boundShadowTex: null,
		boundValueTex: null,
		boundFaceShadowTex: null,
		finalMaterialType: i.type,
		shaderHasMainTex: o?.uUseMainTex?.value ?? null,
		...a ? {
			shaderAtlasTileX: o?.uAtlasTile?.value?.x ?? null,
			shaderAtlasTileY: o?.uAtlasTile?.value?.y ?? null,
			shaderAtlasSample: o?.uAtlasSample?.value ?? null
		} : {},
		shaderUseAtlas: o?.uUseAtlas?.value ?? null,
		shaderAlphaScale: o?.uAlphaScale?.value ?? null,
		shaderAlphaCutoff: o?.uAlphaCutoff?.value ?? null,
		shaderStrictAlpha: o?.uStrictAlpha?.value ?? null,
		shaderStencilWrite: i.stencilWrite ?? null,
		shaderStencilRef: i.stencilRef ?? null,
		shaderStencilFunc: i.stencilFunc ?? null,
		shaderStencilFuncMask: i.stencilFuncMask ?? null,
		shaderStencilWriteMask: i.stencilWriteMask ?? null,
		shaderStencilZPass: i.stencilZPass ?? null,
		shaderDepthFunc: i.depthFunc ?? null,
		shaderDepthWrite: i.depthWrite ?? null,
		shaderTransparent: i.transparent ?? null,
		renderOrder: Bc(typeof i.userData.pjskMaterialKind == "string" ? i.userData.pjskMaterialKind : "")
	});
}
function Xc(t, n) {
	let r = t.clone();
	return hr(r, {
		baseColor: n.baseColor ?? t.uniforms.uBaseColor.value.clone(),
		warmColor: n.warmColor ?? t.uniforms.uWarmColor.value.clone(),
		skinColorDefault: n.skinColorDefault ?? t.uniforms.uSkinColorDefault.value.clone(),
		skinColor1: n.skinColor1 ?? t.uniforms.uSkinColor1.value.clone(),
		skinColor2: n.skinColor2 ?? t.uniforms.uSkinColor2.value.clone(),
		mainTex: n.mainTex ?? null,
		shadowTex: n.shadowTex ?? null,
		valueTex: n.valueTex ?? null,
		faceShadowTex: n.faceShadowTex ?? null,
		lightDirection: t.uniforms.uLightDirection.value.clone(),
		lightIntensity: t.uniforms.uLightIntensity.value,
		ambientIntensity: t.uniforms.uAmbientIntensity.value,
		headDotDirectionalLight: t.uniforms.uHeadDotDirectionalLight?.value,
		faceDebugMode: t.uniforms.uFaceDebugMode?.value ?? 0,
		faceSdfEnabled: !1,
		useValueTex: n.lighting?.useValueTex ?? !!n.valueTex,
		shadowThreshold: n.lighting?.sekaiShadowThreshold ?? t.uniforms.uShadowThreshold?.value ?? .5,
		shadowWeight: t.uniforms.uShadowWeight?.value ?? 1,
		shadowWidth: n.lighting?.shadowWidth ?? t.uniforms.uShadowWidth?.value ?? 0,
		fadeMode: n.lighting?.fadeMode ?? t.uniforms.uFadeMode?.value ?? 0,
		useLambert: n.lighting?.useLambert ?? !0,
		shadowTexWeight: n.lighting?.shadowTexWeight ?? t.uniforms.uShadowTexWeight?.value ?? 1,
		useFaceShadowLimiter: n.lighting?.useFaceShadowLimiter ?? (t.uniforms.uUseFaceShadowLimiter?.value ?? 1) > .5,
		faceShadowLimitRange: n.lighting?.rangeLimit ?? t.uniforms.uFaceShadowLimitRange?.value ?? 0,
		hueSinAngle: n.lighting?.hueSinAngle ?? t.uniforms.uHueSinAngle?.value ?? 0,
		hueCosAngle: n.lighting?.hueCosAngle ?? t.uniforms.uHueCosAngle?.value ?? 1,
		saturation: n.lighting?.saturation ?? t.uniforms.uSaturation?.value ?? .5,
		value: n.lighting?.value ?? t.uniforms.uValue?.value ?? .5,
		contrast: n.lighting?.contrast ?? t.uniforms.uContrast?.value ?? .5,
		partsAmbientColor: n.lighting?.partsAmbientColor ?? (t.uniforms.uPartsAmbientColor ? t.uniforms.uPartsAmbientColor.value.clone() : "#ffffff"),
		partsAmbientAlpha: t.uniforms.uPartsAmbientAlpha?.value ?? 0,
		controllerAmbientColor: t.uniforms.uControllerAmbientColor ? t.uniforms.uControllerAmbientColor.value.clone() : new e.Color().setRGB(C.ambientColor.r, C.ambientColor.g, C.ambientColor.b),
		controllerAmbientIntensity: t.uniforms.uControllerAmbientIntensity?.value ?? 1,
		controllerSpecularColor: t.uniforms.uControllerSpecularColor ? t.uniforms.uControllerSpecularColor.value.clone() : new e.Color().setRGB(C.specularColor.r, C.specularColor.g, C.specularColor.b),
		controllerSpecularIntensity: t.uniforms.uControllerSpecularIntensity?.value ?? 1,
		controllerRimColor: t.uniforms.uControllerRimColor ? t.uniforms.uControllerRimColor.value.clone() : new e.Color().setRGB(C.rimColor.r, C.rimColor.g, C.rimColor.b),
		controllerShadowRimColor: t.uniforms.uControllerShadowRimColor ? t.uniforms.uControllerShadowRimColor.value.clone() : new e.Color().setRGB(C.shadowRimColor.r, C.shadowRimColor.g, C.shadowRimColor.b),
		controllerRimColorWeight: t.uniforms.uControllerRimColorWeight?.value ?? 1,
		controllerShadowRimColorWeight: t.uniforms.uControllerShadowRimColorWeight?.value ?? 1,
		controllerRimRange: t.uniforms.uControllerRimRange?.value ?? C.rimRange,
		controllerRimEdgeSmoothness: t.uniforms.uControllerRimEdgeSmoothness?.value ?? C.rimEdgeSmoothness,
		controllerRimEmission: t.uniforms.uControllerRimEmission?.value ?? C.rimEmission,
		controllerRimLightInfluence: t.uniforms.uControllerRimLightInfluence?.value ?? C.rimLightInfluence,
		controllerRimShadowSharpness: t.uniforms.uControllerRimShadowSharpness?.value ?? C.rimShadowSharpness,
		rimColorAlpha: t.uniforms.uRimColorAlpha?.value ?? C.rimColorAlpha,
		rimDirection: t.uniforms.uRimDirection?.value.clone(),
		specularPower: n.lighting?.specularPower ?? t.uniforms.uSpecularPower?.value ?? 0,
		rimThreshold: n.lighting?.rimThreshold ?? t.uniforms.uRimThreshold?.value ?? .2,
		globalShadowColor: t.uniforms.uGlobalShadowColor ? t.uniforms.uGlobalShadowColor.value.clone() : "#ffffff",
		globalShadowAlpha: t.uniforms.uGlobalShadowAlpha?.value ?? 1
	}), r;
}
function Zc(e, t) {
	let n = new Set(t);
	for (let t of e) n.has(t) || t.dispose();
}
function Qc(e) {
	return !!e.geometry?.getAttribute("uv1");
}
function $c(e, t) {
	return {
		tintColor: e?.tintColor,
		emissionColor: e?.emissionColor,
		lightInfluence: e?.lightInfluence ?? t?.lightInfluence,
		distortionFps: t?.distortionFps,
		distortionIntensity: t?.distortionIntensity,
		distortionIntensityX: t?.distortionIntensityX,
		distortionIntensityY: t?.distortionIntensityY,
		distortionOffsetX: t?.distortionOffsetX,
		distortionOffsetY: t?.distortionOffsetY,
		distortionScrollSpeed: t?.distortionScrollSpeed,
		distortionScrollX: t?.distortionScrollX,
		distortionScrollY: t?.distortionScrollY,
		distortionTexTilingX: t?.distortionTexTilingX,
		distortionTexTilingY: t?.distortionTexTilingY,
		threshold: t?.threshold
	};
}
function el(e, t) {
	return {
		...$c(e, t),
		highlightInfluence: e?.lightInfluenceForEyeHighlight ?? t?.lightInfluenceForEyeHighlight
	};
}
async function tl({ root: t, headAsset: n, textureLoader: r, templates: i, view: a, hair: o, eyeController: s, debug: c = [] }) {
	let l = [], u = [], d = [], f = await Promise.all(n.faceMaterials.map(async (t) => {
		let [c, l, u, d] = await Promise.all([
			Oc(r, t.mainTex),
			Oc(r, t.shadowTex),
			Oc(r, t.valueTex, e.NoColorSpace),
			Oc(r, t.faceShadowTex, e.NoColorSpace)
		]);
		if (Cc(c, t.rawMaterial, "_MainTex"), Cc(l, t.rawMaterial, "_ShadowTex"), Cc(u, t.rawMaterial, "_ValueTex"), Cc(d, t.rawMaterial, "_FaceShadowTex"), !t.materialKind) throw Error(`Head material ${t.materialName ?? t.materialKey} is missing materialKind.`);
		let f = t.materialKind, p = !!t.isAccessory || f === "accessory", m = Nc(f, t.lighting, t.rawMaterial), h, g = null, _ = null;
		if (f === "eye") {
			let n = $c(s, m);
			h = _r(c, "eye", s?.baseTiling, {
				...n,
				strictAlpha: !0
			}), h.side = e.FrontSide;
			let r = _r(c, "eye", s?.baseTiling, n);
			r.side = e.FrontSide, Rc(r, Gc), r.userData.pjskMaterialKind = "eye_stencil_prepass";
			let i = _r(c, "eye", s?.baseTiling, {
				...n,
				strictAlpha: !0
			});
			i.side = e.FrontSide, Ic(i, Gc, "eye", t.rawMaterial), i.userData.pjskMaterialKind = "eye_through_hair", h.userData.pjskOverlayMaterial = i, h.userData.pjskStencilPrepassMaterial = r;
		} else if (f === "eyelight") {
			let n = el(s, m);
			g = _r(c, "eyelight", s?.highlightTiling, n), g.side = e.FrontSide, h = g.clone(), h.visible = !1, h.colorWrite = !1, h.depthWrite = !1;
			let r = _r(c, "eyelight", s?.highlightTiling, n);
			r.side = e.FrontSide, Ic(r, Gc, "eyelight", t.rawMaterial), r.userData.pjskMaterialKind = "eyelight_through_hair", h.userData.pjskOverlayMaterial = r;
		} else if (f === "eyelash" || f === "eyebrow") {
			h = _r(c, "alpha", null, { vertexBViewOffset: .015 }), _ = Xc(i.face, {
				mainTex: c,
				shadowTex: l,
				valueTex: u,
				faceShadowTex: d,
				baseColor: n.proxy.faceColor,
				warmColor: n.proxy.faceShadeColor,
				skinColorDefault: n.proxy.skinColorDefault ?? n.proxy.faceColor,
				skinColor1: n.proxy.skinColor1 ?? n.proxy.faceShadeColor,
				skinColor2: n.proxy.skinColor2 ?? n.proxy.faceShadeColor,
				lighting: m
			}), h.side = e.FrontSide;
			let r = _r(c, "alpha", null, { strictAlpha: !0 });
			r.side = e.FrontSide, Rc(r, Gc), r.userData.pjskMaterialKind = f === "eyelash" ? "eyelash_stencil_prepass" : "eyebrow_stencil_prepass";
			let a = _r(c, "alpha", null, { strictAlpha: !0 });
			a.side = e.FrontSide, Ic(a, Gc, f, t.rawMaterial), a.userData.pjskMaterialKind = f === "eyelash" ? "eyelash_through_hair" : "eyebrow_through_hair", h.userData.pjskOverlayMaterial = a, h.userData.pjskStencilPrepassMaterial = r;
		} else if (f === "hair") h = Dc(i.hair, {
			mainTex: c,
			shadowTex: l,
			valueTex: u,
			baseColor: n.proxy.hairColor,
			shadowColor: n.proxy.hairShadowColor,
			lighting: m,
			hairShadowEnabled: o.proximityShadowEnabled && o.controllerPresent && m?.hairShadow === !0,
			useLambert: o.controllerPresent ? !0 : m?.useLambert ?? !0,
			headPosition: o.headPosition,
			bodyDebugMode: a.bodyDebugMode,
			alphaCutoff: Kc
		}), zc(h, Gc);
		else if (f === "accessory" || f === "body") h = Dc(i.body, {
			mainTex: c,
			shadowTex: l,
			valueTex: u,
			baseColor: n.proxy.skinColorDefault ?? n.proxy.faceColor,
			shadowColor: n.proxy.skinColor1 ?? n.proxy.faceShadeColor,
			skinColorDefault: n.proxy.skinColorDefault ?? n.proxy.faceColor,
			skinColor1: n.proxy.skinColor1 ?? n.proxy.faceShadeColor,
			skinColor2: n.proxy.skinColor2 ?? n.proxy.faceShadeColor,
			lighting: m,
			bodyDebugMode: a.bodyDebugMode,
			alphaCutoff: f === "accessory" ? qc : 0
		}), Fc(h);
		else {
			let t = Xc(i.face, {
				mainTex: c,
				shadowTex: l,
				valueTex: u,
				faceShadowTex: d,
				baseColor: n.proxy.faceColor,
				warmColor: n.proxy.faceShadeColor,
				skinColorDefault: n.proxy.skinColorDefault ?? n.proxy.faceColor,
				skinColor1: n.proxy.skinColor1 ?? n.proxy.faceShadeColor,
				skinColor2: n.proxy.skinColor2 ?? n.proxy.faceShadeColor,
				lighting: m
			});
			t.uniforms.uFaceDebugMode && (t.uniforms.uFaceDebugMode.value = a.faceDebugMode), t.side = e.FrontSide, Fc(t), h = t;
		}
		return Pc(h, t.rawMaterial), _ && (Pc(_, t.rawMaterial), h.userData.pjskOutlineSourceMaterial = _), h.userData.pjskLighting = m, h.userData.pjskRawMaterial = t.rawMaterial, h.userData.pjskMaterialKind = f, h.userData.pjskIsAccessory = p, h.userData.pjskMaterialKey = t.materialKey, h.userData.pjskMaterialSlotIndex = t.slotIndex, g && (g.userData.pjskLighting = m, g.userData.pjskRawMaterial = t.rawMaterial, g.userData.pjskMaterialKind = f, g.userData.pjskIsAccessory = p, g.userData.pjskMaterialKey = t.materialKey, g.userData.pjskMaterialSlotIndex = t.slotIndex), {
			key: t.materialKey,
			meshKey: Mc(t.meshName),
			materialKey: t.materialKey,
			materialKind: f,
			mainTex: t.mainTex ?? null,
			shadowTex: t.shadowTex ?? null,
			valueTex: t.valueTex ?? null,
			faceShadowTex: t.faceShadowTex ?? null,
			material: h,
			overlayMaterial: h.userData.pjskOverlayMaterial instanceof e.Material ? h.userData.pjskOverlayMaterial : null,
			stencilPrepassMaterial: h.userData.pjskStencilPrepassMaterial instanceof e.Material ? h.userData.pjskStencilPrepassMaterial : null,
			topLayerMaterial: g
		};
	}));
	t.traverse((t) => {
		let n = t;
		if (!n.isMesh || n.userData.pjskEyeThroughHairOverlay || n.userData.pjskEyeThroughHairStencilPrepass) return;
		let r = Array.isArray(n.material) ? n.material : [n.material], i = Mc(n.name), o = f.filter((e) => e.meshKey === i);
		if (o.length === 0) return;
		let s = [], p = r.map((t, r) => {
			let i = typeof t.userData.pjskMaterialKey == "string" ? t.userData.pjskMaterialKey : "";
			if (!i) throw Error(`Head mesh '${n.name}' material '${t.name}' is missing pjskMaterialKey; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			let l = o.find((e) => e.materialKey === i);
			if (!l) throw Error(`Head mesh '${n.name}' material key '${i}' was not found in head material slots.`);
			let u = Ac(t);
			jc(l.material, u), l.overlayMaterial && jc(l.overlayMaterial, u), l.stencilPrepassMaterial && jc(l.stencilPrepassMaterial, u), l.topLayerMaterial && jc(l.topLayerMaterial, u);
			let d = !1;
			if (l.material instanceof e.ShaderMaterial && !l.material.uniforms.uMainTex.value && u) {
				l.material.uniforms.uMainTex.value = u, l.material.uniforms.uMainTexTransform && (l.material.uniforms.uMainTexTransform.value = u.matrix), l.material.uniforms.uUseMainTex.value = 1;
				for (let t of [
					l.overlayMaterial,
					l.stencilPrepassMaterial,
					l.topLayerMaterial
				]) t instanceof e.ShaderMaterial && (t.uniforms.uMainTex.value = u, t.uniforms.uMainTexTransform && (t.uniforms.uMainTexTransform.value = u.matrix), t.uniforms.uUseMainTex.value = 1);
				"uBaseColor" in l.material.uniforms && l.material.uniforms.uBaseColor.value.set("#ffffff"), d = !0;
			}
			l.material instanceof e.MeshBasicMaterial && !l.material.map && u && (l.material.map = u, l.material.needsUpdate = !0, d = !0), n.renderOrder = Bc(l.materialKind), n.userData.pjskMaterialKind = l.materialKind;
			let f = l.material instanceof e.ShaderMaterial ? l.material.uniforms : null, p = Qc(n), m = l.material.userData.pjskLighting, h = l.materialKind === "face_sdf" && !!l.faceShadowTex && m?.useFaceSdf !== !1;
			return l.material instanceof e.ShaderMaterial && f?.uFaceShadowTex && (l.material.userData.pjskFaceSdfCapable = h, l.material.userData.pjskFaceSdfUv1Available = p, f.uFaceSdfEnabled.value = a.faceSdfEnabled && h ? 1 : 0), s[r] = l, Jc(c, n, t, l, d, h, p), l.material;
		}), m = s.reduce((e, t) => t ? Math.min(e, Bc(t.materialKind)) : e, Infinity);
		Number.isFinite(m) && (n.renderOrder = m);
		let h = n.geometry.groups.length > 0 ? n.geometry.groups.map((e) => ({
			start: e.start,
			count: e.count,
			materialIndex: e.materialIndex ?? 0
		})) : [{
			start: 0,
			count: n.geometry.index?.count ?? n.geometry.getAttribute("position")?.count ?? 0,
			materialIndex: 0
		}], g = [], _ = [], v = [], y = [], b = [], ee = [];
		for (let e of h) {
			let t = s[e.materialIndex], i = t?.topLayerMaterial ?? null;
			if (i) {
				let t = b.length;
				b.push(i), ee.push({
					start: e.start,
					count: e.count,
					materialIndex: t
				}), Yc(c, n.name, r[e.materialIndex]?.name ?? "", i);
			}
			let a = t?.overlayMaterial ?? null;
			if (a) {
				let t = g.length;
				g.push(a), _.push({
					start: e.start,
					count: e.count,
					materialIndex: t
				});
			}
			let o = t?.stencilPrepassMaterial ?? null;
			if (o) {
				let t = v.length;
				v.push(o), y.push({
					start: e.start,
					count: e.count,
					materialIndex: t
				}), Yc(c, n.name, r[e.materialIndex]?.name ?? "", o, !1);
			}
			a && Yc(c, n.name, r[e.materialIndex]?.name ?? "", a);
		}
		Zc(r, p), Vc(n, p), n.material = Array.isArray(n.material) || p.length > 1 ? p : p[0], n.castShadow = !1, n.receiveShadow = !1;
		for (let e of y) {
			let t = v[e.materialIndex];
			if (!t) continue;
			let r = Uc(n, [{
				start: e.start,
				count: e.count,
				materialIndex: 0
			}], [t]);
			r && n.parent && (r.name = `${n.name}_eye_stencil_prepass`, r.userData.pjskEyeThroughHairPassKind = "stencil_prepass", r.userData.pjskEyeThroughHairStencilPrepass = !0, r.userData.pjskEyeThroughHairOverlay = !1, u.push({
				parent: n.parent,
				mesh: r
			}));
		}
		for (let e of _) {
			let t = g[e.materialIndex];
			if (!t) continue;
			let r = Uc(n, [{
				start: e.start,
				count: e.count,
				materialIndex: 0
			}], [t]);
			r && n.parent && l.push({
				parent: n.parent,
				mesh: r
			});
		}
		for (let e of ee) {
			let t = b[e.materialIndex];
			if (!t) continue;
			let r = Hc(n, [{
				start: e.start,
				count: e.count,
				materialIndex: 0
			}], [t], "eyelight_top_layer");
			r && n.parent && (r.userData.pjskTopLayerSource = n, r.userData.pjskMaterialKind = typeof t.userData.pjskMaterialKind == "string" ? t.userData.pjskMaterialKind : null, d.push({
				parent: n.parent,
				mesh: r
			}));
		}
	});
	for (let e of u) e.parent.add(e.mesh);
	for (let e of l) e.parent.add(e.mesh);
	for (let e of d) e.parent.add(e.mesh);
	return c;
}
//#endregion
//#region src/engine/sekaiOutlineRuntime.ts
var nl = {
	widthMin: 4e-4,
	widthMax: .0095,
	distanceNear: .45,
	distanceFar: 20
}, rl = {
	startTime: -.013763427734375,
	startValue: 27.81246566772461,
	startOutTangent: -.13214513659477234,
	endTime: 100.92341613769531,
	endValue: -.03620624542236328,
	endInTangent: -.5713597536087036
};
function il(e) {
	let t = Number.isFinite(e) ? e : 25, n = rl, r;
	if (t <= n.startTime) r = n.startValue;
	else if (t >= n.endTime) r = n.endValue;
	else {
		let e = n.endTime - n.startTime, i = (t - n.startTime) / e, a = i * i, o = a * i;
		r = (2 * o - 3 * a + 1) * n.startValue + (o - 2 * a + i) * e * n.startOutTangent + (-2 * o + 3 * a) * n.endValue + (o - a) * e * n.endInTangent;
	}
	return Math.abs(r) > 2 ** -52 ? t / r : 1;
}
var X = {
	color: {
		r: 0,
		g: 0,
		b: 0
	},
	blending: .5
}, al = {
	widthScale: .5,
	shadedColorBlend: .3
};
function ol() {
	return new e.Vector2(nl.widthMin * al.widthScale, nl.widthMax * al.widthScale);
}
function sl(e) {
	return !e?.disabledShaderPasses?.some((e) => e.toLowerCase() === "outline");
}
var cl = {
	r: .52,
	g: .47,
	b: .55,
	a: 1
};
function ll(t, n, r, i) {
	let a = e.MathUtils.clamp(i, 0, 1), o = {
		r: t.r * n.r,
		g: t.g * n.g,
		b: t.b * n.b
	};
	return {
		r: o.r + a * (r.r - o.r),
		g: o.g + a * (r.g - o.g),
		b: o.b + a * (r.b - o.b)
	};
}
function ul(t, n, r) {
	if (t.name !== "pjsk_shell_outline") return;
	let i = t.userData.pjskOutlineController;
	i && (n && typeof n == "object" && "r" in n && "g" in n && "b" in n ? i.color.setRGB(n.r, n.g, n.b) : P(i.color, n ?? new e.Color().setRGB(X.color.r, X.color.g, X.color.b)), i.blending = e.MathUtils.clamp(r ?? X.blending, 0, 1));
}
function dl(t, n, r, i) {
	let a = new e.Vector3(nl.distanceNear, 1 / (nl.distanceFar - nl.distanceNear), il(25)), o = {
		color: new e.Color().setRGB(X.color.r, X.color.g, X.color.b),
		blending: al.shadedColorBlend
	}, s = Y(r, "_OutlineOffset") ?? 0, c = t.clone();
	c.name = "pjsk_shell_outline", c.side = e.BackSide, c.transparent = !1, c.opacity = 1, c.depthFunc = e.LessDepth, c.depthWrite = !0, c.depthTest = !0, c.blending = e.NoBlending, c.polygonOffset = !1, c.userData = {
		...t.userData,
		pjskOutlineController: o
	};
	let l = {};
	for (let e of [
		"uFaceSdfEnabled",
		"uRimColorAlpha",
		"uControllerSpecularIntensity"
	]) e in t.uniforms && (l[e] = { value: 0 });
	return c.uniforms = {
		...t.uniforms,
		...l,
		uSekaiOutlineWidth: { value: ol() },
		uSekaiOutlineFactor: { value: a },
		uSekaiOutlineOffset: { value: s },
		uSekaiCharacterOutlineColor: { value: o.color },
		uSekaiCharacterOutlineBlending: { get value() {
			return o.blending;
		} }
	}, c.vertexShader = t.vertexShader.replace("#include <common>", [
		"#include <common>",
		"uniform vec2 uSekaiOutlineWidth;",
		"uniform vec3 uSekaiOutlineFactor;",
		"uniform float uSekaiOutlineOffset;",
		i ? "attribute vec4 tangent;" : "",
		i ? "attribute vec2 uv1;" : "",
		i ? "attribute vec2 uv2;" : ""
	].join("\n")), c.vertexShader = c.vertexShader.replace("#include <defaultnormal_vertex>", [
		"#include <defaultnormal_vertex>",
		"#ifdef FLIP_SIDED",
		"transformedNormal = -transformedNormal;",
		"#endif"
	].join("\n")), c.vertexShader = c.vertexShader.replace("#include <begin_vertex>", [
		"#include <begin_vertex>",
		"vec3 outlineWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;",
		"float outlineDistance = length(outlineWorldPosition - cameraPosition);",
		"float outlineDistanceFactor = clamp((outlineDistance - uSekaiOutlineFactor.x) * uSekaiOutlineFactor.y, 0.0, 1.0);",
		"outlineDistanceFactor = min(outlineDistanceFactor * uSekaiOutlineFactor.z, 1.0);",
		"float outlineWidth = mix(uSekaiOutlineWidth.x, uSekaiOutlineWidth.y, outlineDistanceFactor);",
		i ? ["vec3 outlineSecondBitangent = cross(normal, tangent.xyz) * tangent.w;", "vec3 outlineDirection = normalize(tangent.xyz * uv1.x + outlineSecondBitangent * uv1.y + normal * uv2.x);"].join("\n") : "vec3 outlineDirection = normalize(normal);",
		n ? "float outlineScale = clamp(color.r, 0.0, 1.0);" : "float outlineScale = 1.0;",
		n ? "float outlineOffsetScale = clamp(color.b, 0.0, 1.0);" : "float outlineOffsetScale = 0.0;",
		"transformed += outlineDirection * outlineWidth * outlineScale;"
	].join("\n")), c.vertexShader = c.vertexShader.replace(/gl_Position\s*=\s*projectionMatrix\s*\*[^;]*;/, (e) => [
		e,
		"vec4 projectedCameraOrigin = projectionMatrix * viewMatrix * vec4(cameraPosition, 1.0);",
		"gl_Position += projectedCameraOrigin * (-0.01 * uSekaiOutlineOffset) * outlineOffsetScale;"
	].join("\n")), c.fragmentShader = t.fragmentShader.replace(/vec3 outputColor\s*\(\s*vec3 color\s*\)\s*\{\s*return color;\s*\}/, [
		"uniform vec3 uSekaiCharacterOutlineColor;",
		"uniform float uSekaiCharacterOutlineBlending;",
		"",
		"vec3 outputColor(vec3 color) {",
		"  return mix(",
		"    uSekaiCharacterOutlineColor,",
		"    clamp(color, 0.0, 1.0),",
		"    clamp(uSekaiCharacterOutlineBlending, 0.0, 1.0)",
		"  );",
		"}"
	].join("\n")), c.customProgramCacheKey = () => `sekai-toon-outline:${+!!n}:${+!!i}`, c.onBeforeRender = (t, n, r) => {
		r instanceof e.PerspectiveCamera && (a.z = il(r.fov));
	}, c;
}
function fl(t, n, r = !1, i = null, a = null) {
	if (a instanceof e.ShaderMaterial && /vec3 outputColor\s*\(\s*vec3 color\s*\)/.test(a.fragmentShader)) return dl(a, t, n, r);
	let o = xc(n, "_OutlineColor") ?? cl, s = Sc(n, "_MainTex"), c = new e.Vector4(s?.scaleX ?? 1, s?.scaleY ?? 1, s?.offsetX ?? 0, s?.offsetY ?? 0), l = (Y(n, "_UseAlphaClip") ?? 0) > .5, u = e.MathUtils.clamp(Y(n, "_Cutoff") ?? .5, 0, 1), d = Y(n, "_OutlineOffset") ?? 0, f = new e.Color().setRGB(o.r, o.g, o.b), p = {
		color: new e.Color().setRGB(X.color.r, X.color.g, X.color.b),
		blending: al.shadedColorBlend
	}, m = new e.MeshBasicMaterial({
		color: f,
		map: i,
		side: e.BackSide,
		transparent: !1,
		opacity: 1,
		depthFunc: e.LessDepth,
		depthWrite: !0,
		depthTest: !0,
		blending: e.NoBlending,
		vertexColors: !1,
		alphaTest: l ? u : 0
	}), h = new e.Vector3(nl.distanceNear, 1 / (nl.distanceFar - nl.distanceNear), il(25));
	return m.name = "pjsk_shell_outline", m.userData.pjskOutlineController = p, m.onBeforeCompile = (e) => {
		e.uniforms.uSekaiOutlineWidth = { value: ol() }, e.uniforms.uSekaiOutlineFactor = { value: h }, e.uniforms.uSekaiOutlineOffset = { value: d }, e.uniforms.uSekaiMainTexST = { value: c }, e.uniforms.uSekaiCharacterOutlineColor = { value: p.color }, e.uniforms.uSekaiCharacterOutlineBlending = { get value() {
			return p.blending;
		} }, e.vertexShader = e.vertexShader.replace("#include <common>", [
			"#include <common>",
			"uniform vec2 uSekaiOutlineWidth;",
			"uniform vec3 uSekaiOutlineFactor;",
			"uniform float uSekaiOutlineOffset;",
			"uniform vec4 uSekaiMainTexST;",
			"#ifdef USE_MAP",
			"varying vec2 vSekaiMainTexUv;",
			"#endif",
			t ? "attribute vec3 color;" : "",
			r ? "attribute vec4 tangent;" : "",
			r ? "attribute vec2 uv1;" : "",
			r ? "attribute vec2 uv2;" : ""
		].join("\n")), e.vertexShader = e.vertexShader.replace("#include <begin_vertex>", [
			"#include <begin_vertex>",
			"vec3 outlineWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;",
			"float outlineDistance = length(outlineWorldPosition - cameraPosition);",
			"float outlineDistanceFactor = clamp((outlineDistance - uSekaiOutlineFactor.x) * uSekaiOutlineFactor.y, 0.0, 1.0);",
			"outlineDistanceFactor = min(outlineDistanceFactor * uSekaiOutlineFactor.z, 1.0);",
			"float outlineWidth = mix(uSekaiOutlineWidth.x, uSekaiOutlineWidth.y, outlineDistanceFactor);",
			r ? ["vec3 outlineSecondBitangent = cross(normal, tangent.xyz) * tangent.w;", "vec3 outlineDirection = normalize(tangent.xyz * uv1.x + outlineSecondBitangent * uv1.y + normal * uv2.x);"].join("\n") : "vec3 outlineDirection = normalize(normal);",
			t ? "float outlineScale = clamp(color.r, 0.0, 1.0);" : "float outlineScale = 1.0;",
			t ? "float outlineOffsetScale = clamp(color.b, 0.0, 1.0);" : "float outlineOffsetScale = 0.0;",
			"transformed += outlineDirection * outlineWidth * outlineScale;"
		].join("\n")), e.vertexShader = e.vertexShader.replace("#include <project_vertex>", [
			"#include <project_vertex>",
			"vec4 projectedCameraOrigin = projectionMatrix * viewMatrix * vec4(cameraPosition, 1.0);",
			"gl_Position += projectedCameraOrigin * (-0.01 * uSekaiOutlineOffset) * outlineOffsetScale;"
		].join("\n")), e.vertexShader = e.vertexShader.replace("#include <uv_vertex>", [
			"#include <uv_vertex>",
			"#ifdef USE_MAP",
			"vSekaiMainTexUv = uv * uSekaiMainTexST.xy + uSekaiMainTexST.zw;",
			"#endif"
		].join("\n")), e.fragmentShader = e.fragmentShader.replace("#include <common>", [
			"#include <common>",
			"uniform vec3 uSekaiCharacterOutlineColor;",
			"uniform float uSekaiCharacterOutlineBlending;",
			"#ifdef USE_MAP",
			"varying vec2 vSekaiMainTexUv;",
			"#endif"
		].join("\n")), e.fragmentShader = e.fragmentShader.replace("#include <map_fragment>", [
			"#ifdef USE_MAP",
			"  vec4 sampledDiffuseColor = texture2D(map, vSekaiMainTexUv);",
			"  #ifdef DECODE_VIDEO_TEXTURE",
			"    sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);",
			"  #endif",
			"  sampledDiffuseColor = sRGBTransferOETF(sampledDiffuseColor);",
			"  diffuseColor *= sampledDiffuseColor;",
			"#endif"
		].join("\n")), e.fragmentShader = e.fragmentShader.replace("#include <color_fragment>", [
			"#include <color_fragment>",
			"diffuseColor.rgb = mix(",
			"  diffuseColor.rgb,",
			"  uSekaiCharacterOutlineColor,",
			"  clamp(uSekaiCharacterOutlineBlending, 0.0, 1.0)",
			");"
		].join("\n")), e.fragmentShader = e.fragmentShader.replace("#include <colorspace_fragment>", "");
	}, m.customProgramCacheKey = () => `sekai-outline:${+!!t}:${+!!r}`, m.onBeforeRender = (t, n, r) => {
		r instanceof e.PerspectiveCamera && (h.z = il(r.fov));
	}, m;
}
//#endregion
//#region src/engine/characterLightingRuntime.ts
function pl(e) {
	return e === "head_proximity" ? "sekai_head_position" : e;
}
var ml = {
	skin: 1,
	main_color: 2,
	skin_color: 3,
	h_r: 4,
	h_g: 5,
	h_b: 6,
	h_a: 7,
	vertex_r: 8,
	vertex_g: 9,
	base_shadow: 10,
	ndotl_raw: 11,
	h_b_adjusted_shadow: 12,
	ambient_target: 13,
	ambient_weight: 14,
	ambient_tint: 15,
	specular: 16,
	rim_raw: 17,
	rim_add: 18,
	rim_gate: 19,
	rim_color: 20,
	rim_scalar: 21,
	specular_mask: 22,
	specular_add: 23,
	toon_luma: 24,
	shadow_mask: 25,
	shadow_target: 26
}, hl = {
	sdf: 1,
	mask: 2,
	limit: 3,
	basis: 4,
	range: 5
};
function gl(e) {
	return ml[e] ?? 0;
}
function _l(e) {
	return hl[e] ?? 0;
}
function vl(e) {
	return e === "eyelash" || e === "eyebrow" || e === "eye" || e === "eyelight";
}
function yl(e) {
	return e === "face" || e === "face_sdf" || vl(e);
}
function bl(e, t) {
	switch (t) {
		case "eye_through_hair_eye_only": return e === "eye";
		case "eye_through_hair_eyebrow_only": return e === "eyebrow";
		case "eye_through_hair_eyelash_only": return e === "eyelash";
		case "no_eye_through_hair_eye": return e !== "eye";
		case "no_eye_through_hair_eyebrow": return e !== "eyebrow";
		case "no_eye_through_hair_eyelash": return e !== "eyelash";
		default: return !0;
	}
}
function xl(e, t, n) {
	return n === "no_eye_through_hair_eyelash_overlay" ? e !== "eyelash" || t !== "overlay" : n !== "no_eye_through_hair_eyelash_prepass" || e !== "eyelash" || t !== "stencil_prepass";
}
function Sl(e, t) {
	switch (t) {
		case "no_body_outline": return e === "body";
		case "no_hair_outline": return e === "hair";
		case "no_face_layers":
		case "no_face_outline": return yl(e);
		default: return !1;
	}
}
var Cl = class {
	options;
	cameraDirection = new e.Vector3();
	hairShadowMode = "sekai_head_position";
	bodyDebugMode = "off";
	toonShadowWidthOverride = null;
	toonValueShadowInfluence;
	faceSdfEnabled = !0;
	faceSdfDebugMode = "off";
	faceSdfDebugLightMode = "scene";
	renderIsolationMode = "normal";
	controllerOutlineColor = new e.Color().setRGB(X.color.r, X.color.g, X.color.b);
	controllerOutlineBlending = al.shadedColorBlend;
	skinColors = null;
	constructor(e) {
		this.options = e, this.toonValueShadowInfluence = e.valueShadowInfluence ?? 1, e.debug.hairShadowMode = this.hairShadowMode;
	}
	get slots() {
		return [this.options.bodySlot, this.options.headSlot];
	}
	get debugEntries() {
		return [this.options.debug.body, this.options.debug.head];
	}
	forEachShaderMaterial(t) {
		for (let n of this.slots) n.traverse((n) => {
			let r = n;
			if (!r.isMesh) return;
			let i = Array.isArray(r.material) ? r.material : [r.material];
			for (let n of i) n instanceof e.ShaderMaterial && t(n);
		});
	}
	getBindingView() {
		return {
			bodyDebugMode: gl(this.bodyDebugMode),
			faceDebugMode: _l(this.faceSdfDebugMode),
			faceSdfEnabled: this.shouldEnableFaceSdf(),
			shadowWidthOverride: this.toonShadowWidthOverride,
			valueShadowInfluence: this.toonValueShadowInfluence,
			proximityHairShadowEnabled: this.isHairShadowEnabled()
		};
	}
	getHairShadowMode() {
		return this.hairShadowMode;
	}
	isHairShadowEnabled() {
		return this.hairShadowMode === "sekai_head_position";
	}
	setHairShadowMode(e) {
		this.hairShadowMode = pl(e), this.options.debug.hairShadowMode = this.hairShadowMode, this.applyHairShadowMode();
	}
	setFaceSdfDebugMode(e) {
		this.faceSdfDebugMode = e, this.applyFaceSdfDebug();
	}
	setFaceSdfEnabled(e) {
		this.faceSdfEnabled = e, this.applyFaceSdfEnabled();
	}
	setBodyDebugMode(e) {
		this.bodyDebugMode = e, this.applyBodyDebug();
	}
	setToonShadowPreview(t, n) {
		this.toonShadowWidthOverride = t === null ? null : Math.max(0, t), this.toonValueShadowInfluence = e.MathUtils.clamp(n, 0, 1), this.applyToonShadowPreview();
	}
	setFaceSdfDebugLightMode(e) {
		this.faceSdfDebugLightMode = e, this.applyFaceSdfDebug();
	}
	setRenderIsolationMode(e) {
		this.renderIsolationMode = e, this.applyRenderIsolationMode();
	}
	resolveFaceShadowLightDirection(e, t, n) {
		switch (this.faceSdfDebugLightMode) {
			case "front": return n.clone();
			case "left": return t.clone().negate();
			case "right": return t.clone();
			case "back": return n.clone().negate();
			default: return e.clone();
		}
	}
	applyCharacterView() {
		this.applyRenderIsolationMode(), this.applyFaceSdfDebug(), this.applyBodyDebug(), this.applyToonShadowPreview(), this.applyHairShadowMode(), this.applyCharacterSkinColors();
	}
	setCharacterSkinColors(e) {
		this.skinColors = e ? { ...e } : null, this.options.debug.skinColors = this.skinColors ? { ...this.skinColors } : null, this.applyCharacterSkinColors();
	}
	applyCharacterSkinColors() {
		let e = this.skinColors;
		if (!e) return;
		let t = (t) => {
			t.uniforms.uSkinColorDefault && P(t.uniforms.uSkinColorDefault.value, e.default), t.uniforms.uSkinColor1 && P(t.uniforms.uSkinColor1.value, e.shadow1), t.uniforms.uSkinColor2 && P(t.uniforms.uSkinColor2.value, e.shadow2);
		};
		[
			this.options.bodyMaterial,
			this.options.hairMaterial,
			this.options.faceMaterial
		].forEach(t), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) n.shaderSkinColorDefault !== void 0 && n.shaderSkinColorDefault !== null && (n.shaderSkinColorDefault = e.default.toLowerCase()), n.shaderSkinColor1 !== void 0 && n.shaderSkinColor1 !== null && (n.shaderSkinColor1 = e.shadow1.toLowerCase()), n.shaderSkinColor2 !== void 0 && n.shaderSkinColor2 !== null && (n.shaderSkinColor2 = e.shadow2.toLowerCase());
	}
	shouldEnableFaceSdf() {
		return this.renderIsolationMode === "no_face_sdf" ? !1 : this.faceSdfEnabled || this.renderIsolationMode === "face_sdf";
	}
	applyFaceSdfEnabled() {
		let e = this.shouldEnableFaceSdf(), t = (t) => {
			t.uniforms.uFaceSdfEnabled && (t.uniforms.uFaceSdfEnabled.value = e && t.userData.pjskFaceSdfCapable === !0 ? 1 : 0);
		};
		t(this.options.faceMaterial), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) (n.shaderFaceSdfEnabled !== void 0 || n.resolvedKind === "face_sdf") && (n.shaderFaceSdfEnabled = e && n.faceSdfCapable === !0 ? 1 : 0);
	}
	applyFaceSdfDebug() {
		let e = _l(this.faceSdfDebugMode);
		this.options.faceMaterial.uniforms.uFaceDebugMode.value = e, this.forEachShaderMaterial((t) => {
			t.uniforms.uFaceDebugMode && (t.uniforms.uFaceDebugMode.value = e);
		});
		for (let t of this.debugEntries) for (let n of t) (n.resolvedKind === "face_sdf" || n.shaderFaceDebugMode !== void 0) && (n.shaderFaceDebugMode = e);
	}
	applyBodyDebug() {
		let e = gl(this.bodyDebugMode), t = (t) => {
			t.uniforms.uBodyDebugMode && (t.uniforms.uBodyDebugMode.value = e);
		};
		t(this.options.bodyMaterial), t(this.options.hairMaterial), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) (n.shaderBodyDebugMode !== void 0 || n.resolvedKind === "body") && (n.shaderBodyDebugMode = e);
	}
	applyToonShadowPreview() {
		let t = this.toonShadowWidthOverride ?? -1, n = (n) => {
			n instanceof e.ShaderMaterial && (n.uniforms.uShadowWidthOverride && (n.uniforms.uShadowWidthOverride.value = t), n.uniforms.uValueShadowInfluence && (n.uniforms.uValueShadowInfluence.value = this.toonValueShadowInfluence));
		};
		n(this.options.bodyMaterial), n(this.options.hairMaterial), this.forEachShaderMaterial(n);
		for (let e of this.debugEntries) for (let n of e) n.shaderShadowWidthOverride !== void 0 && n.shaderShadowWidthOverride !== null && n.shaderValueShadowInfluence !== void 0 && n.shaderValueShadowInfluence !== null && (n.shaderShadowWidthOverride = t, n.shaderValueShadowInfluence = this.toonValueShadowInfluence);
	}
	applyHairShadowMode() {
		let e = +!!this.isHairShadowEnabled();
		this.options.hairMaterial.uniforms.uHairShadowEnabled && (this.options.hairMaterial.uniforms.uHairShadowEnabled.value = e), this.forEachShaderMaterial((t) => {
			t.userData.pjskMaterialKind === "hair" && t.uniforms.uHairShadowEnabled && (t.uniforms.uHairShadowEnabled.value = e);
		});
		for (let t of this.options.debug.head) t.resolvedKind === "hair" && t.shaderHairShadowEnabled !== void 0 && (t.shaderHairShadowEnabled = e);
	}
	applyRenderIsolationMode() {
		let t = this.shouldEnableFaceSdf(), n = this.renderIsolationMode, r = n === "eyelight_only", i = n === "no_eyelight", a = n !== "no_face_layers", o = n === "outline_only", s = n !== "no_outline", c = n === "no_eye_through_hair", l = n === "eye_through_hair_only" || n === "eye_through_hair_eye_only" || n === "eye_through_hair_eyebrow_only" || n === "eye_through_hair_eyelash_only", u = (u) => {
			let d = u;
			if (!d.isMesh) return;
			if (d.userData.pjskEyeThroughHairOverlay || d.userData.pjskEyeThroughHairStencilPrepass) {
				let t = d.userData.pjskEyeThroughHairSource, s = typeof d.userData.pjskEyeThroughHairSourceKind == "string" ? d.userData.pjskEyeThroughHairSourceKind : "", l = typeof d.userData.pjskEyeThroughHairPassKind == "string" ? d.userData.pjskEyeThroughHairPassKind : "", u = t instanceof e.Object3D ? t.visible : !0;
				t instanceof e.Object3D && (d.layers.mask = t.layers.mask), d.visible = u && !o && !r && !c && bl(s, n) && xl(s, l, n) && a && (!i || s !== "eyelight"), d.userData.pjskEyeThroughHairBaseVisible = d.visible;
				return;
			}
			if (d.userData.pjskOutlineShell) {
				let e = typeof d.userData.pjskSourceMaterialKind == "string" ? d.userData.pjskSourceMaterialKind : "", t = yl(e);
				if (r) {
					d.visible = e === "eye" || e === "eyelight";
					return;
				}
				d.visible = !l && s && !Sl(e, n) && (!i || e !== "eyelight") && (!t || a);
				return;
			}
			let f = Array.isArray(d.material) ? d.material : [d.material], p = !1, m = !1;
			for (let n of f) {
				if (!(n instanceof e.ShaderMaterial)) continue;
				let r = n.visible !== !1 && n.colorWrite !== !1;
				n.uniforms.uFaceSdfEnabled && (n.uniforms.uFaceSdfEnabled.value = t && n.userData.pjskFaceSdfCapable === !0 ? 1 : 0, p = !0), n.uniforms.uMode && !n.uniforms.uFaceSdfEnabled && (p = !0, m ||= r && n.uniforms.uMode.value > 1.5);
			}
			o || l ? d.visible = !1 : r ? d.visible = p && f.some((e) => e.userData.pjskMaterialKind === "eye" || e.userData.pjskMaterialKind === "eyelight") : p ? d.visible = a && (!i || !m) : d.visible = !r;
			let h = d.userData.pjskEyeThroughHairSource;
			h instanceof e.Object3D && (d.visible = d.visible && h.visible, d.layers.mask = h.layers.mask);
		};
		for (let e of this.slots) e.traverse(u);
		for (let e of this.debugEntries) for (let n of e) (n.shaderFaceSdfEnabled !== void 0 || n.resolvedKind === "face_sdf") && (n.shaderFaceSdfEnabled = t && n.faceSdfCapable === !0 ? 1 : 0);
	}
	updateEyeThroughHairView(e, t, n) {
		let r = this.cameraDirection.copy(e).sub(t), i = r.lengthSq() > 1e-6 ? r.normalize().dot(n) : 1;
		for (let e of this.slots) e.traverse((e) => {
			let t = e;
			if (!t.isMesh || !t.userData.pjskEyeThroughHairOverlay && !t.userData.pjskEyeThroughHairStencilPrepass) return;
			let n = t.userData.pjskEyeThroughHairBaseVisible, r = typeof n == "boolean" ? n : t.visible;
			if (t.userData.pjskEyeThroughHairStencilPrepass) {
				t.visible = r;
				return;
			}
			let a = Array.isArray(t.material) ? t.material : [t.material], o = !1;
			for (let e of a) {
				let t = Lc(e, i);
				o ||= t === null || t > .001;
			}
			t.visible = r && o;
		});
	}
	updateCamera(e) {
		pr(this.options.bodyMaterial, e), pr(this.options.hairMaterial, e), this.forEachShaderMaterial((t) => {
			t.uniforms.uCameraPosition && pr(t, e);
		});
	}
	updateFaceBasis(e, t, n) {
		gr(this.options.faceMaterial, e, t, !0, 0), this.forEachShaderMaterial((r) => {
			r.uniforms.uHeadDotDirectionalLight && gr(r, e, t, !0, 0), r.uniforms.uHeadPosition && r.uniforms.uHeadPosition.value.copy(n);
		});
	}
	updatePreviewLight(e, t, n, r, i) {
		let a = this.getBindingView(), { bodyMaterial: o, hairMaterial: s, faceMaterial: c, directionalLight: l, fillLight: u } = this.options;
		l.position.set(e.x, e.y, e.z), l.intensity = e.intensity, u.intensity = e.ambient, fr(o, {
			baseColor: t?.proxy.bodyColor ?? "#f5d6d0",
			shadowColor: t?.proxy.shadowColor ?? "#c79b95",
			skinColorDefault: n?.proxy.skinColorDefault ?? n?.proxy.faceColor ?? t?.proxy.bodyColor ?? "#f5d6d0",
			skinColor1: n?.proxy.skinColor1 ?? n?.proxy.faceShadeColor ?? t?.proxy.shadowColor ?? "#c79b95",
			skinColor2: n?.proxy.skinColor2 ?? n?.proxy.faceShadeColor ?? t?.proxy.shadowColor ?? "#c79b95",
			lightDirection: l.position.clone(),
			lightIntensity: e.intensity,
			ambientIntensity: e.ambient,
			shadowThreshold: e.shadowThreshold,
			shadowWeight: e.shadowWeight,
			characterAmbientIntensity: e.characterAmbient,
			rimColorAlpha: e.rimColorAlpha,
			controllerRimRange: e.rimRange,
			controllerRimEdgeSmoothness: e.rimEdgeSmoothness,
			controllerRimEmission: e.rimEmission,
			controllerRimLightInfluence: e.rimLightInfluence,
			rimDirection: Ec(),
			specularPower: o.uniforms.uSpecularPower.value,
			rimThreshold: o.uniforms.uRimThreshold.value,
			shadowTexWeight: o.uniforms.uShadowTexWeight.value,
			shadowWidthOverride: a.shadowWidthOverride,
			valueShadowInfluence: a.valueShadowInfluence,
			saturation: o.uniforms.uSaturation.value,
			partsAmbientColor: o.uniforms.uPartsAmbientColor.value.clone(),
			reflectionBlendColor: o.uniforms.uReflectionBlendColor.value.clone(),
			globalShadowColor: o.uniforms.uGlobalShadowColor.value.clone(),
			globalShadowAlpha: o.uniforms.uGlobalShadowAlpha.value,
			controllerAmbientColor: o.uniforms.uControllerAmbientColor.value.clone(),
			controllerAmbientIntensity: o.uniforms.uControllerAmbientIntensity.value,
			controllerSpecularColor: o.uniforms.uControllerSpecularColor.value.clone(),
			controllerSpecularIntensity: o.uniforms.uControllerSpecularIntensity.value,
			controllerRimColor: o.uniforms.uControllerRimColor.value.clone(),
			controllerShadowRimColor: o.uniforms.uControllerShadowRimColor.value.clone(),
			controllerRimColorWeight: o.uniforms.uControllerRimColorWeight.value,
			controllerShadowRimColorWeight: o.uniforms.uControllerShadowRimColorWeight.value,
			controllerRimShadowSharpness: e.rimShadowSharpness,
			bodyDebugMode: a.bodyDebugMode
		}), fr(s, {
			baseColor: n?.proxy.hairColor ?? "#7b5b4a",
			shadowColor: n?.proxy.hairShadowColor ?? "#513d33",
			lightDirection: l.position.clone(),
			lightIntensity: e.intensity,
			ambientIntensity: e.ambient,
			shadowThreshold: e.shadowThreshold,
			shadowWeight: e.shadowWeight,
			characterAmbientIntensity: e.characterAmbient,
			rimColorAlpha: e.rimColorAlpha,
			controllerRimRange: e.rimRange,
			controllerRimEdgeSmoothness: e.rimEdgeSmoothness,
			controllerRimEmission: e.rimEmission,
			controllerRimLightInfluence: e.rimLightInfluence,
			rimDirection: Ec(),
			specularPower: s.uniforms.uSpecularPower.value,
			rimThreshold: s.uniforms.uRimThreshold.value,
			shadowTexWeight: s.uniforms.uShadowTexWeight.value,
			shadowWidthOverride: a.shadowWidthOverride,
			valueShadowInfluence: a.valueShadowInfluence,
			saturation: s.uniforms.uSaturation.value,
			partsAmbientColor: s.uniforms.uPartsAmbientColor.value.clone(),
			reflectionBlendColor: s.uniforms.uReflectionBlendColor.value.clone(),
			globalShadowColor: s.uniforms.uGlobalShadowColor.value.clone(),
			globalShadowAlpha: s.uniforms.uGlobalShadowAlpha.value,
			controllerAmbientColor: s.uniforms.uControllerAmbientColor.value.clone(),
			controllerAmbientIntensity: s.uniforms.uControllerAmbientIntensity.value,
			controllerSpecularColor: s.uniforms.uControllerSpecularColor.value.clone(),
			controllerSpecularIntensity: s.uniforms.uControllerSpecularIntensity.value,
			controllerRimColor: s.uniforms.uControllerRimColor.value.clone(),
			controllerShadowRimColor: s.uniforms.uControllerShadowRimColor.value.clone(),
			controllerRimColorWeight: s.uniforms.uControllerRimColorWeight.value,
			controllerShadowRimColorWeight: s.uniforms.uControllerShadowRimColorWeight.value,
			controllerRimShadowSharpness: e.rimShadowSharpness,
			hairShadowEnabled: !1
		}), hr(c, {
			baseColor: n?.proxy.faceColor ?? "#ffe4dc",
			warmColor: n?.proxy.faceShadeColor ?? "#ffd4c8",
			skinColorDefault: n?.proxy.skinColorDefault ?? n?.proxy.faceColor ?? "#ffe4dc",
			skinColor1: n?.proxy.skinColor1 ?? n?.proxy.faceShadeColor ?? "#ffd4c8",
			skinColor2: n?.proxy.skinColor2 ?? n?.proxy.faceShadeColor ?? "#ffd4c8",
			lightDirection: i.clone(),
			lightIntensity: e.intensity,
			ambientIntensity: e.ambient,
			headDotDirectionalLight: r,
			shadowWeight: e.shadowWeight,
			useLambert: !0,
			useFaceShadowLimiter: !0,
			faceShadowLimitRange: 0,
			partsAmbientColor: c.uniforms.uPartsAmbientColor.value.clone(),
			partsAmbientAlpha: c.uniforms.uPartsAmbientAlpha.value,
			controllerAmbientColor: c.uniforms.uControllerAmbientColor.value.clone(),
			controllerAmbientIntensity: c.uniforms.uControllerAmbientIntensity.value,
			controllerSpecularColor: c.uniforms.uControllerSpecularColor.value.clone(),
			controllerSpecularIntensity: c.uniforms.uControllerSpecularIntensity.value,
			controllerRimColor: c.uniforms.uControllerRimColor.value.clone(),
			controllerShadowRimColor: c.uniforms.uControllerShadowRimColor.value.clone(),
			controllerRimColorWeight: c.uniforms.uControllerRimColorWeight.value,
			controllerShadowRimColorWeight: c.uniforms.uControllerShadowRimColorWeight.value,
			controllerRimRange: e.rimRange,
			controllerRimEdgeSmoothness: e.rimEdgeSmoothness,
			controllerRimEmission: e.rimEmission,
			controllerRimLightInfluence: e.rimLightInfluence,
			controllerRimShadowSharpness: e.rimShadowSharpness,
			rimColorAlpha: e.rimColorAlpha,
			rimDirection: Ec(),
			specularPower: c.uniforms.uSpecularPower.value,
			rimThreshold: c.uniforms.uRimThreshold.value,
			globalShadowColor: c.uniforms.uGlobalShadowColor.value.clone(),
			globalShadowAlpha: c.uniforms.uGlobalShadowAlpha.value
		}), this.updateLoadedMaterialLight(e, i), this.applyCharacterSkinColors();
	}
	updateLoadedMaterialLight(e, t) {
		let n = this.options.directionalLight.position.clone().normalize(), r = Ec();
		this.forEachShaderMaterial((i) => {
			let a = i.uniforms, o = i.userData.pjskLighting, s = !!(a.uFaceShadowTex || a.uHeadDotDirectionalLight);
			a.uLightDirection?.value.copy(s ? t : n), a.uLightIntensity && (a.uLightIntensity.value = e.intensity), a.uAmbientIntensity && (a.uAmbientIntensity.value = e.ambient), a.uShadowThreshold && (a.uShadowThreshold.value = o?.sekaiShadowThreshold ?? e.shadowThreshold), a.uShadowWeight && (a.uShadowWeight.value = e.shadowWeight), a.uCharacterAmbientIntensity && (a.uCharacterAmbientIntensity.value = e.characterAmbient), a.uRimColorAlpha && (a.uRimColorAlpha.value = e.rimColorAlpha), a.uControllerRimRange && (a.uControllerRimRange.value = e.rimRange), a.uControllerRimEdgeSmoothness && (a.uControllerRimEdgeSmoothness.value = e.rimEdgeSmoothness), a.uControllerRimEmission && (a.uControllerRimEmission.value = e.rimEmission), a.uControllerRimLightInfluence && (a.uControllerRimLightInfluence.value = e.rimLightInfluence), a.uControllerRimShadowSharpness && (a.uControllerRimShadowSharpness.value = e.rimShadowSharpness), a.uRimDirection?.value.copy(r);
		});
	}
	updateGlobalShadowColor(t, n = 1) {
		let r = P(new e.Color(), t), i = e.MathUtils.clamp(n, 0, 1), a = (e) => {
			e.uniforms.uGlobalShadowColor?.value.copy(r), e.uniforms.uGlobalShadowAlpha && (e.uniforms.uGlobalShadowAlpha.value = i);
		};
		for (let e of [this.options.bodyMaterial, this.options.hairMaterial]) a(e);
		this.forEachShaderMaterial(a);
	}
	updateControllerColors(t) {
		let n = t.ambientColor == null ? new e.Color().setRGB(C.ambientColor.r, C.ambientColor.g, C.ambientColor.b) : P(new e.Color(), t.ambientColor), r = P(new e.Color(), t.specularColor ?? "#ffffff"), i = t.rimColor == null ? new e.Color().setRGB(C.rimColor.r, C.rimColor.g, C.rimColor.b) : P(new e.Color(), t.rimColor), a = t.shadowRimColor == null ? new e.Color().setRGB(C.shadowRimColor.r, C.shadowRimColor.g, C.shadowRimColor.b) : P(new e.Color(), t.shadowRimColor), o = (e) => {
			e.uniforms.uControllerAmbientColor?.value.copy(n), e.uniforms.uControllerAmbientIntensity && (e.uniforms.uControllerAmbientIntensity.value = Math.max(t.ambientIntensity ?? 1, 0)), e.uniforms.uControllerSpecularColor?.value.copy(r), e.uniforms.uControllerSpecularIntensity && (e.uniforms.uControllerSpecularIntensity.value = Math.max(t.specularIntensity ?? 1, 0)), e.uniforms.uControllerRimColor?.value.copy(i), e.uniforms.uControllerShadowRimColor?.value.copy(a), e.uniforms.uControllerRimColorWeight && (e.uniforms.uControllerRimColorWeight.value = 1), e.uniforms.uControllerShadowRimColorWeight && (e.uniforms.uControllerShadowRimColorWeight.value = 1);
		};
		for (let e of [this.options.bodyMaterial, this.options.hairMaterial]) o(e);
		this.forEachShaderMaterial(o);
	}
	updateControllerRimShape(t) {
		let n = Math.max(t.edgeSmoothness ?? C.rimEdgeSmoothness, 0), r = Math.max(t.emission ?? C.rimEmission, 0), i = e.MathUtils.clamp(t.shadowSharpness ?? C.rimShadowSharpness, 0, 1), a = (e) => {
			e.uniforms.uControllerRimEdgeSmoothness && (e.uniforms.uControllerRimEdgeSmoothness.value = n), e.uniforms.uControllerRimEmission && (e.uniforms.uControllerRimEmission.value = r), e.uniforms.uControllerRimShadowSharpness && (e.uniforms.uControllerRimShadowSharpness.value = i);
		};
		for (let e of [this.options.bodyMaterial, this.options.hairMaterial]) a(e);
		this.forEachShaderMaterial(a);
	}
	updateControllerOutline(t) {
		this.controllerOutlineColor = t.color ? P(new e.Color(), t.color) : new e.Color().setRGB(X.color.r, X.color.g, X.color.b), this.controllerOutlineBlending = e.MathUtils.clamp(t.blending ?? al.shadedColorBlend, 0, 1);
		for (let e of this.slots) e.traverse((e) => {
			let t = e;
			if (!t.isMesh || !t.userData.pjskOutlineShell) return;
			let n = Array.isArray(t.material) ? t.material : [t.material];
			for (let e of n) e.userData.pjskOutlineController && this.applyOutlineMaterial(e);
		});
	}
	applyOutlineMaterial(e) {
		ul(e, this.controllerOutlineColor, this.controllerOutlineBlending);
	}
}, wl = class {
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
}, Tl = 1000066e3, El = class {
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
}, Dl = class {
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
var Z = [
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
function Ol(e) {
	return new TextDecoder().decode(e);
}
function kl(e) {
	let t = new Uint8Array(e.buffer, e.byteOffset, Z.length);
	if (t[0] !== Z[0] || t[1] !== Z[1] || t[2] !== Z[2] || t[3] !== Z[3] || t[4] !== Z[4] || t[5] !== Z[5] || t[6] !== Z[6] || t[7] !== Z[7] || t[8] !== Z[8] || t[9] !== Z[9] || t[10] !== Z[10] || t[11] !== Z[11]) throw Error("Missing KTX 2.0 identifier.");
	let n = new El(), r = 17 * Uint32Array.BYTES_PER_ELEMENT, i = new Dl(e, Z.length, r, !0);
	n.vkFormat = i._nextUint32(), n.typeSize = i._nextUint32(), n.pixelWidth = i._nextUint32(), n.pixelHeight = i._nextUint32(), n.pixelDepth = i._nextUint32(), n.layerCount = i._nextUint32(), n.faceCount = i._nextUint32();
	let a = i._nextUint32();
	n.supercompressionScheme = i._nextUint32();
	let o = i._nextUint32(), s = i._nextUint32(), c = i._nextUint32(), l = i._nextUint32(), u = i._nextUint64(), d = i._nextUint64(), f = new Dl(e, Z.length + r, 3 * a * 8, !0);
	for (let t = 0; t < a; t++) n.levels.push({
		levelData: new Uint8Array(e.buffer, e.byteOffset + f._nextUint64(), f._nextUint64()),
		uncompressedByteLength: f._nextUint64()
	});
	let p = new Dl(e, o, s, !0), m = {
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
	let g = new Dl(e, c, l, !0);
	for (; g._offset < l;) {
		let e = g._nextUint32(), t = g._scan(e), r = Ol(t);
		if (n.keyValue[r] = g._nextUint8Array(e - t.byteLength - 1), r.match(/^ktx/i)) {
			let e = Ol(n.keyValue[r]);
			n.keyValue[r] = e.substring(0, e.lastIndexOf("\0"));
		}
		g._skip(e % 4 ? 4 - e % 4 : 0);
	}
	if (d <= 0) return n;
	let _ = new Dl(e, u, d, !0), v = _._nextUint16(), y = _._nextUint16(), b = _._nextUint32(), ee = _._nextUint32(), te = _._nextUint32(), ne = _._nextUint32(), re = [];
	for (let e = 0; e < a; e++) re.push({
		imageFlags: _._nextUint32(),
		rgbSliceByteOffset: _._nextUint32(),
		rgbSliceByteLength: _._nextUint32(),
		alphaSliceByteOffset: _._nextUint32(),
		alphaSliceByteLength: _._nextUint32()
	});
	let ie = u + _._offset, ae = ie + b, oe = ae + ee, se = oe + te;
	return n.globalData = {
		endpointCount: v,
		selectorCount: y,
		imageDescs: re,
		endpointsData: new Uint8Array(e.buffer, e.byteOffset + ie, b),
		selectorsData: new Uint8Array(e.buffer, e.byteOffset + ae, ee),
		tablesData: new Uint8Array(e.buffer, e.byteOffset + oe, te),
		extendedData: new Uint8Array(e.buffer, e.byteOffset + se, ne)
	}, n;
}
//#endregion
//#region node_modules/three/examples/jsm/libs/zstddec.module.js
var Al, jl, Ml, Nl = { env: { emscripten_notify_memory_growth: function(e) {
	Ml = new Uint8Array(jl.exports.memory.buffer);
} } }, Pl = class {
	init() {
		return Al || (Al = typeof fetch < "u" ? fetch("data:application/wasm;base64," + Fl).then((e) => e.arrayBuffer()).then((e) => WebAssembly.instantiate(e, Nl)).then(this._init) : WebAssembly.instantiate(Buffer.from(Fl, "base64"), Nl).then(this._init), Al);
	}
	_init(e) {
		jl = e.instance, Nl.env.emscripten_notify_memory_growth(0);
	}
	decode(e, t = 0) {
		if (!jl) throw Error("ZSTDDecoder: Await .init() before decoding.");
		let n = e.byteLength, r = jl.exports.malloc(n);
		Ml.set(e, r), t ||= Number(jl.exports.ZSTD_findDecompressedSize(r, n));
		let i = jl.exports.malloc(t), a = jl.exports.ZSTD_decompress(i, t, r, n), o = Ml.slice(i, i + a);
		return jl.exports.free(r), jl.exports.free(i), o;
	}
}, Fl = "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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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", Il = "display-p3", Ll = "display-p3-linear", Rl = /* @__PURE__ */ new WeakMap(), zl = 0, Bl, Vl = class e extends f {
	constructor(e) {
		super(e), this.transcoderPath = "", this.transcoderBinary = null, this.transcoderPending = null, this.workerPool = new wl(), this.workerSourceURL = "", this.workerConfig = null, typeof MSC_TRANSCODER < "u" && console.warn("THREE.KTX2Loader: Please update to latest \"basis_transcoder\". \"msc_basis_transcoder\" is no longer supported in three.js r125+.");
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
			let t = new o(this.manager);
			t.setPath(this.transcoderPath), t.setWithCredentials(this.withCredentials);
			let n = t.loadAsync("basis_transcoder.js"), r = new o(this.manager);
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
			}), zl > 0 && console.warn("THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues. Use a single KTX2Loader instance, or call .dispose() on old instances."), zl++;
		}
		return this.transcoderPending;
	}
	load(e, t, n, r) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		let i = new o(this.manager);
		i.setPath(this.path), i.setCrossOrigin(this.crossOrigin), i.setWithCredentials(this.withCredentials), i.setResponseType("arraybuffer"), i.load(e, (e) => {
			this.parse(e, t, r);
		}, n, r);
	}
	parse(e, t, n) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		if (Rl.has(e)) return Rl.get(e).promise.then(t).catch(n);
		this._createTexture(e).then((e) => t ? t(e) : null).catch(n);
	}
	_createTextureFrom(e, i) {
		let { type: a, error: o, data: { faces: s, width: c, height: d, format: f, type: p, dfdFlags: m } } = e;
		if (a === "error") return Promise.reject(o);
		let h;
		if (i.faceCount === 6) h = new n(s, f, p);
		else {
			let e = s[0].mipmaps;
			h = i.layerCount > 1 ? new t(e, c, d, i.layerCount, f, p) : new r(e, c, d, f, p);
		}
		return h.minFilter = s[0].mipmaps.length === 1 ? l : u, h.magFilter = l, h.generateMipmaps = !1, h.needsUpdate = !0, h.colorSpace = Kl(i), h.premultiplyAlpha = !!(m & 1), h;
	}
	async _createTexture(e, t = {}) {
		let n = kl(new Uint8Array(e)), r = n.vkFormat === 1000066e3 && n.dataFormatDescriptor[0].colorModel === 167;
		if (!(n.vkFormat === 0 || r && !this.workerConfig.astcHDRSupported)) return Gl(n);
		let i = t, a = this.init().then(() => this.workerPool.postMessage({
			type: "transcode",
			buffer: e,
			taskConfig: i
		}, [e])).then((e) => this._createTextureFrom(e.data, n));
		return Rl.set(e, { promise: a }), a;
	}
	dispose() {
		this.workerPool.dispose(), this.workerSourceURL && URL.revokeObjectURL(this.workerSourceURL), zl--;
	}
};
Vl.BasisFormat = {
	ETC1S: 0,
	UASTC: 1,
	UASTC_HDR: 2
}, Vl.TranscoderFormat = {
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
}, Vl.EngineFormat = {
	RGBAFormat: m,
	RGBA_ASTC_4x4_Format: h,
	RGB_BPTC_UNSIGNED_Format: ne,
	RGBA_BPTC_Format: _,
	RGBA_ETC2_EAC_Format: v,
	RGBA_PVRTC_4BPPV1_Format: y,
	RGBA_S3TC_DXT5_Format: te,
	RGB_ETC1_Format: re,
	RGB_ETC2_Format: ie,
	RGB_PVRTC_4BPPV1_Format: ae,
	RGBA_S3TC_DXT1_Format: b
}, Vl.EngineType = {
	UnsignedByteType: x,
	HalfFloatType: c,
	FloatType: s
}, Vl.BasisWorker = function() {
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
var Hl = /* @__PURE__ */ new Set([
	m,
	se,
	ce
]), Ul = {
	109: m,
	97: m,
	37: m,
	43: m,
	103: se,
	83: se,
	16: se,
	22: se,
	100: ce,
	76: ce,
	15: ce,
	9: ce,
	148: ie,
	152: v,
	[Tl]: h,
	158: h,
	157: h,
	166: g,
	165: g,
	133: b,
	134: b,
	131: oe,
	132: oe,
	138: ee,
	137: ee,
	142: te,
	141: te,
	146: _,
	145: _
}, Wl = {
	109: s,
	97: c,
	37: x,
	43: x,
	103: s,
	83: c,
	16: x,
	22: x,
	100: s,
	76: c,
	15: x,
	9: x,
	148: x,
	152: x,
	[Tl]: c,
	166: x,
	165: x
};
async function Gl(e) {
	let { vkFormat: t } = e;
	if (Ul[t] === void 0) throw Error("THREE.KTX2Loader: Unsupported vkFormat.");
	let n;
	e.supercompressionScheme === 2 && (Bl ||= new Promise(async (e) => {
		let t = new Pl();
		await t.init(), e(t);
	}), n = await Bl);
	let o = [];
	for (let r = 0; r < e.levels.length; r++) {
		let i = Math.max(1, e.pixelWidth >> r), a = Math.max(1, e.pixelHeight >> r), l = e.pixelDepth ? Math.max(1, e.pixelDepth >> r) : 0, u = e.levels[r], d;
		if (e.supercompressionScheme === 0) d = u.levelData;
		else if (e.supercompressionScheme === 2) d = n.decode(u.levelData, u.uncompressedByteLength);
		else throw Error("THREE.KTX2Loader: Unsupported supercompressionScheme.");
		let f;
		f = Wl[t] === s ? new Float32Array(d.buffer, d.byteOffset, d.byteLength / Float32Array.BYTES_PER_ELEMENT) : Wl[t] === c ? new Uint16Array(d.buffer, d.byteOffset, d.byteLength / Uint16Array.BYTES_PER_ELEMENT) : d, o.push({
			data: f,
			width: i,
			height: a,
			depth: l
		});
	}
	let d;
	if (Hl.has(Ul[t])) d = e.pixelDepth === 0 ? new a(o[0].data, e.pixelWidth, e.pixelHeight) : new i(o[0].data, e.pixelWidth, e.pixelHeight, e.pixelDepth);
	else {
		if (e.pixelDepth > 0) throw Error("THREE.KTX2Loader: Unsupported pixelDepth.");
		d = new r(o, e.pixelWidth, e.pixelHeight), d.minFilter = o.length === 1 ? l : u, d.magFilter = l;
	}
	return d.mipmaps = o, d.type = Wl[t], d.format = Ul[t], d.colorSpace = Kl(e), d.needsUpdate = !0, Promise.resolve(d);
}
function Kl(e) {
	let t = e.dataFormatDescriptor[0];
	return t.colorPrimaries === 1 ? t.transferFunction === 2 ? le : d : t.colorPrimaries === 10 ? t.transferFunction === 2 ? Il : Ll : (t.colorPrimaries === 0 || console.warn(`THREE.KTX2Loader: Unsupported color primaries, "${t.colorPrimaries}"`), p);
}
//#endregion
//#region src/engine/runtimeTextureLoader.ts
var ql = class {
	imageLoader = new e.TextureLoader();
	ktx2Loader;
	constructor(e, t = "/basis/") {
		this.ktx2Loader = new Vl().setTranscoderPath(t).detectSupport(e);
	}
	loadAsync(e) {
		return /\.ktx2(?:[?#]|$)/i.test(e) ? this.ktx2Loader.loadAsync(e) : this.imageLoader.loadAsync(e);
	}
	dispose() {
		this.ktx2Loader.dispose();
	}
}, Jl = {
	maxOutputSize: 2048,
	enabled: !1
};
function Yl(e, t, n) {
	let r = Math.max(1, Number.isFinite(e) ? e : 1), i = Math.max(1, Number.isFinite(t) ? t : 1);
	return Math.min(Math.max(.1, Number.isFinite(n) ? n : 1), 2, Jl.maxOutputSize / Math.max(r, i));
}
//#endregion
//#region src/engine/Haruki3DEngine.ts
var Xl = 1, Zl = new e.Vector3(ue.x, ue.y, ue.z), Ql = new e.Vector3(de.x, de.y, de.z).normalize(), $l = !0, eu = 0, tu = 1e-5, nu = ri("up");
function ru(e) {
	return e && typeof e == "object" ? e : {};
}
function iu(e) {
	return Array.isArray(e) ? e.length : 0;
}
function au(e) {
	let t = ru(e);
	return {
		managers: iu(t.managers ?? t.Managers),
		bones: iu(t.bones ?? t.Bones),
		extraBones: iu(t.extraBones ?? t.ExtraBones),
		sphereColliders: iu(t.sphereColliders ?? t.SphereColliders),
		capsuleColliders: iu(t.capsuleColliders ?? t.CapsuleColliders),
		panelColliders: iu(t.panelColliders ?? t.PanelColliders),
		characterHairPresent: !!(t.characterHair ?? t.CharacterHair),
		characterEyePresent: !!(t.characterEye ?? t.CharacterEye)
	};
}
function ou(e, t, n) {
	let r = ru(e), i = ru(r.pjskSpringBone ?? r.PjskSpringBone), a = ru(i.raw ?? i.Raw), o = au(a.body ?? a.Body), s = au(a.head ?? a.Head), c = !!(a.body ?? a.Body ?? a.head ?? a.Head);
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
function su(t, n, r = /* @__PURE__ */ new Set()) {
	if (!(!t || typeof t != "object" || r.has(t))) {
		if (r.add(t), t instanceof e.Texture) {
			n.add(t);
			return;
		}
		if (!(t instanceof e.Color || t instanceof e.Vector2 || t instanceof e.Vector3 || t instanceof e.Vector4 || t instanceof e.Matrix3 || t instanceof e.Matrix4 || ArrayBuffer.isView(t) || t instanceof ArrayBuffer)) {
			if (Array.isArray(t)) {
				for (let e of t) su(e, n, r);
				return;
			}
			for (let e of Object.values(t)) su(e, n, r);
		}
	}
}
function cu(e, t = !0, n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set()) {
	let i = Array.isArray(e) ? e : [e];
	for (let e of i) if (!n.has(e)) {
		if (t) {
			let t = /* @__PURE__ */ new Set();
			su(e, t);
			for (let e of t) r.has(e) || (e.dispose(), r.add(e));
		}
		e.dispose();
	}
}
function lu(e, t = /* @__PURE__ */ new Set()) {
	let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		let i = e;
		i.isMesh && (i.geometry && !i.userData.pjskOutlineShell && !n.has(i.geometry) && (i.geometry.dispose(), n.add(i.geometry)), i.material && cu(i.material, !0, t, r));
	});
}
function uu(e, t = /* @__PURE__ */ new Set()) {
	for (let n of [...e.children]) lu(n, t), e.remove(n);
}
function du(e) {
	let t = e.getAttribute("color");
	if (!t) return null;
	let n = 0;
	for (let e = 0; e < t.count; e += 1) if (n = Math.max(n, t.getX(e)), n > .01) return n;
	return n;
}
function fu(e) {
	return e === "eye" || e === "eyelight";
}
function pu(e) {
	let t = /* @__PURE__ */ new Set();
	typeof e.userData.pjskMaterialKind == "string" && t.add(e.userData.pjskMaterialKind);
	let n = Array.isArray(e.material) ? e.material : [e.material];
	for (let e of n) typeof e?.userData.pjskMaterialKind == "string" && t.add(e.userData.pjskMaterialKind);
	let r = n.map((e) => e.name.toLowerCase()), i = e.name.toLowerCase();
	return (Mc(e.name) === "acc" || i.includes("/acc") || r.some((e) => e.includes("_acc") || e.startsWith("mtl_acc"))) && t.add("accessory"), [...t];
}
function mu(e) {
	return e.find((e) => !fu(e)) ?? e[0] ?? null;
}
function hu(e) {
	return e.length > 0 && e.every(fu);
}
function gu(t) {
	if (t instanceof e.ShaderMaterial) {
		let n = t.uniforms.uMainTex?.value;
		if (n instanceof e.Texture) return n;
	}
	return t.map ?? null;
}
function _u(e, t, n, r = 0, i = 1) {
	let a = Math.hypot(t, n);
	return a <= tu ? e.set(r, i) : e.set(t / a, n / a);
}
function vu(t, n) {
	let r = Math.abs(n - t);
	return e.MathUtils.clamp(1 - Math.abs(r - 180) / 180, 0, 1);
}
function Q(e) {
	return e && typeof e == "object" ? e : {};
}
function yu(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function bu(t) {
	let n = Q(t), r = yu(n.r ?? n.R), i = yu(n.g ?? n.G), a = yu(n.b ?? n.B);
	return r === null || i === null || a === null ? null : `#${new e.Color(r, i, a).getHexString()}`;
}
function xu(e, t = !0) {
	let n = Q(e), r = yu(n.tileX ?? n.TileX), i = yu(n.tileY ?? n.TileY), a = yu(n.sample ?? n.Sample);
	return r && i && a !== null ? {
		tileX: r,
		tileY: i,
		sample: a,
		enabled: t
	} : null;
}
function Su(e) {
	let t = Q(e), n = Q(t.characterControllers ?? t.CharacterControllers), r = Q(n.eye ?? n.Eye);
	return Object.keys(r).length ? {
		lightInfluence: yu(r.lightInfluence ?? r.LightInfluence),
		lightInfluenceForEyeHighlight: yu(r.lightInfluenceForEyeHighlight ?? r.LightInfluenceForEyeHighlight),
		tintColor: bu(r.tintColor ?? r.TintColor),
		emissionColor: bu(r.emissionColor ?? r.EmissionColor),
		baseTiling: xu(r.baseTiling ?? r.BaseTiling),
		highlightTiling: xu(r.highlightTiling ?? r.HighlightTiling)
	} : null;
}
function Cu(e) {
	let t = Q(e), n = Q(t.pjskSpringBone ?? t.PjskSpringBone), r = Q(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = Q(t.funit ?? t.FUnit ?? n.funit ?? n.FUnit ?? r.funit ?? r.FUnit), a = i.detectedScripts ?? i.DetectedScripts, o = Array.isArray(a) ? a.filter((e) => typeof e == "string") : [], s = (e, t) => Math.max(Math.trunc(yu(i[e] ?? i[t]) ?? 0), 0);
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
function wu(t) {
	let n = Q(t), r = Q(n.characterControllers ?? n.CharacterControllers), i = Q(r.hair ?? r.Hair);
	if (!Object.keys(i).length) return null;
	let a = Q(i.headTransform ?? i.HeadTransform);
	return {
		offset: ei(Qr(i.offset ?? i.Offset, new e.Vector3())),
		headTransformName: typeof (a.name ?? a.Name) == "string" ? String(a.name ?? a.Name) : null,
		headTransformPath: typeof (a.transformPath ?? a.TransformPath) == "string" ? String(a.transformPath ?? a.TransformPath) : null
	};
}
function Tu(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function $(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function Eu(e) {
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid roleId ${e}: expected "<characterId>:<unit>".`);
	return {
		characterId: r,
		unit: n.length > 0 && n.join(":").trim() || null
	};
}
function Du() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
var Ou = class {
	container;
	ownsCanvas;
	scene;
	camera;
	renderer;
	controls;
	cameraTarget = new e.Vector3();
	autoRender;
	manageResize;
	clock = new e.Clock();
	directionalLight;
	fillLight;
	textureLoader;
	bodyMaterial;
	hairMaterial;
	faceMaterial;
	characterLighting;
	projectedShadow;
	characterRoot;
	bodySlot;
	headSlot;
	sceneReference = new e.Group();
	capturePresentationEnabled = null;
	captureBackgroundTexture = null;
	viewportWidth = 0;
	viewportHeight = 0;
	viewportPixelRatio = 0;
	animationFrame = 0;
	importRevision = 0;
	customSelectionQueue = Promise.resolve();
	customSelectionGeneration = 0;
	currentBodyAsset = null;
	currentHeadAsset = null;
	currentImportSnapshot = null;
	currentBodyAttachNode = null;
	currentHeadAttachOriginNode = null;
	currentCompositionStatus = {
		mode: "pending",
		missingBodyBones: [],
		missingHeadBones: []
	};
	currentBodyAnimationRoot = null;
	faceMotion = new vc();
	animationPlayback;
	currentRuntimeExtension = null;
	currentSpringRuntime = null;
	currentExtraBoneRuntime = null;
	currentConstraintRuntime = null;
	currentSpringTimelineControl = null;
	currentPrefabSourceGraph = null;
	currentPrefabHeadFollowDebug = {
		active: !1,
		sourcePath: null,
		targetPath: null,
		reason: null
	};
	springRuntimeMode = "unity-prefab";
	characterHeight = 1;
	tempMatrixA = new e.Matrix4();
	tempMatrixB = new e.Matrix4();
	tempVector = new e.Vector3();
	tempVectorB = new e.Vector3();
	tempQuaternion = new e.Quaternion();
	tempScale = new e.Vector3();
	faceRightWorld = new e.Vector3();
	faceUpWorld = new e.Vector3();
	faceForwardWorld = new e.Vector3();
	headTransformUpWorld = new e.Vector3();
	faceHeadWorldPosition = new e.Vector3();
	faceShadowHeadHorizontal = new e.Vector2();
	faceShadowLightHorizontal = new e.Vector2();
	headDotDirectionalLight = new e.Vector2();
	hairHeadPosition = new e.Vector3();
	currentHairOffset = new e.Vector3();
	currentHairHeadTransform = null;
	currentCameraPreset = "default";
	currentCameraProfile = null;
	cameraDebugChangeCallback = null;
	currentLoadedRuntimePackage = null;
	lastNativeMeshInstallDiagnostics = null;
	lastConstraintSetupDiagnostics = null;
	runtimeDebug = {
		materialBindingMode: "manifest",
		hairShadowMode: "sekai_head_position",
		hairShadowOffset: $(this.currentHairOffset),
		hairShadowWorldPosition: $(this.hairHeadPosition),
		funit: Cu(null),
		body: [],
		head: [],
		headMaterialSlots: [],
		headMorphs: [],
		outlineShells: []
	};
	constructor(t, n) {
		let r = t instanceof HTMLElement ? {
			container: t,
			initialLight: n
		} : t;
		if (!r.initialLight) throw Error("Missing initial light state for Haruki 3D engine.");
		let i = r.initialLight;
		if (!r.container && !r.canvas) throw Error("Haruki 3D engine requires a container or canvas.");
		this.animationPlayback = new pc({ onLoopPromoted: () => this.faceMotion.promoteLoop() }), this.container = r.container ?? null, this.ownsCanvas = r.canvas === void 0, this.autoRender = r.autoRender ?? !0, this.manageResize = r.manageResize ?? r.canvas === void 0, this.scene = new e.Scene(), this.scene.background = new e.Color("#7f8d95"), this.scene.fog = new e.Fog("#7f8d95", 5.5, 15);
		let a = r.canvas ?? r.container, o = this.ownsCanvas ? 320 : 1, s = Math.max(a.clientWidth, o), c = Math.max(a.clientHeight, o), l = $a(i.characterHeight);
		this.camera = new e.PerspectiveCamera(l.fov, s / c, .1, 100), this.camera.position.copy(l.position), this.renderer = new e.WebGLRenderer({
			antialias: !1,
			stencil: !0,
			canvas: r.canvas
		}), this.renderer.autoClearStencil = !0;
		let u = Yl(s, c, window.devicePixelRatio);
		this.renderer.setPixelRatio(u), this.renderer.setSize(s, c, this.ownsCanvas), this.viewportWidth = s, this.viewportHeight = c, this.viewportPixelRatio = u, this.renderer.outputColorSpace = e.SRGBColorSpace, this.container && this.renderer.domElement.parentElement !== this.container && this.container.appendChild(this.renderer.domElement), this.updateCaptureBackgroundTexture(), this.cameraTarget.copy(l.target), r.controlsFactory ? (this.controls = r.controlsFactory({
			camera: this.camera,
			canvas: this.renderer.domElement,
			target: this.cameraTarget,
			onChange: (e) => {
				this.cameraTarget.copy(e), this.cameraDebugChangeCallback?.();
			}
		}), this.controls.update()) : (this.controls = null, this.camera.lookAt(this.cameraTarget)), this.directionalLight = new e.DirectionalLight("#fffaf2", i.intensity), this.directionalLight.position.set(i.x, i.y, i.z), this.scene.add(this.directionalLight), this.fillLight = new e.AmbientLight("#fff8f0", i.ambient), this.scene.add(this.fillLight), this.textureLoader = new ql(this.renderer, r.ktx2TranscoderPath), this.bodyMaterial = dr({
			baseColor: "#f5d6d0",
			shadowColor: "#c79b95",
			lightDirection: this.directionalLight.position.clone(),
			lightIntensity: i.intensity,
			ambientIntensity: i.ambient,
			shadowThreshold: i.shadowThreshold,
			shadowWeight: i.shadowWeight,
			valueShadowInfluence: Xl,
			characterAmbientIntensity: i.characterAmbient,
			rimColorAlpha: i.rimColorAlpha,
			controllerRimRange: i.rimRange,
			controllerRimEdgeSmoothness: i.rimEdgeSmoothness,
			controllerRimEmission: i.rimEmission,
			controllerRimLightInfluence: i.rimLightInfluence,
			controllerRimShadowSharpness: i.rimShadowSharpness,
			rimDirection: Ec()
		}), this.hairMaterial = dr({
			baseColor: "#7b5b4a",
			shadowColor: "#513d33",
			lightDirection: this.directionalLight.position.clone(),
			lightIntensity: i.intensity,
			ambientIntensity: i.ambient,
			shadowThreshold: i.shadowThreshold,
			shadowWeight: i.shadowWeight,
			valueShadowInfluence: Xl,
			characterAmbientIntensity: i.characterAmbient,
			rimColorAlpha: i.rimColorAlpha,
			controllerRimRange: i.rimRange,
			controllerRimEdgeSmoothness: i.rimEdgeSmoothness,
			controllerRimEmission: i.rimEmission,
			controllerRimLightInfluence: i.rimLightInfluence,
			controllerRimShadowSharpness: i.rimShadowSharpness,
			rimDirection: Ec(),
			hairShadowEnabled: !1,
			useLambert: !0,
			headPosition: this.hairHeadPosition
		}), this.faceMaterial = mr({
			baseColor: "#ffe4dc",
			warmColor: "#ffd4c8",
			lightDirection: Ql.clone(),
			lightIntensity: i.intensity,
			ambientIntensity: i.ambient,
			headDotDirectionalLight: this.headDotDirectionalLight,
			useFaceShadowLimiter: $l,
			faceShadowLimitRange: eu,
			shadowThreshold: i.shadowThreshold,
			shadowWeight: i.shadowWeight,
			useLambert: !0
		}), this.characterRoot = new e.Group(), this.bodySlot = new e.Group(), this.headSlot = new e.Group(), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot), this.characterLighting = new Cl({
			bodyMaterial: this.bodyMaterial,
			hairMaterial: this.hairMaterial,
			faceMaterial: this.faceMaterial,
			bodySlot: this.bodySlot,
			headSlot: this.headSlot,
			directionalLight: this.directionalLight,
			fillLight: this.fillLight,
			debug: this.runtimeDebug,
			valueShadowInfluence: Xl
		}), this.applyCharacterHeight(i.characterHeight), this.scene.add(this.characterRoot), this.projectedShadow = new lo(), this.scene.add(this.projectedShadow.group), this.setPresentationMode(r.presentationMode ?? "interactive"), this.applyCameraPreset(r.cameraPreset ?? "default", r.cameraProfile), this.handleResize = this.handleResize.bind(this), this.manageResize && (window.addEventListener("resize", this.handleResize), this.handleResize()), this.autoRender && this.render();
	}
	async importCombinedCharacter(e, t = {}) {
		let n = ++this.importRevision, r = t.preserveAnimation ? this.animationPlayback.capturePosition() : null;
		t.disposeBeforeLoad && this.releaseCurrentCharacterResources({
			preserveAnimationSelection: t.preserveAnimation ?? !1,
			clearAnimationCache: t.clearAnimationCache ?? !1
		}), this.runtimeDebug.outlineShells = [], this.lastNativeMeshInstallDiagnostics = null, this.currentBodyAsset = e.bodyAsset, this.currentHeadAsset = e.headAsset, this.characterLighting.setCharacterSkinColors(e.skinColors ?? null), this.lastConstraintSetupDiagnostics = null, this.applyCharacterHeight(e.bodyAsset.characterHeightMeters ?? this.characterHeight);
		let i = await this.loadCombinedCharacterAsset(e);
		if (n !== this.importRevision) return {
			revision: n,
			body: this.makeImportStatus(e.bodyAsset, i),
			head: this.makeImportStatus(e.headAsset, i),
			composition: this.currentCompositionStatus
		};
		this.clearCharacterSlot(this.bodySlot), this.clearCharacterSlot(this.headSlot), this.resetSlotParents(), this.currentRuntimeExtension = e.runtimeExtension, this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentBodyAttachNode = null, this.currentHeadAttachOriginNode = null, this.runtimeDebug.headMorphs = [], this.faceMotion.release({ preserveMotion: !0 }), this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.currentHairHeadTransform = null, this.currentPrefabHeadFollowDebug = {
			active: !1,
			sourcePath: null,
			targetPath: null,
			reason: "not initialized"
		}, this.bodySlot.add(i.root), this.currentPrefabSourceGraph = i.prefabSourceGraph, $o(i.prefabSourceGraph, this.characterHeight), i.prefabSourceGraph.root !== i.root && this.bodySlot.add(i.prefabSourceGraph.root), this.currentBodyAnimationRoot = i.prefabSourceGraph.root, this.currentBodyAttachNode = i.prefabSourceGraph.bodyAttach, this.currentHeadAttachOriginNode = i.prefabSourceGraph.headOrigin, this.currentPrefabHeadFollowDebug = i.prefabSourceGraph.debug, this.runtimeDebug.headMorphs = this.faceMotion.bind(i.root, e.headAsset), this.prepareCombinedComposition(), this.currentConstraintRuntime = bs(i.prefabSourceGraph, this.currentRuntimeExtension, this.characterHeight), this.syncUnityPrefabSourceGraph(), this.currentExtraBoneRuntime = Ma.fromPjskRuntimeExtension(this.currentRuntimeExtension, i.prefabSourceGraph.root), this.currentSpringRuntime = this.createSpringRuntime(i.prefabSourceGraph.root), await Promise.all([this.reloadAnimationPlayback({ resetSpring: r === null }), this.renderer.compileAsync(this.scene, this.camera)]), r && (this.animationPlayback.restorePosition(r), this.faceMotion.applyCurrent(), this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), this.resetCurrentSpringRuntimeState());
		let a = {
			revision: n,
			body: {
				...this.makeImportStatus(e.bodyAsset, i),
				assetId: e.id,
				displayName: `${e.displayName} [combined body]`
			},
			head: {
				...this.makeImportStatus(e.headAsset, i),
				assetId: e.id,
				displayName: `${e.displayName} [combined head]`
			},
			composition: this.currentCompositionStatus
		};
		return this.currentImportSnapshot = a, this.characterLighting.applyCharacterView(), a;
	}
	setHairShadowMode(e) {
		this.characterLighting.setHairShadowMode(e);
	}
	setProjectedShadowSettings(e = {}) {
		this.projectedShadow.setSettings(e);
	}
	setFaceSdfDebugMode(e) {
		this.characterLighting.setFaceSdfDebugMode(e);
	}
	setFaceSdfEnabled(e) {
		this.characterLighting.setFaceSdfEnabled(e);
	}
	setBodyDebugMode(e) {
		this.characterLighting.setBodyDebugMode(e);
	}
	setToonShadowPreview(e, t) {
		this.characterLighting.setToonShadowPreview(e, t);
	}
	setFaceSdfDebugLightMode(e) {
		this.characterLighting.setFaceSdfDebugLightMode(e), this.updateShaderFaceBasis();
	}
	setRenderIsolationMode(e) {
		this.characterLighting.setRenderIsolationMode(e);
	}
	setCharacterYawDegrees(t) {
		let n = e.MathUtils.degToRad(Number.isFinite(t) ? t : 0);
		this.characterRoot.rotation.y = n, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.updateShaderFaceBasis();
	}
	faceCharacterTowardCamera() {
		this.characterRoot.updateMatrixWorld(!0);
		let e = this.currentBodyAnimationRoot ?? this.characterRoot;
		e.updateMatrixWorld(!0);
		let t = Tu(mo(e), [
			"body/Position",
			"body/Position/PositionOffset",
			"body/Position/PositionOffset/Hip",
			"body/Position/Hip",
			"face/Position"
		])?.node ?? e;
		if (t.updateMatrixWorld(!0), t.getWorldQuaternion(this.tempQuaternion), this.tempVector.set(0, 0, 1).applyQuaternion(this.tempQuaternion), this.tempVector.y = 0, this.tempVector.lengthSq() < 1e-6) {
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
		this.characterRoot.rotation.y += i - r, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.updateShaderFaceBasis();
	}
	getRuntimeDebugSnapshot() {
		return {
			...structuredClone(this.runtimeDebug),
			headMaterialSlots: this.currentHeadAsset?.faceMaterials.map((e) => ({
				meshName: e.meshName,
				slotIndex: e.slotIndex,
				materialKey: e.materialKey,
				materialName: e.materialName,
				materialKind: e.materialKind,
				isAccessory: e.isAccessory,
				valueTex: e.valueTex
			})) ?? [],
			nativeMeshes: this.lastNativeMeshInstallDiagnostics,
			constraints: this.lastConstraintSetupDiagnostics,
			funit: Cu(this.currentRuntimeExtension),
			hairShadowOffset: $(this.currentHairOffset),
			hairShadowWorldPosition: $(this.hairHeadPosition),
			camera: this.getCameraDebugSnapshot(),
			faceLight: this.getFaceLightDebugSnapshot(),
			projectedShadow: this.projectedShadow.getDebugSnapshot(this.characterHeight)
		};
	}
	getFaceLightDebugSnapshot() {
		let t = this.directionalLight.position.clone().normalize(), n = this.characterLighting.resolveFaceShadowLightDirection(Ql, this.faceRightWorld, this.faceForwardWorld), r = new e.Vector2(), i = new e.Vector2(), a = new e.Vector2(), o = new e.Vector2();
		_u(r, -this.headTransformUpWorld.x, -this.headTransformUpWorld.z), _u(i, this.faceRightWorld.x, this.faceRightWorld.z), _u(a, this.faceForwardWorld.x, this.faceForwardWorld.z), _u(o, n.x, n.z);
		let s = e.MathUtils.radToDeg(Math.atan2(this.faceForwardWorld.x, this.faceForwardWorld.z)), c = e.MathUtils.radToDeg(Math.atan2(o.x, o.y)), l = this.faceForwardWorld.clone().normalize(), u = this.faceRightWorld.clone().sub(l.clone().multiplyScalar(this.faceRightWorld.dot(l))).normalize(), d = this.faceUpWorld.clone().sub(l.clone().multiplyScalar(this.faceUpWorld.dot(l))).sub(u.clone().multiplyScalar(this.faceUpWorld.dot(u))).normalize(), f = new e.Vector3(n.dot(u), n.dot(d), n.dot(l)), p = Math.max(Math.hypot(f.x, f.z), .001), m = f.x / p, h = f.z / p, g = (this.faceMaterial.uniforms.uUseFaceShadowLimiter?.value ?? 1) > .5, _ = this.faceMaterial.uniforms.uFaceShadowLimitRange?.value ?? 0, v = this.headDotDirectionalLight.y, y = e.MathUtils.clamp(g ? Math.min(Math.max((1 - Math.abs(2 * v - 1)) * .5, 0), _) : v, 0, 1);
		return {
			lightDirection: $(n),
			previewLightDirection: $(t),
			costumeShopLightRotationDegrees: $(Zl),
			faceRightWorld: $(u),
			faceUpWorld: $(d),
			faceForwardWorld: $(l),
			headHorizontalFromUp: {
				x: Number(r.x.toFixed(5)),
				y: Number(r.y.toFixed(5))
			},
			headHorizontalFromRight: {
				x: Number(i.x.toFixed(5)),
				y: Number(i.y.toFixed(5))
			},
			headHorizontalFromForward: {
				x: Number(a.x.toFixed(5)),
				y: Number(a.y.toFixed(5))
			},
			lightHorizontal: {
				x: Number(o.x.toFixed(5)),
				y: Number(o.y.toFixed(5))
			},
			headDotDirectionalLight: {
				x: Number(this.headDotDirectionalLight.x.toFixed(5)),
				y: Number(this.headDotDirectionalLight.y.toFixed(5))
			},
			faceTbnLight: $(f),
			faceLight: {
				side: Number(m.toFixed(5)),
				front: Number(h.toFixed(5))
			},
			faceSdfLimit: Number(y.toFixed(5)),
			headYawDegrees: Number(s.toFixed(3)),
			lightYawDegrees: Number(c.toFixed(3))
		};
	}
	getCameraDebugSnapshot() {
		let t = this.camera.position, n = this.controls?.target ?? this.cameraTarget, r = t.clone().sub(n), i = new e.Spherical().setFromVector3(r), a = (this.currentCameraPreset === "capture" ? eo(this.currentCameraProfile ?? "full-body") : null)?.costumeShopState ?? null;
		return {
			preset: this.currentCameraPreset,
			profile: this.currentCameraProfile,
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
				x: Number(t.x.toFixed(4)),
				y: Number(t.y.toFixed(4)),
				z: Number(t.z.toFixed(4))
			},
			target: {
				x: Number(n.x.toFixed(4)),
				y: Number(n.y.toFixed(4)),
				z: Number(n.z.toFixed(4))
			},
			offset: {
				x: Number(r.x.toFixed(4)),
				y: Number(r.y.toFixed(4)),
				z: Number(r.z.toFixed(4))
			},
			distance: Number(i.radius.toFixed(4)),
			polarDegrees: Number(e.MathUtils.radToDeg(i.phi).toFixed(3)),
			azimuthDegrees: Number(e.MathUtils.radToDeg(i.theta).toFixed(3)),
			fovDegrees: Number(this.camera.fov.toFixed(3)),
			aspect: Number(this.camera.aspect.toFixed(4)),
			zoom: Number(this.camera.zoom.toFixed(4)),
			minPolarDegrees: Number(e.MathUtils.radToDeg(this.controls?.minPolarAngle ?? e.MathUtils.degToRad(82)).toFixed(3)),
			maxPolarDegrees: Number(e.MathUtils.radToDeg(this.controls?.maxPolarAngle ?? e.MathUtils.degToRad(100)).toFixed(3)),
			characterHeight: Number(this.characterHeight.toFixed(4))
		};
	}
	onCameraDebugChange(e) {
		this.cameraDebugChangeCallback = e;
	}
	getSpringBoneSnapshot(e) {
		return ou(this.currentRuntimeExtension, !1, this.currentSpringRuntime?.getSnapshot(this.isSpringRuntimeEnabled(), e) ?? null);
	}
	setUtjSpringBoneTraceFilters(e, t) {
		this.currentSpringRuntime?.setTraceBoneFilters(e, t);
	}
	getUtjSpringBoneTraceSnapshot() {
		return this.currentSpringRuntime?.getTraceSnapshot() ?? null;
	}
	getAnimationSnapshot() {
		let e = this.currentSpringRuntime?.getControlledTrackNodeNames() ?? /* @__PURE__ */ new Set(), t = this.animationPlayback.getSnapshot({
			faceMotionEnabled: this.faceMotion.isEnabled(),
			utjControlledNodeNames: e
		});
		return t.bodyRetargetDebug ? {
			...t,
			bodyRetargetDebug: {
				...t.bodyRetargetDebug,
				prefabHeadFollow: this.getPrefabHeadFollowDebugSnapshot()
			}
		} : t;
	}
	getFaceMotionSnapshot() {
		return this.faceMotion.getSnapshot();
	}
	setAnimationPaused(e) {
		this.animationPlayback.setPaused(e);
	}
	setAnimationSpeed(e) {
		this.animationPlayback.setSpeed(e);
	}
	setFaceMotionEnabled(e) {
		this.faceMotion.setEnabled(e);
	}
	setBodyHeadTracksEnabled(e) {
		this.animationPlayback.setBodyHeadTracksEnabled(e) && this.reloadAnimationPlayback();
	}
	setUtjSpringBoneEnabled(e) {
		this.setSpringRuntimeMode(e ? "unity-prefab" : "off");
	}
	setSpringRuntimeMode(e) {
		let t = this.isSpringRuntimeEnabled(), n = this.springRuntimeMode;
		this.springRuntimeMode = e, n !== e && this.currentBodyAnimationRoot && (this.currentSpringRuntime?.resetPose(), this.currentSpringRuntime = this.createSpringRuntime(this.currentPrefabSourceGraph?.root ?? this.currentBodyAnimationRoot));
		let r = this.isSpringRuntimeEnabled();
		r && !t ? this.resetAndSettleCurrentSpringRuntime(60) : !r && t && this.currentSpringRuntime?.resetPose();
	}
	resetCurrentSpringRuntimeState() {
		this.currentSpringRuntime?.resetStateToCurrentPose();
	}
	resetAndSettleCurrentSpringRuntime(e) {
		this.resetCurrentSpringRuntimeState(), this.currentSpringRuntime?.settleCurrentPose(e);
	}
	isSpringRuntimeEnabled() {
		return this.springRuntimeMode !== "off";
	}
	createSpringRuntime(e) {
		if (this.springRuntimeMode === "unity-prefab") {
			let t = ui.fromPjskRuntimeExtension(this.currentRuntimeExtension, e);
			return t && this.currentSpringTimelineControl && t.setTimelineControl(this.currentSpringTimelineControl), t;
		}
		return null;
	}
	setSpringTimelineControl(e) {
		this.currentSpringTimelineControl = e ? { ...e } : null, this.currentSpringTimelineControl ? this.currentSpringRuntime?.setTimelineControl(this.currentSpringTimelineControl) : this.currentSpringRuntime?.clearTimelineControl();
	}
	seekAnimation(e) {
		this.applyAnimationSeekResult(this.animationPlayback.seek(e));
	}
	seekAnimationPhase(e) {
		return this.applyAnimationSeekResult(this.animationPlayback.seekPhase(e)), this.getAnimationSnapshot();
	}
	seekAnimationLoopPhase(e) {
		return this.applyAnimationSeekResult(this.animationPlayback.seekLoopPhase(e)), this.getAnimationSnapshot();
	}
	applyAnimationSeekResult(e) {
		this.faceMotion.seek(e), this.syncOfficialModelCombineSetup(), this.resetCurrentSpringRuntimeState();
	}
	setPresentationMode(e) {
		this.setCapturePresentation(e === "capture");
	}
	setCapturePresentation(t) {
		if (this.capturePresentationEnabled === t) {
			t && this.handleResize();
			return;
		}
		if (this.capturePresentationEnabled = t, t) {
			this.scene.fog = null, this.sceneReference.visible = !1, this.handleResize();
			return;
		}
		this.scene.fog = new e.Fog("#7f8d95", 5.5, 15), this.sceneReference.visible = !1;
	}
	stepCharacterDynamics(e, t) {
		let n = Math.max(0, e);
		t && (this.animationPlayback.step(n), this.faceMotion.step(n, this.animationPlayback.getSpeed(), this.animationPlayback.isPaused())), this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), this.isSpringRuntimeEnabled() ? this.currentSpringRuntime?.update(n) : this.currentSpringRuntime?.resetPose();
	}
	stepCaptureFrame(e, t) {
		this.stepCharacterDynamics(e, t), this.updateProjectedShadows(), this.updateShaderCameraPositions(), this.updateShaderFaceBasis();
	}
	getCharacterRoot() {
		return this.characterRoot;
	}
	updateProjectedShadows() {
		if (!this.currentBodyAsset) {
			this.projectedShadow.update({
				targetWorldPositions: [],
				lightWorldPosition: null,
				characterHeight: this.characterHeight,
				visible: !1
			});
			return;
		}
		let t = new e.Vector3();
		this.directionalLight.getWorldPosition(t), this.projectedShadow.update({
			targetWorldPositions: this.resolveProjectedShadowTargetWorldPositions(),
			lightWorldPosition: t,
			characterHeight: this.characterHeight,
			visible: !0
		});
	}
	resolveProjectedShadowTargetWorldPositions() {
		let t = this.currentBodyAnimationRoot ?? this.characterRoot;
		return t.updateMatrixWorld(!0), ao.map((e) => this.findNodeByImportedName(t, e)).filter((e) => e !== null).map((t) => t.getWorldPosition(new e.Vector3()));
	}
	getCanvas() {
		return this.renderer.domElement;
	}
	waitForPostProcessorReady() {
		return Promise.resolve();
	}
	setViewportSize(e, t) {
		let n = this.ownsCanvas ? 320 : 1, r = Math.max(Math.trunc(e) || 0, n), i = Math.max(Math.trunc(t) || 0, n), a = Yl(r, i, window.devicePixelRatio);
		this.viewportWidth === r && this.viewportHeight === i && this.viewportPixelRatio === a || (this.camera.aspect = r / i, this.camera.updateProjectionMatrix(), this.renderer.setPixelRatio(a), this.renderer.setSize(r, i, this.ownsCanvas), this.updateCaptureBackgroundTexture(r, i), this.viewportWidth = r, this.viewportHeight = i, this.viewportPixelRatio = a);
	}
	renderFrame() {
		this.renderer.render(this.scene, this.camera);
	}
	finishCaptureFrame() {
		this.renderer.getContext().finish();
	}
	stepRuntimeFrame(e, t = {}) {
		this.stepCaptureFrame(e, t.advanceAnimation ?? !0), this.updateLayerMaterialTime(t.elapsedTime ?? this.clock.elapsedTime);
	}
	async loadRuntimePackage(e) {
		let t = this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? null, n = e.roleId ?? null;
		t && n && t !== n && (this.releaseCurrentCharacterResources({
			preserveAnimationSelection: !1,
			clearAnimationCache: !0
		}), this.currentLoadedRuntimePackage = null);
		let r = await On(e.baseUrl, e);
		if (this.currentLoadedRuntimePackage = r, r.previewLight && this.updatePreviewLight(r.previewLight), await this.setAnimationSelection(null), this.setFaceMotionSet(null, null, null), !r.combinedCharacter) return r;
		await this.importCombinedCharacter(r.combinedCharacter);
		let i = r.combinedCharacter.bodyAsset.source.animationUrls?.[0], a = Ws(i ?? null), o = i && (a === "unity-json" || /body[_-]?motion/i.test(i.split(/[/?#]/)[0] ?? "")) ? i : null, s = _c(r.combinedCharacter.runtimeExtension);
		return e.applyFaceMotion !== !1 && (r.faceMotion ?? s) && this.setFaceMotionSet(r.faceMotion ?? s, "face", o ? "face_loop" : null), e.applyDefaultAnimation !== !1 && i && await this.setAnimationSelection({
			motionUrl: i,
			motionKind: a,
			loopUrl: o,
			loopKind: o ? a : null
		}), r;
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
			if (!n()) throw Du();
			return e(n);
		}, i = this.customSelectionQueue.then(r, r);
		return this.customSelectionQueue = i.catch(() => void 0), i;
	}
	async applyCustomSelection(e, t = () => !0) {
		let n = this.currentLoadedRuntimePackage?.wardrobe;
		if (!n) throw Error("No custom part package is loaded.");
		let r = n.getCustomSelection(), i = n.getCombinedCharacter()?.id ?? null, a = await n.setCustomSelection(e, t);
		if (!t()) throw Du();
		let o = i !== null && i === a.id, s = a.bodyAsset.source.animationUrls?.[0] ?? null, c = Ws(s), l = s && (c === "unity-json" || /body[_-]?motion/i.test(s.split(/[/?#]/)[0] ?? "")) ? s : null, u = i !== null && r !== null && E(r.characterId, r.unit) === E(e.characterId, e.unit) && this.animationPlayback.matchesSelection(s, l);
		return o || await this.importCombinedCharacter(a, {
			preserveAnimation: u,
			disposeBeforeLoad: !0,
			clearAnimationCache: !1
		}), await this.applyCustomRoleDefaultMotion(a, !u), a;
	}
	async loadRenderRecipeInternal(e, t) {
		let n = String(e.baseUrl ?? "").trim();
		if (!n) throw Error("baseUrl is required to load a render recipe.");
		let r = qa(e), i = Eu(r.roleId), a = Eu(r.bodyRoleId), o = E(i.characterId, i.unit), s = this.currentLoadedRuntimePackage, c = s?.partSet?.baseUrl ?? null, l = s?.wardrobe?.getActiveRoleId() ?? null;
		(!s?.wardrobe || c !== n || l !== o) && await this.loadRuntimePackage({
			baseUrl: n,
			roleId: o,
			deferDefaultSelection: !0,
			applyDefaultAnimation: !1,
			applyFaceMotion: !1
		});
		let u = this.currentLoadedRuntimePackage?.wardrobe;
		if (!u) throw Error("No custom part package is loaded.");
		u.getActiveRoleId() !== o && u.selectRole(i.characterId, i.unit);
		let d = u.getPartPackageSet();
		d && (await kn(d, a.characterId, a.unit), await Mn(d, i.characterId, i.unit));
		let f = {
			characterId: i.characterId,
			unit: i.unit,
			bodyCharacterId: a.characterId,
			bodyUnit: a.unit,
			bodyCostume3dId: r.bodyCostume3dId,
			headCostume3dId: r.headCostume3dId,
			headPackagePath: r.headPackagePath,
			hairCostume3dId: r.hairCostume3dId,
			headOptionalCostume3dId: r.headOptionalCostume3dId
		};
		return {
			selection: f,
			combinedCharacter: await this.applyCustomSelection(f, t)
		};
	}
	async applyCustomRoleDefaultMotion(e, t) {
		let n = e.bodyAsset.source.animationUrls?.[0], r = Ws(n ?? null), i = n && (r === "unity-json" || /body[_-]?motion/i.test(n.split(/[/?#]/)[0] ?? "")) ? n : null, a = _c(e.runtimeExtension);
		a && (t || !this.faceMotion.hasMotion()) && this.setFaceMotionSet(a, "face", i ? "face_loop" : null), n && (t || !this.animationPlayback.hasSelection()) && await this.setAnimationSelection({
			motionUrl: n,
			motionKind: r,
			loopUrl: i,
			loopKind: i ? r : null
		});
	}
	getSnapshots(e) {
		return {
			animation: this.getAnimationSnapshot(),
			faceMotion: this.getFaceMotionSnapshot(),
			springBone: this.getSpringBoneSnapshot(e),
			camera: this.getCameraDebugSnapshot(),
			runtimeDebug: this.getRuntimeDebugSnapshot(),
			utjSpringBoneTrace: this.getUtjSpringBoneTraceSnapshot()
		};
	}
	setFaceMotionSet(e, t, n) {
		this.faceMotion.setMotion(e, t, n);
	}
	async setAnimationSelection(e) {
		return this.animationPlayback.setSelection(e), await this.reloadAnimationPlayback(), this.getAnimationSnapshot();
	}
	updatePreviewLight(e) {
		this.applyCharacterHeight(e.characterHeight), this.characterLighting.updatePreviewLight(e, this.currentBodyAsset, this.currentHeadAsset, this.headDotDirectionalLight, Ql);
	}
	updateGlobalShadowColor(e, t = 1) {
		this.characterLighting.updateGlobalShadowColor(e, t);
	}
	updateLightControllerColors(e) {
		this.characterLighting.updateControllerColors(e);
	}
	updateLightControllerRimShape(e) {
		this.characterLighting.updateControllerRimShape(e);
	}
	updateLightControllerOutline(e) {
		this.characterLighting.updateControllerOutline(e);
	}
	destroy() {
		cancelAnimationFrame(this.animationFrame), this.releaseCurrentCharacterResources({
			preserveAnimationSelection: !1,
			clearAnimationCache: !0
		}), this.manageResize && window.removeEventListener("resize", this.handleResize), this.controls?.dispose(), this.projectedShadow.dispose(), this.textureLoader.dispose(), this.captureBackgroundTexture?.dispose(), this.renderer.dispose(), this.ownsCanvas && this.renderer.domElement.parentElement === this.container && this.renderer.domElement.remove();
	}
	addSceneReference() {}
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
	applyCharacterHeight(t) {
		let n = e.MathUtils.clamp(t || 1, .5, 2), r = Math.abs(n - this.characterHeight) >= 1e-4;
		if (this.characterHeight = n, this.characterRoot.scale.setScalar(1), this.currentPrefabSourceGraph && $o(this.currentPrefabSourceGraph, n), !r) return;
		let i = $a(n);
		this.setCameraTarget(i.target), this.camera.position.copy(i.position), this.syncCameraTarget();
	}
	applyCameraPreset(e, t = "full-body") {
		if (this.currentCameraPreset = e, e === "capture") {
			this.currentCameraProfile = t;
			let e = eo(t);
			this.setCameraTarget(e.target), this.camera.position.copy(e.position), this.camera.fov = e.fov;
		} else {
			this.currentCameraProfile = null;
			let e = $a(this.characterHeight);
			this.setCameraTarget(e.target), this.camera.position.copy(e.position), this.camera.fov = e.fov;
		}
		this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	shiftCameraRight(e = 1) {
		if (!Number.isFinite(e) || e === 0) return;
		let t = this.controls?.target ?? this.cameraTarget, n = to(this.camera.position, t, e, this.characterHeight);
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
	getPersistentCharacterMaterials() {
		return /* @__PURE__ */ new Set([
			this.bodyMaterial,
			this.hairMaterial,
			this.faceMaterial
		]);
	}
	clearCharacterSlot(e) {
		uu(e, this.getPersistentCharacterMaterials());
	}
	releaseCurrentCharacterResources(e = {}) {
		this.animationPlayback.release({
			preserveSelection: e.preserveAnimationSelection,
			clearCache: e.clearAnimationCache
		}), this.faceMotion.release({ preserveMotion: e.preserveAnimationSelection }), this.currentSpringRuntime?.resetPose(), this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentRuntimeExtension = null, this.currentBodyAttachNode = null, this.currentHeadAttachOriginNode = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.currentPrefabHeadFollowDebug = {
			active: !1,
			sourcePath: null,
			targetPath: null,
			reason: "not initialized"
		}, this.runtimeDebug.headMorphs = [], this.clearCharacterSlot(this.bodySlot), this.clearCharacterSlot(this.headSlot), this.resetSlotParents(), this.renderer.renderLists.dispose(), this.renderer.info.reset();
	}
	findNodeByName(e, t) {
		return t ? this.findNodeByImportedName(e, t) : null;
	}
	findNodeByImportedName(e, t) {
		let n = e.getObjectByName(t);
		if (n) return n;
		for (let n = 1; n <= 16; n++) {
			let r = e.getObjectByName(`${t}_${n}`);
			if (r) return r;
		}
		return null;
	}
	findBoneByImportedName(e, t) {
		let n = e.get(t);
		if (n) return n;
		for (let n = 1; n <= 16; n++) {
			let r = e.get(`${t}_${n}`);
			if (r) return r;
		}
		return null;
	}
	getNodeDepth(e) {
		let t = 0, n = e.parent;
		for (; n;) t += 1, n = n.parent;
		return t;
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
		let t = ds(e.runtimeExtension, null);
		if (!t) throw Error("Final runtime package must provide runtimeUnitySetup version 0414.");
		this.currentPrefabSourceGraph = t, this.syncUnityPrefabSourceGraph();
		let n = ms(t, e.runtimeExtension);
		if (this.lastNativeMeshInstallDiagnostics = n, n.error) throw Error(`${n.error}${n.warnings.length ? ` ${n.warnings.slice(0, 3).join(" ")}` : ""}`);
		return this.syncUnityPrefabSourceGraph(), await Promise.all([this.overrideBodyMaterials(t.root, e.bodyAsset), this.overrideHeadMaterials(t.root, e.headAsset, {
			eyeController: Su(e.runtimeExtension),
			hairController: wu(e.runtimeExtension)
		})]), this.installSekaiOutlineShells(t.root), {
			root: t.root,
			sourceMode: "unity-runtime",
			requestedUrl: e.unityRuntimeJsonUrl,
			meshCount: n.meshCount,
			boneCount: n.boneCount,
			skinnedMeshCount: n.skinnedMeshCount,
			prefabSourceGraph: t
		};
	}
	installSekaiOutlineShells(t) {
		let n = [];
		t.traverse((e) => {
			let t = e;
			!t.isMesh || t.userData.pjskOutlineShell || t.userData.pjskEyeThroughHairOverlay || t.userData.pjskEyeThroughHairStencilPrepass || n.push(t);
		});
		for (let t of n) {
			let n = pu(t);
			if (hu(n)) continue;
			let r = mu(n), i = du(t.geometry);
			if (i === null || i <= .01) continue;
			let a = Array.isArray(t.material) ? t.material : [t.material], o = a.map((e) => e.name), s = a.map((n) => {
				let r = n.userData.pjskOutlineSourceMaterial instanceof e.ShaderMaterial ? n.userData.pjskOutlineSourceMaterial : null;
				if (delete n.userData.pjskOutlineSourceMaterial, fu(n.userData.pjskMaterialKind)) {
					r?.dispose();
					let t = new e.MeshBasicMaterial();
					return t.name = "pjsk_shell_outline_skipped", t.visible = !1, t;
				}
				let i = n.userData.pjskRawMaterial;
				if (!sl(i)) {
					r?.dispose();
					let t = new e.MeshBasicMaterial();
					return t.name = "pjsk_shell_outline_disabled", t.visible = !1, t;
				}
				let a = n.userData.pjskLighting, o = (a?.useOutlineSecondNormal ?? 0) > .5 && !!t.geometry.getAttribute("tangent") && !!t.geometry.getAttribute("uv1") && !!t.geometry.getAttribute("uv2"), s = fl(!!t.geometry.getAttribute("color"), i, o, gu(n), r ?? n);
				return s.userData.pjskOutlineUseSecondNormal = o, s.userData.pjskOutlineWantsSecondNormal = (a?.useOutlineSecondNormal ?? 0) > .5, r?.dispose(), this.characterLighting.applyOutlineMaterial(s), s;
			});
			if (!s.some((e) => e.visible)) {
				for (let e of s) e.dispose();
				continue;
			}
			let c = Array.isArray(t.material) ? s : s[0], l = t instanceof e.SkinnedMesh ? new e.SkinnedMesh(t.geometry, c) : new e.Mesh(t.geometry, c);
			l.name = `${t.name}_outline`, l.renderOrder = Math.max(t.renderOrder - 2, 0), l.frustumCulled = t.frustumCulled, l.userData.pjskOutlineShell = !0, l.userData.pjskSourceMaterialKind = r, l.matrixAutoUpdate = t.matrixAutoUpdate, l.position.copy(t.position), l.quaternion.copy(t.quaternion), l.scale.copy(t.scale), l instanceof e.SkinnedMesh && t instanceof e.SkinnedMesh && l.bind(t.skeleton, t.bindMatrix), this.runtimeDebug.outlineShells.push({
				meshName: t.name,
				outlineName: l.name,
				sourceMaterialKind: r,
				sourceMaterialKinds: n,
				sourceMaterialNames: o,
				hasVertexColor: !!t.geometry.getAttribute("color"),
				vertexColorRedMax: i,
				renderOrder: l.renderOrder,
				sourceRenderOrder: t.renderOrder,
				hasTangent: !!t.geometry.getAttribute("tangent"),
				hasUv1: !!t.geometry.getAttribute("uv1"),
				hasUv2: !!t.geometry.getAttribute("uv2"),
				useSecondNormal: s.map((e) => e.userData.pjskOutlineUseSecondNormal === !0),
				wantsSecondNormal: s.map((e) => e.userData.pjskOutlineWantsSecondNormal === !0)
			}), t.parent?.add(l);
		}
	}
	async overrideBodyMaterials(e, t) {
		this.runtimeDebug.body = [];
		let n = this.characterLighting.getBindingView();
		await Wc({
			root: e,
			bodyAsset: t,
			headAsset: this.currentHeadAsset,
			textureLoader: this.textureLoader,
			template: this.bodyMaterial,
			bodyDebugMode: n.bodyDebugMode,
			debug: this.runtimeDebug.body
		});
	}
	async overrideHeadMaterials(t, n, r = {}) {
		let i = this.characterLighting.getBindingView();
		this.runtimeDebug.head = [], this.currentHairOffset.copy(r.hairController?.offset ?? new e.Vector3()), this.currentHairHeadTransform = null;
		let a = r.hairController?.headTransformPath;
		a && t.traverse((e) => {
			!this.currentHairHeadTransform && e.userData.pjskTransformPath === a && (this.currentHairHeadTransform = e);
		}), this.currentHairHeadTransform ??= r.hairController?.headTransformName ? this.findNodeByImportedName(t, r.hairController.headTransformName) : null, await tl({
			root: t,
			headAsset: n,
			textureLoader: this.textureLoader,
			templates: {
				body: this.bodyMaterial,
				hair: this.hairMaterial,
				face: this.faceMaterial
			},
			view: {
				bodyDebugMode: i.bodyDebugMode,
				faceDebugMode: i.faceDebugMode,
				faceSdfEnabled: i.faceSdfEnabled
			},
			hair: {
				controllerPresent: !!r.hairController,
				proximityShadowEnabled: i.proximityHairShadowEnabled,
				headPosition: this.hairHeadPosition
			},
			eyeController: r.eyeController,
			debug: this.runtimeDebug.head
		});
	}
	handleResize() {
		let e = this.container ?? this.renderer.domElement, t = Math.max(e.clientWidth, 320), n = Math.max(e.clientHeight, 320);
		this.setViewportSize(t, n);
	}
	updateCaptureBackgroundTexture(e, t) {
		let n = this.container ?? this.renderer.domElement, r = Math.max(Math.round(e ?? n.clientWidth), 320), i = Math.max(Math.round(t ?? n.clientHeight), 320);
		this.captureBackgroundTexture?.dispose(), this.captureBackgroundTexture = no(r, i), this.scene.background = this.captureBackgroundTexture;
	}
	updateShaderCameraPositions() {
		this.characterLighting.updateCamera(this.camera.position);
	}
	updateShaderFaceBasis() {
		let t = this.currentHairHeadTransform ?? this.findFaceSdfHeadBone() ?? this.findNodeByImportedName(this.bodySlot, "Head") ?? this.findNodeByImportedName(this.headSlot, "Head") ?? this.currentBodyAnimationRoot ?? this.characterRoot;
		t.getWorldQuaternion(this.tempQuaternion), t.getWorldPosition(this.faceHeadWorldPosition), this.headTransformUpWorld.copy(nu).applyQuaternion(this.tempQuaternion).normalize(), this.faceUpWorld.set(1, 0, 0).applyQuaternion(this.tempQuaternion).normalize(), this.faceForwardWorld.set(0, 0, 1).applyQuaternion(this.tempQuaternion).normalize(), this.faceRightWorld.crossVectors(this.faceUpWorld, this.faceForwardWorld).normalize(), this.faceUpWorld.crossVectors(this.faceForwardWorld, this.faceRightWorld).normalize();
		let n = this.characterLighting.resolveFaceShadowLightDirection(Ql, this.faceRightWorld, this.faceForwardWorld);
		_u(this.faceShadowHeadHorizontal, -this.headTransformUpWorld.x, -this.headTransformUpWorld.z), _u(this.faceShadowLightHorizontal, n.x, n.z);
		let r = e.MathUtils.radToDeg(Math.atan2(this.faceForwardWorld.x, this.faceForwardWorld.z)), i = e.MathUtils.radToDeg(Math.atan2(this.faceShadowLightHorizontal.x, this.faceShadowLightHorizontal.y));
		this.headDotDirectionalLight.set(this.faceShadowHeadHorizontal.dot(this.faceShadowLightHorizontal), vu(r, i)), this.hairHeadPosition.copy(this.currentHairOffset), t.localToWorld(this.hairHeadPosition), this.runtimeDebug.hairShadowOffset = $(this.currentHairOffset), this.runtimeDebug.hairShadowWorldPosition = $(this.hairHeadPosition), this.characterLighting.updateFaceBasis(n, this.headDotDirectionalLight, this.hairHeadPosition), this.characterLighting.updateEyeThroughHairView(this.camera.position, this.faceHeadWorldPosition, this.faceForwardWorld);
	}
	findFaceSdfHeadBone() {
		for (let t of [this.headSlot, this.bodySlot]) {
			let n = null, r = null;
			if (t.traverse((t) => {
				if (r) return;
				let i = t;
				if (!(!i.isSkinnedMesh || !i.skeleton) && (Array.isArray(i.material) ? i.material : [i.material]).some((t) => t instanceof e.ShaderMaterial && !!t.uniforms.uFaceShadowTex)) for (let e of i.skeleton.bones) {
					if (e.name === "Head" || /^Head_\d+$/.test(e.name)) {
						r = e;
						return;
					}
					!n && e.name.toLowerCase().includes("head") && (n = e);
				}
			}), r ?? n) return r ?? n;
		}
		return null;
	}
	updateLayerMaterialTime(t) {
		for (let n of [this.bodySlot, this.headSlot]) n.traverse((n) => {
			let r = n;
			if (!r.isMesh) return;
			let i = Array.isArray(r.material) ? r.material : [r.material];
			for (let n of i) n instanceof e.ShaderMaterial && n.uniforms.uTime && (n.uniforms.uTime.value = t);
		});
	}
	render() {
		let e = this.clock.getDelta(), t = this.clock.elapsedTime;
		this.stepRuntimeFrame(e, {
			advanceAnimation: !0,
			elapsedTime: t
		}), this.controls?.update(), this.renderFrame(), this.animationFrame = requestAnimationFrame(() => this.render());
	}
	async reloadAnimationPlayback(e = {}) {
		(await this.animationPlayback.refresh({
			root: this.currentBodyAnimationRoot,
			retargetWithUnityPrefab: this.currentPrefabSourceGraph !== null,
			runtimeExtension: this.currentRuntimeExtension,
			prefabHeadFollow: this.getPrefabHeadFollowDebugSnapshot()
		})).poseApplied && (this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), (e.resetSpring ?? !0) && this.resetCurrentSpringRuntimeState());
	}
	getPrefabHeadFollowDebugSnapshot() {
		return xs(this.currentPrefabSourceGraph, this.currentRuntimeExtension, this.currentPrefabHeadFollowDebug);
	}
	syncUnityPrefabSourceGraph() {
		let e = this.currentPrefabSourceGraph;
		e && (this.lastConstraintSetupDiagnostics = ys(e, this.currentRuntimeExtension, this.characterHeight, this.currentConstraintRuntime));
	}
	syncOfficialModelCombineSetup() {
		this.syncUnityPrefabSourceGraph();
	}
}, ku = 1 / 60, Au = 5;
function ju(e) {
	let t = String(e.assetBaseUrl ?? "").trim();
	if (!t) throw Error("assetBaseUrl is required to create the Haruki 3D kernel.");
	return Mu(new Ou({
		canvas: e.canvas,
		initialLight: { ...e.initialLight ?? pe },
		autoRender: !1,
		manageResize: !1,
		ktx2TranscoderPath: e.ktx2TranscoderPath
	}), t);
}
function Mu(e, t) {
	let n = 0, r = !1, i = !1, a = Promise.resolve(), o = null, s = null, c = null, l = 0, u = 0, d = () => {
		if (i) throw Error("Haruki 3D kernel has been destroyed.");
	}, f = (n) => {
		d();
		let r = Nu(n);
		if (s?.key === r) return s.promise;
		let i = Promise.all([e.waitForPostProcessorReady?.() ?? Promise.resolve(), e.loadRenderRecipe({
			...n,
			baseUrl: t
		})]).then(() => void 0);
		return s = {
			key: r,
			promise: i
		}, a = i.then(() => void 0, () => void 0), i.catch(() => {
			s?.promise === i && (s = null);
		}), i;
	}, p = (t) => {
		if (!r || i) return;
		c === null && (c = t), l += Math.min(Math.max((t - c) / 1e3, 0), ku * Au), c = t;
		let a = 0;
		for (; l >= ku && a < Au;) u += ku, e.stepRuntimeFrame(ku, {
			advanceAnimation: !0,
			elapsedTime: u
		}), l -= ku, a += 1;
		e.renderFrame(), n = requestAnimationFrame(p);
	};
	return {
		prepare: f,
		async load(t) {
			await f(t), !i && (e.stepRuntimeFrame(0, {
				advanceAnimation: !1,
				elapsedTime: u
			}), e.renderFrame());
		},
		play() {
			d(), !r && (r = !0, c = null, l = 0, n = requestAnimationFrame(p));
		},
		pause() {
			r && (r = !1, cancelAnimationFrame(n), n = 0, c = null, l = 0);
		},
		resize(t, n) {
			d(), e.setViewportSize(t, n), e.renderFrame();
		},
		destroy() {
			return o || (i = !0, s = null, r = !1, cancelAnimationFrame(n), n = 0, o = a.then(() => {
				e.destroy();
			}), o);
		}
	};
}
function Nu(e) {
	return [
		e.roleId,
		e.bodyRoleId ?? e.roleId,
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.headPackagePath ?? "",
		e.hairCostume3dId,
		e.headOptionalCostume3dId ?? ""
	].join("\0");
}
//#endregion
export { qa as $, Y as A, uc as B, zc as C, Cc as D, Lc as E, Ls as F, xs as G, ds as H, Zs as I, co as J, ys as K, Ws as L, vc as M, _c as N, bc as O, pc as P, to as Q, zs as R, Rc as S, Nc as T, bs as U, $o as V, ms as W, eo as X, no as Y, $a as Z, tl as _, de as _t, Yl as a, mr as at, Fc as b, gl as c, ir as ct, ll as d, M as dt, ui as et, il as f, xn as ft, al as g, C as gt, nl as h, pe as ht, wu as i, dr as it, Sc as j, xc as k, _l as l, ar as lt, X as m, Nt as mt, Mu as n, Lr as nt, Jl as o, _r as ot, sl as p, hn as pt, lo as q, Ou as r, Fr as rt, Cl as s, rr as st, ju as t, vr as tt, fl as u, On as ut, Pc as v, ue as vt, Uc as w, Ic as x, Wc as y, S as yt, Hs as z };
