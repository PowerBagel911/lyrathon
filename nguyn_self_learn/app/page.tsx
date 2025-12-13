'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [jobSpecA, setJobSpecA] = useState('')
  const [jobSpecB, setJobSpecB] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!file) {
      setError('Please select a PDF or DOCX file')
      return
    }

    if (!geminiKey.trim()) {
      setError('Please enter your Gemini API key')
      return
    }

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      setError('Please select a PDF or DOCX file')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('cv', file)
      formData.append('geminiKey', geminiKey)
      if (githubUrl.trim()) {
        formData.append('githubUrl', githubUrl.trim())
      }
      if (jobSpecA.trim()) {
        formData.append('jobSpecA', jobSpecA.trim())
      }
      if (jobSpecB.trim()) {
        formData.append('jobSpecB', jobSpecB.trim())
      }

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Format results
      let formatted = ''
      
      // GitHub validation results
      if (data.match_score !== undefined) {
        formatted += `GitHub Validation Results:\n`
        formatted += `Match Score: ${data.match_score}%\n\nSummary:\n${data.summary}\n\nSkill Breakdown:\n`
        
        if (data.skill_breakdown && Array.isArray(data.skill_breakdown)) {
          for (const item of data.skill_breakdown) {
            formatted += `\n${item.skill} (${item.category})\n`
            formatted += `  Support Level: ${item.support_level}\n`
            formatted += `  Notes: ${item.notes}\n`
          }
        }
      }
      
      // Job matching results
      if (data.preferred_role !== undefined) {
        if (formatted) formatted += `\n\n---\n\n`
        formatted += `Job Matching Results:\n`
        formatted += `Preferred Role: ${data.preferred_role}\n\n`
        
        if (data.role_match_scores) {
          formatted += `Match Scores:\n`
          if (data.role_match_scores['Job A'] !== undefined) {
            formatted += `  Job A: ${data.role_match_scores['Job A']}%\n`
          }
          if (data.role_match_scores['Job B'] !== undefined) {
            formatted += `  Job B: ${data.role_match_scores['Job B']}%\n`
          }
        }
        
        formatted += `\nSummary:\n${data.summary}\n\n`
        
        if (data.matched_skills && Array.isArray(data.matched_skills) && data.matched_skills.length > 0) {
          formatted += `Matched Skills:\n${data.matched_skills.join(', ')}\n\n`
        }
        
        if (data.missing_skills && Array.isArray(data.missing_skills) && data.missing_skills.length > 0) {
          formatted += `Missing Skills:\n${data.missing_skills.join(', ')}\n`
        }
      }
      
      if (formatted) {
        setResult(formatted)
      } else {
        setResult(JSON.stringify(data, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="cv">Upload PDF or DOCX Resume:</label>
          <input
            type="file"
            id="cv"
            accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="geminiKey">Gemini API Key:</label>
          <input
            type="password"
            id="geminiKey"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="githubUrl">GitHub Profile URL (optional):</label>
          <input
            type="text"
            id="githubUrl"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="jobSpecA">Job Specification A (optional):</label>
          <textarea
            id="jobSpecA"
            value={jobSpecA}
            onChange={(e) => setJobSpecA(e.target.value)}
            placeholder="Paste job description here..."
            rows={5}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="jobSpecB">Job Specification B (optional):</label>
          <textarea
            id="jobSpecB"
            value={jobSpecB}
            onChange={(e) => setJobSpecB(e.target.value)}
            placeholder="Paste job description here..."
            rows={5}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Extract'}
        </button>
      </form>

      {error && (
        <div>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h2>Results:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}

