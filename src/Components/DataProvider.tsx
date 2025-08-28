import { LoadingOverlay } from "@mantine/core"
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"
import {
	type BodyNIFFiles,
	type BodySlidePresetParsed,
	BodyType,
	type ESM,
} from "../types"
import { useConfig } from "./ConfigProvider"
import { useSharedState } from "./SharedStateProvider"

type DataContextValue = {
	ESMs: ESM[]
	bodySlidePresetsParsed: BodySlidePresetParsed[]
	NIFs: BodyNIFFiles
	validateESMs: () => void
	defaultTemplates: string
}

const defaultNIFs: BodyNIFFiles = {
	[BodyType.maleBody]: "",
	[BodyType.femaleBody]: "",
}

const DataContext = createContext<DataContextValue>({
	ESMs: [],
	bodySlidePresetsParsed: [],
	validateESMs: () => {},
	defaultTemplates: "",
	NIFs: defaultNIFs,
})

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const { dataFolder } = useConfig()
	const { templatesContent } = useSharedState()
	const [loading, setLoading] = useState(true)
	const [defaultTemplates, setDefaultTemplates] = useState("")
	const [ESMs, setESMs] = useState<ESM[]>([])
	const [NIFs, setNIFs] = useState<BodyNIFFiles>(defaultNIFs)
	const [bodySlidePresetsParsed, setBodySlidePresetsParsed] = useState<
		BodySlidePresetParsed[]
	>([])

	useEffect(() => {
		setLoading(true)
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			setBodySlidePresetsParsed((prev) => (prev.length ? [] : prev))
			setNIFs(defaultNIFs)
			setDefaultTemplates("")
			setLoading(false)
			return
		}
		const load = async () => {
			setBodySlidePresetsParsed(
				// @ts-expect-error
				await window.electronAPI.resolveBodySlidePresets(dataFolder),
			)
			setDefaultTemplates(
				// @ts-expect-error
				await window.electronAPI.readDefaultTemplates(),
			)
			setNIFs(
				// @ts-expect-error
				await window.electronAPI.resolveNIFs(dataFolder),
			)
			setLoading(false)
		}
		void load()
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
			value={{
				ESMs,
				bodySlidePresetsParsed,
				NIFs,
				validateESMs,
				defaultTemplates,
			}}
		>
			<LoadingOverlay zIndex={1000} visible={loading} pos="fixed" />
			{children}
		</DataContext.Provider>
	)
}

export const useData = () => useContext(DataContext)
