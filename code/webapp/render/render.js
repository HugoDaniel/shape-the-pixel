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
			gridFillIds: new Map2D(),
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
