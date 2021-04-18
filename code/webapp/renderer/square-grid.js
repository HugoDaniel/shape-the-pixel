// Copyright © 2021 by Hugo Daniel Henriques Oliveira Gomes. All rights reserved.
// Licensed under the EUPL v1.2
import { TilingSprite } from "@pixi/sprite-tiling"
import { PanZoom } from "./pan-zoom.js"
const { PIXI } = External
// https://stackoverflow.com/questions/2916081/zoom-in-on-a-point-using-scale-and-translate
const squareSize = 32
export class SquareGrid {
	root = new PIXI.Container()
	hLines = []
	vLines = []
	verticalGraphic = new PIXI.Graphics()
	horizontalGraphic = new PIXI.Graphics()
	background = new PIXI.Graphics()
	square1 = new PIXI.Graphics()
	square2 = new PIXI.Graphics()
	squares = new Squares()

	constructor() {}

	renderBackground() {
		this.background.beginFill(0xde3249)
		this.background.drawRect(0, 0, window.innerWidth, window.innerHeight)
		this.background.endFill()

		const origin = new PIXI.Graphics()
		origin.beginFill(0x000000)
		origin.drawRect(0, 0, 10, 10)
		origin.endFill()
		origin.zIndex = 10
		this.root.addChild(this.background)
		this.root.addChild(origin)
	}

	placeSquares() {
		/*
		this.square1.beginFill(0xdede49)
		this.square1.drawRect(0, 0, squareSize, squareSize)
		this.square1.endFill()
		this.square1.setTransform(25, 25)
		this.root.addChild(this.square1)

		this.square2.beginFill(0xde49de)
		this.square2.drawRect(0, 0, squareSize, squareSize)
		this.square2.endFill()
		this.square2.setTransform(-50, -50)
		this.root.addChild(this.square2)
		*/
		this.root.addChild(this.squares.mesh)
	}
	viewport = new PIXI.Matrix()
	updateViewport(origin, delta) {
		this.viewport.identity()
		this.viewport.translate(origin.pivot.x, origin.pivot.y)
		this.viewport.scale(origin.zoom, origin.zoom)
		this.viewport.translate(-origin.pivot.x, -origin.pivot.y)
		this.viewport.translate(origin.x, origin.y)

		this.squares.updateViewport(this.viewport)
	}
	/*
	updateStartPoint = { x: 0, y: 0 }
	pivotAdjusted = { x: 0, y: 0 }
	updateViewport(origin, delta) {
		// this.root.position.set(origin.x, origin.y)
		// this.squares.mesh.position.set(origin.x, origin.y)
		// const p = this.squares.mesh.localTransform.apply(origin.pivot)
		const isNewPivot =
			origin.pivot.x !== this.updateStartPoint.x ||
			origin.pivot.y !== this.updateStartPoint.y
		const o = { x: origin.x, y: origin.y }
		if (isNewPivot) {
			this.updateStartPoint.x = origin.pivot.x
			this.updateStartPoint.y = origin.pivot.y
			this.squares.mesh.localTransform.applyInverse(
				origin.pivot,
				this.pivotAdjusted
			)
			this.squares.mesh.localTransform.applyInverse(o, o)
			console.log(
				"PIVOT IN",
				this.pivotAdjusted.x,
				this.pivotAdjusted.y,
				"ORIGIN AT"
			)
		}
		this.squares.mesh.setTransform(
			this.pivotAdjusted.x,
			this.pivotAdjusted.y,
			origin.zoom,
			origin.zoom,
			0,
			0,
			0,
			this.pivotAdjusted.x,
			this.pivotAdjusted.y
		)
		console.log(this.root.localTransform.tx, this.root.localTransform.ty)
	}
	*/
}

class Squares {
	geometry = new PIXI.Geometry()
		.addAttribute(
			"aVPos",
			[0, 0, squareSize, 0, squareSize, squareSize, 0, squareSize],
			2
		)
		.addAttribute("aUvs", [0, 0, 1, 0, 1, 1, 0, 1], 2)
		.addIndex([0, 1, 2, 0, 2, 3])

	constructor() {
		this.geometry.instanced = true
		this.geometry.instanceCount = 5
		this.positionSize = 2
		this.colorSize = 3
		this.buffer = new PIXI.Buffer(
			new Float32Array(
				this.geometry.instanceCount *
					(this.positionSize + this.colorSize)
			),
			false
		)
		this.geometry.addAttribute(
			"aIPos",
			this.buffer,
			this.positionSize,
			false,
			PIXI.TYPES.FLOAT,
			4 * (this.positionSize + this.colorSize),
			0,
			true
		)
		this.geometry.addAttribute(
			"aICol",
			this.buffer,
			this.colorSize,
			false,
			PIXI.TYPES.FLOAT,
			4 * (this.positionSize + this.colorSize),
			4 * this.positionSize,
			true
		)
		this.updateBuffer()
	}

	viewportOrigin = { x: 0, y: 0 }
	viewportZoom = 1
	viewportTransform = new PIXI.Matrix().identity().toArray()
	updateViewport(matrix) {
		this.viewportTransform = matrix.toArray()
		this.viewportOrigin.x = 0
		this.viewportOrigin.y = 0
		matrix.apply(this.viewportOrigin, this.viewportOrigin)
		this.viewportZoom = matrix.append(PIXI.Matrix.IDENTITY).a
		console.log(
			"VIEWPORT ORIGIN",
			this.viewportOrigin,
			this.viewportZoom,
			PIXI.Transform.IDENTITY
		)
		this.updateBuffer()
	}

	colors = [...Array(10).keys()].map(c => [
		Math.random(),
		Math.random(),
		Math.random(),
	])
	updateBuffer() {
		const cols = Math.ceil(window.innerWidth / squareSize)
		const scaledSize = squareSize * this.viewportZoom
		const sceneDeltaX = Math.floor(this.viewportOrigin.x / scaledSize)
		const sceneDeltaY = Math.floor(this.viewportOrigin.y / scaledSize)
		for (let i = 0; i < this.geometry.instanceCount; i++) {
			const instanceOffset = i * (this.positionSize + this.colorSize)
			const sceneX = Math.floor((i % cols) - sceneDeltaX)
			const sceneY = Math.floor(Math.abs(i / cols) - sceneDeltaY)

			this.buffer.data[instanceOffset + 0] = sceneX
			this.buffer.data[instanceOffset + 1] = sceneY
			this.buffer.data[instanceOffset + 2] = this.colors[i][0]
			this.buffer.data[instanceOffset + 3] = this.colors[i][1]
			this.buffer.data[instanceOffset + 4] = this.colors[i][2]
		}
		this.buffer.update()
	}
	squareVS = `
	precision mediump float;
  
	attribute vec2 aVPos;
	attribute vec2 aIPos;
	attribute vec3 aICol;
	attribute vec2 aUvs;
  
	uniform mat3 viewportTransform; 
	uniform float size;
  
	uniform mat3 translationMatrix;
	uniform mat3 projectionMatrix;
  
	varying vec2 vUvs;
	varying vec3 vCol;
  
	vec4 squareGrid() {
	  vec2 vertex = vec2(size) * aVPos + aIPos * vec2(size);
  
	  vec4 projected = vec4((projectionMatrix * viewportTransform * vec3(vertex, 1.0)).xy, 0.0, 1.0);
	  return projected;
	}
	void main() {
		vUvs = aUvs;
		vCol = aICol;
		gl_Position = squareGrid();
		// gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVPos + aIPos, 1.0)).xy, 0.0, 1.0); 
  }
	`
	squareFS = `
	precision mediump float;
  
	varying vec2 vUvs;
	varying vec3 vCol;
  
	void main() {
	  gl_FragColor = vec4(vCol, 1.0);
	}
	`
	uniforms = {
		viewportTransform: this.viewportTransform,
		size: squareSize,
	}
	shader = PIXI.Shader.from(this.squareVS, this.squareFS, this.uniforms)
	mesh = new PIXI.Mesh(this.geometry, this.shader)
}
