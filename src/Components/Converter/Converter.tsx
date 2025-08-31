import {
	Alert,
	Button,
	Code,
	Container,
	Group,
	LoadingOverlay,
	Modal,
	Notification,
	Paper,
	ScrollArea,
} from "@mantine/core"
import { useCallback, useEffect, useState } from "react"

import type { BodySlidePreset, NotificationData } from "../../types"
import Collapsable from "../Collapsable"
import { useConfig } from "../ConfigProvider"
import { useData } from "../DataProvider"
import { useSharedState } from "../SharedStateProvider"
import BodySlidePresets from "./Components/BodySlidePresets"
import Morphs from "./Components/Morphs"

const Converter = () => {
	const { dataFolder, outputFolder } = useConfig()
	const { validateESMs } = useData()
	const {
		morphs,
		setMorphs,
		validationError,
		morphsContent,
		templatesContent,
		setTemplatesRaw,
	} = useSharedState()
	const [editedMorphIndex, setEditedMorphIndex] = useState<number | null>(null)
	const [readyToWrite, setReadyToWrite] = useState(false)
	const [loading, setLoading] = useState(false)
	const [notification, setNotification] = useState<NotificationData | null>(
		null,
	)

	useEffect(() => {
		setReadyToWrite(!validationError && !!templatesContent && !!morphsContent)
	}, [validationError, templatesContent, morphsContent])

	const bodySlidePresetsModalOpen = useCallback((index: number) => {
		setEditedMorphIndex(index)
	}, [])

	const bodySlidePresetsModalClose = useCallback(() => {
		setEditedMorphIndex(null)
	}, [])

	const onBodySlidePresetsSubmit = useCallback(
		(presets: BodySlidePreset[]) => {
			if (editedMorphIndex === null) return
			bodySlidePresetsModalClose()
			setMorphs((prev) => {
				return prev.map((morph, index) => {
					if (index !== editedMorphIndex) return morph
					return {
						...morph,
						presets,
					}
				})
			})
		},
		[editedMorphIndex, setMorphs, bodySlidePresetsModalClose],
	)

	const onWrite = useCallback(async () => {
		if (!readyToWrite) return
		setLoading(true)
		try {
			// @ts-expect-error
			const { count, outDir } = await window.electronAPI.write(
				dataFolder,
				templatesContent,
			)
			setNotification({
				color: "green",
				title: "Success",
				text: `Successfully written .ini files to ${count} ESMs in ${outDir}`,
			})
			setTemplatesRaw("")
			validateESMs()
		} catch (error) {
			console.error("Error while writing:", error)
			setNotification({
				color: "red",
				title: "Error",
				text: `An error occurred while writing to the ESMs: ${error.message}}`,
			})
		} finally {
			setLoading(false)
		}
	}, [readyToWrite, templatesContent])

	const onZip = useCallback(async () => {
		if (outputFolder === dataFolder) return
		setLoading(true)
		try {
			// @ts-expect-error
			const result = await window.electronAPI.zipOutput()
			setNotification({
				color: "green",
				title: "Success",
				text: `Successfully zipped the output: ${result}`,
			})
		} catch (error) {
			console.error("Error while zipping:", error)
			setNotification({
				color: "red",
				title: "Error",
				text: `An error occurred while zipping the output: ${error.message}}`,
			})
		} finally {
			setLoading(false)
		}
	}, [])

	return (
		<>
			<LoadingOverlay zIndex={1000} visible={loading} pos="fixed" />
			<Modal
				opened={editedMorphIndex !== null}
				onClose={bodySlidePresetsModalClose}
				title="Select BodySlide Presets"
				withCloseButton={false}
				size="xl"
				scrollAreaComponent={ScrollArea.Autosize}
			>
				<BodySlidePresets
					onSubmit={onBodySlidePresetsSubmit}
					onCancel={bodySlidePresetsModalClose}
					selectedPresets={morphs[editedMorphIndex]?.presets}
				/>
			</Modal>
			<Container>
				{notification && (
					<Notification
						color={notification.color}
						title={notification.title}
						onClose={() => setNotification(null)}
					>
						{notification.text}
					</Notification>
				)}
				<Paper p="md" shadow="xs" withBorder>
					<Group mt="md">
						{dataFolder !== outputFolder && (
							<Button color="orange" onClick={onZip}>
								Zip Output
							</Button>
						)}
						<Button color="orange" disabled={!readyToWrite} onClick={onWrite}>
							Write
						</Button>
					</Group>
				</Paper>
				<Paper mt="md" p="md" shadow="xs" withBorder>
					<Morphs
						morphs={morphs}
						setMorphs={setMorphs}
						onSelectBodySlidePresets={bodySlidePresetsModalOpen}
					/>
					{validationError && (
						<Alert color="red" title="Templates Error" mt="md">
							{validationError}
						</Alert>
					)}
				</Paper>
				{templatesContent && (
					<Paper mt="md" p="md" shadow="xs" withBorder>
						<Collapsable title="templates.ini">
							<Code block>{templatesContent}</Code>
						</Collapsable>
					</Paper>
				)}
				{morphsContent && (
					<Paper mt="md" p="md" shadow="xs" withBorder>
						<Collapsable title="morphs.ini">
							<Code block>{morphsContent}</Code>
						</Collapsable>
					</Paper>
				)}
			</Container>
		</>
	)
}

export default Converter
