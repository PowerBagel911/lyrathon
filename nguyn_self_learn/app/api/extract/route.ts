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
    const githubUrl = formData.get('githubUrl') as string | null

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

For each skill, categorize it as one of:
- "code": Programming languages, frameworks, libraries (e.g., Python, React, Django)
- "tool": Development tools, platforms, services (e.g., Docker, AWS, Git)
- "networking": Network protocols, technologies (e.g., OSPF, BGP, TCP/IP)
- "certification": Certifications and credentials (e.g., CCNA, AWS Certified)

Count how many times each skill appears in the resume text.

Return ONLY valid JSON with this exact schema:
{
  "skills": [
    {
      "name": string,
      "category": "code" | "tool" | "networking" | "certification",
      "mention_count": number
    }
  ],
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

    // Validate skill structure
    for (const skill of extractedData.skills) {
      if (!skill.name || typeof skill.name !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: skill missing name' },
          { status: 500 }
        )
      }
      const validCategories = ['code', 'tool', 'networking', 'certification']
      if (!skill.category || !validCategories.includes(skill.category)) {
        return NextResponse.json(
          { error: `Invalid response format: skill category must be one of: ${validCategories.join(', ')}` },
          { status: 500 }
        )
      }
      if (typeof skill.mention_count !== 'number' || skill.mention_count < 1) {
        return NextResponse.json(
          { error: 'Invalid response format: skill mention_count must be a positive number' },
          { status: 500 }
        )
      }
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

    // If no GitHub URL provided, return CV extraction only
    if (!githubUrl || !githubUrl.trim()) {
      return NextResponse.json(extractedData)
    }

    // Scrape GitHub profile
    let repositoriesData
    try {
      const scraperModule = await import('../../../lib/github-scraper.mjs')
      repositoriesData = await scraperModule.scrapeGitHubProfile(githubUrl.trim())
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to scrape GitHub profile: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Make Gemini comparison call
    const comparisonPrompt = `Compare the CV claims with the GitHub repositories evidence and calculate a match score.

CV Claims (JSON):
${JSON.stringify(extractedData, null, 2)}

GitHub Repositories (JSON):
${JSON.stringify(repositoriesData, null, 2)}

IMPORTANT SCORING RULES:
1. Base match score ONLY on "code" category skills
2. For each code skill, classify as:
   - "directly_supported": Explicit evidence (language in repo, direct dependency, explicit usage)
   - "indirectly_supported": Proxy evidence (related libraries, similar technologies, context clues)
   - "not_verifiable_via_github": No evidence found
3. For non-code skills (tool, networking, certification), classify as "not_verifiable_via_github" - these should NOT affect the score
4. Calculate match_score based ONLY on code skills:
   - directly_supported = 100% credit
   - indirectly_supported = 50% credit
   - not_verifiable_via_github = 0% credit
5. Use mention_count to increase confidence for non-code skills (explain in notes, but don't penalize)

Consider evidence from:
- Repository languages
- Dependencies in package.json, requirements.txt, etc.
- Technologies mentioned in project descriptions
- Import statements in code
- README content
- Related libraries or tools that indicate indirect knowledge

Return ONLY valid JSON with this exact schema:
{
  "match_score": number,
  "summary": string,
  "skill_breakdown": [
    {
      "skill": string,
      "category": string,
      "support_level": "directly_supported" | "indirectly_supported" | "not_verifiable_via_github",
      "notes": string
    }
  ]
}

The summary must:
- Clearly state which skills cannot be validated via GitHub
- Explain indirect evidence when used
- Emphasize that score reflects code-evidence alignment only
- Acknowledge GitHub's limitations for non-code skills

Return ONLY the JSON object, no other text.`

    const comparisonResult = await model.generateContent(comparisonPrompt)
    const comparisonResponse = await comparisonResult.response
    const comparisonText = comparisonResponse.text()

    // Extract JSON from comparison response
    let comparisonJsonText = comparisonText.trim()
    
    if (comparisonJsonText.startsWith('```json')) {
      comparisonJsonText = comparisonJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (comparisonJsonText.startsWith('```')) {
      comparisonJsonText = comparisonJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse comparison JSON
    let matchData
    try {
      matchData = JSON.parse(comparisonJsonText)
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      )
    }

    // Validate match data schema
    if (typeof matchData.match_score !== 'number' || matchData.match_score < 0 || matchData.match_score > 100) {
      return NextResponse.json(
        { error: 'Invalid response format: match_score must be a number between 0 and 100' },
        { status: 500 }
      )
    }

    if (!matchData.summary || typeof matchData.summary !== 'string') {
      return NextResponse.json(
        { error: 'Invalid response format: missing or invalid summary' },
        { status: 500 }
      )
    }

    if (!matchData.skill_breakdown || !Array.isArray(matchData.skill_breakdown)) {
      return NextResponse.json(
        { error: 'Invalid response format: missing or invalid skill_breakdown array' },
        { status: 500 }
      )
    }

    // Validate skill_breakdown structure
    const validSupportLevels = ['directly_supported', 'indirectly_supported', 'not_verifiable_via_github']
    for (const item of matchData.skill_breakdown) {
      if (!item.skill || typeof item.skill !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: skill_breakdown item missing skill' },
          { status: 500 }
        )
      }
      if (!item.category || typeof item.category !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: skill_breakdown item missing category' },
          { status: 500 }
        )
      }
      if (!item.support_level || !validSupportLevels.includes(item.support_level)) {
        return NextResponse.json(
          { error: `Invalid response format: support_level must be one of: ${validSupportLevels.join(', ')}` },
          { status: 500 }
        )
      }
      if (!item.notes || typeof item.notes !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: skill_breakdown item missing notes' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(matchData)
  } catch (error) {
    console.error('Error processing resume:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while processing the resume' },
      { status: 500 }
    )
  }
}

