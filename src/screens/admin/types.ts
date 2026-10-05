import type { ReportPeriod } from "../../types/api"

export type Period = "Today" | "This Week" | "This Month" | "Custom"
export type BranchTab = "summary" | "sessions" | "staff"

/** Admin period tabs → backend report periods ("Custom" has no date picker, so it spans all time). */
export const PERIOD_TO_REPORT: Record<Period, ReportPeriod> = {
  Today: "TODAY",
  "This Week": "THIS_WEEK",
  "This Month": "THIS_MONTH",
  Custom: "CUSTOM",
}
