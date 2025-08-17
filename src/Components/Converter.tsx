import { Button, Code, Container, Group, Paper, Text } from "@mantine/core"
import { useCallback, useEffect, useState } from "react"
import type { BodySlidePreset, BodySlidePresetParsed } from "../types"
import BodySlidePresets, { type FilterValue } from "./BodySlidePresets"

import { useConfig } from "./ConfigProvider"
import ESMs from "./ESMs"

const Converter = () => {
	const { dataFolder: savedDataFolder } = useConfig()
	const [dataFolder, setDataFolder] = useState<string>(savedDataFolder || "")
	const [isPicking, setIsPicking] = useState<boolean>(false)
	const [bodySlidePresets, setBodySlidePresets] = useState<
		BodySlidePresetParsed[]
	>([])
	const [filteredPresets, setFilteredPresets] = useState<
		BodySlidePresetParsed[]
	>([])
	const [templatesContent, setTemplatesContent] = useState<string>("")
	const [filterOptions, setFilterOptions] = useState<string[]>([])
	const [selectedPresets, setSelectedPresets] = useState<BodySlidePreset[]>([])

	useEffect(() => {
		if (!dataFolder) {
			setBodySlidePresets([])
			return
		}
		// @ts-expect-error
		window.electronAPI
			.resolveBodySlidePresets(dataFolder)
			.then((presets: BodySlidePresetParsed[]) => {
				setBodySlidePresets(presets)
			})
	}, [dataFolder])

	useEffect(() => {
		setSelectedPresets([])
		if (!bodySlidePresets.length) {
			setTemplatesContent("")
			setFilteredPresets([])
			setFilterOptions([])
			return
		}
		setTemplatesContent(
			bodySlidePresets
				.filter((item) => typeof item.data !== "string")
				.reduce((acc, item) => {
					acc.push(
						(item.data as BodySlidePreset[])
							.map((preset) => preset.bodyGen)
							.join("\n"),
					)
					return acc
				}, [])
				.join("\n\n"),
		)
		setFilteredPresets(bodySlidePresets)
		setFilterOptions(
			bodySlidePresets
				.reduce((acc: string[], item) => {
					if (typeof item.data === "string") {
						return acc
					}
					for (const preset of item.data) {
						for (const group of preset.groups) {
							if (!acc.includes(group.name)) {
								acc.push(group.name)
							}
						}
					}

					return acc
				}, [])
				.sort((a, b) => a.localeCompare(b)),
		)
	}, [bodySlidePresets])

	const onFilter = useCallback(
		(value: FilterValue) => {
			const { q, selected } = value
			const filtered = bodySlidePresets
				.map((preset) => {
					if (typeof preset.data === "string") {
						return preset
					}
					return {
						...preset,
						data: preset.data.filter((item) => {
							const matchQUery =
								!q || item.name.toLowerCase().includes(q.toLowerCase())
							const matchGroup =
								selected.length === 0 ||
								item.groups.some((group) => selected.includes(group.name))
							return matchQUery && matchGroup
						}),
					}
				})
				.filter((preset) => Array.isArray(preset.data) && preset.data.length)
			setFilteredPresets(filtered)
		},
		[bodySlidePresets],
	)

	const onTogglePreset = useCallback((preset: BodySlidePreset) => {
		setSelectedPresets((prev) => {
			const exists = prev.find((p) => p.bodyGen === preset.bodyGen)
			if (exists) {
				return prev.filter((p) => p.bodyGen !== preset.bodyGen)
			}
			return [...prev, preset]
		})
	}, [])

	const onPathSelection = useCallback(async () => {
		if (isPicking) return
		setIsPicking(true)
		try {
			// @ts-expect-error
			const folder = await window.electronAPI.openDataFolder()
			setDataFolder(folder)
		} catch (error) {
			console.error("Error while picking directory:", error)
		} finally {
			setIsPicking(false)
		}
	}, [isPicking])

	return (
		<Container>
			<Paper p="md" shadow="xs" withBorder>
				<Text>{dataFolder}</Text>
				<Group>
					<Button disabled={isPicking} onClick={onPathSelection}>
						Select Data Folder
					</Button>
				</Group>
			</Paper>
			<Paper mt="md" p="md" shadow="xs" withBorder>
				<BodySlidePresets
					items={filteredPresets}
					filterOptions={filterOptions}
					onFilter={onFilter}
					onTogglePreset={onTogglePreset}
					selectedPresets={selectedPresets}
				/>
			</Paper>
			{templatesContent && (
				<Paper mt="md" p="md" shadow="xs" withBorder>
					<Text size="lg">Templates Content</Text>
					<Code block>{templatesContent}</Code>
				</Paper>
			)}
			<Paper>
				<ESMs from={dataFolder} />
			</Paper>
		</Container>
	)
}

export default Converter
