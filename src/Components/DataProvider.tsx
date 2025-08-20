import { LoadingOverlay } from "@mantine/core"
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react"
import type { BodySlidePresetParsed, ESM, Slider } from "../types"
import { useConfig } from "./ConfigProvider"
import { useSharedState } from "./SharedStateProvider"

type DataContextValue = {
	ESMs: ESM[]
	bodySlidePresetsParsed: BodySlidePresetParsed[]
}

const DataContext = createContext<DataContextValue>({
	ESMs: [],
	bodySlidePresetsParsed: [],
})

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const { dataFolder } = useConfig()
	const { templatesContent } = useSharedState()
	const [loading, setLoading] = useState(true)
	const [ESMs, setESMs] = useState<ESM[]>([])
	const [bodySlidePresetsParsed, setBodySlidePresetsParsed] = useState<
		BodySlidePresetParsed[]
	>([])

	useEffect(() => {
		setLoading(true)
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			setBodySlidePresetsParsed((prev) => (prev.length ? [] : prev))
			setLoading(false)
			return
		}
		// @ts-expect-error
		window.electronAPI.resolveBodySlidePresets(dataFolder).then((data) => {
			setBodySlidePresetsParsed(data)
			setLoading(false)
		})
	}, [dataFolder])

	useEffect(() => {
		;(templatesContent
			? // @ts-expect-error
				window.electronAPI.validateESMs(dataFolder, templatesContent)
			: // @ts-expect-error
				window.electronAPI.resolveESMs(dataFolder)
		).then(setESMs)
	}, [dataFolder, templatesContent])

	return (
		<DataContext.Provider value={{ ESMs, bodySlidePresetsParsed }}>
			<LoadingOverlay zIndex={1000} visible={loading} pos="fixed" />
			{children}
		</DataContext.Provider>
	)
}

export const useData = () => useContext(DataContext)
