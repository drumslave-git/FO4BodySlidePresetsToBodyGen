import { Box, Stack, Text } from "@mantine/core"
import type { JSX } from "react"
import type { BodySlidePreset, BodySlidePresetParsed } from "../../types"
import BodySlidePresetComponent, {
	type BodySlidePresetComponentProps,
} from "./BodySlidePresetComponent"
import PresetToggler, { type PresetTogglerProps } from "./PresetToggler"

export type BodySlidePresetParsedComponentProps = {
	item: BodySlidePresetParsed
	selectedItems: BodySlidePreset[]
	onTogglePreset: (item: BodySlidePreset) => void
	ItemComponent?: (props: BodySlidePresetComponentProps) => JSX.Element
	TogglerComponent?: (props: PresetTogglerProps) => JSX.Element
}

const BodySlidePresetParsedComponent = ({
	item,
	selectedItems,
	onTogglePreset,
	ItemComponent = BodySlidePresetComponent,
	TogglerComponent = PresetToggler,
}: BodySlidePresetParsedComponentProps) => {
	return (
		<Box mt="md">
			<Text size="xs">{item.filename}</Text>
			{typeof item.data === "string" && (
				<Text size="sm" c="dimmed" key={item.filename}>
					{item.data}
				</Text>
			)}
			<Stack>
				{typeof item.data !== "string" &&
					item.data.map((preset) => (
						<ItemComponent
							key={preset.name}
							preset={preset}
							selectedItems={selectedItems}
							onTogglePreset={onTogglePreset}
							TogglerComponent={TogglerComponent}
						/>
					))}
			</Stack>
		</Box>
	)
}

export default BodySlidePresetParsedComponent
