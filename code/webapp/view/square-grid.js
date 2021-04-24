const { THREE } = External

class Squares {
	panes = []
	root = new THREE.Group()
	constructor(elementsInPlaneSide = 16, elementSize = 16, color = 0xffaa00) {
		this.dimension = elementsInPlaneSide * elementSize
		this.linesGeometry = new THREE.BufferGeometry()
		this.linesMaterial = new THREE.LineBasicMaterial({ color })

		this.linesBuffer = new THREE.BufferAttribute(
			this.createLines(elementsInPlaneSide, elementSize),
			3
		)
		this.linesGeometry.setAttribute("position", this.linesBuffer)
	}

	updateViewport(w, h, x, y, zoom) {
		const horizontalPixels = w / zoom
		const verticalPixels = h / zoom
		const topLeftX = -horizontalPixels / 2 - x
		const topLeftY = -verticalPixels / 2 - y
		const startPane = this.paneCoordsForPos(topLeftX, topLeftY)
		const endPane = this.paneCoordsForPos(
			topLeftX + horizontalPixels,
			topLeftY + verticalPixels
		)
		for (
			let i = Math.min(endPane.x, startPane.x);
			i <= Math.max(endPane.x, startPane.x);
			i++
		) {
			for (
				let j = Math.min(endPane.y, startPane.y);
				j <= Math.max(endPane.y, startPane.y);
				j++
			) {
				this.addPane(i, j)
			}
		}
	}

	paneCoordsForPos(x, y) {
		const result = { x: 0, y: 0 }
		result.x = Math.floor(x / this.dimension)
		result.y = Math.floor(y / this.dimension)
		return result
	}

	addPane(x, y) {
		if (this.paneIndex(x, y) === -1) {
			const lines = new THREE.LineSegments(
				this.linesGeometry,
				this.linesMaterial
			)
			lines.translateX(x * this.dimension)
			lines.translateY(y * this.dimension)
			this.panes.push({ x, y, lines })
			this.root.add(lines)
		}
	}

	paneIndex(x, y) {
		return this.panes.findIndex(p => p.x === x && p.y === y)
	}

	createLines(elementsInPlaneSide, elementSize) {
		const result = new Float32Array(
			// 2 vertices per line, with 3 coordinates per vertex
			(1 + elementsInPlaneSide) * elementsInPlaneSide * 2 * 3
		)
		// Horizontal
		let offset = 2 * 3
		for (let i = 0; i <= elementsInPlaneSide; i++) {
			result[offset * i + 0] = 0
			result[offset * i + 1] = i * elementSize
			result[offset * i + 2] = -1
			result[offset * i + 3] = elementsInPlaneSide * elementSize
			result[offset * i + 4] = i * elementSize
			result[offset * i + 5] = -1
		}
		// Vertical
		offset = (1 + elementsInPlaneSide) * 2 * 3
		for (let i = 0; i < elementsInPlaneSide; i++) {
			result[offset * i + 0] = i * elementSize
			result[offset * i + 1] = 0
			result[offset * i + 2] = -1
			result[offset * i + 3] = i * elementSize
			result[offset * i + 4] = elementsInPlaneSide * elementSize
			result[offset * i + 5] = -1
		}
		return result
	}
}

export class SquareGrid {
	squareSize = 32
	minSquareSize = 2
	originAt = new THREE.Vector4()
	prevOriginAt = new THREE.Vector4()
	deltaOriginAt = new THREE.Vector4()
	prevZoom = 1

	linesGeometry = new THREE.BufferGeometry()
	linesMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00 })
	constructor(w = window.innerWidth, h = window.innerHeight) {
		this.width = w
		this.height = h
		this.dpr = window.devicePixelRatio

		this.squares = new Squares()
	}

	init = (scene, camera) => {
		this.updateCameraVectors(camera)
		this.squares.updateViewport(
			this.width,
			this.height,
			this.originAt.x,
			this.originAt.y,
			camera.zoom
		)
		scene.add(this.squares.root)
	}

	viewportSquare(x, y) {
		const z = this.prevZoom
		const xAtCenter = x - this.width / 2
		const xFromOrigin = xAtCenter - this.originAt.x * z
		const yAtCenter = y - this.height / 2
		const yFromOrigin = yAtCenter + this.originAt.y * z
		const screenSquareSize = (this.squareSize * z) / this.dpr
		const sq = new THREE.Vector2(
			xFromOrigin / screenSquareSize,
			-yFromOrigin / screenSquareSize
		)

		if (sq.x > 0) {
			sq.x = Math.ceil(sq.x) - 1
		} else {
			sq.x = Math.floor(sq.x)
		}
		if (sq.y > 0) {
			sq.y = Math.ceil(sq.y) - 1
		} else {
			sq.y = Math.floor(sq.y)
		}

		return sq
	}

	updateCameraVectors(camera) {
		this.prevOriginAt.set(this.originAt.x, this.originAt.y, 0, 1)
		this.originAt.set(0, 0, 0, 1)
		this.originAt.applyMatrix4(camera.matrixWorldInverse)
		this.deltaOriginAt.set(
			this.originAt.x - this.prevOriginAt.x,
			this.originAt.y - this.prevOriginAt.y,
			0,
			1
		)
	}

	update(scene, camera) {
		this.updateCameraVectors(camera)
		// Only update the grid position if the camera has changed
		if (
			this.deltaOriginAt.x !== 0 ||
			this.deltaOriginAt.y !== 0 ||
			this.prevZoom !== camera.zoom
		) {
			this.squares.updateViewport(
				this.width,
				this.height,
				this.originAt.x,
				this.originAt.y,
				camera.zoom
			)
			this.prevZoom = camera.zoom
		}
	}
}
