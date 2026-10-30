import { M as e, O as t, j as n } from "./unityPrefabRuntime-BiYdXsAt.js";
import { o as r, t as i } from "./partBuilder-BINYc9p5.js";
import { t as a } from "./brotliWasmRuntime-BtvLObJW.js";
//#region src/original/originalBundleStore.ts
function o(e, t) {
	if (!e) throw Error(t);
}
var s = [
	85,
	110,
	105,
	116,
	121,
	70,
	83,
	0
], c = (e) => s.every((t, n) => e[n] === t), l = class {
	baseUrl;
	decompress;
	cacheBytes;
	indexPromise = null;
	open = /* @__PURE__ */ new Map();
	sizes = /* @__PURE__ */ new Map();
	byCabName = /* @__PURE__ */ new Map();
	total = 0;
	constructor(e, t, n = 384 * 1024 * 1024) {
		this.baseUrl = e, this.decompress = t, this.cacheBytes = n;
	}
	index() {
		return this.indexPromise ??= fetch(new URL("original/bundles.json", this.baseUrl)).then(async (e) => {
			o(e.ok, `original bundle index: HTTP ${e.status}`);
			let t = await e.json();
			return o(t.version === 1, `original bundle index version ${t.version}`), t;
		}), this.indexPromise;
	}
	async has(e) {
		return e in (await this.index()).bundles;
	}
	byCab(e) {
		return this.byCabName.get(e) ?? null;
	}
	async load(e) {
		let t = await this.loadOne(e);
		return await Promise.all(t.assetBundle.m_Dependencies.map((e) => this.load(e))), t;
	}
	loadOne(t) {
		let n = this.open.get(t);
		return n ? (this.open.delete(t), this.open.set(t, n), n) : (n = (async () => {
			let n = (await this.index()).bundles[t];
			o(n, `original bundle ${t} is not in the store`);
			let r = await fetch(new URL(n.file, this.baseUrl));
			o(r.ok, `original bundle ${t}: HTTP ${r.status}`);
			let i = new Uint8Array(await r.arrayBuffer());
			c(i) || (i = await this.decompress(i)), o(i.length === n.rawSize, `original bundle ${t}: ${i.length} bytes, index says ${n.rawSize}`);
			let a = new e(t, i);
			return this.byCabName.set(a.cabName, a), this.sizes.set(t, i.length), this.total += i.length, this.evict(t), a;
		})(), this.open.set(t, n), n.catch(() => this.open.delete(t)), n);
	}
	evict(e) {
		for (let t of this.open.keys()) {
			if (this.total <= this.cacheBytes) break;
			if (t === e || t === "shader/live") continue;
			let n = this.sizes.get(t) ?? 0;
			this.open.get(t).then((e) => this.byCabName.delete(e.cabName)), this.open.delete(t), this.sizes.delete(t), this.total -= n;
		}
	}
}, u = /* @__PURE__ */ new Map();
function d(e, t) {
	let n = u.get(e);
	if (!n) {
		let r = a(t);
		n = new l(e, async (e) => (await r).decompress(e)), u.set(e, n);
	}
	return n;
}
async function f(e) {
	let t = d(e.baseUrl, e.brotliWasmUrl), i = {};
	return await Promise.all(e.bundleNames.map(async (e) => {
		if (!await t.has(e)) {
			i[e] = null;
			return;
		}
		let a = await t.load(e);
		i[e] = a.assetBundle.m_Container.map((e) => a.object(e.second.asset.m_PathID)).filter((e) => e?.classId === n.AnimationClip).map((e) => r(e.read()));
	})), { clips: i };
}
async function p(e) {
	let n = d(e.baseUrl, e.brotliWasmUrl), [r, a] = await Promise.all([n.load(e.bundleName), e.colorBundleName ? n.load(e.colorBundleName) : Promise.resolve(null)]), o = i({
		entry: e.entry,
		partType: e.partType,
		bundle: r,
		colorBundle: a,
		resolveBundle: (e) => n.byCab(e),
		characterHeightMeters: e.characterHeightMeters,
		attachNode: e.attachNode
	}), s = {};
	for (let e of o.materialSlots ?? []) for (let r of e.rawMaterial.textureProperties) {
		if (!r.uri || s[r.uri]) continue;
		let e = /^original:([^:]+):(-?\d+)$/.exec(r.uri), i = n.byCab(e[1]);
		if (!i) throw Error(`texture bundle ${e[1]} is not loaded`);
		s[r.uri] = t(i, BigInt(e[2]));
	}
	return {
		runtime: o,
		textures: s
	};
}
function m(e, t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set()) {
	if (!e || typeof e != "object") return t;
	if (ArrayBuffer.isView(e)) return e.buffer instanceof ArrayBuffer && e.byteOffset === 0 && e.byteLength === e.buffer.byteLength && e.byteLength > 0 && t.add(e.buffer), t;
	if (n.has(e)) return t;
	n.add(e);
	for (let r of Array.isArray(e) ? e : Object.values(e)) m(r, t, n);
	return t;
}
typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope && (self.onmessage = async (e) => {
	let { id: t, ...n } = e.data;
	try {
		let e = "kind" in n && n.kind === "clips" ? await f(n) : await p(n);
		self.postMessage({
			id: t,
			...e
		}, [...m(e)]);
	} catch (e) {
		self.postMessage({
			id: t,
			error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
		});
	}
});
//#endregion
export { p as buildOriginalPartRequest, f as loadOriginalClipsRequest };
