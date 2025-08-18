import {
	Alert,
	Box,
	Button,
	Code,
	Container,
	Group,
	LoadingOverlay,
	Modal,
	Notification,
	Paper,
	Text,
	Textarea,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { type ChangeEvent, useCallback, useEffect, useState } from "react"

import type { NotificationData } from "../types"
import Collapsable from "./Collapsable"
import { useConfig } from "./ConfigProvider"
import ESMs from "./ESMs"

const Formatter = () => {
	const { templatesFile: initialTemplatesFile } = useConfig()
	const [loading, setLoading] = useState(false)
	const [templatesFile, setTemplatesFile] =
		useState<string>(initialTemplatesFile)
	const [templatesContent, setTemplatesContent] = useState<string>("")
	const [templatesEditedContent, setTemplatesEditedContent] =
		useState<string>("")
	const [isPicking, setIsPicking] = useState(false)
	const [templatesError, setTemplatesError] = useState<string | null>(null)
	const [readyToWrite, setReadyToWrite] = useState(false)
	const [morphsContent, setMorphsContent] = useState<string>("")
	const [templatesFormattedContent, setTemplatesFormattedContent] =
		useState<string>("")
	const [notification, setNotification] = useState<NotificationData | null>(
		null,
	)

	const [confirmation, { open: confirmationOpen, close: confirmationClose }] =
		useDisclosure(false)

	useEffect(() => {
		if (!templatesFile) {
			setTemplatesContent("")
			setTemplatesFormattedContent("")
			setMorphsContent("")
			return
		}
		setLoading(true)
		// @ts-expect-error
		window.electronAPI.loadTemplates().then((content: string) => {
			setTemplatesContent(content)
			setLoading(false)
		})
	}, [templatesFile])

	useEffect(() => {
		setTemplatesEditedContent(templatesContent)
		if (!templatesContent) {
			setTemplatesFormattedContent("")
			setMorphsContent("")
			return
		}
		const process = async () => {
			const validation: string =
				// @ts-expect-error
				await window.electronAPI.validateTemplates(templatesContent)
			setTemplatesError(validation ? validation : null)
			if (validation) {
				setTemplatesFormattedContent("")
				setMorphsContent("")
				return
			}
			// @ts-expect-error
			const formatted = await window.electronAPI.format(templatesContent)
			setTemplatesFormattedContent(formatted.templates)
			setMorphsContent(formatted.morphs)
		}
		void process()
	}, [templatesContent])

	useEffect(() => {
		setReadyToWrite(
			templatesFile &&
				templatesContent &&
				templatesContent === templatesEditedContent &&
				templatesFormattedContent &&
				morphsContent &&
				!templatesError,
		)
	}, [
		templatesError,
		templatesFile,
		templatesContent,
		templatesEditedContent,
		templatesFormattedContent,
		morphsContent,
	])

	useEffect(() => {
		if (!templatesContent || templatesError) {
			setTemplatesFormattedContent("")
			setMorphsContent("")
			return
		}
	}, [templatesContent, templatesError])

	const onPathSelection = useCallback(async () => {
		if (isPicking) return
		setIsPicking(true)
		try {
			// @ts-expect-error
			const templates = await window.electronAPI.openTemplates()
			setTemplatesFile(templates)
		} catch (error) {
			console.error("Error while picking directory:", error)
		} finally {
			setIsPicking(false)
		}
	}, [isPicking])

	const onTemplatesContentChange = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>) => {
			setTemplatesError(null)
			setTemplatesEditedContent(event.target.value)
		},
		[],
	)

	const onBlur = useCallback(() => {
		if (templatesEditedContent === templatesContent) return
		// @ts-expect-error
		window.electronAPI
			.validateTemplates(templatesEditedContent)
			.then((result: string) => {
				setTemplatesError(result ? result : null)
				setTemplatesContent(templatesEditedContent)
			})
	}, [templatesEditedContent, templatesContent])

	const onWrite = useCallback(async () => {
		if (!readyToWrite) return
		setLoading(true)
		try {
			// @ts-expect-error
			const count = await window.electronAPI.write(
				templatesFile,
				templatesContent,
			)
			// @ts-expect-error
			const formatted = await window.electronAPI.format(templatesContent)
			setTemplatesFormattedContent(formatted.templates)
			setMorphsContent(formatted.morphs)
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
				text: "An error occurred while writing to the ESMs.",
			})
		} finally {
			setLoading(false)
		}
	}, [readyToWrite, templatesFile, templatesContent])

	return (
		<>
			<LoadingOverlay zIndex={1000} visible={loading} pos="fixed" />
			<Modal
				opened={confirmation}
				onClose={confirmationClose}
				title="Ready to Write?"
				centered
				withCloseButton={false}
			>
				<Group>
					<Text>
						Are you sure you want to write the changes to the ESMs? This action
						cannot be undone.
					</Text>
					<Button
						color="red"
						onClick={() => {
							void onWrite()
							confirmationClose()
						}}
					>
						Write
					</Button>
					<Button onClick={confirmationClose}>Cancel</Button>
				</Group>
			</Modal>
			<Container pos="relative">
				{notification && (
					<Notification
						color={notification.color}
						title={notification.title}
						onClose={() => setNotification(null)}
					>
						{notification.text}
					</Notification>
				)}
				<Paper shadow="xs" p="md" withBorder>
					<Text>{templatesFile}</Text>
					<Group grow preventGrowOverflow={false}>
						<Button onClick={onPathSelection} disabled={isPicking}>
							Pick Source Templates
						</Button>
						<Button
							disabled={!readyToWrite}
							color="orange"
							onClick={confirmationOpen}
						>
							Write
						</Button>
					</Group>
				</Paper>
				{templatesError && (
					<Alert color="red" title="Templates Error" mt="md">
						{templatesError}
					</Alert>
				)}
				{templatesEditedContent && (
					<Paper shadow="xs" mt="md" p="md" withBorder>
						<Text size="lg">Input</Text>
						<Textarea
							value={templatesEditedContent}
							onChange={onTemplatesContentChange}
							autosize
							maxRows={5}
							resize="vertical"
							onBlur={onBlur}
						/>
					</Paper>
				)}
				<Paper shadow="xs" mt="md" p="md" withBorder>
					<Text size="lg">Output</Text>
					{templatesFormattedContent && (
						<Box mt="md">
							<Collapsable title="templates.ini">
								<Code block>{templatesFormattedContent}</Code>
							</Collapsable>
						</Box>
					)}
					{morphsContent && (
						<Box mt="md">
							<Collapsable title="morphs.ini">
								<Code block>{morphsContent}</Code>
							</Collapsable>
						</Box>
					)}
				</Paper>
				<Paper shadow="xs" mt="md" p="md" withBorder>
					<ESMs from={templatesFile} content={templatesContent} />
				</Paper>
			</Container>
		</>
	)
}

export default Formatter
