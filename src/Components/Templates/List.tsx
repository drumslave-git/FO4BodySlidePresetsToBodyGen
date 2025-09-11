import { Chip, Code, Group, Paper } from "@mantine/core"
import { useEffect, useState } from "react"

import type { Template } from "../../db/schema"
import { BodyType } from "../../types"
import BodyView from "../3D/BodyView"
import List, { type FilterComponentProps } from "../common/List"

const FiltersComponent = ({ onChange }: FilterComponentProps) => {
	const [genderMale, setGenderMale] = useState(true)
	const [genderFemale, setGenderFemale] = useState(true)

	useEffect(() => {
		let gender = -1
		if (genderMale && genderFemale) {
			gender = -1
		} else if (genderMale) {
			gender = 0
		} else if (genderFemale) {
			gender = 1
		}
		onChange({ gender })
	}, [genderMale, genderFemale, onChange])

	return (
		<Paper shadow="xs" p="md" mb="sm" withBorder>
			<Group>
				<Chip checked={genderMale} onChange={() => setGenderMale((v) => !v)}>
					Male
				</Chip>
				<Chip
					checked={genderFemale}
					onChange={() => setGenderFemale((v) => !v)}
				>
					Female
				</Chip>
			</Group>
		</Paper>
	)
}

const filterTemplate = (template: Template, filters: { gender: number }) => {
	let genderMatch = true
	if (filters.gender > -1) {
		genderMatch = template.gender === filters.gender
	}

	return genderMatch
}

const TemplateComponent = (template: Template) => {
	return (
		<>
			<BodyView
				bodyType={
					template.gender === 0 ? BodyType.maleBody : BodyType.femaleBody
				}
				squire
				sliders={template.bodyGen}
			/>
			<Code block>{template.bodyGen}</Code>
		</>
	)
}

const TemplatesList = () => {
	return (
		<List
			ItemComponent={TemplateComponent}
			rootUri="templates"
			db="templatesDB"
			FiltersComponent={FiltersComponent}
			filterFn={filterTemplate}
		/>
	)
}

export default TemplatesList
