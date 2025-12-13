'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
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

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
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
          <h2>Extracted Data:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}

