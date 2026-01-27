import { contextBridge, ipcRenderer } from "electron/renderer"
import type { multiRulesDB, rulesDB, singleRulesDB } from "./db"

import type {
	BodySlidePresetParsed,
	Config,
	ESM,
	FormattedData,
	NPCFormIdData,
	ParsedTemplates,
	RaceFormIdData,
	Slider,
	TriBodySlide,
} from "./types"

contextBridge.exposeInMainWorld("electronAPI", {
	readDefaultTemplates: (): Promise<string> =>
		ipcRenderer.invoke("templates:readDefault"),
	openDataFolder: (folder: string) =>
		ipcRenderer.invoke("dialog:openDataFolder", folder),
	readConfig: (): Promise<Config> => ipcRenderer.invoke("readConfig"),
	resolveESMs: (from: string): Promise<ESM[]> =>
		ipcRenderer.invoke("ESM:resolve", from),
	validateESMs: (from: string, content: string): Promise<ESM[]> =>
		ipcRenderer.invoke("ESM:validate", from, content),
	resolveBodySlidePresets: (from: string): Promise<BodySlidePresetParsed[]> =>
		ipcRenderer.invoke("resolveBodySlidePresets", from),
	validateTemplates: (content: string): Promise<string> =>
		ipcRenderer.invoke("templates:validate", content),
	parseTemplates: (content: string): Promise<ParsedTemplates> =>
		ipcRenderer.invoke("templates:parse", content),
	format: (content: string): Promise<FormattedData> =>
		ipcRenderer.invoke("format", content),
	write: (
		from: string,
		content: string,
	): Promise<{ count: number; outDir: string }> =>
		ipcRenderer.invoke("write", from, content),
	zipOutput: (): Promise<string> => ipcRenderer.invoke("zipOutput"),
	navigate: (page: string) => ipcRenderer.send("navigate", page),
	openExternalUrl: (url: string) => ipcRenderer.send("openExternal", url),
	singleRulesDB: (action: keyof typeof singleRulesDB, ...args: any[]) =>
		ipcRenderer.invoke("singleRulesDB", action, ...args),
	multiRulesDB: (action: keyof typeof multiRulesDB, ...args: any[]) =>
		ipcRenderer.invoke("multiRulesDB", action, ...args),
	rulesDB: (action: keyof typeof rulesDB, ...args: any[]) =>
		ipcRenderer.invoke("rulesDB", action, ...args),
	resolveSliders: (): Promise<{
		0: Slider[]
		1: Slider[]
	}> => ipcRenderer.invoke("resolveSliders"),
	resolveCategorisedSliders: (): Promise<any> =>
		ipcRenderer.invoke("resolveCategorisedSliders"),
	resolveNPCs: (): Promise<NPCFormIdData[]> =>
		ipcRenderer.invoke("resolveNPCs"),
	resolveRaces: (): Promise<RaceFormIdData[]> =>
		ipcRenderer.invoke("resolveRaces"),
})
