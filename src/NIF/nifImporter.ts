import path from "node:path"

import edge from "electron-edge-js"

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
	"net9.0",
	"publish",
)

if (__dirname.indexOf("app.asar") !== -1) {
	baseNetAppPath = path.join(process.resourcesPath, "net9.0", "publish")
}

const assemblyPath = path.resolve(baseNetAppPath, "NifImporter.dll")

console.log("NifImporter assembly path:", assemblyPath)

// describe the class and method to call
const loadNif = edge.func({
	assemblyFile: assemblyPath,
	typeName: "NifReader",
	methodName: "Invoke",
})

function readNif(filePath: string) {
	console.log("readNif called with filePath:", filePath)
	return new Promise((resolve, reject) => {
		console.log("Reading NIF file:", filePath)
		loadNif({ filePath }, (error, result) => {
			if (error) reject(error)
			else resolve(result)
		})
	})
}

export default readNif
