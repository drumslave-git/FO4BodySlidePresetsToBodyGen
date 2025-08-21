import { Card, Text } from "@mantine/core"
import { useData } from "./DataProvider"

const ESMs = () => {
	const { ESMs: items } = useData()

	if (items.length === 0) {
		return <Text size="lg">No ESMs found</Text>
	}
	return (
		<>
			<Text size="lg">ESMs</Text>
			{items.map((item) => (
				<Card
					shadow="sm"
					padding="md"
					mt="xs"
					radius="md"
					withBorder
					key={item.name}
				>
					<Text fw={500}>{item.name}</Text>
					<Text size="sm" c="dimmed">
						ESM: {item.path}
					</Text>
					{Object.entries(item.filesStatus).map(([key, value]) => (
						<Text key={key} size="xs" c={value.color}>
							{value.path} - {value.text}
						</Text>
					))}
				</Card>
			))}
		</>
	)
}

export default ESMs
