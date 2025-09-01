import path from "node:path"
import { FuseV1Options, FuseVersion } from "@electron/fuses"
import { MakerDeb } from "@electron-forge/maker-deb"
import { MakerRpm } from "@electron-forge/maker-rpm"
import { MakerSquirrel } from "@electron-forge/maker-squirrel"
import { MakerZIP } from "@electron-forge/maker-zip"
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives"
import { FusesPlugin } from "@electron-forge/plugin-fuses"
import { WebpackPlugin } from "@electron-forge/plugin-webpack"
import type { ForgeConfig } from "@electron-forge/shared-types"
import fs from "fs-extra"

import { mainConfig } from "./webpack.main.config"
import { rendererConfig } from "./webpack.renderer.config"

const config: ForgeConfig = {
	packagerConfig: {
		asar: true,
		icon: "./src/images/icon",
		// exclude edge-js modules from asar archive
		ignore: ["node_modules/electron-edge-js", "node_modules/edge-cs"],
		// move binaries to resources folder
		extraResource: ["./src/NIF/dotnet/NifImporter/bin/Release/net8.0/publish"],
	},
	hooks: {
		// copy "node_modules/electron-edge-js" and "node_modules/edge-cs" to resources folder
		postPackage: async (_forgeConfig, options) => {
			console.log("build_path", options.outputPaths)
			const outdir = options.outputPaths[0]
			console.log("outdir", outdir)
			// Get node_modules path
			const nodeModulesPath = path.join(outdir, "resources", "node_modules")
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
		// exclude any Node.js pre-build modules such as electron-edge-js from rebuild
		onlyModules: [],
	},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ["darwin"]),
		new MakerRpm({}),
		new MakerDeb({}),
	],
	publishers: [
		{
			name: "@electron-forge/publisher-github",
			config: {
				repository: {
					owner: "drumslave-git",
					name: "FO4BodySlidePresetsToBodyGen",
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
