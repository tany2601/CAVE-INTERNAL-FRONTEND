import { PHONE_LENGTH, phoneError, sanitizePhone } from "../../lib/phone"

interface PhoneInputProps {
  value: string
  onChange: (digits: string) => void
  placeholder?: string
  /** Class for the <input> itself (each screen has its own field styling). */
  className?: string
  autoFocus?: boolean
  /** Show the validation message under the field. Defaults to true. */
  showError?: boolean
}

/** Phone field that only accepts a valid 10-digit mobile number and explains what's wrong. */
export function PhoneInput({
  value,
  onChange,
  placeholder = "10-digit mobile number",
  className = "",
  autoFocus,
  showError = true,
}: PhoneInputProps) {
  const error = phoneError(value)
  return (
    <>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={20} // roomy enough to paste "+91 98765 43210"; sanitizePhone caps it at 10 digits
        className={className}
        placeholder={placeholder}
        value={value}
        aria-invalid={!!error}
        autoFocus={autoFocus}
        onChange={(event) => onChange(sanitizePhone(event.target.value))}
      />
      {showError && error && (
        <p className="mt-1 text-[11px] text-[#E06060]">{error}</p>
      )}
    </>
  )
}
