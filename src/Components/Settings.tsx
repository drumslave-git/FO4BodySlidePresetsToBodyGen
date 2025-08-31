import { Box, Button, Container, Group, Paper, Text } from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"
import { BodyType } from "../types"
import View from "./3D/View"

import { useConfig } from "./ConfigProvider"
import { useData } from "./DataProvider"

const Settings = () => {
	const { dataFolder, outputFolder, loadConfig } = useConfig()
	const { bodyFiles } = useData()
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
				<Text>Male Body</Text>
				<Text size="xs">
					nif: {BodyType.maleBody}: {bodyFiles[BodyType.maleBody].nif}
				</Text>
				<Text size="xs">
					tri: {BodyType.maleBody}: {bodyFiles[BodyType.maleBody].tri}
				</Text>
				<Box h={300}>
					<View
						nifPath={bodyFiles[BodyType.maleBody].nif}
						triPath={bodyFiles[BodyType.maleBody].tri}
					/>
				</Box>
			</Paper>
			<Paper p="md" shadow="xs" withBorder mt="md">
				<Text>Female Body</Text>
				<Text size="xs">
					nif: {BodyType.femaleBody}: {bodyFiles[BodyType.femaleBody].nif}
				</Text>
				<Text size="xs">
					tri: {BodyType.femaleBody}: {bodyFiles[BodyType.femaleBody].tri}
				</Text>
				<Box h={300}>
					<View
						nifPath={bodyFiles[BodyType.femaleBody].nif}
						triPath={bodyFiles[BodyType.femaleBody].tri}
					/>
				</Box>
			</Paper>
		</Container>
	)
}

export default Settings
