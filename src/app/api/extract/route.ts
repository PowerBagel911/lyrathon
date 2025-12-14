import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { env } from '~/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Save structured response to JSON files
 */
async function saveStructuredResponse(structuredResponse: {
  cv_claims: any
  github_evidence?: any
  evidence_validation?: any
  job_fit?: any
}) {
  try {
    // Create output directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const outputDir = join(process.cwd(), 'output', timestamp)
    await mkdir(outputDir, { recursive: true })

    // Save each section to separate files
    await writeFile(
      join(outputDir, 'cv_claims.json'),
      JSON.stringify(structuredResponse.cv_claims, null, 2),
      'utf-8'
    )

    if (structuredResponse.github_evidence) {
      await writeFile(
        join(outputDir, 'github_evidence.json'),
        JSON.stringify(structuredResponse.github_evidence, null, 2),
        'utf-8'
      )
    }

    if (structuredResponse.evidence_validation) {
      await writeFile(
        join(outputDir, 'evidence_validation.json'),
        JSON.stringify(structuredResponse.evidence_validation, null, 2),
        'utf-8'
      )
    }

    if (structuredResponse.job_fit) {
      await writeFile(
        join(outputDir, 'job_fit.json'),
        JSON.stringify(structuredResponse.job_fit, null, 2),
        'utf-8'
      )
    }

    // Save complete structured response
    await writeFile(
      join(outputDir, 'complete_response.json'),
      JSON.stringify(structuredResponse, null, 2),
      'utf-8'
    )

    return outputDir
  } catch (error) {
    console.error('Error saving structured response:', error)
    // Don't throw - file saving is optional
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const cvFile = formData.get('cv') as File | null
    const geminiKey = formData.get('geminiKey') as string | null
    const githubToken = formData.get('githubToken') as string | null
    const githubUrl = formData.get('githubUrl') as string | null
    
    // Collect job specs dynamically
    const jobCountStr = formData.get('jobCount') as string | null
    const jobCount = jobCountStr ? parseInt(jobCountStr) : 0
    const jobSpecs: string[] = []
    for (let i = 1; i <= jobCount; i++) {
      const spec = formData.get(`jobSpec${i}`) as string | null
      if (spec && spec.trim()) {
        jobSpecs.push(spec.trim())
      }
    }

    if (!cvFile) {
      return NextResponse.json(
        { error: 'CV file is required' },
        { status: 400 }
      )
    }

    // Use FormData value or fall back to environment variable
    const finalGeminiKey = (geminiKey && geminiKey.trim()) || env.GEMINI_API_KEY || null
    if (!finalGeminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }

    // Use FormData value or fall back to environment variable
    const finalGithubToken = (githubToken && githubToken.trim()) || env.GITHUB_API_KEY || null
    if (!finalGithubToken) {
      return NextResponse.json(
        { error: 'GitHub API token is required' },
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
    const genAI = new GoogleGenerativeAI(finalGeminiKey)
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

    // Build structured response
    type StructuredResponse = {
      cv_claims: typeof extractedData
      github_evidence?: any
      evidence_validation?: any
      job_fit?: any
    }
    
    const structuredResponse: StructuredResponse = {
      cv_claims: extractedData,
    }

    // If no GitHub URL provided, return CV extraction only
    if (!githubUrl || !githubUrl.trim()) {
      // Save structured response to files
      await saveStructuredResponse(structuredResponse)
      return NextResponse.json(structuredResponse)
    }

    // Scrape GitHub profile
    let repositoriesData: any
    try {
      const scraperModule = await import('../../../lib/github-scraper.mjs')
      // finalGithubToken is guaranteed to be non-null at this point due to validation above
      const token = finalGithubToken!
      // @ts-expect-error - github-scraper.mjs accepts string for token, but TypeScript infers wrong type
      repositoriesData = await scraperModule.scrapeGitHubProfile(githubUrl.trim(), token)
      
      // Add GitHub evidence to structured response
      structuredResponse.github_evidence = repositoriesData
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

    // If job specs provided, make second LLM call for job matching
    if (jobSpecs.length > 0) {
      // Build job specifications section dynamically
      const jobSpecsSection = jobSpecs.map((spec, index) => 
        `Job Specification ${index + 1}:\n${spec}`
      ).join('\n\n')

      const jobMatchingPrompt = `Compare the validated candidate skills against ${jobSpecs.length} job specification(s) and determine which role is a better fit.

Validated Candidate Skills (from GitHub validation):
${JSON.stringify(matchData.skill_breakdown, null, 2)}

${jobSpecsSection}

IMPORTANT RULES:
1. Do NOT re-evaluate GitHub evidence - trust the support_level from the validated candidate data
2. Extract required skills from each job specification
3. Compare against validated candidate skills using FLEXIBLE matching:
   - Exact matches: "React" matches "React" = 100% credit
   - Related/equivalent skills: "React" matches "Vue.js" or "Angular" (frontend frameworks) = 100% credit
   - Broader categories: "AWS" matches "Cloud computing" or "Azure" (cloud platforms) = 100% credit
   - Similar technologies: "PostgreSQL" matches "SQL" or "Database management" = 100% credit
   - Use semantic understanding to identify related skills, not just exact string matching
4. Weight skills by support_level:
   - directly_supported = highest weight (most reliable)
   - indirectly_supported = medium weight (somewhat reliable)
   - not_verifiable_via_github = lower weight (assume candidate has it if mentioned in CV)
5. Do NOT penalize non-code or certification skills
6. Calculate match scores (0-100) for each job based on skill overlap and support levels
7. Determine preferred_role based on which job has the highest match score
8. For the preferred_role, calculate skill_coverage_percentage:
   - Count how many required skills are matched (using flexible matching above)
   - Divide by total number of required skills
   - Express as percentage (0-100)
   - Example: If job requires 10 skills and candidate has 7 matches (exact or related), coverage = 70%

Return ONLY valid JSON with this exact schema:
{
  "preferred_role": string,
  "role_match_scores": {
    ${jobSpecs.map((_, index) => `"Job ${index + 1}": number`).join(',\n    ')}
  },
  "skill_coverage_percentage": number,
  "summary": string,
  "matched_skills": string[],
  "missing_skills": string[]
}

The preferred_role should be "Job 1", "Job 2", etc. (up to "Job ${jobSpecs.length}") based on which has the highest match score.
The skill_coverage_percentage should show what percentage of required skills for the preferred_role are covered (using flexible matching).
The summary should explain the match reasoning and highlight key strengths/gaps.
Return ONLY the JSON object, no other text.`

      const jobMatchingResult = await model.generateContent(jobMatchingPrompt)
      const jobMatchingResponse = await jobMatchingResult.response
      const jobMatchingText = jobMatchingResponse.text()

      // Extract JSON from job matching response
      let jobMatchingJsonText = jobMatchingText.trim()
      
      if (jobMatchingJsonText.startsWith('```json')) {
        jobMatchingJsonText = jobMatchingJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jobMatchingJsonText.startsWith('```')) {
        jobMatchingJsonText = jobMatchingJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Parse job matching JSON
      let jobMatchData
      try {
        jobMatchData = JSON.parse(jobMatchingJsonText)
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Failed to parse job matching LLM response' },
          { status: 500 }
        )
      }

      // Validate job matching schema
      if (!jobMatchData.preferred_role || typeof jobMatchData.preferred_role !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: missing or invalid preferred_role' },
          { status: 500 }
        )
      }

      if (!jobMatchData.role_match_scores || typeof jobMatchData.role_match_scores !== 'object') {
        return NextResponse.json(
          { error: 'Invalid response format: missing or invalid role_match_scores' },
          { status: 500 }
        )
      }

      // Validate each job score dynamically
      for (let i = 1; i <= jobSpecs.length; i++) {
        const jobName = `Job ${i}`
        if (typeof jobMatchData.role_match_scores[jobName] !== 'number' || 
            jobMatchData.role_match_scores[jobName] < 0 || 
            jobMatchData.role_match_scores[jobName] > 100) {
          return NextResponse.json(
            { error: `Invalid response format: ${jobName} match score must be a number between 0 and 100` },
            { status: 500 }
          )
        }
      }

      if (typeof jobMatchData.skill_coverage_percentage !== 'number' || 
          jobMatchData.skill_coverage_percentage < 0 || 
          jobMatchData.skill_coverage_percentage > 100) {
        return NextResponse.json(
          { error: 'Invalid response format: skill_coverage_percentage must be a number between 0 and 100' },
          { status: 500 }
        )
      }

      if (!jobMatchData.summary || typeof jobMatchData.summary !== 'string') {
        return NextResponse.json(
          { error: 'Invalid response format: missing or invalid summary' },
          { status: 500 }
        )
      }

      if (!Array.isArray(jobMatchData.matched_skills)) {
        return NextResponse.json(
          { error: 'Invalid response format: missing or invalid matched_skills array' },
          { status: 500 }
        )
      }

      if (!Array.isArray(jobMatchData.missing_skills)) {
        return NextResponse.json(
          { error: 'Invalid response format: missing or invalid missing_skills array' },
          { status: 500 }
        )
      }

      // Add job fit to structured response
      structuredResponse.job_fit = jobMatchData
      
      // Always include evidence validation (CV to GitHub match) even when job specs are provided
      structuredResponse.evidence_validation = matchData
      
      // Add match score to github_evidence for easy access
      if (structuredResponse.github_evidence) {
        structuredResponse.github_evidence.cv_match_score = matchData.match_score
        structuredResponse.github_evidence.cv_match_summary = matchData.summary
      }
      
      // Save structured response to files
      await saveStructuredResponse(structuredResponse)
      
      // Return complete structured response
      return NextResponse.json(structuredResponse)
    }

    // Add evidence validation to structured response (GitHub validation without jobs)
    structuredResponse.evidence_validation = matchData
    
    // Add match score to github_evidence for easy access
    if (structuredResponse.github_evidence) {
      structuredResponse.github_evidence.cv_match_score = matchData.match_score
      structuredResponse.github_evidence.cv_match_summary = matchData.summary
    }
    
    // Save structured response to files
    await saveStructuredResponse(structuredResponse)
    
    // Return structured response with CV claims, GitHub evidence, and evidence validation
    return NextResponse.json(structuredResponse)
  } catch (error) {
    console.error('Error processing resume:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while processing the resume' },
      { status: 500 }
    )
  }
}
