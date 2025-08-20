import fs from "node:fs"
import path from "node:path"
import { XMLParser } from "fast-xml-parser"
import { zip } from "zip-a-folder"

import { BODYGEN_RELATIVE_PATH, SLIDERS_RELATIVE_PATH } from "./consts"
import type {
	BodySlidePreset,
	BodySlidePresetParsed,
	ESM,
	FormattedData,
	ParsedTemplates,
	Slider,
} from "./types"

const toCRLF = (text: string) => text.replace(/\r?\n/g, "\r\n")

const writeFileSync = (content: string, filePath: string) =>
	fs.writeFileSync(toCRLF(content), filePath)

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
						color: "grey",
						text: "unknown",
					},
					morphs: {
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
			const filePath = path.resolve(esm.path, `${key}.ini`)
			if (fs.existsSync(filePath)) {
				statuses[key as keyof typeof formattedData] =
					fs.readFileSync(filePath).toString() === value
						? "up-to-date"
						: "will be updated"
			} else {
				statuses[key as keyof typeof formattedData] = "will be created"
			}
		}
		return {
			...esm,
			filesStatus: {
				templates: {
					color: statuses.templates === "up-to-date" ? "green" : "yellow",
					text: statuses.templates,
				},
				morphs: {
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
		.reduce((acc, [morphs, templates]) => {
			acc.push(`#morphs=${morphs}`)
			acc.push(
				templates
					.reduce((templateAcc, { name, value }) => {
						templateAcc.push(`${name}=${value}`)
						return templateAcc
					}, [])
					.join("\n\n"),
			)
			return acc
		}, [])
		.join("\n\n\n")

	const morphsContent = Object.entries(structuredData)
		.reduce((acc, [morphs, templates]) => {
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
	let results: Slider[] = []

	const slidersDir = path.resolve(dataFolder, ...SLIDERS_RELATIVE_PATH)
	const folders = fs
		.readdirSync(path.resolve(dataFolder, ...SLIDERS_RELATIVE_PATH))
		.filter((item) => fs.statSync(path.resolve(slidersDir, item)).isDirectory())

	for (const folder of folders) {
		const slidersFilePath = path.resolve(slidersDir, folder, "sliders.json")
		if (!fs.existsSync(slidersFilePath)) continue
		results = [
			...results,
			...JSON.parse(fs.readFileSync(slidersFilePath).toString()),
		]
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
	for (const slider of sliders) {
		const cleanedSlider = {
			...slider,
		}
		const supportedSlider = supportedSliders.find(
			(supportedSlider) => supportedSlider.morph === slider.name,
		)
		if (!supportedSlider) {
			errors.push(`Slider "${slider.name}" is not supported. Removed.`)
			continue
		}
		if (slider.value < supportedSlider.minimum) {
			errors.push(
				`Slider "${slider.name}" value ${slider.value} is less than minimum allowed. Corrected to ${supportedSlider.minimum}.`,
			)
			cleanedSlider.value = supportedSlider.minimum
		}
		if (slider.value > supportedSlider.maximum) {
			errors.push(
				`Slider "${slider.name}" value ${slider.value} is greater than maximum allowed. Corrected to ${supportedSlider.maximum}.`,
			)
			cleanedSlider.value = supportedSlider.maximum
		}
		cleanedSliders.push(cleanedSlider)
	}
	return { errors, cleanedSliders }
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

	return fs
		.readdirSync(dir)
		.filter((item) => item.endsWith(".xml"))
		.map((item) => {
			const filePath = path.resolve(dir, item)
			const content = fs.readFileSync(filePath)
			try {
				const parsed = Object.values(
					parser.parse(content).SliderPresets,
				).filter((preset: any) => !!preset.SetSlider)
				const data: BodySlidePreset[] = parsed.map((preset: any) => {
					const item: BodySlidePreset = {
						name: preset.name,
						set: preset.set,
						groups: Array.isArray(preset.Group)
							? preset.Group.map((group: any) => ({
									name: group.name,
								}))
							: [{ name: preset.Group.name }],
						sliders: preset.SetSlider.map((slider: any) => ({
							...slider,
							value: Number(slider.value) / 100,
						})),
						bodyGen: "",
						errors: [],
						valid: true,
					}

					const { errors, cleanedSliders } = validateSliders(
						dataFolder,
						item.sliders,
					)
					item.errors = errors
					item.valid = item.errors.length === 0
					item.bodyGen = cleanedSliders
						.reduce((acc, slider) => {
							acc.push(`${slider.name}@${slider.value}`)
							return acc
						}, [])
						.join(",")
					return item
				})
				return {
					filename: item,
					data,
				}
			} catch (error) {
				return {
					filename: item,
					data: error.message,
				}
			}
		})
}

export const zipFolder = async (source: string, destination: string) => {
	await zip(source, destination)
}
