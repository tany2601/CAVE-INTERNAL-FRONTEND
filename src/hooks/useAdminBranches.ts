import { adminApi } from "../lib/api"
import { useAsyncData } from "./useAsyncData"

/** Branch list for the "All Branches" dropdowns across the admin views. */
export function useAdminBranches() {
  const { data } = useAsyncData(() => adminApi.listBranches())
  const branches = data ?? []
  return {
    branches,
    /** ["All Branches", ...names] */
    options: ["All Branches", ...branches.map((b) => b.name)],
    /** Dropdown label → branch id (undefined for "All Branches"). */
    idOf: (label: string) => branches.find((b) => b.name === label)?.id,
  }
}
