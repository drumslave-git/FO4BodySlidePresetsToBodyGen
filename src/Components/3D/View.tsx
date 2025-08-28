import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useState } from "react"
import { AxesHelper, BufferGeometry, Float32BufferAttribute } from "three"

function View({ nifPath }: { nifPath: string }) {
	const [meshes, setMeshes] = useState([])
	// Dynamically sized 3D axis helper
	const [axisLength, setAxisLength] = useState(1)
	// Model center and radius for proper positioning and camera
	const [modelCenter, setModelCenter] = useState<[number, number, number]>([
		0, 0, 0,
	])
	const [modelRadius, setModelRadius] = useState(1)

	useEffect(() => {
		if (!nifPath) return
		;(async () => {
			// @ts-expect-error
			const meshData = await window.electronAPI.loadNIF(nifPath)
			setMeshes(meshData.meshes || [])
			// Estimate axis length based on mesh vertices
			if (meshData.meshes && meshData.meshes.length) {
				/**
				 * Compute a robust bounding volume across all vertices. NIF files
				 * sometimes include stray vertices or shapes far from the main
				 * model (e.g. collision shells). A straight min/max bounding box
				 * or averaging can be skewed by these outliers. Instead we
				 * perform a trimmed bounding box: sort each coordinate
				 * dimension and ignore the lowest 5% and highest 5% of values.
				 * The center is taken as the midpoint of the trimmed min/max,
				 * and the radius is half of the largest trimmed dimension. This
				 * approach yields a stable center and radius even when a few
				 * vertices are far away.
				 */
				const xs: number[] = []
				const ys: number[] = []
				const zs: number[] = []
				meshData.meshes.forEach((m: any) => {
					for (let i = 0; i < m.vertices.length; i++) {
						const [x, y, z] = m.vertices[i]
						xs.push(x)
						ys.push(y)
						zs.push(z)
					}
				})
				if (xs.length === 0) {
					setModelCenter([0, 0, 0])
					setModelRadius(1)
					setAxisLength(1)
				} else {
					// sort arrays to compute percentiles
					xs.sort((a, b) => a - b)
					ys.sort((a, b) => a - b)
					zs.sort((a, b) => a - b)
					const n = xs.length
					const lowerIdx = Math.floor(n * 0.05)
					const upperIdx = Math.floor(n * 0.95)
					const xmin = xs[lowerIdx]
					const xmax = xs[upperIdx]
					const ymin = ys[lowerIdx]
					const ymax = ys[upperIdx]
					const zmin = zs[lowerIdx]
					const zmax = zs[upperIdx]
					const cx = (xmin + xmax) / 2
					const cy = (ymin + ymax) / 2
					const cz = (zmin + zmax) / 2
					const dx = xmax - xmin
					const dy = ymax - ymin
					const dz = zmax - zmin
					// radius as half of the largest trimmed dimension
					const r = Math.max(dx, dy, dz) / 2
					setModelCenter([cx, cy, cz])
					// Provide some margin by multiplying radius
					const margin = 1.25
					setModelRadius(r * margin > 0 ? r * margin : 1)
					setAxisLength(r * margin > 0 ? r * margin : 1)
				}
			}
		})()
	}, [nifPath])

	if (!nifPath) {
		return <div>No NIF file provided.</div>
	}

	// Compute a reasonable initial camera position based on model center and radius.
	const cameraPos: [number, number, number] = [
		modelCenter[0] + modelRadius * 2,
		modelCenter[1] + modelRadius * 2,
		modelCenter[2] + modelRadius * 2,
	]

	return (
		<Canvas
			camera={{
				position: cameraPos,
				fov: 40,
				up: [0, 0, 1],
			}}
			style={{ width: "100%", height: "100%" }}
		>
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, 10]} />
			{/* Add 3D axes helper at model center */}
			<primitive
				object={new AxesHelper(modelRadius * 1.2)}
				position={modelCenter as any}
			/>
			{/* Render all meshes without rotation; keep Z‑up coordinate system */}
			<group>
				{meshes.map((m, idx) => {
					// @ts-expect-error
					const geometry = new BufferGeometry()
					geometry.setAttribute(
						"position",
						new Float32BufferAttribute(m.vertices.flat(), 3),
					)
					geometry.setAttribute(
						"normal",
						new Float32BufferAttribute(m.normals.flat(), 3),
					)
					geometry.setAttribute(
						"uv",
						new Float32BufferAttribute(m.uvs.flat(), 2),
					)
					geometry.setIndex(m.indices)
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: idx
						<mesh key={idx} geometry={geometry}>
							<meshStandardMaterial color="#cccccc" />
						</mesh>
					)
				})}
			</group>
			{/* Adds orbit and zoom controls targeting the model center */}
			<OrbitControls
				target={modelCenter as any}
				enableDamping
				dampingFactor={0.1}
				rotateSpeed={0.5}
				maxPolarAngle={Math.PI - 0.1}
			/>
		</Canvas>
	)
}

export default View
