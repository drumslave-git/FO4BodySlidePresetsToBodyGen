import { AppShell as MantineAppShell, Paper } from "@mantine/core"

import { HashRouter, Route, Routes, useLocation } from "react-router"
import ViewHost from "./3D/ViewHost"

import { ConfigProvider } from "./ConfigProvider"
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
		<>
			<ViewHost />
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
									<OverlayProvider>
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
									</OverlayProvider>
								</MantineAppShell.Main>
							</MantineAppShell>
						</DataProvider>
					</SharedStateProvider>
				</ConfigProvider>
			</HashRouter>
		</>
	)
}

export default AppShell
