import path from "node:path"

import edge from "electron-edge-js"

// https://github.com/ScottJMarshall/electron-webpack-module-resolution
// require("module").globalPaths.push(process.cwd() + "/node_modules")
// const edge = require("electron-edge-js")

const assemblyPath = path.join(
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
	"NifImporter.dll",
)

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
