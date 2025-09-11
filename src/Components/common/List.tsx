import { Button, Card, Group, Paper, SimpleGrid, Text } from "@mantine/core"
import {
	type FunctionComponent,
	type MouseEvent,
	useCallback,
	useEffect,
	useState,
} from "react"
import { useNavigate } from "react-router"
import type { BaseItem } from "../../types"
import { useOverlay } from "../OverlayProvider"
import SearchInput from "./SearchInput"

export type FilterComponentProps = {
	onChange: (values: Record<string, any>) => void
}

const Filters = ({
	items,
	onFilter,
	filterFn,
	FiltersComponent,
}: {
	items: BaseItem[]
	onFilter: (items: BaseItem[]) => void
	filterFn: (item: BaseItem, filtersValues: Record<string, any>) => boolean
	FiltersComponent: FunctionComponent<FilterComponentProps>
}) => {
	const [q, setQ] = useState("")
	const [filteredItems, setFilteredItems] = useState(items)
	const [filtersValues, setFiltersValues] = useState<Record<string, any>>({})

	useEffect(() => {
		setFilteredItems(
			items
				.filter((item) => filterFn(item, filtersValues))
				.filter((item) => item.name.toLowerCase().includes(q.toLowerCase())),
		)
	}, [items, q, filterFn, filtersValues])

	useEffect(() => {
		onFilter(filteredItems)
	}, [filteredItems, onFilter])

	const onChange = useCallback((values: Record<string, any>) => {
		setFiltersValues(values)
	}, [])

	return (
		<>
			<Paper shadow="xs" p="md" mb="sm" withBorder>
				<SearchInput value={q} onChange={setQ} />
			</Paper>
			<FiltersComponent onChange={onChange} />
		</>
	)
}

const List = ({
	rootUri,
	db,
	filterFn,
	ItemComponent,
	FiltersComponent,
}: {
	rootUri: string
	db: string
	filterFn: (item: BaseItem, filtersValues: Record<string, any>) => boolean
	ItemComponent: FunctionComponent<BaseItem>
	FiltersComponent: FunctionComponent
}) => {
	const navigate = useNavigate()
	const { setIsLoading } = useOverlay()

	const [items, setItems] = useState<BaseItem[]>([])
	const [filteredItems, setFilteredItems] = useState<BaseItem[]>([])

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI[db]("read").then(setItems)
	}, [db])

	const onEditClick = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			navigate(`/${rootUri}/edit/${e.currentTarget.dataset.id}`)
		},
		[navigate, rootUri],
	)

	const onDeleteClick = useCallback(
		async (e: MouseEvent<HTMLButtonElement>) => {
			setIsLoading("Deleting template...")
			const id = Number(e.currentTarget.dataset.id)
			// @ts-expect-error
			await window.electronAPI[db]("delete", id)
			setItems((prev) => prev.filter((item) => item.id !== id))
			setIsLoading(false)
		},
		[setIsLoading, db],
	)

	const onDuplicateClick = useCallback(
		async (e: MouseEvent<HTMLButtonElement>) => {
			setIsLoading("Duplicating template...")
			const id = Number(e.currentTarget.dataset.id)
			// @ts-expect-error
			const { lastInsertRowid } = await window.electronAPI[db]("duplicate", id)
			setIsLoading(false)
			navigate(`/${rootUri}/edit/${lastInsertRowid}`)
		},
		[setIsLoading, navigate, rootUri, db],
	)

	const onFilter = useCallback((filteredItems: BaseItem[]) => {
		setFilteredItems(filteredItems)
	}, [])

	return (
		<>
			<Filters
				items={items}
				onFilter={onFilter}
				filterFn={filterFn}
				FiltersComponent={FiltersComponent}
			/>
			{!items.length && <Text>No items found.</Text>}
			<SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 3 }}>
				{filteredItems.map((item) => (
					<Card key={item.id} withBorder>
						<Text lineClamp={2} title={item.name}>
							{item.name}
						</Text>
						<Card.Section withBorder inheritPadding mt="sm">
							<ItemComponent {...item} />
						</Card.Section>
						<Card.Section mt="sm" withBorder inheritPadding pb="sm">
							<Group gap="sm">
								<Button
									size="xs"
									data-id={item.id}
									onClick={onEditClick}
									flex={1}
								>
									Edit
								</Button>
								<Button
									size="xs"
									data-id={item.id}
									onClick={onDuplicateClick}
									flex={1}
								>
									Duplicate
								</Button>
								<Button
									size="xs"
									color="red"
									data-id={item.id}
									onClick={onDeleteClick}
									flex={1}
								>
									Delete
								</Button>
							</Group>
						</Card.Section>
					</Card>
				))}
			</SimpleGrid>
		</>
	)
}

export default List
