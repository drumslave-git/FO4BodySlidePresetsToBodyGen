import {
	Button,
	Chip,
	Code,
	Group,
	Paper,
	SimpleGrid,
	Text,
} from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"

import type { Template } from "../../db/schema"
import { BodyType } from "../../types"
import BodyView from "../3D/BodyView"
import SearchInput from "../common/SearchInput"

type Filters = {
	gender: 1 | 0 | -1
	q: string
}

const Filter = ({ onChange }: { onChange: (v: Filters) => void }) => {
	const [genderMale, setGenderMale] = useState(true)
	const [genderFemale, setGenderFemale] = useState(true)
	const [q, setQ] = useState("")

	useEffect(() => {
		const filters: Filters = {
			gender: -1,
			q,
		}
		if (genderMale && genderFemale) {
			filters.gender = -1
		} else if (genderMale) {
			filters.gender = 0
		} else if (genderFemale) {
			filters.gender = 1
		}
		onChange(filters)
	}, [q, genderMale, genderFemale, onChange])

	return (
		<Paper shadow="xs" p="md" mb="sm" withBorder>
			<Group justify="space-between">
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
				<SearchInput value={q} onChange={setQ} />
			</Group>
		</Paper>
	)
}

const List = () => {
	const navigate = useNavigate()

	const [templates, setTemplates] = useState<Template[]>([])
	const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI.templatesDB("read").then(setTemplates)
	}, [])

	useEffect(() => {
		setFilteredTemplates(templates)
	}, [templates])

	const onEditClick = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			navigate(`/templates/edit/${e.currentTarget.dataset.id}`)
		},
		[navigate],
	)

	const onDeleteClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
		const id = Number(e.currentTarget.dataset.id)
		if (!id) return
		// @ts-expect-error
		window.electronAPI.templatesDB("delete", id).then(() => {
			setTemplates((prev) => prev.filter((t) => t.id !== id))
		})
	}, [])

	const onFilterChange = useCallback(
		(filters: Filters) => {
			setFilteredTemplates(
				templates.filter((template) => {
					let genderMatch = true
					let qMatch = true
					if (filters.gender > -1) {
						genderMatch = template.gender === filters.gender
					}
					if (filters.q) {
						qMatch = template.name
							.toLowerCase()
							.includes(filters.q.toLowerCase())
					}

					return genderMatch && qMatch
				}),
			)
		},
		[templates],
	)

	return (
		<>
			{templates.length === 0 && (
				<Text>No templates found. Create one or import!</Text>
			)}
			{templates.length > 0 && <Filter onChange={onFilterChange} />}
			<SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 3 }}>
				{filteredTemplates.map((template) => (
					<Paper key={template.id} shadow="xs" p="md" mb="sm" withBorder>
						<Text lineClamp={2} title={template.name}>
							{template.name}
						</Text>
						<Group>
							<Button size="xs" data-id={template.id} onClick={onEditClick}>
								Edit
							</Button>
							<Button
								size="xs"
								color="red"
								data-id={template.id}
								onClick={onDeleteClick}
							>
								Delete
							</Button>
						</Group>
						<BodyView
							bodyType={
								template.gender === 0 ? BodyType.maleBody : BodyType.femaleBody
							}
							squire
							sliders={template.bodyGen}
						/>
						<Code block>{template.bodyGen}</Code>
					</Paper>
				))}
			</SimpleGrid>
		</>
	)
}

export default List
