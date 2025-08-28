import { Box, Button, Container, Group, Paper, Text } from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"
import { BodyType } from "../types"
import View from "./3D/View"

import { useConfig } from "./ConfigProvider"
import { useData } from "./DataProvider"

const Settings = () => {
	const { dataFolder, outputFolder, loadConfig } = useConfig()
	const { NIFs } = useData()
	const [isPicking, setIsPicking] = useState<boolean>(false)
	const [hint, setHint] = useState<string>("")

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI.resolveConfigPath().then(setHint)
	}, [])

	const onPathSelection = useCallback(
		async (e: MouseEvent<HTMLButtonElement>) => {
			if (isPicking) return
			setIsPicking(true)
			const folder = e.currentTarget.dataset.folder
			try {
				// @ts-expect-error
				await window.electronAPI.openDataFolder(folder)
				await loadConfig()
			} catch (error) {
				console.error("Error while picking directory:", error)
			} finally {
				setIsPicking(false)
			}
		},
		[isPicking, loadConfig],
	)

	return (
		<Container>
			<Paper p="md" shadow="xs" withBorder>
				<Group>
					<Text>{dataFolder}</Text>
					<Button
						disabled={isPicking}
						data-folder="dataFolder"
						onClick={onPathSelection}
					>
						Select Data Folder
					</Button>
				</Group>
				<Group mt="md">
					<Text>{outputFolder}</Text>
					<Button
						disabled={isPicking}
						data-folder="outputFolder"
						onClick={onPathSelection}
					>
						Select Output Folder
					</Button>
				</Group>
				<Text mt="md" c="dimmed">
					Settings are saved in: {hint}
				</Text>
			</Paper>
			<Paper p="md" shadow="xs" withBorder mt="md">
				<Text size="xs">
					{BodyType.maleBody}: {NIFs[BodyType.maleBody]}
				</Text>
				<Box h={300}>
					<View nifPath={NIFs[BodyType.maleBody]} />
				</Box>
				<Text size="xs">
					{BodyType.femaleBody}: {NIFs[BodyType.femaleBody]}
				</Text>
				<Box h={300}>
					<View nifPath={NIFs[BodyType.femaleBody]} />
				</Box>
			</Paper>
		</Container>
	)
}

export default Settings
