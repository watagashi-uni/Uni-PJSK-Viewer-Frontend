import { D as e, F as t, N as n, P as r, S as i, T as a, a as o, b as s, c, d as l, f as ee, g as u, h as d, i as f, l as p, m, n as te, o as ne, p as re, r as ie, t as ae, u as oe } from "./unityPrefabRuntime-BiYdXsAt.js";
import { C as se, S as ce, T as le, _ as ue, a as h, b as de, c as fe, d as pe, f as g, g as _, h as v, i as y, l as b, m as x, o as S, p as C, r as w, s as T, u as E, v as D, w as O, x as k, y as A } from "./CostumeShopKernel-B9BMx6oB.js";
import * as j from "three";
import { Controls as M, MOUSE as N, MathUtils as P, Plane as F, Quaternion as I, Ray as L, Spherical as R, TOUCH as z, Vector2 as B, Vector3 as V } from "three";
//#region node_modules/three/examples/jsm/controls/OrbitControls.js
var H = { type: "change" }, U = { type: "start" }, W = { type: "end" }, G = new L(), K = new F(), me = Math.cos(70 * P.DEG2RAD), q = new V(), J = 2 * Math.PI, Y = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
}, X = 1e-6, he = class extends M {
	constructor(e, t = null) {
		super(e, t), this.state = Y.NONE, this.target = new V(), this.cursor = new V(), this.minDistance = 0, this.maxDistance = Infinity, this.minZoom = 0, this.maxZoom = Infinity, this.minTargetRadius = 0, this.maxTargetRadius = Infinity, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -Infinity, this.maxAzimuthAngle = Infinity, this.enableDamping = !1, this.dampingFactor = .05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		}, this.mouseButtons = {
			LEFT: N.ROTATE,
			MIDDLE: N.DOLLY,
			RIGHT: N.PAN
		}, this.touches = {
			ONE: z.ROTATE,
			TWO: z.DOLLY_PAN
		}, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new V(), this._lastQuaternion = new I(), this._lastTargetPosition = new V(), this._quat = new I().setFromUnitVectors(e.up, new V(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new R(), this._sphericalDelta = new R(), this._scale = 1, this._panOffset = new V(), this._rotateStart = new B(), this._rotateEnd = new B(), this._rotateDelta = new B(), this._panStart = new B(), this._panEnd = new B(), this._panDelta = new B(), this._dollyStart = new B(), this._dollyEnd = new B(), this._dollyDelta = new B(), this._dollyDirection = new V(), this._mouse = new B(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = _e.bind(this), this._onPointerDown = ge.bind(this), this._onPointerUp = ve.bind(this), this._onContextMenu = we.bind(this), this._onMouseWheel = xe.bind(this), this._onKeyDown = Se.bind(this), this._onTouchStart = Z.bind(this), this._onTouchMove = Ce.bind(this), this._onMouseDown = ye.bind(this), this._onMouseMove = be.bind(this), this._interceptControlDown = Te.bind(this), this._interceptControlUp = Ee.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
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
			e !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position) : (G.origin.copy(this.object.position), G.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(G.direction)) < me ? this.object.lookAt(this.target) : (K.setFromNormalAndCoplanarPoint(this.object.up, this.target), G.intersectPlane(K, this.target))));
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
function ge(e) {
	this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e)));
}
function _e(e) {
	this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function ve(e) {
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
function ye(e) {
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
		case N.DOLLY:
			if (this.enableZoom === !1) return;
			this._handleMouseDownDolly(e), this.state = Y.DOLLY;
			break;
		case N.ROTATE:
			if (e.ctrlKey || e.metaKey || e.shiftKey) {
				if (this.enablePan === !1) return;
				this._handleMouseDownPan(e), this.state = Y.PAN;
			} else {
				if (this.enableRotate === !1) return;
				this._handleMouseDownRotate(e), this.state = Y.ROTATE;
			}
			break;
		case N.PAN:
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
function be(e) {
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
function xe(e) {
	this.enabled === !1 || this.enableZoom === !1 || this.state !== Y.NONE || (e.preventDefault(), this.dispatchEvent(U), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(W));
}
function Se(e) {
	this.enabled !== !1 && this._handleKeyDown(e);
}
function Z(e) {
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
function Ce(e) {
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
function we(e) {
	this.enabled !== !1 && e.preventDefault();
}
function Te(e) {
	e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, {
		passive: !0,
		capture: !0
	}));
}
function Ee(e) {
	e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, {
		passive: !0,
		capture: !0
	}));
}
//#endregion
//#region src/host/orbitControlsFactory.ts
var Q = ({ camera: e, canvas: t, target: n, onChange: r }) => {
	let i = new he(e, t);
	return i.enableDamping = !0, i.minPolarAngle = j.MathUtils.degToRad(82), i.maxPolarAngle = j.MathUtils.degToRad(100), i.target.copy(n), i.addEventListener("change", () => r(i.target)), i.update(), i;
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
			headOptionalCostume3dId: e.headOptionalCostume3dId,
			motionRoleId: e.motionRoleId
		});
		return await this.engine.setBackgroundMode(e.background ?? "transparent", e.runtimeBaseUrl), await this.prepareCaptureFrame({
			phase: e.phase,
			clip: "motion_loop",
			warmupMs: e.warmupMs,
			warmupFrames: e.warmupFrames,
			warmupMode: e.warmupMode,
			springRuntimeMode: e.springRuntimeMode,
			cameraPreset: e.cameraPreset,
			cameraProfile: e.cameraProfile,
			characterYawMode: e.characterYawMode,
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
		this.engine.setPresentationMode("capture"), this.engine.setSpringRuntimeMode(e.springRuntimeMode ?? "unity-prefab"), this.engine.setUtjSpringBoneTraceFilters(e.traceUtjBones ?? [], e.traceUtjMaxEvents), this.engine.setAnimationPaused(!0);
		let t = j.MathUtils.clamp(Number.isFinite(e.phase) ? e.phase : .5, 0, 1), n = e.clip ?? "motion_loop", r = Math.max(Math.trunc(e.warmupFrames ?? 0), 0), i = Math.max(Math.trunc(e.warmupMs ?? 0), 0), a = e.warmupMode ?? "runtime", o = a === "animation", s = (e) => n === "motion" ? this.engine.seekAnimationPhase(e) : this.engine.seekAnimationLoopPhase(e), c = Math.max(s(t).duration, 0), l = o && r > 0 && c > 0 ? j.MathUtils.euclideanModulo(t - r / (60 * c), 1) : t;
		switch (l !== t && s(l), this.engine.applyCameraPreset(e.cameraPreset ?? "capture", e.cameraProfile), e.characterYawMode) {
			case "45":
			case "-45":
			case "90":
			case "-90":
			case "180":
			case "0":
				this.engine.setViewYawDegrees(Number(e.characterYawMode));
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
}, De = class extends h {
	captureAdapter = new $(this);
	constructor(e, t) {
		let n = e instanceof HTMLElement ? {
			container: e,
			initialLight: t,
			controlsFactory: Q
		} : Oe(e);
		super(n);
	}
	captureRoleParts(e) {
		return this.captureAdapter.captureRoleParts(e);
	}
	prepareCaptureFrame(e = {}) {
		return this.captureAdapter.prepareCaptureFrame(e);
	}
};
function Oe(e) {
	let { enableControls: t, ...n } = e;
	return {
		...n,
		controlsFactory: n.controlsFactory ?? (t ?? n.canvas === void 0 ? Q : void 0)
	};
}
//#endregion
export { ue as COSTUME_SHOP_CAMERA_SETTING, b as COSTUME_SHOP_VIEWER_LAYOUT, r as CustomWardrobeController, De as Haruki3DEngine, h as Haruki3DEngineCore, $ as HarukiCaptureAdapter, D as MODEL_RENDER_STUDIO_CAMERA, A as ModelRenderStudioCamera, de as SekaiExtraBoneRuntime, E as UIParts3DCharacterViewer, p as UnityPrefabSpringRuntime, l as UtjColliderStatus, ae as applyUnityCharacterModelScale, ee as applyUtjLengthLimits, te as buildUnityPrefabSourceGraph, re as checkLocalCapsuleCollisionAndReact, m as checkLocalSphereCollisionAndReact, oe as computeUtjAverageChildTailPosition, d as computeUtjLocalRotation, u as constrainUtjAngleLimit, pe as costumeShopViewerLayout, w as createHaruki3DKernel, y as createHaruki3DKernelRuntime, ie as createUnityPrefabConstraintRuntime, n as decodeRuntimeMessagePackBrotli, i as ensureRolePartRegistry, x as getCostumeShopCameraPose, v as getDefaultCameraPose, f as installUnityRuntimeNativeMeshes, a as loadRuntimePackageFromBaseUrl, o as makeUnityPrefabHeadFollowDebugSnapshot, c as normalizeHarukiRenderRecipe, s as normalizeUnityLocalQuaternion, t as officialColliderFlagPrefixes, k as previewLightDefaults, S as readCharacterHairMaterialController, g as resolveCostumeShopHeightRate, C as resolveCostumeShopModelScale, e as resolveRuntimePackageUrl, T as resolveSekaiPreviewPixelRatio, ce as sekaiCostumeShopControllerDefaults, se as sekaiCostumeShopDirectionalLightDirection, O as sekaiCostumeShopDirectionalLightRotationDegrees, le as sekaiCostumeShopRimLightDirection, fe as sekaiPreviewPostProcessDefaults, _ as shiftCameraPoseRight, ne as syncUnityPrefabSourceGraph };
