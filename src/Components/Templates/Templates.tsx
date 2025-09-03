import {
	Button,
	Container,
	Group,
	Modal,
	Paper,
	ScrollArea,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useCallback } from "react"
import { useNavigate } from "react-router"

import BodySlidePresets from "./BodySlidePresets"

const Templates = () => {
	const [
		showBodySlidePresetsModal,
		{ open: openBodySlidePresetsModal, close: closeBodySlidePresetsModal },
	] = useDisclosure(false)
	const navigate = useNavigate()

	const onCreateClick = useCallback(() => {
		navigate("/templates/new")
	}, [navigate])

	const onImportClick = useCallback(() => {
		navigate("/templates/import")
	}, [navigate])

	return (
		<>
			<Modal
				opened={showBodySlidePresetsModal}
				onClose={closeBodySlidePresetsModal}
				title="Select BodySlide Presets"
				size="xl"
				scrollAreaComponent={ScrollArea.Autosize}
			>
				<BodySlidePresets
					onSubmit={closeBodySlidePresetsModal}
					onCancel={closeBodySlidePresetsModal}
				/>
			</Modal>
			<Container>
				<Paper p="md" shadow="xs" withBorder>
					<Group>
						<Button onClick={onCreateClick}>Create</Button>
						<Button onClick={onImportClick}>
							Import From BodySlide presets
						</Button>
					</Group>
				</Paper>
			</Container>
		</>
	)
}

export default Templates
