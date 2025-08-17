import {
	ActionIcon,
	Badge,
	Button,
	Card,
	CloseButton,
	Code,
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

import type { BodySlidePreset, BodySlidePresetParsed } from "../types"

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
	selectedPresets,
	filterOptions,
	onFilter,
	onTogglePreset,
}: {
	items: BodySlidePresetParsed[]
	selectedPresets: BodySlidePreset[]
	filterOptions: string[]
	onFilter: (value: FilterValue) => void
	onTogglePreset: (preset: BodySlidePreset) => void
}) => {
	return (
		<>
			<Text size="lg">BodySlide Presets</Text>
			<Filter options={filterOptions} onFilter={onFilter} />
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
								<Group>
									<PresetToggler
										preset={preset}
										selectedPresets={selectedPresets}
										onTogglePreset={onTogglePreset}
									/>
									<Text>{preset.name}</Text>
								</Group>
								<Group mt="md">
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
