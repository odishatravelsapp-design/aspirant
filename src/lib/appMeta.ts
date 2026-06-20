import type { ReportConfig } from '../types'

// Small holder so leaf components (ReportButton) can reach the report contact
// without threading config through every prop. App sets this once on load.
let reportConfig: ReportConfig = {}

export function setReportConfig(cfg: ReportConfig | undefined): void {
  reportConfig = cfg ?? {}
}

export function getReportConfig(): ReportConfig {
  return reportConfig
}
