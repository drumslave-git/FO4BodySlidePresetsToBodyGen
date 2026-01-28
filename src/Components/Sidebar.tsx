import { Box, Button, em, NavLink, Paper, Stack } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import {
	IconBrandGithub,
	IconCircuitChangeover,
	IconList,
	type IconMan,
	IconPlaylistAdd,
	IconSettings,
} from "@tabler/icons-react"
import {
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react"
import { useLocation, useNavigate } from "react-router"
import { useConfig } from "./ConfigProvider"
import { useData } from "./DataProvider"

type NavItem = {
	label: string
	href: string
	Icon: typeof IconMan
	children: NavItem[]
}

const Nav: NavItem[] = [
	{ label: "Converter", href: "/", Icon: IconCircuitChangeover, children: [] },
	{
		label: "Presets",
		href: "/presets",
		Icon: IconCircuitChangeover,
		children: [],
	},
	{
		label: "Rules",
		href: "#/rules",
		Icon: IconCircuitChangeover,
		children: [
			{ label: "List", href: "/rules/list", Icon: IconList, children: [] },
			{
				label: "New",
				href: "/rules/new",
				Icon: IconPlaylistAdd,
				children: [],
			},
		],
	},
	{ label: "Settings", href: "/settings", Icon: IconSettings, children: [] },
]

const NavigationItem = ({
	item,
	activeTab,
	isSmall,
	onNavigate,
}: {
	item: NavItem
	activeTab: string
	isSmall: boolean
	onNavigate: (e: MouseEvent<HTMLAnchorElement>) => void
}) => {
	const { Icon, children } = item

	const [isOpened, setIsOpened] = useState(false)

	const isActive: boolean = useMemo(() => {
		const href = item.href.replace("#", "")
		if (activeTab === "/" || href === "/") {
			return activeTab === href
		}
		return activeTab.startsWith(href) || activeTab === href
	}, [item, activeTab])

	useEffect(() => {
		if (isActive && children.length) {
			setIsOpened(true)
		}
	}, [isActive, children])

	const onChange = useCallback((opened: boolean) => {
		setIsOpened(opened)
	}, [])

	return (
		<NavLink
			key={item.href}
			onClick={children.length ? undefined : onNavigate}
			variant="light"
			active={isActive}
			opened={isOpened}
			onChange={onChange}
			href={item.href}
			label={isSmall ? undefined : item.label}
			title={item.label}
			rightSection={children.length && !isSmall ? undefined : null}
			leftSection={<Icon />}
			childrenOffset={isSmall ? 0 : 24}
		>
			<Navigation
				items={children}
				activeTab={activeTab}
				isSmall={isSmall}
				onNavigate={onNavigate}
			/>
		</NavLink>
	)
}

const Navigation = ({
	items,
	activeTab,
	isSmall,
	onNavigate,
}: {
	items: NavItem[]
	activeTab: string
	isSmall: boolean
	onNavigate: (e: MouseEvent<HTMLAnchorElement>) => void
}) => {
	if (!items.length) return null
	return (
		<>
			{items.map((item) => (
				<NavigationItem
					key={item.href}
					item={item}
					onNavigate={onNavigate}
					activeTab={activeTab}
					isSmall={isSmall}
				/>
			))}
		</>
	)
}

const Sidebar = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const { lastActiveLocation, dataFolder, outputFolder } = useConfig()
	const { reloadData } = useData()
	const isSmall = useMediaQuery(`(max-width: ${em(750)})`)
	const [activeTab, setActiveTab] = useState(lastActiveLocation || "/")

	const noSettings = !dataFolder || !outputFolder

	useEffect(() => {
		if (noSettings) {
			navigate("/settings")
		}
	}, [noSettings, navigate])

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI.navigate(location.pathname)
		setActiveTab(location.pathname)
	}, [location])

	const onExternalLinkClick = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault()
			// @ts-expect-error
			window.electronAPI.openExternalUrl(e.currentTarget.href)
		},
		[],
	)

	const onNavigate = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault()
			navigate(new URL(e.currentTarget.href).pathname)
		},
		[navigate],
	)

	return (
		<Paper withBorder p="md" h="100%">
			<Stack justify="space-between" h="100%">
				<Box>
					<Navigation
						items={Nav}
						activeTab={activeTab}
						isSmall={isSmall}
						onNavigate={onNavigate}
					/>
				</Box>
				<Box>
					<Button
						fullWidth
						variant="subtle"
						color="gray"
						onClick={reloadData}
						disabled={noSettings}
					>
						Reload Data
					</Button>
					<NavLink
						variant="subtle"
						color="gray"
						href="https://github.com/drumslave-git/FO4BodySlidePresetsToBodyGen"
						onClick={onExternalLinkClick}
						label={isSmall ? undefined : "GitHub"}
						leftSection={<IconBrandGithub />}
					/>
					<NavLink
						variant="subtle"
						color="orange"
						href="https://www.nexusmods.com/fallout4/mods/96066"
						onClick={onExternalLinkClick}
						label={isSmall ? "NM" : "Nexus Mods"}
					/>
				</Box>
			</Stack>
		</Paper>
	)
}

export default Sidebar
