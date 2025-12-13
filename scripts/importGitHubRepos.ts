// scripts/importGithubRepos.ts
import "dotenv/config"; // make sure DATABASE_URL is loaded
import fs from "fs";
import path from "path";
import { db } from "../src/server/db/index.js";
import { repositories } from "../src/server/db/schema.js";

// ===== CONFIG =====
const APPLICANT_ID = "3c761ae0-5d2a-4e39-b89e-d805efb53eed"; // placeholder
const INPUT_FILE = path.join(process.cwd(), "test.json"); // adjust path

// ==================
// Types for JSON file
type GithubScan = {
  type: string;
  data: RepoEntry[];
};

type RepoEntry = {
  repo: {
    name: string;
    url: string;
    fork: boolean;
    pushed_at: string;
  };
  evidence: {
    languages: Record<string, number>;
    root_files: string[];
    dependencies: string[] | null;
    imports: string[] | null;
    recent_commits: {
      author: string;
      date: string;
      message: string;
    }[];
  };
};

async function main() {
  console.log("📥 Reading GitHub scan file...");

  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const parsed: GithubScan = JSON.parse(raw);

  if (parsed.type !== "repositories") {
    throw new Error("Invalid input file: expected type='repositories'");
  }

  console.log(`🔍 Found ${parsed.data.length} repositories`);

  for (const entry of parsed.data) {
    const { repo, evidence } = entry;

    console.log(`➡️  Importing repo: ${repo.name}`);

    await db.insert(repositories).values({
      applicantId: APPLICANT_ID,
      repoName: repo.name,
      repoUrl: repo.url,
      isFork: repo.fork,
      pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      languages: evidence.languages,
      rootFiles: evidence.root_files,
      dependencies: evidence.dependencies,
      imports: evidence.imports,
      recentCommits: evidence.recent_commits,
      rawEvidence: evidence
    });
  }

  console.log("✅ Import complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
