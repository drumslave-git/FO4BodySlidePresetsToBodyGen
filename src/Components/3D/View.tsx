import { AspectRatio } from "@mantine/core"
import { OrbitControls, PerspectiveCamera, Resize } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import * as THREE from "three"

import type {
	BodySlidePreset,
	NifMesh,
	TriBodySlide,
	TriMorphSparse,
} from "../../types"

/** Quick index for O(1) morph lookup by name. */
export function indexMorphs(tri: TriBodySlide): Map<string, TriMorphSparse> {
	const m = new Map<string, TriMorphSparse>()
	for (const morph of tri.morphs) m.set(morph.name, morph)
	return m
}

function applyBodySlideMorphs(
	basePositions: Float32Array,
	tri: TriBodySlide,
	sliders: BodySlidePreset["sliders"],
): Float32Array {
	const out = new Float32Array(basePositions)
	const map = indexMorphs(tri)

	for (const { name, value } of sliders) {
		if (!value) continue
		const morph = map.get(name)
		if (!morph) {
			console.warn(`No morph found for slider "${name}"`)
			continue
		}

		const s = morph.scale * value
		for (const e of morph.entries) {
			const i3 = e.index * 3
			out[i3] += e.dx * s
			out[i3 + 1] += e.dy * s
			out[i3 + 2] += e.dz * s
		}
	}
	return out
}

const Model = ({
	mesh,
	tri,
	sliders,
}: {
	mesh: NifMesh
	tri: TriBodySlide
	sliders: BodySlidePreset["sliders"]
}) => {
	const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
	useEffect(() => {
		if (!mesh || !tri) {
			setGeometry(null)
			return
		}

		// @ts-expect-error
		const geo = new THREE.BufferGeometry()

		const basePositions = new Float32Array(mesh.vertices.flat())
		const morphed = applyBodySlideMorphs(basePositions, tri, sliders)
		geo.setAttribute("position", new THREE.Float32BufferAttribute(morphed, 3))

		geo.setAttribute(
			"normal",
			new THREE.Float32BufferAttribute(mesh.normals.flat(), 3),
		)

		geo.setAttribute("uv", new THREE.Float32BufferAttribute(mesh.uvs.flat(), 2))

		geo.setIndex(mesh.indices)

		geo.center()
		geo.scale(1, 1, 1)
		geo.rotateX(-Math.PI / 2)

		setGeometry(geo)
	}, [mesh, tri, sliders])

	if (!geometry) return null

	return (
		<Resize height>
			<mesh geometry={geometry}>
				<meshStandardMaterial color="#cccccc" />
			</mesh>
		</Resize>
	)
}

const View = ({
	nifPath,
	triPath,
	sliders = [],
}: {
	nifPath: string
	triPath: string
	sliders?: BodySlidePreset["sliders"]
}) => {
	const [data, setData] = useState<{ nif: NifMesh; tri: TriBodySlide } | null>(
		null,
	)

	useEffect(() => {
		if (!nifPath || !triPath) return
		;(async () => {
			// @ts-expect-error
			const meshData = await window.electronAPI.loadNIF(nifPath)
			console.log(meshData.meshes)
			// @ts-expect-error
			const triData = await window.electronAPI.loadTRI(triPath)
			console.log("TRI data:", triData)
			setData({ nif: meshData.meshes[0], tri: triData })
		})()
	}, [nifPath, triPath])

	if (!nifPath) {
		return <div>No NIF file provided.</div>
	}

	if (!triPath) {
		return <div>No TRI file provided.</div>
	}

	if (!data) {
		return <div>Loading...</div>
	}

	return (
		<AspectRatio ratio={1}>
			<Canvas style={{ width: "100%", height: "100%" }}>
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, -10]} />
				<directionalLight position={[-10, 10, 10]} />
				{/* Add 3D axes helper at model center */}
				{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
				<Model mesh={data.nif} tri={data.tri} sliders={sliders} />
				<PerspectiveCamera makeDefault position={[1, 0.5, -1]} fov={40} />
				<OrbitControls makeDefault />
			</Canvas>
		</AspectRatio>
	)
}

export default View
