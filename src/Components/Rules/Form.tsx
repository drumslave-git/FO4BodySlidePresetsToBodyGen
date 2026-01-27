import { Input, Select, Tabs, Text } from "@mantine/core"
import { type ChangeEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router"
import type { MultiRule, SingleRule } from "../../db/schema"
import Form from "../common/Form"
import { useData } from "../DataProvider"

const singleRuleDefaultValues: SingleRule = {
	id: 0,
	name: "",
	formId: "",
	plugin: "",
}

const MultiRuleDefaultValues: MultiRule = {
	id: 0,
	name: "",
	gender: "Female",
	race: "",
}

const SingleRuleFormFields = ({
	item,
	onFieldChange,
}: {
	item: SingleRule
	onFieldChange: (key: string, value: any) => void
}) => {
	const { ESMs, NPCs } = useData()

	const [selectedFormID, setSelectedFormID] = useState<string | null>(null)

	const pluginFormIDs = useMemo(() => {
		if (!item.plugin) return []
		return NPCs.filter((npc) => item.plugin === npc.plugin).map((npc) => ({
			value: npc.formId,
			label: `${npc.editorID} - ${npc.name}`,
		}))
	}, [item.plugin, NPCs])

	const preview = useMemo(() => {
		return [
			item.plugin,
			item.formId,
			NPCs.find((npc) => npc.formId === item.formId)?.name,
		]
			.filter(Boolean)
			.join(" | ")
	}, [item, NPCs])

	useEffect(() => {
		if (!selectedFormID) return
		onFieldChange("formId", selectedFormID)
	}, [onFieldChange, selectedFormID])

	useEffect(() => {
		setSelectedFormID(
			pluginFormIDs.find((f) => f.value === item.formId)?.value || null,
		)
	}, [item.formId, pluginFormIDs])

	useEffect(() => {
		onFieldChange("name", preview)
	}, [preview, onFieldChange])

	return (
		<>
			<Select
				label="Plugin"
				placeholder="Plugin"
				data={ESMs.map((e) => e.name)}
				value={item.plugin ?? ""}
				onChange={(v) => onFieldChange("plugin", v ?? "")}
				required
				searchable
			/>
			<Input.Wrapper label="FormID" required>
				<Input
					value={item.formId ?? ""}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("formId", e.target.value)
					}
					placeholder="FormID"
					required
				/>
			</Input.Wrapper>
			{pluginFormIDs.length > 0 && (
				<Select
					data={pluginFormIDs}
					value={selectedFormID}
					onChange={setSelectedFormID}
					searchable
				/>
			)}
		</>
	)
}

const MultiRuleFormFields = ({
	item,
	onFieldChange,
}: {
	item: MultiRule
	onFieldChange: (key: string, value: any) => void
}) => {
	const { races } = useData()
	const [selectedRace, setSelectedRace] = useState<string | null>(null)

	const raceOptions = useMemo(() => {
		return races
			.map((r) => ({
				value: r.editorID,
				label: `${r.plugin} - ${r.editorID} - ${r.name}`,
			}))
			.reduce(
				(acc, option) => {
					if (!acc.find((o) => o.value === option.value)) {
						acc.push(option)
					}
					return acc
				},
				[] as { value: string; label: string }[],
			)
	}, [races])

	const preview = useMemo(() => {
		return ["All", item.gender, item.race].filter(Boolean).join(" | ")
	}, [item])

	useEffect(() => {
		if (!selectedRace) return
		onFieldChange("race", selectedRace)
	}, [onFieldChange, selectedRace])

	useEffect(() => {
		setSelectedRace(
			raceOptions.find((r) => r.value === item.race)?.value || null,
		)
	}, [item.race, raceOptions])

	useEffect(() => {
		onFieldChange("name", preview)
	}, [preview, onFieldChange])

	return (
		<>
			<Select
				label="Gender"
				placeholder="Gender"
				data={["Male", "Female"]}
				onChange={(v) => onFieldChange("gender", v ?? "")}
				value={item.gender ?? ""}
				required
			/>
			<Input.Wrapper label="Race" required>
				<Input
					value={item.race ?? ""}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("race", e.target.value)
					}
					placeholder="Rece"
					required
				/>
			</Input.Wrapper>
			<Select
				data={raceOptions}
				value={selectedRace}
				onChange={setSelectedRace}
				searchable
				label="Races from ESMs"
			/>
		</>
	)
}

const RulesForm = () => {
	const { id } = useParams()
	const [ruleType, setRuleType] = useState<"single" | "multi" | null>(null)

	useEffect(() => {
		if (!id) {
			setRuleType("single")
			return
		}
		// @ts-expect-error
		window.electronAPI.rulesDB("type", id).then((type) => {
			setRuleType(type ?? "single")
		})
	}, [id])

	if (ruleType === null) return <Text>Loading...</Text>

	return (
		<Tabs
			value={ruleType}
			onChange={(value) => setRuleType(value as "single" | "multi" | null)}
		>
			<Tabs.List mb="md">
				<Tabs.Tab value="single">Single NFC Rule</Tabs.Tab>
				<Tabs.Tab value="multi">Multi NPC Rule</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="single">
				<Form
					db="singleRulesDB"
					rootUri="rules"
					defaultValues={singleRuleDefaultValues}
					FieldsComponent={SingleRuleFormFields}
					readOnly
				/>
			</Tabs.Panel>
			<Tabs.Panel value="multi">
				<Form
					db="multiRulesDB"
					rootUri="rules"
					defaultValues={MultiRuleDefaultValues}
					FieldsComponent={MultiRuleFormFields}
					readOnly
				/>
			</Tabs.Panel>
		</Tabs>
	)
}

export default RulesForm
