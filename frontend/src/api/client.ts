// api/client.ts — typed wrappers for all CodeGuardian backend calls
import axios from 'axios'
import type { AnalysisReport } from '../types'

const api = axios.create({
  // In dev, Vite proxies these paths to http://127.0.0.1:8000
  baseURL: 'https://ibm-bob-hackathon-1.onrender.com',
  headers: { 'Content-Type': 'application/json' },
})

/** Submit a GitHub URL for analysis. Returns the session_id. */
export async function analyzeUrl(
  githubUrl: string,
  projectName: string,
): Promise<{ session_id: string; status: string }> {
  const { data } = await api.post('/analyze', {
    github_url: githubUrl,
    project_name: projectName,
  })
  return data
}

/** Submit a ZIP file for analysis. Returns the session_id. */
export async function analyzeUpload(
  file: File,
): Promise<{ session_id: string; status: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/analyze/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Trigger static analysis for an ingested session.
 * Calls POST /run/{sessionId} which runs all static checks and returns
 * the completed AnalysisReport. If a report already exists it is returned
 * from cache without re-running.
 */
export async function runAnalysis(sessionId: string): Promise<AnalysisReport> {
  const { data } = await api.post(`/run/${sessionId}`)
  return data
}

/** Fetch the full analysis report for a session. */
export async function getResults(sessionId: string): Promise<AnalysisReport> {
  const { data } = await api.get(`/results/${sessionId}`)
  return data
}
