import {
	ActionIcon,
	Box,
	Button,
	Card,
	Divider,
	Group,
	Input,
	Modal,
	Stack,
	Textarea,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconMinus, IconPlus, IconSettings } from "@tabler/icons-react"
import {
	type ChangeEvent,
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
} from "react"
import type {
	BodySlidePreset,
	BodySlidePresetParsed,
	ParsedTemplates,
} from "../../../types"
import { useData } from "../../DataProvider"
import { useSharedState } from "../../SharedStateProvider"

export type Morph = {
	rules: string[]
	presets: BodySlidePreset[]
}

const parseTemplateRaw = async (
	text: string,
	bodySlidePresetsParsed: BodySlidePresetParsed[],
) => {
	// @ts-expect-error
	const validation = await window.electronAPI.validateTemplates(text)
	if (validation) {
		console.error("Validation error:", validation)
		return []
	}
	// @ts-expect-error
	const parsed: ParsedTemplates = await window.electronAPI.parseTemplates(text)
	return Object.entries(parsed).reduce((acc: Morph[], [key, templates]) => {
		acc.push({
			rules: key
				.split(";")
				.map((rule) => rule.trim())
				.filter(Boolean),
			presets: templates
				.map(({ name, value: bodyGen }: { name: string; value: string }) => {
					let preset: BodySlidePreset
					for (const item of bodySlidePresetsParsed) {
						if (typeof item.data === "string") continue
						preset = item.data.find(
							(p) => p.name === name && p.bodyGen === bodyGen,
						)
						if (preset) break
					}
					return preset
				})
				.filter(Boolean),
		})
		return acc
	}, [])
}

const Morphs = ({
	morphs,
	setMorphs,
	onSelectBodySlidePresets,
}: {
	morphs: Morph[]
	setMorphs: Dispatch<SetStateAction<Morph[]>>
	onSelectBodySlidePresets: (index: number) => void
}) => {
	const { bodySlidePresetsParsed } = useData()
	const { templatesRaw, setTemplatesRaw } = useSharedState()
	const [
		showTemplatesModal,
		{ open: openTemplatesModal, close: closeTemplatesModal },
	] = useDisclosure(false)

	const templatesRef = useRef<HTMLTextAreaElement>(null)

	const onRuleChange = useCallback(
		(morphIndex: number, ruleIndex: number, value?: string) => {
			setMorphs((morphs) => {
				const updatedMorphs = [...morphs]
				if (
					value === undefined &&
					updatedMorphs[morphIndex].rules[ruleIndex] !== undefined
				) {
					// Remove the rule if value is undefined
					updatedMorphs[morphIndex].rules = updatedMorphs[
						morphIndex
					].rules.filter((_, i) => i !== ruleIndex)
				} else {
					updatedMorphs[morphIndex].rules[ruleIndex] = value
				}
				return updatedMorphs
			})
		},
		[setMorphs],
	)

	const onAddMorph = useCallback(() => {
		setMorphs((prev) => [...prev, { rules: [""], presets: [] }])
	}, [setMorphs])

	const onRemoveMorph = useCallback(
		(index: number) => {
			setMorphs((prev) => prev.filter((_, i) => i !== index))
		},
		[setMorphs],
	)

	useEffect(() => {
		if (!templatesRaw) return
		parseTemplateRaw(templatesRaw, bodySlidePresetsParsed).then(setMorphs)
		setTemplatesRaw("")
	}, [templatesRaw, bodySlidePresetsParsed])

	const onTemplatesEdit = useCallback(() => {
		if (!templatesRef.current) return
		const text = templatesRef.current.value
		setTemplatesRaw(text)
		closeTemplatesModal()
	}, [])

	return (
		<>
			<Modal
				opened={showTemplatesModal}
				onClose={closeTemplatesModal}
				title="Templates"
				size="xl"
			>
				<Textarea
					data-autofocus
					minRows={10}
					autosize
					defaultValue={templatesRaw}
					ref={templatesRef}
				/>
				<Box pos="sticky" bottom={0} bg="var(--mantine-color-body)" py="md">
					<Divider mb="md" />
					<Button onClick={onTemplatesEdit}>Save</Button>
				</Box>
			</Modal>
			{morphs.map((morph, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: index
				<Card key={index}>
					<Group wrap="nowrap">
						<Stack w="100%">
							{morph.rules.map((rule, ruleIndex) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: index
								<Group key={ruleIndex} wrap="nowrap">
									<Input
										value={rule}
										placeholder="Rule"
										w="100%"
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											onRuleChange(index, ruleIndex, e.target.value)
										}
									/>
									<ActionIcon
										onClick={() => onRuleChange(index, ruleIndex, undefined)}
										color="red"
									>
										<IconMinus />
									</ActionIcon>
								</Group>
							))}
							<Button
								fullWidth
								leftSection={<IconPlus />}
								onClick={() => onRuleChange(index, morph.rules.length, "")}
							>
								Add Rule
							</Button>
						</Stack>
						<Button
							leftSection={<IconSettings />}
							onClick={() => onSelectBodySlidePresets(index)}
							fullWidth
						>
							Templates: {morph.presets.length}
						</Button>
						<ActionIcon onClick={() => onRemoveMorph(index)} color="red">
							<IconMinus />
						</ActionIcon>
					</Group>
				</Card>
			))}
			<Card>
				<Group>
					<Button leftSection={<IconPlus />} onClick={onAddMorph}>
						Add Morph
					</Button>
					<Button onClick={openTemplatesModal}>Paste Templates</Button>
				</Group>
			</Card>
		</>
	)
}

export default Morphs
