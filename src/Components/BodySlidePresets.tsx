import { Badge, Card, Code, Group, Text } from "@mantine/core"
import { Fragment } from "react"

import type { BodySlidePresetParsed } from "../types"

const BodySlidePresets = ({ items }: { items: BodySlidePresetParsed[] }) => {
	if (items.length === 0) {
		return <Text size="lg">No BodySlide presets found</Text>
	}

	return (
		<>
			<Text size="lg">BodySlide Presets</Text>
			{items.map((item) => (
				<Fragment key={item.filename}>
					<Text>{item.filename}</Text>
					{typeof item.data === "string" && (
						<Text size="sm" c="dimmed" key={item.filename}>
							{item.data}
						</Text>
					)}
					{typeof item.data !== "string" &&
						item.data.map((preset) => (
							<Card key={preset.name}>
								<Text>{preset.name}</Text>
								<Group>
									{preset.groups.map((group) => (
										<Badge key={group.name}>{group.name}</Badge>
									))}
								</Group>
								<Text mt="md">BodyGen</Text>
								<Code block>{preset.bodyGen}</Code>
							</Card>
						))}
				</Fragment>
			))}
		</>
	)
}

export default BodySlidePresets
