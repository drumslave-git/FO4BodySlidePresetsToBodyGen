import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"

import type { Config } from "../types"
import { useOverlay } from "./OverlayProvider"

type ConfigContextValue = Config & {
	loadConfig: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextValue>({
	loadConfig: async () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
	const [config, setConfig] = useState<Config>({})
	const { setIsLoading } = useOverlay()

	const loadConfig = useCallback(async () => {
		setIsLoading("Loading configuration...")
		// @ts-expect-error
		window.electronAPI.readConfig().then((config: Config) => {
			setConfig(config)
			setIsLoading(false)
		})
	}, [setIsLoading])

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
			{children}
		</ConfigContext.Provider>
	)
}

export const useConfig = () => useContext(ConfigContext)
