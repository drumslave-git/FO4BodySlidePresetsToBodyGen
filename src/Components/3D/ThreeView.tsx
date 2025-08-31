import { AspectRatio } from "@mantine/core"
import { Box, OrbitControls, PerspectiveCamera, View } from "@react-three/drei"
import type { ReactNode } from "react"

const ThreeView = ({ children }: { children: ReactNode }) => {
	return (
		<AspectRatio ratio={1}>
			<View>
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, -10]} />
				<directionalLight position={[-10, 10, 10]} />
				{/* Add 3D axes helper at model center */}
				{/*<primitive object={new AxesHelper(1)} position={[0, 0, 0]} />*/}
				{children ? children : <Box material-color="hotpink" />}
				<PerspectiveCamera makeDefault position={[1, 0.5, -1]} fov={40} />
				<OrbitControls makeDefault />
			</View>
		</AspectRatio>
	)
}

export default ThreeView
