// Shared TypeScript types mirroring the backend Pydantic schemas

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type Category =
  | 'code_quality'
  | 'security'
  | 'testing'
  | 'maintainability'

export interface Issue {
  id: string
  category: Category
  severity: Severity
  title: string
  description: string
  file_path: string | null
  line_start: number | null
  line_end: number | null
  suggested_fix: string | null
}

export interface CategoryScore {
  category: Category
  score: number       // 0–100
  issue_count: number
}

export interface AnalysisReport {
  session_id: string
  project_name: string
  scores: CategoryScore[]
  issues: Issue[]
  summary: string
}
