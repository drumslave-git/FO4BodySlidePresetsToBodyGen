import { contextBridge, ipcRenderer } from "electron/renderer"
import type { Location } from "react-router"

import type {
	BodyFiles,
	BodySlidePresetParsed,
	Config,
	ESM,
	FormattedData,
	ParsedTemplates,
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
	resolveBodyFiles: (from: string): Promise<BodyFiles> =>
		ipcRenderer.invoke("resolveBodyFiles", from),
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
	loadNIF: (nifPath: string): Promise<string> =>
		ipcRenderer.invoke("nif:load", nifPath),
	loadTRI: (triPath: string): Promise<TriBodySlide> =>
		ipcRenderer.invoke("tri:load", triPath),
	navigate: (page: string) => ipcRenderer.send("navigate", page),
	openExternalUrl: (url: string) => ipcRenderer.send("openExternal", url),
})
