import { request } from "./http"
import type { AdminLoginResponse, BranchLoginResponse } from "../../types/api"

export const loginBranch = (pin: string) =>
  request<BranchLoginResponse>("POST", "/auth/branch/login", {
    body: { pin },
    auth: false,
  })

export const loginAdmin = (pin: string) =>
  request<AdminLoginResponse>("POST", "/admin/auth/login", {
    body: { pin },
    auth: false,
  })

/** Exchanges the current (still valid) token for a fresh one. */
export const refreshSession = () =>
  request<{ accessToken: string; expiresAt: number }>("POST", "/auth/refresh")
