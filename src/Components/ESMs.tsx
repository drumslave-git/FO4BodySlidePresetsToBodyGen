import { Badge, Card, Group, Text, Tooltip } from "@mantine/core"
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
					<Group justify="space-between" mt="xs" mb="xs">
						<Text fw={500}>{item.name}</Text>
						<Group>
							<Tooltip label={item.filesStatus.morphs.text}>
								<Badge color={item.filesStatus.morphs.color}>morphs.ini</Badge>
							</Tooltip>
							<Tooltip label={item.filesStatus.templates.text}>
								<Badge color={item.filesStatus.templates.color}>
									templates.ini
								</Badge>
							</Tooltip>
						</Group>
					</Group>
					<Text size="sm" c="dimmed">
						{item.path}
					</Text>
				</Card>
			))}
		</>
	)
}

export default ESMs
