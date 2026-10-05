export function Toast({
  message,
  variant = "success",
}: {
  message: string
  variant?: "success" | "error"
}) {
  const colors = {
    success: "bg-[#1A2E25] border-[rgba(46,125,88,0.4)] text-[#4CAF86]",
    error: "bg-[#2E1A1A] border-[rgba(125,46,46,0.4)] text-[#E06060]",
  }
  return (
    <div className="fixed bottom-nav-offset left-4 right-4 z-[110] animate-slide-up">
      <div
        className={`border rounded-sm px-4 py-3 text-sm font-medium ${colors[variant]}`}
      >
        {message}
      </div>
    </div>
  )
}
