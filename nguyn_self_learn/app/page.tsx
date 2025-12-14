'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [jobCount, setJobCount] = useState<number>(0)
  const [jobSpecs, setJobSpecs] = useState<string[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJobCountChange = (count: number) => {
    const numCount = Math.max(0, Math.min(20, Math.floor(count))) // Limit to 0-20 jobs
    setJobCount(numCount)
    // Resize jobSpecs array to match count
    const newJobSpecs = [...jobSpecs]
    while (newJobSpecs.length < numCount) {
      newJobSpecs.push('')
    }
    while (newJobSpecs.length > numCount) {
      newJobSpecs.pop()
    }
    setJobSpecs(newJobSpecs)
  }

  const handleJobSpecChange = (index: number, value: string) => {
    const newJobSpecs = [...jobSpecs]
    newJobSpecs[index] = value
    setJobSpecs(newJobSpecs)
  }

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

    if (!githubToken.trim()) {
      setError('Please enter your GitHub API token')
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
      if (githubToken.trim()) {
        formData.append('githubToken', githubToken.trim())
      }
      if (githubUrl.trim()) {
        formData.append('githubUrl', githubUrl.trim())
      }
      
      // Send job specs as array
      const validJobSpecs = jobSpecs.filter(spec => spec.trim())
      formData.append('jobCount', validJobSpecs.length.toString())
      validJobSpecs.forEach((spec, index) => {
        formData.append(`jobSpec${index + 1}`, spec.trim())
      })

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Format results (old format for display)
      let formatted = ''
      
      // GitHub validation results - CV vs GitHub Match (always show if GitHub URL was provided)
      if (data.evidence_validation && data.evidence_validation.match_score !== undefined) {
        formatted += `GitHub Validation Results:\n`
        formatted += `CV to GitHub Match Score: ${data.evidence_validation.match_score}%\n\n`
        formatted += `Summary:\n${data.evidence_validation.summary}\n\n`
      } else if (data.github_evidence && data.github_evidence.cv_match_score !== undefined) {
        // Fallback: display from github_evidence if evidence_validation is not available
        formatted += `GitHub Validation Results:\n`
        formatted += `CV to GitHub Match Score: ${data.github_evidence.cv_match_score}%\n\n`
        if (data.github_evidence.cv_match_summary) {
          formatted += `Summary:\n${data.github_evidence.cv_match_summary}\n\n`
        }
      }
      
      // Job matching results
      if (data.job_fit && data.job_fit.preferred_role !== undefined) {
        if (formatted) formatted += `\n\n---\n\n`
        formatted += `Job Matching Results:\n`
        formatted += `Preferred Role: ${data.job_fit.preferred_role}\n\n`
        
        if (data.job_fit.role_match_scores) {
          formatted += `Match Scores:\n`
          const scores = data.job_fit.role_match_scores
          Object.keys(scores).sort().forEach((jobName) => {
            if (typeof scores[jobName] === 'number') {
              formatted += `  ${jobName}: ${scores[jobName]}%\n`
            }
          })
        }
        
        formatted += `\nSummary:\n${data.job_fit.summary}\n\n`
        
        if (data.job_fit.matched_skills && Array.isArray(data.job_fit.matched_skills) && data.job_fit.matched_skills.length > 0) {
          formatted += `Matched Skills:\n${data.job_fit.matched_skills.join(', ')}\n\n`
        }
        
        if (data.job_fit.missing_skills && Array.isArray(data.job_fit.missing_skills) && data.job_fit.missing_skills.length > 0) {
          formatted += `Missing Skills:\n${data.job_fit.missing_skills.join(', ')}\n`
        }
      }
      
      // If no validation or job fit, show CV claims
      if (!formatted && data.cv_claims) {
        formatted = JSON.stringify(data.cv_claims, null, 2)
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
          <label htmlFor="githubToken">GitHub API Token:</label>
          <input
            type="password"
            id="githubToken"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            disabled={loading}
            required
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
          <label htmlFor="jobCount">Number of Job Specifications (optional):</label>
          <input
            type="number"
            id="jobCount"
            min="0"
            max="20"
            value={jobCount}
            onChange={(e) => handleJobCountChange(parseInt(e.target.value) || 0)}
            disabled={loading}
          />
        </div>
        {jobSpecs.map((spec, index) => (
          <div key={index}>
            <label htmlFor={`jobSpec${index + 1}`}>Job Specification {index + 1} (optional):</label>
            <textarea
              id={`jobSpec${index + 1}`}
              value={spec}
              onChange={(e) => handleJobSpecChange(index, e.target.value)}
              placeholder="Paste job description here..."
              rows={5}
              disabled={loading}
            />
          </div>
        ))}
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
