import type { MakerOptions } from "@electron-forge/maker-base"
import { MakerZIP, type MakerZIPConfig } from "@electron-forge/maker-zip"

type MakerZipCustomConfig = { dir: string; makeDir: string } & MakerZIPConfig

class MakerZipCustom extends MakerZIP {
	config: MakerZipCustomConfig
	// biome-ignore lint/complexity/noUselessConstructor: <explanation>
	constructor(config: MakerZipCustomConfig, platforms?: string[]) {
		super(config, platforms)
	}
	async make(configs: MakerOptions) {
		const customizedConfigs = {
			...configs,
			dir: this.config.dir,
			makeDir: this.config.makeDir,
		}
		return await super.make(customizedConfigs)
	}
}

export default MakerZipCustom
