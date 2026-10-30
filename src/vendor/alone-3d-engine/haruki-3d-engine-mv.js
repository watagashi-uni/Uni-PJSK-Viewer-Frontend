import { t as e } from "./kernelVersion-C1zz-irZ.js";
//#region src/mv/VirtualLiveGyro.ts
var t = Math.PI / 180, n = (e, t, n) => {
	let r = Math.cos(e / 2), i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.sin(e / 2), s = Math.sin(t / 2), c = Math.sin(n / 2);
	return {
		x: o * i * a + r * s * c,
		y: r * s * a - o * i * c,
		z: r * i * c - o * s * a,
		w: r * i * a + o * s * c
	};
}, r = (e, t) => ({
	x: e.x * t.w + e.w * t.x + e.y * t.z - e.z * t.y,
	y: e.y * t.w + e.w * t.y + e.z * t.x - e.x * t.z,
	z: e.z * t.w + e.w * t.z + e.x * t.y - e.y * t.x,
	w: e.w * t.w - e.x * t.x - e.y * t.y - e.z * t.z
}), i = (e) => {
	let t = e / 2, n = Math.sin(t);
	return {
		x: 0 * n,
		y: 0 * n,
		z: 1 * n,
		w: Math.cos(t)
	};
};
function a(e, a, o, s) {
	if (![
		e,
		a,
		o,
		s
	].every(Number.isFinite)) throw TypeError("Device orientation angles must be finite.");
	let c = n(a * t, e * t, -(o * t));
	return c = r(c, {
		x: -Math.SQRT1_2,
		y: 0,
		z: 0,
		w: Math.SQRT1_2
	}), c = r(c, i(-(s * t))), {
		x: -c.x,
		y: -c.y,
		z: c.z,
		w: c.w
	};
}
async function o(e, t) {
	if (typeof window > "u" || typeof DeviceOrientationEvent > "u") throw Error("Device orientation is not available on this platform.");
	if (!window.isSecureContext) throw Error("Device orientation requires a secure browser context.");
	let n = DeviceOrientationEvent;
	if (n.requestPermission && await n.requestPermission() !== "granted") throw Error("Device orientation permission was not granted.");
	if (t?.aborted) throw Error("The MV runtime has been destroyed.");
	let r = (t) => {
		t.alpha == null || t.beta == null || t.gamma == null || [
			t.alpha,
			t.beta,
			t.gamma
		].every(Number.isFinite) && e(a(t.alpha, t.beta, t.gamma, window.screen.orientation?.angle ?? 0));
	}, i = () => {
		window.removeEventListener("deviceorientation", r), t?.removeEventListener("abort", i);
	};
	return window.addEventListener("deviceorientation", r), t?.addEventListener("abort", i, { once: !0 }), i;
}
//#endregion
//#region src/mv/HarukiMvBridge.ts
var s = "HarukiMvBridge", c = {
	"720p": {
		width: 1280,
		height: 720
	},
	"1080p": {
		width: 1920,
		height: 1080
	},
	"1440p": {
		width: 2560,
		height: 1440
	},
	"4k-uhd": {
		width: 3840,
		height: 2160
	}
}, l = 0, u = 0;
function d() {
	let e = globalThis;
	return e.__harukiMvHostBytes ??= /* @__PURE__ */ new Map();
}
function f(e) {
	return typeof e == "string" || e instanceof URL;
}
async function p(e, t) {
	let n;
	if (e instanceof Uint8Array) n = e;
	else if (ArrayBuffer.isView(e)) n = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
	else if (e instanceof ArrayBuffer) n = new Uint8Array(e);
	else if (typeof Blob < "u" && e instanceof Blob) n = new Uint8Array(await e.arrayBuffer());
	else if (typeof Response < "u" && e instanceof Response) {
		if (!e.ok) throw Error(`${t} response failed (${e.status} ${e.statusText}).`);
		n = new Uint8Array(await e.arrayBuffer());
	} else throw TypeError(`${t} must be an ArrayBuffer, typed array, DataView, Blob, Response or URL.`);
	if (n.byteLength === 0 || n.byteLength > 2147483647) throw RangeError(`${t} is ${n.byteLength} bytes.`);
	return n;
}
async function m(e, t, n) {
	if (f(e)) return {
		fields: { url: new URL(String(e), globalThis.location?.href).href },
		release() {}
	};
	let r = await p(e, t), i = `haruki-mv-${n}-bytes-${++u}`;
	return d().set(i, r), {
		fields: {
			hostBytesId: i,
			length: r.byteLength
		},
		release() {
			d().delete(i);
		}
	};
}
async function h(e, t, n) {
	if (f(e)) return new URL(String(e), globalThis.location?.href).href;
	let r;
	if (typeof Blob < "u" && e instanceof Blob) r = e;
	else if (typeof Response < "u" && e instanceof Response) {
		if (!e.ok) throw Error(`${t} response failed (${e.status} ${e.statusText}).`);
		r = await e.blob();
	} else r = new Blob([await p(e, t)]);
	if (r.size === 0) throw RangeError(`${t} is empty.`);
	let i = URL.createObjectURL(r);
	return n.add(i), i;
}
function g(e) {
	let t = 0, n, r = 0, i = ++l, a = 0, c = () => {
		++r;
		let e = n;
		n = void 0, e?.();
	}, u = (n, r, o, c = !1, l) => {
		if (t > 0 && !c) throw Error("Another MV bridge operation is still pending.");
		let u = globalThis.window;
		if (!u?.addEventListener) throw Error("MV bridge completion events require a browser window.");
		if (e.signal?.aborted) throw e.signal.reason instanceof Error ? e.signal.reason : /* @__PURE__ */ Error("Haruki MV runtime has been destroyed.");
		let d = `haruki-mv-${i}-${++a}`, f = {
			...r,
			requestId: d
		};
		return ++t, new Promise((r, i) => {
			let a = () => {
				--t, u.removeEventListener("haruki-mv", p), e.signal?.removeEventListener("abort", c);
			}, c = () => {
				a(), i(e.signal?.reason instanceof Error ? e.signal.reason : /* @__PURE__ */ Error("Haruki MV runtime has been destroyed."));
			}, p = (e) => {
				let t = e.detail;
				if (!t || t.type !== o && t.type !== "error" && !l) return;
				let n = t.payload;
				try {
					n = t.payload ? JSON.parse(t.payload) : void 0;
				} catch {}
				if (!(typeof n != "object" || !n || !("requestId" in n) || n.requestId !== d)) {
					if (t.type !== o && t.type !== "error") {
						try {
							l?.(t.type ?? "", n, d);
						} catch (e) {
							a(), i(e);
						}
						return;
					}
					if (a(), t.type === "error") {
						let e = typeof n == "object" && n && "message" in n ? String(n.message) : String(n ?? "MV bridge operation failed.");
						i(Error(e));
						return;
					}
					if (typeof n == "object" && n && "dataJson" in n && typeof n.dataJson == "string") {
						r(JSON.parse(n.dataJson));
						return;
					}
					r(n);
				}
			};
			u.addEventListener("haruki-mv", p), e.signal?.addEventListener("abort", c, { once: !0 });
			try {
				e.sendMessage(s, n, JSON.stringify(f));
			} catch (e) {
				a(), i(e);
			}
		});
	}, d = async (e, t) => {
		let n = await m(typeof e == "object" && e && !f(e) && !ArrayBuffer.isView(e) && !(e instanceof ArrayBuffer) && !(typeof Blob < "u" && e instanceof Blob) && !(typeof Response < "u" && e instanceof Response) ? new TextEncoder().encode(JSON.stringify(e)) : e, t, i);
		return {
			input: n,
			master: "url" in n.fields ? { masterDataUrl: n.fields.url } : {
				masterDataHostBytesId: n.fields.hostBytesId,
				masterDataLength: n.fields.length
			}
		};
	}, p = (t, n, r, a, o, c, l) => {
		if (typeof a.provideBundle != "function") throw TypeError("provideBundle is required.");
		a.signal?.throwIfAborted();
		let d = new AbortController(), f, p = !1, g = (t) => {
			if (!f || p || d.signal.aborted) return;
			p = !0;
			let n = t ?? a.signal?.reason, r = n instanceof Error ? n.message : String(n ?? "The page cancelled the load.");
			e.sendMessage(s, "CancelOriginalBundleSet", JSON.stringify({
				requestId: f,
				reason: r
			}));
		}, _ = () => g(), v = async (t, n) => {
			let r, o;
			try {
				let e = l ? a.provideWebGlBundle?.(t) : void 0;
				e === void 0 ? l ? o = { url: await h(await a.provideBundle(t, {
					version: n,
					signal: d.signal
				}), `Original bundle '${t.bundleName}'`, l) } : (r = await m(await a.provideBundle(t, {
					version: n,
					signal: d.signal
				}), `Original bundle '${t.bundleName}'`, i), o = r.fields) : o = {
					url: new URL(String(e), globalThis.location?.href).href,
					webglReady: !0
				};
			} catch (e) {
				o = { error: e instanceof Error ? e.message : String(e) };
			}
			try {
				d.signal.aborted || e.sendMessage(s, "SupplyOriginalBundle", JSON.stringify({
					requestId: f,
					bundleName: t.bundleName,
					...o
				}));
			} finally {
				r?.release();
			}
		}, y = (e, t, n) => {
			if (f = n, a.signal?.aborted) {
				g();
				return;
			}
			let r = t;
			if (e === "original-bundle-set-plan") try {
				a.onPlan?.(r.bundles ?? [], r.version ?? "");
			} catch (e) {
				g(e);
			}
			else if (e === "original-bundle-request") for (let e of r.bundles ?? []) v(e, r.version ?? "");
			else try {
				c?.(e, t);
			} catch (e) {
				g(e);
			}
		};
		a.signal?.addEventListener("abort", _, { once: !0 });
		let b = u(t, n, r, !1, y);
		return o?.(), b.finally(() => {
			d.abort(), a.signal?.removeEventListener("abort", _);
		});
	}, g = /* @__PURE__ */ new Set(), _ = () => {
		for (let e of g) URL.revokeObjectURL(e);
		g = /* @__PURE__ */ new Set();
	};
	return {
		async loadStreamingLiveArchiveShow(e) {
			if (!Number.isSafeInteger(e?.archiveId) || e.archiveId <= 0) throw TypeError("A positive archiveId is required.");
			if (e.os !== void 0 && e.os !== "android" && e.os !== "ios") throw TypeError("Original bundle os must be android or ios.");
			let t = e.chapterIndex ?? -1, n = e.startSeconds ?? 0;
			if (!Number.isSafeInteger(t) || t < -1 || !Number.isFinite(n) || n < 0) throw TypeError("StreamingLive initial chapter and start time are invalid.");
			if (y(e.viewer), e.quality !== void 0 && !x(e.quality)) throw TypeError("StreamingLive quality must be 0, 1 or 2.");
			_();
			let r = g, { input: i, master: a } = await d(e.masterData, "StreamingLive master data");
			try {
				return await p("LoadStreamingLiveArchiveShow", {
					archiveId: e.archiveId,
					os: e.os ?? "",
					viewer: e.viewer,
					chapterIndex: t,
					startSeconds: n,
					forceAfterEvent: e.forceAfterEvent ?? !1,
					quality: e.quality ?? -1,
					preloadBundles: e.preloadBundles ?? [],
					scheduleTimes: (e.schedule ?? []).map(([e]) => e),
					scheduleNames: (e.schedule ?? []).map(([, e]) => e),
					jumpTimes: (e.jumps ?? []).map(([e]) => e),
					jumpCounts: (e.jumps ?? []).map(([, e]) => e.length),
					jumpNames: (e.jumps ?? []).flatMap(([, e]) => e),
					...a
				}, "streaming-live-ready", e, i.release, (t, n) => {
					if (t === "streaming-live-show-bundles") {
						let t = n;
						e.onBundles?.(t.phase, {
							bundleCount: t.bundleCount,
							skipped: t.skipped ?? [],
							catalogDifferences: t.catalogDifferences ?? []
						});
					}
				}, r);
			} catch (e) {
				throw r === g && _(), e;
			} finally {
				i.release();
			}
		},
		setStreamingLivePaused(e) {
			if (typeof e != "boolean") throw TypeError("StreamingLive pause must be a boolean.");
			return u("SetStreamingLivePaused", { paused: e }, "streaming-live-state");
		},
		seekStreamingLive(e) {
			if (!Number.isFinite(e) || e < 0) throw TypeError("StreamingLive seek time must be finite and non-negative.");
			return u("SeekStreamingLive", { timeSeconds: e }, "streaming-live-state");
		},
		selectStreamingLiveChapter(e) {
			if (!Number.isSafeInteger(e) || e < 0) throw TypeError("StreamingLive chapter index must be a non-negative integer.");
			return u("SelectStreamingLiveChapter", { chapterIndex: e }, "streaming-live-state");
		},
		getStreamingLiveState() {
			return u("GetStreamingLiveState", {}, "streaming-live-state");
		},
		setStreamingLiveQuality(e) {
			if (!x(e)) throw TypeError("StreamingLive quality must be 0, 1 or 2.");
			return u("SetStreamingLiveQuality", { quality: e }, "streaming-live-state");
		},
		applyStreamingLiveInput(e) {
			return b(e), u("ApplyStreamingLiveInput", e, "streaming-live-state");
		},
		unloadStreamingLiveArchive() {
			return u("UnloadStreamingLiveArchive", {}, "streaming-live-unloaded", !0).finally(_);
		},
		async setAssetBundleInfo(e) {
			let t = await m(e, "AssetBundleInfo", i);
			try {
				let e = u("SetAssetBundleInfo", t.fields, "asset-bundle-info-ready");
				t.release();
				let n = await e;
				return {
					version: n.version,
					os: n.os ?? "",
					bundleCount: n.bundleCount
				};
			} finally {
				t.release();
			}
		},
		loadOriginalBundleSet(e) {
			if (!Array.isArray(e?.roots) || e.roots.length === 0 || e.roots.some((e) => typeof e != "string" || !e)) throw TypeError("An original bundle load needs nonempty root bundle names.");
			if (e.os !== void 0 && e.os !== "android" && e.os !== "ios") throw TypeError("Original bundle os must be android or ios.");
			return p("LoadOriginalBundleSet", {
				roots: e.roots,
				os: e.os ?? ""
			}, "original-bundle-set-ready", e).then((e) => {
				let t = e;
				return {
					bundleCount: t.bundleCount,
					catalogDifferences: t.catalogDifferences ?? []
				};
			});
		},
		async loadVirtualLiveShow(e) {
			if (!Number.isSafeInteger(e?.virtualLiveId) || e.virtualLiveId <= 0) throw TypeError("A positive virtualLiveId is required.");
			if (e.os !== void 0 && e.os !== "android" && e.os !== "ios") throw TypeError("Original bundle os must be android or ios.");
			e.viewer && y(e.viewer);
			let { input: t, master: n } = await d(e.masterData, "Virtual Live master data");
			try {
				return await p("LoadVirtualLiveShow", {
					virtualLiveId: e.virtualLiveId,
					os: e.os ?? "",
					includeLobby: e.includeLobby ?? !1,
					venue: e.venue ?? {},
					...e.viewer ? { viewer: e.viewer } : {},
					...n
				}, "virtual-live-ready", e, t.release, (t, n) => {
					if (t === "virtual-live-show-bundles") {
						let t = n;
						e.onBundles?.(t.phase, {
							bundleCount: t.bundleCount,
							skipped: t.skipped ?? [],
							catalogDifferences: t.catalogDifferences ?? []
						});
					}
				});
			} finally {
				t.release();
			}
		},
		async loadMvShow(e) {
			for (let t of ["musicId", "musicVocalId"]) if (!Number.isSafeInteger(e?.[t]) || e[t] <= 0) throw TypeError(`A positive ${t} is required.`);
			if (e.os !== void 0 && e.os !== "android" && e.os !== "ios") throw TypeError("Original bundle os must be android or ios.");
			let t = (e, t) => {
				if (!e || typeof e.unit != "string" || !e.unit || [
					"characterId",
					"headCostume3dId",
					"hairCostume3dId",
					"bodyCostume3dId"
				].some((t) => !Number.isSafeInteger(e[t]) || e[t] < 0) || e.characterId <= 0) throw TypeError(`${t} needs characterId, unit and head/hair/body costume3d ids.`);
				let { characterId: n, unit: r, headCostume3dId: i, hairCostume3dId: a, bodyCostume3dId: o } = e;
				return {
					characterId: n,
					unit: r,
					headCostume3dId: i,
					hairCostume3dId: a,
					bodyCostume3dId: o
				};
			};
			if (!Array.isArray(e.members) || e.members.length === 0) throw TypeError("The MV formation (members) is required.");
			let n = e.members.map((e, n) => t(e, `Member ${n}`)), r = (e.cutIns ?? []).map((e) => {
				if (!Number.isSafeInteger(e?.musicId) || e.musicId <= 0) throw TypeError("A cut-in needs its musicId.");
				return e.member ? {
					musicId: e.musicId,
					member: t(e.member, `Cut-in ${e.musicId} member`)
				} : { musicId: e.musicId };
			}), { input: i, master: a } = await d(e.masterData, "MV master data");
			try {
				return await p("LoadMvShow", {
					musicId: e.musicId,
					musicVocalId: e.musicVocalId,
					os: e.os ?? "",
					members: n,
					cutIns: r,
					enableCutIns: e.enableCutIns ?? !0,
					bestEffortCutIns: e.bestEffortCutIns ?? !1,
					canSkipDisplayMusicInfo: e.canSkipDisplayMusicInfo ?? !1,
					...e.musicInfo ? { musicInfo: e.musicInfo } : {},
					...a
				}, "mv-ready", e, i.release, (t, n) => {
					if (t === "mv-show-bundles") {
						let t = n;
						e.onBundles?.(t.phase, {
							bundleCount: t.bundleCount,
							skipped: t.skipped ?? [],
							catalogDifferences: t.catalogDifferences ?? []
						});
					}
				});
			} finally {
				i.release();
			}
		},
		instantiatePrefab(e) {
			if (!e.bundleName?.trim() || !e.assetName?.trim()) throw TypeError("MV prefab request bundleName and assetName are required.");
			return u("InstantiatePrefab", e, "prefab-ready");
		},
		readMvData(e) {
			if (!e.bundleName?.trim() || !e.assetName?.trim()) throw TypeError("MV data request bundleName and assetName are required.");
			return u("ReadMvData", e, "mv-data-ready");
		},
		getRenderProfile(e) {
			return u("GetRenderProfile", T(e), "render-profile-ready");
		},
		applyRenderProfile(t) {
			return u("ApplyRenderProfile", T(t), "render-profile-applied").then((t) => (e.setRenderSize(t.renderWidth, t.renderHeight), t));
		},
		setFrameRateLimit(e) {
			let t = e === "game" ? 0 : e;
			if (!Number.isInteger(t) || t < 0 || t > 1e3 || e !== "game" && t === 0) throw RangeError("Frame-rate limit must be \"game\" or a positive integer up to 1000.");
			return u("SetFrameRateLimit", { frameRate: t }, "frame-rate-applied");
		},
		setLoaderTuning(e) {
			let t = [
				"mvDownloads",
				"mvPrefetchBytes",
				"gcEveryBundles",
				"astcWorkers",
				"slDownloads",
				"slPrefetchBytes",
				"slExpandedBytes",
				"slFrameBudgetMs"
			], n = [
				"mvSyncLoad",
				"keepSourceLz4",
				"slPrefetchArchive",
				"slLazyOpen",
				"slOnDemand",
				"slLogOpens",
				"checksum",
				"catalogCrc"
			];
			if (!e || typeof e != "object") throw TypeError("Loader tuning must be an object.");
			for (let [r, i] of Object.entries(e)) if (t.includes(r) ? !Number.isSafeInteger(i) || i < 0 : !n.includes(r) || typeof i != "boolean") throw TypeError(`Invalid loader tuning field: ${r}.`);
			return u("SetLoaderTuning", e, "loader-tuning-applied");
		},
		skipVirtualLiveState() {
			e.sendMessage(s, "SkipVirtualLiveState", "");
		},
		applyVirtualLiveInput(e) {
			return u("ApplyVirtualLiveInput", e, "virtual-live-input");
		},
		async enableVirtualLiveGyro() {
			c();
			let t = ++r, i = await o((t) => {
				e.sendMessage(s, "ApplyVirtualLiveInput", JSON.stringify({
					operation: "gyroSample",
					rotation: t
				}));
			}, e.signal);
			if (t !== r) throw i(), Error("Gyro activation was superseded.");
			let a = !1, l = () => {
				a || (a = !0, i(), t === r && ++r, n === l && (n = void 0), e.signal?.aborted || e.sendMessage(s, "ApplyVirtualLiveInput", JSON.stringify({
					operation: "gyro",
					enabled: !1
				})));
			};
			n = l;
			try {
				await u("ApplyVirtualLiveInput", {
					operation: "gyro",
					enabled: !0
				}, "virtual-live-input");
			} catch (e) {
				throw l(), e;
			}
			if (t !== r) throw l(), Error("Gyro activation was superseded.");
			return l;
		},
		setCutInActive(t, n) {
			if (!Number.isInteger(t) || t < 0) throw RangeError("MV CutIn order must be a non-negative integer.");
			e.sendMessage(s, "SetCutInActive", JSON.stringify({
				cutInOrder: t,
				active: n
			}));
		},
		setCutInEnabled(t, n) {
			if (!Number.isInteger(t) || t < 0) throw RangeError("MV CutIn order must be a non-negative integer.");
			e.sendMessage(s, "SetCutInEnabled", JSON.stringify({
				cutInOrder: t,
				enabled: n
			}));
		},
		setPaused(t) {
			e.sendMessage(s, "SetPaused", JSON.stringify({ paused: t }));
		},
		setVolume(t) {
			if (!Number.isFinite(t) || t < 0 || t > 1) throw RangeError("MV volume must be finite and between 0 and 1.");
			e.sendMessage(s, "SetVolume", JSON.stringify({ volume: t }));
		},
		seek(t) {
			if (!Number.isFinite(t)) throw RangeError("MV seek time must be finite.");
			e.sendMessage(s, "Seek", JSON.stringify({ timeSeconds: t }));
		},
		retry() {
			c(), e.sendMessage(s, "Retry", "");
		},
		getState() {
			e.sendMessage(s, "GetState", "");
		},
		disposeScene() {
			return c(), u("Dispose", {}, "disposed");
		}
	};
}
function _(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= -2147483648 && e <= 2147483647;
}
function v(e) {
	if (typeof e != "string" || !/^[+-]?\d+$/.test(e.trim())) return !1;
	let t = BigInt(e.trim());
	return t >= -9223372036854775808n && t <= 9223372036854775807n;
}
function y(e) {
	if (!e || !v(e.userId) || typeof e.nickName != "string" || typeof e.defaultUserName != "string") throw TypeError("StreamingLive viewer requires an Int64 userId string, nickName and defaultUserName.");
	for (let t of [
		"costumeId",
		"skinColorId",
		"accessoryId",
		"coordinateId",
		"penlightId"
	]) if (!_(e[t])) throw TypeError(`StreamingLive viewer ${t} must be an Int32 integer.`);
	if (e.blockedUserIds != null && (!Array.isArray(e.blockedUserIds) || !e.blockedUserIds.every(v))) throw TypeError("StreamingLive viewer blockedUserIds must contain Int64 strings.");
}
function b(e) {
	if (!e || typeof e != "object") throw TypeError("StreamingLive input is required.");
	switch (e.kind) {
		case "move":
			if (!Number.isFinite(e.direction?.x) || !Number.isFinite(e.direction?.y)) throw TypeError("StreamingLive move direction must be finite.");
			return;
		case "time-event":
			if (!Number.isFinite(e.power)) throw TypeError("StreamingLive time-event power must be finite.");
			return;
		case "emote":
			if (!_(e.actionId)) throw TypeError("StreamingLive actionId must be an Int32 integer.");
			return;
		case "penlight-right":
		case "penlight-left":
			if (!_(e.penlightColorId) || !_(e.subGameCharacterPenlightColorId)) throw TypeError("StreamingLive penlight IDs must be Int32 integers.");
			return;
		case "stamp":
			if (!_(e.stampId)) throw TypeError("StreamingLive stampId must be an Int32 integer.");
			return;
		case "custom-stamp":
			if (typeof e.stampName != "string" || !_(e.balloonId)) throw TypeError("StreamingLive custom stamp requires stampName and an Int32 balloonId.");
			return;
		case "lock-on-tap":
			if (!Number.isFinite(e.position?.x) || !Number.isFinite(e.position?.y)) throw TypeError("StreamingLive tap position must be finite.");
			return;
		case "lock-on":
			if (!_(e.characterId)) throw TypeError("StreamingLive characterId must be an Int32 integer.");
			return;
		case "zoom":
			if (!Number.isFinite(e.zoom)) throw TypeError("StreamingLive zoom must be finite.");
			return;
		case "move-finish":
		case "swing-penlights":
		case "lock-on-cancel": return;
		default: throw TypeError("StreamingLive input kind is invalid.");
	}
}
function x(e) {
	return e === 0 || e === 1 || e === 2;
}
function S(e, t, n) {
	let r = e.getBoundingClientRect();
	if (!(r.width > 0) || !(r.height > 0)) throw RangeError("The canvas has no layout size.");
	return {
		x: (t - r.left) * e.width / r.width,
		y: (r.bottom - n) * e.height / r.height
	};
}
function C(e) {
	if (!Number.isFinite(e)) throw TypeError("Pinch distance change must be finite.");
	return e * 2.54 / 96 / 5;
}
function w(e) {
	let t = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY : e.deltaY / 100;
	if (!Number.isFinite(t)) throw TypeError("Wheel delta must be finite.");
	return -t * .05;
}
function T(e) {
	if (!Number.isInteger(e.refreshRate) || e.refreshRate <= 0) throw RangeError("MV render profile refreshRate must be a positive integer.");
	let t = e.resolution ?? "device", n = {
		device: 0,
		"720p": 1,
		"1080p": 2,
		"1440p": 3,
		"4k-uhd": 4,
		custom: 5
	}[t];
	if (n === void 0) throw RangeError("MV render profile resolution is invalid.");
	let r = 0, i = 0, a = 0, o = {
		default: 0,
		high: 1,
		"virtual-live-default": 2
	}[e.quality === void 0 ? "high" : e.quality];
	if (!Number.isInteger(o)) throw RangeError("MV render profile quality is invalid.");
	let s = 4;
	if (t === "device") {
		let t = e;
		for (let e of ["width", "height"]) if (!Number.isInteger(t[e]) || t[e] <= 0) throw RangeError(`MV render profile ${e} must be a positive integer.`);
		if (!Number.isFinite(t.dpi) || t.dpi <= 0) throw RangeError("MV render profile dpi must be positive and finite.");
		if (s = {
			"ingame-3dmv": 0,
			"music-video": 4
		}[t.playMode], t.quality === void 0 || s === void 0) throw RangeError("MV render profile quality and playMode are invalid.");
		r = t.width, i = t.height, a = t.dpi;
	} else if (t === "custom") {
		let t = e;
		for (let e of ["width", "height"]) if (!Number.isInteger(t[e]) || t[e] <= 0) throw RangeError(`MV render profile ${e} must be a positive integer.`);
		r = t.width, i = t.height;
	} else ({width: r, height: i} = c[t]);
	return {
		width: r,
		height: i,
		dpi: a,
		refreshRate: e.refreshRate,
		quality: o,
		playMode: s,
		outputResolution: n,
		use120Fps: e.use120Fps,
		followGameFrameRate: e.followGameFrameRate === !0
	};
}
//#endregion
//#region src/mv/HarukiMvRuntime.ts
var E = /* @__PURE__ */ new Map(), D = "The referenced script on this Behaviour (Game Object '<null>') is missing!";
function O() {
	let e = globalThis;
	if (e.__unitySourceWarningFilterInstalled) return;
	let t = console.warn.bind(console);
	console.warn = (...e) => {
		e.length === 1 && String(e[0]).trim() === D || t(...e);
	}, e.__unitySourceWarningFilterInstalled = !0;
}
function k(e) {
	let t = j(e.build), n = null;
	if (t.workerUrl && typeof location < "u" && typeof Blob < "u") {
		let e = new URL(t.workerUrl, location.href);
		e.origin !== location.origin && (n = URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(e.href)});`], { type: "text/javascript" })), t.workerUrl = n);
	}
	let r = String(e.loaderUrl ?? "").trim();
	if (!e.createUnityInstance && !r) throw Error("createUnityInstance or loaderUrl is required for the MV runtime.");
	!e.createUnityInstance && typeof window < "u" && O();
	let i = "idle", a = null, o = null, s = null, c = !1, l = new AbortController(), u = null, d = null, f = () => {
		let t = a?.Module, n = e.canvas.getBoundingClientRect();
		!t || !u || n.width <= 0 || n.height <= 0 || (t.devicePixelRatio = Math.min(u.width / n.width, u.height / n.height));
	}, p = () => c ? Promise.reject(/* @__PURE__ */ Error("Haruki MV runtime has been destroyed.")) : a ? Promise.resolve(a) : (o ||= (i = "loading", (e.createUnityInstance ? Promise.resolve(e.createUnityInstance) : A(r)).then((n) => n(e.canvas, t, e.onProgress)).then((e) => (a = e, c || (i = "ready"), e)).catch((e) => {
		throw o = null, c || (i = "failed"), e;
	})), o), m = () => {
		if (!a || i !== "ready") throw Error("Haruki MV runtime is not ready; await prepare() first.");
		return a;
	};
	return {
		build: t,
		signal: l.signal,
		get state() {
			return i;
		},
		prepare: p,
		sendMessage(e, t, n) {
			let r = m();
			n === void 0 ? r.SendMessage(e, t) : r.SendMessage(e, t, n);
		},
		setRenderSize(n, r) {
			let i = m();
			if (!Number.isInteger(n) || n <= 0 || !Number.isInteger(r) || r <= 0) throw RangeError("Render dimensions must be positive integers.");
			if (t.matchWebGLToCanvasSize !== !1 && i.Module) {
				u = {
					width: n,
					height: r
				}, f(), !d && typeof ResizeObserver < "u" && (d = new ResizeObserver(f), d.observe(e.canvas));
				return;
			}
			e.canvas.width !== n && (e.canvas.width = n), e.canvas.height !== r && (e.canvas.height = r);
		},
		setFullscreen(e) {
			let t = m();
			if (!t.SetFullscreen) throw Error("This Unity MV build does not expose SetFullscreen.");
			t.SetFullscreen(+!!e);
		},
		getMemoryInfo() {
			if (i !== "ready" || !a) return null;
			if (a.GetMemoryInfo) return a.GetMemoryInfo();
			if (!a.GetMetricsInfo) return null;
			let { totalWASMHeapSize: e, usedWASMHeapSize: t, totalJSHeapSize: n, usedJSHeapSize: r } = a.GetMetricsInfo();
			return {
				totalWASMHeapSize: e,
				usedWASMHeapSize: t,
				totalJSHeapSize: n,
				usedJSHeapSize: r
			};
		},
		destroy() {
			return s || (c = !0, d?.disconnect(), d = null, l.abort(/* @__PURE__ */ Error("Haruki MV runtime is being destroyed.")), i = "destroying", s = (o ? o.catch(() => null) : Promise.resolve(a)).then(async (e) => {
				try {
					e && await e.Quit();
				} finally {
					a = null, o = null, i = "destroyed", n && URL.revokeObjectURL(n);
				}
			}), s);
		}
	};
}
function A(e) {
	let t = String(e ?? "").trim();
	if (!t) return Promise.reject(/* @__PURE__ */ Error("loaderUrl is required."));
	let n = E.get(t);
	if (n) return n;
	if (typeof document > "u") return Promise.reject(/* @__PURE__ */ Error("Unity WebGL loader requires a browser document."));
	let r = new Promise((e, n) => {
		let r = globalThis.createUnityInstance, i = document.createElement("script");
		i.async = !0, i.src = t, i.onload = () => {
			let i = globalThis.createUnityInstance;
			if (typeof i != "function" || i === r) {
				n(/* @__PURE__ */ Error(`Unity loader ${t} did not expose createUnityInstance.`));
				return;
			}
			e(i);
		}, i.onerror = () => {
			n(/* @__PURE__ */ Error(`Failed to load Unity WebGL loader ${t}.`));
		};
		let a = document.head ?? document.body;
		if (!a) {
			n(/* @__PURE__ */ Error("Unity WebGL loader requires document.head or document.body."));
			return;
		}
		a.appendChild(i);
	}).catch((e) => {
		throw E.delete(t), e;
	});
	return E.set(t, r), r;
}
function j(e) {
	if (!e?.dataUrl || !e.frameworkUrl || !e.codeUrl) throw Error("Unity MV build requires dataUrl, frameworkUrl, and codeUrl.");
	return { ...e };
}
//#endregion
//#region src/mv/unityWebGLBuild.ts
function M(e = globalThis) {
	let t = e.SharedArrayBuffer, n = e.WebAssembly;
	if (typeof t != "function" || typeof n?.Memory != "function" || typeof e.Worker != "function") return !1;
	try {
		return new n.Memory({
			initial: 1,
			maximum: 1,
			shared: !0
		}).buffer instanceof t;
	} catch {
		return !1;
	}
}
function N(e) {
	let t = F(e.buildBaseUrl, "buildBaseUrl"), n = String(e.buildName ?? "WebGL").trim();
	if (!n || n.includes("/") || n.includes("\\")) throw Error("buildName must be one file stem without path separators.");
	let r = P(e.compression ?? "none"), i = `${t}${n}.data${r}`;
	return {
		loaderUrl: `${t}${n}.loader.js`,
		config: {
			dataUrl: i,
			frameworkUrl: `${t}${n}.framework.js${r}`,
			codeUrl: `${t}${n}.wasm${r}`,
			...e.threads ? { workerUrl: `${t}${n}.worker.js${r}` } : {},
			devicePixelRatio: 1,
			matchWebGLToCanvasSize: !1,
			autoSyncPersistentDataPath: !0,
			cacheControl: function(e) {
				this?.UnityCache && (this.UnityCache.MaximumCacheSize = Math.max(this.UnityCache.MaximumCacheSize, 2 * 1024 ** 3));
				let t = new URL(e, "https://unity.invalid");
				return [
					"mvAsset",
					"mvSource",
					"harukiAsset",
					"harukiAudio",
					"streamingLiveAsset",
					"streamingLiveSource"
				].some((e) => /^[a-f0-9]{64}$/i.test(t.searchParams.get(e) ?? "")) ? "immutable" : t.pathname === new URL(i, "https://unity.invalid").pathname || t.pathname.includes(".bundle") ? "must-revalidate" : "no-store";
			},
			...e.streamingAssetsUrl ? { streamingAssetsUrl: I(e.streamingAssetsUrl) } : {},
			...e.companyName ? { companyName: e.companyName } : {},
			...e.productName ? { productName: e.productName } : {},
			...e.productVersion ? { productVersion: e.productVersion } : {}
		}
	};
}
function P(e) {
	switch (e) {
		case "none": return "";
		case "gzip": return ".gz";
		case "brotli": return ".br";
		default: throw Error(`Unsupported Unity WebGL compression: ${e}.`);
	}
}
function F(e, t) {
	let n = String(e ?? "").trim();
	if (!n) throw Error(`${t} is required.`);
	return `${I(n)}/`;
}
function I(e) {
	let t = e.trim();
	return t === "/" ? t : t.replace(/\/+$/, "");
}
//#endregion
export { e as HARUKI_KERNEL_VERSION, s as HARUKI_MV_BRIDGE_OBJECT, c as HARUKI_MV_RENDER_PRESETS, g as createHarukiMvBridge, k as createHarukiMvRuntime, A as loadUnityWebGLCreateInstance, N as resolveUnityWebGLBuild, C as streamingLivePinchZoom, S as streamingLiveTapPosition, w as streamingLiveWheelZoom, M as supportsUnityWebGLThreads };
