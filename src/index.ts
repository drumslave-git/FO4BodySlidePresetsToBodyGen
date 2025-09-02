import log, { errorAndQuit } from "./logger"

log.info("App starting...")

process.on("uncaughtException", async (err) => {
	await errorAndQuit("Uncaught Exception", err.message, err)
})

process.on("unhandledRejection", async (reason) => {
	await errorAndQuit(
		"Unhandled Rejection",
		`An unhandled promise rejection occurred.`,
		reason,
	)
})

;(async () => {
	try {
		await import("./application")
	} catch (e) {
		await errorAndQuit("Error loading main process", (e as Error).message, e)
	}
})()
