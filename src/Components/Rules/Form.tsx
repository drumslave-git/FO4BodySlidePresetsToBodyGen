import { Input, Tabs } from "@mantine/core"
import { type ChangeEvent, Fragment, useState } from "react"
import type { MultiRule, SingleRule } from "../../db/schema"
import Form from "../common/Form"

const singleRuleDefaultValues: SingleRule = {
	id: 0,
	name: "",
	formId: "",
	plugin: "",
}

const MultiRuleDefaultValues: MultiRule = {
	id: 0,
	name: "",
	gender: "",
	race: "",
}

const SingleRuleFormFields = ({
	item,
	onFieldChange,
}: {
	item: SingleRule
	onFieldChange: (key: string, value: any) => void
}) => {
	return (
		<>
			<Input.Wrapper label="Plugin" required>
				<Input
					value={item.plugin}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("plugin", e.target.value)
					}
					placeholder="Plugin"
					required
				/>
			</Input.Wrapper>
			<Input.Wrapper label="FormID" required>
				<Input
					value={item.formId}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("formId", e.target.value)
					}
					placeholder="FormID"
					required
				/>
			</Input.Wrapper>
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
	return (
		<>
			<Input.Wrapper label="Gender" required>
				<Input
					value={item.gender}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("gender", e.target.value)
					}
					placeholder="Gender"
					required
				/>
			</Input.Wrapper>
			<Input.Wrapper label="Race" required>
				<Input
					value={item.race}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("race", e.target.value)
					}
					placeholder="Rece"
					required
				/>
			</Input.Wrapper>
		</>
	)
}

const RulesForm = () => {
	const [ruleType, setRuleType] = useState("single")

	return (
		<Tabs value={ruleType} onChange={setRuleType}>
			<Tabs.List mb="md">
				<Tabs.Tab value="single">Single Rule</Tabs.Tab>
				<Tabs.Tab value="multi">Composite Rule</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="single">
				<Form
					db="singleRulesDB"
					rootUri="rules"
					defaultValues={singleRuleDefaultValues}
					FieldsComponent={SingleRuleFormFields}
				/>
			</Tabs.Panel>
			<Tabs.Panel value="multi">
				<Form
					db="multiRulesDB"
					rootUri="rules"
					defaultValues={MultiRuleDefaultValues}
					FieldsComponent={MultiRuleFormFields}
				/>
			</Tabs.Panel>
		</Tabs>
	)
}

export default RulesForm
