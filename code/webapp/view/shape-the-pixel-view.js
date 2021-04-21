import { SquareGrid } from "./square-grid.js"
import { MapControls } from "./controls.js"

const { THREE } = External

export class View {
	width = window.innerWidth
	height = window.innerHeight
	aspect = this.width / this.height
	renderer = new THREE.WebGLRenderer({ antialias: true })
	scene = new THREE.Scene()
	frustumSize = 1000
	camera = new THREE.OrthographicCamera(
		(this.frustumSize * this.aspect) / -2,
		(this.frustumSize * this.aspect) / 2,
		this.frustumSize / 2,
		this.frustumSize / -2,
		1,
		1000
	)
	controls = new MapControls(this.camera, this.renderer.domElement)

	constructor(container = document.body) {
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(this.width, this.height)

		this.scene.background = new THREE.Color(0xfafaf3)

		this.controls.rotateSpeed = 1.0
		this.controls.zoomSpeed = this.isMobile ? 1.0 : 0.2
		// this.controls.panSpeed = 1.0

		container.appendChild(this.renderer.domElement)
		window.addEventListener("resize", this.onWindowResize)
		this.placeItems()
		this.render()
	}

	placeItems() {
		const geometryBox = this.box(50, 50, 50)

		const lineSegments = new THREE.LineSegments(
			geometryBox,
			new THREE.LineDashedMaterial({
				color: 0xffaa00,
				dashSize: 3,
				gapSize: 1,
			})
		)
		lineSegments.computeLineDistances()
		this.scene.add(lineSegments)
	}

	box(width, height, depth) {
		;(width = width * 0.5), (height = height * 0.5), (depth = depth * 0.5)

		const geometry = new THREE.BufferGeometry()
		const position = []

		position.push(
			-width,
			-height,
			-depth,
			-width,
			height,
			-depth,

			-width,
			height,
			-depth,
			width,
			height,
			-depth,

			width,
			height,
			-depth,
			width,
			-height,
			-depth,

			width,
			-height,
			-depth,
			-width,
			-height,
			-depth,

			-width,
			-height,
			depth,
			-width,
			height,
			depth,

			-width,
			height,
			depth,
			width,
			height,
			depth,

			width,
			height,
			depth,
			width,
			-height,
			depth,

			width,
			-height,
			depth,
			-width,
			-height,
			depth,

			-width,
			-height,
			-depth,
			-width,
			-height,
			depth,

			-width,
			height,
			-depth,
			-width,
			height,
			depth,

			width,
			height,
			-depth,
			width,
			height,
			depth,

			width,
			-height,
			-depth,
			width,
			-height,
			depth
		)

		geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(new Float32Array(position), 3)
		)
		return geometry
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
	onWindowResize = () => {
		this.width = window.innerWidth
		this.height = window.innerHeight
		this.aspect = this.width / this.height

		this.camera.left = (-this.frustumSize * this.aspect) / 2
		this.camera.right = (this.frustumSize * this.aspect) / 2
		this.camera.top = this.frustumSize / 2
		this.camera.bottom = -this.frustumSize / 2

		this.camera.updateProjectionMatrix()

		this.renderer.setSize(this.width, this.height)
	}

	render() {
		const time = Date.now() * 0.001

		this.scene.traverse(function (object) {
			if (object.isLine) {
				object.rotation.x = 0.25 * time
				object.rotation.y = 0.25 * time
			}
		})

		this.renderer.render(this.scene, this.camera)
	}

	animate = () => {
		requestAnimationFrame(this.animate)

		this.render()
	}
}
