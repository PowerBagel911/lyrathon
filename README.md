# BanhMi Bandit

**Stop chasing opportunities, Let them find you.**

BanhMi Bandit is an AI-powered recruitment platform that connects developers with companies by analyzing their actual code contributions and automatically matching them to roles where they'd make the biggest impact.

## Features

- **CV/Resume Analysis**: Extracts technical skills, projects, and certifications from PDF/DOCX resumes using Google Gemini AI
- **GitHub Profile Scraping**: Analyzes GitHub repositories to gather evidence of technical skills, including:
  - Repository languages
  - Dependencies and package files
  - Import statements
  - Recent commits
  - README excerpts
- **Evidence Validation**: Compares CV claims against GitHub evidence to calculate match scores and validate skill claims
- **Job Matching**: Matches candidates to job specifications with detailed match scores, skill coverage percentages, and gap analysis
- **Dual Interface**: Separate flows for recruiters and applicants

## Tech Stack

This project is built with the [T3 Stack](https://create.t3.gg/):

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[tRPC](https://trpc.io)** - End-to-end typesafe APIs
- **[Drizzle ORM](https://orm.drizzle.team)** - TypeScript ORM for PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** - Database
- **[Tailwind CSS](https://tailwindcss.com)** - Styling
- **[Google Gemini AI](https://ai.google.dev/)** - AI-powered analysis
- **[GitHub API](https://docs.github.com/en/rest)** - Repository scraping

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (for local PostgreSQL database)
- Google Gemini API key
- GitHub Personal Access Token (optional, but recommended for higher rate limits)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lyrathon
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Start PostgreSQL with Docker
docker-compose up -d
```

4. Create a `.env` file (see `.env.example` for reference):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
GEMINI_API_KEY="your-gemini-api-key"
GITHUB_API_KEY="your-github-token" # Optional but recommended
```

5. Push the database schema:
```bash
npm run db:push
```

6. (Optional) Populate with mock data:
```bash
npx tsx --env-file=.env scripts/populateMockData.ts
```

7. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── applicant/         # Applicant-facing pages
│   ├── recruiter/         # Recruiter-facing pages
│   ├── api/               # API routes
│   │   └── extract/       # CV extraction and analysis endpoint
│   └── main/              # Landing page
├── server/
│   ├── api/               # tRPC routers
│   └── db/
│       └── schema.ts      # Drizzle database schema
├── lib/
│   └── github-scraper.mjs # GitHub profile scraping logic
└── trpc/                  # tRPC client setup
```

## Database Schema

The application uses the following main entities:

- **Companies** - Company information
- **Jobs** - Job postings with required skills
- **Applicants** - Candidate information and resumes
- **Applications** - Application records linking applicants to companies
- **Repositories** - GitHub repository evidence data
- **CV Claims** - Extracted skills, projects, and certifications from resumes
- **Evidence Validation** - CV vs GitHub comparison results
- **Job Fit Analysis** - Candidate-to-job matching scores and analysis

## API Endpoints

### POST `/api/extract`

Extracts data from CV/resume and optionally analyzes GitHub profile and matches to jobs.

**Request (FormData):**
- `cv` - PDF or DOCX file
- `githubUrl` - (Optional) GitHub profile URL
- `geminiKey` - (Optional) Gemini API key (falls back to env var)
- `githubToken` - (Optional) GitHub token (falls back to env var)
- `jobCount` - Number of job specifications
- `jobSpec1`, `jobSpec2`, ... - Job specification texts
- `jobTitle1`, `jobTitle2`, ... - Job titles

**Response:**
```json
{
  "cv_claims": {
    "skills": [...],
    "projects": [...],
    "certifications": [...]
  },
  "github_evidence": {...},
  "evidence_validation": {
    "match_score": 85,
    "summary": "...",
    "skill_breakdown": [...]
  },
  "job_fit": {
    "preferred_role": "...",
    "role_match_scores": {...},
    "skill_coverage_percentage": 75,
    "matched_skills": [...],
    "missing_skills": [...]
  }
}
```

## Available Scripts

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build for production and push database schema
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format:write` - Format code with Prettier

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [T3 Stack Documentation](https://create.t3.gg/)

## License

[Add your license here]
