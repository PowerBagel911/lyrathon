# CV to JSON Extractor with GitHub Matching & Job Matching

A minimal Next.js web application that extracts technical skills, projects, and certifications from PDF/DOCX resumes, validates them against GitHub repositories, and matches candidates to job specifications.

## Features

- **CV Extraction**: Extract skills, projects, and certifications from PDF or DOCX resumes
- **Skills Categorization**: Automatically categorizes skills as code, tool, networking, or certification
- **GitHub Validation**: Optional GitHub profile matching to validate CV claims with evidence
- **Support Level Classification**: Skills are classified as directly_supported, indirectly_supported, or not_verifiable_via_github
- **Match Scoring**: Match score based on code-evidence alignment (0-100%)
- **Job Matching**: Compare candidate against two job specifications to determine best fit
- **Recruiter Tools**: See which job a candidate fits better and how strong that fit is

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- **Gemini API key** (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))
- **GitHub Personal Access Token** (optional but recommended for GitHub validation - get one from [GitHub Settings](https://github.com/settings/tokens))

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Basic CV Extraction

1. **Upload Resume**: Select a PDF or DOCX file (max 5MB)
2. **Enter Gemini API Key**: Provide your Gemini API key
3. **Click Extract**: Process the resume and get extracted skills, projects, and certifications in JSON format

### GitHub Validation (Optional)

1. Follow steps 1-2 from Basic CV Extraction
2. **GitHub Profile URL**: Enter a GitHub profile URL (e.g., `https://github.com/username`)
3. **GitHub Token** (optional): Set `GITHUB_TOKEN` environment variable or provide via `.env` file for higher rate limits
4. **Click Extract**: The app will:
   - Scrape the GitHub profile repositories
   - Validate CV claims against GitHub evidence
   - Return match score (0-100%) and detailed skill breakdown

### Job Matching (Optional)

1. Follow steps for GitHub Validation (recommended for best results)
2. **Job Specification A**: Paste the first job description in the textarea
3. **Job Specification B**: Paste the second job description in the textarea
4. **Click Extract**: The app will:
   - Use validated candidate skills from GitHub validation
   - Compare against both job specifications
   - Return preferred role, match scores for each job, and skill analysis

### Output Formats

- **CV Extraction Only**: Returns extracted skills (with category and mention_count), projects, and certifications in JSON format
- **With GitHub URL**: Returns GitHub validation results including:
  - Match score (0-100%)
  - Summary explaining validation results
  - Skill breakdown with support levels (directly_supported, indirectly_supported, not_verifiable_via_github)
  - Notes for each skill explaining the evidence
- **With Job Specs**: Additionally returns job matching results:
  - Preferred role (Job A or Job B)
  - Match scores for each job (0-100%)
  - Summary explaining the match reasoning
  - Matched skills list
  - Missing skills list

## Project Structure

```
nguyn_self_learn/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts      # API endpoint for CV extraction and matching
│   ├── page.tsx               # Main frontend page
│   └── layout.tsx             # Root layout
├── lib/
│   └── github-scraper.mjs     # GitHub profile scraper
└── scrape.mjs                 # Standalone GitHub scraper script
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run scrape` - Run standalone GitHub scraper (see scrape.mjs)

## How It Works

### CV Extraction
- Extracts text from PDF or DOCX files
- Uses Gemini AI to identify explicit technical skills, projects, and certifications
- Categorizes each skill (code, tool, networking, certification)
- Counts how many times each skill appears in the CV

### GitHub Validation
- Scrapes GitHub repositories using the GitHub API
- Extracts evidence from:
  - Repository languages
  - Dependencies (package.json, requirements.txt, etc.)
  - Import statements
  - README content
  - Project descriptions
- Classifies skills by evidence strength:
  - **directly_supported**: Explicit evidence found
  - **indirectly_supported**: Proxy evidence (related libraries, similar tech)
  - **not_verifiable_via_github**: No evidence found
- **Scoring**: Only code-category skills affect the match score
  - directly_supported = 100% credit
  - indirectly_supported = 50% credit
  - not_verifiable_via_github = 0% credit

### Job Matching
- Extracts required skills from job specifications
- Compares against validated candidate skills
- Weights skills by GitHub support level (more reliable evidence = higher weight)
- Calculates match scores for each job
- Identifies matched and missing skills

## Notes

- **Privacy**: The application does not store any data or API keys
- **GitHub API**: 
  - Without token: 60 requests/hour (unauthenticated)
  - With token: 5000 requests/hour (authenticated)
  - Set `GITHUB_TOKEN` in environment or `.env` file
- **Scoring Rules**:
  - Match scores are based only on code-category skills
  - Non-code skills (tools, networking, certifications) are not penalized in scoring
  - Job matching considers support levels from GitHub validation
- **File Limits**: Maximum file size is 5MB
- **API Keys**: 
  - Gemini API key is required for all operations
  - GitHub token is optional but recommended for better rate limits

