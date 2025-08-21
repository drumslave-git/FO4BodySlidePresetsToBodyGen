import { LoadingOverlay } from "@mantine/core"
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"
import type { BodySlidePresetParsed, ESM } from "../types"
import { useConfig } from "./ConfigProvider"
import { useSharedState } from "./SharedStateProvider"

type DataContextValue = {
	ESMs: ESM[]
	bodySlidePresetsParsed: BodySlidePresetParsed[]
	validateESMs: () => void
}

const DataContext = createContext<DataContextValue>({
	ESMs: [],
	bodySlidePresetsParsed: [],
	validateESMs: () => {},
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

	const validateESMs = useCallback(() => {
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			return
		}
		;(templatesContent
			? // @ts-expect-error
				window.electronAPI.validateESMs(dataFolder, templatesContent)
			: // @ts-expect-error
				window.electronAPI.resolveESMs(dataFolder)
		).then(setESMs)
	}, [dataFolder, templatesContent])

	useEffect(() => {
		validateESMs()
	}, [validateESMs])

	return (
		<DataContext.Provider
			value={{ ESMs, bodySlidePresetsParsed, validateESMs }}
		>
			<LoadingOverlay zIndex={1000} visible={loading} pos="fixed" />
			{children}
		</DataContext.Provider>
	)
}

export const useData = () => useContext(DataContext)
