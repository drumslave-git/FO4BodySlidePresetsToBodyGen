import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"
import {
	type Bodies,
	type BodyFiles,
	type BodySlidePresetParsed,
	BodyType,
	type ESM,
} from "../types"
import { useConfig } from "./ConfigProvider"
import { useOverlay } from "./OverlayProvider"
import { useSharedState } from "./SharedStateProvider"

type DataContextValue = {
	ESMs: ESM[]
	bodySlidePresetsParsed: BodySlidePresetParsed[]
	bodyFiles: BodyFiles
	bodies: Bodies
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

const defaultBodies: Bodies = {
	[BodyType.maleBody]: {
		nif: null,
		tri: null,
	},
	[BodyType.femaleBody]: {
		nif: null,
		tri: null,
	},
}

const DataContext = createContext<DataContextValue>({
	ESMs: [],
	bodySlidePresetsParsed: [],
	validateESMs: () => {},
	defaultTemplates: "",
	bodyFiles: defaultBodyFiles,
	bodies: defaultBodies,
})

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const { dataFolder } = useConfig()
	const { templatesContent } = useSharedState()
	const { setIsLoading } = useOverlay()
	const [defaultTemplates, setDefaultTemplates] = useState("")
	const [ESMs, setESMs] = useState<ESM[]>([])
	const [bodyFiles, setBodyFiles] = useState<BodyFiles>(defaultBodyFiles)
	const [bodies, setBodies] = useState<Bodies>(defaultBodies)
	const [bodySlidePresetsParsed, setBodySlidePresetsParsed] = useState<
		BodySlidePresetParsed[]
	>([])

	useEffect(() => {
		setIsLoading("Loading data...")
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			setBodySlidePresetsParsed((prev) => (prev.length ? [] : prev))
			setBodyFiles(defaultBodyFiles)
			setDefaultTemplates("")
			setIsLoading(false)
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
			setIsLoading(false)
		}
		void load()
	}, [dataFolder, setIsLoading])

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

	useEffect(() => {
		const loadBodies = async () => {
			setIsLoading("Loading body models...")
			const bodies: Bodies = defaultBodies
			for (const type of Object.values(BodyType)) {
				if (!bodyFiles[type].nif || !bodyFiles[type].tri) continue
				// @ts-expect-error
				bodies[type].nif = await window.electronAPI.loadNIF(bodyFiles[type].nif)
				// @ts-expect-error
				bodies[type].tri = await window.electronAPI.loadTRI(bodyFiles[type].tri)
			}
			setBodies(bodies)
			setIsLoading(false)
		}
		void loadBodies()
	}, [bodyFiles, setIsLoading])

	return (
		<DataContext.Provider
			value={{
				ESMs,
				bodySlidePresetsParsed,
				bodyFiles,
				bodies,
				validateESMs,
				defaultTemplates,
			}}
		>
			{children}
		</DataContext.Provider>
	)
}

export const useData = () => useContext(DataContext)
