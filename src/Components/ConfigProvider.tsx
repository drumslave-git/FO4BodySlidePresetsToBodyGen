import { LoadingOverlay } from "@mantine/core"
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react"

import type { Config } from "../types"

const ConfigContext = createContext<Config>({})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
	const [config, setConfig] = useState<Config>({})
	const [loading, setLoading] = useState(true)
	useEffect(() => {
		// @ts-expect-error
		window.electronAPI.loadConfig().then((config: Config) => {
			setConfig(config)
			setLoading(false)
		})
	}, [])
	return (
		<ConfigContext.Provider value={config}>
			{loading ? (
				<LoadingOverlay zIndex={1000} visible pos="fixed" />
			) : (
				children
			)}
		</ConfigContext.Provider>
	)
}

export const useConfig = () => useContext(ConfigContext)
