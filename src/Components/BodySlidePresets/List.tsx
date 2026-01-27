import {
	Box,
	Button,
	Divider,
	Group,
	MultiSelect,
	SimpleGrid,
} from "@mantine/core"
import { type JSX, useCallback, useEffect, useState } from "react"

import type { BodySlidePreset, BodySlidePresetParsed } from "../../types"
import SearchInput from "../common/SearchInput"
import { useData } from "../DataProvider"
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
	const [selected, setSelected] = useState<string[]>([])
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

const filterItems = (items: BodySlidePresetParsed[], value: FilterValue) => {
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

	return filtered
}

const List = ({
	items: itemsProp,
	onSubmit,
	onCancel,
	selectedPresets,
	ItemsComponent = BodySlidePresetParsedComponent,
	ItemComponent = BodySlidePresetComponent,
	TogglerComponent = PresetToggler,
}: {
	items?: BodySlidePresetParsed[]
	onSubmit?: (selected: BodySlidePreset[]) => void
	onCancel?: () => void
	selectedPresets?: BodySlidePreset[]
	ItemsComponent?: (props: BodySlidePresetParsedComponentProps) => JSX.Element
	ItemComponent?: (props: BodySlidePresetComponentProps) => JSX.Element
	TogglerComponent?: (props: PresetTogglerProps) => JSX.Element
}) => {
	const { bodySlidePresetsParsed: itemsFromData } = useData()
	const items = itemsProp ?? itemsFromData
	const [selectedItems, setSelectedItems] = useState<BodySlidePreset[]>([])
	const [filteredItems, setFilteredItems] =
		useState<BodySlidePresetParsed[]>(items)
	const [filterValue, setFilterValue] = useState<FilterValue>({
		q: "",
		selected: [],
	})

	useEffect(() => {
		if (!items.length) {
			setSelectedItems((prev) => (prev.length ? [] : prev))
			setFilteredItems((prev) => (prev.length ? [] : prev))
			return
		}
		setFilteredItems(filterItems(items, filterValue))
	}, [items, filterValue])

	useEffect(() => {
		if (!selectedPresets) {
			setSelectedItems((prev) => (prev.length ? [] : prev))
			return
		}
		setSelectedItems(selectedPresets)
	}, [selectedPresets])

	const onFilter = useCallback((value: FilterValue) => {
		setFilterValue(value)
	}, [])

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
		if (!onSubmit) return
		onSubmit(selectedItems)
	}, [selectedItems, onSubmit])

	return (
		<>
			<Filter items={items} onFilter={onFilter} />
			{onSubmit && (
				<Group>
					<Button onClick={selectAll} size="compact-xs">
						Select All
					</Button>
					<Button onClick={selectNone} size="compact-xs">
						Select None
					</Button>
				</Group>
			)}
			<SimpleGrid cols={{ base: 1, lg: 2 }}>
				{filteredItems.map((item) => (
					<ItemsComponent
						key={item.filename}
						item={item}
						selectedItems={selectedItems}
						onTogglePreset={onSubmit ? onTogglePreset : undefined}
						ItemComponent={ItemComponent}
						TogglerComponent={TogglerComponent}
					/>
				))}
			</SimpleGrid>
			{onSubmit && (
				<Box
					pos="sticky"
					bottom={0}
					bg="var(--mantine-color-body)"
					py="md"
					style={{ zIndex: 2 }}
				>
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
			)}
		</>
	)
}

export default List
