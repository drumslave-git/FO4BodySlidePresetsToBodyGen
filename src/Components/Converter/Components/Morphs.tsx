import {
	ActionIcon,
	Button,
	Card,
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
	useRef,
} from "react"
import type { BodySlidePreset } from "../../../types"

export type Morph = {
	rules: string[]
	presets: BodySlidePreset[]
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
	const [
		showTemplatesModal,
		{ open: openTemplatesModal, close: closeTemplatesModal },
	] = useDisclosure(false)

	const templatesRef = useRef<HTMLTextAreaElement>(null)

	const onRuleChange = useCallback(
		(morphIndex: number, ruleIndex: number, value?: string) => {
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
			setMorphs(updatedMorphs)
		},
		[morphs, setMorphs],
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

	// const onTemplatesPaste = useCallback(() => {
	//   if (!templatesRef.current) return
	// })

	return (
		<>
			{/*<Modal*/}
			{/*	opened={showTemplatesModal}*/}
			{/*	onClose={closeTemplatesModal}*/}
			{/*	title="Paste Templates"*/}
			{/*>*/}
			{/*	<Textarea*/}
			{/*		minRows={10}*/}
			{/*		autosize*/}
			{/*		placeholder="Paste your templates here"*/}
			{/*		ref={templatesRef}*/}
			{/*	/>*/}
			{/*	<Button onClick={onTemplatesPaste}>Close</Button>*/}
			{/*</Modal>*/}
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
					{/*<Button onClick={openTemplatesModal}>Paste Templates</Button>*/}
				</Group>
			</Card>
		</>
	)
}

export default Morphs
