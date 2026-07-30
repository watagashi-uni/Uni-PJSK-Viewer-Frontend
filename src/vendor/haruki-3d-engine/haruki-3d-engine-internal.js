import { $ as e, A as t, B as n, C as r, D as i, E as a, F as o, G as s, H as c, I as l, J as ee, K as te, L as ne, M as re, N as ie, O as ae, P as oe, Q as se, R as ce, S as le, T as ue, U as de, V as fe, W as pe, X as me, Y as he, Z as ge, _ as _e, _t as ve, a as ye, at as be, b as u, c as d, ct as f, d as p, dt as m, et as h, f as g, ft as _, g as v, gt as y, h as b, ht as x, i as S, it as C, j as w, k as T, l as E, lt as D, m as O, mt as k, n as A, nt as j, o as M, ot as N, p as xe, pt as Se, q as Ce, r as P, rt as we, s as Te, st as Ee, t as De, tt as Oe, u as ke, ut as Ae, v as je, vt as Me, w as Ne, x as Pe, y as Fe, yt as Ie, z as Le } from "./Haruki3DKernel-BYEf1lSY.js";
import * as F from "three";
import { Controls as Re, MOUSE as I, MathUtils as ze, Plane as Be, Quaternion as L, Ray as Ve, Spherical as R, TOUCH as z, Vector2 as B, Vector3 as V } from "three";
//#region node_modules/three/examples/jsm/controls/OrbitControls.js
var H = { type: "change" }, U = { type: "start" }, W = { type: "end" }, G = new Ve(), K = new Be(), He = Math.cos(70 * ze.DEG2RAD), q = new V(), J = 2 * Math.PI, Y = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
}, X = 1e-6, Ue = class extends Re {
	constructor(e, t = null) {
		super(e, t), this.state = Y.NONE, this.target = new V(), this.cursor = new V(), this.minDistance = 0, this.maxDistance = Infinity, this.minZoom = 0, this.maxZoom = Infinity, this.minTargetRadius = 0, this.maxTargetRadius = Infinity, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -Infinity, this.maxAzimuthAngle = Infinity, this.enableDamping = !1, this.dampingFactor = .05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		}, this.mouseButtons = {
			LEFT: I.ROTATE,
			MIDDLE: I.DOLLY,
			RIGHT: I.PAN
		}, this.touches = {
			ONE: z.ROTATE,
			TWO: z.DOLLY_PAN
		}, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new V(), this._lastQuaternion = new L(), this._lastTargetPosition = new V(), this._quat = new L().setFromUnitVectors(e.up, new V(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new R(), this._sphericalDelta = new R(), this._scale = 1, this._panOffset = new V(), this._rotateStart = new B(), this._rotateEnd = new B(), this._rotateDelta = new B(), this._panStart = new B(), this._panEnd = new B(), this._panDelta = new B(), this._dollyStart = new B(), this._dollyEnd = new B(), this._dollyDelta = new B(), this._dollyDirection = new V(), this._mouse = new B(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = Ge.bind(this), this._onPointerDown = We.bind(this), this._onPointerUp = Ke.bind(this), this._onContextMenu = Qe.bind(this), this._onMouseWheel = Je.bind(this), this._onKeyDown = Ye.bind(this), this._onTouchStart = Xe.bind(this), this._onTouchMove = Ze.bind(this), this._onMouseDown = Z.bind(this), this._onMouseMove = qe.bind(this), this._interceptControlDown = $e.bind(this), this._interceptControlUp = et.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
	}
	connect(e) {
		super.connect(e), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, {
			passive: !0,
			capture: !0
		}), this.domElement.style.touchAction = "none";
	}
	disconnect() {
		this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
	}
	dispose() {
		this.disconnect();
	}
	getPolarAngle() {
		return this._spherical.phi;
	}
	getAzimuthalAngle() {
		return this._spherical.theta;
	}
	getDistance() {
		return this.object.position.distanceTo(this.target);
	}
	listenToKeyEvents(e) {
		e.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = e;
	}
	stopListenToKeyEvents() {
		this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
	}
	saveState() {
		this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
	}
	reset() {
		this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(H), this.update(), this.state = Y.NONE;
	}
	update(e = null) {
		let t = this.object.position;
		q.copy(t).sub(this.target), q.applyQuaternion(this._quat), this._spherical.setFromVector3(q), this.autoRotate && this.state === Y.NONE && this._rotateLeft(this._getAutoRotationAngle(e)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
		let n = this.minAzimuthAngle, r = this.maxAzimuthAngle;
		isFinite(n) && isFinite(r) && (n < -Math.PI ? n += J : n > Math.PI && (n -= J), r < -Math.PI ? r += J : r > Math.PI && (r -= J), n <= r ? this._spherical.theta = Math.max(n, Math.min(r, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (n + r) / 2 ? Math.max(n, this._spherical.theta) : Math.min(r, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
		let i = !1;
		if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera) this._spherical.radius = this._clampDistance(this._spherical.radius);
		else {
			let e = this._spherical.radius;
			this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), i = e != this._spherical.radius;
		}
		if (q.setFromSpherical(this._spherical), q.applyQuaternion(this._quatInverse), t.copy(this.target).add(q), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
			let e = null;
			if (this.object.isPerspectiveCamera) {
				let t = q.length();
				e = this._clampDistance(t * this._scale);
				let n = t - e;
				this.object.position.addScaledVector(this._dollyDirection, n), this.object.updateMatrixWorld(), i = !!n;
			} else if (this.object.isOrthographicCamera) {
				let t = new V(this._mouse.x, this._mouse.y, 0);
				t.unproject(this.object);
				let n = this.object.zoom;
				this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), i = n !== this.object.zoom;
				let r = new V(this._mouse.x, this._mouse.y, 0);
				r.unproject(this.object), this.object.position.sub(r).add(t), this.object.updateMatrixWorld(), e = q.length();
			} else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
			e !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position) : (G.origin.copy(this.object.position), G.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(G.direction)) < He ? this.object.lookAt(this.target) : (K.setFromNormalAndCoplanarPoint(this.object.up, this.target), G.intersectPlane(K, this.target))));
		} else if (this.object.isOrthographicCamera) {
			let e = this.object.zoom;
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), e !== this.object.zoom && (this.object.updateProjectionMatrix(), i = !0);
		}
		return this._scale = 1, this._performCursorZoom = !1, i || this._lastPosition.distanceToSquared(this.object.position) > X || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > X || this._lastTargetPosition.distanceToSquared(this.target) > X ? (this.dispatchEvent(H), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
	}
	_getAutoRotationAngle(e) {
		return e === null ? J / 60 / 60 * this.autoRotateSpeed : J / 60 * this.autoRotateSpeed * e;
	}
	_getZoomScale(e) {
		let t = Math.abs(e * .01);
		return .95 ** (this.zoomSpeed * t);
	}
	_rotateLeft(e) {
		this._sphericalDelta.theta -= e;
	}
	_rotateUp(e) {
		this._sphericalDelta.phi -= e;
	}
	_panLeft(e, t) {
		q.setFromMatrixColumn(t, 0), q.multiplyScalar(-e), this._panOffset.add(q);
	}
	_panUp(e, t) {
		this.screenSpacePanning === !0 ? q.setFromMatrixColumn(t, 1) : (q.setFromMatrixColumn(t, 0), q.crossVectors(this.object.up, q)), q.multiplyScalar(e), this._panOffset.add(q);
	}
	_pan(e, t) {
		let n = this.domElement;
		if (this.object.isPerspectiveCamera) {
			let r = this.object.position;
			q.copy(r).sub(this.target);
			let i = q.length();
			i *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * e * i / n.clientHeight, this.object.matrix), this._panUp(2 * t * i / n.clientHeight, this.object.matrix);
		} else this.object.isOrthographicCamera ? (this._panLeft(e * (this.object.right - this.object.left) / this.object.zoom / n.clientWidth, this.object.matrix), this._panUp(t * (this.object.top - this.object.bottom) / this.object.zoom / n.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
	}
	_dollyOut(e) {
		this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
	}
	_dollyIn(e) {
		this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= e : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
	}
	_updateZoomParameters(e, t) {
		if (!this.zoomToCursor) return;
		this._performCursorZoom = !0;
		let n = this.domElement.getBoundingClientRect(), r = e - n.left, i = t - n.top, a = n.width, o = n.height;
		this._mouse.x = r / a * 2 - 1, this._mouse.y = -(i / o) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
	}
	_clampDistance(e) {
		return Math.max(this.minDistance, Math.min(this.maxDistance, e));
	}
	_handleMouseDownRotate(e) {
		this._rotateStart.set(e.clientX, e.clientY);
	}
	_handleMouseDownDolly(e) {
		this._updateZoomParameters(e.clientX, e.clientX), this._dollyStart.set(e.clientX, e.clientY);
	}
	_handleMouseDownPan(e) {
		this._panStart.set(e.clientX, e.clientY);
	}
	_handleMouseMoveRotate(e) {
		this._rotateEnd.set(e.clientX, e.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		let t = this.domElement;
		this._rotateLeft(J * this._rotateDelta.x / t.clientHeight), this._rotateUp(J * this._rotateDelta.y / t.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
	}
	_handleMouseMoveDolly(e) {
		this._dollyEnd.set(e.clientX, e.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
	}
	_handleMouseMovePan(e) {
		this._panEnd.set(e.clientX, e.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
	}
	_handleMouseWheel(e) {
		this._updateZoomParameters(e.clientX, e.clientY), e.deltaY < 0 ? this._dollyIn(this._getZoomScale(e.deltaY)) : e.deltaY > 0 && this._dollyOut(this._getZoomScale(e.deltaY)), this.update();
	}
	_handleKeyDown(e) {
		let t = !1;
		switch (e.code) {
			case this.keys.UP:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(J * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), t = !0;
				break;
			case this.keys.BOTTOM:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateUp(-J * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), t = !0;
				break;
			case this.keys.LEFT:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(J * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), t = !0;
				break;
			case this.keys.RIGHT:
				e.ctrlKey || e.metaKey || e.shiftKey ? this.enableRotate && this._rotateLeft(-J * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), t = !0;
				break;
		}
		t && (e.preventDefault(), this.update());
	}
	_handleTouchStartRotate(e) {
		if (this._pointers.length === 1) this._rotateStart.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._rotateStart.set(n, r);
		}
	}
	_handleTouchStartPan(e) {
		if (this._pointers.length === 1) this._panStart.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._panStart.set(n, r);
		}
	}
	_handleTouchStartDolly(e) {
		let t = this._getSecondPointerPosition(e), n = e.pageX - t.x, r = e.pageY - t.y, i = Math.sqrt(n * n + r * r);
		this._dollyStart.set(0, i);
	}
	_handleTouchStartDollyPan(e) {
		this.enableZoom && this._handleTouchStartDolly(e), this.enablePan && this._handleTouchStartPan(e);
	}
	_handleTouchStartDollyRotate(e) {
		this.enableZoom && this._handleTouchStartDolly(e), this.enableRotate && this._handleTouchStartRotate(e);
	}
	_handleTouchMoveRotate(e) {
		if (this._pointers.length == 1) this._rotateEnd.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._rotateEnd.set(n, r);
		}
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		let t = this.domElement;
		this._rotateLeft(J * this._rotateDelta.x / t.clientHeight), this._rotateUp(J * this._rotateDelta.y / t.clientHeight), this._rotateStart.copy(this._rotateEnd);
	}
	_handleTouchMovePan(e) {
		if (this._pointers.length === 1) this._panEnd.set(e.pageX, e.pageY);
		else {
			let t = this._getSecondPointerPosition(e), n = .5 * (e.pageX + t.x), r = .5 * (e.pageY + t.y);
			this._panEnd.set(n, r);
		}
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
	}
	_handleTouchMoveDolly(e) {
		let t = this._getSecondPointerPosition(e), n = e.pageX - t.x, r = e.pageY - t.y, i = Math.sqrt(n * n + r * r);
		this._dollyEnd.set(0, i), this._dollyDelta.set(0, (this._dollyEnd.y / this._dollyStart.y) ** +this.zoomSpeed), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
		let a = (e.pageX + t.x) * .5, o = (e.pageY + t.y) * .5;
		this._updateZoomParameters(a, o);
	}
	_handleTouchMoveDollyPan(e) {
		this.enableZoom && this._handleTouchMoveDolly(e), this.enablePan && this._handleTouchMovePan(e);
	}
	_handleTouchMoveDollyRotate(e) {
		this.enableZoom && this._handleTouchMoveDolly(e), this.enableRotate && this._handleTouchMoveRotate(e);
	}
	_addPointer(e) {
		this._pointers.push(e.pointerId);
	}
	_removePointer(e) {
		delete this._pointerPositions[e.pointerId];
		for (let t = 0; t < this._pointers.length; t++) if (this._pointers[t] == e.pointerId) {
			this._pointers.splice(t, 1);
			return;
		}
	}
	_isTrackingPointer(e) {
		for (let t = 0; t < this._pointers.length; t++) if (this._pointers[t] == e.pointerId) return !0;
		return !1;
	}
	_trackPointer(e) {
		let t = this._pointerPositions[e.pointerId];
		t === void 0 && (t = new B(), this._pointerPositions[e.pointerId] = t), t.set(e.pageX, e.pageY);
	}
	_getSecondPointerPosition(e) {
		let t = e.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
		return this._pointerPositions[t];
	}
	_customWheelEvent(e) {
		let t = e.deltaMode, n = {
			clientX: e.clientX,
			clientY: e.clientY,
			deltaY: e.deltaY
		};
		switch (t) {
			case 1:
				n.deltaY *= 16;
				break;
			case 2:
				n.deltaY *= 100;
				break;
		}
		return e.ctrlKey && !this._controlActive && (n.deltaY *= 10), n;
	}
};
function We(e) {
	this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e)));
}
function Ge(e) {
	this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function Ke(e) {
	switch (this._removePointer(e), this._pointers.length) {
		case 0:
			this.domElement.releasePointerCapture(e.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(W), this.state = Y.NONE;
			break;
		case 1:
			let t = this._pointers[0], n = this._pointerPositions[t];
			this._onTouchStart({
				pointerId: t,
				pageX: n.x,
				pageY: n.y
			});
			break;
	}
}
function Z(e) {
	let t;
	switch (e.button) {
		case 0:
			t = this.mouseButtons.LEFT;
			break;
		case 1:
			t = this.mouseButtons.MIDDLE;
			break;
		case 2:
			t = this.mouseButtons.RIGHT;
			break;
		default: t = -1;
	}
	switch (t) {
		case I.DOLLY:
			if (this.enableZoom === !1) return;
			this._handleMouseDownDolly(e), this.state = Y.DOLLY;
			break;
		case I.ROTATE:
			if (e.ctrlKey || e.metaKey || e.shiftKey) {
				if (this.enablePan === !1) return;
				this._handleMouseDownPan(e), this.state = Y.PAN;
			} else {
				if (this.enableRotate === !1) return;
				this._handleMouseDownRotate(e), this.state = Y.ROTATE;
			}
			break;
		case I.PAN:
			if (e.ctrlKey || e.metaKey || e.shiftKey) {
				if (this.enableRotate === !1) return;
				this._handleMouseDownRotate(e), this.state = Y.ROTATE;
			} else {
				if (this.enablePan === !1) return;
				this._handleMouseDownPan(e), this.state = Y.PAN;
			}
			break;
		default: this.state = Y.NONE;
	}
	this.state !== Y.NONE && this.dispatchEvent(U);
}
function qe(e) {
	switch (this.state) {
		case Y.ROTATE:
			if (this.enableRotate === !1) return;
			this._handleMouseMoveRotate(e);
			break;
		case Y.DOLLY:
			if (this.enableZoom === !1) return;
			this._handleMouseMoveDolly(e);
			break;
		case Y.PAN:
			if (this.enablePan === !1) return;
			this._handleMouseMovePan(e);
			break;
	}
}
function Je(e) {
	this.enabled === !1 || this.enableZoom === !1 || this.state !== Y.NONE || (e.preventDefault(), this.dispatchEvent(U), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(W));
}
function Ye(e) {
	this.enabled !== !1 && this._handleKeyDown(e);
}
function Xe(e) {
	switch (this._trackPointer(e), this._pointers.length) {
		case 1:
			switch (this.touches.ONE) {
				case z.ROTATE:
					if (this.enableRotate === !1) return;
					this._handleTouchStartRotate(e), this.state = Y.TOUCH_ROTATE;
					break;
				case z.PAN:
					if (this.enablePan === !1) return;
					this._handleTouchStartPan(e), this.state = Y.TOUCH_PAN;
					break;
				default: this.state = Y.NONE;
			}
			break;
		case 2:
			switch (this.touches.TWO) {
				case z.DOLLY_PAN:
					if (this.enableZoom === !1 && this.enablePan === !1) return;
					this._handleTouchStartDollyPan(e), this.state = Y.TOUCH_DOLLY_PAN;
					break;
				case z.DOLLY_ROTATE:
					if (this.enableZoom === !1 && this.enableRotate === !1) return;
					this._handleTouchStartDollyRotate(e), this.state = Y.TOUCH_DOLLY_ROTATE;
					break;
				default: this.state = Y.NONE;
			}
			break;
		default: this.state = Y.NONE;
	}
	this.state !== Y.NONE && this.dispatchEvent(U);
}
function Ze(e) {
	switch (this._trackPointer(e), this.state) {
		case Y.TOUCH_ROTATE:
			if (this.enableRotate === !1) return;
			this._handleTouchMoveRotate(e), this.update();
			break;
		case Y.TOUCH_PAN:
			if (this.enablePan === !1) return;
			this._handleTouchMovePan(e), this.update();
			break;
		case Y.TOUCH_DOLLY_PAN:
			if (this.enableZoom === !1 && this.enablePan === !1) return;
			this._handleTouchMoveDollyPan(e), this.update();
			break;
		case Y.TOUCH_DOLLY_ROTATE:
			if (this.enableZoom === !1 && this.enableRotate === !1) return;
			this._handleTouchMoveDollyRotate(e), this.update();
			break;
		default: this.state = Y.NONE;
	}
}
function Qe(e) {
	this.enabled !== !1 && e.preventDefault();
}
function $e(e) {
	e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, {
		passive: !0,
		capture: !0
	}));
}
function et(e) {
	e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, {
		passive: !0,
		capture: !0
	}));
}
//#endregion
//#region src/host/orbitControlsFactory.ts
var Q = ({ camera: e, canvas: t, target: n, onChange: r }) => {
	let i = new Ue(e, t);
	return i.enableDamping = !0, i.minPolarAngle = F.MathUtils.degToRad(82), i.maxPolarAngle = F.MathUtils.degToRad(100), i.target.copy(n), i.addEventListener("change", () => r(i.target)), i.update(), i;
}, $ = class {
	engine;
	queue = Promise.resolve();
	constructor(e) {
		this.engine = e;
	}
	captureRoleParts(e) {
		let t = () => this.captureRolePartsInternal(e), n = this.queue.then(t, t);
		return this.queue = n.catch(() => void 0), n;
	}
	async captureRolePartsInternal(e) {
		if (!e.runtimeBaseUrl) throw Error("runtimeBaseUrl is required before role parts capture.");
		let { selection: t, combinedCharacter: n } = await this.engine.loadRenderRecipe({
			baseUrl: e.runtimeBaseUrl,
			roleId: e.roleId,
			bodyCostume3dId: e.bodyCostume3dId,
			headCostume3dId: e.headCostume3dId,
			headPackagePath: e.headPackagePath,
			hairCostume3dId: e.hairCostume3dId,
			headOptionalCostume3dId: e.headOptionalCostume3dId
		});
		return await this.prepareCaptureFrame({
			phase: e.phase,
			clip: "motion_loop",
			warmupMs: e.warmupMs,
			warmupFrames: e.warmupFrames,
			warmupMode: e.warmupMode,
			cameraPreset: e.cameraPreset,
			cameraProfile: e.cameraProfile,
			characterYawMode: e.characterYawMode,
			bodyDebugMode: e.bodyDebugMode,
			faceSdfEnabled: e.faceSdfEnabled,
			faceSdfDebugMode: e.faceSdfDebugMode,
			faceSdfDebugLightMode: e.faceSdfDebugLightMode,
			projectedShadow: e.projectedShadow,
			traceUtjBones: e.traceUtjBones,
			traceUtjMaxEvents: e.traceUtjMaxEvents,
			springDebugBones: e.springDebugBones,
			springDebugAllOffsets: e.springDebugAllOffsets
		}), {
			selection: t,
			combinedCharacter: n,
			snapshots: e.includeDebugSnapshots ? this.engine.getSnapshots({
				springDebugBones: e.springDebugBones,
				springDebugAllOffsets: e.springDebugAllOffsets
			}) : null
		};
	}
	async prepareCaptureFrame(e = {}) {
		this.engine.setPresentationMode("capture"), this.engine.setSpringRuntimeMode(e.springRuntimeMode ?? "unity-prefab"), e.bodyDebugMode !== void 0 && this.engine.setBodyDebugMode(e.bodyDebugMode), e.faceSdfEnabled !== void 0 && this.engine.setFaceSdfEnabled(e.faceSdfEnabled), e.faceSdfDebugMode !== void 0 && this.engine.setFaceSdfDebugMode(e.faceSdfDebugMode), e.faceSdfDebugLightMode !== void 0 && this.engine.setFaceSdfDebugLightMode(e.faceSdfDebugLightMode), e.projectedShadow !== void 0 && this.engine.setProjectedShadowSettings(e.projectedShadow), this.engine.setUtjSpringBoneTraceFilters(e.traceUtjBones ?? [], e.traceUtjMaxEvents), this.engine.setAnimationPaused(!0);
		let t = F.MathUtils.clamp(Number.isFinite(e.phase) ? e.phase : .5, 0, 1), n = e.clip ?? "motion_loop", r = Math.max(Math.trunc(e.warmupFrames ?? 0), 0), i = Math.max(Math.trunc(e.warmupMs ?? 0), 0), a = e.warmupMode ?? "animation", o = a === "animation", s = (e) => n === "motion" ? this.engine.seekAnimationPhase(e) : this.engine.seekAnimationLoopPhase(e), c = Math.max(s(t).duration, 0), l = o && r > 0 && c > 0 ? F.MathUtils.euclideanModulo(t - r / (60 * c), 1) : t;
		switch (l !== t && s(l), this.engine.applyCameraPreset(e.cameraPreset ?? "capture", e.cameraProfile), e.characterYawMode) {
			case "45":
			case "-45":
			case "90":
			case "-90":
			case "180":
			case "0":
				this.engine.setCharacterYawDegrees(Number(e.characterYawMode));
				break;
			case "face-camera":
				this.engine.faceCharacterTowardCamera();
				break;
			default: break;
		}
		if (r > 0) {
			this.engine.setAnimationPaused(!o);
			for (let e = 0; e < r; e += 1) this.engine.stepRuntimeFrame(1 / 60, { advanceAnimation: o });
			this.engine.setAnimationPaused(!0);
		} else i > 0 ? (this.engine.setAnimationPaused(a === "runtime"), await new Promise((e) => window.setTimeout(e, i)), this.engine.setAnimationPaused(!0)) : this.engine.stepRuntimeFrame(0, { advanceAnimation: !1 });
		this.engine.renderFrame(), this.engine.finishCaptureFrame();
	}
}, tt = class extends P {
	captureAdapter = new $(this);
	constructor(e, t) {
		let n = e instanceof HTMLElement ? {
			container: e,
			initialLight: t,
			controlsFactory: Q
		} : nt(e);
		super(n);
	}
	captureRoleParts(e) {
		return this.captureAdapter.captureRoleParts(e);
	}
	prepareCaptureFrame(e = {}) {
		return this.captureAdapter.prepareCaptureFrame(e);
	}
};
function nt(e) {
	let { enableControls: t, ...n } = e;
	return {
		...n,
		controlsFactory: n.controlsFactory ?? (t ?? n.canvas === void 0 ? Q : void 0)
	};
}
//#endregion
export { oe as AnimationPlaybackRuntime, Te as CharacterLightingRuntime, Ce as CharacterProjectedShadowController, Se as CustomWardrobeController, re as FaceMotionRuntime, tt as Haruki3DEngine, P as Haruki3DEngineCore, $ as HarukiCaptureAdapter, h as UnityPrefabSpringRuntime, Oe as UtjColliderStatus, je as applyRawMaterialShaderUniforms, i as applyRawMaterialTextureTransform, fe as applyUnityCharacterHeight, Fe as bindBodyRuntimeMaterials, _e as bindHeadRuntimeMaterials, d as bodyDebugModeToUniform, c as buildUnityPrefabSourceGraph, j as checkLocalCapsuleCollisionAndReact, we as checkLocalSphereCollisionAndReact, u as configureSekaiBaseStencilClear, Pe as configureSekaiEyelashPass, le as configureSekaiFaceLayerStencilPrepass, r as configureSekaiHairStencil, he as createCaptureBackgroundTexture, De as createHaruki3DKernel, A as createHaruki3DKernelRuntime, C as createSekaiBodyMaterial, be as createSekaiFaceMaterial, N as createSekaiLayerMaterial, ke as createSekaiOutlineMaterial, Ne as createSekaiThroughHairOverlayMesh, o as createSmoothedLoopClip, de as createUnityPrefabConstraintRuntime, _ as decodeRuntimeMessagePackBrotli, l as decodeUnityMotionClips, ee as defaultProjectedShadowSettings, Ee as evaluateSekaiBaseShadow, f as evaluateSekaiFaceShadow, p as evaluateSekaiOutlineColor, g as evaluateSekaiOutlineFovFactor, D as evaluateSekaiSkinColor, E as faceSdfDebugModeToUniform, me as getCostumeShopCameraPose, ge as getDefaultCameraPose, ne as inferBodyAnimationKind, pe as installUnityRuntimeNativeMeshes, xe as isSekaiOutlinePassEnabled, Ae as loadRuntimePackageFromBaseUrl, ce as makeAnimationTrackDebug, s as makeUnityPrefabHeadFollowDebugSnapshot, e as normalizeHarukiRenderRecipe, k as officialColliderFlagPrefixes, Le as prepareRuntimeAnimationClip, x as previewLightDefaults, S as readCharacterHairMaterialController, ie as readEmbeddedRuntimeFaceMotion, ae as readRawMaterialBoolean, T as readRawMaterialColor, t as readRawMaterialFloat, w as readRawMaterialTexture, m as resolveRuntimePackageUrl, ye as resolveSekaiPreviewPixelRatio, n as retargetUnityPrefabAnimationClip, y as sekaiCostumeShopControllerDefaults, ve as sekaiCostumeShopDirectionalLightDirection, Me as sekaiCostumeShopDirectionalLightRotationDegrees, O as sekaiCostumeShopOutlineControllerDefaults, b as sekaiCostumeShopOutlineSettings, Ie as sekaiCostumeShopRimLightDirection, v as sekaiPreviewOutlineCalibration, M as sekaiPreviewPostProcessDefaults, se as shiftCameraPoseRight, te as syncUnityPrefabSourceGraph, ue as tuneLightingForPreview, a as updateSekaiEyelashPassView };
