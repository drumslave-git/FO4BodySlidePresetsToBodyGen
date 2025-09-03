import {
	Button,
	Container,
	Group,
	AppShell as MantineAppShell,
	Paper,
} from "@mantine/core"
import {
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react"
import {
	HashRouter,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router"

import { ConfigProvider, useConfig } from "./ConfigProvider"
import Converter from "./Converter"
import { DataProvider } from "./DataProvider"
import ESMs from "./ESMs"
import Settings from "./Settings"
import { SharedStateProvider } from "./SharedStateProvider"
import Templates from "./Templates"
import Edit from "./Templates/Edit"
import Import from "./Templates/Import"

const Nav = [
	{ label: "Converter", href: "/" },
	{ label: "Templates", href: "/templates" },
	{ label: "Settings", href: "/settings" },
]

const Header = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const { lastActiveLocation } = useConfig()
	const [activeTab, setActiveTab] = useState("/")
	const initialLoad = useRef(true)

	useEffect(() => {
		if (!initialLoad.current || !lastActiveLocation) {
			return
		}
		initialLoad.current = false
		navigate(lastActiveLocation)
	}, [navigate, lastActiveLocation])

	useEffect(() => {
		const pathname = location.pathname.split("/")
		let page = pathname.at(0) || pathname.at(1)
		page = page ? `/${page}` : "/"
		// @ts-expect-error
		window.electronAPI.navigate(page)
		setActiveTab(page)
	}, [location])

	const onExternalLinkClick = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			// @ts-expect-error
			window.electronAPI.openExternalUrl(e.currentTarget.dataset.href)
		},
		[],
	)

	const onNavigate = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			const href = e.currentTarget.dataset.href
			navigate(e.currentTarget.dataset.href)
		},
		[navigate],
	)

	return (
		<Group justify="space-between">
			<Group gap={0}>
				{Nav.map((item) => (
					<Button
						key={item.href}
						onClick={onNavigate}
						variant="subtle"
						color={activeTab === item.href ? "blue" : "gray"}
						data-href={item.href}
						radius={0}
					>
						{item.label}
					</Button>
				))}
			</Group>
			<Group gap={0}>
				<Button
					variant="subtle"
					color="gray"
					size="xs"
					data-href="https://github.com/drumslave-git/FO4BodySlidePresetsToBodyGen"
					onClick={onExternalLinkClick}
				>
					GitHub
				</Button>
				<Button
					variant="subtle"
					color="orange"
					size="xs"
					data-href="https://www.nexusmods.com/fallout4/mods/96066"
					onClick={onExternalLinkClick}
				>
					Nexus
				</Button>
			</Group>
		</Group>
	)
}

const ESMsBlock = () => {
	const location = useLocation()

	if (location.pathname !== "/settings" && location.pathname !== "/") {
		return null
	}
	return (
		<Container>
			<Paper mt="md" p="md" shadow="xs" withBorder>
				<ESMs />
			</Paper>
		</Container>
	)
}

const AppShell = () => {
	return (
		<HashRouter>
			<ConfigProvider>
				<SharedStateProvider>
					<DataProvider>
						<MantineAppShell
							padding="md"
							header={{ height: 40 }}
							withBorder={false}
						>
							<MantineAppShell.Header>
								<Header />
							</MantineAppShell.Header>
							<MantineAppShell.Main>
								<Routes>
									<Route index element={<Converter />} />
									<Route path="/settings" element={<Settings />} />
									<Route path="/templates">
										<Route index element={<Templates />} />
										<Route path="new" element={<Edit />} />
										<Route path="import" element={<Import />} />
									</Route>
								</Routes>
								<ESMsBlock />
							</MantineAppShell.Main>
						</MantineAppShell>
					</DataProvider>
				</SharedStateProvider>
			</ConfigProvider>
		</HashRouter>
	)
}

export default AppShell
