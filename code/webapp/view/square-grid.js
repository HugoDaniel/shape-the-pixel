const { THREE } = External
export class SquareGrid {
	mesh

	hLineGeometry = new THREE.BufferGeometry()
	hLineMesh
	// The maximum possible horizontal lines
	totalHorizontalLines = 10
	constructor(w = window.innerWidth, h = window.innerHeight) {
		const hVertices = new Float32Array([0, 0, 10.0, w, 0, 10.0])
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
	}

	init(scene) {
		scene.add(this.hLineMesh)
	}

	render() {}
}
