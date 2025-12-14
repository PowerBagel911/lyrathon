// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  real
} from "drizzle-orm/pg-core";

/* =======================
   Companies
   ======================= */
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   Jobs
   ======================= */
export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),

  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),

  title: text("title").notNull(),
  description: text("description"),

  // Simple skill list for matching & LLM input
  requiredSkills: jsonb("required_skills").notNull(),
  // Example: ["react", "node", "postgres"]

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   Applicants
   ======================= */
export const applicants = pgTable("applicants", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: text("email").notNull(),
  name: text("name"),
  githubUrl: text("github_url"),
  resumeText: text("resume_text"),     // extracted CV text
  resumeStruct: jsonb("resume_struct"), // optional parsed CV

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   Applications
   ======================= */
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  applicantId: uuid("applicant_id")
    .references(() => applicants.id)
    .notNull(),
  
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  
  appliedAt: timestamp("applied_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   Repositories (GitHub evidence)
   ======================= */
export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),

  applicationId: uuid("application_id")
    .references(() => applications.id)
    .notNull(),

  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  isFork: boolean("is_fork").notNull(),
  pushedAt: timestamp("pushed_at", { withTimezone: true }),

  languages: jsonb("languages"),
  rootFiles: jsonb("root_files"),
  dependencies: jsonb("dependencies"),
  imports: jsonb("imports"),
  recentCommits: jsonb("recent_commits"),
  readmeExcerpt: text("readme_excerpt"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   CV Claims (extracted from resume)
   ======================= */
export const cvClaims = pgTable("cv_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  applicationId: uuid("application_id")
    .references(() => applications.id)
    .notNull(),
  
  // Array of skill objects: { name: string, category: string, mention_count: number }
  skills: jsonb("skills").notNull(),
  // Array of project objects: { name: string, technologies: string[] }
  projects: jsonb("projects").notNull(),
  // Array of certification strings
  certifications: jsonb("certifications").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   Evidence Validation (CV vs GitHub comparison)
   ======================= */
export const evidenceValidation = pgTable("evidence_validation", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  applicationId: uuid("application_id")
    .references(() => applications.id)
    .notNull(),
  
  matchScore: real("match_score").notNull(), // 0-100
  summary: text("summary").notNull(),
  // Array of: { skill: string, category: string, support_level: string, notes: string }
  skillBreakdown: jsonb("skill_breakdown").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

/* =======================
   Job Fit Analysis (candidate vs job specs)
   ======================= */
export const jobFitAnalysis = pgTable("job_fit_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  applicationId: uuid("application_id")
    .references(() => applications.id)
    .notNull(),
  
  preferredRole: text("preferred_role").notNull(),
  // Object: { "Job 1": number, "Job 2": number, ... }
  roleMatchScores: jsonb("role_match_scores").notNull(),
  skillCoveragePercentage: real("skill_coverage_percentage").notNull(), // 0-100
  summary: text("summary").notNull(),
  // Array of matched skill strings
  matchedSkills: jsonb("matched_skills").notNull(),
  // Array of missing skill strings
  missingSkills: jsonb("missing_skills").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});
