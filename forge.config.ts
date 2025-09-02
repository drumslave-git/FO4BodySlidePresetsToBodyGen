import path from "node:path"
import { FuseV1Options, FuseVersion } from "@electron/fuses"
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives"
import { FusesPlugin } from "@electron-forge/plugin-fuses"
import { WebpackPlugin } from "@electron-forge/plugin-webpack"
import type { ForgeConfig } from "@electron-forge/shared-types"
import fs from "fs-extra"

import MakerZIPCustom from "./maker-zip.custom"
import { productName as appName } from "./package.json"
import { mainConfig } from "./webpack.main.config"
import { rendererConfig } from "./webpack.renderer.config"

const config: ForgeConfig = {
	outDir: `./out/${appName}/Tools`,
	packagerConfig: {
		name: appName,
		asar: true,
		icon: "./src/images/icon",
		// exclude edge-js modules from asar archive
		// ignore: ["node_modules/electron-edge-js", "node_modules/edge-cs"],
		// move binaries to resources folder
		extraResource: [
			"./src/NIF/dotnet/NifImporter/bin/Release/net8.0/win-x64/publish",
			"./drizzle",
		],
	},
	hooks: {
		// copy "node_modules/electron-edge-js" and "node_modules/edge-cs" to resources folder
		postPackage: async (_forgeConfig, options) => {
			console.log("build_path", options.outputPaths)
			const outAppDir = options.outputPaths[0]
			const outDir = path.resolve(outAppDir, "..")
			console.log("outAppDir", outAppDir)
			// Get node_modules path
			const nodeModulesPath = path.join(outAppDir, "resources", "node_modules")
			const modulesToCopy = ["edge-cs", "electron-edge-js"]
			// loop-for
			for (const moduleName of modulesToCopy) {
				const sourcePath = path.join(__dirname, "node_modules", moduleName)
				const targetPath = path.join(nodeModulesPath, moduleName)
				console.log(
					`Copying ${moduleName} from:`,
					sourcePath,
					"to:",
					targetPath,
				)
				fs.copySync(sourcePath, targetPath)
			}
			console.log("All modules copied successfully!")
		},
	},
	rebuildConfig: {
		onlyModules: ["better-sqlite3"],
	},
	makers: [
		new MakerZIPCustom(
			{
				dir: path.resolve(__dirname, "out", appName),
				makeDir: path.resolve(__dirname, "out"),
			},
			["win32"],
		),
	],
	publishers: [
		{
			name: "@electron-forge/publisher-github",
			config: {
				repository: {
					owner: "drumslave-git",
					name: appName,
				},
				generateReleaseNotes: true,
			},
		},
	],
	plugins: [
		new AutoUnpackNativesPlugin({}),
		new WebpackPlugin({
			mainConfig,
			renderer: {
				config: rendererConfig,
				entryPoints: [
					{
						html: "./src/index.html",
						js: "./src/renderer.ts",
						name: "main_window",
						preload: {
							js: "./src/preload.ts",
						},
					},
				],
			},
		}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
}

export default config
