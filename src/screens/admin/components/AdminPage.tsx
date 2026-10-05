export function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-page-bg w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 animate-fade-in">
      {children}
    </div>
  )
}
