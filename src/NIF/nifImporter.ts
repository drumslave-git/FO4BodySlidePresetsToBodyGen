import path from "node:path"
import log from "../logger"

// 1) Compute publish dir first
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
if (__dirname.includes("app.asar"))
	baseNetAppPath = path.join(process.resourcesPath, "publish")

// 2) Set env **before** requiring electron-edge-js
process.env.EDGE_USE_CORECLR = "1"
process.env.EDGE_APP_ROOT = baseNetAppPath // where NifImporter.dll + hostfxr live

// These often cause probing weirdness for self-contained apps. Don’t set them.
delete process.env.DOTNET_ROOT
delete process.env.DOTNET_BUNDLE_EXTRACT_BASE_DIR

// 3) Now require edge (not import)
const edge = require("electron-edge-js")

const assemblyPath = path.resolve(baseNetAppPath, "NifImporter.dll")
log.info("NifImporter assembly path:", assemblyPath)

const loadNif = edge.func({
	assemblyFile: assemblyPath,
	typeName: "NifReader",
	methodName: "Invoke",
})

export default function readNif(filePath: string) {
	return new Promise((resolve, reject) => {
		log.info("Reading NIF file:", filePath)
		loadNif({ filePath }, (error: any, result: any) => {
			if (error) {
				log.error("Error reading NIF file:", error)
				reject(error)
			} else resolve(result)
		})
	})
}
