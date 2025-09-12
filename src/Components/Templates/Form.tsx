import {
	ActionIcon,
	Box,
	Button,
	Group,
	Input,
	Slider as InputSlider,
	Modal,
	Paper,
	RangeSlider,
	Switch,
	Tabs,
	Text,
	Textarea,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
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
import { BodyType, type CategorizedSlider, type MorphSlider } from "../../types"
import BodyView from "../3D/BodyView"
import Form, { type FieldsComponentProps } from "../common/Form"
import { useData } from "../DataProvider"

const defaultTemplate: Template = {
	id: 0,
	name: "",
	bodyGen: "",
	gender: 0,
	source: "user",
	sourceXMLContentHash: "",
}

function getRandomSliderValue(
	slider: CategorizedSlider,
	boundaries: [number, number],
) {
	const { minimum: min, maximum: max, interval: step } = slider

	// convert percentage boundaries to absolute values
	const low = min * Math.abs(boundaries[0] / 100)
	const high = max * (boundaries[1] / 100)

	// align to step
	const stepsCount = Math.floor((high - low) / step)
	const randomStep = Math.floor(Math.random() * (stepsCount + 1))
	return +(low + randomStep * step).toFixed(10)
}

function getRandomSlidersValues(
	sliders: CategorizedSlider[],
	boundaries: [number, number],
): MorphSlider[] {
	return sliders.map((slider) => {
		return {
			name: slider.morph,
			value: getRandomSliderValue(slider, boundaries),
		}
	})
}

const RandomizeDialog = ({
	opened,
	onClose,
	boundaries,
	setBoundaries,
	onApply,
}: {
	opened: boolean
	onClose: () => void
	boundaries: [number, number]
	setBoundaries: (b: [number, number]) => void
	onApply: () => void
}) => {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Randomize Sliders"
			centered
			size="auto"
		>
			<Text>Randomize all sliders between the specified boundaries.</Text>
			<Box mx="md" my="xl">
				<RangeSlider
					value={boundaries}
					onChange={setBoundaries}
					min={-100}
					max={100}
					step={1}
					marks={[
						{ value: -100, label: "-100%" },
						{ value: 0, label: "0%" },
						{ value: 100, label: "100%" },
					]}
				/>
			</Box>
			<Box>
				<Button fullWidth onClick={onApply}>
					Apply
				</Button>
			</Box>
		</Modal>
	)
}

const SliderComponent = ({
	slider,
	values,
	onChange,
}: {
	slider: CategorizedSlider
	values: MorphSlider[]
	onChange: (v: string) => void
}) => {
	const value = useMemo(() => {
		return values.find((s) => s.name === slider.morph)?.value ?? 0
	}, [slider.morph, values])

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
		<>
			<Text size="xs" style={{ userSelect: "none" }}>
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
		</>
	)
}

const removeSlidersFromValues = (
	values: MorphSlider[],
	sliders: CategorizedSlider[],
) => {
	return values.filter(
		(s) => !sliders.find((slider) => slider.morph === s.name),
	)
}

const SlidersCategory = ({
	sliders,
	values,
	onChange,
}: {
	sliders: CategorizedSlider[]
	values: MorphSlider[]
	onChange: (v: string) => void
}) => {
	const [randomizeBoundaries, setRandomizeBoundaries] = useState<
		[number, number]
	>([-100, 100])
	const [
		randomizeDialogOpened,
		{ open: openRandomizeDialog, close: closeRandomizeDialog },
	] = useDisclosure(false)

	const onApplyRandomize = useCallback(() => {
		const updatedValue = removeSlidersFromValues(values, sliders).map(
			(slider) => `${slider.name}@${slider.value}`,
		)
		const updatedSliders = getRandomSlidersValues(
			sliders,
			randomizeBoundaries,
		).map((s) => `${s.name}@${s.value}`)
		onChange([...updatedValue, updatedSliders].join(","))
		closeRandomizeDialog()
	}, [closeRandomizeDialog, onChange, randomizeBoundaries, sliders, values])

	const onReset = useCallback(() => {
		const updatedValue = removeSlidersFromValues(values, sliders).map(
			(slider) => `${slider.name}@${slider.value}`,
		)
		onChange(updatedValue.join(","))
	}, [onChange, sliders, values])

	return (
		<>
			<RandomizeDialog
				opened={randomizeDialogOpened}
				onClose={closeRandomizeDialog}
				boundaries={randomizeBoundaries}
				setBoundaries={setRandomizeBoundaries}
				onApply={onApplyRandomize}
			/>
			<Group my="sm">
				<Button onClick={openRandomizeDialog} size="xs">
					Randomize
				</Button>
				<Button onClick={onReset} size="xs">
					Reset
				</Button>
			</Group>
			{sliders.map((slider) => (
				<SliderComponent
					key={slider.morph}
					slider={slider}
					values={values}
					onChange={onChange}
				/>
			))}
		</>
	)
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
	const [randomizeBoundaries, setRandomizeBoundaries] = useState<
		[number, number]
	>([-100, 100])
	const [
		randomizeDialogOpened,
		{ open: openRandomizeDialog, close: closeRandomizeDialog },
	] = useDisclosure(false)
	useEffect(() => {
		setActiveTab(Object.keys(categorizedSliders[gender]).at(0))
	}, [categorizedSliders, gender])
	const values: MorphSlider[] = useMemo(() => {
		return bodyGen.split(",").map((slider) => {
			const [name, value] = slider.split("@").map((s) => s.trim())
			return { name, value: Number(value) }
		})
	}, [bodyGen])

	const onReset = useCallback(() => {
		onChange("")
	}, [onChange])

	const onApplyRandomize = useCallback(() => {
		const updatedSliders = Object.values(categorizedSliders[gender])
			.flatMap((sliders) =>
				getRandomSlidersValues(sliders, randomizeBoundaries).map(
					(s) => `${s.name}@${s.value}`,
				),
			)
			.join(",")
		onChange(updatedSliders)
		closeRandomizeDialog()
	}, [
		closeRandomizeDialog,
		onChange,
		randomizeBoundaries,
		categorizedSliders,
		gender,
	])

	return (
		<>
			<RandomizeDialog
				opened={randomizeDialogOpened}
				onClose={closeRandomizeDialog}
				boundaries={randomizeBoundaries}
				setBoundaries={setRandomizeBoundaries}
				onApply={onApplyRandomize}
			/>
			<Group my="sm">
				<Button onClick={openRandomizeDialog} size="xs">
					Randomize
				</Button>
				<Button onClick={onReset} size="xs">
					Reset All
				</Button>
			</Group>
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
							<SlidersCategory
								sliders={sliders}
								values={values}
								onChange={onChange}
							/>
						</Tabs.Panel>
					),
				)}
			</Tabs>
		</>
	)
}

const FieldsComponent = (props: FieldsComponentProps) => {
	const { item, onFieldChange } = props

	const template = item as Template

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
