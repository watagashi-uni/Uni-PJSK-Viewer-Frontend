import * as e from "three";
//#region src/base/browserCharacterRuntime.ts
var t = 1 / 60, n = 5;
function r(e, r) {
	let a = 0, o = !1, s = !1, c = Promise.resolve(), l = null, u = null, d = null, f = 0, p = 0, m = () => {
		if (s) throw Error("Haruki 3D runtime has been destroyed.");
	}, h = (t) => {
		m();
		let n = i(t);
		if (u?.key === n) return u.promise;
		let a = Promise.all([e.waitForPostProcessorReady?.() ?? Promise.resolve(), e.loadRenderRecipe({
			...t,
			baseUrl: r
		})]).then(() => void 0);
		return u = {
			key: n,
			promise: a
		}, c = a.then(() => void 0, () => void 0), a.catch(() => {
			u?.promise === a && (u = null);
		}), a;
	}, g = (r) => {
		if (!o || s) return;
		d === null && (d = r), f += Math.min(Math.max((r - d) / 1e3, 0), t * n), d = r;
		let i = 0;
		for (; f >= t && i < n;) p += t, e.stepRuntimeFrame(t, {
			advanceAnimation: !0,
			elapsedTime: p
		}), f -= t, i += 1;
		e.renderFrame(), a = requestAnimationFrame(g);
	};
	return {
		prepare: h,
		async load(t) {
			await h(t), !s && (e.stepRuntimeFrame(0, {
				advanceAnimation: !1,
				elapsedTime: p
			}), e.renderFrame());
		},
		play() {
			m(), !o && (o = !0, d = null, f = 0, a = requestAnimationFrame(g));
		},
		pause() {
			o && (o = !1, cancelAnimationFrame(a), a = 0, d = null, f = 0);
		},
		resize(t, n) {
			m(), e.setViewportSize(t, n), e.renderFrame();
		},
		setCharacterYawDegrees(t) {
			m(), e.setCharacterYawDegrees(t), o || e.renderFrame();
		},
		setViewYawDegrees(t) {
			m(), e.setViewYawDegrees(t), o || e.renderFrame();
		},
		async setBackground(t) {
			m(), await e.setBackgroundMode?.(t, r), !o && !s && e.renderFrame();
		},
		destroy() {
			return l || (s = !0, u = null, o = !1, cancelAnimationFrame(a), a = 0, l = c.then(() => {
				e.destroy();
			}), l);
		}
	};
}
function i(e) {
	return [
		e.roleId,
		e.bodyRoleId ?? e.roleId,
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.headPackagePath ?? "",
		e.hairCostume3dId,
		e.headOptionalCostume3dId ?? "",
		e.motionRoleId ?? ""
	].join("\0");
}
//#endregion
//#region src/original/costumeIndex.ts
var a = "original-motion:", o = /* @__PURE__ */ new WeakMap();
function s(e) {
	let t = e.toLowerCase();
	if (t === "head_optional" || t === "accessory") return "head_optional";
	if (t === "body" || t === "head" || t === "hair") return t;
	throw Error(`Unsupported runtime part type: ${e}`);
}
function c(e) {
	let t = s(e.partType);
	return (t === "head" || t === "head_optional") && u(e.headCostume3dAssetbundleType) ? "head" : t === "head" && d(e.headCostume3dAssetbundleType) ? "head_optional" : t;
}
function l(e) {
	try {
		return c(e);
	} catch {
		return null;
	}
}
function u(e) {
	return (e ?? "").trim().toLowerCase() === "head_and_hair";
}
function d(e) {
	let t = (e ?? "").trim().toLowerCase();
	return t === "head_only" || t === "head_all" || t === "head_front" || t === "head_back";
}
function f(e, t) {
	return `${e}:${he(t)}`;
}
function p(e) {
	let t = e.roles.find((t) => b(e, t.characterId, t.unit ?? null, "body", t.bodyCostume3dId) && x(e, t.characterId, t.unit ?? null, t.headCostume3dId) && b(e, t.characterId, t.unit ?? null, "hair", t.hairCostume3dId));
	if (t) {
		let n = t.bodyCostume3dId, r = t.headCostume3dId, i = t.hairCostume3dId;
		return {
			characterId: t.characterId,
			unit: t.unit ?? null,
			bodyCostume3dId: n,
			headCostume3dId: r,
			headPackagePath: ue(e, t.characterId, t.unit ?? null, r),
			hairCostume3dId: i,
			headOptionalCostume3dId: null
		};
	}
	let n = v(e, "body");
	if (!n) return null;
	let r = y(e, n.characterId, n.unit ?? null);
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
function m(e, t, n, r = {}) {
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || T(e.unit, r.unit)).filter((e) => l(e) === n).filter(C).filter((t) => !r.loadedOnly || w(t) || e.packages.has(t.packagePath)).sort((e, t) => e.costume3dId - t.costume3dId);
}
function h(e) {
	let { partSet: t, selection: n, activeRoleId: r, resolveUrl: i } = e, a = f(n.characterId, n.unit), o = n.bodyCharacterId ?? n.characterId, s = n.bodyUnit === void 0 ? n.unit : n.bodyUnit, l = f(o, s);
	if (r !== null && a !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${a}.`);
	let u = ee(t, o, s, "body", n.bodyCostume3dId), d = ne(t, n), p = S(t, te(t, n), "hair"), m = {
		...n,
		headPackagePath: d.packagePath
	}, h = re(t, m, d), v = h && c(h.part) === "head" ? h : p, y = c(d) === "head" ? _(t, n) : null, b = y ? t.packages.get(y.packagePath) ?? null : null, x = h && c(h.part) === "head_optional" ? h : null, ae = ie(t, n);
	ce(u, "body"), v && ce(v, "head"), de(o, s, [u]), de(n.characterId, n.unit, [
		v,
		x,
		ae
	].filter(Boolean)), fe(t.compatibility, m, c(d));
	let oe = [
		u,
		v,
		x,
		ae
	].filter(Boolean), se = Se(d), le = Ce(oe, se), ue = t.roleRuntimes.get(a) ?? null, C = t.roles.find((e) => f(e.characterId, e.unit) === a), w = g(t, t.roles.find((e) => f(e.characterId, e.unit) === l), u), pe = ge(u, i);
	pe.characterHeightMeters = w, _e(pe, ue);
	let me = ve(Ce([
		v,
		x,
		ae
	].filter(Boolean), se), m, i, b);
	me.characterHeightMeters = w;
	let he = Te(le, pe, me, ue);
	return {
		id: `custom-${[
			t.baseUrl,
			t.masterVersion ?? "unknown-master",
			a,
			`body-role:${l}`,
			`requested:${n.bodyCostume3dId}:${n.headCostume3dId}:${n.hairCostume3dId}:${n.headOptionalCostume3dId ?? "none"}`,
			`body:${u.packagePath ?? "unknown"}`,
			`head:${d.packagePath}`,
			`hair:${p.packagePath ?? "unknown"}`,
			`accessory:${ae?.packagePath ?? x?.packagePath ?? "none"}`,
			`motion:${ue?.motionPackage?.originalMotionBundle ?? "none"}`
		].map(encodeURIComponent).join("-")}`,
		displayName: `Custom ${a}`,
		meshUrl: "",
		unityRuntimeJsonUrl: `haruki-composed://role-${a}/unity-runtime.msgpack.br`,
		unityRuntimeJsonPath: "viewer-composed-part-runtime",
		bodyAsset: pe,
		headAsset: me,
		skinColors: C?.skinColors,
		runtimeExtension: he
	};
}
function g(e, t, n) {
	if (!t) {
		let e = (k(n.manifest) ? n.manifest : null)?.characterHeightMeters;
		if (typeof e == "number" && Number.isFinite(e) && e > 0) return e;
		throw Error("Runtime role catalog entry is missing.");
	}
	if (typeof t.characterHeightMeters == "number" && Number.isFinite(t.characterHeightMeters) && t.characterHeightMeters > 0) return t.characterHeightMeters;
	let r = le(e, t.characterId, t.unit, "body", t.bodyCostume3dId), i = r ? e.packages.get(r.packagePath) : null, a = (k(i?.manifest) ? i.manifest : null)?.characterHeightMeters;
	if (typeof a == "number" && Number.isFinite(a) && a > 0) return a;
	throw Error(`Runtime role ${f(t.characterId, t.unit)} is missing master characterHeightMeters.`);
}
function _(e, t) {
	let n = e.roles.find((e) => e.characterId === t.characterId && T(e.unit, t.unit));
	return n ? e.registry.find((e) => e.characterId === n.characterId && T(e.unit, n.unit) && e.costume3dId === n.hairCostume3dId && l(e) === "hair" && C(e)) ?? null : null;
}
function v(e, t, n, r) {
	return e.registry.find((i) => l(i) === t && (n === void 0 || i.characterId === n) && (r === void 0 || T(i.unit, r)) && i.status !== "missing" && e.packages.has(i.packagePath));
}
function y(e, t, n) {
	let r = [...m(e, t, "head", {
		unit: n,
		loadedOnly: !1
	}), ...m(e, t, "head_optional", {
		unit: n,
		loadedOnly: !1
	})], i = [...m(e, t, "head", {
		unit: n,
		loadedOnly: !0
	}), ...m(e, t, "head_optional", {
		unit: n,
		loadedOnly: !0
	}).filter((e) => !w(e))], a = /* @__PURE__ */ new Map();
	for (let e of r) {
		let t = a.get(e.costume3dId) ?? /* @__PURE__ */ new Set();
		t.add(`${c(e)}|${e.packagePath}`), a.set(e.costume3dId, t);
	}
	let o = i.filter((e) => a.get(e.costume3dId)?.size === 1).sort((e, t) => e.costume3dId - t.costume3dId || e.packagePath.localeCompare(t.packagePath)), s = m(e, t, "hair", {
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
			return fe(e.compatibility, a, c(r)), {
				head: r,
				hair: i
			};
		} catch {}
	}
	return null;
}
function b(e, t, n, r, i) {
	let a = le(e, t, n, r, i);
	return !!(a && (w(a) || e.packages.has(a.packagePath)));
}
function x(e, t, n, r) {
	return b(e, t, n, "head", r) || b(e, t, n, "head_optional", r);
}
function ee(e, t, n, r, i) {
	let a = le(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${f(t, n)}, costume3dId ${i}.`);
	return S(e, a, r);
}
function S(e, t, n) {
	if (!e.packages.has(t.packagePath)) throw Error(`Missing loaded ${n} package for role ${f(t.characterId, t.unit)}, ${oe(t)}.`);
	return se(e.packages.get(t.packagePath), t);
}
function te(e, t) {
	let n = le(e, t.characterId, t.unit, "hair", t.hairCostume3dId);
	if (!n) throw Error(`Missing hair registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.hairCostume3dId}.`);
	let r = ne(e, t).headCostume3dAssetbundleType?.trim().toLowerCase(), i = r ? n.headTypeVariants?.[r] : void 0;
	return i ? {
		...n,
		bundlePath: i.bundlePath,
		packagePath: i.packagePath
	} : n;
}
function ne(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && T(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(l(e) ?? "") && C(e) && (n === null || e.packagePath === n)).sort((e, t) => {
		let n = e.packagePath.localeCompare(t.packagePath);
		return n === 0 ? c(e).localeCompare(c(t)) : n;
	});
	if (r.length === 0) {
		let e = n ? `, packagePath ${n}` : "";
		throw Error(`Missing head registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}${e}.`);
	}
	if (new Set(r.map((e) => `${c(e)}|${e.packagePath}`)).size > 1) {
		let e = r.map((e) => `${c(e)}:${e.packagePath}`).join(", ");
		throw Error(`Ambiguous head registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}; specify headPackagePath. Candidates: ${e}.`);
	}
	return r[0];
}
function re(e, t, n = ne(e, t)) {
	if (w(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${f(t.characterId, t.unit)}, ${oe(n)}.`);
	return se(e.packages.get(n.packagePath), n);
}
function ie(e, t) {
	let n = ae(e, t);
	if (!n || w(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${f(t.characterId, t.unit)}, ${oe(n)}.`);
	return se(e.packages.get(n.packagePath), n);
}
function ae(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && T(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && l(e) === "head_optional" && C(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function oe(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${c(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function se(e, t) {
	let n = l(t) ?? e.part.partType, r = k(e.manifest) ? Mt(e.manifest) : e.manifest;
	if (k(r) && (r.id = `${n}-${t.characterId}-${t.costume3dId}-${t.unit ?? "default"}`, r.displayName = t.name ?? E(r.displayName) ?? r.id, r.characterId = String(t.characterId).padStart(2, "0"), typeof r.characterHeightMeters != "number" || r.characterHeightMeters <= 0)) throw Error(`Part runtime ${t.packagePath} is missing characterHeightMeters.`);
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
function ce(e, t) {
	let n = k(e.manifest) ? e.manifest : {};
	if (!k(n.proxy ?? n.Proxy)) throw Error(`Part runtime package '${e.packagePath ?? e.part.costume3dId}' is missing manifest.proxy material metadata for ${t}; regenerate it with a current Haruki-3D-Exporter before capture.`);
}
function le(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && T(e.unit, n) && e.costume3dId === i && l(e) === r && C(e));
}
function ue(e, t, n, r) {
	let i = new Set(e.registry.filter((e) => e.characterId === t && T(e.unit, n) && e.costume3dId === r && ["head", "head_optional"].includes(l(e) ?? "") && C(e)).map((e) => e.packagePath));
	return i.size === 1 ? [...i][0] : null;
}
function C(e) {
	return e.status !== "missing";
}
function w(e) {
	return e.status === "empty" && l(e) === "head_optional";
}
function de(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !T(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${f(r.part.characterId, r.part.unit)}, not ${f(e, t)}.`);
}
function fe(e, t, n) {
	if (!e || n === "head") return;
	let r = me(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (pe(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function pe(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = o.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => me(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return o.set(e, n), n;
}
function me(e, t, n) {
	return `${he(e)}|${t}|${n}`;
}
function he(e) {
	return e ?? "";
}
function T(e, t) {
	return he(e) === he(t);
}
function ge(e, t) {
	let n = Mt(e.manifest);
	if (n.id ||= `body-${e.part.costume3dId}`, n.displayName ||= e.part.name ?? n.id, n.characterId = String(e.part.characterId).padStart(2, "0"), typeof n.characterHeightMeters != "number" || n.characterHeightMeters <= 0) throw Error(`Body part runtime ${e.packagePath} is missing characterHeightMeters.`);
	n.materialPipeline ??= "embedded", n.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, n.neckAnchor = xe(n.neckAnchor, {
		x: 0,
		y: 1.75,
		z: .15
	}), n.skeleton ||= {}, n.skeleton.neckAttach ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, n.skeleton.neckAttach.fallbackPosition = xe(n.skeleton.neckAttach.fallbackPosition, {
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
	let r = ye(e, t);
	return n.source = {
		...n.source,
		meshUrl: jt(n.source?.meshUrl, r),
		skeletonUrl: At(n.source?.skeletonUrl, r),
		animationUrls: n.source?.animationUrls?.map((e) => jt(e, r))
	}, n.bodyMaterials = Ot(n.bodyMaterials, [e], t), n;
}
function _e(e, t) {
	let n = t?.motionPackage?.originalMotionBundle;
	n && (e.source = {
		...e.source,
		animationUrls: [`${a}${n}`]
	});
}
function ve(e, t, n, r) {
	let i = e.find((e) => c(e.part) === "head") ?? e[0], a = Mt(i.manifest);
	if (a.id = `head-${t.headCostume3dId}-source-${encodeURIComponent(t.headPackagePath ?? "auto")}-hair-${t.hairCostume3dId}`, a.displayName = `Head ${t.headCostume3dId} / Hair ${t.hairCostume3dId}`, a.characterId = String(t.characterId).padStart(2, "0"), typeof a.characterHeightMeters != "number" || a.characterHeightMeters <= 0) throw Error(`Head part runtime ${i.packagePath} is missing characterHeightMeters.`);
	a.materialPipeline ??= "embedded", a.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, a.rawImportOffset = xe(a.rawImportOffset, {
		x: 0,
		y: 0,
		z: 0
	}), a.assembly ||= {}, a.assembly.attachOrigin ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, a.assembly.attachOrigin.fallbackPosition = xe(a.assembly.attachOrigin.fallbackPosition, {
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
	let o = ye(i, n);
	return a.source = {
		...a.source,
		meshUrl: jt(a.source?.meshUrl, o),
		skeletonUrl: At(a.source?.skeletonUrl, o),
		animationUrls: a.source?.animationUrls?.map((e) => jt(e, o))
	}, a.faceMaterials = Dt(Ot(a.faceMaterials, e, n), r, n), a.morphChannelBindings = e.flatMap((e) => Array.isArray(e.morphChannelBindings) ? e.morphChannelBindings : []), a;
}
function ye(e, t) {
	let n = E(e.packagePath) || E(e.mount?.packagePath) || "";
	return (e) => !e || /^[a-z][a-z0-9+.-]*:/i.test(e) ? e : t(be(n, e));
}
function be(e, t) {
	if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith("/")) return t;
	let n = e.replace(/\/+$/, "");
	return !n || t.startsWith(`${n}/`) ? t : `${n}/${t.replace(/^\/+/, "")}`;
}
function xe(e, t) {
	return {
		x: typeof e?.x == "number" ? e.x : t.x,
		y: typeof e?.y == "number" ? e.y : t.y,
		z: typeof e?.z == "number" ? e.z : t.z
	};
}
function Se(e) {
	return c(e) === "head_optional" ? {
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
function Ce(e, t) {
	return e.filter((e) => we(e, t));
}
function we(e, t) {
	return t.activePartTypes.has(c(e.part));
}
function E(e) {
	return typeof e == "string" ? e : "";
}
function Te(e, t, n, r) {
	let i = De(e);
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
		characterControllers: Ee(e),
		nativeMeshes: vt(e, i),
		motionPackage: r?.motionPackage ?? null,
		morphChannelBindings: n.morphChannelBindings ?? [],
		pjskSpringBone: {
			raw: i.raw,
			runtimeUnitySetup: i
		},
		warnings: [...i.warnings ?? [], ...r?.warnings ?? []]
	};
}
function Ee(e) {
	let t = e.findIndex((e) => {
		let t = c(e.part);
		return t === "head" || t === "hair";
	}), n = t >= 0 ? e[t].characterControllers ?? {} : {}, r = (e) => {
		if (Array.isArray(e)) return e.map(r);
		if (!k(e) || ArrayBuffer.isView(e)) return e;
		let n = {};
		for (let [i, a] of Object.entries(e)) n[i] = (i === "pathId" || i === "transformPathId") && typeof a == "number" ? O(a, t) : i === "raw" ? a : r(a);
		return n;
	};
	return r(n);
}
function De(e) {
	let t = e.map((e, t) => He(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = It(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = it(t), f = Oe(i, d), p = lt(t, d), m = ct(s, d), h = Le(r);
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
		funit: Fe(e),
		raw: Ie(t),
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
			warnings: It(t.flatMap((e) => Pt(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return ke(t, g, bt(e)), g;
}
function Oe(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => Ft(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function ke(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = Et(E(r.runtime.mount?.attachNode)), o = a ? Ae(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && E(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${E(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => E(e.scriptName) === "CharacterAccessoryTransformController" && Me(E(e.transformPath), "optional"));
		if (c) {
			let e = E(c.transformPath), a = (i.transforms ?? []).find((t) => E(t.transformPath) === e);
			a ? (Ne(a, St(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
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
		je(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = E(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function Ae(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(A(n.prefabGraph.gameObjects).map((e) => [Tt(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (E(e.name) === t || Et(E(e.transformPath)) === t) return e;
			for (let t of e.childPathIds ?? []) {
				let e = r.get(t), n = e ? o(e) : null;
				if (n) return n;
			}
			return null;
		};
		for (let t of n.activeRoots) {
			let n = e.find((e) => e.parentPathId == null && E(e.transformPath) === t), r = n ? o(n) : null;
			if (r) return r;
		}
	}
	return null;
}
function je(e, t) {
	let n = (e) => Me(E(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = A(e.gameObjects).filter(n), e.renderers = A(e.renderers).filter(n), e.animators = A(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = A(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => E(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function Me(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function Ne(e, t) {
	let n = wt(t?.position, 0, 0, 0), r = wt(t?.rotationEulerDegrees, 0, 0, 0), i = wt(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = Pe(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function Pe(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function Fe(e) {
	let t = e.map((e) => Nt(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = It(t.flatMap((e) => Pt(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
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
function Ie(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function Le(e) {
	let t = Re(e), n = ze(e);
	return !t || !Be(e, "face") || !n ? null : {
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
function Re(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => Be(e, t)) ?? null;
}
function ze(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => Be(e, t)) ?? null;
}
function Be(e, t) {
	return e.some((e) => A(e?.transforms).some((e) => E(e.transformPath) === t));
}
function Ve(e) {
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
function He(e, t) {
	let n = Ve(e), r = c(e.part), i = Ue(r, Pt(n.activeRootProfile?.activeRoots)), a = We(D(n.managers, t, r), i), o = We(D(n.bones, t, r), i), s = We(Ge(n.extraBones, t, r), i), l = We(D(n.colliders, t, r), i), u = qe(D(n.colliderBindings, t, r), o), d = Je(D(n.managerColliderCaches, t, r), a), f = Ye(n.constraintSetup, t, r, i);
	return Ze(a, o, d), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: Xe(e.springBone?.prefabGraph, t),
		managers: a,
		bones: o,
		extraBones: s,
		colliders: l,
		colliderBindings: u,
		managerColliderCaches: d,
		constraints: f,
		activeRoots: i
	};
}
function Ue(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function We(e, t) {
	let n = new Set(t.map((e) => gt(e)));
	return e.filter((e) => {
		let t = gt(_t(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function Ge(e, t, n) {
	return D(e, t, n).map((e) => {
		let n = e, r = Ke(n.gameObject ?? n.GameObject, t), i = Ke(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = _t(n.nodePath) ?? null, n;
	});
}
function Ke(e, t) {
	if (!k(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = O(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = O(n.PathId, t)), n;
}
function qe(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function Je(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Ye(e, t, n, r) {
	let i = new Set(r.map((e) => gt(e)));
	return D(e?.constraints, t, n).map((e) => {
		let n = A(e.sources).map((e) => {
			let n = { ...e };
			return typeof n.sourcePathId == "number" && (n.sourcePathId = O(n.sourcePathId, t)), n;
		});
		return typeof e.worldUpObjectPathId == "number" && (e.worldUpObjectPathId = O(e.worldUpObjectPathId, t)), {
			...e,
			sources: n
		};
	}).filter((e) => {
		let t = gt(_t(e.ownerPath));
		return !t || i.has(t);
	});
}
function Xe(e, t) {
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
function Ze(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => Qe(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function Qe(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function D(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!k(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, typeof r.pathId == "number" && (r.pathId = O(r.pathId, t)), typeof r.index == "number" && (r.index = O(r.index, t)), typeof r.managerPathId == "number" && (r.managerPathId = O(r.managerPathId, t)), typeof r.pivotSourcePathId == "number" && (r.pivotSourcePathId = O(r.pivotSourcePathId, t)), typeof r.sourceSpringBonePathId == "number" && (r.sourceSpringBonePathId = O(r.sourceSpringBonePathId, t)), Array.isArray(r.bonePathIds) && (r.bonePathIds = r.bonePathIds.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.forceProviders) && (r.forceProviders = $e(r.forceProviders, t)), Array.isArray(r.directColliderPathIds) && (r.directColliderPathIds = r.directColliderPathIds.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.sourceColliderPathIds) && (r.sourceColliderPathIds = r.sourceColliderPathIds.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.colliders) && (r.colliders = r.colliders.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.selectedColliderIndexes) && (r.selectedColliderIndexes = r.selectedColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.sphereColliderIndexes) && (r.sphereColliderIndexes = r.sphereColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.capsuleColliderIndexes) && (r.capsuleColliderIndexes = r.capsuleColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.panelColliderIndexes) && (r.panelColliderIndexes = r.panelColliderIndexes.map((e) => typeof e == "number" ? O(e, t) : e)), Array.isArray(r.springBonePathIds) && (r.springBonePathIds = r.springBonePathIds.map((e) => typeof e == "number" ? O(e, t) : e)), k(r.collidersByRoot) && (r.collidersByRoot = et(r.collidersByRoot, t)), k(r.candidateRoots) && (r.candidateRoots = et(r.candidateRoots, t)), r;
	}) : [];
}
function $e(e, t) {
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
function et(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? O(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var tt = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function nt(e) {
	return tt.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function rt(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: nt(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function it(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = ft(t);
	return rt(e).map((e) => at(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return at(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !pt(n)) return r;
		let i = mt(n);
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
function at(e, t) {
	let n = ot(e, t);
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
function ot(e, t) {
	let n = Pt(e.matchedPrefixes), r = ft(t.filter((e) => typeof e.index == "number" && st(e, n))), i = pt(r) ? mt(r).root : gt(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function st(e, t) {
	if (!t.length) return !1;
	let n = E(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function ct(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = pt(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
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
function lt(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? ut(r, t, n) : dt(r, n)));
}
function ut(e, t, n) {
	let r = new Set(Ft(e.springBonePathIds)), i = Lt(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => Ft(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => E(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => E(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => E(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : dt(e, n);
}
function dt(e, t) {
	return {
		...e,
		sphereColliderIndexes: Ft(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: Ft(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: Ft(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function ft(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = gt(_t(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function pt(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function mt(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => ht(e) - ht(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function ht(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function gt(e) {
	return (e ?? "").trim() || "body";
}
function _t(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function vt(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = c(a.part);
		for (let o of A(a.nativeMeshes?.meshes)) {
			let a = yt(o, i);
			if (e !== "head_optional") {
				r.push(a);
				continue;
			}
			let s = E(a.rendererTransformPath), c = A(t.prefabGraphs).find((e) => Tt(e.runtimePartIndex, -1) === i && !!E(e.headOptionalAttachPath)), l = E(c?.headOptionalPrefabRootPath);
			if (!c || !l) {
				n.push(`Head optional mesh '${E(o.meshPath) || E(o.meshName) || "<unnamed>"}' was skipped because the official prefab could not be mounted.`);
				continue;
			}
			s !== l && !s.startsWith(`${l}/`) || r.push({
				...a,
				sourceRendererTransformPath: s,
				rendererTransformPath: s
			});
		}
	}
	return {
		version: "0414",
		meshes: r,
		warnings: n
	};
}
function yt(e, t) {
	let n = { ...e };
	for (let e of [
		"rendererPathId",
		"rendererTransformPathId",
		"rootBonePathId"
	]) typeof n[e] == "number" && (n[e] = O(n[e], t));
	return Array.isArray(n.bonePathIds) && (n.bonePathIds = n.bonePathIds.map((e) => typeof e == "number" ? O(e, t) : e)), n;
}
function bt(e) {
	let t = [
		...e.filter((e) => c(e.part) === "head"),
		...e.filter((e) => c(e.part) === "hair"),
		...e.filter((e) => c(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = xt(E(e.source?.bundlePath));
		if (t) return t;
		let n = xt(E(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function xt(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function St(e, t) {
	if (!t) return null;
	let n = Ct(e)[t];
	return k(n) ? n : null;
}
function Ct(e) {
	return Nt(e.mount?.accessoryTransformAdjustments);
}
function wt(e, t, n, r) {
	let i = Nt(e);
	return {
		x: Tt(i.x ?? i.X, t),
		y: Tt(i.y ?? i.Y, n),
		z: Tt(i.z ?? i.Z, r)
	};
}
function Tt(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Et(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function Dt(e, t, n) {
	if (!t) return e;
	let r = Ot([], [t], n), i = new Map(r.filter((e) => e.materialKind === "eye" || e.materialKind === "eyelight").map((e) => [e.materialKind, e]));
	return e.map((e) => {
		if (e.mainTex || e.materialKind !== "eye" && e.materialKind !== "eyelight") return e;
		let t = i.get(e.materialKind);
		return t?.mainTex ? {
			...e,
			mainTex: t.mainTex
		} : e;
	});
}
function Ot(e, t, n) {
	let r = t.flatMap((e) => {
		let t = ye(e, n);
		return (e.materialSlots ?? []).map((e) => kt(e, t));
	});
	if (r.length) return r;
	let i = t[0] ? ye(t[0], n) : n;
	return [...e ?? []].map((e) => kt(e, i));
}
function kt(e, t) {
	return {
		...e,
		mainTex: At(e.mainTex ?? void 0, t) ?? e.mainTex,
		shadowTex: At(e.shadowTex ?? void 0, t) ?? e.shadowTex,
		valueTex: At(e.valueTex ?? void 0, t) ?? e.valueTex,
		faceShadowTex: At(e.faceShadowTex ?? void 0, t) ?? e.faceShadowTex,
		rawMaterial: e.rawMaterial ? {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => ({
				...e,
				uri: At(e.uri ?? void 0, t) ?? e.uri
			}))
		} : e.rawMaterial
	};
}
function At(e, t) {
	return e && t(e);
}
function jt(e, t) {
	return e ? t(e) : "";
}
function Mt(e) {
	return JSON.parse(JSON.stringify(e));
}
function k(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function Nt(e) {
	return k(e) ? e : {};
}
function Pt(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function A(e) {
	return Array.isArray(e) ? e.filter((e) => k(e)) : [];
}
function Ft(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "number") : [];
}
function It(e) {
	return [...new Set(e)];
}
function Lt(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
//#endregion
//#region src/parts/customWardrobeController.ts
var Rt = class {
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
		return this.selection = n ? p(e) : null, this.activeRoleId = this.selection ? f(this.selection.characterId, this.selection.unit) : null, this.combined = this.selection ? this.compose(this.selection) : null, this.combined;
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
		this.activeRoleId = f(e, t), this.selection && f(this.selection.characterId, this.selection.unit) !== this.activeRoleId && (this.selection = null, this.combined = null);
	}
	getCombinedCharacter() {
		return this.combined;
	}
	listCustomParts(e, t, n = {}) {
		return this.partSet ? m(this.partSet, e, t, n) : [];
	}
	async setCustomSelection(e, t = () => !0) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let n = this.resolveHeadSource(e);
		if (this.assertSameActiveCharacter(n), await this.ensureSelectionPackages(n), await this.options.ensureCompatibility?.(n), !t()) throw zt();
		this.activeRoleId ??= f(n.characterId, n.unit);
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
		let t = ne(this.partSet, e);
		return {
			...e,
			headPackagePath: t.packagePath
		};
	}
	assertSameActiveCharacter(e) {
		let t = f(e.characterId, e.unit);
		if (this.activeRoleId !== null && t !== this.activeRoleId) throw Error(`Custom switching is limited to active role ${this.activeRoleId}. Select/reload role ${t} before switching parts.`);
	}
	async ensureSelectionPackages(e) {
		if (!this.partSet || !this.options.loadPartRuntime) return;
		let t = ne(this.partSet, e), n = e.bodyCharacterId ?? e.characterId, r = e.bodyUnit === void 0 ? e.unit : e.bodyUnit, i = this.partSet.roles.find((e) => f(e.characterId, e.unit) === f(n, r)), a = [
			this.findRegistryEntryForRole(n, r, "body", e.bodyCostume3dId),
			i ? this.findRegistryEntryForRole(n, r, "body", i.bodyCostume3dId) : null,
			t,
			te(this.partSet, e),
			ae(this.partSet, e),
			l(t) === "head" ? _(this.partSet, e) : null
		].filter((e) => e !== null && e.status !== "empty");
		await Promise.all(a.map(async (e) => {
			if (!this.partSet.packages.has(e.packagePath) && !await this.options.loadPartRuntime(e)) throw Error(`Failed to load ${e.partType} package ${e.packagePath}.`);
		}));
	}
	findRegistryEntryForRole(e, t, n, r) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let i = m(this.partSet, e, n, {
			unit: t,
			loadedOnly: !1
		}).find((e) => e.costume3dId === r);
		if (!i) throw Error(`No ${n} registry entry for role ${f(e, t)}, costume3dId ${r}.`);
		return i;
	}
	compose(e) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		return h({
			partSet: this.partSet,
			selection: e,
			activeRoleId: this.activeRoleId ?? f(e.characterId, e.unit),
			resolveUrl: this.options.resolveUrl
		});
	}
};
function zt() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
//#endregion
//#region src/runtime/brotliWasmAsset.ts
var Bt = "" + new URL("assets/brotli_wasm_bg-NfWIZley.wasm", import.meta.url).href, Vt = 64 * 1024, j = null, Ht = 1, Ut = /* @__PURE__ */ new Map();
async function Wt(e) {
	if (e.byteLength < Vt || typeof Worker > "u") return Gt(e);
	let t = Kt();
	if (!t) return Gt(e);
	let n = Ht++;
	return new Promise((r, i) => {
		Ut.set(n, {
			resolve: r,
			reject: i
		}), t.postMessage({
			id: n,
			bytes: e,
			wasmUrl: Bt
		}, [e]);
	});
}
async function Gt(e) {
	let { decodeRuntimeMessagePackBrotliDirect: t } = await import("./runtimeMessagePackDecodeCore-BMQK7vja.js");
	return t(e, Bt);
}
function Kt() {
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
			let t = Ut.get(e.id);
			t && (Ut.delete(e.id), e.error ? t.reject(Error(e.error)) : t.resolve(e.value));
		}, j.onerror = () => qt("Runtime decode worker failed."), j;
	} catch {
		return j = null, null;
	}
}
function qt(e) {
	j?.terminate(), j = null;
	for (let t of Ut.values()) t.reject(Error(e));
	Ut.clear();
}
//#endregion
//#region src/original/unityFile.ts
var Jt = new TextDecoder("utf-8", { fatal: !0 });
function M(e, t) {
	if (!e) throw Error(t);
}
var Yt = class {
	bytes;
	little;
	view;
	offset = 0;
	constructor(e, t = !1) {
		this.bytes = e, this.little = t, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
	}
	ensure(e) {
		M(e >= 0 && this.offset + e <= this.bytes.length, "truncated Unity data");
	}
	take(e) {
		this.ensure(e);
		let t = this.bytes.subarray(this.offset, this.offset + e);
		return this.offset += e, t;
	}
	u8() {
		return this.ensure(1), this.bytes[this.offset++];
	}
	i8() {
		return this.ensure(1), this.view.getInt8(this.offset++);
	}
	u16() {
		this.ensure(2);
		let e = this.view.getUint16(this.offset, this.little);
		return this.offset += 2, e;
	}
	i16() {
		this.ensure(2);
		let e = this.view.getInt16(this.offset, this.little);
		return this.offset += 2, e;
	}
	u32() {
		this.ensure(4);
		let e = this.view.getUint32(this.offset, this.little);
		return this.offset += 4, e;
	}
	i32() {
		this.ensure(4);
		let e = this.view.getInt32(this.offset, this.little);
		return this.offset += 4, e;
	}
	i64() {
		this.ensure(8);
		let e = this.view.getBigInt64(this.offset, this.little);
		return this.offset += 8, e;
	}
	u64() {
		this.ensure(8);
		let e = this.view.getBigUint64(this.offset, this.little);
		return this.offset += 8, e;
	}
	f32() {
		this.ensure(4);
		let e = this.view.getFloat32(this.offset, this.little);
		return this.offset += 4, e;
	}
	f64() {
		this.ensure(8);
		let e = this.view.getFloat64(this.offset, this.little);
		return this.offset += 8, e;
	}
	align(e = 4) {
		let t = (e - this.offset % e) % e;
		this.ensure(t), this.offset += t;
	}
	cstring() {
		let e = this.bytes.indexOf(0, this.offset);
		M(e >= 0, "unterminated Unity string");
		let t = Jt.decode(this.bytes.subarray(this.offset, e));
		return this.offset = e + 1, t;
	}
	count(e = 2147483647) {
		let t = this.i32();
		return M(t >= 0 && t <= e, `invalid Unity array length ${t}`), t;
	}
};
function Xt(e, t) {
	return M(e >= 0n && e <= BigInt(2 ** 53 - 1), `${t} out of range`), Number(e);
}
function Zt(e, t) {
	let n = new Uint8Array(t), r = 0, i = 0, a = e.length;
	for (; r < a;) {
		let o = e[r++], s = o >>> 4;
		if (s === 15) {
			let t;
			do
				t = e[r++], s += t;
			while (t === 255);
		}
		if (M(r + s <= a && i + s <= t, "LZ4 literal run out of range"), n.set(e.subarray(r, r + s), i), r += s, i += s, r >= a) break;
		let c = e[r] | e[r + 1] << 8;
		r += 2, M(c > 0 && c <= i, "invalid LZ4 match distance");
		let l = o & 15;
		if (l === 15) {
			let t;
			do
				t = e[r++], l += t;
			while (t === 255);
		}
		l += 4, M(i + l <= t, "LZ4 match out of range");
		let u = i - c;
		if (c >= l) n.copyWithin(i, u, u + l), i += l;
		else for (let e = 0; e < l; e++) n[i++] = n[u++];
	}
	return M(i === t, "LZ4 output size mismatch"), n;
}
function Qt(e, t, n) {
	let r = n & 63;
	return r === 0 ? (M(e.length === t, "uncompressed UnityFS block size mismatch"), e) : (M(r === 2 || r === 3, `unsupported UnityFS block compression ${r}`), Zt(e, t));
}
function $t(e) {
	let t = new Yt(e);
	M(t.cstring() === "UnityFS", "not a UnityFS bundle");
	let n = t.u32();
	M(n === 8, `unsupported UnityFS version ${n}`);
	let r = t.cstring(), i = t.cstring();
	M(Xt(t.i64(), "UnityFS size") === e.length, "UnityFS size mismatch");
	let a = t.u32(), o = t.u32(), s = t.u32();
	t.align(16);
	let c = t.offset, l = (s & 128) != 0, u = l ? e.length - a : c, d = new Yt(Qt(e.subarray(u, u + a), o, s));
	d.take(16);
	let f = Array.from({ length: d.count(1 << 20) }, () => ({
		size: d.u32(),
		compressed: d.u32(),
		flags: d.u16()
	})), p = Array.from({ length: d.count(65536) }, () => ({
		offset: Xt(d.i64(), "node offset"),
		size: Xt(d.i64(), "node size"),
		flags: d.u32(),
		path: d.cstring()
	})), m = l ? c : u + a;
	s & 512 && (m = Math.ceil(m / 16) * 16);
	let h = f.reduce((e, t) => e + t.size, 0), g;
	if (f.every((e) => (e.flags & 63) == 0)) g = e.subarray(m, m + h), M(g.length === h, "truncated UnityFS data");
	else {
		g = new Uint8Array(h);
		let t = 0;
		for (let n of f) g.set(Qt(e.subarray(m, m + n.compressed), n.size, n.flags), t), m += n.compressed, t += n.size;
	}
	let _ = /* @__PURE__ */ new Map();
	for (let e of p) M(e.offset + e.size <= g.length && !_.has(e.path), `invalid UnityFS node ${e.path}`), _.set(e.path, {
		path: e.path,
		flags: e.flags,
		bytes: g.subarray(e.offset, e.offset + e.size)
	});
	return {
		unityVersion: r,
		unityRevision: i,
		nodes: _
	};
}
var en = new TextEncoder().encode((/* @__PURE__ */ "AABB.AnimationClip.AnimationCurve.AnimationState.Array.Base.BitField.bitset.bool.char.ColorRGBA.Component.data.deque.double.dynamic_array.FastPropertyName.first.float.Font.GameObject.Generic Mono.GradientNEW.GUID.GUIStyle.int.list.long long.map.Matrix4x4f.MdFour.MonoBehaviour.MonoScript.m_ByteSize.m_Curve.m_EditorClassIdentifier.m_EditorHideFlags.m_Enabled.m_ExtensionPtr.m_GameObject.m_Index.m_IsArray.m_IsStatic.m_MetaFlag.m_Name.m_ObjectHideFlags.m_PrefabInternal.m_PrefabParentObject.m_Script.m_StaticEditorFlags.m_Type.m_Version.Object.pair.PPtr<Component>.PPtr<GameObject>.PPtr<Material>.PPtr<MonoBehaviour>.PPtr<MonoScript>.PPtr<Object>.PPtr<Prefab>.PPtr<Sprite>.PPtr<TextAsset>.PPtr<Texture>.PPtr<Texture2D>.PPtr<Transform>.Prefab.Quaternionf.Rectf.RectInt.RectOffset.second.set.short.size.SInt16.SInt32.SInt64.SInt8.staticvector.string.TextAsset.TextMesh.Texture.Texture2D.Transform.TypelessData.UInt16.UInt32.UInt64.UInt8.unsigned int.unsigned long long.unsigned short.vector.Vector2f.Vector3f.Vector4f.m_ScriptingClassIdentifier.Gradient.Type*.int2_storage.int3_storage.BoundsInt.m_CorrespondingSourceObject.m_PrefabInstance.m_PrefabAsset.FileSize.Hash128.RenderingLayerMask.fixed_array.EntityId.".split(".")).join("\0")), tn = 16384;
function nn(e, t) {
	return (n, r, i) => {
		let a = e.BYTES_PER_ELEMENT;
		if (i) {
			let t = new ArrayBuffer(r * a);
			return new Uint8Array(t).set(n.subarray(0, r * a)), new e(t, 0, r);
		}
		let o = new DataView(n.buffer, n.byteOffset, r * a);
		return Array.from({ length: r }, (e, n) => t(o, n * a, !1));
	};
}
var rn = (() => {
	let e = {
		size: 1,
		read: (e) => e.u8(),
		array: (e, t) => e.slice(0, t)
	}, t = {
		size: 1,
		read: (e) => e.u8() !== 0,
		array: (e, t) => Array.from(e.subarray(0, t), (e) => e !== 0)
	}, n = {
		size: 1,
		read: (e) => e.i8(),
		array: (e, t) => new Int8Array(e.slice(0, t).buffer)
	}, r = {
		size: 2,
		read: (e) => e.u16(),
		array: nn(Uint16Array, (e, t, n) => e.getUint16(t, n))
	}, i = {
		size: 2,
		read: (e) => e.i16(),
		array: nn(Int16Array, (e, t, n) => e.getInt16(t, n))
	}, a = {
		size: 4,
		read: (e) => e.u32(),
		array: nn(Uint32Array, (e, t, n) => e.getUint32(t, n))
	}, o = {
		size: 4,
		read: (e) => e.i32(),
		array: nn(Int32Array, (e, t, n) => e.getInt32(t, n))
	}, s = {
		size: 4,
		read: (e) => e.f32(),
		array: nn(Float32Array, (e, t, n) => e.getFloat32(t, n))
	}, c = {
		size: 8,
		read: (e) => e.f64(),
		array: nn(Float64Array, (e, t, n) => e.getFloat64(t, n))
	}, l = (e) => ({
		size: 8,
		read: (t) => e ? t.i64() : t.u64(),
		array: (t, n, r) => {
			let i = new DataView(t.buffer, t.byteOffset, n * 8);
			return Array.from({ length: n }, (t, n) => e ? i.getBigInt64(n * 8, r) : i.getBigUint64(n * 8, r));
		}
	});
	return {
		UInt8: e,
		char: e,
		bool: t,
		SInt8: n,
		UInt16: r,
		"unsigned short": r,
		SInt16: i,
		short: i,
		UInt32: a,
		"unsigned int": a,
		"Type*": a,
		SInt32: o,
		int: o,
		float: s,
		double: c,
		UInt64: l(!1),
		"unsigned long long": l(!1),
		FileSize: l(!1),
		SInt64: l(!0),
		"long long": l(!0)
	};
})();
function an(e) {
	let t = (e.metaFlags & tn) !== 0, n = (e, t) => t ? (t) => {
		let n = e(t);
		return t.align(), n;
	} : e, r = rn[e.type];
	if (r && e.children.length === 0) return n(r.read, t);
	if (e.type === "string") return (e) => {
		let t = e.count(), n = Jt.decode(e.take(t));
		return e.align(), n;
	};
	if (e.type === "TypelessData") return n((e) => e.take(e.count()), t);
	let i = e.children[0];
	if (i && i.type === "Array") {
		M(i.children.length === 2, `invalid TypeTree array ${e.name}`);
		let r = i.children[1], a = t || (i.metaFlags & tn) !== 0, o = rn[r.type];
		if (o && r.children.length === 0 && (r.metaFlags & tn) === 0) return n((e) => {
			let t = e.count(), n = e.take(t * o.size);
			return o.array(n, t, e.little);
		}, a);
		let s = an(r);
		return n((e) => {
			let t = e.count();
			r.byteSize > 0 && e.ensure(t * r.byteSize);
			let n = Array(t);
			for (let r = 0; r < t; r++) n[r] = s(e);
			return n;
		}, a);
	}
	M(e.children.length > 0, `unsupported TypeTree leaf ${e.type} ${e.name}`);
	let a = e.children.map((e) => [e.name, an(e)]);
	return n((e) => {
		let t = {};
		for (let [n, r] of a) t[n] = r(e);
		return t;
	}, t);
}
function on(e) {
	let t = e.count(1 << 20), n = e.count(1 << 26);
	M(t > 0, "missing embedded TypeTree");
	let r = Array(t);
	for (let n = 0; n < t; n++) {
		e.u16();
		let t = e.u8();
		e.u8();
		let i = e.u32(), a = e.u32(), o = e.i32();
		e.i32();
		let s = e.i32();
		M(e.u64() === 0n, "managed-reference TypeTrees are not supported"), r[n] = {
			level: t,
			typeOffset: i,
			nameOffset: a,
			byteSize: o,
			metaFlags: s
		};
	}
	let i = e.take(n), a = (e) => {
		let t = (e & 2147483648) == 0, n = t ? i : en, r = t ? e : e & 2147483647, a = n.indexOf(0, r);
		return Jt.decode(n.subarray(r, a < 0 ? n.length : a));
	}, o = [], s = null;
	for (let e of r) {
		let t = {
			type: a(e.typeOffset),
			name: a(e.nameOffset),
			byteSize: e.byteSize,
			metaFlags: e.metaFlags,
			children: []
		};
		M(e.level <= o.length, "invalid TypeTree nesting"), o.length = e.level, e.level === 0 ? s = t : o[e.level - 1].children.push(t), o.push(t);
	}
	return s;
}
function sn(e) {
	let t = new Yt(e);
	t.u32(), t.u32();
	let n = t.u32();
	t.u32(), M(n === 22, `unsupported SerializedFile version ${n}`);
	let r = t.u8();
	t.take(3);
	let i = t.u32(), a = Xt(t.i64(), "file size"), o = Xt(t.i64(), "data offset");
	t.i64(), M(a === e.length, "SerializedFile size mismatch"), t.little = r === 0;
	let s = t.cstring(), c = t.i32();
	M(t.u8() === 1, "SerializedFile without TypeTrees");
	let l = [];
	for (let e = t.count(65536); e > 0; e--) {
		let e = t.i32();
		t.u8();
		let n = t.i16();
		e === 114 && t.take(16), t.take(16);
		let r = on(t);
		t.take(t.count(1 << 20) * 4), l.push({
			classId: e,
			typeName: r.type,
			scriptTypeIndex: n,
			read: an(r)
		});
	}
	let u = /* @__PURE__ */ new Map(), d = t.little;
	for (let n = t.count(1 << 24); n > 0; n--) {
		t.align();
		let n = t.i64(), r = Xt(t.i64(), "object offset") + o, i = t.u32(), s = l[t.i32()];
		M(s && r + i <= a && !u.has(n), `invalid object entry ${n}`);
		let c;
		u.set(n, {
			pathId: n,
			classId: s.classId,
			typeName: s.typeName,
			scriptTypeIndex: s.scriptTypeIndex,
			byteStart: r,
			byteSize: i,
			read() {
				if (c === void 0) {
					let t = new Yt(e.subarray(r, r + i), d);
					c = s.read(t), M(t.offset === i, `object ${n} (class ${s.classId}): ${i - t.offset} bytes unread`);
				}
				return c;
			}
		});
	}
	for (let e = t.count(1 << 20); e > 0; e--) t.i32(), t.align(), t.i64();
	let f = [];
	for (let e = t.count(65536); e > 0; e--) {
		t.cstring(), t.take(16);
		let e = t.i32();
		f.push({
			type: e,
			path: t.cstring()
		});
	}
	return M(t.count(65536) === 0, "SerializedFile reference types are not supported"), t.cstring(), M(t.offset === 48 + i, "SerializedFile metadata size mismatch"), {
		unityVersion: s,
		targetPlatform: c,
		objects: u,
		externals: f
	};
}
//#endregion
//#region src/original/unityBundle.ts
var cn = /* @__PURE__ */ function(e) {
	return e[e.GameObject = 1] = "GameObject", e[e.Transform = 4] = "Transform", e[e.Material = 21] = "Material", e[e.MeshRenderer = 23] = "MeshRenderer", e[e.Texture2D = 28] = "Texture2D", e[e.MeshFilter = 33] = "MeshFilter", e[e.Mesh = 43] = "Mesh", e[e.Shader = 48] = "Shader", e[e.AnimationClip = 74] = "AnimationClip", e[e.Animator = 95] = "Animator", e[e.MonoBehaviour = 114] = "MonoBehaviour", e[e.MonoScript = 115] = "MonoScript", e[e.SkinnedMeshRenderer = 137] = "SkinnedMeshRenderer", e[e.AssetBundle = 142] = "AssetBundle", e;
}({});
function ln(e, t) {
	if (!e) throw Error(t);
}
var un = class {
	name;
	serialized;
	streams = /* @__PURE__ */ new Map();
	pathCache = /* @__PURE__ */ new Map();
	assetBundle;
	cabName;
	constructor(e, t) {
		this.name = e;
		let n = $t(t), r = null, i = "";
		for (let t of n.nodes.values()) t.flags & 4 ? (ln(!r, `${e}: more than one SerializedFile`), r = sn(t.bytes), i = t.path) : this.streams.set(t.path, t.bytes);
		ln(r, `${e}: no SerializedFile`), this.serialized = r, this.cabName = i;
		let a = [...r.objects.values()].find((e) => e.classId === 142);
		ln(a, `${e}: no AssetBundle object`), this.assetBundle = a.read();
	}
	get objects() {
		return this.serialized.objects.values();
	}
	object(e) {
		return this.serialized.objects.get(e) ?? null;
	}
	local(e) {
		return !e || e.m_PathID === 0n || e.m_FileID !== 0 ? null : this.object(e.m_PathID);
	}
	read(e) {
		return this.local(e)?.read() ?? null;
	}
	externalCab(e) {
		let t = e > 0 ? this.serialized.externals[e - 1]?.path ?? null : null;
		return t ? t.split("/").pop() : null;
	}
	stream(e, t, n) {
		let r = e.split("/").pop(), i = this.streams.get(r);
		return ln(i, `${this.name}: stream ${e} not in bundle`), ln(t + n <= i.length, `${this.name}: stream range ${t}+${n} exceeds ${r}`), i.subarray(t, t + n);
	}
	resource(e, t) {
		let n = this.assetBundle.m_Container.filter((n) => {
			let r = this.local(n.second.asset);
			if (!r || r.classId !== 1 || r.read().m_Name.toLowerCase() !== e.toLowerCase()) return !1;
			let i = n.first.replace(/\\/g, "/"), a = /\/(fbx|sourceimages)\//i.test(i);
			return i.toLowerCase().endsWith(t.toLowerCase()) && !a;
		});
		ln(n.length === 1, `${this.name}: resource ${e} matches ${n.length} container entries ending in ${t}`);
		let r = n[0], i = this.local(r.second.asset), a = this.assetBundle.m_PreloadTable, o = Math.max(r.second.preloadIndex, 0), s = Math.min(o + Math.max(r.second.preloadSize, 0), a.length), c = [], l = /* @__PURE__ */ new Set();
		for (let e = o; e < s; e++) {
			let t = this.local(a[e]);
			t && !l.has(t.pathId) && (l.add(t.pathId), c.push(t));
		}
		return l.has(i.pathId) || c.push(i), {
			containerPath: r.first,
			root: i,
			objects: c
		};
	}
	transformPath(e) {
		let t = this.pathCache.get(e);
		if (t !== void 0) return t;
		let n = this.object(e)?.read(), r = n ? this.read(n.m_GameObject) : null, i;
		return i = !n || !r ? `transform:${e}` : this.local(n.m_Father) ? `${this.transformPath(n.m_Father.m_PathID)}/${r.m_Name}` : r.m_Name, this.pathCache.set(e, i), i;
	}
	gameObjectTransform(e) {
		for (let t of e.m_Component) {
			let e = this.local(t.component);
			if (e && e.classId === 4) return e.pathId;
		}
		return null;
	}
	script(e) {
		let t = this.read(e.m_Script);
		return t ? {
			name: t.m_ClassName || t.m_Name,
			namespace: t.m_Namespace ?? ""
		} : {
			name: `missing-script:${e.m_Script.m_PathID}`,
			namespace: ""
		};
	}
};
//#endregion
//#region src/original/originalTextures.ts
function dn(e, t) {
	if (!e) throw Error(t);
}
var fn = {
	48: 4,
	49: 5,
	50: 6,
	51: 8,
	52: 10,
	53: 12
}, pn = {
	4: e.RGBA_ASTC_4x4_Format,
	5: e.RGBA_ASTC_5x5_Format,
	6: e.RGBA_ASTC_6x6_Format,
	8: e.RGBA_ASTC_8x8_Format,
	10: e.RGBA_ASTC_10x10_Format,
	12: e.RGBA_ASTC_12x12_Format
}, mn = 7, hn = null;
async function gn(e) {
	return hn ||= (async () => {
		let t = e ?? await (await fetch("data:application/wasm;base64,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IBNBCGohEyAIQQhqIQggA0EIaiEDIA9BBGohDyABQQhqIQEgBUEBaiIFIA0oAgQgDSgCAGxIDQALDAELIA0oAgQgDSgCAGwhACANKAIQQQFMBEAgAEEATA0BQQAhDwNAIAEgAmogDSgCPCANKAJMIAIgDWpBvAFqIgAoAgAgDSgCJEECdEHgtghqKAIAEQAArSANKAJAIA0oAlAgACgCACANKAIkQQJ0QeC2CGooAgARAACtQhCGhCANKAJEIA0oAlQgACgCACANKAIkQQJ0QeC2CGooAgARAACtQiCGhCANKAJIIA0oAlggACgCACANKAIkQQJ0QaC3CGooAgARAACtQjCGhDcDACACQQhqIQIgD0EBaiIPIA0oAgQgDSgCAGxIDQALDAELIABBAEwNACANQTxqIQUgDUEkaiECQbwKIRMDQCABIANqIAUgDSATaigCACIAQQV0aiIHKAIAIAcoAhAgAyANakG8AWoiBigCACACIABBAnRqIgAoAgBBAnRB4LYIaigCABEAAK0gBygCBCAHKAIUIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIQhoQgBygCCCAHKAIYIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIghoQgBygCDCAHKAIcIAYoAgAgACgCAEECdEGgtwhqKAIAEQAArUIwhoQ3AwAgE0EEaiETIANBCGohAyAIQQFqIgggDSgCBCANKAIAbEgNAAsLIAlBEGokAAwBCyAdQQBMDQBBACEBICdFBEAgBCEAA0AgAEL//4OAcDcDACAAQThqQv//g4BwNwMAIABBMGpC//+DgHA3AwAgAEEoakL//4OAcDcDACAAQSBqQv//g4BwNwMAIABBGGpC//+DgHA3AwAgAEEQakL//4OAcDcDACAAQQhqQv//g4BwNwMAIABBQGshACAmIAFBCGoiAUcNAAsLIB5FDQAgBCABQQN0aiEAIB4hAQNAIABC//+DgHA3AwAgAEEIaiEAIAFBAWsiAQ0ACwsCQCAbQQBMIgANACAADQBBACEGIAQhAyAjIQIDQCAiIQAgAyEBIAIhCCAbIQUgBiAvaiArTg0BA0AgACAqSARAIAggASkDADcDACAAQQFqIQAgAUEIaiEBIAhBCGohCCAFQQFrIgUNAQsLIAMgJWohAyACIC1qIQIgBkEBaiIGIBtHDQALCyAbICJqISIgIyAlaiEjIA5BEGohDiAoQQFqIiggJEcNAAsgICAuaiEgICFBAWoiISAsRw0AC0HgwAgtAABBf3NBAXELIARBgBhqJAALC4o2WQBBhIAICwUBAAAAAgBBlIAICzUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgBB1IAICyUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGEgQgLBQEAAAACAEGUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAEAAAACAEGUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUhAgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUhAgLJQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQYSFCAsFAQAAAAIAQZSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAQAAAAIAQZSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQZSHCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSHCAspAQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAQZCICAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyICAshAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAEGQiQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMiQgLLQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQBBkIoICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzIoICy0BAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAQZCLCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyLCAstAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAEGQjAgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjAgLIQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQBB/IwICwEBAEGQjQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjQgLMQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAQZCOCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyOCAsxAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAAAAAQBBkI8ICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzI8ICzEBAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAAAABAEGMkAgLAQIAQZyQCAsBAgBBrJAIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JAICwECAEGMkQgLAQIAQZyRCAsBAgBBrJEIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JEICwECAEGMkggLAQIAQZySCAsBAgBBrJIIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JIICwECAEGMkwgLAQIAQZyTCAsBAgBBrJMIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAQYyUCAsBAgBBnJQICwECAEGslAgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBBjJUICwECAEGclQgLAQIAQayVCAtRAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAEGMlggLAQIAQZyWCAsBAgBBrJYIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAQYyXCAsBAgBBnJcICwECAEGslwgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgBB8JgIC40CAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAQfCbCAsNAgAAAAIAAAACAAAAAgBB8JwIC40DAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgBB8KAICw0CAAAAAgAAAAIAAAACAEHwoQgLDQIAAAACAAAAAgAAAAIAQfCiCAupBgIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAEAAAAEAAAABAAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAgAAAAQAAAAEAAAAAAAAAAEAAAACAAAAAwAAAAQAAAADAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAAAAAAEAEGkqQgL7QEBAAAAAgAAAAMAAAAEAAAAAQAAAAQAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAABAAAAAIAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAEAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAAAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAAAABAAAAAgAAAAMAAAAAAAAAAQAAAAIAAAADAAAABAAAAAIAAAACAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAwAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAQZyrCAthAQAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAQAAAAAAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAAAAAAAAEAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAAAAAAAQBBlKwIC2kEAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAQAQZStCAtpBAAAAAAAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAAEAEGUrggLAQQAQaCuCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGUrwgLAQQAQaCvCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGcsAgLAQQAQbiwCAsFAQAAAAQAQdiwCAsFAgAAAAQAQfiwCAuFAwMAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAABAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAAEAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAAAwAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAQAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMA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")).arrayBuffer(), { instance: n } = await WebAssembly.instantiate(t, {}), r = n.exports;
		return { decode16(e, t, n, i) {
			let a = r.__heap_base.value, o = Math.ceil(a / 16) * 16, s = Math.ceil((o + e.length) / 16) * 16, c = s + t * n * 8;
			return c > r.memory.buffer.byteLength && r.memory.grow(Math.ceil((c - r.memory.buffer.byteLength) / 65536)), new Uint8Array(r.memory.buffer).set(e, o), dn(r.decode_rgba16(o, t, n, i, s) === 1, "ASTC decode failed (invalid or HDR block)"), new Uint16Array(r.memory.buffer, s, t * n * 4).slice();
		} };
	})(), hn;
}
function _n(e, t) {
	let n = e.object(t);
	dn(n && n.classId === cn.Texture2D, `${e.name}: ${t} is not a Texture2D`);
	let r = n.read();
	dn(r.m_MipCount === 1, `${r.m_Name}: ${r.m_MipCount} mip levels (only single-level textures are expected)`);
	let i = r.m_StreamData.path ? e.stream(r.m_StreamData.path, Number(r.m_StreamData.offset), r.m_StreamData.size) : r["image data"];
	return dn(fn[r.m_TextureFormat] || r.m_TextureFormat === mn, `${r.m_Name}: texture format ${r.m_TextureFormat} is not supported`), {
		name: r.m_Name,
		width: r.m_Width,
		height: r.m_Height,
		format: r.m_TextureFormat,
		data: i.slice()
	};
}
function vn(e) {
	if (e === 65535) return 15360;
	if (e < 4) return e << 8;
	let t = Math.clz32(e) - 16;
	return (e * 2 ** (t + 1) & 65535) >> 6 | 14 - t << 10;
}
async function yn(t, n) {
	let { width: r, height: i, data: a } = t, o = fn[t.format], s;
	if (o) if (n.nativeAstc) s = new e.CompressedTexture([{
		data: a,
		width: r,
		height: i
	}], r, i, pn[o]);
	else {
		let t = (await gn()).decode16(a, r, i, o);
		for (let e = 0; e < t.length; e++) t[e] = vn(t[e]);
		s = new e.DataTexture(t, r, i, e.RGBAFormat, e.HalfFloatType);
	}
	else {
		dn(a.length === r * i * 2, `${t.name}: RGB565 size mismatch`);
		let n = new Uint16Array(a.buffer, a.byteOffset, r * i), o = new Uint16Array(n.length * 4);
		for (let t = 0; t < n.length; t++) {
			let r = n[t];
			o[t * 4] = e.DataUtils.toHalfFloat((r >> 11 & 31) / 31), o[t * 4 + 1] = e.DataUtils.toHalfFloat((r >> 5 & 63) / 63), o[t * 4 + 2] = e.DataUtils.toHalfFloat((r & 31) / 31), o[t * 4 + 3] = e.DataUtils.toHalfFloat(1);
		}
		s = new e.DataTexture(o, r, i, e.RGBAFormat, e.HalfFloatType);
	}
	return s.name = t.name, s.flipY = !1, s.generateMipmaps = !1, s.colorSpace = e.NoColorSpace, s.needsUpdate = !0, s;
}
var bn = class {
	caps;
	payloads = /* @__PURE__ */ new Map();
	textures = /* @__PURE__ */ new Map();
	constructor(e) {
		this.caps = e;
	}
	register(e) {
		for (let [t, n] of Object.entries(e)) this.payloads.has(t) || this.payloads.set(t, n);
	}
	has(e) {
		return this.payloads.has(e);
	}
	loadAsync(e) {
		let t = this.textures.get(e);
		if (!t) {
			let n = this.payloads.get(e);
			dn(n, `original texture ${e} was not delivered with its part`), t = yn(n, this.caps), this.textures.set(e, t);
		}
		return t;
	}
	dispose() {
		for (let e of this.textures.values()) e.then((e) => e.dispose());
		this.textures.clear(), this.payloads.clear();
	}
}, xn = null;
function Sn(e) {
	return xn ??= new bn(e ?? { nativeAstc: !1 }), xn;
}
function Cn(e) {
	return { nativeAstc: e.extensions.has("WEBGL_compressed_texture_astc") };
}
//#endregion
//#region src/original/originalPartProvider.ts
var wn = class {
	baseUrl;
	worker = null;
	nextId = 1;
	pending = /* @__PURE__ */ new Map();
	built = /* @__PURE__ */ new Map();
	clipBundles = /* @__PURE__ */ new Map();
	constructor(e) {
		this.baseUrl = e;
	}
	build(e, t) {
		let n = t.bundleName ?? e.bundlePath;
		if (!n) return Promise.reject(/* @__PURE__ */ Error(`registry entry ${e.costume3dId} has no bundle`));
		let r = t.partType ?? e.partType, i = `${r}|${n}|${e.colorVariationBundlePath ?? ""}|${e.costume3dId}|${e.unit ?? ""}|${e.characterId}`, a = this.built.get(i);
		return a || (a = this.request({
			baseUrl: new URL(this.baseUrl, globalThis.location?.href).toString(),
			brotliWasmUrl: new URL(Bt, globalThis.location?.href).toString(),
			entry: e,
			partType: r,
			bundleName: n,
			colorBundleName: e.colorVariationBundlePath ?? null,
			characterHeightMeters: t.characterHeightMeters,
			attachNode: e.attachNode ?? null
		}), this.built.set(i, a), a.catch(() => this.built.delete(i))), a;
	}
	clips(e) {
		let t = e.filter((e) => !this.clipBundles.has(e));
		if (t.length) {
			let e = this.post({
				kind: "clips",
				baseUrl: new URL(this.baseUrl, globalThis.location?.href).toString(),
				brotliWasmUrl: new URL(Bt, globalThis.location?.href).toString(),
				bundleNames: t
			}).then((e) => {
				if (e.error) throw Error(`original motion ${t.join(", ")}: ${e.error}`);
				return e.clips;
			});
			for (let n of t) {
				let t = e.then((e) => e[n] ?? null);
				this.clipBundles.set(n, t), t.catch(() => this.clipBundles.delete(n));
			}
		}
		return Promise.all(e.map(async (e) => [e, await this.clipBundles.get(e)])).then((e) => Object.fromEntries(e));
	}
	async post(e) {
		if (typeof Worker > "u") {
			let t = await import("./originalPartWorker-BAqn-_Lw.js");
			return "kind" in e ? {
				id: 0,
				...await t.loadOriginalClipsRequest(e)
			} : {
				id: 0,
				...await t.buildOriginalPartRequest(e)
			};
		}
		this.worker ??= this.createWorker();
		let t = this.nextId++;
		return new Promise((n, r) => {
			this.pending.set(t, {
				resolve: n,
				reject: r
			}), this.worker.postMessage({
				id: t,
				...e
			});
		});
	}
	async request(e) {
		let t = await this.post(e);
		if (t.error) throw Error(`original part ${e.bundleName}: ${t.error}`);
		return Sn().register(t.textures ?? {}), t.runtime;
	}
	createWorker() {
		let e = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/originalPartWorker-DvUowgFh.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" });
		return e.onmessage = (e) => {
			let t = this.pending.get(e.data.id);
			t && (this.pending.delete(e.data.id), t.resolve(e.data));
		}, e.onerror = (e) => {
			for (let t of this.pending.values()) t.reject(/* @__PURE__ */ Error(`original part worker: ${e.message}`));
			this.pending.clear();
		}, e;
	}
	dispose() {
		this.worker?.terminate(), this.worker = null, this.built.clear(), this.clipBundles.clear();
	}
}, N = /* @__PURE__ */ new Map(), Tn = 16, En = /* @__PURE__ */ new Map();
async function Dn(e, t) {
	let n = /* @__PURE__ */ new Map(), r = await An(e, t), i = new Rt({
		resolveUrl: (t) => P(e, t),
		loadPartRuntime: async (t) => In(r, t, e),
		ensureCompatibility: async (t) => Bn(r, t.unit, e)
	}), a = i.loadPartPackageSet(r, { composeDefault: !t.deferDefaultSelection });
	if (!a && !t.deferDefaultSelection) throw Error(`Part registry package did not expose a default custom selection from ${e}.`);
	return {
		kind: "part-registry",
		combinedCharacter: a,
		displayNameByUrl: n,
		partSet: r,
		wardrobe: i
	};
}
async function On(e, t, n) {
	let r = f(t, n), i = e.roles.some((e) => f(e.characterId, e.unit) === r), a = e.registry.some((e) => f(e.characterId, e.unit) === r);
	if (i && a) return;
	let o = `parts/by-role/${t}/${Gn(n)}`, s = await F(P(e.baseUrl, `${o}/runtime-role-catalog.msgpack.br`)), c = Hn(s, t, n);
	if (e.masterVersion && e.masterVersion !== s.masterVersion) throw Error(`Cross-role registry version mismatch: ${e.masterVersion} != ${s.masterVersion}.`);
	let l = Yn(await F(kn(P(e.baseUrl, `${o}/part-registry.msgpack.br`), s.masterVersion)));
	i || e.roles.push(...c), a || e.registry.push(...l);
}
function P(e, t) {
	let n = new URL(e, window.location.href);
	n.pathname.endsWith("/") || (n.pathname = `${n.pathname}/`);
	let r = t.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter((e) => e.length > 0);
	if (r.length === 0 || r.some((e) => e === "." || e === "..")) throw Error(`Invalid runtime package relative path: ${t}`);
	let i = r.map((e) => encodeURIComponent(e)).join("/");
	return new URL(i, n).toString();
}
function kn(e, t) {
	if (!t) return e;
	let n = new URL(e, window.location.href);
	return n.searchParams.set("masterVersion", t), n.toString();
}
async function An(e, t) {
	let n = Vn(t.roleId), r = `parts/by-role/${n.characterId}/${Gn(n.unit)}`, i = await F(P(e, `${r}/runtime-role-catalog.msgpack.br`)), a = Hn(i, n.characterId, n.unit), o = Yn(await F(kn(P(e, `${r}/part-registry.msgpack.br`), i.masterVersion))), s = /* @__PURE__ */ new Map();
	if (t.deferDefaultSelection) return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	};
	let { candidates: c, preferredCount: l } = Xn(o, a, null);
	for (let t = 0; t < Math.min(c.length, 720);) {
		let n = t === 0 && l > 0 ? l : 24, r = c.slice(t, t + n);
		t += n;
		let i = await Promise.all(r.map(async (t) => ({
			entry: t,
			runtime: await zn(e, t, a)
		})));
		for (let e of i) s.set(e.entry.packagePath, Kn(e.runtime, e.entry));
		if ($n(o, a, null, s, e)) break;
	}
	if (!$n(o, a, null, s, e)) throw Error(`Part registry package did not expose a compatible loaded body/head/hair selection from ${e}.`);
	let u = p({
		registry: o,
		roles: a,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	}), d = u ? /* @__PURE__ */ new Set([f(u.characterId, u.unit)]) : null, m = await Pn(e, a, i.masterVersion, d);
	return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: m,
		baseUrl: e
	};
}
async function jn(e, t, n) {
	let r = f(t, n), i = e.roleRuntimes.get(r);
	if (i) return i;
	let a = e.roles.find((e) => e.roleRuntimePath && e.characterId === t && f(e.characterId, e.unit ?? null) === r);
	if (!a?.roleRuntimePath) throw Error(`Runtime role catalog has no package for ${r}.`);
	let o = await F(kn(P(e.baseUrl, a.roleRuntimePath), e.masterVersion)), s = Fn(e.baseUrl, a.roleRuntimePath, o, e.masterVersion), c = s.role?.characterId, l = s.role?.unit ?? null;
	if (c !== t || f(c, l) !== r) throw Error(`Runtime role package identity differs from requested role ${r}.`);
	return e.roleRuntimes.set(f(c, l), s), s;
}
var Mn = /* @__PURE__ */ new Map();
function Nn(e, t, n) {
	let r = f(t, n), i = e.roleRuntimes.get(r);
	if (i) return Promise.resolve(i);
	let a = `roles/${t}/${Gn(n)}/role-runtime.msgpack.br`, o = `${e.baseUrl}\u0000${e.masterVersion}\u0000${r}`, s = Mn.get(o);
	return s || (s = F(kn(P(e.baseUrl, a), e.masterVersion)).then((n) => {
		let i = Fn(e.baseUrl, a, n, e.masterVersion);
		if (i.role?.characterId !== t || f(t, i.role?.unit ?? null) !== r) throw Error(`Runtime role package identity differs from requested motion role ${r}.`);
		return i;
	}), Mn.set(o, s), s.catch(() => Mn.delete(o))), s;
}
async function Pn(e, t, n, r = null) {
	let i = /* @__PURE__ */ new Map(), a = t.filter((e) => e.roleRuntimePath && (!r || r.has(f(e.characterId, e.unit ?? null)))), o = await Promise.all(a.map(async (t) => ({
		entry: t,
		runtime: await F(kn(P(e, t.roleRuntimePath), n))
	})));
	for (let t of o) {
		let r = t.runtime.role?.characterId ?? t.entry.characterId, a = t.runtime.role?.unit ?? t.entry.unit ?? null, o = Fn(e, t.entry.roleRuntimePath, t.runtime, n);
		i.set(f(r, a), o);
	}
	return i;
}
function Fn(e, t, n, r) {
	if (!n.motionPackage?.originalMotionBundle) throw Error(`Role runtime ${n.role?.characterId}:${n.role?.unit ?? "default"} has no original motion bundle.`);
	return n;
}
async function In(e, t, n = e.baseUrl) {
	let r = e.packages.get(t.packagePath);
	if (r) return r;
	let i = Kn(await zn(n, t, e.roles), t);
	return e.packages.set(t.packagePath, i), i;
}
var Ln = /* @__PURE__ */ new Map();
function Rn(e) {
	let t = Ln.get(e);
	return t || (t = new wn(e.endsWith("/") ? e : `${e}/`), Ln.set(e, t)), t;
}
async function zn(e, t, n = []) {
	if (!t.packagePath.startsWith("original/")) throw Error(`Part ${t.packagePath} is not in the original-bundle store.`);
	let r = n.find((e) => e.characterId === t.characterId)?.characterHeightMeters ?? 1;
	return Rn(e).build(t, { characterHeightMeters: r });
}
async function Bn(e, t, n = e.baseUrl) {
	e.compatibility ||= await F(kn(P(n, `parts/compat/by-unit/${Gn(t)}/head-hair-compatibility.msgpack.br`), e.masterVersion));
}
function Vn(e) {
	if (!e) throw Error("Runtime role id is required.");
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid runtime role id: ${e}`);
	return {
		characterId: r,
		unit: n.join(":") || null
	};
}
function Hn(e, t, n) {
	let r = (e?.version === 2 || e?.version === 3 || e?.version === 4) && typeof e.masterVersion == "string" && e.masterVersion.length > 0 && Array.isArray(e.roles) ? e.roles : [];
	if (r.length !== 1) throw Error(`Runtime role catalog must contain exactly one scoped role for ${f(t, n)}.`);
	let i = r[0], a = Wn(i.roleId), o = a ? `roles/${a.characterId}/${Gn(a.unit)}/role-runtime.msgpack.br` : "";
	if (!a || i.characterId !== t || f(i.characterId, i.unit) !== f(t, n) || i.characterId !== a.characterId || f(i.characterId, i.unit) !== f(a.characterId, a.unit) || !Number.isInteger(i.roleId) || i.roleId < 1 || i.roleId > 31 || !Number.isInteger(i.bodyCostume3dId) || i.bodyCostume3dId <= 0 || !Number.isInteger(i.headCostume3dId) || i.headCostume3dId <= 0 || !Number.isInteger(i.hairCostume3dId) || i.hairCostume3dId <= 0 || e.version >= 3 && !Un(i.skinColors) || e.version >= 4 && (typeof i.characterHeightMeters != "number" || !Number.isFinite(i.characterHeightMeters) || i.characterHeightMeters <= 0) || i.roleRuntimePath !== o) throw Error(`Runtime role catalog is invalid for ${f(t, n)}.`);
	return r;
}
function Un(e) {
	let t = (e) => typeof e == "string" && /^#[0-9a-f]{6}$/i.test(e);
	return !!(e && t(e.default) && t(e.shadow1) && t(e.shadow2));
}
function Wn(e) {
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
function Gn(e) {
	return e || "default";
}
function Kn(e, t) {
	return {
		...e,
		packagePath: t.packagePath,
		mount: {
			...e.mount ?? {},
			packagePath: t.packagePath
		}
	};
}
async function F(e) {
	if (!/\.msgpack\.br(?:[?#]|$)/i.test(e)) throw Error(`Runtime metadata must use .msgpack.br: ${e}`);
	let t = En.get(e);
	if (t) return t;
	let n = (async () => {
		let t = await fetch(e);
		if (!t.ok) throw Error(`Failed to load ${e}: HTTP ${t.status}`);
		return qn(t, e);
	})();
	En.set(e, n);
	try {
		return await n;
	} finally {
		En.get(e) === n && En.delete(e);
	}
}
async function qn(e, t) {
	try {
		let n = e.headers.get("x-haruki-file-version"), r = n && Jn(t) ? N.get(t) : null;
		if (r?.version === n) return N.delete(t), N.set(t, r), await e.body?.cancel(), r.value;
		let i = await Wt(await e.arrayBuffer());
		if (n && Jn(t)) for (N.delete(t), N.set(t, {
			version: n,
			value: i
		}); N.size > Tn;) N.delete(N.keys().next().value);
		return i;
	} catch (e) {
		throw e instanceof Error ? e : /* @__PURE__ */ Error(`Failed to decode ${t}: ${String(e)}`);
	}
}
function Jn(e) {
	let t = e.split(/[?#]/, 1)[0] ?? e;
	return /\/parts\/by-role\/[^/]+\/[^/]+\/(?:part-registry|runtime-role-catalog)\.msgpack\.br$/.test(t) || /\/parts\/compat\/by-unit\/[^/]+\/head-hair-compatibility\.msgpack\.br$/.test(t) || /\/roles\/[^/]+\/[^/]+\/(?:role-runtime|motion\/unity-motion)\.msgpack\.br$/.test(t);
}
function Yn(e) {
	let t = Array.isArray(e) ? e : e.entries ?? e.parts ?? [];
	if (t.length === 0) throw Error("Runtime part registry is empty.");
	let n = /* @__PURE__ */ new Set();
	for (let [e, r] of t.entries()) {
		let t = c(r), i = [
			r.characterId,
			r.unit ?? "default",
			t,
			r.costume3dId,
			r.packagePath
		].join("\n");
		if (!Number.isInteger(r.characterId) || r.characterId <= 0 || !Number.isInteger(r.costume3dId) || r.costume3dId < 0 || typeof r.packagePath != "string" || r.packagePath.length === 0 || r.packagePath.startsWith("/") || r.packagePath.includes("\\") || r.packagePath.split("/").some((e) => e.length === 0 || e === "." || e === "..") || r.status !== void 0 && ![
			"ready",
			"empty",
			"missing"
		].includes(r.status) || !n.add(i)) throw Error(`Runtime part registry entry ${e} is invalid or duplicated.`);
	}
	return t;
}
function Xn(e, t, n) {
	let r = t.find((e) => typeof e.characterId == "number")?.characterId ?? e.find(Qn)?.characterId ?? null, i = [], a = 0, o = /* @__PURE__ */ new Set(), s = (e) => {
		if (!e || !Qn(e)) return;
		let t = e.packagePath;
		o.has(t) || (o.add(t), i.push(e));
	}, c = (t, n, r, i) => e.find((e) => e.characterId === t && e.costume3dId === r && l(e) === n && (i === void 0 || e.unit === i) && Zn(e)), u = pe(n);
	if (r !== null) {
		for (let e of t) e.characterId === r && (typeof e.bodyCostume3dId == "number" && s(c(e.characterId, "body", e.bodyCostume3dId, e.unit)), typeof e.headCostume3dId == "number" && (s(c(e.characterId, "head", e.headCostume3dId, e.unit)), s(c(e.characterId, "head_optional", e.headCostume3dId, e.unit))), typeof e.hairCostume3dId == "number" && s(c(e.characterId, "hair", e.hairCostume3dId, e.unit)));
		a = i.length, s(e.filter((e) => e.characterId === r && l(e) === "body" && Zn(e)).sort((e, t) => e.costume3dId - t.costume3dId)[0]);
		let n = e.filter((e) => e.characterId === r && ["head", "head_optional"].includes(l(e) ?? "") && Zn(e)).sort((e, t) => e.costume3dId - t.costume3dId), o = e.filter((e) => e.characterId === r && l(e) === "hair" && Zn(e)).sort((e, t) => e.costume3dId - t.costume3dId);
		for (let e of n) for (let t of o) l(e) !== "head" && u.has(me(e.unit ?? t.unit, e.costume3dId, t.costume3dId)) || (s(e), s(t));
	}
	let d = /* @__PURE__ */ new Set();
	for (let e of t) if (!(r !== null && e.characterId !== r)) for (let t of [
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.hairCostume3dId
	]) typeof t == "number" && d.add(t);
	let f = e.filter(Qn).filter((e) => !o.has(e.packagePath)).map((e, t) => ({
		entry: e,
		index: t,
		score: (r !== null && e.characterId === r ? 0 : 1e6) + (d.has(e.costume3dId) ? 0 : 1e4) + er(e) + Math.min(e.costume3dId, 9999)
	})).sort((e, t) => e.score - t.score || e.index - t.index);
	return {
		candidates: [...i, ...f.map((e) => e.entry)],
		preferredCount: a
	};
}
function Zn(e) {
	return e.status !== "missing";
}
function Qn(e) {
	return Zn(e) && e.status !== "empty";
}
function $n(e, t, n, r, i) {
	let a = new Set(e.filter((e) => r.has(e.packagePath)).map((e) => l(e)).filter(Boolean));
	return !a.has("body") || !a.has("head") && !a.has("head_optional") || !a.has("hair") ? !1 : !!p({
		registry: e,
		roles: t,
		compatibility: n,
		packages: r,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: i
	});
}
function er(e) {
	switch (l(e)) {
		case "body": return 0;
		case "head": return 100;
		case "hair": return 200;
		case "head_optional": return 300;
		default: return 1e3;
	}
}
//#endregion
//#region src/engine/unityCoordinateConversion.ts
var tr = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function I(t, n) {
	if (!t) return n.clone();
	let r = hr(t.x ?? t.X), i = hr(t.y ?? t.Y), a = hr(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function nr(t) {
	if (!t) return new e.Quaternion();
	let n = hr(t.x ?? t.X), r = hr(t.y ?? t.Y), i = hr(t.z ?? t.Z), a = hr(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : rr(new e.Quaternion(n, r, i, a));
}
function rr(e) {
	let t = Math.fround, n = t(e.x), r = t(e.y), i = t(e.z), a = t(e.w), o = t(n * n), s = t(r * r), c = t(i * i), l = t(a * a), u = t(t(o + s) + t(c + l)), d = t(t(s + c) + t(l + o)), f = t(Math.sqrt(u)), p = t(Math.sqrt(d));
	return e.set(u > t(1e-30) ? t(n / f) : 0, d > t(1e-30) ? t(r / p) : 0, u > t(1e-30) ? t(i / f) : 0, d > t(1e-30) ? t(a / p) : 1);
}
function ir(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function ar(e) {
	return ir(e);
}
function or(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w);
}
function sr(e) {
	return ar(tr[e]);
}
function L(e, t) {
	let n = Math.fround;
	t.identity();
	for (let r = e; r; r = r.parent) {
		let e = n(r.quaternion.x), i = n(r.quaternion.y), a = n(r.quaternion.z), o = n(r.quaternion.w), s = r.scale.x < 0 ? -1 : 1, c = r.scale.y < 0 ? -1 : 1, l = r.scale.z < 0 ? -1 : 1, u = t.x * c * l, d = t.y * s * l, f = t.z * s * c, p = t.w;
		t.set(n(n(n(n(i * f) - n(a * d)) + n(o * u)) + n(e * p)), n(n(n(n(a * u) - n(e * f)) + n(o * d)) + n(i * p)), n(n(n(n(o * f) - n(i * u)) + n(a * p)) + n(e * d)), n(n(n(n(o * p) - n(e * u)) - n(a * f)) - n(i * d)));
	}
	return t;
}
var cr = new e.Quaternion();
function R(e, t) {
	let n = Math.fround;
	t.set(n(e.position.x), n(e.position.y), n(e.position.z));
	for (let r = e.parent; r; r = r.parent) t.set(n(t.x * n(r.scale.x)), n(t.y * n(r.scale.y)), n(t.z * n(r.scale.z))), dr(t, r.quaternion), t.set(n(t.x + n(r.position.x)), n(t.y + n(r.position.y)), n(t.z + n(r.position.z)));
	return t;
}
function lr(e, t) {
	let n = [];
	for (let t = e; t; t = t.parent) n.push(t);
	let r = Math.fround;
	t.set(r(t.x), r(t.y), r(t.z));
	for (let e = n.length - 1; e >= 0; e--) {
		let i = n[e];
		t.set(r(t.x - r(i.position.x)), r(t.y - r(i.position.y)), r(t.z - r(i.position.z))), dr(t, i.quaternion, !0), t.set(r(t.x * ur(i.scale.x)), r(t.y * ur(i.scale.y)), r(t.z * ur(i.scale.z)));
	}
	return t;
}
function ur(e) {
	let t = Math.fround, n = t(e), r = Math.abs(n);
	if (r < t(1e-9)) return 0;
	if (!Number.isFinite(n)) return 1 / n;
	let i = 2 ** Math.floor(Math.log2(r)), a = Math.floor((r / i - 1) * 2048), o = t(Math.sign(n) * Math.round(8192 / (1 + (a + .5) / 2048)) / 8192 / i), s = t(o * t(2.000000476837158 - t(o * n)));
	return s = t(s * t(2 - t(s * n))), Number.isNaN(s) ? o : s;
}
function dr(e, t, n = !1) {
	let r = Math.fround, i = e.x, a = e.y, o = e.z, s = n ? -1 : 1, c = s * r(t.x), l = s * r(t.y), u = s * r(t.z), d = r(t.w), f = r(r(-2 * l * l) - r(2 * u * u)), p = r(r(-2 * u * d) - r(-2 * c * l)), m = r(r(2 * c * u) - r(-2 * l * d)), h = r(r(2 * l * c) - r(-2 * u * d)), g = r(r(-2 * u * u) - r(2 * c * c)), _ = r(r(-2 * c * d) - r(-2 * l * u)), v = r(r(-2 * l * d) - r(-2 * u * c)), y = r(r(2 * u * l) - r(-2 * c * d)), b = r(r(-2 * c * c) - r(2 * l * l));
	e.set(r(r(r(f * i) + i) + r(r(p * a) + r(m * o))), r(r(r(h * i) + a) + r(r(g * a) + r(_ * o))), r(r(r(v * i) + o) + r(r(y * a) + r(b * o))));
}
function fr(e, t) {
	return t.copy(pr(t, L(e, cr)));
}
function pr(t, n) {
	let r = Math.fround, i = r(n.x * 2), a = r(n.y * 2), o = r(n.z * 2), s = r(n.x * i), c = r(n.y * a), l = r(n.z * o), u = r(n.x * a), d = r(n.x * o), f = r(n.y * o), p = r(n.w * i), m = r(n.w * a), h = r(n.w * o);
	return new e.Vector3(r((1 - (c + l)) * t.x + (u - h) * t.y + (d + m) * t.z), r((u + h) * t.x + (1 - (s + l)) * t.y + (f - p) * t.z), r((d - m) * t.x + (f + p) * t.y + (1 - (s + c)) * t.z));
}
function mr(t, n, r) {
	let i = Math.fround, a = i(e.MathUtils.clamp(r, 0, 1)), o = i(t.x), s = i(t.y), c = i(t.z), l = i(t.w), u = i(n.x), d = i(n.y), f = i(n.z), p = i(n.w);
	i(i(i(i(o * u) + i(s * d)) + i(c * f)) + i(l * p)) < 0 && (u = -u, d = -d, f = -f, p = -p);
	let m = i(o + i(i(u - o) * a)), h = i(s + i(i(d - s) * a)), g = i(c + i(i(f - c) * a)), _ = i(l + i(i(p - l) * a)), v = i(Math.sqrt(i(i(i(i(m * m) + i(h * h)) + i(g * g)) + i(_ * _))));
	return v > 0 ? new e.Quaternion(i(m / v), i(h / v), i(g / v), i(_ / v)) : new e.Quaternion();
}
function hr(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/utjSpringBoneRuntime.ts
var gr = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), z = 1e-5, _r = .001, vr = new e.Vector3(1, 0, 0);
function yr(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function br(e) {
	let t = Hr(e.parentRotation.clone().multiply(e.initialLocalRotation)), n = pr(e.boneAxis, t);
	return B(n.multiplyScalar(Math.fround(e.springLength))), B(e.headPosition.clone().add(n));
}
function xr(e, t) {
	let n = Math.fround;
	B(e.currTipPos), B(e.prevTipPos);
	let r = e.currTipPos.clone(), i = B(B(br(t).sub(e.currTipPos)).multiplyScalar(n(t.stiffnessForce))), a = B(B(B(t.springForce.clone().add(t.externalForce)).add(i)).multiplyScalar(n(.5 * n(t.deltaTime) * n(t.deltaTime)))), o = B(B(e.currTipPos.clone().sub(e.prevTipPos)).multiplyScalar(n(1 - n(t.dragForce))));
	B(e.currTipPos.add(B(a.add(o)))), e.prevTipPos.copy(r);
	let s = B(t.headPosition.clone()), c = B(e.currTipPos.clone().sub(s));
	Math.fround(c.length()) <= _r && c.copy(t.lengthFallbackDirection ?? t.boneAxis), Ur(c), B(c.multiplyScalar(n(t.springLength))), e.currTipPos.copy(B(c.add(s)));
}
function Sr(e, t) {
	let n = B(t.clone());
	B(e.cachedMovement.copy(n).sub(e.cachedPosition)), e.cachedPosition.copy(n);
}
function Cr(t, n, r, i, a, o = vr) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= _r) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function wr(t) {
	if (t.targets.length === 0) return;
	let n = t.springConstant * t.deltaTime * t.deltaTime, r = new e.Vector3();
	for (let e of t.targets) {
		let i = t.currTipPos.clone().sub(e.position), a = i.length();
		if (a <= z) continue;
		let o = a - e.initialLength;
		r.addScaledVector(i, -(n * o) / a);
	}
	t.currTipPos.add(r);
}
function Tr(e, t) {
	let n = 0, r = null, i = e.currTipPos.clone();
	for (let i of Jr(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = Or(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: Er(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && zr(e, r, t.bounce, t.friction, i), n;
}
function Er(e, t, n, r, i) {
	return e.kind === "sphere" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i,
		localSphereOrigin: e.localOffset.clone(),
		localSphereRadius: Math.abs(e.lossyScaleX) * e.radius
	} : e.kind === "capsuleLocal" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i,
		localCapsuleStart: e.localStart.clone(),
		localCapsuleEnd: e.localEnd.clone(),
		capsuleRadius: e.radius
	} : e.kind === "panel" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i,
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
function Dr(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, Ar(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, Cr(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function Or(e, t, n, r, i) {
	return e.kind === "sphere" ? Mr(t, n, r, e) : e.kind === "capsule" ? Nr(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? kr(t, n, r, i, e) : Pr(t, n, r, e);
}
function kr(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r;
	if (o.z >= s) return V(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return V(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i, f = 0, p = o.clone();
	if (o.z > 0 || u.z > 0) if (Math.abs(o.y) <= l && Math.abs(o.x) <= c) {
		if (f = Ar(u, d, p, s, 2), f === 0) return V(n);
	} else if (Math.abs(o.y) > l) {
		let t = o.y >= 0 ? l : -l, n = new e.Vector3(0, o.y - t, o.z);
		n.lengthSq() <= z * z ? n.set(0, 0, 0) : n.normalize(), p.set(o.x + n.x * s, t + n.y * s, n.z * s), f = 2;
	} else {
		let t = o.x >= 0 ? c : -c, n = new e.Vector3(o.x - t, 0, o.z);
		n.lengthSq() <= z * z ? n.set(0, 0, 0) : n.normalize(), p.set(t + n.x * s, o.y + n.y * s, n.z * s), f = 2;
	}
	else Math.abs(u.y) <= l ? Math.abs(u.x) <= c ? (f = 1, p.set(u.x, u.y, s)) : (f = 2, p.set(o.x < 0 ? -c : c, o.y, o.z)) : (f = 2, p.set(o.x, o.y >= 0 ? l : -l, o.z));
	return {
		status: f,
		tailPosition: p.applyMatrix4(a.localToWorldMatrix),
		hitNormal: Zr(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function Ar(e, t, n, r, i) {
	if (H(n, i) >= r) return 0;
	let a = H(e, i);
	if (a + t <= r) return n.copy(e), Qr(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = H(n, o) - H(e, o), l = H(n, s) - H(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		Qr(n, o, H(e, o) + c * f), Qr(n, s, H(e, s) + l * f), Qr(n, i, r);
	} else n.copy(e);
	return 2;
}
function jr(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return V(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : Xr(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= z * z ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = Lr(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: Xr(n.clone().sub(i), l)
	} : V(n);
	let d = Rr(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: Xr(d.clone().sub(i), l)
	};
}
function Mr(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n, s = Math.abs(r.lossyScaleX) * r.radius, c = jr(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? V(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: Zr(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function Nr(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= z * z) return jr(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return V(n);
	if (l <= z) return jr(t, n, r, i, o);
	if (l >= 1 - z) return jr(t, n, r, a, o);
	let p = Xr(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function Pr(e, t, n, r) {
	let i = Fr(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n, r.localStart, r.localEnd, r.radius, r.lossyScaleX);
	if (i.status === 0) return V(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = Zr(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function Fr(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return V(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? jr(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : Ir(t, n, r, o, s);
}
function Ir(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return V(n);
	let c = Math.sqrt(s), l = c > z ? n.x / c : 0, u = c > z ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function Lr(e, t, n, r) {
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
function Rr(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= z || e.radius <= z ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function zr(e, t, n, r, i = e.currTipPos) {
	let a = Xr(t, vr), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function Br(e) {
	if (!e.limit.active) return !1;
	let t = Math.fround, n = e.vector, r = B(e.basisUp.clone()), i = B(e.basisSide.clone()), a = B(e.basisForward.clone());
	B(n);
	let o = t(r.dot(n)), s = B(r.multiplyScalar(o)), c = B(n.clone().sub(s)), l = t(c.length()), u = l <= z ? c.set(0, 0, 0) : c.set(t(c.x / l), t(c.y / l), t(c.z / l)), d = t(i.dot(u)), f = t(Math.asin(d < -1 ? -1 : Number.isNaN(d) ? 1 : Math.min(d, 1))) * t(180 / Math.PI), p = t(f - f * t(e.springStrength) * t(e.deltaTime) * t(e.deltaTime)), m = p <= e.limit.max ? p : e.limit.max, h = p < e.limit.min ? e.limit.min : m, g = h >= 0 ? e.limit.max : e.limit.min, _ = 0;
	if (g < -1e-4 || g > 1e-4) {
		let e = t(h / g);
		e >= 0 && (_ = Math.min(e, 1));
	}
	let v = t(g * _), y = t(g * _ * t(Math.PI / 180)), b = B(i.multiplyScalar(t(Math.sin(y))));
	return B(b.add(B(a.multiplyScalar(t(Math.cos(y)))))), B(b.multiplyScalar(l)), B(n.copy(s).add(b)), v !== p;
}
function Vr(t, n, r, i, a) {
	let o = Math.fround, s = r.clone().multiply(i);
	Hr(s);
	let c = pr(new e.Vector3(o(o(n.x) - o(t.x)), o(o(n.y) - o(t.y)), o(o(n.z) - o(t.z))), s.invert());
	if (c.lengthSq() <= z * z) return i.clone();
	Ur(c);
	let l = Wr(a, c);
	return i.clone().multiply(l);
}
function B(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z));
}
function Hr(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z), Math.fround(e.w));
}
function Ur(e) {
	B(e);
	let t = Math.fround(e.length());
	return t > 1e-5 ? e.set(Math.fround(e.x / t), Math.fround(e.y / t), Math.fround(e.z / t)) : e.set(0, 0, 0);
}
function Wr(t, n) {
	let r = Math.fround, i = qr(t.clone()), a = qr(n.clone()), o = Kr(i, a);
	if (i.lengthSq() === 0 || a.lengthSq() === 0 || o > .999999) return new e.Quaternion();
	let s = Array(9);
	if (o < -.999999) {
		let t = new e.Vector3(0, i.z, -i.y);
		Kr(t, t) < 1e-6 && t.set(-i.z, 0, i.x);
		let n = r(1 / r(Math.sqrt(Kr(t, t))));
		B(t.multiplyScalar(n));
		let a = Gr(t, i), o = i.toArray(), c = t.toArray(), l = a.toArray();
		for (let e = 0; e < 3; e++) for (let t = 0; t < 3; t++) s[e * 3 + t] = r(r(r(l[t] * l[e]) - r(o[t] * o[e])) - r(c[t] * c[e]));
	} else {
		let e = Gr(i, a), t = r(r(1 - o) / Kr(e, e)), n = r(e.x * t), c = r(e.y * t), l = r(e.z * t), u = r(e.y * n), d = r(e.z * n), f = r(e.y * l);
		s[0] = r(o + r(e.x * n)), s[1] = r(e.z + u), s[2] = r(d - e.y), s[3] = r(u - e.z), s[4] = r(o + r(c * e.y)), s[5] = r(e.x + f), s[6] = r(e.y + d), s[7] = r(f - e.x), s[8] = r(o + r(e.z * l));
	}
	let c = [
		0,
		0,
		0,
		0
	], l = r(r(s[0] + s[4]) + s[8]);
	if (l > 0) {
		let e = r(Math.sqrt(r(l + 1))), t = r(.5 / e);
		c[3] = r(e * .5), c[0] = r(r(s[5] - s[7]) * t), c[1] = r(r(s[6] - s[2]) * t), c[2] = r(r(s[1] - s[3]) * t);
	} else {
		let e = +(s[4] > s[0]);
		s[8] > s[e * 4] && (e = 2);
		let t = (e + 1) % 3, n = (t + 1) % 3, i = r(Math.sqrt(r(r(r(s[e * 4] - s[t * 4]) - s[n * 4]) + 1))), a = r(.5 / i);
		c[e] = r(i * .5), c[3] = r(r(s[t * 3 + n] - s[n * 3 + t]) * a), c[t] = r(r(s[e * 3 + t] + s[t * 3 + e]) * a), c[n] = r(r(s[e * 3 + n] + s[n * 3 + e]) * a);
	}
	let u = r(Math.sqrt(r(r(r(r(c[0] * c[0]) + r(c[1] * c[1])) + r(c[2] * c[2])) + r(c[3] * c[3]))));
	return new e.Quaternion(r(c[0] / u), r(c[1] / u), r(c[2] / u), r(c[3] / u));
}
function Gr(t, n) {
	let r = Math.fround;
	return new e.Vector3(r(r(t.y * n.z) - r(t.z * n.y)), r(r(t.z * n.x) - r(t.x * n.z)), r(r(t.x * n.y) - r(t.y * n.x)));
}
function Kr(e, t) {
	let n = Math.fround;
	return n(n(n(e.x * t.x) + n(e.y * t.y)) + n(e.z * t.z));
}
function qr(e) {
	let t = Math.fround;
	e.set(t(e.x), t(e.y), t(e.z));
	let n = t(Math.sqrt(Kr(e, e)));
	return n >= Math.fround(1e-5) ? e.set(t(e.x / n), t(e.y / n), t(e.z / n)) : e.set(0, 0, 0);
}
function V(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function Jr(e) {
	return [...e].sort((e, t) => Yr(e) - Yr(t));
}
function Yr(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function Xr(e, t) {
	return e.lengthSq() <= z * z && e.copy(t), e.lengthSq() <= z * z && e.copy(vr), e.normalize();
}
function Zr(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), Xr(e, vr);
}
function H(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function Qr(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var $r = 1401298464324817e-60, ei = sr("right"), ti = sr("left"), ni = sr("back"), ri = sr("down"), ii = class t {
	bones;
	managerBatches;
	missingNodes;
	skinnedBones;
	setupDiagnostics;
	externalForce = new e.Vector3(0, 0, 0);
	parentRotation = new e.Quaternion();
	headPosition = new e.Vector3();
	localRotation = new e.Quaternion();
	colliderLocalToWorld = new e.Matrix4();
	colliderWorldToLocal = new e.Matrix4();
	frameColliderCache = /* @__PURE__ */ new Map();
	angleVector = new e.Vector3();
	debugAnimatedTip = new e.Vector3();
	providerForce = new e.Vector3();
	providerRotation = new e.Quaternion();
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
	updateManagerPathId = null;
	traceEvents = [];
	constructor(e, t, n, r, i) {
		this.bones = e, this.managerBatches = t, this.missingNodes = n, this.skinnedBones = r, this.setupDiagnostics = i;
	}
	static fromPjskRuntimeExtension(e, n) {
		let r = Xi(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = Si(n), a = xi(r), o = Di(n), s = [], c = Ni(r), l = di(r, i, s, c), u = ki(r), d = Ai(r), f = ji(r, l), p = Oi(r), m = pi(r), h = fi(r, c, m), g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map();
		n.traverse((e) => y.set(e, y.size));
		let b = /* @__PURE__ */ new Map();
		for (let e of p.values()) b.set(e, U(i, e.nodePath, e.runtimePartIndex));
		let x = (r.managers ?? []).filter((e) => Pi(e.nodePath ?? e.poseRoot, c)).map((e) => ({
			source: e,
			node: U(i, e.nodePath, e.runtimePartIndex),
			nodes: []
		})).sort((e, t) => (y.get(e.node) ?? 0) - (y.get(t.node) ?? 0));
		for (let e of x) {
			let t = e.source, n = si(i, t, v), o = e.node ? [...b].filter(([n, r]) => r ? ba(r, e.node) : n.pathId !== void 0 && t.bonePathIds?.includes(n.pathId)).sort((e, t) => (y.get(e[1]) ?? Infinity) - (y.get(t[1]) ?? Infinity)).map(([e]) => e) : (t.bonePathIds ?? []).map((e) => p.get(e));
			for (let p of o) {
				if (!p || !Pi(p.nodePath, c)) continue;
				let o = p.pathId;
				if (!hi(p, m)) {
					h.rejectedUnverifiedBoneSourceCount += 1;
					continue;
				}
				let v = b.get(p);
				if (!v) {
					s.push(p.nodePath ?? p.nodeName ?? `bone:${o}`);
					continue;
				}
				e.nodes.push(v), _.set(v, p);
				let y = _i(p, v, a, i), x = U(i, p.pivotNodePath, p.runtimePartIndex), ee = gi(r, t, p, o === void 0 ? void 0 : u.get(o), o === void 0 ? void 0 : d.get(o), t.pathId === void 0 ? void 0 : f.get(t.pathId), l), S = oi(t, p, v, y, x, Fi(i, p), n, ee);
				S && g.set(v, S);
			}
		}
		let ee = [...g.values()];
		ee.sort((e, t) => ya(e.node) - ya(t.node));
		let S = x.map((e) => {
			let t = [...new Set(e.nodes)].map((e) => g.get(e)).sort((e, t) => ya(e.node) - ya(t.node));
			return {
				source: e.source,
				bones: t,
				animatedBones: new Set(t.filter((t) => qi(_.get(t.node), t.node, e.source))),
				gravity: q(e.source.rawGravity),
				forceProviders: si(i, e.source, v),
				slowMotionScale: Y(e.source.slowMotionScale) ?? 1,
				isPaused: e.source.isPaused === !0
			};
		});
		return ee.length > 0 ? new t(ee, S, s, o, h) : null;
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
		for (let t of this.managerBatches) t.slowMotionScale = fa(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
		for (let t of this.bones) t.stiffnessForce = fa(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = fa(e.dragForce, t.originalDragForce), t.windInfluence = fa(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = fa(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(t) {
		let n = this.collectWindVolumeOneSelfProviders(), r = new Set(n.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), i = new Set(n.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let n of this.managerBatches) {
			let a = n.source;
			if (a.enabled === !1 || a.automaticUpdates === !1) continue;
			this.updateManagerPathId = Y(a.pathId), n.isPaused || this.preUpdateColliders(n.bones);
			let o = this.updateManagerPathId !== null && i.has(this.updateManagerPathId) ? !0 : a.isSumOfForcesOnBone !== !1;
			for (let i of n.bones) {
				if (!i.enabled) continue;
				L(i.node.parent, this.parentRotation), R(i.node, this.headPosition);
				let s = n.animatedBones.has(i) ? e.MathUtils.clamp(Y(a.dynamicRatio) ?? .5, 0, 1) : 1;
				if (n.isPaused) {
					i.skinAnimationLocalRotation.copy(i.node.quaternion), this.applyBoneRotation(i, s);
					continue;
				}
				!o || this.updateManagerPathId !== null && r.has(this.updateManagerPathId) || (this.computeExternalForce(i, t, n), this.updateBoneSpringAndRotation(i, Yi(t, Y(a.simulationFrameRate) ?? 60, n.slowMotionScale), this.externalForce, s));
			}
		}
		for (let e of n) e.isActive && this.updateWindVolumeOneSelfLateUpdate(e, t);
	}
	collectWindVolumeOneSelfProviders() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.managerBatches) for (let n of t.forceProviders) n.kind === "WindVolumeOneSelf" && e.add(n);
		return [...e];
	}
	updateWindVolumeOneSelfLateUpdate(e, t) {
		if (e.springManagerPathId === null) return;
		let n = e.simulationFrameRate > 0 ? 1 / e.simulationFrameRate : t, r = this.managerBatches.find((t) => t.source.pathId === e.springManagerPathId);
		if (!(!r || r.source.enabled === !1 || r.source.automaticUpdates === !1 || r.isPaused)) {
			this.updateManagerPathId = e.springManagerPathId, this.preUpdateColliders(r.bones);
			for (let i of r.bones) i.enabled && (this.computeWindVolumeOneSelfForce(e, i, t), this.externalForce.copy(r.gravity).add(this.providerForce), this.updateBoneSpringAndRotation(i, n, this.externalForce, r.animatedBones.has(i) ? e.dynamicRatio : 1));
		}
	}
	computeExternalForce(e, t, n) {
		this.externalForce.copy(n.gravity);
		for (let r of n.forceProviders) this.externalForce.add(this.computeForceProvider(r, e, t));
		return this.externalForce;
	}
	computeForceProvider(e, t, n) {
		return e.kind === "ForceVolume" ? (e.node.updateMatrixWorld(!0), L(e.node, this.providerRotation), this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).multiplyScalar(e.strength)) : e.kind === "WindVolume" ? this.computeWindVolume(e, t) : this.computeWindVolumeOneSelfForce(e, t, n);
	}
	computeWindVolume(e, t) {
		let n = e.weight * e.strength;
		if (n <= $r || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), L(e.node, this.providerRotation), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= $r || t.period <= $r) return this.providerForce.set(0, 0, 0);
		t.currentTime = da(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), L(t.node, this.providerRotation), this.waveAxis.set(0, 1, 0).applyQuaternion(this.providerRotation), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = da(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(ei).applyQuaternion(this.providerRotation), this.providerUp.set(0, 1, 0).applyQuaternion(this.providerRotation), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, $r);
		n.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(t.node.matrixWorld).invert());
		let s = Math.PI * 2 / o, c = -this.localBonePosition.x, l = Math.sin(a + Math.sin(s * c) + Math.cos(s * this.localBonePosition.z));
		return this.mainWindDirection.set(0, 0, 1).applyQuaternion(this.providerRotation).addScaledVector(this.waveAxis, t.amplitude * l).normalize(), this.additionalDirection.set(-Math.cos(e.MathUtils.degToRad(t.additionalWindAngle)), 0, -Math.sin(e.MathUtils.degToRad(t.additionalWindAngle))).normalize(), this.providerForce.copy(this.mainWindDirection).multiplyScalar(i).addScaledVector(this.additionalDirection, t.additionalWindStrength).multiplyScalar(n.windInfluence);
	}
	settleCurrentPose(e = 60, t = 1 / 60) {
		let n = Math.max(0, Math.floor(e));
		for (let e = 0; e < n; e += 1) this.update(t);
	}
	resetPose() {
		for (let e of this.bones) e.node.quaternion.copy(e.initialLocalRotation), e.skinAnimationLocalRotation.copy(e.initialLocalRotation), e.node.scale.copy(e.initialLocalScale), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetStateToCurrentPose() {
		for (let e of this.bones) L(e.node.parent, this.parentRotation), R(e.node, this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(br({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip), e.state.cachedPosition.copy(this.headPosition), e.state.cachedMovement.set(0, 0, 0), e.state.hitNormal.set(0, 0, 0);
	}
	getSnapshot(t = !0, n = {}) {
		let r = /* @__PURE__ */ new Set(), i = [], a = [], o = 0, s = 0, c = 0, l = 0;
		for (let t of this.bones) {
			for (let e of t.colliders) r.add(e);
			L(t.node.parent, this.parentRotation), R(t.node, this.headPosition), this.debugAnimatedTip.copy(br({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: t.initialLocalRotation,
				boneAxis: t.boneAxis,
				springLength: t.springLength
			}));
			let n = this.debugAnimatedTip.distanceTo(t.state.currTipPos), u = t.node.name.toLowerCase(), d = t.state.currTipPos.clone().sub(this.debugAnimatedTip), f = t.state.currTipPos.clone().sub(t.state.prevTipPos), p = this.skinnedBones.has(t.node);
			u.includes("sleeve") && (o = Math.max(o, n)), u.includes("skirt") && (s = Math.max(s, n)), p ? c += 1 : l += 1, i.push({
				name: t.node.name,
				path: X(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: ra(t.tailBinding),
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
				dynamicRatio: Ki(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Qi(t),
				animatedTipDelta: W(d),
				velocity: W(f),
				springForce: W(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(Vi)
			}), u.includes("skirt") && a.push({
				name: t.node.name,
				path: X(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: ra(t.tailBinding),
				offset: n,
				appliedRotationDegrees: e.MathUtils.radToDeg(t.skinAnimationLocalRotation.clone().normalize().angleTo(t.node.quaternion.clone().normalize())),
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastCollisionHitNormal: t.lastCollisionInfo ? W(t.lastCollisionInfo.hitNormal) : null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				dragForce: t.dragForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: Ki(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Qi(t),
				animatedTipDelta: W(d),
				velocity: W(f),
				headMovement: W(t.state.cachedMovement),
				gravity: W(t.gravity),
				springForce: W(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(Vi)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = Zi(i, n), d = ai(this.bones, this.skinnedBones);
		return {
			runtimeMode: "unity-prefab",
			enabled: t,
			springCount: this.managerBatches.length,
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
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(Vi),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(t, n, r, i) {
		L(t.node.parent, this.parentRotation), R(t.node, this.headPosition);
		let a = this.shouldTraceBone(t) ? this.createTraceEvent(t, n, r, i) : null;
		t.skinAnimationLocalRotation.copy(t.node.quaternion), a && (a.skinAnimationLocalRotation = ea(t.skinAnimationLocalRotation)), Sr(t.state, this.headPosition), a && (a.stateAfterCache = G(t.state)), xr(t.state, {
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: t.initialLocalRotation,
			boneAxis: t.boneAxis,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(L(t.node, new e.Quaternion())),
			springLength: t.springLength,
			stiffnessForce: t.stiffnessForce,
			dragForce: t.dragForce,
			springForce: t.springForce,
			externalForce: r,
			deltaTime: n
		}), a && (a.stateAfterUpdateSpring = G(t.state)), this.applyLengthLimits(t, n), a && (a.stateAfterLengthLimits = G(t.state));
		let o = Math.abs(t.radius);
		a && (a.tailRadius = o);
		let s = t.collideWithGround ? Dr(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(L(t.node, new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		a && (a.groundHit = s, a.stateAfterGround = G(t.state)), t.lastCollisionInfo = null;
		let c = [], l = t.enableCollision ? this.buildWorldColliders(t.colliders) : [];
		t.lastCollisionStatus = !s && t.enableCollision ? Tr(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			colliders: l,
			bounce: t.bounce,
			friction: t.friction,
			onColliderCheck: a ? (e, t) => {
				c.push(na(e, t));
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
		}) : 0, a && (a.collisionChecks = c, a.collisionStatus = t.lastCollisionStatus, a.stateAfterCollisions = G(t.state));
		let u = a ? ta(t) : void 0;
		t.lastAngleLimitApplied = t.enableAngleLimits ? this.applyAngleLimits(t, n, u) : !1, a && u && (a.angleLimit = u, a.stateAfterAngleLimits = G(t.state)), this.resetInvalidTipPosition(t), this.applyBoneRotation(t, i), a && (a.finalLocalRotation = ea(t.node.quaternion), this.pushTraceEvent(a));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: R(t.node, new e.Vector3()),
			initialLength: t.initialLength
		}));
		wr({
			currTipPos: t.state.currTipPos,
			springConstant: t.springConstant,
			deltaTime: n,
			targets: r
		});
	}
	applyAngleLimits(e, t, n) {
		if (!e.yAngleLimit && !e.zAngleLimit) return !1;
		let r = e.pivotNode ?? e.node.parent ?? e.node;
		r.updateMatrixWorld(!0), this.angleVector.copy(e.state.currTipPos).sub(e.state.cachedPosition), this.angleVector.set(Math.fround(this.angleVector.x), Math.fround(this.angleVector.y), Math.fround(this.angleVector.z));
		let i = fr(r, ti.clone()), a = fr(r, ni.clone()), o = fr(r, ri.clone());
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = X(r) || null, n.vectorBefore = W(this.angleVector), n.forward = W(i), n.back = W(a), n.down = W(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = Br({
				basisSide: o,
				basisUp: a,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.yAngleLimit,
				vector: this.angleVector
			});
			n && (n.yApplied = r, n.afterY = W(this.angleVector)), s = r || s;
		}
		if (e.zAngleLimit) {
			let r = Br({
				basisSide: a,
				basisUp: o,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.zAngleLimit,
				vector: this.angleVector
			});
			n && (n.zApplied = r, n.afterZ = W(this.angleVector)), s = r || s;
		}
		return e.state.currTipPos.copy(e.state.cachedPosition).add(this.angleVector), e.state.currTipPos.set(Math.fround(e.state.currTipPos.x), Math.fround(e.state.currTipPos.y), Math.fround(e.state.currTipPos.z)), n && (n.vectorAfter = W(this.angleVector)), s;
	}
	applyBoneRotation(e, t = e.dynamicRatio) {
		this.resetInvalidTipPosition(e), this.localRotation.copy(Vr(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy(rr(mr(e.skinAnimationLocalRotation, this.localRotation, t))), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(br({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip));
	}
	shouldTraceBone(e) {
		if (this.traceFilters.length === 0) return !1;
		let t = e.node.name.toLowerCase(), n = X(e.node).toLowerCase(), r = e.springName.toLowerCase();
		return this.traceFilters.some((e) => t.includes(e) || n.includes(e) || r.includes(e));
	}
	createTraceEvent(e, t, n, r) {
		return {
			sequence: this.traceSequence,
			springName: e.springName,
			boneName: e.node.name,
			bonePath: X(e.node),
			sourceBoneName: e.sourceBoneName,
			sourceBonePath: e.sourceBonePath,
			sourceBonePathId: e.sourceBonePathId,
			pivotSourceName: e.pivotSourceName,
			pivotSourcePath: e.pivotSourcePath,
			pivotResolvedPath: e.pivotResolvedPath,
			tailBinding: ra(e.tailBinding),
			managerPathId: e.managerPathId,
			updateManagerPathId: this.updateManagerPathId,
			deltaTime: t,
			dynamicRatio: r,
			automaticUpdates: e.automaticUpdates,
			enabled: e.enabled,
			enableCollision: e.enableCollision,
			enableAngleLimits: e.enableAngleLimits,
			enableLengthLimits: e.enableLengthLimits,
			colliderCount: e.colliders.length,
			forceProviderCount: e.forceProviders.length,
			headPosition: W(this.headPosition),
			parentRotation: ea(this.parentRotation),
			initialLocalRotation: ea(e.initialLocalRotation),
			skinAnimationLocalRotation: ea(e.skinAnimationLocalRotation),
			boneAxis: W(e.boneAxis),
			boneAxisSource: e.boneAxisSource,
			springLength: e.springLength,
			radius: e.radius,
			tailRadius: 0,
			stiffnessForce: e.stiffnessForce,
			dragForce: e.dragForce,
			springForce: W(e.springForce),
			gravity: W(e.gravity),
			externalForce: W(n),
			stateBefore: G(e.state),
			stateAfterCache: G(e.state),
			animatedTip: W(br({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: e.initialLocalRotation,
				boneAxis: e.boneAxis,
				springLength: e.springLength
			})),
			stateAfterUpdateSpring: G(e.state),
			stateAfterLengthLimits: G(e.state),
			groundHit: !1,
			stateAfterGround: G(e.state),
			collisionStatus: 0,
			collisionChecks: [],
			stateAfterCollisions: G(e.state),
			angleLimit: ta(e),
			stateAfterAngleLimits: G(e.state),
			finalLocalRotation: ea(e.node.quaternion)
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
	preUpdateColliders(e = this.bones) {
		this.frameColliderCache.clear();
		let t = /* @__PURE__ */ new Set();
		for (let n of e) for (let e of n.colliders) t.add(e);
		let n = [...t].sort((e, t) => ga(e.source) - ga(t.source));
		for (let e of n) {
			let t = this.createWorldCollider(e);
			t && this.frameColliderCache.set(e, t);
		}
	}
	createWorldCollider(t) {
		let n = t.source.shape, r = t.source.enabled !== !1, i = r && t.source.linkedRendererEnabled !== !1;
		return n?.sphere ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "sphere",
			enabled: r,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? X(t.node),
			debugSourcePathId: t.source.pathId,
			localOffset: q(n.sphere.offset),
			radius: Math.max(0, n.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: va(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(L(t.node, new e.Quaternion())),
			lossyScaleX: _a(t.node)
		}) : n?.capsule ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? X(t.node),
			debugSourcePathId: t.source.pathId,
			localStart: q(n.capsule.offset),
			localEnd: q(n.capsule.tail),
			radius: Math.max(0, n.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: va(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(L(t.node, new e.Quaternion())),
			lossyScaleX: _a(t.node)
		}) : n?.panel ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "panel",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? X(t.node),
			debugSourcePathId: t.source.pathId,
			width: Math.max(0, n.panel.width ?? 0),
			height: Math.max(0, n.panel.height ?? 0),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: va(this.colliderWorldToLocal),
			worldToLocalLengthScale: va(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(L(t.node, new e.Quaternion()))
		}) : null;
	}
};
function ai(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = ia(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
		o || (o = {
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			sourceRoot: e,
			count: 0,
			sampleNames: [],
			samplePaths: []
		}, n.set(a, o)), o.count += 1, o.sampleNames.length < 6 && (o.sampleNames.push(i.node.name), o.samplePaths.push(X(i.node))), r.length < 12 && (i.runtimePartType === "hair" || i.node.name.toLowerCase().includes("hair") || (i.sourceBonePath ?? "").toLowerCase().includes("hair")) && r.push({
			name: i.node.name,
			path: X(i.node),
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
function oi(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = R(r, new e.Vector3()), d = l.clone().sub(u);
	d.set(Math.fround(d.x), Math.fround(d.y), Math.fround(d.z));
	let f = Math.fround(d.length()), p = r.quaternion.clone(), m = aa(r, l), h = e.MathUtils.clamp(Y(t.dynamicRatio) ?? .5, 0, 1), g = o.map((t) => ({
		node: t.node,
		initialLength: R(t.node, new e.Vector3()).distanceTo(l)
	})), _ = n.rawStiffnessForce ?? 300, v = n.rawDragForce ?? n.dragForce ?? .4, y = Math.max(0, n.rawWindInfluence ?? 1), b = Y(t.slowMotionScale) ?? 1, x = t.isPaused === !0;
	return {
		managerPathId: Y(t.pathId),
		runtimePartIndex: Y(n.runtimePartIndex) ?? Y(t.runtimePartIndex),
		runtimePartType: n.runtimePartType ?? t.runtimePartType ?? n.partKind ?? t.partKind ?? null,
		springName: `${t.partKind ?? n.partKind ?? "Part"}:${t.nodeName ?? t.pathId ?? "manager"}`,
		sourceBoneName: n.nodeName ?? null,
		sourceBonePath: n.nodePath ?? null,
		sourceBonePathId: Y(n.pathId),
		pivotSourceName: n.pivotNodeName ?? null,
		pivotSourcePath: n.pivotNodePath ?? null,
		pivotResolvedPath: a ? X(a) : null,
		tailBinding: i,
		automaticUpdates: t.automaticUpdates !== !1,
		enabled: n.enabled !== !1,
		enableLengthLimits: t.enableLengthLimits !== !1,
		enableAngleLimits: t.enableAngleLimits !== !1,
		enableCollision: t.enableCollision !== !1,
		collideWithGround: t.collideWithGround === !0,
		groundHeight: t.groundHeight ?? 0,
		isSumOfForcesOnBone: t.isSumOfForcesOnBone !== !1,
		isPaused: x,
		gravity: q(t.rawGravity),
		forceProviders: s,
		node: r,
		state: yr(u, l),
		initialLocalRotation: p,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: p.clone(),
		boneAxis: m.axis,
		boneAxisSource: m.source,
		springLength: f,
		dynamicRatio: h,
		isAnimated: qi(n, r, t),
		simulationFrameRate: Y(t.simulationFrameRate) ?? 60,
		slowMotionScale: b,
		bounce: Y(t.bounce) ?? 0,
		friction: Y(t.friction) ?? 1,
		radius: Math.max(0, n.hitRadius ?? .05),
		stiffnessForce: _,
		dragForce: v,
		windInfluence: y,
		originalStiffnessForce: _,
		originalDragForce: v,
		originalWindInfluence: y,
		springForce: q(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: g,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: Gi(n.rawAngleLimits?.y),
		zAngleLimit: Gi(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function si(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = ci(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = li(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function ci(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function li(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = U(t, n.nodePath, n.runtimePartIndex) ?? ui(t, n.nodeName), c = n.raw ?? {};
	if (!s || !ca(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: Y(n.sourcePathId),
		node: s,
		springManagerPathId: Y(n.springManagerPathId) ?? la(c, "<SpringManager>k__BackingField") ?? la(c, "_SpringManager_k__BackingField") ?? la(c, "springManager")
	};
	return o ? {
		kind: "ForceVolume",
		...l,
		strength: J(c, "strength", 0)
	} : a ? {
		kind: "WindVolume",
		...l,
		weight: J(c, "weight", 0),
		strength: J(c, "strength", 0),
		period: J(c, "period", 0),
		positionalMultiplier: J(c, "positionalMultiplier", 0),
		timeFactor: J(c, "timeFactor", 0),
		offsetVector: sa(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: ca(c, "isActive", !1),
		dynamicRatio: e.MathUtils.clamp(J(c, "dynamicRatio", .5), 0, 1),
		simulationFrameRate: Math.max(0, J(c, "simulationFrameRate", 60)),
		weight: J(c, "weight", 0),
		strength: J(c, "strength", 0),
		period: J(c, "period", 0),
		currentTime: J(c, "currentTime", 0),
		spinPeriod: J(c, "spinPeriod", 0),
		spinTime: J(c, "spinTime", 0),
		amplitude: J(c, "amplitude", 0),
		peakDistance: J(c, "peakDistance", 0),
		additionalWindAngle: J(c, "additionalWindAngle", 0),
		additionalWindStrength: J(c, "additionalWindStrength", 0)
	};
}
function ui(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function di(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !Pi(a.nodePath, r)) continue;
		let e = U(t, a.nodePath, a.runtimePartIndex);
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
function fi(e, t, n) {
	return {
		managerCount: e.managers?.length ?? 0,
		boneSourceCount: e.bones?.length ?? 0,
		colliderSourceCount: e.colliders?.length ?? 0,
		bindingDecisionCount: e.bindingDecisions?.length ?? 0,
		managerColliderCacheCount: e.managerColliderCaches?.length ?? 0,
		officialSpringComponentCount: n.pathIds.size,
		rejectedUnverifiedBoneSourceCount: 0,
		activeRootCount: t.size,
		activeRoots: [...t].sort()
	};
}
function pi(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1;
	for (let i of e.prefabGraphs ?? []) {
		Array.isArray(i.monoBehaviours) && (r = !0);
		for (let e of i.monoBehaviours ?? []) mi(e.scriptName) && (typeof e.pathId == "number" && t.add(e.pathId), e.transformPath && n.add(Ti(e.runtimePartIndex ?? -1, e.transformPath)));
	}
	return {
		hasComponentMetadata: r,
		pathIds: t,
		partPaths: n
	};
}
function mi(e) {
	let t = e?.trim().toLowerCase();
	return t === "springbone" || t === "sekaispringbone";
}
function hi(e, t) {
	return !t.hasComponentMetadata || typeof e.pathId == "number" && t.pathIds.has(e.pathId) ? !0 : !!(e.nodePath && t.partPaths.has(Ti(e.runtimePartIndex ?? -1, e.nodePath)));
}
function gi(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [Bi(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${Wi(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = Ii(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = Ri(c, a), s = zi(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [Bi(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${Wi(a)}`, l)]
		};
	}
	let l = Hi((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [Bi(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${Wi(a)}`, l)]
	};
}
function _i(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = R(n, new e.Vector3()), o = fr(n, sr("right")), s = Math.fround, c = new e.Vector3(s(a.x - s(o.x * s(.1))), s(a.y - s(o.y * s(.1))), s(a.z - s(o.z * s(.1)))), l = t.nodePath ? wi(r, t.nodePath, t.runtimePartIndex) : void 0, u = l ? yi(l, r, i, t.runtimePartIndex) : [], d = u.map((e) => e.source.name ?? e.node.name), f = u.map((e) => e.source.transformPath ?? X(e.node));
	if (u.length === 0) return {
		mode: "fallback",
		childCount: 0,
		childNames: d,
		childPaths: f,
		childSources: [],
		tailPosition: c
	};
	if (u.length === 1) return {
		mode: "singleChild",
		childCount: 1,
		childNames: d,
		childPaths: f,
		childSources: u.map((e) => e.source),
		tailPosition: R(u[0].node, new e.Vector3())
	};
	let p = new e.Vector3(), m = 0;
	for (let t of u) {
		let n = R(t.node, new e.Vector3());
		p.add(n), p.set(s(p.x), s(p.y), s(p.z));
		let r = n.clone().sub(a);
		r.set(s(r.x), s(r.y), s(r.z)), m = s(m + s(r.length()));
	}
	p.set(s(p.x / u.length), s(p.y / u.length), s(p.z / u.length)), m = s(m / u.length);
	let h = vi(a, p, m);
	return {
		mode: "averageChildren",
		childCount: u.length,
		childNames: d,
		childPaths: f,
		childSources: u.map((e) => e.source),
		tailPosition: h
	};
}
function vi(t, n, r) {
	let i = Math.fround, a = n.clone().sub(t);
	if (a.set(i(a.x), i(a.y), i(a.z)), a.lengthSq() <= 1e-5 * 1e-5) a.copy(ei);
	else {
		let e = i(a.length());
		a.set(i(a.x / e), i(a.y / e), i(a.z / e));
	}
	return new e.Vector3(i(t.x + i(a.x * i(r))), i(t.y + i(a.y * i(r))), i(t.z + i(a.z * i(r))));
}
function yi(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !bi(e, t)) continue;
		let o = U(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function bi(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function xi(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(Ti(e.runtimePartIndex, e.transformPath), e));
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
function Si(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = X(i, e);
		if (!a) return;
		t.set(a, i);
		let o = ma(i, e);
		o && o !== a && r.set(o, i);
		let s = Ei(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(Ti(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function Ci(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function U(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(Ti(n, t));
		if (r) return r;
	}
	return Ci(e, t);
}
function wi(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(Ti(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function Ti(e, t) {
	return `${e}:${t}`;
}
function Ei(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function Di(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function Oi(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function ki(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Ai(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function ji(e, t) {
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
			typeof n == "number" && i && Mi(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function Mi(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function Ni(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => K(e)).filter((e) => !!e));
}
function Pi(e, t) {
	if (t.size === 0) return !0;
	let n = K(ia(e));
	return n !== null && t.has(n);
}
function Fi(e, t) {
	let n = [];
	for (let r of t.lengthLimitTargets ?? []) {
		let i = U(e, r.nodePath, r.runtimePartIndex ?? t.runtimePartIndex);
		i && n.push({
			node: i,
			initialLength: 0
		});
	}
	return n;
}
function Ii(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function Li(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function Ri(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = Li(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function zi(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = K(ia(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	if (t.partKind === "Head" || o === "face") {
		let t = K(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
		if (t && a.has(t)) return {
			root: t,
			reason: "head/face uses runtime defaultBodyRoot"
		};
		if (a.has("body")) return {
			root: "body",
			reason: "head/face body fallback"
		};
	}
	let s = K(r?.defaultRoot);
	if (s && a.has(s)) return {
		root: s,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = K(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let c = K(i?.defaultRoot);
	return c && a.has(c) ? {
		root: c,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: c ? `binding.defaultRoot ${c} not available after manager cache` : "no matching root"
	};
}
function Bi(e, t, n, r, i, a, o, s, c) {
	return {
		sourceKind: r?.sourceKind ?? n?.sourceKind ?? "direct",
		colliderFlag: r?.colliderFlag ?? n?.colliderFlag ?? null,
		colliderGroupIndex: null,
		springName: `${e.partKind ?? t.partKind ?? "Part"}:${e.nodeName ?? e.pathId ?? "manager"}`,
		boneName: t.nodeName ?? null,
		bonePath: t.nodePath ?? null,
		sourceSpringBonePathId: Y(t.pathId),
		candidateRoots: i ? [...i.entries()].map(([e, t]) => ({
			root: e,
			colliderCount: t.length,
			colliderSourcePathIds: t.map((e) => e.source.pathId).filter((e) => typeof e == "number")
		})) : [],
		defaultRoot: K(a),
		selectedRoot: o,
		selectedColliderCount: c.length,
		selectedColliderSourcePathIds: c.map((e) => e.source.pathId).filter((e) => typeof e == "number"),
		selectionReason: s
	};
}
function Vi(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function Hi(e, t, n) {
	let r = Ui(t, n);
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
function Ui(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function Wi(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function Gi(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function Ki(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function qi(e, t, n) {
	let r = Ji(n.animatedBoneNames);
	return r.size === 0 ? !1 : r.has(t.name) || typeof e.nodeName == "string" && r.has(e.nodeName);
}
function Ji(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function Yi(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function Xi(e) {
	let t = pa(e), n = pa(t?.pjskSpringBone ?? t?.PjskSpringBone), r = pa(n?.runtimeUnitySetup ?? n?.RuntimeUnitySetup), i = r?.version;
	return i === "0414" || i === 414 ? r : null;
}
function W(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		length: e.length()
	};
}
function Zi(e, t) {
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
function Qi(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function $i(e) {
	return e ? W(e) : null;
}
function ea(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		w: e.w
	};
}
function G(e) {
	return {
		currTipPos: W(e.currTipPos),
		prevTipPos: W(e.prevTipPos),
		hitNormal: W(e.hitNormal),
		cachedPosition: W(e.cachedPosition),
		cachedMovement: W(e.cachedMovement)
	};
}
function ta(e) {
	return {
		enabled: e.enableAngleLimits,
		hasPivot: !!e.pivotNode,
		pivotName: e.pivotNode?.name || null,
		pivotPath: e.pivotNode && X(e.pivotNode) || null,
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
function na(e, t) {
	return {
		kind: e.kind,
		name: e.debugName ?? null,
		path: e.debugPath ?? null,
		sourcePathId: e.debugSourcePathId ?? null,
		enabled: e.enabled !== !1,
		status: t.status,
		beforeTailPosition: W(t.beforeTailPosition),
		afterTailPosition: W(t.afterTailPosition),
		hitNormal: W(t.hitNormal),
		localHeadPosition: $i(t.details.localHeadPosition),
		localTailPositionBefore: $i(t.details.localTailPositionBefore),
		localTailPositionAfter: $i(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: $i(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: $i(t.details.localCapsuleStart),
		localCapsuleEnd: $i(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function ra(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: W(e.tailPosition)
	};
}
function ia(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function K(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function q(t) {
	return ar(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : I(t, new e.Vector3()));
}
function aa(e, t) {
	e.updateMatrixWorld(!0);
	let n = oa(lr(e, t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: ei.clone(),
		source: "fallback-local-tip"
	};
}
function oa(t) {
	let n = Math.fround(t.length());
	return n <= 1e-5 ? null : new e.Vector3(Math.fround(t.x / n), Math.fround(t.y / n), Math.fround(t.z / n));
}
function J(e, t, n) {
	return Y(e[t] ?? e[ua(t)]) ?? n;
}
function sa(t, n) {
	let r = t[n] ?? t[ua(n)];
	return Array.isArray(r) || typeof r == "object" && r ? q(r) : new e.Vector3();
}
function ca(e, t, n) {
	let r = e[t] ?? e[ua(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function la(e, t) {
	let n = pa(e[t] ?? e[ua(t)]);
	return Y(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function ua(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function da(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function fa(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Y(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function pa(e) {
	return e && typeof e == "object" ? e : null;
}
function X(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function ma(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(ha(r.name)), r = r.parent;
	return n.join("/");
}
function ha(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function ga(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function _a(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function va(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function ya(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function ba(e, t) {
	for (let n = e; n; n = n.parent) if (n === t) return !0;
	return !1;
}
//#endregion
//#region src/kernel/renderRecipe.ts
var xa = /^\d+(?::[A-Za-z0-9_/-]+)?$/;
function Sa(e) {
	let t = String(e.roleId ?? "").trim();
	if (!xa.test(t)) throw Error("roleId must be '<characterId>:<unit>' or '<characterId>'.");
	let n = e.bodyRoleId == null ? t : String(e.bodyRoleId).trim();
	if (!xa.test(n)) throw Error("bodyRoleId must be null, '<characterId>:<unit>' or '<characterId>'.");
	let r = e.motionRoleId == null ? null : String(e.motionRoleId).trim();
	if (r !== null && !xa.test(r)) throw Error("motionRoleId must be null, '<characterId>:<unit>' or '<characterId>'.");
	let i = (t) => {
		let n = e[t];
		if (!Number.isInteger(n) || Number(n) <= 0) throw Error(`${t} must be a positive integer.`);
		return Number(n);
	}, a = e.headPackagePath, o = a == null ? null : String(a).trim();
	if (o !== null && (o.length === 0 || o.length > 1024 || o.includes("\0"))) throw Error("headPackagePath must be null or a non-empty string of at most 1024 characters without NUL bytes.");
	let s = e.headOptionalCostume3dId == null ? null : i("headOptionalCostume3dId");
	return {
		roleId: t,
		bodyRoleId: n,
		bodyCostume3dId: i("bodyCostume3dId"),
		headCostume3dId: i("headCostume3dId"),
		headPackagePath: o,
		hairCostume3dId: i("hairCostume3dId"),
		headOptionalCostume3dId: s,
		motionRoleId: r
	};
}
//#endregion
//#region src/engine/prefabNodeLookup.ts
function Ca(e) {
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
var wa = 7, Ta = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => Oa(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(ka);
		return this.graph.root.updateMatrixWorld(!0), Da(this.setup, e);
	}
};
function Ea(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => Oa(e, t, n)).map(ka);
	return e.root.updateMatrixWorld(!0), Da(t, i);
}
function Da(e, t) {
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
function Oa(e, t, n) {
	let r = no(t.type) ?? "unknown", i = no(t.ownerPath), a = no(t.ownerName), o = Pa(e, i, a), s = Pa(e, no(t.worldUpObjectPath), no(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => ja(e, t, n, r !== "position"));
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
function ka(e) {
	let { source: t, type: n, ownerPath: r, ownerName: i, owner: a, worldUpObject: o, sources: s, sourceDebug: c } = e, l = (e, t) => ({
		type: n,
		status: e,
		reason: t,
		ownerPath: r,
		ownerName: i,
		resolvedOwner: !!a.node,
		applied: !1,
		sources: c
	});
	if (t.enabled === !1 || t.active === !1) return l("skipped", "constraint component is disabled");
	if (!a.node) return l("unresolved", a.reason);
	if (s.length === 0) return l("unresolved", "constraint has no source transforms");
	let u = s.find((e) => !e.node);
	if (u) return l("unresolved", u.debug.sourceName ? `source transform ${u.debug.sourceName} was not uniquely resolved` : "constraint source transform was not resolved");
	let d = s.filter(Na);
	return n === "parent" ? qa(a.node, d, t) ? Aa(n, r, i, c, "parent constraint applied with height-scaled translation offsets") : l("skipped", "parent constraint has no positive source weight") : n === "rotation" ? Ya(a.node, d, t) ? Aa(n, r, i, c, "rotation constraint applied with weighted source rotations") : l("skipped", "rotation constraint has no positive source weight") : n === "position" ? Ja(a.node, d, t) ? Aa(n, r, i, c, "position constraint applied in the parent space") : l("skipped", "position constraint has no positive source weight") : n === "aim" ? Xa(a.node, d, t, o) ? Aa(n, r, i, c, "aim constraint applied with exported aim/up vectors") : l("skipped", "aim constraint target direction or source weight was invalid") : l("skipped", `unsupported constraint type ${n}`);
}
function Aa(e, t, n, r, i) {
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
function ja(e, t, n, r) {
	let i = no(t.sourcePath), a = no(t.sourceName), o = r ? Ma(e, i, a) : Pa(e, i, null), s = ro(t.weight) ?? 1, c = eo(t.translationOffset, n), l = to(t.rotationOffset);
	return {
		node: o.node,
		weight: s,
		translationOffset: c,
		rotationOffset: l,
		debug: {
			sourcePath: i,
			sourceName: a,
			weight: s,
			resolvedSource: !!o.node,
			translationOffset: c ? {
				x: c.x,
				y: c.y,
				z: c.z
			} : null,
			rotationOffset: l ? {
				x: l.x,
				y: l.y,
				z: l.z
			} : null
		}
	};
}
function Ma(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return Pa(e, t, n);
}
function Na(e) {
	return !!e.node;
}
function Pa(e, t, n) {
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
var Fa = (t) => new e.Vector3(-t.x, t.y, t.z), Ia = (t) => new e.Quaternion(t.x, -t.y, -t.z, t.w), La = Fa, Ra = Ia;
function za(t) {
	return t.updateMatrixWorld(!0), Fa(t.getWorldPosition(new e.Vector3()));
}
function Ba(t) {
	return Ia(L(t, new e.Quaternion()));
}
function Va(t) {
	return new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "YXZ"));
}
function Ha(t) {
	let n = new e.Euler().setFromQuaternion(t, "YXZ");
	return new e.Vector3(e.MathUtils.radToDeg(n.x), e.MathUtils.radToDeg(n.y), e.MathUtils.radToDeg(n.z));
}
function Ua(t, n) {
	let r = t.clone().normalize(), i = new e.Vector3().crossVectors(n, r);
	if (i.lengthSq() < 1e-12) return new e.Quaternion().setFromUnitVectors(new e.Vector3(0, 0, 1), r);
	i = i.normalize();
	let a = new e.Vector3().crossVectors(r, i);
	return new e.Quaternion().setFromRotationMatrix(new e.Matrix4().makeBasis(i, a, r));
}
function Wa(t, n) {
	let r = t.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return null;
	let i = new e.Vector3();
	for (let e of t) {
		let t = Math.max(0, e.weight);
		if (t <= 0) continue;
		let a = za(e.node);
		n && a.add(n(e, Ba(e.node))), i.addScaledVector(a, t / r);
	}
	return i;
}
function Ga(e, t) {
	let n = null, r = 0;
	for (let i of e) {
		let e = Math.max(0, i.weight);
		e <= 0 || (n = $a(n, t(i), r, e), r += e);
	}
	return n;
}
function Ka(t, n, r, i, a = null) {
	let o = e.MathUtils.clamp(ro(n.weight) ?? 1, 0, 1), s = Ba(t.parent);
	if (i) {
		let r = s.clone().invert().multiply(i).normalize(), a = ro(n.rotationAxis) ?? wa, c = n.rotationAtRest ? Qa(n.rotationAtRest) : Ha(Ia(t.quaternion)), l = Ha(r), u = Va(new e.Vector3(Za(a, 1) ? l.x : c.x, Za(a, 2) ? l.y : c.y, Za(a, 4) ? l.z : c.z)), d = Va(c).slerp(u, o).normalize();
		t.quaternion.copy(Ra(d));
	}
	if (r && t.parent) {
		t.parent.updateMatrixWorld(!0);
		let i = Fa(t.parent.worldToLocal(La(r)));
		a && i.add(a);
		let s = ro(n.translationAxis) ?? wa, c = n.translationAtRest ? Qa(n.translationAtRest) : Fa(t.position), l = new e.Vector3(Za(s, 1) ? i.x : c.x, Za(s, 2) ? i.y : c.y, Za(s, 4) ? i.z : c.z);
		t.position.copy(La(c.clone().lerp(l, o)));
	}
	t.updateMatrix(), t.updateMatrixWorld(!0);
}
function qa(t, n, r) {
	let i = Wa(n, (t, n) => t.translationOffset ? Fa(t.translationOffset).applyQuaternion(n) : new e.Vector3()), a = Ga(n, (t) => Ba(t.node).multiply(t.rotationOffset ? Va(t.rotationOffset) : new e.Quaternion()));
	return !i || !a ? !1 : (Ka(t, r, i, a), !0);
}
function Ja(t, n, r) {
	let i = Wa(n);
	return i ? (Ka(t, r, i, null, r.translationOffset ? Qa(r.translationOffset) : new e.Vector3()), !0) : !1;
}
function Ya(e, t, n) {
	let r = Ga(t, (e) => Ba(e.node));
	if (!r) return !1;
	let i = to(n.rotationOffset);
	return i && r.multiply(Va(i)), Ka(e, n, null, r), !0;
}
function Xa(t, n, r, i) {
	let a = Wa(n);
	if (!a) return !1;
	let o = za(t), s = a.clone().sub(o);
	if (s.lengthSq() < 1e-12) return !1;
	let c = Qa(r.aimVector ?? {
		x: 0,
		y: 0,
		z: 1
	}), l = Qa(r.upVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), u = Qa(r.worldUpVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), d;
	switch (ro(r.worldUpType) ?? 0) {
		case 1:
			d = i ? za(i).sub(o) : new e.Vector3(0, 1, 0);
			break;
		case 2:
			d = i ? u.clone().applyQuaternion(Ba(i)) : u.clone();
			break;
		case 3:
			d = u.clone();
			break;
		case 4:
			d = null;
			break;
		default: d = new e.Vector3(0, 1, 0);
	}
	let f = d ? Ua(s, d).multiply(Ua(c, l).invert()) : new e.Quaternion().setFromUnitVectors(c.clone().normalize(), s.clone().normalize()), p = to(r.rotationOffset);
	return p && f.multiply(Va(p)), Ka(t, r, null, f.normalize()), !0;
}
function Za(e, t) {
	return (e & t) !== 0;
}
function Qa(t) {
	return I(t, new e.Vector3());
}
function $a(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function eo(t, n) {
	return !t || typeof t != "object" ? null : ir(I(t, new e.Vector3())).multiplyScalar(n);
}
function to(t) {
	return !t || typeof t != "object" ? null : I(t, new e.Vector3());
}
function no(e) {
	return typeof e == "string" ? e : null;
}
function ro(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function io(e, t) {
	let n = t, r = e.nodeByPath.get("body/Position");
	if (!r) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return r.scale.setScalar(n), r.updateMatrix(), e.root.updateMatrixWorld(!0), r;
}
function Z(e) {
	return e && typeof e == "object" ? e : {};
}
function ao(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function oo(e) {
	let t = Z(e), n = Z(t.pjskSpringBone ?? t.PjskSpringBone), r = Z(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version;
	return i === "0414" || i === 414 ? r : null;
}
function so(e) {
	let t = Z(e), n = Z(t.nativeMeshes ?? t.NativeMeshes), r = n.version;
	return r === "0414" || r === 414 ? n : null;
}
function Q(e, t) {
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
function co(e) {
	return e?.parentingMode === "model_combine_setup";
}
function lo(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function uo(e, t) {
	for (; e.children.length > 0;) lo(e.children[0], t);
}
function fo(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (lo(t, n), i.add(t), r.push(a));
	}
	return r;
}
function po(e, t, n) {
	e.parent && e.parent.remove(e);
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0, r.add(e);
	});
	for (let [e, n] of t.entries()) r.has(n) && t.delete(e);
	for (let [e, t] of n.entries()) r.has(t) && n.delete(e);
}
function mo(e, t, n) {
	for (let [r, i] of e.entries()) i === t && e.set(r, n);
}
function ho(e, t, n, r, i) {
	let a = r.childMoveSuffix ?? "_target", o = r.parentRootPath, s = r.childRootPath, c = Q(t, [r.parentCombineNodeAPath ?? r.parentAttachPath]), l = Q(t, [r.parentCombineNodeBPath]), u = Q(t, [r.childCombineNodeAPath ?? r.childOriginPath]), d = Q(t, [r.childCombineNodeBPath]), f = Q(t, [s]);
	if (!o || !s || !c || !l || !u || !d || !f) throw Error("Official model_combine_setup paths were not fully resolved.");
	uo(l.node, d.node);
	let p = c.node.parent, m = u.node.parent;
	if (p && m) {
		for (let e of [...p.children]) e.name.endsWith(a) && lo(e, m);
		let e = fo(t, i, t.get(o) ?? p), n = i.filter((t) => !e.includes(t));
		if (n.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${n.join(", ")}.`);
		let c = `${s}/${r.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		lo(u.node, p);
	}
	return u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), d.node.position.copy(l.node.position), d.node.quaternion.copy(l.node.quaternion), d.node.scale.copy(l.node.scale), d.node.updateMatrix(), mo(n, c.node, u.node), mo(n, l.node, d.node), po(l.node, t, n), po(c.node, t, n), po(f.node, t, n), t.set(c.path, u.node), t.set(l.path, d.node), r.parentAttachPath && t.set(r.parentAttachPath, u.node), r.parentCombineNodeBPath && t.set(r.parentCombineNodeBPath, d.node), e.updateMatrixWorld(!0), {
		bodyNodeA: c,
		bodyNodeB: l,
		faceNodeA: u,
		faceNodeB: d
	};
}
function go(e, t) {
	return [...new Set((oo(e)?.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.typeName === "SkinnedMeshRenderer").map((e) => e.transformPath).filter((e) => !!(e && e.startsWith(`${t}/`))))];
}
function _o(e, t) {
	let n = oo(e), r = n?.bodyHeadAssembly?.childRootPath, i = t.rendererTransformPath;
	if (!r || !i?.startsWith(`${r}/`)) return !1;
	let a = (n.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.transformPath === i);
	return a.length > 0 && a.every((e) => e.typeName !== "SkinnedMeshRenderer");
}
function vo(e, t) {
	return (so(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function yo(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	for (; typeof n.parentPathId == "number";) {
		if (typeof n.pathId == "number" && !r.add(n.pathId)) throw Error(`Runtime prefab graph contains a parent cycle at PathID ${n.pathId}.`);
		let e = t.get(n.parentPathId);
		if (!e) break;
		n = e;
	}
	return n;
}
function bo(e) {
	let t = e.transformPath?.split("/")[0];
	return t ? `${e.runtimePartIndex ?? -1}:${t}` : null;
}
function xo(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of so(e)?.meshes ?? []) {
		if (typeof r.rendererTransformPathId != "number") continue;
		let e = t.get(r.rendererTransformPathId);
		if (!e) continue;
		let i = yo(e, t), a = bo(e);
		if (!a || typeof i.pathId != "number") continue;
		let o = n.get(a);
		if (o !== void 0 && o !== i.pathId) throw Error(`Runtime native meshes reference multiple Unity prefab instances for '${a}' (${o}, ${i.pathId}).`);
		n.set(a, i.pathId);
	}
	return n;
}
function So(t, n) {
	let r = oo(t);
	if (!r?.prefabGraphs?.length) return null;
	let i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = wo(t);
	i.scale.setScalar(a.scale), i.userData.pjskSourceScaleCorrection = a;
	let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
	for (let e of r.prefabGraphs) for (let t of e.transforms ?? []) typeof t.pathId != "number" || !t.transformPath || (s.set(t.pathId, t), l.set(t.transformPath, (l.get(t.transformPath) ?? 0) + 1));
	let u = new Set([...l.entries()].filter(([, e]) => e > 1).map(([e]) => e)), d = xo(t, s);
	for (let t of r.prefabGraphs) for (let n of t.transforms ?? []) {
		if (typeof n.pathId != "number" || !n.transformPath) continue;
		let t = new e.Object3D();
		t.name = n.name ?? n.transformPath.split("/").pop() ?? `path_${n.pathId}`, t.userData.pjskTransformPath = n.transformPath, t.userData.pjskRuntimePartIndex = n.runtimePartIndex, t.userData.pjskPoseRoot = n.poseRoot ?? null, t.position.copy(ir(I(n.localPosition, new e.Vector3()))), t.quaternion.copy(or(nr(n.localRotation))), t.scale.copy(I(n.localScale, new e.Vector3(1, 1, 1))), t.updateMatrix(), o.set(n.pathId, t);
		let r = yo(n, s), i = d.get(bo(n) ?? "");
		(i === void 0 || i === r.pathId || !c.has(n.transformPath)) && c.set(n.transformPath, t);
	}
	for (let [e, t] of o.entries()) {
		let n = s.get(e)?.parentPathId;
		((typeof n == "number" ? o.get(n) : null) ?? i).add(t);
	}
	i.updateMatrixWorld(!0);
	let f = Co(i), p = r.bodyHeadAssembly;
	if (!co(p)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let m = Q(c, [p.parentAttachPath]), h = Q(c, [p.childRootPath]), g = Q(c, [p.childOriginPath]);
	if (!m || !h || !g) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let _ = go(t, h.path), v = ho(i, c, o, p, _), y = vo(t, m.path.split("/")[0]), b = y ? c.get(y) ?? null : null, x = Co(i), ee = f - x, S = [];
	if (n) {
		let e = Ca(n);
		for (let [t, n] of c.entries()) {
			let r = e.get(t);
			r && S.push({
				source: n,
				target: r
			});
		}
	}
	let te = {
		active: !0,
		sourcePath: v.bodyNodeA.path,
		targetPath: v.faceNodeA.path,
		reason: null,
		setupVersion: String(r.version ?? ""),
		sourceScaleCorrection: a,
		mountedHeadRootCount: 1,
		mountedHeadOriginPaths: [v.faceNodeA.path],
		assemblyCounts: {
			inputTransforms: f,
			retainedTransforms: x,
			removedTransforms: ee,
			capturedCommonRemovedTransforms: 14,
			removedAtLeastCapturedCommonCount: ee >= 14
		},
		targetCount: S.length,
		targetPaths: S.slice(0, 24).map((e) => String(e.source.userData.pjskTransformPath ?? e.source.name)),
		keyNodes: {
			runtimeMount: null,
			modelCombineBodyNeck: zo(v.bodyNodeA.node, i),
			modelCombineFaceNeck: zo(v.faceNodeA.node, i)
		}
	};
	return {
		root: i,
		nodeByPath: c,
		nodeByPathId: o,
		ambiguousPaths: u,
		meshCarrierBindings: S,
		bodyAttach: v.faceNodeA.node,
		bodyAttachPath: m.path,
		headRoot: v.faceNodeA.node,
		headRootPath: v.faceNodeA.path,
		headOrigin: v.faceNodeA.node,
		headOriginPath: v.faceNodeA.path,
		bodyRootBone: b,
		bodyRootBonePath: y,
		headRendererPaths: _,
		debug: te
	};
}
function Co(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function wo(e) {
	let t = Z(e), n = Z(t.character ?? t.Character), r = Z(t.bodyManifest ?? t.BodyManifest);
	return {
		characterHeightMeters: ao(n.characterHeightMeters ?? n.CharacterHeightMeters ?? r.CharacterHeightMeters ?? r.characterHeightMeters),
		scale: 1,
		reason: "presentation-module-applies-position-scale"
	};
}
function To(t, n) {
	let r = so(n), i = r?.meshes ?? [];
	if (!r || i.length === 0) return {
		meshCount: 0,
		boneCount: t.nodeByPath.size,
		skinnedMeshCount: 0,
		skinBindings: [],
		error: "Unity runtime nativeMeshes version 0414 is missing or empty.",
		warnings: r?.warnings ?? []
	};
	let a = 0, o = 0, s = [], c = [...r.warnings ?? []], l = [];
	t.root.updateMatrixWorld(!0);
	for (let r of i) {
		if (_o(n, r)) continue;
		let i = r.rendererTransformPath, u = r.bonePaths ?? [], d = r.bonePathIds ?? [], f = [
			...typeof r.rendererTransformPathId == "number" ? [] : [i],
			...d.length === 0 ? u : [],
			...typeof r.rootBonePathId == "number" ? [] : [r.rootBonePath]
		].filter((e) => !!(e && t.ambiguousPaths.has(e)));
		if (f.length > 0) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has an ambiguous legacy PathID-less skin binding (${[...new Set(f)].join(", ")}); regenerate it with a current Haruki-3D-Exporter.`;
			c.push(e), l.push(e);
			continue;
		}
		if (d.length > 0 && d.length !== u.length) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has ${u.length} bone paths but ${d.length} bone PathIDs; regenerate it with a current Haruki-3D-Exporter.`;
			c.push(e), l.push(e);
			continue;
		}
		let p = typeof r.rendererTransformPathId == "number" ? t.nodeByPathId.get(r.rendererTransformPathId) : i ? t.nodeByPath.get(i) : null;
		if (!p) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' skipped: renderer transform '${i ?? "<null>"}' was not found.`;
			c.push(e), l.push(e);
			continue;
		}
		let m = ko(r);
		if (!m) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' skipped: invalid geometry payload.`;
			c.push(e), l.push(e);
			continue;
		}
		let h = r.submeshes ?? [];
		if (h.length === 0 || m.groups.length !== h.length) {
			m.dispose();
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has no exact submesh/material-slot mapping.`;
			c.push(e), l.push(e);
			continue;
		}
		let g = h.map((t, n) => {
			if (!t.materialKey || typeof t.slotIndex != "number") throw Error(`Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has a submesh without material identity; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			if (t.slotIndex !== n) throw Error(`Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' material slot ${t.slotIndex} is out of order; expected ${n}.`);
			let i = new e.MeshBasicMaterial({
				color: 16777215,
				vertexColors: m.hasAttribute("color")
			});
			return i.name = t.materialName ?? r.meshName ?? r.meshPath ?? "native_material", i.userData.pjskMaterialKey = t.materialKey, i.userData.pjskMaterialSlotIndex = t.slotIndex, i.userData.pjskPlaceholderMaterial = !0, i;
		}), _ = r.meshName ?? r.meshPath?.split("/").pop() ?? "UnityNativeMesh", v = u.map((e, n) => d.length > 0 ? t.nodeByPathId.get(d[n]) : t.nodeByPath.get(e)).filter((e) => !!e), y, b = null, x = [];
		if (u.length > 0) {
			if (v.length !== u.length) {
				let e = `Native mesh '${r.meshPath ?? _}' skipped: ${u.length - v.length} skin bones were unresolved.`;
				c.push(e), l.push(e), m.dispose();
				continue;
			}
			let t = new e.SkinnedMesh(m, g);
			y = t, b = t, x = v, o += 1;
		} else y = new e.Mesh(m, g);
		if (y.name = _, y.userData.pjskNativeUnityMesh = !0, y.userData.pjskPartKind = r.partKind ?? null, y.userData.pjskRendererPathId = r.rendererPathId ?? null, y.frustumCulled = !1, p.add(y), b) {
			t.root.updateMatrixWorld(!0), b.updateMatrixWorld(!0);
			let n = Oo(r, x.length, c), a = b.matrixWorld.clone();
			if (n.length > 0) {
				let e = a.clone().invert();
				for (let t of n) t.multiply(e);
			}
			let o = new e.Skeleton(x, n.length > 0 ? n : void 0);
			n.length === 0 && o.calculateInverses(), b.bind(o, a);
			let l = Eo(x[0], o.boneInverses[0]), u = Do(x, o.boneInverses), d = i && t.headRendererPaths.includes(i) ? t.bodyRootBone ?? null : typeof r.rootBonePathId == "number" ? t.nodeByPathId.get(r.rootBonePathId) ?? null : r.rootBonePath ? t.nodeByPath.get(r.rootBonePath) ?? null : null;
			y.userData.pjskUnityRootBone = d, s.push({
				meshName: _,
				partKind: r.partKind ?? null,
				rendererTransformPath: i ?? null,
				rootBonePath: r.rootBonePath ?? null,
				rootBoneResolved: typeof r.rootBonePathId == "number" ? t.nodeByPathId.has(r.rootBonePathId) : r.rootBonePath ? t.nodeByPath.has(r.rootBonePath) : !1,
				effectiveRootBonePath: i && t.headRendererPaths.includes(i) ? t.bodyRootBonePath : r.rootBonePath ?? null,
				effectiveRootBoneResolved: i && t.headRendererPaths.includes(i) ? !!t.bodyRootBone : typeof r.rootBonePathId == "number" ? t.nodeByPathId.has(r.rootBonePathId) : r.rootBonePath ? t.nodeByPath.has(r.rootBonePath) : !1,
				boneCount: x.length,
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
		error: l.length > 0 ? l.join(" ") : a > 0 ? null : "Unity runtime nativeMeshes did not produce any renderable mesh.",
		warnings: c
	};
}
function Eo(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: Lo(i),
		restScale: Lo(o)
	};
}
function Do(t, n) {
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
function Oo(t, n, r) {
	let i = t.boneInverseBindMatrices ?? [];
	if (n === 0 || i.length === 0) {
		if (n === 0 && i.length === 0) return [];
		throw Error(`Native mesh inverse bind matrices are missing for ${n} bones.`);
	}
	if (i.length !== n * 16) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has ${i.length} inverse bind matrix floats for ${n} bones; expected ${n * 16}.`);
	let a = [];
	for (let t = 0; t < i.length; t += 16) a.push(new e.Matrix4().fromArray(i, t));
	return a;
}
function ko(t) {
	let n = t.positions ?? [];
	if (n.length === 0 || n.length % 3 != 0) return null;
	let r = n.length / 3, i = new e.BufferGeometry();
	if (i.setAttribute("position", new e.Float32BufferAttribute(n, 3)), $(t, "normals", r * 3), $(t, "tangents", r * 4), $(t, "uv0", r * 2), $(t, "uv1", r * 2), $(t, "uv2", r * 2), $(t, "colors", r * 4), $(t, "skinIndices", r * 4), $(t, "skinWeights", r * 4), (t.skinIndices?.length ?? 0) !== (t.skinWeights?.length ?? 0)) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has incomplete skin indices/weights.`);
	(t.normals?.length ?? 0) > 0 && i.setAttribute("normal", new e.Float32BufferAttribute(t.normals, 3)), (t.tangents?.length ?? 0) > 0 && i.setAttribute("tangent", new e.Float32BufferAttribute(t.tangents, 4)), (t.uv0?.length ?? 0) > 0 && i.setAttribute("uv", new e.Float32BufferAttribute(t.uv0, 2)), (t.uv1?.length ?? 0) > 0 && i.setAttribute("uv1", new e.Float32BufferAttribute(t.uv1, 2)), (t.uv2?.length ?? 0) > 0 && i.setAttribute("uv2", new e.Float32BufferAttribute(t.uv2, 2)), (t.colors?.length ?? 0) > 0 && i.setAttribute("color", new e.Float32BufferAttribute(t.colors, 4)), (t.skinIndices?.length ?? 0) > 0 && i.setAttribute("skinIndex", new e.Uint16BufferAttribute(t.skinIndices, 4)), (t.skinWeights?.length ?? 0) > 0 && i.setAttribute("skinWeight", new e.Float32BufferAttribute(t.skinWeights, 4));
	let a = [];
	for (let e of t.submeshes ?? []) {
		let n = a.length, o = e.indices ?? [];
		if (o.length === 0 || o.some((e) => !Number.isInteger(e) || e < 0 || e >= r)) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has invalid submesh indices.`);
		a.push(...o), i.addGroup(n, o.length, i.groups.length);
	}
	a.length > 0 && i.setIndex(a);
	let o = [], s = [], c = [], l = /* @__PURE__ */ new Set();
	for (let n of t.morphTargets ?? []) {
		let i = n.name;
		if (typeof i != "string" || i.trim().length === 0) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has a morph target without a name.`);
		if (l.has(i)) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has duplicate target name '${i}'.`);
		if (l.add(i), n.hasPositionDeltas !== !0) throw Error(`Native morph target '${i}' must explicitly declare position deltas present with hasPositionDeltas=true.`);
		if (typeof n.hasNormalDeltas != "boolean") throw Error(`Native morph target '${i}' must explicitly declare hasNormalDeltas.`);
		if (typeof n.hasTangentDeltas != "boolean") throw Error(`Native morph target '${i}' must explicitly declare hasTangentDeltas.`);
		let a = n.indices, u = n.positionDeltas, d = n.normalDeltas, f = n.tangentDeltas;
		if (!a || a.length === 0) throw Error(`Native morph target '${i}' must contain a non-empty indices array.`);
		if (!u || u.length !== a.length * 3) throw Error(`Native morph target '${i}' has invalid positionDeltas length.`);
		if (!d || d.length !== (n.hasNormalDeltas ? a.length * 3 : 0)) throw Error(`Native morph target '${i}' has invalid normalDeltas length for hasNormalDeltas=${n.hasNormalDeltas}.`);
		if (!f || f.length !== (n.hasTangentDeltas ? a.length * 3 : 0)) throw Error(`Native morph target '${i}' has invalid tangentDeltas length for hasTangentDeltas=${n.hasTangentDeltas}.`);
		if (!Array.from(u).every(Number.isFinite) || !Array.from(d).every(Number.isFinite) || !Array.from(f).every(Number.isFinite)) throw Error(`Native morph target '${i}' delta arrays must contain only finite numbers.`);
		let p = new Float32Array(r * 3), m = n.hasNormalDeltas ? new Float32Array(r * 3) : null, h = n.hasTangentDeltas ? new Float32Array(r * 3) : null, g = /* @__PURE__ */ new Set();
		for (let e = 0; e < a.length; e += 1) {
			let t = a[e];
			if (!Number.isInteger(t) || t < 0 || t >= r) throw Error(`Native morph target '${i}' has invalid vertex index ${t}.`);
			if (g.has(t)) throw Error(`Native morph target '${i}' has duplicate vertex index ${t}.`);
			g.add(t), p[t * 3] = u[e * 3], p[t * 3 + 1] = u[e * 3 + 1], p[t * 3 + 2] = u[e * 3 + 2], m && (m[t * 3] = d[e * 3], m[t * 3 + 1] = d[e * 3 + 1], m[t * 3 + 2] = d[e * 3 + 2]), h && (h[t * 3] = f[e * 3], h[t * 3 + 1] = f[e * 3 + 1], h[t * 3 + 2] = f[e * 3 + 2]);
		}
		let _ = new e.BufferAttribute(p, 3);
		if (_.name = i, o.push(_), m) {
			let t = new e.BufferAttribute(m, 3);
			t.name = i, s.push(t);
		}
		if (h) {
			let t = new e.BufferAttribute(h, 3);
			t.name = i, c.push(t);
		}
	}
	if (o.length > 0 && (i.morphAttributes.position = o, i.morphTargetsRelative = !0), s.length > 0 && s.length !== o.length) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has mixed normal delta presence across morph targets.`);
	if (s.length > 0 && (i.morphAttributes.normal = s), c.length > 0 && c.length !== o.length) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has mixed tangent delta presence across morph targets.`);
	if (c.length > 0) {
		let e = i.morphAttributes;
		e.tangent = c;
	}
	return i.computeBoundingSphere(), i;
}
function $(e, t, n) {
	let r = e[t] ?? [];
	if (r.length !== 0 && r.length !== n) throw Error(`Native mesh '${e.meshPath ?? e.meshName ?? "<unnamed>"}' attribute '${t}' has ${r.length} values; expected ${n}.`);
}
function Ao(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : Ea(e, oo(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function jo(e, t, n) {
	let r = oo(t)?.constraintSetup;
	return r ? new Ta(e, r, n) : null;
}
function Mo(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: No(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = oo(t)?.bodyHeadAssembly, o = Ca(i), s = (t) => {
		let n = Q(e.nodeByPath, t) ?? Po(o, t);
		return n ? zo(n.node, i) : null;
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
		positionRoots: Bo(i),
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
function No(e) {
	let t = Z(e), n = Z(t.pjskSpringBone ?? t.PjskSpringBone), r = Z(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup);
	return String(r.version ?? r.Version ?? "");
}
function Po(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function Fo(e) {
	return e.replace(/_\d+$/, "");
}
function Io(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? Fo(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function Lo(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function Ro(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function zo(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), L(t, i), a.applyQuaternion(i).normalize(), {
		path: Io(t, n),
		canonicalPath: Io(t, n, !0),
		parentPath: t.parent && t.parent !== n ? Io(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: Lo(t.position),
		localQuaternion: Ro(t.quaternion),
		worldPosition: Lo(r),
		worldQuaternion: Ro(i),
		worldForward: Lo(a)
	};
}
function Bo(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = Io(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(zo(r, e)));
	}), t;
}
//#endregion
export { Sn as A, jn as C, P as D, Rn as E, nt as F, f as I, a as L, un as M, Wt as N, _n as O, Rt as P, r as R, On as S, Dn as T, ir as _, Mo as a, rr as b, Sa as c, gr as d, wr as f, Br as g, Vr as h, To as i, cn as j, Cn as k, ii as l, Mr as m, So as n, Ao as o, Pr as p, jo as r, Ca as s, io as t, vi as u, or as v, Nn as w, I as x, L as y };
