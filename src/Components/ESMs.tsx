import { Badge, Card, Group, Text, Tooltip } from "@mantine/core"
import { useEffect, useState } from "react"
import type { ESM } from "../types"

const ESMs = ({ from, content }: { from?: string; content?: string }) => {
	const [items, setItems] = useState<ESM[]>([])

	useEffect(() => {
		if (!from) {
			setItems([])
			return
		}
		;(content
			? // @ts-expect-error
				window.electronAPI.validateESMs(from, content)
			: // @ts-expect-error
				window.electronAPI.resolveESMs(from)
		).then((data: ESM[]) => {
			setItems(data)
		})
	}, [from, content])

	if (!from) {
		return null
	}
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
							{item.source && <Badge color="pink">Source</Badge>}
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
