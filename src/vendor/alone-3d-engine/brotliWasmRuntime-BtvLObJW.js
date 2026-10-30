//#region node_modules/brotli-wasm/pkg.web/brotli_wasm.js
var e, t = Array(32).fill(void 0);
t.push(void 0, null, !0, !1);
function n(e) {
	return t[e];
}
var r = new TextDecoder("utf-8", {
	ignoreBOM: !0,
	fatal: !0
});
r.decode();
var i = null;
function a() {
	return (i === null || i.buffer !== e.memory.buffer) && (i = new Uint8Array(e.memory.buffer)), i;
}
function o(e, t) {
	return r.decode(a().subarray(e, e + t));
}
var s = t.length;
function c(e) {
	s === t.length && t.push(t.length + 1);
	let n = s;
	return s = t[n], t[n] = e, n;
}
var l = 0, u = new TextEncoder("utf-8"), d = typeof u.encodeInto == "function" ? function(e, t) {
	return u.encodeInto(e, t);
} : function(e, t) {
	let n = u.encode(e);
	return t.set(n), {
		read: e.length,
		written: n.length
	};
};
function f(e, t, n) {
	if (n === void 0) {
		let n = u.encode(e), r = t(n.length);
		return a().subarray(r, r + n.length).set(n), l = n.length, r;
	}
	let r = e.length, i = t(r), o = a(), s = 0;
	for (; s < r; s++) {
		let t = e.charCodeAt(s);
		if (t > 127) break;
		o[i + s] = t;
	}
	if (s !== r) {
		s !== 0 && (e = e.slice(s)), i = n(i, r, r = s + e.length * 3);
		let t = a().subarray(i + s, i + r), o = d(e, t);
		s += o.written;
	}
	return l = s, i;
}
var p = null;
function m() {
	return (p === null || p.buffer !== e.memory.buffer) && (p = new Int32Array(e.memory.buffer)), p;
}
function h(e) {
	e < 36 || (t[e] = s, s = e);
}
function g(e) {
	let t = n(e);
	return h(e), t;
}
function _(e, t) {
	let n = t(e.length * 1);
	return a().set(e, n / 1), l = e.length, n;
}
function v(e, t) {
	return a().subarray(e / 1, e / 1 + t);
}
function y(t) {
	try {
		let o = e.__wbindgen_add_to_stack_pointer(-16), s = _(t, e.__wbindgen_malloc), c = l;
		e.decompress(o, s, c);
		var n = m()[o / 4 + 0], r = m()[o / 4 + 1], i = m()[o / 4 + 2];
		if (m()[o / 4 + 3]) throw g(i);
		var a = v(n, r).slice();
		return e.__wbindgen_free(n, r * 1), a;
	} finally {
		e.__wbindgen_add_to_stack_pointer(16);
	}
}
Object.freeze({
	ResultSuccess: 1,
	1: "ResultSuccess",
	NeedsMoreInput: 2,
	2: "NeedsMoreInput",
	NeedsMoreOutput: 3,
	3: "NeedsMoreOutput"
});
async function b(e, t) {
	if (typeof Response == "function" && e instanceof Response) {
		if (typeof WebAssembly.instantiateStreaming == "function") try {
			return await WebAssembly.instantiateStreaming(e, t);
		} catch (t) {
			if (e.headers.get("Content-Type") != "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", t);
			else throw t;
		}
		let n = await e.arrayBuffer();
		return await WebAssembly.instantiate(n, t);
	} else {
		let n = await WebAssembly.instantiate(e, t);
		return n instanceof WebAssembly.Instance ? {
			instance: n,
			module: e
		} : n;
	}
}
async function x(t) {
	if (t === void 0) throw Error("Brotli WASM URL is required.");
	let r = {};
	r.wbg = {}, r.wbg.__wbindgen_is_undefined = function(e) {
		return n(e) === void 0;
	}, r.wbg.__wbindgen_is_object = function(e) {
		let t = n(e);
		return typeof t == "object" && !!t;
	}, r.wbg.__wbindgen_string_new = function(e, t) {
		return c(o(e, t));
	}, r.wbg.__wbindgen_error_new = function(e, t) {
		return c(Error(o(e, t)));
	}, r.wbg.__wbindgen_json_serialize = function(t, r) {
		let i = n(r), a = f(JSON.stringify(i === void 0 ? null : i), e.__wbindgen_malloc, e.__wbindgen_realloc), o = l;
		m()[t / 4 + 1] = o, m()[t / 4 + 0] = a;
	}, r.wbg.__wbg_new_693216e109162396 = function() {
		return c(/* @__PURE__ */ Error());
	}, r.wbg.__wbg_stack_0ddaca5d1abfb52f = function(t, r) {
		let i = n(r).stack, a = f(i, e.__wbindgen_malloc, e.__wbindgen_realloc), o = l;
		m()[t / 4 + 1] = o, m()[t / 4 + 0] = a;
	}, r.wbg.__wbg_error_09919627ac0992f5 = function(t, n) {
		try {
			console.error(o(t, n));
		} finally {
			e.__wbindgen_free(t, n);
		}
	}, r.wbg.__wbindgen_object_drop_ref = function(e) {
		g(e);
	}, r.wbg.__wbindgen_throw = function(e, t) {
		throw Error(o(e, t));
	}, (typeof t == "string" || typeof Request == "function" && t instanceof Request || typeof URL == "function" && t instanceof URL) && (t = fetch(t));
	let { instance: i, module: a } = await b(await t, r);
	return e = i.exports, x.__wbindgen_wasm_module = a, e;
}
//#endregion
//#region src/runtime/brotliWasmRuntime.ts
var S = null;
function C(e) {
	return S ??= x(e).then(() => ({ decompress: y })), S;
}
//#endregion
export { C as t };
