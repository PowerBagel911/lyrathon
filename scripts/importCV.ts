// scripts/importCV.ts
import "dotenv/config"; // make sure DATABASE_URL is loaded
import fs from "fs";
import path from "path";
import { db } from "../src/server/db/index.js";
import { applicantCV } from "../src/server/db/schema.js";

// ===== CONFIG =====
const APPLICANT_ID = "3c761ae0-5d2a-4e39-b89e-d805efb53eed"; // placeholder
const INPUT_FILE = path.join(process.cwd(), "extractedData.json"); // adjust path as needed

// ==================
// Types for JSON file
interface Skill {
  name: string;
  category: string;
  mention_count: number;
}

interface Project {
  name: string;
  technologies: string[];
}

interface CVData {
  skills: Skill[];
  projects: Project[];
  certifications: string[];
}

async function main() {
  console.log("📥 Reading extracted CV file...");

  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const parsed: CVData = JSON.parse(raw);

  console.log(`🔍 Found ${parsed.skills.length} skills, ${parsed.projects.length} projects, ${parsed.certifications.length} certifications`);

  await db.insert(applicantCV).values({
    applicantId: APPLICANT_ID,
    skills: parsed.skills,
    projects: parsed.projects,
    certifications: parsed.certifications,
  });

  console.log("✅ CV import complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ CV import failed:", err);
  process.exit(1);
});
