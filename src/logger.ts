import path from "node:path"
import { app } from "electron"
import log from "electron-log/main"

const APP_DIR = app.isPackaged
	? path.dirname(process.resourcesPath)
	: process.cwd()
export const LOGS_DIR = path.resolve(APP_DIR, "logs", "main.log")

log.initialize()
log.transports.file.resolvePathFn = () => LOGS_DIR

export async function errorAndQuit(
	title: string,
	message: string,
	...data: any[]
) {
	log.error(title, message, ...data)
	try {
		const { app, dialog, shell } = await import("electron")
		const ready = app?.isReady()
		if (!ready) {
			dialog.showErrorBox(title, `${message}\n\nLogs: ${LOGS_DIR}`)
			process.exit(1)
		}
		const res = await dialog.showMessageBox({
			type: "error",
			title,
			message,
			detail: `Logs location:\n${LOGS_DIR}`,
			buttons: ["Open logs", "Quit"],
			defaultId: 0,
			cancelId: 1,
			noLink: true,
		})
		if (res.response === 0) await shell.openPath(LOGS_DIR)
		app.exit(1)
	} catch {
		// If Electron itself isn’t available yet
		process.exit(1)
	}
}

export default log
