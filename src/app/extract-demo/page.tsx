'use client'

import { useState } from 'react'
import { api } from '../../trpc/react'

export default function ExtractDemoPage() {
  const [file, setFile] = useState<File | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [jobSpecA, setJobSpecA] = useState('')
  const [jobSpecB, setJobSpecB] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const extractCV = api.extract.extractCV.useMutation({
    onSuccess: (data) => {
      setError(null)
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
    },
    onError: (err) => {
      setError(err.message)
      setResult(null)
    }
  })

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

    try {
      console.log('[Frontend] Starting file conversion...')
      console.log('[Frontend] File name:', file.name)
      console.log('[Frontend] File type:', file.type)
      console.log('[Frontend] File size:', file.size)
      
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer()
      console.log('[Frontend] ArrayBuffer size:', fileBuffer.byteLength)
      
      const base64 = btoa(
        new Uint8Array(fileBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      )
      console.log('[Frontend] Base64 length:', base64.length)
      console.log('[Frontend] Base64 preview:', base64.substring(0, 50))
      
      const payload = {
        cvFile: base64,
        cvFileType: file.type,
        cvFileName: file.name,
        geminiKey: geminiKey.trim(),
        githubUrl: githubUrl.trim() || undefined,
        jobSpecA: jobSpecA.trim() || undefined,
        jobSpecB: jobSpecB.trim() || undefined,
      }
      
      console.log('[Frontend] Payload keys:', Object.keys(payload))
      console.log('[Frontend] Calling mutation...')
      
      extractCV.mutate(payload)
    } catch (err) {
      console.error('[Frontend] Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Extract CV Demo (tRPC)</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="cv" className="block text-sm font-medium mb-2">
            Upload PDF or DOCX Resume:
          </label>
          <input
            type="file"
            id="cv"
            accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={extractCV.isPending}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="geminiKey" className="block text-sm font-medium mb-2">
            Gemini API Key:
          </label>
          <input
            type="password"
            id="geminiKey"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            disabled={extractCV.isPending}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium mb-2">
            GitHub Profile URL (optional):
          </label>
          <input
            type="text"
            id="githubUrl"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username"
            disabled={extractCV.isPending}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="jobSpecA" className="block text-sm font-medium mb-2">
            Job Specification A (optional):
          </label>
          <textarea
            id="jobSpecA"
            value={jobSpecA}
            onChange={(e) => setJobSpecA(e.target.value)}
            placeholder="Paste job description here..."
            rows={5}
            disabled={extractCV.isPending}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="jobSpecB" className="block text-sm font-medium mb-2">
            Job Specification B (optional):
          </label>
          <textarea
            id="jobSpecB"
            value={jobSpecB}
            onChange={(e) => setJobSpecB(e.target.value)}
            placeholder="Paste job description here..."
            rows={5}
            disabled={extractCV.isPending}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <button 
          type="submit" 
          disabled={extractCV.isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {extractCV.isPending ? 'Processing...' : 'Extract'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 border border-red-200">
          <strong className="font-semibold text-red-800">Error:</strong>
          <span className="ml-2 text-red-700">{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Results:</h2>
          <pre className="rounded-md bg-gray-50 p-4 overflow-x-auto text-sm border border-gray-200 whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}
