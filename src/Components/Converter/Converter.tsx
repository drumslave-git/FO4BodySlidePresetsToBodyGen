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
	Text,
} from "@mantine/core"
import { useCallback, useEffect, useState } from "react"

import type {
	BodySlidePreset,
	BodySlidePresetParsed,
	NotificationData,
} from "../../types"
import { useConfig } from "../ConfigProvider"
import ESMs from "../ESMs"
import BodySlidePresets from "./Components/BodySlidePresets"
import Morphs, { type Morph } from "./Components/Morphs"

const Converter = () => {
	const { dataFolder: savedDataFolder } = useConfig()
	const [dataFolder, setDataFolder] = useState<string>(savedDataFolder || "")
	const [isPicking, setIsPicking] = useState<boolean>(false)
	const [bodySlidePresets, setBodySlidePresets] = useState<
		BodySlidePresetParsed[]
	>([])
	const [templatesContent, setTemplatesContent] = useState<string>("")
	const [morphs, setMorphs] = useState<Morph[]>([])
	const [morphsContent, setMorphsContent] = useState<string>("")
	const [editedMorphIndex, setEditedMorphIndex] = useState<number | null>(null)
	const [validationError, setValidationError] = useState<string>("")
	const [readyToWrite, setReadyToWrite] = useState(false)
	const [loading, setLoading] = useState(false)
	const [notification, setNotification] = useState<NotificationData | null>(
		null,
	)

	useEffect(() => {
		if (!dataFolder) {
			setBodySlidePresets([])
			setMorphs([])
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
		if (!morphs.length) {
			setTemplatesContent("")
			setMorphsContent("")
			return
		}
		const templates = morphs
			.reduce((acc, morph) => {
				acc.push(`#morphs=${morph.rules.join(";")}`)
				acc.push(morph.presets.map((preset) => preset.bodyGen).join("\n\n"))
				return acc
			}, [])
			.join("\n\n\n")
		const process = async (content: string) => {
			const validation =
				// @ts-expect-error
				await window.electronAPI.validateTemplates(content)
			setValidationError(validation)
			if (validation) {
				setMorphsContent("")
				setTemplatesContent("")
				return
			}
			// @ts-expect-error
			const formatted = await window.electronAPI.format(content)
			setTemplatesContent(formatted.templates)
			setMorphsContent(formatted.morphs)
		}
		void process(templates)
	}, [morphs])

	useEffect(() => {
		setReadyToWrite(!validationError && !!templatesContent && !!morphsContent)
	}, [validationError, templatesContent, morphsContent])

	const bodySlidePresetsModalOpen = useCallback((index: number) => {
		setEditedMorphIndex(index)
	}, [])

	const bodySlidePresetsModalClose = useCallback(() => {
		setEditedMorphIndex(null)
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

	const onBodySlidePresetsSubmit = useCallback(
		(presets: BodySlidePreset[]) => {
			if (editedMorphIndex === null) return
			const updatedMorphs = [...morphs]
			updatedMorphs[editedMorphIndex].presets = presets
			setMorphs(updatedMorphs)
			bodySlidePresetsModalClose()
		},
		[editedMorphIndex, morphs, bodySlidePresetsModalClose],
	)

	const onWrite = useCallback(async () => {
		if (!readyToWrite) return
		setLoading(true)
		try {
			// @ts-expect-error
			const count = await window.electronAPI.write(
				dataFolder,
				templatesContent,
				true,
			)
			setNotification({
				color: "green",
				title: "Success",
				text: `Successfully written to ${count} ESMs`,
			})
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
		setLoading(true)
		try {
			// @ts-expect-error
			await window.electronAPI.zipOutput()
			setNotification({
				color: "green",
				title: "Success",
				text: "Successfully zipped the output",
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
				size="auto"
			>
				<BodySlidePresets
					items={bodySlidePresets}
					onSubmit={onBodySlidePresetsSubmit}
					onCancel={bodySlidePresetsModalClose}
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
					<Group>
						<Text>{dataFolder}</Text>
						<Button disabled={isPicking} onClick={onPathSelection}>
							Select Data Folder
						</Button>
					</Group>
					<Group mt="md">
						<Button color="orange" onClick={onZip}>
							Zip Output
						</Button>
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
						<Text size="lg">Templates Content</Text>
						<Code block>{templatesContent}</Code>
					</Paper>
				)}
				{morphsContent && (
					<Paper mt="md" p="md" shadow="xs" withBorder>
						<Text size="lg">Morphs Content</Text>
						<Code block>{morphsContent}</Code>
					</Paper>
				)}
				<Paper mt="md" p="md" shadow="xs" withBorder>
					<ESMs from={dataFolder} content={templatesContent} />
				</Paper>
			</Container>
		</>
	)
}

export default Converter
