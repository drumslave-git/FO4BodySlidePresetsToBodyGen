import { AspectRatio } from "@mantine/core"
import { Box, OrbitControls, PerspectiveCamera, View } from "@react-three/drei"
// import { useThree } from "@react-three/fiber"
import { Fragment, type ReactNode, Suspense, useMemo } from "react"

const Scene = (props: { children: ReactNode; enableZoom?: boolean }) => {
	const { children = [], enableZoom = false } = props
	// const three = useThree()
	// console.log(three.get())
	return (
		<>
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, -10]} />
			<directionalLight position={[-10, 10, 10]} />
			{/* Add 3D axes helper at model center */}
			{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
			{children ? children : <Box material-color="hotpink" />}
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

const ThreeView = (props: {
	children: ReactNode
	enableZoom?: boolean
	squire?: boolean
}) => {
	const { children = [], enableZoom = false, squire = false } = props
	const Wrapper = useMemo(() => {
		if (!squire) return Fragment
		return ({ children }: { children: ReactNode }) => (
			<AspectRatio ratio={1}>{children}</AspectRatio>
		)
	}, [squire])

	return (
		<Wrapper>
			<View style={{ overflow: "hidden", width: "100%", height: "100%" }}>
				<Suspense fallback={null}>
					<Scene enableZoom={enableZoom}>{children}</Scene>
				</Suspense>
			</View>
		</Wrapper>
	)
}

export default ThreeView
