import { AspectRatio } from "@mantine/core"
import {
	GizmoHelper,
	GizmoViewport,
	OrbitControls,
	PerspectiveCamera,
	Resize,
} from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useEffect, useState } from "react"
import { BufferGeometry, Float32BufferAttribute } from "three"

import type {
	BodySlidePreset,
	BodyType,
	NifMesh,
	TriBodySlide,
	TriMorphSparse,
} from "../../types"
import { useData } from "../DataProvider"

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
	const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
	useEffect(() => {
		if (!mesh || !tri) {
			setGeometry(null)
			return
		}

		// @ts-expect-error
		const geo = new BufferGeometry()

		const basePositions = new Float32Array(mesh.vertices.flat())
		const morphed = applyBodySlideMorphs(basePositions, tri, sliders)
		geo.setAttribute("position", new Float32BufferAttribute(morphed, 3))

		geo.setAttribute(
			"normal",
			new Float32BufferAttribute(mesh.normals.flat(), 3),
		)

		geo.setAttribute("uv", new Float32BufferAttribute(mesh.uvs.flat(), 2))

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
	bodyType,
	sliders = [],
}: {
	bodyType: BodyType
	sliders?: BodySlidePreset["sliders"]
}) => {
	const { bodies } = useData()

	if (!bodies[bodyType].nif || !bodies[bodyType].tri) return null

	return (
		<AspectRatio ratio={1}>
			<Canvas style={{ width: "100%", height: "100%" }}>
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, -10]} />
				<directionalLight position={[-10, 10, 10]} />
				{/* Add 3D axes helper at model center */}
				{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
				<Model
					mesh={bodies[bodyType].nif}
					tri={bodies[bodyType].tri}
					sliders={sliders}
				/>
				<PerspectiveCamera makeDefault position={[1, 0.5, -1]} fov={40} />
				<OrbitControls makeDefault />
				<GizmoHelper
					alignment="bottom-right" // widget alignment within scene
					margin={[50, 50]} // widget margins (X, Y)
				>
					<GizmoViewport
						axisColors={["red", "green", "blue"]}
						labelColor="white"
					/>
				</GizmoHelper>
			</Canvas>
		</AspectRatio>
	)
}

export default View
