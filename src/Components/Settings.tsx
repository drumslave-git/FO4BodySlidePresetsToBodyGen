import { Button, Container, Group, Paper, Text } from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"

import { BodyType } from "../types"
import BodyMesh from "./3D/BodyMesh"
import ThreeView from "./3D/ThreeView"
import ViewHost from "./3D/ViewHost"

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
			<ViewHost />
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
					<ThreeView>
						<BodyMesh bodyType={BodyType.maleBody} />
					</ThreeView>
				</Paper>
				<Paper
					p="md"
					shadow="xs"
					withBorder
					w="calc(50% - var(--group-gap) / 2"
				>
					<Text>Female Body</Text>
					<ThreeView>
						<BodyMesh bodyType={BodyType.femaleBody} />
					</ThreeView>
				</Paper>
			</Group>
		</>
	)
}

export default Settings
