import { CloseButton, Input } from "@mantine/core"
import { IconSearch } from "@tabler/icons-react"
import type { ChangeEvent } from "react"

const SearchInput = ({
	value,
	onChange,
}: {
	value: string
	onChange: (v: string) => void
}) => {
	return (
		<Input
			data-autofocus
			value={value}
			onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
			leftSection={<IconSearch size={16} />}
			rightSectionPointerEvents="all"
			placeholder="Search"
			rightSection={
				<CloseButton
					aria-label="Clear input"
					onClick={() => onChange("")}
					style={{ display: value ? undefined : "none" }}
				/>
			}
		/>
	)
}

export default SearchInput
