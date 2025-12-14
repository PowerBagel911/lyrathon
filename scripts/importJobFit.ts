// scripts/importJobFit.ts
import "dotenv/config"; // make sure DATABASE_URL is loaded
import fs from "fs";
import path from "path";
import { db } from "../src/server/db/index.js";
import { jobFitAnalysis } from "../src/server/db/schema.js";

// ===== CONFIG =====
const APPLICANT_ID = "12c5a047-4dfa-45e6-a4d3-4d113ef24a71"; // placeholder
const INPUT_FILE = path.join(
  process.cwd(),
  "nguyn_self_learn/output/2025-12-14T03-53-37/job_fit.json"
); // adjust path as needed

// ==================
// Types for JSON file
type JobFitData = {
  preferred_role: string;
  role_match_scores: Record<string, number>;
  skill_coverage_percentage: number;
  summary: string;
  matched_skills: string[];
  missing_skills: string[];
};

async function main() {
  console.log("📥 Reading Job Fit analysis file...");

  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const parsed: JobFitData = JSON.parse(raw);

  console.log(`🔍 Importing job fit analysis for applicant: ${APPLICANT_ID}`);
  console.log(`   Preferred Role: ${parsed.preferred_role}`);
  console.log(`   Skill Coverage: ${parsed.skill_coverage_percentage}%`);

  await db.insert(jobFitAnalysis).values({
    applicantId: APPLICANT_ID,
    preferredRole: parsed.preferred_role,
    roleMatchScores: parsed.role_match_scores,
    skillCoveragePercentage: parsed.skill_coverage_percentage,
    summary: parsed.summary,
    matchedSkills: parsed.matched_skills,
    missingSkills: parsed.missing_skills
  });

  console.log("✅ Import complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
