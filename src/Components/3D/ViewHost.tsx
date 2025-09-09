import { View } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"

export default function ViewHost() {
	return (
		<Canvas
			style={{
				position: "fixed",
				inset: 0,
				overflow: "hidden",
				zIndex: 1,
			}}
			eventSource={document.body}
		>
			<View.Port />
		</Canvas>
	)
}
