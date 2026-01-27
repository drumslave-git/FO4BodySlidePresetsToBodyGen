import { Card, Group, ScrollArea, Stack, Text } from "@mantine/core"
import { useMemo } from "react"
import { useData } from "./DataProvider"

const Sliders = () => {
	const { sliders } = useData()

	const items = useMemo(() => {
		const groupBySource = (list: typeof sliders[0]) => {
			const grouped = new Map<string, typeof sliders[0]>()
			for (const slider of list ?? []) {
				const key = slider.sourcePath ?? "unknown"
				const existing = grouped.get(key) ?? []
				existing.push(slider)
				grouped.set(key, existing)
			}
			return [...grouped.entries()]
		}
		return [
			{ label: "Male (0)", groups: groupBySource(sliders[0]) },
			{ label: "Female (1)", groups: groupBySource(sliders[1]) },
		]
	}, [sliders])

	const total = (sliders[0]?.length ?? 0) + (sliders[1]?.length ?? 0)
	if (!total) {
		return <Text size="lg">No sliders found</Text>
	}

	return (
		<>
			<Text size="lg">Sliders</Text>
			<Stack gap="sm" mt="xs">
				{items.map((group) => (
					<Card key={group.label} shadow="sm" padding="md" radius="md" withBorder>
						<Group justify="space-between">
							<Text fw={500}>{group.label}</Text>
							<Text size="sm" c="dimmed">
								{group.groups.reduce((acc, [, list]) => acc + list.length, 0)}{" "}
								sliders
							</Text>
						</Group>
						{group.groups.length > 0 && (
							<ScrollArea h={160} mt="xs">
								<Stack gap={4}>
									{group.groups.map(([sourcePath, list]) => (
										<Stack key={sourcePath} gap={2}>
											<Text size="xs" c="dimmed">
												{sourcePath}
											</Text>
											{list.map((slider) => (
												<Text
													key={`${sourcePath}-${slider.morph}-${slider.name}`}
													size="xs"
												>
													{slider.name} ({slider.morph})
												</Text>
											))}
										</Stack>
									))}
								</Stack>
							</ScrollArea>
						)}
					</Card>
				))}
			</Stack>
		</>
	)
}

export default Sliders
