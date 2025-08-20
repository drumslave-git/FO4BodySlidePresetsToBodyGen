import {
	Box,
	Button,
	Card,
	Checkbox,
	CloseButton,
	Code,
	Divider,
	Group,
	Input,
	List,
	MultiSelect,
	SegmentedControl,
	Select,
	Text,
} from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"
import {
	type ChangeEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react"

import type { BodySlidePreset, BodySlidePresetParsed } from "../../../types"
import Collapsable from "../../Collapsable"
import { useData } from "../../DataProvider"

export type FilterValue = {
	q: string
	selected: string[]
}

const Filter = ({
	items,
	onFilter,
}: {
	items: BodySlidePresetParsed[]
	onFilter: (value: FilterValue) => void
}) => {
	const [selected, setSelected] = useState([])
	const [options, setOptions] = useState<string[]>([])
	const [q, setQ] = useState("")

	useEffect(() => {
		onFilter({ q, selected })
	}, [onFilter, selected, q])

	useEffect(() => {
		setOptions(
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

	const onToggle = useCallback((value: string[]) => {
		setSelected(value)
	}, [])

	return (
		<Group grow mb="md">
			<MultiSelect
				data={options}
				value={selected}
				onChange={onToggle}
				searchable
				clearable
				placeholder="Groups"
			/>
			<Input
				data-autofocus
				value={q}
				onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
				leftSection={<IconSearch size={16} />}
				rightSectionPointerEvents="all"
				placeholder="Search"
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

	return <Checkbox checked={selected} onChange={onChange} />
}

const BodySlidePresetComponent = ({
	preset,
	selectedItems,
	onTogglePreset,
}: {
	preset: BodySlidePreset
	selectedItems: BodySlidePreset[]
	onTogglePreset: (item: BodySlidePreset) => void
}) => {
	const groups = useMemo(() => {
		return preset.groups
			.map((group) => group.name)
			.sort()
			.join(", ")
	}, [preset])

	return (
		<Card>
			<Group justify="space-between">
				<Group>
					<PresetToggler
						preset={preset}
						selectedPresets={selectedItems}
						onTogglePreset={onTogglePreset}
					/>
					<Text size="sm">{preset.name}</Text>
				</Group>
				<Text size="xs" c="dimmed">
					{groups}
				</Text>
			</Group>
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
		</Card>
	)
}

const BodySlidePresetParsedComponent = ({
	item,
	selectedItems,
	onTogglePreset,
}: {
	item: BodySlidePresetParsed
	selectedItems: BodySlidePreset[]
	onTogglePreset: (item: BodySlidePreset) => void
}) => {
	return (
		<Box mt="md">
			<Text size="xs">{item.filename}</Text>
			{typeof item.data === "string" && (
				<Text size="sm" c="dimmed" key={item.filename}>
					{item.data}
				</Text>
			)}
			{typeof item.data !== "string" &&
				item.data.map((preset) => (
					<BodySlidePresetComponent
						key={preset.name}
						preset={preset}
						selectedItems={selectedItems}
						onTogglePreset={onTogglePreset}
					/>
				))}
		</Box>
	)
}

const BodySlidePresets = ({
	onSubmit,
	onCancel,
	selectedPresets,
}: {
	onSubmit: (selected: BodySlidePreset[]) => void
	onCancel: () => void
	selectedPresets?: BodySlidePreset[]
}) => {
	const { bodySlidePresetsParsed: items } = useData()
	const [selectedItems, setSelectedItems] = useState<BodySlidePreset[]>([])
	const [filteredItems, setFilteredItems] =
		useState<BodySlidePresetParsed[]>(items)

	useEffect(() => {
		if (!items.length) {
			setSelectedItems((prev) => (prev.length ? [] : prev))
			setFilteredItems((prev) => (prev.length ? [] : prev))
			return
		}
		setFilteredItems(items)
	}, [items])

	useEffect(() => {
		if (!selectedPresets) {
			setSelectedItems((prev) => (prev.length ? [] : prev))
			return
		}
		setSelectedItems(selectedPresets)
	}, [selectedPresets])

	const onFilter = useCallback(
		(value: FilterValue) => {
			const { q, selected } = value
			const filtered = items
				.map((preset) => {
					if (typeof preset.data === "string") {
						return preset
					}
					const matchFilenameQuery =
						!q || preset.filename.toLowerCase().includes(q.toLowerCase())
					if (!matchFilenameQuery) {
						return { ...preset, data: [] }
					}
					return {
						...preset,
						data: preset.data.filter((item) => {
							const matchItemNameQuery =
								!q || item.name.toLowerCase().includes(q.toLowerCase())
							if (!matchItemNameQuery) {
								return false
							}
							return (
								selected.length === 0 ||
								item.groups.some((group) => selected.includes(group.name))
							)
						}),
					}
				})
				.filter((preset) => Array.isArray(preset.data) && preset.data.length)
			setFilteredItems(filtered)
		},
		[items],
	)

	const selectAll = useCallback(() => {
		setSelectedItems(
			filteredItems.reduce((acc: BodySlidePreset[], filteredItem) => {
				if (typeof filteredItem.data === "string") return acc
				acc.push(...filteredItem.data)
				return acc
			}, []),
		)
	}, [filteredItems])

	const selectNone = useCallback(() => {
		setSelectedItems([])
	}, [])

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
			<Filter items={items} onFilter={onFilter} />
			<Group>
				<Button onClick={selectAll} size="compact-xs">
					Select All
				</Button>
				<Button onClick={selectNone} size="compact-xs">
					Select None
				</Button>
			</Group>
			{filteredItems.map((item) => (
				<BodySlidePresetParsedComponent
					key={item.filename}
					item={item}
					selectedItems={selectedItems}
					onTogglePreset={onTogglePreset}
				/>
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
