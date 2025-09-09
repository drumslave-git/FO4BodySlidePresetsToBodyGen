import { AspectRatio } from "@mantine/core"
import {
	OrbitControls,
	PerspectiveCamera,
	Resize,
	View,
} from "@react-three/drei"
import {
	Fragment,
	type ReactNode,
	Suspense,
	useEffect,
	useMemo,
	useRef,
} from "react"

import { BufferGeometry, Float32BufferAttribute, type Mesh } from "three"

import type {
	BodySlidePreset,
	BodyType,
	MorphSlider,
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
	sliders: MorphSlider[] | string,
): Float32Array {
	const out = new Float32Array(basePositions)
	const map = indexMorphs(tri)

	let slidersArray: MorphSlider[] = []
	if (typeof sliders === "string") {
		slidersArray = sliders.split(",").map((s) => {
			const [name, value] = s.split("@")
			return { name, value: Number(value) }
		})
	} else {
		slidersArray = sliders
	}

	for (const { name, value } of slidersArray) {
		if (!value) continue
		const morph = map.get(name)
		if (!morph) {
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

const createGeometry = (
	mesh: NifMesh,
	tri: TriBodySlide,
	sliders: BodySlidePreset["sliders"] | string = [],
) => {
	if (!mesh || !tri) {
		return null
	}

	// @ts-expect-error
	const geo = new BufferGeometry()

	const basePositions = new Float32Array(mesh.vertices.flat())
	const morphed = applyBodySlideMorphs(basePositions, tri, sliders)
	geo.setAttribute("position", new Float32BufferAttribute(morphed, 3))

	geo.setAttribute("normal", new Float32BufferAttribute(mesh.normals.flat(), 3))

	geo.setAttribute("uv", new Float32BufferAttribute(mesh.uvs.flat(), 2))

	geo.setIndex(mesh.indices)

	geo.center()
	geo.scale(1, 1, 1)
	geo.rotateX(-Math.PI / 2)

	return geo
}

const BodyMesh = ({ geometry }: { geometry: BufferGeometry | null }) => {
	if (!geometry) return null

	return (
		<Resize height>
			<mesh geometry={geometry}>
				<meshStandardMaterial color="#cccccc" />
			</mesh>
		</Resize>
	)
}

const Scene = (props: { enableZoom?: boolean }) => {
	const { enableZoom = false } = props
	return (
		<>
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, -10]} />
			<directionalLight position={[-10, 10, 10]} />
			{/* Add 3D axes helper at model center */}
			{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
			<PerspectiveCamera makeDefault position={[1, 0.5, -1]} fov={40} />
			<OrbitControls
				enableZoom={enableZoom}
				// autoRotate
				// autoRotateSpeed={1}
				makeDefault
			/>
		</>
	)
}

const BodyView = (props: {
	bodyType: BodyType
	sliders?: BodySlidePreset["sliders"] | string
	enableZoom?: boolean
	squire?: boolean
}) => {
	const { bodies } = useData()

	const Wrapper = useMemo(() => {
		if (!props.squire) return Fragment
		return ({ children }: { children: ReactNode }) => (
			<AspectRatio ratio={1}>{children}</AspectRatio>
		)
	}, [props])

	const geometry = useMemo(() => {
		return createGeometry(
			bodies[props.bodyType].nif,
			bodies[props.bodyType].tri,
			props.sliders,
		)
	}, [bodies, props])

	return (
		<Wrapper>
			<View style={{ overflow: "hidden", width: "100%", height: "100%" }}>
				<Suspense fallback={null}>
					<Scene enableZoom={props.enableZoom} />
					<BodyMesh geometry={geometry} />
				</Suspense>
			</View>
		</Wrapper>
	)
}

export default BodyView
