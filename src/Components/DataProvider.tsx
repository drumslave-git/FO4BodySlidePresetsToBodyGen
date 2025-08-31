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
	type BodyFiles,
	type BodySlidePresetParsed,
	BodyType,
	type ESM,
} from "../types"
import { useConfig } from "./ConfigProvider"
import { useSharedState } from "./SharedStateProvider"

type DataContextValue = {
	ESMs: ESM[]
	bodySlidePresetsParsed: BodySlidePresetParsed[]
	bodyFiles: BodyFiles
	validateESMs: () => void
	defaultTemplates: string
}

const defaultBodyFiles: BodyFiles = {
	[BodyType.maleBody]: {
		nif: "",
		tri: "",
	},
	[BodyType.femaleBody]: {
		nif: "",
		tri: "",
	},
}

const DataContext = createContext<DataContextValue>({
	ESMs: [],
	bodySlidePresetsParsed: [],
	validateESMs: () => {},
	defaultTemplates: "",
	bodyFiles: defaultBodyFiles,
})

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const { dataFolder } = useConfig()
	const { templatesContent } = useSharedState()
	const [loading, setLoading] = useState(true)
	const [defaultTemplates, setDefaultTemplates] = useState("")
	const [ESMs, setESMs] = useState<ESM[]>([])
	const [bodyFiles, setBodyFiles] = useState<BodyFiles>(defaultBodyFiles)
	const [bodySlidePresetsParsed, setBodySlidePresetsParsed] = useState<
		BodySlidePresetParsed[]
	>([])

	useEffect(() => {
		setLoading(true)
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			setBodySlidePresetsParsed((prev) => (prev.length ? [] : prev))
			setBodyFiles(defaultBodyFiles)
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
			setBodyFiles(
				// @ts-expect-error
				await window.electronAPI.resolveBodyFiles(dataFolder),
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
				bodyFiles,
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
