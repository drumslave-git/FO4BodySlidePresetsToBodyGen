import { Bounds, Center, OrbitControls, Resize } from "@react-three/drei"
import { Canvas, useLoader } from "@react-three/fiber"
import { Suspense, useMemo } from "react"
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

type BodySlideModelPreviewProps = {
	url: string
	height?: number
}

const Model = ({ url }: { url: string }) => {
	const gltf = useLoader(GLTFLoader, url)
	useMemo(() => {
		const box = new Box3().setFromObject(gltf.scene)
		const center = box.getCenter(new Vector3())
		gltf.scene.position.sub(center)
		const material = new MeshStandardMaterial({
			color: 0xdcc8be,
			metalness: 0.0,
			roughness: 0.6,
		})
		gltf.scene.traverse((obj) => {
			if ((obj as Mesh).isMesh) {
				;(obj as Mesh).material = material
			}
		})
	}, [gltf])
	return <primitive object={gltf.scene} />
}

const BodySlideModelPreview = ({
	url,
	height = 400,
}: BodySlideModelPreviewProps) => {
	return (
		<div style={{ height }}>
			<Canvas camera={{ position: [0, 1, -4], fov: 45 }}>
				<OrbitControls makeDefault />
				<directionalLight position={[3, 4, -5]} intensity={1} />
				<directionalLight position={[1, 1, 5]} intensity={1} />
				<Suspense fallback={null}>
					<Bounds fit clip observe>
						<Center>
							<Resize>
								<Model url={url} />
							</Resize>
						</Center>
					</Bounds>
				</Suspense>
			</Canvas>
		</div>
	)
}

export default BodySlideModelPreview
