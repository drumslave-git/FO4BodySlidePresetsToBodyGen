import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react"
import { useConfig } from "./ConfigProvider"

import type { Morph } from "./Converter/Components/Morphs"

type SharedStateContextValue = {
	morphs: Morph[]
	validationError: string
	templatesRaw: string
	templatesContent: string
	morphsContent: string
	setMorphs: Dispatch<SetStateAction<Morph[]>>
	setTemplatesRaw: Dispatch<SetStateAction<string>>
}

const SharedStateContext = createContext<SharedStateContextValue>({
	morphs: [],
	validationError: "",
	templatesRaw: "",
	templatesContent: "",
	morphsContent: "",
	setMorphs: () => {},
	setTemplatesRaw: () => {},
})

export const SharedStateProvider = ({ children }: { children: ReactNode }) => {
	const { dataFolder } = useConfig()
	const [morphs, setMorphs] = useState<Morph[]>([])
	const [validationError, setValidationError] = useState<string>("")
	const [templatesRaw, setTemplatesRaw] = useState<string>("")
	const [templatesContent, setTemplatesContent] = useState<string>("")
	const [morphsContent, setMorphsContent] = useState<string>("")

	useEffect(() => {
		if (!morphs.length) {
			setTemplatesContent("")
			setMorphsContent("")
			setValidationError("")
			return
		}
		const templates = morphs
			.reduce((acc, morph) => {
				acc.push(`#morphs=${morph.rules.join(";")}`)
				acc.push(
					morph.presets
						.map((preset) => `${preset.name}=${preset.bodyGen}`)
						.join("\n"),
				)
				return acc
			}, [])
			.join("\n")
		const process = async (content: string) => {
			const validation =
				// @ts-expect-error
				await window.electronAPI.validateTemplates(content)
			setValidationError(validation)
			if (validation) {
				setMorphsContent("")
				setTemplatesContent("")
				return
			}
			// @ts-expect-error
			const formatted = await window.electronAPI.format(content)
			setTemplatesContent(formatted.templates)
			setMorphsContent(formatted.morphs)
		}
		void process(templates)
	}, [morphs])

	useEffect(() => {
		if (!dataFolder) {
			setMorphs((prev) => (prev.length ? [] : prev))
			return
		}
	}, [dataFolder])

	const updateMorphs: Dispatch<SetStateAction<Morph[]>> = useCallback(
		(value) => {
			setMorphs(value)
		},
		[],
	)

	const updateTemplatesRaw: Dispatch<SetStateAction<string>> = useCallback(
		(value) => {
			setTemplatesRaw(value)
		},
		[],
	)

	return (
		<SharedStateContext.Provider
			value={{
				morphs,
				validationError,
				templatesRaw,
				templatesContent,
				morphsContent,
				setMorphs: updateMorphs,
				setTemplatesRaw: updateTemplatesRaw,
			}}
		>
			{children}
		</SharedStateContext.Provider>
	)
}

export const useSharedState = () => useContext(SharedStateContext)
