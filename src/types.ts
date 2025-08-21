export type Config = {
	dataFolder?: string
	outputFolder?: string
	lastActiveLocation?: string
}

export type ESM = {
	name: string
	path: string
	filesStatus: {
		templates: {
			path: string
			color: "green" | "grey" | "yellow"
			text: string
		}
		morphs: {
			path: string
			color: "green" | "grey" | "yellow"
			text: string
		}
	}
}

export type FormattedData = {
	templates: string
	morphs: string
}

export type BodySlidePreset = {
	name: string
	set: string
	groups: {
		name: string
	}[]
	sliders: {
		name: string
		size: string
		value: number
	}[]
	bodyGen: string
	errors: string[]
	valid: boolean
}

export type BodySlidePresetParsed = {
	filename: string
	data: BodySlidePreset[] | string
}

export type NotificationData = {
	color: "green" | "red" | "yellow"
	title: string
	text: string
}

export type Slider = {
	name: string
	morph: string
	minimum: number
	maximum: number
	interval: number
	gender: number
}

export type ParsedTemplates = {
	[key: string]: { name: string; value: string }[]
}
