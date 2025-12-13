import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const cvFile = formData.get('cv') as File | null
    const geminiKey = formData.get('geminiKey') as string | null

    if (!cvFile) {
      return NextResponse.json(
        { error: 'CV file is required' },
        { status: 400 }
      )
    }

    if (!geminiKey || !geminiKey.trim()) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }

    // Extract text from PDF or DOCX
    const arrayBuffer = await cvFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let resumeText = ''

    if (cvFile.type === 'application/pdf') {
      const pdfData = await pdfParse(buffer)
      resumeText = pdfData.text
    } else if (cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || cvFile.name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX file' },
        { status: 400 }
      )
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from file' },
        { status: 400 }
      )
    }

    // Call Gemini 2.0 Flash
    const genAI = new GoogleGenerativeAI(geminiKey.trim())
    // Try gemini-2.0-flash-exp first, fallback to gemini-1.5-flash if needed
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `Extract ONLY explicit technical skills, projects, and certifications from the following resume text. 

Requirements:
- Extract ONLY explicit technical skills mentioned in the resume
- Extract ONLY explicit projects mentioned in the resume
- Extract ONLY explicit certifications mentioned in the resume
- Ignore soft skills (communication, teamwork, leadership, etc.)
- Do NOT infer skill levels or proficiency
- Do NOT add skills that are not explicitly mentioned
- Do NOT add projects that are not explicitly mentioned
- Do NOT add certifications that are not explicitly mentioned

Return ONLY valid JSON with this exact schema:
{
  "skills": string[],
  "projects": [
    { "name": string, "technologies": string[] }
  ],
  "certifications": string[]
}

Resume text:
${resumeText}

Return ONLY the JSON object, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response (handle cases where Gemini adds markdown formatting)
    let jsonText = text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse JSON
    let extractedData
    try {
      extractedData = JSON.parse(jsonText)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      )
    }

    // Validate schema
    if (!extractedData.skills || !Array.isArray(extractedData.skills)) {
      return NextResponse.json(
        { error: 'Invalid response format: missing or invalid skills array' },
        { status: 500 }
      )
    }

    if (!extractedData.projects || !Array.isArray(extractedData.projects)) {
      return NextResponse.json(
        { error: 'Invalid response format: missing or invalid projects array' },
        { status: 500 }
      )
    }

    if (!extractedData.certifications || !Array.isArray(extractedData.certifications)) {
      return NextResponse.json(
        { error: 'Invalid response format: missing or invalid certifications array' },
        { status: 500 }
      )
    }

    // Validate project structure
    for (const project of extractedData.projects) {
      if (!project.name || typeof project.name !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: project missing name' },
          { status: 500 }
        )
      }
      if (!project.technologies || !Array.isArray(project.technologies)) {
        return NextResponse.json(
          { error: 'Invalid response format: project missing technologies array' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error('Error processing resume:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while processing the resume' },
      { status: 500 }
    )
  }
}

