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
	setFolder: (folder: string, path: string) => void
}

const ConfigContext = createContext<ConfigContextValue>({
	setFolder: () => {},
})

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

	const setFolder = useCallback(async (folder: string, path: string) => {
		setConfig((prevConfig) => ({
			...prevConfig,
			[folder]: path,
		}))
	}, [])

	return (
		<ConfigContext.Provider
			value={{
				...config,
				setFolder,
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
