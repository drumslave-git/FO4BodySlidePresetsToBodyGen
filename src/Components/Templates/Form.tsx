import {
	ActionIcon,
	Group,
	Input,
	Slider as InputSlider,
	Paper,
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

import type { Template } from "../../db/schema"
import { BodyType, type MorphSlider } from "../../types"
import BodyView from "../3D/BodyView"
import Form from "../common/Form"
import { useData } from "../DataProvider"

const defaultTemplate: Template = {
	id: 0,
	name: "",
	bodyGen: "",
	gender: 0,
	source: "user",
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
	const { categorizedSliders } = useData()
	const [activeTab, setActiveTab] = useState("")
	useEffect(() => {
		setActiveTab(Object.keys(categorizedSliders[gender]).at(0))
	}, [categorizedSliders, gender])
	const values: MorphSlider[] = useMemo(() => {
		return bodyGen.split(",").map((slider) => {
			const [name, value] = slider.split("@").map((s) => s.trim())
			return { name, value: Number(value) }
		})
	}, [bodyGen])
	const onValueChange = useCallback(
		(name: string, value: number) => {
			const updatedSliders = [
				...values.filter((s) => s.name !== name),
				{ name, value },
			]
				.map((slider) => `${slider.name}@${slider.value}`)
				.join(",")
			onChange(updatedSliders)
		},
		[onChange, values],
	)
	return (
		<Tabs value={activeTab} onChange={setActiveTab}>
			<Tabs.List>
				{Object.keys(categorizedSliders[gender]).map((groupName) => (
					<Tabs.Tab key={groupName} value={groupName}>
						{groupName}
					</Tabs.Tab>
				))}
			</Tabs.List>
			{Object.entries(categorizedSliders[gender]).map(
				([groupName, sliders]) => (
					<Tabs.Panel key={groupName} value={groupName}>
						{sliders.map((slider) => {
							const value =
								values.find((s) => s.name === slider.morph)?.value ?? 0

							return (
								<Fragment key={slider.name}>
									<Text size="xs">
										{slider.displayName}: {value}
									</Text>
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
					</Tabs.Panel>
				),
			)}
		</Tabs>
	)
}

const FieldsComponent = (props) => {
	const { item: template, onFieldChange } = props

	const [bodyGenTab, setBodyGenTab] = useState("sliders")

	return (
		<>
			<Input.Wrapper label="Source">
				<Input value={template.source} readOnly />
			</Input.Wrapper>
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
					<BodyView
						bodyType={
							template.gender === 0 ? BodyType.maleBody : BodyType.femaleBody
						}
						sliders={template.bodyGen}
						enableZoom
					/>
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
		</>
	)
}

const TemplatesForm = () => {
	return (
		<Form
			db="templatesDB"
			rootUri="templates"
			defaultValues={defaultTemplate}
			FieldsComponent={FieldsComponent}
		/>
	)
}

export default TemplatesForm
