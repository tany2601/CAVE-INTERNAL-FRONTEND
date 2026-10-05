import { Select } from "../../../components/ui"

export function AdminSelect({
  value,
  onChange,
  options,
  full,
  leading,
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  full?: boolean
  leading?: React.ReactNode
  className?: string
}) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      leading={leading}
      className={`admin-select ${full ? "w-full" : "w-full sm:w-52"} ${className}`}
    />
  )
}
