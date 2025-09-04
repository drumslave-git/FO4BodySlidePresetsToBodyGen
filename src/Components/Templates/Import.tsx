import { Badge, Box, Container, Text } from "@mantine/core"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { BodySlidePreset, BodySlidePresetParsed } from "../../types"
import { ImportStatus } from "../../types"
import BodySlidePresetComponent, {
	type BodySlidePresetComponentProps,
} from "../BodySlidePresets/BodySlidePresetComponent"
import BodySlidePresets from "../BodySlidePresets/List"
import PresetToggler, {
	type PresetTogglerProps,
} from "../BodySlidePresets/PresetToggler"
import { useData } from "../DataProvider"
import { useOverlay } from "../OverlayProvider"

type BodySlidePresetWithImportStatus = BodySlidePreset & {
	importStatus?: ImportStatus
}

const ImportStatusBadge = ({ status }: { status: ImportStatus }) => {
	const color = useMemo(() => {
		switch (status) {
			case ImportStatus.imported:
				return "green"
			case ImportStatus.needsUpdate:
				return "yellow"
			case ImportStatus.notImported:
				return "blue"
			default:
				return "gray"
		}
	}, [status])

	return <Badge color={color}>{status}</Badge>
}

const TogglerComponent = ({ preset, ...rest }: PresetTogglerProps) => {
	return (
		<>
			{(preset as BodySlidePresetWithImportStatus).importStatus !==
				ImportStatus.imported && <PresetToggler preset={preset} {...rest} />}
			<ImportStatusBadge
				status={(preset as BodySlidePresetWithImportStatus).importStatus}
			/>
		</>
	)
}

const Import = () => {
	const navigate = useNavigate()
	const { bodySlidePresetsParsed } = useData()
	const { setIsLoading } = useOverlay()

	const [items, setItems] = useState<
		Array<BodySlidePresetParsed & { importStatus?: string }>
	>(bodySlidePresetsParsed)

	const updateItems = useCallback(() => {
		// @ts-expect-error
		window.electronAPI
			.templatesDB("importedStatus", bodySlidePresetsParsed)
			.then(setItems)
	}, [bodySlidePresetsParsed])

	useEffect(() => {
		updateItems()
	}, [updateItems])

	const onSubmit = useCallback(
		async (selected: BodySlidePreset[]) => {
			setIsLoading("Importing templates...")
			for (const preset of selected) {
				// @ts-expect-error
				await window.electronAPI.templatesDB("import", preset)
			}
			updateItems()
			setIsLoading(false)
		},
		[setIsLoading, updateItems],
	)

	return (
		<Container>
			<BodySlidePresets
				items={items}
				onSubmit={onSubmit}
				TogglerComponent={TogglerComponent}
			/>
		</Container>
	)
}

export default Import
