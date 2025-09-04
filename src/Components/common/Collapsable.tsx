import {
	ActionIcon,
	type ActionIconProps,
	Collapse,
	type CollapseProps,
	Group,
	type GroupProps,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconEye, IconEyeClosed } from "@tabler/icons-react"
import type { ReactNode } from "react"

const Collapsable = ({
	children,
	title,
	titleProps,
	collapseProps,
	iconProps,
}: {
	children: ReactNode
	title: ReactNode
	titleProps?: GroupProps
	collapseProps?: Omit<CollapseProps, "in">
	iconProps?: Omit<ActionIconProps, "onClick">
}) => {
	const [collapsed, { toggle }] = useDisclosure(false)

	return (
		<>
			<Group {...titleProps}>
				{title}
				<ActionIcon {...iconProps} onClick={toggle}>
					{!collapsed ? (
						<IconEye style={{ width: "70%", height: "70%" }} stroke={1.5} />
					) : (
						<IconEyeClosed
							style={{ width: "70%", height: "70%" }}
							stroke={1.5}
						/>
					)}
				</ActionIcon>
			</Group>
			<Collapse {...collapseProps} in={collapsed}>
				{children}
			</Collapse>
		</>
	)
}

export default Collapsable
