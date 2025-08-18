import fs from "node:fs"
import path from "node:path"
import { XMLParser } from "fast-xml-parser"
import { zip } from "zip-a-folder"

import { BODYGEN_RELATIVE_PATH } from "./consts"
import type {
	BodySlidePreset,
	BodySlidePresetParsed,
	ESM,
	FormattedData,
} from "./types"

export const validateTemplates = (content: string) => {
	const lines = content.split("\n")
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

export const resolveESMs = (from: string): ESM[] => {
	let dir = from
	let rootDir = from
	const fromINI = from.endsWith(".ini")
	if (fromINI) {
		dir = path.dirname(from)
		rootDir = path.resolve(dir, "..")
	}

	const ESMs: ESM[] = fs
		.readdirSync(rootDir)
		.filter((item) => item.endsWith(".esm"))
		.map((item) => {
			const itemPath = path.resolve(rootDir, item)
			return {
				name: item,
				path: itemPath,
				source: itemPath === dir,
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

	if (fromINI) {
		return ESMs
	}
	return ESMs.map((esm) => ({
		...esm,
		path: path.resolve(from, ...BODYGEN_RELATIVE_PATH, esm.name),
	}))
}

export const validateESMs = (from: string, content: string) => {
	let ESMs = resolveESMs(from)
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

type StructuredData = Record<string, Record<string, string>[]>

const structureData = (content: string) => {
	const lines = content
		.toString()
		.split("\n")
		.map((item) => item.trim())
		.filter((line) => !!line)
	let preservedName = ""
	let morphsSettings = ""
	return lines.reduce((acc: StructuredData, line) => {
		if (line.startsWith("#")) {
			if (line.startsWith("#morphs=")) {
				morphsSettings = line.replace("#morphs=", "").trim()
			} else {
				preservedName = line.replace("#", "").trim() // Preserve name from comment
			}
			return acc // Skip comment lines
		}
		const [key, value] = line.split("=").map((part) => part.trim())
		if (key && value) {
			const name = preservedName || key
			acc[morphsSettings] = acc[morphsSettings] || []
			acc[morphsSettings].push({
				name,
				value,
			})
			preservedName = "" // Reset preserved name after use
		}
		return acc
	}, {})
}

export const formatINIs = (content: string): FormattedData => {
	const structuredData = structureData(content)

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

export const write = (from: string, content: string, local = false) => {
	const ESMs = resolveESMs(from)
	const formattedData = formatINIs(content)
	const localPath = path.resolve(
		__dirname,
		"..",
		"..",
		"output",
		...BODYGEN_RELATIVE_PATH,
	)
	if (!fs.existsSync(localPath)) {
		fs.mkdirSync(localPath, { recursive: true })
	}
	let count = 0
	for (const esm of ESMs) {
		let esmPath = esm.path
		if (local) {
			esmPath = path.resolve(localPath, esm.name)
		}
		if (!fs.existsSync(esmPath)) {
			fs.mkdirSync(esmPath, { recursive: true })
		}
		const templatesFilePath = path.resolve(esmPath, "templates.ini")
		const morphsFilePath = path.resolve(esmPath, "morphs.ini")

		fs.writeFileSync(templatesFilePath, formattedData.templates)
		fs.writeFileSync(morphsFilePath, formattedData.morphs)
		count++
	}

	return count
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
							value: Number(slider.value),
						})),
						bodyGen: "",
					}
					item.bodyGen = `${item.name}=`
					item.bodyGen += item.sliders
						.reduce((acc, slider) => {
							acc.push(`${slider.name}@${slider.value / 100}`)
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
