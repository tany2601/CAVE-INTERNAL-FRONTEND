import logo from "../../assets/brand/cave-logo.png"

/**
 * The CAVE wordmark. The artwork is white, so it is inverted automatically in the light theme;
 * pass `onPhoto` where it sits on a dark photo and must stay white in either theme.
 */
export function BrandLogo({
  height = 28,
  onPhoto = false,
  className = "",
}: {
  height?: number
  onPhoto?: boolean
  className?: string
}) {
  return (
    <img
      src={logo}
      alt="CAVE"
      draggable={false}
      style={{ height, width: "auto" }}
      className={`brand-logo ${onPhoto ? "brand-logo-fixed" : ""} select-none ${className}`}
    />
  )
}
