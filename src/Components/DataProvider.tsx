import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"
import type {
	BodySlidePresetParsed,
	CategorizedSlider,
	ESM,
	NPCFormIdData,
	RaceFormIdData,
	Slider,
} from "../types"
import { useConfig } from "./ConfigProvider"
import { useOverlay } from "./OverlayProvider"
import { useSharedState } from "./SharedStateProvider"

type DataContextValue = {
	ESMs: ESM[]
	bodySlidePresetsParsed: BodySlidePresetParsed[]
	validateESMs: () => void
	reloadData: () => void
	defaultTemplates: string
	sliders: {
		0: Slider[]
		1: Slider[]
	}
	categorizedSliders: {
		0: Record<string, CategorizedSlider[]>
		1: Record<string, CategorizedSlider[]>
	}
	NPCs: NPCFormIdData[]
	races: RaceFormIdData[]
}

const DataContext = createContext<DataContextValue>({
	ESMs: [],
	bodySlidePresetsParsed: [],
	validateESMs: () => {},
	reloadData: () => {},
	defaultTemplates: "",
	sliders: { 0: [], 1: [] },
	categorizedSliders: { 0: {}, 1: {} },
	NPCs: [],
	races: [],
})

export const DataProvider = ({ children }: { children: ReactNode }) => {
	const { dataFolder } = useConfig()
	const { templatesContent } = useSharedState()
	const { setIsLoading } = useOverlay()
	const [defaultTemplates, setDefaultTemplates] = useState("")
	const [ESMs, setESMs] = useState<ESM[]>([])
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
	const [NPCs, setNPCs] = useState<NPCFormIdData[]>([])
	const [races, setRaces] = useState<RaceFormIdData[]>([])

	const reloadData = useCallback(() => {
		setIsLoading("Loading data...")
		if (!dataFolder) {
			setESMs((prev) => (prev.length ? [] : prev))
			setBodySlidePresetsParsed((prev) => (prev.length ? [] : prev))
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

	useEffect(() => {
		reloadData()
	}, [reloadData])

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI.resolveNPCs().then(setNPCs)
		// @ts-expect-error
		window.electronAPI.resolveRaces().then(setRaces)
	}, [])

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
				validateESMs,
				reloadData,
				defaultTemplates,
				sliders,
				categorizedSliders,
				NPCs,
				races,
			}}
		>
			{children}
		</DataContext.Provider>
	)
}

export const useData = () => useContext(DataContext)
