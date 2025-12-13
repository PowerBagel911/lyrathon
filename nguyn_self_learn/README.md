# CV to JSON Extractor with GitHub Matching

A minimal Next.js web application that extracts technical skills, projects, and certifications from PDF/DOCX resumes and optionally matches them against GitHub repositories.

## Features

- Extract skills, projects, and certifications from PDF or DOCX resumes
- Optional GitHub profile matching to validate CV claims
- Skills categorization (code, tool, networking, certification)
- Match score based on code-evidence alignment

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

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

1. **Upload Resume**: Select a PDF or DOCX file (max 5MB)
2. **Enter Gemini API Key**: Provide your Gemini API key
3. **GitHub Profile URL** (optional): Enter a GitHub profile URL to match CV claims against repositories
4. **Click Extract**: Process the resume and optionally match against GitHub

### Output

- **Without GitHub URL**: Returns extracted skills, projects, and certifications in JSON format
- **With GitHub URL**: Returns match score (0-100%), summary, and detailed skill breakdown with support levels

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

## Notes

- The application does not store any data or API keys
- GitHub scraping uses the GitHub API (rate limits apply)
- Match scores are based only on code-category skills
- Non-code skills (tools, networking, certifications) are not penalized in scoring

