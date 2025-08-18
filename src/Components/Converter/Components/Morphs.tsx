import {
	ActionIcon,
	Button,
	Card,
	Group,
	Input,
	Stack,
	Text,
} from "@mantine/core"
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

	return (
		<>
			{morphs.map((morph, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<Card key={index}>
					<Group wrap="nowrap">
						<Stack w="100%">
							{morph.rules.map((rule, ruleIndex) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
				<Button leftSection={<IconPlus />} fullWidth onClick={onAddMorph}>
					Add Morph
				</Button>
			</Card>
		</>
	)
}

export default Morphs
