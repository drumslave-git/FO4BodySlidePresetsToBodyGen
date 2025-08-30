import { OrbitControls, PerspectiveCamera, Resize } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import * as THREE from "three"

import type { BodySlideTri, NifMesh } from "../../types"

const Model = ({ mesh, tri }: { mesh: NifMesh; tri: BodySlideTri }) => {
	const geometry = useMemo(() => {
		if (!mesh || !tri) return null

		// @ts-expect-error
		const geo = new THREE.BufferGeometry()

		geo.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(mesh.vertices.flat(), 3),
		)

		geo.setAttribute(
			"normal",
			new THREE.Float32BufferAttribute(mesh.normals.flat(), 3),
		)

		new THREE.Float32BufferAttribute(mesh.uvs.flat(), 2)

		geo.setIndex(mesh.indices)

		geo.center()
		geo.scale(1, 1, 1)
		geo.rotateX(-Math.PI / 2)

		return geo
	}, [mesh, tri])

	if (!geometry) return null

	return (
		<Resize height>
			<mesh geometry={geometry}>
				<meshStandardMaterial color="#cccccc" />
			</mesh>
		</Resize>
	)
}

const View = ({ nifPath }: { nifPath: string }) => {
	const [data, setData] = useState<{ nif: NifMesh; tri: BodySlideTri } | null>(
		null,
	)

	useEffect(() => {
		if (!nifPath) return
		;(async () => {
			// @ts-expect-error
			const meshData = await window.electronAPI.loadNIF(nifPath)
			console.log(meshData.meshes)
			// @ts-expect-error
			const triData = await window.electronAPI.loadTRI(
				nifPath.replace(/\.nif$/i, ".tri"),
			)
			console.log("TRI data:", triData)
			setData({ nif: meshData.meshes[0], tri: triData })
		})()
	}, [nifPath])

	if (!nifPath) {
		return <div>No NIF file provided.</div>
	}

	if (!data) {
		return <div>Loading...</div>
	}

	return (
		<Canvas style={{ width: "100%", height: "100%" }}>
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, -10]} />
			<directionalLight position={[-10, 10, 10]} />
			{/* Add 3D axes helper at model center */}
			{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
			<Model mesh={data.nif} tri={data.tri} />
			{/* Adds orbit and zoom controls targeting the model center */}
			<PerspectiveCamera makeDefault position={[1, 0.5, -1]} fov={35} />
			<OrbitControls makeDefault />
		</Canvas>
	)
}

export default View
