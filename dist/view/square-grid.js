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
		/*

		const maxHorizontalLines = this.height / this.minSquareSize
		const maxVerticalLines = this.width / this.minSquareSize
		const linesBuffer = new THREE.BufferAttribute(
			new Float32Array(maxHorizontalLines * maxVerticalLines * 2 * 3),
			// 2 vertices per line, with 3 coordinates per vertex    ^   ^
			3
		)
		linesBuffer.setUsage(THREE.DynamicDrawUsage)
		this.linesGeometry.setAttribute("position", linesBuffer)
		this.hLineGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(hVertices, 3)
		)
		this.hLineMesh = new THREE.InstancedMesh(
			this.hLineGeometry,
			new THREE.LineDashedMaterial({
				color: 0xffaa00,
				dashSize: 3,
				gapSize: 1,
			}),
			this.totalHorizontalLines
		)
		this.hLineMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
		*/
	}

	init = (scene, camera) => {
		this.ptsGeometry = new THREE.BufferGeometry()
		const position = []
		const z = -1

		addEventListener("click", e => {
			this.squares.updateViewport(
				this.width,
				this.height,
				this.originAt.x,
				this.originAt.y,
				camera.zoom
			)
		})
		addEventListener("keydown", e => {
			if (e.key === " ") {
				this.squares.updateViewport(
					this.width,
					this.height,
					this.originAt.x,
					this.originAt.y,
					camera.zoom
				)
			}
		})
		/*
		position.push(-1265.493198566036, 1396.312871730535, z)
		position.push(-window.innerWidth / 2, 0, z)
		position.push(-window.innerWidth / 2, -window.innerHeight / 2, z)
		position.push(window.innerWidth / 2, window.innerHeight / 2, z)
		position.push(-window.innerWidth / 2, window.innerHeight / 2, z)
		position.push(window.innerWidth / 2, -window.innerHeight / 2, z)
		position.push(0, window.innerHeight / 2, z)
		position.push(0, -window.innerHeight / 2, z)
*/
		this.ptsGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(new Float32Array(position), 3)
		)
		this.pts = new THREE.Points(
			this.ptsGeometry,
			new THREE.PointsMaterial({ color: 0x0000ee, size: 20 })
		)
		scene.add(this.pts)
		/*
		this.lines = new THREE.LineSegments(
			this.linesGeometry,
			this.linesMaterial
		)
*/
		// this.updateLines(camera)
		// 		scene.add(this.lines)

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
		if (
			this.deltaOriginAt.x !== 0 ||
			this.deltaOriginAt.y !== 0 ||
			this.prevZoom !== camera.zoom
		) {
			// Camera changed, update the grid positioning
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

	updatePoints = zoom => {
		this.pts.translateX(-this.deltaOriginAt.x)
		this.pts.translateY(-this.deltaOriginAt.y)

		this.ptsGeometry.attributes.position.setXY(
			0,
			(this.width / 2) * zoom,
			0
		)
		this.ptsGeometry.attributes.position.setXY(
			1,
			(-this.width / 2) * zoom,
			0
		)
		this.ptsGeometry.attributes.position.setXY(
			2,
			0,
			-(this.height / 2) * zoom
		)
		this.ptsGeometry.attributes.position.setXY(
			3,
			0,
			(this.height / 2) * zoom
		)
		/*
		this.ptsGeometry.attributes.position.setXY(4, -limits.x, limits.y)
		this.ptsGeometry.attributes.position.setXY(5, limits.x, -limits.y)
		this.ptsGeometry.attributes.position.setXY(6, 0, -limits.y)
		this.ptsGeometry.attributes.position.setXY(7, 0, limits.y)
		*/
		this.ptsGeometry.attributes.position.needsUpdate = true
	}

	updateLines(camera) {
		const zoom = camera.zoom
		const showLog = false
		let limits = new Vector4(
			this.width / 2 - this.originAt.x,
			this.height / 2,
			0,
			1
		)
		// limits.applyMatrix4(camera.matrixWorldInverse)
		if (showLog)
			console.log(
				"ORIGIN AT",
				this.originAt.x * zoom,
				this.originAt.y * zoom,
				limits.x,
				limits.y,
				zoom
			)
		this.updatePoints(1 / zoom)
		const size = this.squareSize
		const buffer = this.lines.geometry.attributes.position
		// Draw horizontal lines
		buffer.needsUpdate = true
		const invZoom = 1 / zoom

		/*
		const zoomedSize = this.squareSize
		const totalHorizontalLines = this.height / zoomedSize
		const totalVerticalLines = this.width / zoomedSize
		this.linesGeometry.setDrawRange(0, totalHorizontalLines * 3)
		const startY =
			this.height / 2 +
			zoomedSize -
			(this.originAt.y % zoomedSize) -
			zoomedSize
		const startX = (0 / zoomedSize) % zoomedSize
		const horizontalLimit = this.width / 2 / zoom
		for (let i = 0; i < totalHorizontalLines; i++) {
			buffer.array[i * 2 * 3 + 0] = -horizontalLimit
			buffer.array[i * 2 * 3 + 1] = startY - i * zoomedSize
			buffer.array[i * 2 * 3 + 2] = -1

			buffer.array[i * 2 * 3 + 3] = horizontalLimit
			buffer.array[i * 2 * 3 + 4] = startY - i * zoomedSize
			buffer.array[i * 2 * 3 + 5] = -1
		}
		this.lines.translateX(-this.deltaOriginAt.x)
		this.lines.translateY(-this.deltaOriginAt.y)
		*/
	}
}
