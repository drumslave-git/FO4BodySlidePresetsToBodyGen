import { Button, Code, Container, Group, Paper, Text } from "@mantine/core"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { BodySlidePreset, BodySlidePresetParsed } from "../types"
import BodySlidePresets from "./BodySlidePresets"

import { useConfig } from "./ConfigProvider"
import ESMs from "./ESMs"

const Converter = () => {
	const { dataFolder: savedDataFolder } = useConfig()
	const [dataFolder, setDataFolder] = useState<string>(savedDataFolder || "")
	const [isPicking, setIsPicking] = useState<boolean>(false)
	const [bodySlidePresets, setBodySlidePresets] = useState<
		BodySlidePresetParsed[]
	>([])
	const [templatesContent, setTemplatesContent] = useState<string>("")

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
		if (!bodySlidePresets.length) {
			setTemplatesContent("")
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
	}, [bodySlidePresets])

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
			{templatesContent && (
				<Paper mt="md" p="md" shadow="xs" withBorder>
					<Text size="lg">Templates Content</Text>
					<Code block>{templatesContent}</Code>
				</Paper>
			)}
			<Paper mt="md" p="md" shadow="xs" withBorder>
				<BodySlidePresets items={bodySlidePresets} />
			</Paper>
			<Paper>
				<ESMs from={dataFolder} />
			</Paper>
		</Container>
	)
}

export default Converter
