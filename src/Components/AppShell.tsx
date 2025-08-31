import {
	Button,
	Container,
	Group,
	AppShell as MantineAppShell,
	Paper,
	Tabs,
} from "@mantine/core"
import { type MouseEvent, useCallback, useEffect, useState } from "react"
import {
	HashRouter,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router"
import ViewHost from "./3D/ViewHost"

import { ConfigProvider, useConfig } from "./ConfigProvider"
import Converter from "./Converter"
import { DataProvider } from "./DataProvider"
import ESMs from "./ESMs"
import Settings from "./Settings"
import { SharedStateProvider } from "./SharedStateProvider"

const Header = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const { lastActiveLocation } = useConfig()
	const [activeTab, setActiveTab] = useState(lastActiveLocation || "/")

	useEffect(() => {
		navigate(activeTab)
	}, [navigate, activeTab])

	useEffect(() => {
		// @ts-expect-error
		window.electronAPI.navigate(location)
	}, [location])

	const onExternalLinkClick = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			// @ts-expect-error
			window.electronAPI.openExternalUrl(e.currentTarget.dataset.href)
		},
		[],
	)

	return (
		<Group justify="space-between">
			<Tabs value={activeTab} onChange={setActiveTab}>
				<Tabs.List>
					<Tabs.Tab value="/">Converter</Tabs.Tab>
					<Tabs.Tab value="/settings">Settings</Tabs.Tab>
				</Tabs.List>
			</Tabs>
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
								</Routes>
								<Container>
									<Paper mt="md" p="md" shadow="xs" withBorder>
										<ESMs />
									</Paper>
								</Container>
							</MantineAppShell.Main>
						</MantineAppShell>
						<ViewHost />
					</DataProvider>
				</SharedStateProvider>
			</ConfigProvider>
		</HashRouter>
	)
}

export default AppShell
