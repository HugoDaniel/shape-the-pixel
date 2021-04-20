import { ShaderCanvas } from "../dependencies/shader_canvas.js"
import { Matrix } from "../dependencies/bundle.js"
const { transformPoint, identityMatrix, translate, scale, multiply } = Matrix
/**
 * The state to be passed outside of this module. This is useful to allow
 * other components to read the pan/zoom values, and also to trigger actions
 * when pan/zoom starts/ends.
 **/
export class PanZoomState {
	/** The transformation matrix (column-major order) */
	matrix // Float32Array
	/**
	 * The amount of pan and zoom applied to the origin (0,0):
	 *
	 * [panX, panY, zoom]
	 **/
	originAt
	_isUpdating = false
	_timeoutId = null

	constructor(zoom, zoomT) {
		this.matrix = zoomT
		this.originAt = [0, 0, zoom]
	}

	/**
	 * Is pan/zoom happening? This is useful to perform certain calculations only
	 * when the pan/zoom action is happening (e.g. by checking
	 * `if(state.isUpdating)` in the render loop).
	 **/
	get isUpdating() {
		return this._isUpdating
	}

	/**
	 * **DO NOT USE THIS SETTER**
	 *
	 * When the pan/zoom operation changes state this is the setter used to
	 * automatically trigger the `onActionStart/End` callbacks and update this
	 * internal state flags.
	 *
	 * This is intended to be used only by the PanZoom module.
	 **/
	set isUpdating(value) {
		// Only update and trigger actions if the value differs from the current one
		if (value !== this._isUpdating) {
			if (value) {
				this._isUpdating = value
				this.onActionStart()
			} else {
				this._isUpdating = value
				// Only call end action after a timeout is reached - this ensures that
				// the pan/zoom action has really finished. The event handlers are fast
				// and sometimes signal a false "isUpdating" value in the middle of an
				// ongoing action. This way, the "false" negatives get smoothed out by
				// waiting for an appropriate time to check again (100ms).
				if (this._timeoutId === null) {
					this._timeoutId = setTimeout(() => {
						this._timeoutId = null
						if (!this._isUpdating) {
							this.onActionEnd()
						}
					}, 60)
				}
			}
		}
	}
	/**
	 * More than one actionStart callback can be defined, this is the list where
	 * these callbacks are kept.
	 */
	_actionStart = []
	/**
	 * Creates and returns a function that calls every function in the
	 * "_actionStart" list.
	 */
	get onActionStart() {
		if (this._actionStart.length === 0) {
			return () => {}
		}
		return () => this._actionStart.forEach(f => f())
	}

	/**
	 * Sets a function to be called when a pan/zoom action starts.
	 */
	set onActionStart(arg) {
		if (typeof arg !== "function") {
			console.warn('A function was not passed to "onActionStart"')
			return
		}
		this._actionStart.push(arg)
	}
	/**
	 * More than one actionEnd callback can be defined, this is the list where
	 * these callbacks are kept.
	 */
	_actionEnd = []
	/**
	 * Creates and returns a function that calls every function in the
	 * "_actionEnd" list.
	 */
	get onActionEnd() {
		if (this._actionEnd.length === 0) {
			return () => {}
		}
		return () => this._actionEnd.forEach(f => f())
	}
	/**
	 * Sets a function to be called when a pan/zoom action finishes.
	 */
	set onActionEnd(arg) {
		if (typeof arg !== "function") {
			console.warn('A function was not passed to "onActionEnd"')
			return
		}
		this._actionEnd.push(arg)
	}

	/**
	 * Type guard for the PanZoomState. Useful when calling the module
	 * `getState()` function (which returns an "unknown")
	 **/
	static isPanZoomState(s) {
		return s instanceof PanZoomState
	}
}

export class PanZoom2D {
	/** Total rotation applied in the transformation being produced */
	rotation = 0
	// Amount of zoom, 1 is always the maximum zoom-out
	// amount
	/** Zoom value. 1 is the highest level of zoom-out. Starts at 3 (zoomed-in) */
	zoom = 3
	/** Zoom sign determines the direction of the zoom */
	zoomSign = 1
	/** The previous amount of zoom */
	oldZoom = this.zoom - 0.0001 // Start slightly off, to trigger a calculation
	/** Zoom delta is the difference between the new zoom and the old zoom value */
	zoomDelta = 0
	/**
	 * Total panning read in the X direction. This is not the panning applied
	 * to the scene.
	 **/
	panX = 0
	/**
	 * Total panning read in the Y direction. This is not the panning applied
	 * to the scene.
	 **/
	panY = 0
	/**
	 * Previous amount of panning in the X direction read by the event handlers
	 * This is useful to calculate the deltas - the amount of changing happening
	 * in panning.
	 */
	oldPanX = this.panX - 0.0001
	/**
	 * Previous amount of panning in the Y direction read by the event handlers
	 * This is useful to calculate the deltas - the amount of changing happening
	 * in panning.
	 */
	oldPanY = this.panY - 0.0001

	/** Rotation read when starting a gesture */
	gestureStartRotation = 0
	/** Zoom read when starting a gesture */
	gestureStartZoom = 0
	/** The initial X movement done by a gesture (set with gesture* events) */
	startX = 0
	/** The initial Y movement done by a gesture (set with gesture* events) */
	startY = 0

	/** Mouse pointer X position, useful to zoom in/out at the mouse location */
	mouseX = -1
	/** Mouse pointer Y position, useful to zoom in/out at the mouse location */
	mouseY = -1
	/** The zoom transformation matrix, is set by the `reset()` method */
	zoomT = identityMatrix()
	/** Device pixel ratio */
	dpr = window.devicePixelRatio
	/**
	 * The state to be passed outside of this module. This is useful to allow
	 * other components to read the pan/zoom values, and also to trigger actions
	 * when pan/zoom starts/ends.
	 **/
	state = new PanZoomState(this.zoom, this.zoomT)

	/**
	 * Are events enabled? If this is true then the following events will trigger
	 * changes in the Pan Zoom values and matrices:
	 * - wheel
	 * - gesturestart
	 * - gesturechange
	 * - gestureend
	 **/
	isListeningToEvents = false

	constructor(interact, isMobile) {
		this.interact = interact
		this.isMobile = isMobile
	}

	/**
	 * Resets all variables to their initial values.
	 *
	 * Useful when changing projects or entering a new state of the app.
	 */
	reset(dpr) {
		this.rotation = 0
		this.gestureStartRotation = 0
		this.gestureStartZoom = 0
		this.zoom = 3
		this.zoomSign = 1
		this.zoomDelta = 0
		this.oldZoom = this.zoom - 0.0001
		this.panX = 0
		this.panY = 0
		this.oldPanX = this.panX - 0.0001
		this.oldPanY = this.panY - 0.0001
		this.startX = 0
		this.startY = 0
		this.mouseX = -1
		this.mouseY = -1
		this.dpr = dpr
		// Adjust to the initial zoom set:
		scale(this.zoomT, [this.zoom, this.zoom, this.zoom], this.zoomT)
	}

	/**
	 * Adds all event listener functions (if they have not been registered yet).
	 *
	 * This function sets the pan/zoom calculations to happen when the following
	 * events are triggered:
	 * - wheel
	 * - gesturestart
	 * - gesturechange
	 * - gestureend
	 **/
	startEventListeners() {
		if (this.isListeningToEvents) {
			console.warn("Trying to start already started event listeners")
			return
		}
		const el = document.body
		this.startDebug()

		if (true) {
			// pointer events
			el.addEventListener("pointerdown", this.handlePointerStart, false)
			el.addEventListener("pointerup", this.handlePointerUp, false)
			el.addEventListener(
				"pointercancel",
				this.handlePointerCancel,
				false
			)
			el.addEventListener("pointermove", this.handlePointerMove, false)
		} else {
			el.addEventListener("wheel", this.wheelHandler, {
				passive: false,
				capture: false,
			})
			el.addEventListener("gesturestart", this.gestureStartHandler)
			el.addEventListener("gesturechange", this.gestureChangeHandler)
			el.addEventListener("gestureend", this.gestureEndHandler)
		}
		this.isListeningToEvents = true
	}
	startDebug = () => {
		const p = document.createElement("p")
		p.id = "debug"
		p.innerText = p.innerText + "DEBUG: "
		document.body.prepend(p)
	}
	debugMsg = msg => {
		const p = document.getElementById("debug")
		p.innerText = `Debug: ${msg}`
	}
	ongoingTouches = new Array()
	copyTouch(touch) {
		return {
			identifier: touch.pointerId,
			x: touch.clientX,
			y: touch.clientY,
		}
	}
	ongoingTouchIndexById = idToFind => {
		for (let i = 0; i < this.ongoingTouches.length; i++) {
			var id = this.ongoingTouches[i].identifier

			if (id == idToFind) {
				return i
			}
		}
		return -1 // not found
	}
	handleEnd = e => {
		var index = this.ongoingTouchIndexById(e.pointerId)

		if (index >= 0) {
			this.ongoingTouches.splice(index, 1) // remove it; we're done
		} else {
			console.log("can't figure out which touch to end")
		}
	}
	zoomStartDist = 0
	zoomCurrentDist = 0
	handlePointerStart = e => {
		console.log("Pointer start", e)
		this.ongoingTouches.push(this.copyTouch(e))
		if (this.ongoingTouches.length >= 2) {
			this.zoomStartDist = Math.hypot(
				this.ongoingTouches[0].x - this.ongoingTouches[1].x,
				this.ongoingTouches[0].y - this.ongoingTouches[1].y
			)
			this.debugMsg(
				`ZOOM START ${this.zoomStartDist} - points: ${this.ongoingTouches.length}`
			)
		}
	}
	handlePointerUp = e => {
		this.handleEnd(e)
	}
	handlePointerCancel = e => {
		this.handleEnd(e)
	}
	handlePointerMove = e => {
		console.log("Pointer moves", e)
		var index = this.ongoingTouchIndexById(e.pointerId)
		if (index >= 0) {
			// Found
			if (this.ongoingTouches.length > 1) {
				// Zoom
				console.log("ZOOM")
				this.ongoingTouches[index].x = e.clientX
				this.ongoingTouches[index].y = e.clientY
				this.zoomCurrentDist = Math.hypot(
					this.ongoingTouches[0].x - this.ongoingTouches[1].x,
					this.ongoingTouches[0].y - this.ongoingTouches[1].y
				)
				this.zoom = this.zoomCurrentDist / this.zoomStartDist
				/*
				const len1 = Math.hypot(
					this.ongoingTouches[0].x,
					this.ongoingTouches[0].y
				)
				const len2 = Math.hypot(
					this.ongoingTouches[1].x,
					this.ongoingTouches[1].y
				)
				const m =
					(this.ongoingTouches[0].x - this.ongoingTouches[1].x) /
					(this.ongoingTouches[0].y - this.ongoingTouches[1].y)
				const sign = Math.sign(m) * (len1 < len2 ? -1 : 1)
				const centerX =
					this.ongoingTouches[0].x + sign * 0.5 * this.zoomCurrentDist
				const centerY =
					this.ongoingTouches[0].y + sign * 0.5 * this.zoomCurrentDist
					*/

				const centerX =
					(this.ongoingTouches[0].x + this.ongoingTouches[1].x) / 2
				const centerY =
					(this.ongoingTouches[0].y + this.ongoingTouches[1].y) / 2
				this.debugMsg(
					`ZOOM: ${this.zoom}, m:${m}, c(${centerX}, ${centerY}`
				)
			} else {
				// Pan
				console.log("PAN")
				this.debugMsg("PAN")
			}
		} else {
			this.debugMsg("NOTHING")
		}
	}

	/**
	 * Removes all event listener functions (if they have been registered).
	 *
	 * This function removes the pan/zoom calculations from the following events:
	 * - wheel
	 * - gesturestart
	 * - gesturechange
	 * - gestureend
	 **/
	stopEventListeners() {
		if (!this.isListeningToEvents) {
			console.warn("Trying to stop already stopped event listeners.")
			return
		}
		if (this.isMobile) {
		} else {
			removeEventListener("wheel", this.wheelHandler)
			removeEventListener("gesturestart", this.gestureStartHandler)
			removeEventListener("gesturechange", this.gestureChangeHandler)
			removeEventListener("gestureend", this.gestureEndHandler)
		}
		this.isListeningToEvents = false
	}

	/**
	 * The starting point of this module. Please call this function once.
	 * It is responsible to set all variables to a clean state (by calling
	 * `reset()`).
	 *
	 * It creates the ShaderCanvas module "pan-zoom-2d" functions and state.
	 * `initialize()` is intended to be called before the ShaderCanvas initialize
	 * function because it sets the state objects for the "pan-zoom-2d"
	 * module that are required during the ShaderCanvas initialization.
	 *
	 * * Currently this is being called by the `Render.start()` function in
	 * `render.ts`.
	 *
	 * It does not start the event listeners. For that you must call the
	 * `startEventListeners()` when you feel it is appropriate.
	 */
	initialize({ dpr = window.devicePixelRatio }) {
		this.reset(dpr)
		const module = () => {
			// The totalPanZoom is a temporary array used to set the final
			// "originAt" array, the result of the pan/zoom operation is returned this
			// variable: [pan x, pan y, zoom]
			const totalPanZoom = [0, 0, this.zoom]
			// When this flag is true, the transformation matrices
			// are calculated:
			let isUpdateNeeded = true
			// Transformation matrices are only calculated if there are differences to
			// be made, which does not happen on the first render (no differences yet).
			// This flag is used to trigger a full transformation calculation on the
			// first frame:
			let firstRender = true
			// Temporary arrays, to avoid allocating new arrays at each frame:
			const translateToCenter = [0, 0, 0]
			const translateFromCenter = [0, 0, 0]
			const scaleDelta = [0, 0, 0]

			// The object returned is of the type ModulesFunctions (from ShaderCanvas)
			return {
				getState: () => {
					this.state.matrix = this.zoomT
					this.state.originAt = totalPanZoom
					return this.state
				},
				onFrame: () => {
					let updated = false
					if (this.oldZoom !== this.zoom || firstRender) {
						// Apply the zoom affine transformation matrix
						const centerX = this.mouseX * dpr
						const centerY = this.mouseY * dpr
						this.zoomDelta = Math.exp(
							Math.abs(this.zoom - this.oldZoom) * -this.zoomSign
						)
						const matrix = identityMatrix()
						translateToCenter[0] = centerX
						translateToCenter[1] = centerY
						translate(matrix, translateToCenter, matrix)
						scaleDelta[0] = this.zoomDelta
						scaleDelta[1] = this.zoomDelta
						scale(matrix, scaleDelta, matrix)
						translate(matrix, [-centerX, -centerY, 0.0], matrix)
						multiply(matrix, this.zoomT, matrix)
						this.zoomT = matrix
						this.oldZoom = this.zoom
						isUpdateNeeded = true
						firstRender = false
					}
					const transform = this.zoomT
					if (
						this.oldPanX !== this.panX ||
						this.oldPanY !== this.panY
					) {
						// Apply the translation affine transformation matrix
						const factor = Math.PI / Math.exp(this.zoom)
						const deltaX = (this.panX - this.oldPanX) * factor
						const deltaY = (this.panY - this.oldPanY) * factor
						translate(transform, [deltaX, deltaY, 0.0], transform)
						this.oldPanX = this.panX
						this.oldPanY = this.panY
						isUpdateNeeded = true
					}
					if (isUpdateNeeded) {
						totalPanZoom[0] = 0
						totalPanZoom[1] = 0
						totalPanZoom[2] = 0
						const finalMatrix = identityMatrix()
						transformPoint(this.zoomT, totalPanZoom, totalPanZoom)
						multiply(finalMatrix, this.zoomT, finalMatrix)
						totalPanZoom[2] = finalMatrix[0] // real zoom
						isUpdateNeeded = false
						updated = true
					}
					this.state.isUpdating = updated
				},
				onUseProgram: ({ gl }, program) => {
					const matrixLoc = program.uniformLocations.get(
						"panZoomMatrix"
					)
					const originLoc = program.uniformLocations.get("originAt")
					if (!matrixLoc) return
					if (originLoc) {
						gl.uniform3fv(originLoc, totalPanZoom)
					}
					gl.uniformMatrix4fv(matrixLoc, false, this.zoomT)
				},
			}
		}
		ShaderCanvas.webglModule(module).useWith("pan-zoom-2d")
	}

	/**
	 * The callback for the "wheel" event. This is where the zoom and pan get
	 * calculated if there are no gesture* events available.
	 **/
	wheelHandler = e => {
		console.log("WHEEL")
		e.stopPropagation()
		// Zoom can happen when the ctrl key is set
		if (e.ctrlKey) {
			this.zoom = Math.max(0.1, this.zoom - e.deltaY * 0.1)
			this.zoomSign = Math.sign(e.deltaY)
		} else {
			this.panX -= e.deltaX * this.zoom * 2
			this.panY -= e.deltaY * this.zoom * 2
		}
		// This is used to keep track of the current mouse pointing position (x,y),
		// which is useful to perform the zoom operation into the exact location
		// that the mouse is at.
		this.mouseX = e.clientX
		this.mouseY = e.clientY
	}

	/**
	 * The callback for the "gesturestart" event. This function is responsible to
	 * read the initial gesture state. All further gesture events within this
	 * action will calculate the deltas (difference) from the values read by
	 * this function.
	 */
	gestureStartHandler = e => {
		e.preventDefault()
		this.startX = e.pageX - this.panX
		this.startY = e.pageY - this.panY
		this.gestureStartRotation = this.rotation
		this.gestureStartZoom = this.zoom
		this.mouseX = e.layerX
		this.mouseY = e.layerY
	}

	/**
	 * The callback for the "gesturechange" event. This function is responsible to
	 * set the "zoom", "zoomSign", "rotation" and "panX/Y" attributes values.
	 * It makes use of the initial gesture state read from the
	 * `gestureStartHandler`.
	 */
	gestureChangeHandler = e => {
		e.preventDefault()
		this.rotation = this.gestureStartRotation + e.rotation
		this.zoom = this.gestureStartZoom * e.scale
		this.zoomSign = Math.sign(this.oldZoom - this.zoom)
		this.panX = e.pageX - this.startX
		this.panY = e.pageY - this.startY
	}

	/**
	 * Callback for the "gestureend" event. This function just cancels the
	 * event default behavior.
	 */
	gestureEndHandler = e => {
		e.preventDefault()
	}
}
