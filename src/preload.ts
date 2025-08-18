import { contextBridge, ipcRenderer } from "electron/renderer"
import type { Location } from "react-router"

import type { BodySlidePresetParsed, Config, ESM, FormattedData } from "./types"

contextBridge.exposeInMainWorld("electronAPI", {
	openTemplates: () => ipcRenderer.invoke("dialog:openTemplates"),
	openDataFolder: () => ipcRenderer.invoke("dialog:openDataFolder"),
	loadConfig: (): Promise<Config> => ipcRenderer.invoke("loadConfig"),
	loadTemplates: (): Promise<Config> => ipcRenderer.invoke("templates:load"),
	resolveESMs: (from: string): Promise<ESM[]> =>
		ipcRenderer.invoke("ESM:resolve", from),
	validateESMs: (from: string, content: string): Promise<ESM[]> =>
		ipcRenderer.invoke("ESM:validate", from, content),
	resolveBodySlidePresets: (from: string): Promise<BodySlidePresetParsed[]> =>
		ipcRenderer.invoke("resolveBodySlidePresets", from),
	validateTemplates: (content: string): Promise<string> =>
		ipcRenderer.invoke("templates:validate", content),
	format: (content: string): Promise<FormattedData> =>
		ipcRenderer.invoke("format", content),
	write: (from: string, content: string, local = false): Promise<number> =>
		ipcRenderer.invoke("write", from, content, local),
	zipOutput: (): Promise<void> => ipcRenderer.invoke("zipOutput"),
	pathResolve: (...args: any[]): Promise<string> =>
		ipcRenderer.invoke("path:resolve", ...args),
	navigate: (location: Location) => ipcRenderer.send("navigate", location),
})
