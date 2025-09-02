import { LoadingOverlay } from "@mantine/core"
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"

import type { Config } from "../types"

type ConfigContextValue = Config & {
	loadConfig: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextValue>({
	loadConfig: async () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
	const [config, setConfig] = useState<Config>({})
	const [loading, setLoading] = useState(true)

	const loadConfig = useCallback(async () => {
		setLoading(true)
		// @ts-expect-error
		window.electronAPI.readConfig().then((config: Config) => {
			setConfig(config)
			setLoading(false)
		})
	}, [])

	useEffect(() => {
		void loadConfig()
	}, [loadConfig])

	return (
		<ConfigContext.Provider
			value={{
				...config,
				loadConfig,
			}}
		>
			{loading ? (
				<LoadingOverlay zIndex={1000} visible pos="fixed" />
			) : (
				children
			)}
		</ConfigContext.Provider>
	)
}

export const useConfig = () => useContext(ConfigContext)
