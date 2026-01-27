import { Chip, Group, Paper, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import type { MultiRule, SingleRule } from "../../db/schema"
import List, { type FilterComponentProps } from "../common/List"

const filterFn = (
	item: SingleRule | MultiRule,
	filtersValues: Record<string, any>,
) => {
	const types = (filtersValues.types as string[]) ?? []
	const single = item as SingleRule
	const multi = item as MultiRule
	if (single.plugin) return types.includes("single")
	if (multi.race) return types.includes("multi")
	return true
}

const FiltersComponent = ({ onChange }: FilterComponentProps) => {
	const [showSingle, setShowSingle] = useState(true)
	const [showMulti, setShowMulti] = useState(true)

	useEffect(() => {
		const types = []
		if (showSingle) types.push("single")
		if (showMulti) types.push("multi")
		onChange({ types: types })
	}, [showSingle, showMulti, onChange])

	return (
		<Paper shadow="xs" p="md" mb="sm" withBorder>
			<Group>
				<Chip
					checked={showSingle}
					onChange={() => {
						setShowSingle((v) => !v)
					}}
				>
					Single
				</Chip>
				<Chip
					checked={showMulti}
					onChange={() => {
						setShowMulti((v) => !v)
					}}
				>
					Multi
				</Chip>
			</Group>
		</Paper>
	)
}

const ComputedRuleComponent = (item: SingleRule | MultiRule) => {
	const single = item as SingleRule
	const multi = item as MultiRule
	return (
		<Text>
			{!single.plugin && `All | `}
			{single.plugin || multi.gender} | {single.formId || multi.race}
		</Text>
	)
}

const RulesList = () => {
	return (
		<List
			rootUri="rules"
			db="rulesDB"
			filterFn={filterFn}
			ItemComponent={ComputedRuleComponent}
			FiltersComponent={FiltersComponent}
		/>
	)
}

export default RulesList
