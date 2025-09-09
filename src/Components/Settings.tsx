import { Button, Container, Group, Paper, Text } from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"

import { BodyType } from "../types"
import BodyView from "./3D/BodyView"

import { useConfig } from "./ConfigProvider"
import { useOverlay } from "./OverlayProvider"

const Settings = () => {
	const { dataFolder, outputFolder, loadConfig } = useConfig()
	const { setIsLoading } = useOverlay()
	const [isPicking, setIsPicking] = useState<boolean>(false)

	useEffect(() => {
		setIsLoading(isPicking ? "Picking folder..." : false)
	}, [isPicking, setIsLoading])

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
		<>
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
			</Paper>
			<Group mt="md">
				<Paper
					p="md"
					shadow="xs"
					withBorder
					w="calc(50% - var(--group-gap) / 2"
				>
					<Text>Male Body</Text>
					<BodyView bodyType={BodyType.maleBody} squire />
				</Paper>
				<Paper
					p="md"
					shadow="xs"
					withBorder
					w="calc(50% - var(--group-gap) / 2"
				>
					<Text>Female Body</Text>
					<BodyView bodyType={BodyType.femaleBody} squire />
				</Paper>
			</Group>
		</>
	)
}

export default Settings
