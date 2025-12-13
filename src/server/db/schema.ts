// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb
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
   Repositories (existing)
   ======================= */
export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),

  applicantId: uuid("applicant_id")
    .references(() => applicants.id)
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

  rawEvidence: jsonb("raw_evidence"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});
