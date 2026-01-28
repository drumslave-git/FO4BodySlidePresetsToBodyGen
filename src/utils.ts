import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { XMLParser } from "fast-xml-parser"
import { zip } from "zip-a-folder"

import {
	BODYGEN_RELATIVE_PATH,
	MESHES_CHARACTER_ASSETS_RELATIVE_PATH,
	SLIDERS_CATEGORIES_RELATIVE_PATH,
	SLIDERS_RELATIVE_PATH,
} from "./consts"
import log from "./logger"
import {
	type BodyFiles,
	type BodySlidePreset,
	type BodySlidePresetParsed,
	BodyType,
	type CategorizedSlider,
	type ESM,
	type FormattedData,
	type NPCFormIdData,
	type ParsedTemplates,
	type RaceFormIdData,
	type Slider,
	type SliderCategory,
} from "./types"

const toCRLF = (text: string) => text.replace(/\r?\n/g, "\r\n")

const writeFileSync = (filePath: string, content: string) =>
	fs.writeFileSync(filePath, toCRLF(content))

const sanitizeFilename = (name: string) =>
	name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim()

const resolveBsrenderExe = () => {
	const candidates = [
		path.resolve(process.cwd(), "bsrender", "build", "Release", "bsrender.exe"),
		path.resolve(process.cwd(), "bsrender", "build", "Debug", "bsrender.exe"),
	]
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return candidate
	}
	return null
}

const ensurePresetArtifacts = (
	preset: BodySlidePreset,
	dataFolder: string,
	presetFilePath: string,
) => {
	const outDir = path.resolve(process.cwd(), "data", "presets")
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true })
	}

	const baseName = sanitizeFilename(preset.name)
	const pngPath = path.resolve(outDir, `${baseName}.png`)
	const glbPath = path.resolve(outDir, `${baseName}.glb`)

	if (fs.existsSync(pngPath) && fs.existsSync(glbPath)) {
		return {
			pngPath,
			glbPath,
			pngUrl: `presets://local/${encodeURIComponent(`${baseName}.png`)}`,
			glbUrl: pathToFileURL(glbPath).toString(),
		}
	}

	const exePath = resolveBsrenderExe()
	if (!exePath) {
		log.warn("bsrender.exe not found; skipping preset asset generation.")
		return { pngPath, glbPath }
	}

	const bodySlideRoot = path.resolve(dataFolder, "Tools", "BodySlide")
	const args = [
		"--preset-name",
		preset.name,
		"--preset-file",
		presetFilePath,
		"--data-root",
		bodySlideRoot,
		"--out",
		pngPath,
		"--export-glb",
		glbPath,
		"--size",
		"1024",
		"--yaw",
		"-145",
		"--pitch",
		"0",
		"--roll",
		"0",
	]

	log.info(`Generating assets for preset "${preset.name}"...`)
	const result = spawnSync(exePath, args, {
		windowsHide: true,
		encoding: "utf8",
	})

	if (result.status !== 0) {
		log.error(
			`bsrender failed for "${preset.name}": ${result.status}\n${result.stderr || result.stdout}`,
		)
	} else {
		log.info(`Generated assets: ${pngPath}, ${glbPath}`)
	}

	return {
		pngPath,
		glbPath,
		pngUrl: fs.existsSync(pngPath)
			? `presets://local/${encodeURIComponent(`${baseName}.png`)}`
			: "",
		glbUrl: fs.existsSync(glbPath) ? pathToFileURL(glbPath).toString() : "",
	}
}

export const validateTemplates = (content: string) => {
	const lines = content.split(/\n\r?/)
	const morphsSettingIndex = lines.findIndex((line) =>
		line.startsWith("#morphs="),
	)
	if (morphsSettingIndex === -1) {
		throw new Error("No morphs setting found in templates.ini")
	}
	const morphsSetting = lines[morphsSettingIndex].replace("#morphs=", "").trim()
	if (!morphsSetting) {
		throw new Error(
			`Morphs setting is empty in templates.ini:${morphsSettingIndex + 1}`,
		)
	}
}

export const resolveESMs = (dataFolder: string): ESM[] => {
	const overridesPath = path.resolve(dataFolder, ...BODYGEN_RELATIVE_PATH)
	return fs
		.readdirSync(dataFolder)
		.filter((item) => item.endsWith(".esm"))
		.map((item) => {
			const itemPath = path.resolve(dataFolder, item)
			return {
				name: item,
				path: itemPath,
				filesStatus: {
					templates: {
						path: path.resolve(overridesPath, item, "templates.ini"),
						color: "grey",
						text: "unknown",
					},
					morphs: {
						path: path.resolve(overridesPath, item, "morphs.ini"),
						color: "grey",
						text: "unknown",
					},
				},
			}
		})
}

export const validateESMs = (dataFolder: string, content: string) => {
	let ESMs = resolveESMs(dataFolder)
	const formattedData = formatINIs(content)
	ESMs = ESMs.map((esm) => {
		const statuses = {
			templates: "",
			morphs: "",
		}
		for (const [key, value] of Object.entries(formattedData)) {
			const filePath = esm.filesStatus[key as keyof typeof formattedData].path
			if (fs.existsSync(filePath)) {
				const content = fs.readFileSync(filePath).toString()
				statuses[key as keyof typeof formattedData] =
					content === toCRLF(value) ? "up-to-date" : "will be updated"
			} else {
				statuses[key as keyof typeof formattedData] = "will be created"
			}
		}
		return {
			...esm,
			filesStatus: {
				...esm.filesStatus,
				templates: {
					...esm.filesStatus.templates,
					color: statuses.templates === "up-to-date" ? "green" : "yellow",
					text: statuses.templates,
				},
				morphs: {
					...esm.filesStatus.morphs,
					color: statuses.morphs === "up-to-date" ? "green" : "yellow",
					text: statuses.morphs,
				},
			},
		}
	})

	return ESMs
}

export const parseTemplates = (content: string) => {
	const lines = content
		.split(/\n\r?/)
		.map((item) => item.trim())
		.filter((line) => !!line)
	let morphsSettings = ""
	return lines.reduce((acc: ParsedTemplates, line) => {
		if (line.startsWith("#")) {
			if (line.startsWith("#morphs=")) {
				morphsSettings = line.replace("#morphs=", "").trim()
			}
			return acc // Skip comment lines
		}
		const [name, value] = line.split("=").map((part) => part.trim())
		if (name && value) {
			acc[morphsSettings] = acc[morphsSettings] || []
			acc[morphsSettings].push({
				name,
				value,
			})
		}
		return acc
	}, {})
}

export const formatINIs = (content: string): FormattedData => {
	const structuredData = parseTemplates(content)

	const templatesContent = Object.entries(structuredData)
		.reduce((acc: string[], [morphs, templates]) => {
			acc.push(`#morphs=${morphs}`)
			acc.push(
				templates
					.reduce((templateAcc: string[], { name, value }) => {
						templateAcc.push(`${name}=${value}`)
						return templateAcc
					}, [])
					.join("\n\n"),
			)
			return acc
		}, [])
		.join("\n\n\n")

	const morphsContent = Object.entries(structuredData)
		.reduce((acc: string[], [morphs, templates]) => {
			for (const morph of morphs.split(";")) {
				const names = templates.map((template) => template.name).join("|")
				acc.push(`${morph}=${names}`)
			}
			return acc
		}, [])
		.join("\n\n")

	return {
		templates: templatesContent,
		morphs: morphsContent,
	}
}

export const write = (from: string, outDir: string, content: string) => {
	const ESMs = resolveESMs(from)
	const formattedData = formatINIs(content)
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true })
	}
	let count = 0
	for (const esm of ESMs) {
		const esmPath = path.resolve(outDir, esm.name)
		if (!fs.existsSync(esmPath)) {
			fs.mkdirSync(esmPath, { recursive: true })
		}
		const templatesFilePath = path.resolve(esmPath, "templates.ini")
		const morphsFilePath = path.resolve(esmPath, "morphs.ini")

		writeFileSync(templatesFilePath, formattedData.templates)
		writeFileSync(morphsFilePath, formattedData.morphs)
		count++
	}

	return { count, outDir }
}

export const resolveSliders = (dataFolder: string) => {
	let results: { 0: Slider[]; 1: Slider[] } = { 0: [], 1: [] }

	const slidersDir = path.resolve(dataFolder, ...SLIDERS_RELATIVE_PATH)
	if (!fs.existsSync(slidersDir)) return results
	const folders = fs
		.readdirSync(slidersDir)
		.filter((item) => fs.statSync(path.resolve(slidersDir, item)).isDirectory())

	for (const folder of folders) {
		const slidersFilePath = path.resolve(slidersDir, folder, "sliders.json")
		if (!fs.existsSync(slidersFilePath)) continue
		log.info(`Loading sliders from ${slidersFilePath}`)
		const sliders: Slider[] = JSON.parse(
			fs.readFileSync(slidersFilePath).toString(),
		).map((slider: Slider) => ({
			...slider,
			sourcePath: slidersFilePath,
		}))
		for (const slider of sliders) {
			results = {
				...results,
				[slider.gender]: [...results[slider.gender], slider],
			}
		}
	}

	return results
}

export const validateSliders = (
	dataFolder: string,
	sliders: BodySlidePreset["sliders"],
) => {
	const supportedSliders = resolveSliders(dataFolder)
	const cleanedSliders = []
	const errors = []
	const warnings = []
	let gender: -1 | 0 | 1 = -1
	const genderHits = {
		0: 0,
		1: 0,
	}
	const originalCount = sliders.length
	for (const slider of sliders) {
		const cleanedSlider = {
			...slider,
		}
		const supportedSlider =
			supportedSliders[0].find(
				(supportedSlider) => supportedSlider.morph === slider.name,
			) ||
			supportedSliders[1].find(
				(supportedSlider) => supportedSlider.morph === slider.name,
			)
		if (!supportedSlider) {
			errors.push(`Slider "${slider.name}" is not supported. Removed.`)
			continue
		}
		if (slider.value < supportedSlider.minimum) {
			warnings.push(
				`Slider "${slider.name}" value ${slider.value} is less than minimum allowed. Corrected to ${supportedSlider.minimum}.`,
			)
			cleanedSlider.value = supportedSlider.minimum
		}
		if (slider.value > supportedSlider.maximum) {
			warnings.push(
				`Slider "${slider.name}" value ${slider.value} is greater than maximum allowed. Corrected to ${supportedSlider.maximum}.`,
			)
			cleanedSlider.value = supportedSlider.maximum
		}
		genderHits[supportedSlider.gender]++
		cleanedSliders.push(cleanedSlider)
	}
	if (genderHits[0] > genderHits[1]) {
		gender = 0
	} else if (genderHits[1] > genderHits[0]) {
		gender = 1
	}
	return {
		errors,
		warnings,
		cleanedSliders,
		gender,
		originalCount,
	}
}

export const resolveSliderCategories = (dataFolder: string) => {
	const dir = path.resolve(dataFolder, ...SLIDERS_CATEGORIES_RELATIVE_PATH)
	if (!fs.existsSync(dir)) return []
	const parser = new XMLParser({
		ignoreAttributes: false, // include attributes in result
		attributeNamePrefix: "", // optional: no '@_' prefix
		allowBooleanAttributes: true, // optional: support boolean attrs
		trimValues: true, // optional: trim text nodes
	})
	return fs
		.readdirSync(dir)
		.filter((item) => item.endsWith(".xml"))
		.reduce((acc: SliderCategory[], item) => {
			const filePath = path.resolve(dir, item)
			const content = fs.readFileSync(filePath)
			try {
				const parsed = parser.parse(content)
				if (!parsed?.SliderCategories?.Category) {
					log.warn(`No categories found in slider category file ${item}`)
					return acc
				}
				for (const Category of parsed.SliderCategories.Category) {
					acc.push({
						filePath,
						name: Category.name,
						sliders: Category.Slider.map((slider: any) => ({
							name: slider.name,
							displayName: slider.displayname,
						})),
					})
				}
			} catch (error) {
				log.error(`Failed to parse slider category file ${item}:`, error)
			}
			return acc
		}, [])
}

export const resolveCategorisedSliders = (dataFolder: string) => {
	const categories = resolveSliderCategories(dataFolder)
	const sliders = resolveSliders(dataFolder)

	type Acc2 = Record<string, CategorizedSlider[]>
	type Acc = Record<0 | 1, Acc2>

	return Object.entries(sliders).reduce((acc: Acc, [gender, sldrs]) => {
		acc[Number(gender) as 0 | 1] = sldrs.reduce((acc2: Acc2, slider) => {
			const category = categories.find((category) =>
				category.sliders.find((s) => s.name === slider.morph),
			)
			const categoryName = category ? category.name : "Uncategorized"
			const categorySlider = category?.sliders.find(
				(s) => s.name === slider.morph,
			)
			const displayName = categorySlider
				? categorySlider.displayName
				: slider.morph
			acc2[categoryName] = acc2[categoryName] || []
			acc2[categoryName].push({
				...slider,
				displayName,
			})
			return acc2
		}, {} as Acc2)
		return acc
	}, {} as Acc)
}

export const resolveBodySlidePresets = (
	dataFolder: string,
): BodySlidePresetParsed[] => {
	const parser = new XMLParser({
		ignoreAttributes: false, // include attributes in result
		attributeNamePrefix: "", // optional: no '@_' prefix
		allowBooleanAttributes: true, // optional: support boolean attrs
		trimValues: true, // optional: trim text nodes
	})
	const dir = path.resolve(dataFolder, "Tools", "BodySlide", "SliderPresets")
	if (!fs.existsSync(dir)) return []

	return fs
		.readdirSync(dir)
		.filter((item) => item.endsWith(".xml"))
		.map((item) => {
			const filePath = path.resolve(dir, item)
			const content = fs.readFileSync(filePath)
			try {
				const parsed = Object.values(
					parser.parse(content).SliderPresets,
					// biome-ignore lint/suspicious/noExplicitAny: parsed xml
				).filter((preset: any) => !!preset.SetSlider)
				// biome-ignore lint/suspicious/noExplicitAny: parsed xml
				const data: BodySlidePreset[] = parsed.map((preset: any) => {
					const item: BodySlidePreset = {
						name: preset.name,
						set: preset.set,
						filePath,
						groups: Array.isArray(preset.Group)
							? // biome-ignore lint/suspicious/noExplicitAny: parsed xml
								preset.Group.map((group: any) => ({
									name: group.name,
								}))
							: [{ name: preset.Group.name }],
						// biome-ignore lint/suspicious/noExplicitAny: parsed xml
						sliders: preset.SetSlider.map((slider: any) => ({
							...slider,
							value: Number(slider.value) / 100,
						})),
						bodyGen: "",
						errors: [],
						warnings: [],
						valid: true,
						gender: -1,
					}

					const { errors, warnings, cleanedSliders, gender, originalCount } =
						validateSliders(dataFolder, item.sliders)
					item.gender = gender
					item.errors = errors
					item.warnings = warnings
					item.valid = item.errors.length === 0
					item.bodyGen = cleanedSliders
						.reduce((acc: string[], slider) => {
							acc.push(`${slider.name}@${slider.value}`)
							return acc
						}, [])
						.join(",")

					const artifacts = ensurePresetArtifacts(item, dataFolder, filePath)
					if (artifacts?.pngUrl) item.previewImageUrl = artifacts.pngUrl
					if (artifacts?.glbUrl) item.previewGlbUrl = artifacts.glbUrl
					return item
				})
				return {
					filename: item,
					data,
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				return {
					filename: item,
					data: message,
				}
			}
		})
}

export const zipFolder = async (source: string, destination: string) => {
	await zip(source, destination)
}

const resolveFormIDs = <T extends Record<string, string>>(
	from: string,
	columns: string[],
	filterFN: (item: T) => boolean,
): T[] => {
	if (!fs.existsSync(from)) return []
	return fs
		.readdirSync(from)
		.filter((item) => item.endsWith(".csv"))
		.reduce((acc: T[], file) => {
			const content = fs.readFileSync(path.resolve(from, file)).toString()
			const lines = content.split(/\r?\n/)
			const items = lines
				.reduce((acc2: T[], line) => {
					const values = line.split(";").map((part) => part.trim())
					const item = columns.reduce(
						(obj: Record<string, string>, col, index) => {
							obj[col] = values[index]
							return obj
						},
						{},
					)
					acc2.push(item as T)
					return acc2
				}, [])
				.filter(filterFN)
			acc.push(...items)
			return acc
		}, [])
}

export const resolveNPCsFormIDs = (from: string) => {
	return resolveFormIDs(
		from,
		["plugin", "formId", "signature", "editorID", "name"],
		(item: NPCFormIdData) => item.signature === "NPC_" && !!item.name,
	)
}

export const resolveRacesFormIDs = (from: string) => {
	return resolveFormIDs(
		from,
		["plugin", "formId", "editorID", "name"],
		(item: RaceFormIdData) => !!item.name && !!item.editorID,
	)
}
