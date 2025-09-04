import { Group, Loader, LoadingOverlay, Text } from "@mantine/core"
import { createContext, type ReactNode, useContext, useState } from "react"

const OverlayContext = createContext<{
	isLoading: boolean | string
	setIsLoading: (v: string | boolean) => void
}>({
	isLoading: false,
	setIsLoading: () => {},
})

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
	const [isLoading, setIsLoading] = useState<string | boolean>(false)

	return (
		<OverlayContext.Provider value={{ isLoading, setIsLoading }}>
			<LoadingOverlay
				zIndex={1000}
				visible={!!isLoading}
				pos="fixed"
				loaderProps={{
					children: (
						<Group>
							<Loader />
							{typeof isLoading === "string" && <Text>{isLoading}</Text>}
						</Group>
					),
				}}
			/>
			{children}
		</OverlayContext.Provider>
	)
}

export const useOverlay = () => useContext(OverlayContext)
