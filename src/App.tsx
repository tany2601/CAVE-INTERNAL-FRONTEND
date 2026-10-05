import { AuthProvider } from "./context/AuthContext"
import { BranchDataProvider } from "./context/BranchDataContext"
import { DataRefreshProvider } from "./context/DataRefreshContext"
import AppRouter from "./app/AppRouter"

export default function App() {
  return (
    <AuthProvider>
      <DataRefreshProvider>
        <BranchDataProvider>
          <AppRouter />
        </BranchDataProvider>
      </DataRefreshProvider>
    </AuthProvider>
  )
}
