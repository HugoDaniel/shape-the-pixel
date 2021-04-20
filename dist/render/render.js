import { ShaderCanvas } from "../dependencies/shader_canvas.js"
import { PanZoom2D } from "./pan_zoom_2d.js"
import { RenderGrid } from "./grid.js"
import { Containers } from "../dependencies/bundle.js"
const { Map2D } = Containers

export class Render {
	shaderCanvasElem
	panZoom2D = new PanZoom2D()
	grid = new RenderGrid()

	constructor(interact) {
		this.panZoom2D = new PanZoom2D(interact, this.isMobile)
		const elem = globalThis.document.querySelector("shader-canvas")
		if (!elem) {
			console.error("Render: <shader-canvas> not found")
			throw new Error("<shader-canvas> not found")
		}
		if (elem instanceof ShaderCanvas) {
			this.shaderCanvasElem = elem
		} else {
			console.error(
				"Render: <shader-canvas> found but is not an instance of ShaderCanvas"
			)
			throw new Error("<shader-canvas> not an instance of ShaderCanvas")
		}
	}

	start() {
		this.panZoom2D.initialize({ dpr: window.devicePixelRatio })
		this.panZoom2D.startEventListeners()
		this.grid.initialize({
			dpr: window.devicePixelRatio,
			w: window.innerWidth * window.devicePixelRatio,
			h: window.innerHeight * window.devicePixelRatio,
			gridFillIds: appState,
		})
		this.shaderCanvasElem.initialize()
		this.shaderCanvasElem.draw()
	}
	get isMobile() {
		// credit to Timothy Huang for this regex test:
		// https://dev.to/timhuang/a-simple-way-to-detect-if-browser-is-on-a-mobile-device-with-javascript-44j3
		if (
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			)
		) {
			return true
		} else {
			return false
		}
	}
}

////////////////////
// APP STATE MOCK //
////////////////////
const appState = new Map2D(
	[
		[0, 0],
		[1, 1],
		[1, 2],
		[-1, -1],
		[2, 2],
		[5, 2],
		[5, 0],
		[10, 2],
		[31, 2],
		[0, 29],
	],
	[5, 1, 2, 3, 4, 1, 3, 2, 5, 5]
)
