import { OrbitControls, PerspectiveCamera, Resize } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import { BufferGeometry, Float32BufferAttribute } from "three"

import type { NifMesh } from "../../types"

const Model = ({ mesh }: { mesh: NifMesh }) => {
	const geometry = useMemo(() => {
		// @ts-expect-error
		const result = new BufferGeometry()
		if (!mesh) return result
		result.setAttribute(
			"position",
			new Float32BufferAttribute(mesh.vertices.flat(), 3),
		)
		result.setAttribute(
			"normal",
			new Float32BufferAttribute(mesh.normals.flat(), 3),
		)
		result.setAttribute("uv", new Float32BufferAttribute(mesh.uvs.flat(), 2))
		result.setIndex(mesh.indices)
		result.center()
		result.scale(1, 1, 1)
		result.rotateX(-Math.PI / 2)

		return result
	}, [mesh])

	if (!mesh) return null

	return (
		<Resize height>
			<mesh geometry={geometry}>
				<meshStandardMaterial color="#cccccc" />
			</mesh>
		</Resize>
	)
}

const View = ({ nifPath }: { nifPath: string }) => {
	const [nifMesh, setNifMesh] = useState<NifMesh | null>(null)

	useEffect(() => {
		if (!nifPath) return
		;(async () => {
			// @ts-expect-error
			const meshData = await window.electronAPI.loadNIF(nifPath)
			console.log(meshData.meshes)
			setNifMesh(meshData?.meshes?.at(0) || [])
		})()
	}, [nifPath])

	if (!nifPath) {
		return <div>No NIF file provided.</div>
	}

	return (
		<Canvas style={{ width: "100%", height: "100%" }}>
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, 10]} />
			{/* Add 3D axes helper at model center */}
			{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
			<Model mesh={nifMesh} />
			{/* Adds orbit and zoom controls targeting the model center */}
			<PerspectiveCamera makeDefault position={[1, 0.5, -1]} fov={35} />
			<OrbitControls makeDefault />
		</Canvas>
	)
}

export default View
