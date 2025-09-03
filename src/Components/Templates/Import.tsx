import { Container } from "@mantine/core"
import { useCallback } from "react"
import { useNavigate } from "react-router"

import BodySlidePresets from "./BodySlidePresets"

const Import = () => {
	const navigate = useNavigate()
	const onBack = useCallback(() => {
		navigate("/templates")
	}, [navigate])
	return (
		<Container>
			<BodySlidePresets onSubmit={onBack} onCancel={onBack} />
		</Container>
	)
}

export default Import
