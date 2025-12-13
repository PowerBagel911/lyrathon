// src/server/api/routers/extract.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from 'pdf-parse';
import mammoth from "mammoth";

// Dynamically import scraper
const getScraper = async () =>
  await import("../../../../nguyn_self_learn/lib/github-scraper.mjs");

export const extractRouter = createTRPCRouter({
  extractCV: publicProcedure
    .input(
      z.object({
        cvFile: z.string(), // base64-encoded file
        cvFileType: z.string(), // MIME type
        cvFileName: z.string(),
        geminiKey: z.string(),
        githubUrl: z.string().optional(),
        jobSpecA: z.string().optional(),
        jobSpecB: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { cvFile, cvFileType, cvFileName, geminiKey, githubUrl, jobSpecA, jobSpecB } = input;
      if (!cvFile) throw new Error("CV file is required");
      if (!geminiKey || !geminiKey.trim()) throw new Error("Gemini API key is required");

      // Decode base64 file
      const buffer = Buffer.from(cvFile, "base64");
      let resumeText = "";
      if (cvFileType === "application/pdf") {
        const pdfData = await pdfParse(buffer);
        resumeText = pdfData.text;
      } else if (
        cvFileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        cvFileName.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({ buffer });
        resumeText = result.value;
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or DOCX file");
      }
      if (!resumeText || resumeText.trim().length === 0) throw new Error("Could not extract text from file");

      // Call Gemini
      const genAI = new GoogleGenerativeAI(geminiKey.trim());
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
      let extractedData;
      try {
        extractedData = JSON.parse(text);
      } catch {
        throw new Error("Failed to parse LLM response");
      }
      // (Validation omitted for brevity, but should be added)
      if (!githubUrl || !githubUrl.trim()) return extractedData;
      // Scrape GitHub
      const scraperModule = await getScraper();
      const repositoriesData = await scraperModule.scrapeGitHubProfile(githubUrl.trim());
      // LLM comparison
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
      const comparisonResult = await model.generateContent(comparisonPrompt);
      const comparisonResponse = await comparisonResult.response;
      let comparisonText = comparisonResponse.text().trim();
      if (comparisonText.startsWith("```json")) comparisonText = comparisonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      else if (comparisonText.startsWith("```")) comparisonText = comparisonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      let matchData;
      try {
        matchData = JSON.parse(comparisonText);
      } catch {
        throw new Error("Failed to parse LLM response");
      }
      // (Validation omitted for brevity)
      if ((jobSpecA && jobSpecA.trim()) || (jobSpecB && jobSpecB.trim())) {
        const jobMatchingPrompt = `Compare the validated candidate skills against two job specifications and determine which role is a better fit.

Validated Candidate Skills (from GitHub validation):
${JSON.stringify(matchData.skill_breakdown, null, 2)}

Job Specification A:
${jobSpecA?.trim() || 'Not provided'}

Job Specification B:
${jobSpecB?.trim() || 'Not provided'}

IMPORTANT RULES:
1. Do NOT re-evaluate GitHub evidence - trust the support_level from the validated candidate data
2. Extract required skills from each job specification
3. Compare against validated candidate skills
4. Weight skills by support_level:
   - directly_supported = highest weight (most reliable)
   - indirectly_supported = medium weight (somewhat reliable)
   - not_verifiable_via_github = lower weight (assume candidate has it if mentioned in CV)
5. Do NOT penalize non-code or certification skills
6. Calculate match scores (0-100) for each job based on skill overlap and support levels
7. Determine preferred_role based on which job has higher match score

Return ONLY valid JSON with this exact schema:
{
  "preferred_role": string,
  "role_match_scores": {
    "Job A": number,
    "Job B": number
  },
  "summary": string,
  "matched_skills": string[],
  "missing_skills": string[]
}

The preferred_role should be "Job A" or "Job B" based on which has the higher match score.
The summary should explain the match reasoning and highlight key strengths/gaps.
Return ONLY the JSON object, no other text.`
        const jobMatchingResult = await model.generateContent(jobMatchingPrompt);
        const jobMatchingResponse = await jobMatchingResult.response;
        let jobMatchingText = jobMatchingResponse.text().trim();
        if (jobMatchingText.startsWith("```json")) jobMatchingText = jobMatchingText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        else if (jobMatchingText.startsWith("```")) jobMatchingText = jobMatchingText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        let jobMatchData;
        try {
          jobMatchData = JSON.parse(jobMatchingText);
        } catch {
          throw new Error("Failed to parse job matching LLM response");
        }
        return { ...matchData, ...jobMatchData };
      }
      return matchData;
    }),
});
