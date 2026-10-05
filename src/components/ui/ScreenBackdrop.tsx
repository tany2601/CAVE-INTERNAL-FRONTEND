/**
 * Faint photo behind a screen. The parent needs `relative isolate`; the image sits behind the
 * content and ignores taps.
 */
export function ScreenBackdrop({ src, opacity = 0.08 }: { src: string; opacity?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})`, opacity }}
      />
      {/* Fades to the page colour towards the bottom so inputs, buttons and text stay crisp. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--bg) 0%, color-mix(in srgb, var(--bg) 92%, transparent) 38%, transparent 78%)",
        }}
      />
    </div>
  )
}

/** Photos used as screen backdrops (same barber photography as the PIN screen). */
export const BACKDROPS = {
  name: "/images/photos/1503951914875-452162b0f3f1.jpg",
  phone: "/images/photos/1585747860715-2ba37e788b70.jpg",
  services: "/images/photos/1621605815971-fbc98d665033.jpg",
  loyalty: "/images/photos/1622286342621-4bd786c2447c.jpg",
  stylists: "/images/photos/1599351431202-1e0f0137899a.jpg",
}
