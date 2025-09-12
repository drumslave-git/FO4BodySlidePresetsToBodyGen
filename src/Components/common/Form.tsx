import { Button, Group, Input, Stack, Text } from "@mantine/core"
import {
	type ChangeEvent,
	type FunctionComponent,
	useCallback,
	useEffect,
	useState,
} from "react"
import { useNavigate, useParams } from "react-router"

import type { BaseItem } from "../../types"
import { useOverlay } from "../OverlayProvider"

const defaultItem: BaseItem = {
	id: 0,
	name: "",
}

const Form = ({
	db,
	rootUri,
	defaultValues,
	FieldsComponent,
}: {
	db: string
	rootUri: string
	defaultValues: Record<string, any>
	FieldsComponent: FunctionComponent
}) => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { setIsLoading, showNotification } = useOverlay()
	const [item, setItem] = useState<BaseItem>({
		...defaultItem,
		...defaultValues,
	})

	useEffect(() => {
		if (!id) {
			setItem({
				...defaultItem,
				...defaultValues,
			})
		} else {
			setIsLoading("Loading item...")
			// @ts-expect-error
			window.electronAPI[db]("read", id).then(setItem)
			setIsLoading(false)
		}
	}, [db, defaultValues, id, setIsLoading])

	const onFieldChange = useCallback((field: string, value: any) => {
		setItem((prev) => ({ ...prev, [field]: value }))
	}, [])

	const onDelete = useCallback(async () => {
		setIsLoading("Deleting item...")
		// @ts-expect-error
		await window.electronAPI[db]("delete", id)
		setIsLoading(false)
		navigate(`/${rootUri}/list`)
	}, [db, rootUri, setIsLoading, navigate, id])

	const onCancel = useCallback(() => {
		navigate(`/${rootUri}/list`)
	}, [rootUri, navigate])

	const onSave = useCallback(async () => {
		setIsLoading("Saving item...")
		// @ts-expect-error
		id && (await window.electronAPI[db]("update", id, item))
		// @ts-expect-error
		!id && (await window.electronAPI[db]("create", item))
		setIsLoading(false)
		showNotification({
			title: "Item saved",
			text: `Item "${item.name}" has been saved successfully.`,
			color: "green",
		})
	}, [db, id, setIsLoading, showNotification, item])

	if (!item) return <Text>Loading...</Text>

	return (
		<Stack
			style={{
				height: "calc(100dvh - var(--app-shell-padding) * 2)",
				overflow: "hidden",
			}}
		>
			<Group>
				<Text>{id ? `Edit: ${item.name}` : "Create New"}</Text>
				<Button onClick={onSave}>Save</Button>
				{id && (
					<Button color="red" data-id={item.id} onClick={onDelete}>
						Delete
					</Button>
				)}
				<Button onClick={onCancel} color="secondary">
					Cancel
				</Button>
			</Group>
			<Input.Wrapper label="Name" required>
				<Input
					autoFocus
					value={item.name}
					placeholder="Name"
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("name", e.target.value)
					}
					required
				/>
			</Input.Wrapper>
			<FieldsComponent item={item} onFieldChange={onFieldChange} />
		</Stack>
	)
}

export default Form
