import {
	Group,
	Loader,
	LoadingOverlay,
	Notification,
	Text,
} from "@mantine/core"
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react"

import type { NotificationData } from "../types"

const OverlayContext = createContext<{
	isLoading: boolean | string
	setIsLoading: (v: string | boolean) => void
	showNotification: (notification: NotificationData) => void
	removeNotification: (index: number) => void
}>({
	isLoading: false,
	setIsLoading: () => {},
	showNotification: () => {},
	removeNotification: () => {},
})

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
	const [isLoading, setIsLoading] = useState<string | boolean>(false)
	const [notifications, setNotifications] = useState<NotificationData[]>([])

	const showNotification = useCallback((notification: NotificationData) => {
		setNotifications((prev) => [...prev, notification])
	}, [])

	const removeNotification = useCallback((index: number) => {
		setNotifications((prev) => prev.filter((_, i) => i !== index))
	}, [])

	return (
		<OverlayContext.Provider
			value={{ isLoading, setIsLoading, showNotification, removeNotification }}
		>
			<LoadingOverlay
				zIndex={1000}
				visible={!!isLoading}
				pos="fixed"
				loaderProps={{
					children: (
						<Group>
							<Loader />
							{typeof isLoading === "string" && <Text>{isLoading}</Text>}
						</Group>
					),
				}}
			/>
			{notifications.map((notification, index) => (
				<Notification
					// biome-ignore lint/suspicious/noArrayIndexKey: index
					key={index}
					color={notification.color}
					title={notification.title}
					onClose={() => removeNotification(index)}
				>
					{notification.text}
				</Notification>
			))}
			{children}
		</OverlayContext.Provider>
	)
}

export const useOverlay = () => useContext(OverlayContext)
