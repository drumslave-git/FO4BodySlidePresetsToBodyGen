import { AppShell as MantineAppShell, Tabs } from "@mantine/core"
import { useEffect, useState } from "react"
import {
	HashRouter,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router"

import { ConfigProvider, useConfig } from "./ConfigProvider"
import Converter from "./Converter"
import Formatter from "./Formatter"

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

	return (
		<Tabs value={activeTab} onChange={setActiveTab}>
			<Tabs.List>
				<Tabs.Tab value="/">Converter</Tabs.Tab>
				<Tabs.Tab value="/formatter">Formatter</Tabs.Tab>
			</Tabs.List>
		</Tabs>
	)
}

const AppShell = () => {
	return (
		<HashRouter>
			<ConfigProvider>
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
							<Route path="/formatter" element={<Formatter />} />
						</Routes>
					</MantineAppShell.Main>
				</MantineAppShell>
			</ConfigProvider>
		</HashRouter>
	)
}

export default AppShell
