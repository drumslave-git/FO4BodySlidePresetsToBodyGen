import { Box, Card, Code, Group, List, Spoiler, Text } from "@mantine/core"
import { type JSX, useMemo } from "react"
import { type BodySlidePreset, BodyType } from "../../types"
import BodyMesh from "../3D/BodyMesh"
import ThreeView from "../3D/ThreeView"
import Collapsable from "../common/Collapsable"
import PresetToggler, { type PresetTogglerProps } from "./PresetToggler"

export type BodySlidePresetComponentProps = {
	preset: BodySlidePreset
	selectedItems: BodySlidePreset[]
	onTogglePreset: (item: BodySlidePreset) => void
	TogglerComponent: (props: PresetTogglerProps) => JSX.Element
}

const BodySlidePresetComponent = ({
	preset,
	selectedItems,
	onTogglePreset,
	TogglerComponent = PresetToggler,
}: BodySlidePresetComponentProps) => {
	const groups = useMemo(() => {
		return preset.groups
			.map((group) => group.name)
			.sort()
			.join(", ")
	}, [preset])

	return (
		<Card>
			<Group>
				<TogglerComponent
					preset={preset}
					selectedPresets={selectedItems}
					onTogglePreset={onTogglePreset}
				/>
				<Text size="sm">{preset.name}</Text>
			</Group>
			<Group align="top">
				<Box w="calc(50% - var(--group-gap) / 2">
					{preset.gender === -1 && (
						<Text size="xs" c="red">
							Was not able to determine gender by morphs
						</Text>
					)}
					{preset.gender === 0 && (
						<ThreeView>
							<BodyMesh bodyType={BodyType.maleBody} sliders={preset.sliders} />
						</ThreeView>
					)}
					{preset.gender === 1 && (
						<ThreeView>
							<BodyMesh
								bodyType={BodyType.femaleBody}
								sliders={preset.sliders}
							/>
						</ThreeView>
					)}
				</Box>
				<Box w="calc(50% - var(--group-gap) / 2">
					<Spoiler
						maxHeight={15}
						showLabel={<Text size="xs">Show Groups</Text>}
						hideLabel={<Text size="xs">Hide</Text>}
					>
						<Text size="xs" c="dimmed">
							{groups}
						</Text>
					</Spoiler>
					<Box>
						<Collapsable
							title={
								<Group>
									<Text>BodyGen</Text>
									{!preset.valid && <Text c="red">with errors</Text>}
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
							<List size="xs">
								{preset.errors.map((error, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: index
									<List.Item key={index}>{error}</List.Item>
								))}
							</List>
							<Code block>{preset.bodyGen}</Code>
						</Collapsable>
					</Box>
				</Box>
			</Group>
		</Card>
	)
}

export default BodySlidePresetComponent
