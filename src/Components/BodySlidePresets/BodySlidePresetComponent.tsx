import {
	Box,
	Card,
	Code,
	Group,
	Image,
	List,
	Modal,
	Spoiler,
	Text,
} from "@mantine/core"
import { type JSX, useMemo, useState } from "react"
import { type BodySlidePreset, BodyType } from "../../types"
import Collapsable from "../common/Collapsable"
import BodySlideModelPreview from "./BodySlideModelPreview"
import PresetToggler, { type PresetTogglerProps } from "./PresetToggler"

export type BodySlidePresetComponentProps = {
	preset: BodySlidePreset
	selectedItems: BodySlidePreset[]
	onTogglePreset?: (item: BodySlidePreset) => void
	TogglerComponent: (props: PresetTogglerProps) => JSX.Element
}

const BodySlidePresetComponent = ({
	preset,
	selectedItems,
	onTogglePreset,
	TogglerComponent = PresetToggler,
}: BodySlidePresetComponentProps) => {
	const [isModelOpen, setIsModelOpen] = useState(false)
	const groups = useMemo(() => {
		return preset.groups
			.map((group) => group.name)
			.sort()
			.join(", ")
	}, [preset])
	const removedPercent = useMemo(() => {
		if (!preset.sliders.length) return 0
		return (
			Math.round((preset.errors.length / preset.sliders.length) * 1000) / 10
		)
	}, [preset])

	return (
		<Card>
			{preset.previewImageUrl && (
				<Card.Section>
					<Image
						src={preset.previewImageUrl}
						alt={`${preset.name} preview`}
						height={180}
						fit="contain"
					/>
				</Card.Section>
			)}
			<Group>
				{onTogglePreset && (
					<TogglerComponent
						preset={preset}
						selectedPresets={selectedItems}
						onTogglePreset={onTogglePreset}
					/>
				)}

				<Text size="sm">{preset.name}</Text>
			</Group>
			{preset.previewGlbUrl && (
				<Text
					size="xs"
					mt="xs"
					c="blue"
					style={{ cursor: "pointer" }}
					onClick={() => setIsModelOpen(true)}
				>
					Open model preview
				</Text>
			)}
			<Spoiler
				maxHeight={15}
				showLabel={<Text size="xs">Show Groups</Text>}
				hideLabel={<Text size="xs">Hide</Text>}
			>
				<Text size="xs" c="dimmed">
					{groups}
				</Text>
			</Spoiler>
			<Text size="xs" c="dimmed">
				Removed {preset.errors.length}/{preset.sliders.length} sliders (
				{removedPercent}%)
			</Text>
			<Box>
				<Collapsable
					title={
						<Group>
							<Text>BodyGen</Text>
							{!preset.valid && <Text c="red">with errors</Text>}
							{preset.warnings.length > 0 && <Text c="yellow">warnings</Text>}
						</Group>
					}
					titleProps={{
						mt: "md",
					}}
					iconProps={{
						color: !preset.valid ? "red" : undefined,
						size: "sm",
					}}
				>
					{preset.errors.length > 0 && (
						<>
							<Text size="xs" mt="xs" c="red">
								Errors
							</Text>
							<List size="xs" c="red">
								{preset.errors.map((error, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: index
									<List.Item key={index}>{error}</List.Item>
								))}
							</List>
						</>
					)}
					{preset.warnings.length > 0 && (
						<>
							<Text size="xs" mt="xs" c="yellow">
								Warnings
							</Text>
							<List size="xs" c="yellow">
								{preset.warnings.map((warning, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: index
									<List.Item key={index}>{warning}</List.Item>
								))}
							</List>
						</>
					)}
					<Code block>{preset.bodyGen}</Code>
				</Collapsable>
			</Box>
			<Modal
				opened={isModelOpen}
				onClose={() => setIsModelOpen(false)}
				title={preset.name}
				size="lg"
			>
				{preset.previewGlbUrl && (
					<BodySlideModelPreview url={preset.previewGlbUrl} />
				)}
			</Modal>
		</Card>
	)
}

export default BodySlidePresetComponent
