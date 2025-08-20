import { Button, Container, Group, Paper, Text } from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"
import { BODYGEN_RELATIVE_PATH } from "../consts"

import { useConfig } from "./ConfigProvider"

const Settings = () => {
	const { dataFolder, outputFolder, setFolder } = useConfig()
	const [isPicking, setIsPicking] = useState<boolean>(false)
	const [hint, setHint] = useState<string>("")

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI
			.pathResolve(outputFolder, ...BODYGEN_RELATIVE_PATH)
			.then(setHint)
	}, [outputFolder])

	const onPathSelection = useCallback(
		async (e: MouseEvent<HTMLButtonElement>) => {
			if (isPicking) return
			setIsPicking(true)
			const folder = e.currentTarget.dataset.folder
			try {
				// @ts-expect-error
				const path = await window.electronAPI.openDataFolder(folder)
				setFolder(folder, path)
			} catch (error) {
				console.error("Error while picking directory:", error)
			} finally {
				setIsPicking(false)
			}
		},
		[isPicking, setFolder],
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
					Results will be stored at: {hint}
				</Text>
			</Paper>
		</Container>
	)
}

export default Settings
