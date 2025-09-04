import { Checkbox } from "@mantine/core"
import { useCallback, useMemo } from "react"

import type { BodySlidePreset } from "../../types"

export type PresetTogglerProps = {
	preset: BodySlidePreset
	selectedPresets: BodySlidePreset[]
	onTogglePreset: (preset: BodySlidePreset) => void
}

const PresetToggler = ({
	preset,
	selectedPresets,
	onTogglePreset,
}: PresetTogglerProps) => {
	const selected: boolean = useMemo(() => {
		return selectedPresets.some((p) => p.bodyGen === preset.bodyGen)
	}, [preset, selectedPresets])

	const onChange = useCallback(() => {
		onTogglePreset(preset)
	}, [preset, onTogglePreset])

	return <Checkbox checked={selected} onChange={onChange} />
}

export default PresetToggler
