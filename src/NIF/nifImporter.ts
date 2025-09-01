import path from "node:path"
import edge from "electron-edge-js"

import log from "../logger"

let baseNetAppPath = path.join(
	__dirname,
	"..",
	"..",
	"src",
	"NIF",
	"dotnet",
	"NifImporter",
	"bin",
	"Release",
	"net8.0",
	"win-x64",
	"publish",
)

if (__dirname.indexOf("app.asar") !== -1) {
	baseNetAppPath = path.join(process.resourcesPath, "publish")
}

process.env.EDGE_USE_CORECLR = "1" // required for .NET Core/.NET 5+
// Optional but helps probing in packaged apps:
process.env.DOTNET_ROOT = baseNetAppPath // hostfxr discovery
process.env.DOTNET_BUNDLE_EXTRACT_BASE_DIR = baseNetAppPath // safety
process.env.EDGE_APP_ROOT = baseNetAppPath // edge probing hint
process.env.ASPNETCORE_ENVIRONMENT = "Production"

const assemblyPath = path.resolve(baseNetAppPath, "NifImporter.dll")

log.info("NifImporter assembly path:", assemblyPath)

// describe the class and method to call
const loadNif = edge.func({
	assemblyFile: assemblyPath,
	typeName: "NifReader",
	methodName: "Invoke",
})

function readNif(filePath: string) {
	return new Promise((resolve, reject) => {
		log.info("Reading NIF file:", filePath)
		loadNif({ filePath }, (error, result) => {
			if (error) {
				log.error("Error reading NIF file:", error)
				reject(error)
			} else resolve(result)
		})
	})
}

export default readNif
