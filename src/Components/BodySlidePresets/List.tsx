import {
	Box,
	Button,
	CloseButton,
	Divider,
	Group,
	Input,
	MultiSelect,
	Stack,
} from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"
import {
	type ChangeEvent,
	Component,
	type JSX,
	ReactNode,
	useCallback,
	useEffect,
	useState,
} from "react"

import type { BodySlidePreset, BodySlidePresetParsed } from "../../types"
import ViewHost from "../3D/ViewHost"
import SearchInput from "../common/SearchInput"
import BodySlidePresetComponent, {
	type BodySlidePresetComponentProps,
} from "./BodySlidePresetComponent"
import BodySlidePresetParsedComponent, {
	type BodySlidePresetParsedComponentProps,
} from "./BodySlidePresetParsedComponent"
import PresetToggler, { type PresetTogglerProps } from "./PresetToggler"

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
			<SearchInput value={q} onChange={setQ} />
		</Group>
	)
}

const List = ({
	items,
	onSubmit,
	onCancel,
	selectedPresets,
	ItemsComponent = BodySlidePresetParsedComponent,
	ItemComponent = BodySlidePresetComponent,
	TogglerComponent = PresetToggler,
}: {
	items: BodySlidePresetParsed[]
	onSubmit: (selected: BodySlidePreset[]) => void
	onCancel?: () => void
	selectedPresets?: BodySlidePreset[]
	ItemsComponent?: (props: BodySlidePresetParsedComponentProps) => JSX.Element
	ItemComponent?: (props: BodySlidePresetComponentProps) => JSX.Element
	TogglerComponent?: (props: PresetTogglerProps) => JSX.Element
}) => {
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
			<Stack>
				{filteredItems.map((item) => (
					<ItemsComponent
						key={item.filename}
						item={item}
						selectedItems={selectedItems}
						onTogglePreset={onTogglePreset}
						ItemComponent={ItemComponent}
						TogglerComponent={TogglerComponent}
					/>
				))}
			</Stack>
			<Box pos="sticky" bottom={0} bg="var(--mantine-color-body)" py="md">
				<Divider mb="md" />
				<Group>
					<Button onClick={onSubmitSelected}>OK</Button>
					{onCancel && (
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					)}
				</Group>
			</Box>
		</>
	)
}

export default List
