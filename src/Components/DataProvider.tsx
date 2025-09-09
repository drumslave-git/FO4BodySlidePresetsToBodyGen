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
	type CategorizedSlider,
	type ESM,
	type Slider,
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
	sliders: {
		0: Slider[]
		1: Slider[]
	}
	categorizedSliders: {
		0: Record<string, CategorizedSlider[]>
		1: Record<string, CategorizedSlider[]>
	}
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
	sliders: { 0: [], 1: [] },
	categorizedSliders: { 0: {}, 1: {} },
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
	const [sliders, setSliders] = useState<DataContextValue["sliders"]>({
		0: [],
		1: [],
	})
	const [categorizedSliders, setCategorizedSliders] = useState<
		DataContextValue["categorizedSliders"]
	>({ 0: {}, 1: {} })

	useEffect(() => {
		setIsLoading("Loading data...")
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			setBodySlidePresetsParsed((prev) => (prev.length ? [] : prev))
			setBodyFiles(defaultBodyFiles)
			setDefaultTemplates("")
			setSliders({
				0: [],
				1: [],
			})
			setCategorizedSliders({ 0: {}, 1: {} })
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
			setSliders(
				// @ts-expect-error
				await window.electronAPI.resolveSliders(),
			)
			setCategorizedSliders(
				// @ts-expect-error
				await window.electronAPI.resolveCategorisedSliders(),
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
			const bodiesData: Bodies = {
				...defaultBodies,
			}
			for (const type of Object.values(BodyType)) {
				if (!bodyFiles[type].nif || !bodyFiles[type].tri) {
					continue
				}
				// @ts-expect-error
				bodiesData[type].nif = await window.electronAPI.loadNIF(
					bodyFiles[type].nif,
				)
				console.info(`Loaded NIF for ${type}`, bodiesData[type].nif)
				// @ts-expect-error
				bodiesData[type].tri = await window.electronAPI.loadTRI(
					bodyFiles[type].tri,
				)
				console.info(`Loaded TRI for ${type}`, bodiesData[type].tri)
			}
			setBodies(bodiesData)
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
				sliders,
				categorizedSliders,
			}}
		>
			{children}
		</DataContext.Provider>
	)
}

export const useData = () => useContext(DataContext)
