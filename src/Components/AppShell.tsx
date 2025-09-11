import { AppShell as MantineAppShell, Paper } from "@mantine/core"

import { HashRouter, Route, Routes, useLocation } from "react-router"
import ViewHost from "./3D/ViewHost"

import { ConfigProvider } from "./ConfigProvider"
import Converter from "./Converter"
import { DataProvider } from "./DataProvider"
import ESMs from "./ESMs"
import { OverlayProvider } from "./OverlayProvider"
import RulesForm from "./Rules/Form"
import RulesList from "./Rules/List"
import Settings from "./Settings"
import { SharedStateProvider } from "./SharedStateProvider"
import Sidebar from "./Sidebar"
import TemplatesForm from "./Templates/Form"
import TemplatesImport from "./Templates/Import"
import TemplatesList from "./Templates/List"

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
												<Route path="list" element={<TemplatesList />} />
												<Route path="new" element={<TemplatesForm />} />
												<Route path="edit/:id" element={<TemplatesForm />} />
												<Route path="import" element={<TemplatesImport />} />
											</Route>
											<Route path="/rules">
												<Route path="list" element={<RulesList />} />
												<Route path="new" element={<RulesForm />} />
												<Route path="edit/:id" element={<RulesForm />} />
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
