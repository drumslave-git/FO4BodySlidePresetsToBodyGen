import {
	Alert,
	Button,
	Code,
	Container,
	Group,
	Modal,
	Paper,
	Text,
} from "@mantine/core"
import { useCallback, useEffect, useState } from "react"

import type { BodySlidePreset, BodySlidePresetParsed } from "../../types"
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

	return (
		<>
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
				<Paper p="md" shadow="xs" withBorder>
					<Text>{dataFolder}</Text>
					<Group>
						<Button disabled={isPicking} onClick={onPathSelection}>
							Select Data Folder
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
				<Paper>
					<ESMs from={dataFolder} content={templatesContent} />
				</Paper>
			</Container>
		</>
	)
}

export default Converter
