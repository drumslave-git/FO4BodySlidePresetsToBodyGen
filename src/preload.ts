import { contextBridge, ipcRenderer } from "electron/renderer"
import type { Location } from "react-router"

import type {
	BodyNIFFiles,
	BodySlidePresetParsed,
	BodySlideTri,
	Config,
	ESM,
	FormattedData,
	ParsedTemplates,
} from "./types"

contextBridge.exposeInMainWorld("electronAPI", {
	readDefaultTemplates: (): Promise<string> =>
		ipcRenderer.invoke("templates:readDefault"),
	openDataFolder: (folder: string) =>
		ipcRenderer.invoke("dialog:openDataFolder", folder),
	loadConfig: (): Promise<Config> => ipcRenderer.invoke("loadConfig"),
	resolveConfigPath: (): Promise<string> =>
		ipcRenderer.invoke("resolveConfigPath"),
	resolveESMs: (from: string): Promise<ESM[]> =>
		ipcRenderer.invoke("ESM:resolve", from),
	validateESMs: (from: string, content: string): Promise<ESM[]> =>
		ipcRenderer.invoke("ESM:validate", from, content),
	resolveBodySlidePresets: (from: string): Promise<BodySlidePresetParsed[]> =>
		ipcRenderer.invoke("resolveBodySlidePresets", from),
	resolveNIFs: (from: string): Promise<BodyNIFFiles> =>
		ipcRenderer.invoke("resolveNIFs", from),
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
	loadTRI: (triPath: string): Promise<BodySlideTri> =>
		ipcRenderer.invoke("tri:load", triPath),
	// biome-ignore lint/suspicious/noExplicitAny: path resolve
	pathResolve: (...args: any[]): Promise<string> =>
		ipcRenderer.invoke("path:resolve", ...args),
	navigate: (location: Location) => ipcRenderer.send("navigate", location),
	openExternalUrl: (url: string) => ipcRenderer.send("openExternal", url),
})
