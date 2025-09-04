import {
	Box,
	Button,
	Container,
	em,
	Group,
	AppShell as MantineAppShell,
	NavLink,
	Paper,
	Stack,
} from "@mantine/core"
import { useDisclosure, useMediaQuery } from "@mantine/hooks"
import {
	IconBrandGithub,
	IconCircuitChangeover,
	IconFileImport,
	IconList,
	IconMan,
	IconPlaylistAdd,
	IconSettings,
} from "@tabler/icons-react"
import {
	ComponentProps,
	JSX,
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
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
import { OverlayProvider } from "./OverlayProvider"
import Settings from "./Settings"
import { SharedStateProvider } from "./SharedStateProvider"
import Sidebar from "./Sidebar"
import Form from "./Templates/Form"
import Import from "./Templates/Import"
import List from "./Templates/List"

const ESMsBlock = () => {
	const location = useLocation()

	if (location.pathname !== "/settings" && location.pathname !== "/") {
		return null
	}
	return (
		<Paper mt="md" p="md" shadow="xs" withBorder>
			<ESMs />
		</Paper>
	)
}

const AppShell = () => {
	return (
		<OverlayProvider>
			<HashRouter>
				<ConfigProvider>
					<SharedStateProvider>
						<DataProvider>
							<MantineAppShell
								padding="md"
								withBorder={false}
								navbar={{
									width: { base: 50, sm: 200 },
									breakpoint: "",
								}}
							>
								<MantineAppShell.Navbar>
									<Sidebar />
								</MantineAppShell.Navbar>
								<MantineAppShell.Main>
									<Routes>
										<Route index element={<Converter />} />
										<Route path="/settings" element={<Settings />} />
										<Route path="/templates">
											<Route path="list" element={<List />} />
											<Route path="new" element={<Form />} />
											<Route path="edit/:id" element={<Form />} />
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
		</OverlayProvider>
	)
}

export default AppShell
