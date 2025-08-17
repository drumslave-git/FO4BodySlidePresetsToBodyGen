import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/tiptap/styles.css"
import "@mantine/code-highlight/styles.css"

import { Button, createTheme, MantineProvider } from "@mantine/core"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"

import AppShell from "./Components/AppShell"

const theme = createTheme({
	/** Put your mantine theme override here */
})

const App = () => {
	return (
		<MantineProvider theme={theme} defaultColorScheme="auto">
			<AppShell />
		</MantineProvider>
	)
}

const root = createRoot(document.body)
root.render(<App />)
