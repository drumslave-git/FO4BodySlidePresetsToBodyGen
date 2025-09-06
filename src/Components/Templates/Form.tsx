import {
	ActionIcon,
	Box,
	Group,
	Input,
	Slider as InputSlider,
	Paper,
	Stack,
	Switch,
	Tabs,
	Text,
	Textarea,
} from "@mantine/core"
import { IconRestore } from "@tabler/icons-react"
import {
	type ChangeEvent,
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react"
import { useParams } from "react-router"

import type { Template } from "../../db/schema"
import { BodyType, type MorphSlider, Slider } from "../../types"
import BodyMesh from "../3D/BodyMesh"
import ThreeView from "../3D/ThreeView"
import ViewHost from "../3D/ViewHost"
import { useData } from "../DataProvider"

const defaultTemplate: Template = {
	id: 0,
	name: "",
	bodyGen: "",
	gender: 0,
	sourceXMLContentHash: "",
}

const Sliders = ({
	bodyGen,
	gender,
	onChange,
}: {
	bodyGen: string
	gender: 0 | 1
	onChange: (v: string) => void
}) => {
	const { sliders: allSliders } = useData()
	// const {} = useData()
	const sliders: MorphSlider[] = useMemo(() => {
		return bodyGen.split(",").map((slider) => {
			const [name, value] = slider.split("@").map((s) => s.trim())
			return { name, value: Number(value) }
		})
	}, [bodyGen])
	const onValueChange = useCallback(
		(name: string, value: number) => {
			const updatedSliders = [
				...sliders.filter((s) => s.name !== name),
				{ name, value },
			]
				.map((slider) => `${slider.name}@${slider.value}`)
				.join(",")
			onChange(updatedSliders)
		},
		[onChange, sliders],
	)
	return (
		<>
			{allSliders[gender].map((slider) => {
				const value = sliders.find((s) => s.name === slider.morph)?.value ?? 0

				return (
					<Fragment key={slider.name}>
						<Text size="xs">{slider.morph}</Text>
						<Group>
							<InputSlider
								value={value}
								onChange={(v: number) => onValueChange(slider.morph, v)}
								min={slider.minimum}
								max={slider.maximum}
								step={slider.interval}
								flex={1}
							/>
							<ActionIcon
								onClick={() => onValueChange(slider.morph, 0)}
								title="Reset to 0"
							>
								<IconRestore />
							</ActionIcon>
						</Group>
					</Fragment>
				)
			})}
		</>
	)
}

let previewTimeout: ReturnType<typeof setTimeout> = null
const Form = () => {
	const { id } = useParams()
	const [template, setTemplate] = useState<Template>(defaultTemplate)
	const [bodyGenTab, setBodyGenTab] = useState("sliders")
	const [previewBodyGen, setPreviewBodyGen] = useState<string>(template.bodyGen)

	useEffect(() => {
		if (!id) return
		// @ts-expect-error
		window.electronAPI.templatesDB("read", id).then(setTemplate)
	}, [id])

	useEffect(() => {
		if (previewTimeout) clearTimeout(previewTimeout)
		previewTimeout = setTimeout(() => {
			setPreviewBodyGen(template.bodyGen)
		}, 300)
	}, [template.bodyGen])

	const onFieldChange = useCallback(
		(field: keyof Template, value: string | number) => {
			setTemplate((prev) => ({ ...prev, [field]: value }))
		},
		[],
	)

	return (
		<>
			<Stack
				style={{
					height: "calc(100dvh - var(--app-shell-padding) * 2)",
					overflow: "hidden",
				}}
			>
				<Text>
					{id ? `Edit Template ID: ${template.name}` : "Create New Template"}
				</Text>
				<Input
					autoFocus
					value={template.name}
					placeholder="Template Name"
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						onFieldChange("name", e.target.value)
					}
				/>
				<Group>
					<Text>Gender</Text>
					<Text>Male</Text>
					<Switch
						checked={template.gender === 1}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							onFieldChange("gender", event.currentTarget.checked ? 1 : 0)
						}
					/>
					<Text>Female</Text>
				</Group>
				<Group align="center" style={{ overflow: "hidden" }} flex={1}>
					<Paper flex={1} h="100%" style={{ overflow: "hidden" }} withBorder>
						<ThreeView enableZoom>
							<BodyMesh
								bodyType={
									template.gender === 0
										? BodyType.maleBody
										: BodyType.femaleBody
								}
								sliders={previewBodyGen}
							/>
						</ThreeView>
					</Paper>
					<Tabs
						value={bodyGenTab}
						onChange={setBodyGenTab}
						flex={1}
						style={{
							maxHeight: "100%",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<Tabs.List>
							<Tabs.Tab value="sliders">Sliders</Tabs.Tab>
							<Tabs.Tab value="raw">Raw</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel
							value="sliders"
							style={{ maxHeight: "100%", overflow: "auto" }}
						>
							<Sliders
								bodyGen={template.bodyGen}
								gender={template.gender as 0 | 1}
								onChange={(v) => onFieldChange("bodyGen", v)}
							/>
						</Tabs.Panel>
						<Tabs.Panel value="raw">
							<Textarea
								value={template.bodyGen}
								resize="vertical"
								placeholder="BodyGen String"
								autosize
								minRows={4}
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									onFieldChange("bodyGen", e.target.value)
								}
							/>
						</Tabs.Panel>
					</Tabs>
				</Group>
			</Stack>
		</>
	)
}

export default Form
