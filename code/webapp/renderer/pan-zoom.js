const { PIXI } = External

export class PanZoom2D {
	#origin = { x: 0, y: 0, zoom: 1, pivot: { x: 0, y: 0 } }
	#delta = { x: 0, y: 0, zoom: 1 }
	#previous = { x: 0, y: 0, zoom: 1 }
	updateOrigin() {
		this.#origin.x = this.panX
		this.#origin.y = this.panY
		this.#origin.zoom = this.zoom
		this.#origin.pivot.x = this.mouseX
		this.#origin.pivot.y = this.mouseY
	}
	get delta() {
		this.updateOrigin()
		// Calculate the current delta by diffing
		this.#delta.x = this.#origin.x - this.#previous.x
		this.#delta.y = this.#origin.y - this.#previous.y
		this.#delta.zoom = this.#origin.zoom - this.#previous.zoom
		// Update the previous values
		this.#previous.x = this.#origin.x
		this.#previous.y = this.#origin.y
		this.#previous.zoom = this.#origin.zoom
		return this.#delta
	}
	get origin() {
		return this.#origin
	}
	/** Last time a pan/zoom change occurred */
	lastChange = Date.now()
	/** Total rotation applied in the transformation being produced */
	rotation = 0
	/** Zoom value. 1 is no zoom */
	zoom = 1
	/** Zoom sign determines the direction of the zoom */
	zoomSign = 1
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

	/** Rotation read when starting a gesture */
	gestureStartRotation = 0
	/** Zoom read when starting a gesture */
	gestureStartZoom = 0
	/** The initial X movement done by a gesture (set with gesture* events) */
	startX = 0
	/** The initial Y movement done by a gesture (set with gesture* events) */
	startY = 0

	/** Mouse pointer X position, useful to zoom in/out at the mouse location */
	mouseX = 0
	/** Mouse pointer Y position, useful to zoom in/out at the mouse location */
	mouseY = 0
	/** Device pixel ratio */
	dpr = window.devicePixelRatio
	/**
	 * Are events enabled? If this is true then the following events will trigger
	 * changes in the Pan Zoom values and matrices:
	 * - wheel
	 * - gesturestart
	 * - gesturechange
	 * - gestureend
	 **/
	isListeningToEvents = false

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
		this.panX = 0
		this.panY = 0
		this.oldPanX = this.panX - 0.0001
		this.oldPanY = this.panY - 0.0001
		this.startX = 0
		this.startY = 0
		this.mouseX = -1
		this.mouseY = -1
		this.dpr = dpr
		this.lastChange = Date.now()
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
		document.addEventListener("wheel", this.wheelHandler, {
			passive: false,
			capture: false,
		})
		document.addEventListener("gesturestart", this.gestureStartHandler)
		document.addEventListener("gesturechange", this.gestureChangeHandler)
		document.addEventListener("gestureend", this.gestureEndHandler)
		this.isListeningToEvents = true
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
		removeEventListener("wheel", this.wheelHandler)
		removeEventListener("gesturestart", this.gestureStartHandler)
		removeEventListener("gesturechange", this.gestureChangeHandler)
		removeEventListener("gestureend", this.gestureEndHandler)
		this.isListeningToEvents = false
	}

	/**
	 * The callback for the "wheel" event. This is where the zoom and pan get
	 * calculated if there are no gesture* events available.
	 **/
	wheelHandler = e => {
		e.preventDefault()
		e.stopPropagation()
		// This is used to keep track of the current mouse pointing position (x,y),
		// which is useful to perform the zoom operation into the exact location
		// that the mouse is at.
		this.mouseX = e.clientX
		this.mouseY = e.clientY

		// Zoom can happen when the ctrl key is set
		if (e.ctrlKey) {
			this.zoom = Math.max(0.1, this.zoom - e.deltaY * 0.1)
			this.zoomSign = Math.sign(e.deltaY)
		} else {
			// this.panX -= e.deltaX * this.zoom * 2
			// this.panY -= e.deltaY * this.zoom * 2
			this.panX -= e.deltaX
			this.panY -= e.deltaY
		}
		// Record this change
		this.lastChange = Date.now()
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
		this.lastChange = Date.now()
	}

	/**
	 * Callback for the "gestureend" event. This function just cancels the
	 * event default behavior.
	 */
	gestureEndHandler = e => {
		e.preventDefault()
	}
}
