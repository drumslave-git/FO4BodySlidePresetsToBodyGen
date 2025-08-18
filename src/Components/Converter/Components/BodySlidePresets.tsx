import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	CloseButton,
	Code,
	Divider,
	Group,
	Input,
	MultiSelect,
	Switch,
	Text,
} from "@mantine/core"
import { IconMinus, IconPlus, IconSearch } from "@tabler/icons-react"
import {
	type ChangeEvent,
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react"

import type { BodySlidePreset, BodySlidePresetParsed } from "../../../types"
import Collapsable from "../../Collapsable"

export type FilterValue = {
	q: string
	selected: string[]
}

const Filter = ({
	options,
	onFilter,
}: {
	options: string[]
	onFilter: (value: FilterValue) => void
}) => {
	const [selected, setSelected] = useState([])
	const [q, setQ] = useState("")

	useEffect(() => {
		onFilter({ q, selected })
	}, [onFilter, selected, q])

	const onToggle = useCallback((value: string[]) => {
		setSelected(value)
	}, [])

	return (
		<Group grow>
			<MultiSelect
				data={options}
				value={selected}
				onChange={onToggle}
				searchable
				clearable
			/>
			<Input
				value={q}
				onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
				leftSection={<IconSearch size={16} />}
				rightSectionPointerEvents="all"
				rightSection={
					<CloseButton
						aria-label="Clear input"
						onClick={() => setQ("")}
						style={{ display: q ? undefined : "none" }}
					/>
				}
			/>
		</Group>
	)
}

const PresetToggler = ({
	preset,
	selectedPresets,
	onTogglePreset,
}: {
	preset: BodySlidePreset
	selectedPresets: BodySlidePreset[]
	onTogglePreset: (preset: BodySlidePreset) => void
}) => {
	const selected: boolean = useMemo(() => {
		return selectedPresets.some((p) => p.bodyGen === preset.bodyGen)
	}, [preset, selectedPresets])

	const onChange = useCallback(() => {
		onTogglePreset(preset)
	}, [preset, onTogglePreset])

	return <Switch checked={selected} onChange={onChange} />
}

const BodySlidePresets = ({
	items,
	onSubmit,
	onCancel,
}: {
	items: BodySlidePresetParsed[]
	onSubmit: (selected: BodySlidePreset[]) => void
	onCancel: () => void
}) => {
	const [filterOptions, setFilterOptions] = useState<string[]>([])
	const [selectedItems, setSelectedItems] = useState<BodySlidePreset[]>([])
	const [filteredItems, setFilteredItems] =
		useState<BodySlidePresetParsed[]>(items)

	useEffect(() => {
		if (!items.length) {
			setFilterOptions([])
			setSelectedItems([])
			setFilteredItems([])
			return
		}
		setFilteredItems(items)
		setFilterOptions(
			items
				.reduce((acc: string[], item) => {
					if (typeof item.data === "string") {
						return acc
					}
					for (const preset of item.data) {
						for (const group of preset.groups) {
							if (!acc.includes(group.name)) {
								acc.push(group.name)
							}
						}
					}

					return acc
				}, [])
				.sort((a, b) => a.localeCompare(b)),
		)
	}, [items])

	const onFilter = useCallback(
		(value: FilterValue) => {
			const { q, selected } = value
			const filtered = items
				.map((preset) => {
					if (typeof preset.data === "string") {
						return preset
					}
					return {
						...preset,
						data: preset.data.filter((item) => {
							const matchQuery =
								!q || item.name.toLowerCase().includes(q.toLowerCase())
							const matchGroup =
								selected.length === 0 ||
								item.groups.some((group) => selected.includes(group.name))
							return matchQuery && matchGroup
						}),
					}
				})
				.filter((preset) => Array.isArray(preset.data) && preset.data.length)
			setFilteredItems(filtered)
		},
		[items],
	)

	const onTogglePreset = useCallback((preset: BodySlidePreset) => {
		setSelectedItems((prev) => {
			const exists = prev.find((p) => p.bodyGen === preset.bodyGen)
			if (exists) {
				return prev.filter((p) => p.bodyGen !== preset.bodyGen)
			}
			return [...prev, preset]
		})
	}, [])

	const onSubmitSelected = useCallback(() => {
		onSubmit(selectedItems)
	}, [selectedItems, onSubmit])

	return (
		<>
			<Text size="lg">BodySlide Presets</Text>
			<Filter options={filterOptions} onFilter={onFilter} />
			{filteredItems.map((item) => (
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
								<Group>
									<PresetToggler
										preset={preset}
										selectedPresets={selectedItems}
										onTogglePreset={onTogglePreset}
									/>
									<Text>{preset.name}</Text>
									{preset.groups.map((group) => (
										<Badge key={group.name} size="sm">
											{group.name}
										</Badge>
									))}
								</Group>
								<Collapsable title="BodyGen" titleProps={{ mt: "md" }}>
									<Code block>{preset.bodyGen}</Code>
								</Collapsable>
							</Card>
						))}
				</Fragment>
			))}
			<Box pos="sticky" bottom={0} bg="var(--mantine-color-body)" py="md">
				<Divider mb="md" />
				<Group>
					<Button onClick={onSubmitSelected}>OK</Button>
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				</Group>
			</Box>
		</>
	)
}

export default BodySlidePresets
