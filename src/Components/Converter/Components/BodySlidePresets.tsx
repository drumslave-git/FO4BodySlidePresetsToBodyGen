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
	validatedOnly: boolean
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
	const [validatedOnly, setValidatedOnly] = useState(false)
	const [segmentedControlValue, setSegmentedControlValue] = useState("all")

	useEffect(() => {
		setValidatedOnly(segmentedControlValue === "valid")
	}, [segmentedControlValue])

	useEffect(() => {
		onFilter({ q, selected, validatedOnly })
	}, [onFilter, selected, q, validatedOnly])

	const onToggle = useCallback((value: string[]) => {
		setSelected(value)
	}, [])

	return (
		<>
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
			<SegmentedControl
				value={segmentedControlValue}
				onChange={setSegmentedControlValue}
				data={[
					{ label: "All", value: "all" },
					{ label: "Valid", value: "valid" },
				]}
			/>
		</>
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

	return (
		<Checkbox
			checked={selected}
			onChange={onChange}
			disabled={!!preset.errors.length}
		/>
	)
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
			const { q, selected, validatedOnly } = value
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
							if (validatedOnly && !item.valid) {
								return false
							}
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
					<Text size="xs">{item.filename}</Text>
					{typeof item.data === "string" && (
						<Text size="sm" c="dimmed" key={item.filename}>
							{item.data}
						</Text>
					)}
					{typeof item.data !== "string" &&
						item.data.map((preset) => (
							<Card key={preset.name}>
								<Group justify="space-between">
									<Group>
										<PresetToggler
											preset={preset}
											selectedPresets={selectedItems}
											onTogglePreset={onTogglePreset}
										/>
										<Text size="sm">{preset.name}</Text>
									</Group>
									<Select
										data={preset.groups.map((group) => group.name)}
										placeholder="Groups"
										size="sm"
									/>
								</Group>
								<Group>
									<Collapsable
										title={`BodyGen${!preset.valid ? ` with errors` : ""}`}
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
								</Group>
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
