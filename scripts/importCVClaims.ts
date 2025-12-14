// scripts/importCVClaims.ts
import "dotenv/config"; // make sure DATABASE_URL is loaded
import fs from "fs";
import path from "path";
import { db } from "../src/server/db/index.js";
import { cvClaims } from "../src/server/db/schema.js";

// ===== CONFIG =====
const APPLICANT_ID = "12c5a047-4dfa-45e6-a4d3-4d113ef24a71"; // placeholder
const INPUT_FILE = path.join(
  process.cwd(),
  "nguyn_self_learn/output/2025-12-14T03-53-37/cv_claims.json"
); // adjust path as needed

// ==================
// Types for JSON file
type Skill = {
  name: string;
  category: string;
  mention_count: number;
};

type Project = {
  name: string;
  technologies: string[];
};

type CVClaimsData = {
  skills: Skill[];
  projects: Project[];
  certifications: string[];
};

async function main() {
  console.log("📥 Reading CV Claims file...");

  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const parsed: CVClaimsData = JSON.parse(raw);

  console.log(`🔍 Importing CV claims for applicant: ${APPLICANT_ID}`);
  console.log(`   Skills: ${parsed.skills.length}`);
  console.log(`   Projects: ${parsed.projects.length}`);
  console.log(`   Certifications: ${parsed.certifications.length}`);

  await db.insert(cvClaims).values({
    applicantId: APPLICANT_ID,
    skills: parsed.skills,
    projects: parsed.projects,
    certifications: parsed.certifications
  });

  console.log("✅ Import complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
