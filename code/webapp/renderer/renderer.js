// Copyright © 2021 by Hugo Daniel Henriques Oliveira Gomes. All rights reserved.
// Licensed under the EUPL v1.2
import { SquareGrid } from "./square-grid.js"
import { PanZoom2D } from "./pan-zoom.js"

const { PIXI } = External
export class Renderer {
	app = new PIXI.Application({
		width: window.innerWidth,
		height: window.innerHeight,
		backgroundColor: 0x1099bb,
		resolution: window.devicePixelRatio,
	})
	panZoomMatrix
	panZoomMatrixLastChange

	constructor() {
		document.body.appendChild(this.app.view)
		this.app.renderer.view.style.transform = `scale(${
			1 / window.devicePixelRatio
		})`
		this.app.renderer.view.style.transformOrigin = "top left"

		const sq = new SquareGrid()
		sq.renderBackground()
		sq.placeSquares()
		this.app.stage.addChild(sq.root)

		// Events
		const pz = new PanZoom2D()
		pz.startEventListeners()
		this.app.ticker.add(() => {
			if (pz.lastChange !== this.panZoomMatrixLastChange) {
				sq.updateViewport(pz.origin, pz.delta)
				this.panZoomMatrixLastChange = pz.lastChange
			}
		})
	}
}
