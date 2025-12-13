import "dotenv/config";
import { db } from "../src/server/db/index.js";
import { companies, jobs, applicants } from "../src/server/db/schema.js";

async function main() {
  console.log("📦 Starting to populate mock data...\n");

  try {
    // 1️⃣ Insert Companies
    console.log("Inserting companies...");
    const companyData = [
      {
        name: "TechNova Inc.",
        website: "https://technova.com",
        description: "AI-driven solutions for the modern enterprise.",
      },
      {
        name: "NextGen Web",
        website: "https://nextgenweb.io",
        description: "Building scalable web applications for startups.",
      },
      {
        name: "CloudSphere",
        website: "https://cloudsphere.ai",
        description: "Cloud infrastructure and AI services.",
      },
    ];

    const insertedCompanies = await db
      .insert(companies)
      .values(companyData)
      .returning();
    
    console.log(`✅ Inserted ${insertedCompanies.length} companies\n`);

    // 2️⃣ Insert Jobs
    console.log("Inserting jobs...");
    const jobData = [
      {
        companyId: insertedCompanies[0]!.id,
        title: "Frontend Engineer",
        description: "Work on React/Next.js front-end applications.",
        requiredSkills: ["React", "TypeScript", "Next.js"],
      },
      {
        companyId: insertedCompanies[0]!.id,
        title: "Backend Engineer",
        description: "Design and maintain APIs and databases.",
        requiredSkills: ["Node.js", "PostgreSQL", "Docker"],
      },
      {
        companyId: insertedCompanies[1]!.id,
        title: "Fullstack Developer",
        description: "Work across front-end and back-end systems.",
        requiredSkills: ["React", "Node.js", "GraphQL"],
      },
      {
        companyId: insertedCompanies[2]!.id,
        title: "Cloud Engineer",
        description: "Manage cloud infrastructure and AI deployments.",
        requiredSkills: ["AWS", "Terraform", "Python"],
      },
      {
        companyId: insertedCompanies[2]!.id,
        title: "AI Researcher",
        description: "Develop machine learning models and pipelines.",
        requiredSkills: ["Python", "PyTorch", "ML"],
      },
    ];

    const insertedJobs = await db.insert(jobs).values(jobData).returning();
    console.log(`✅ Inserted ${insertedJobs.length} jobs\n`);

    // 3️⃣ Insert Applicants
    console.log("Inserting applicants...");
    const applicantData = [
      {
        name: "Alice Nguyen",
        email: "alice.nguyen@example.com",
        githubUrl: "https://github.com/alicenguyen",
        resumeText: "Frontend developer with 5 years of experience in React, TypeScript, and Next.js. Built multiple production applications.",
      },
      {
        name: "Bob Tran",
        email: "bob.tran@example.com",
        githubUrl: "https://github.com/bobtran",
        resumeText: "Fullstack developer experienced in Node.js, React, and GraphQL. Strong background in API design.",
      },
      {
        name: "Charlie Pham",
        email: "charlie.pham@example.com",
        githubUrl: "https://github.com/charliepham",
        resumeText: "Cloud engineer with experience in AWS, Terraform, and Python. Specialized in infrastructure automation.",
      },
      {
        name: "Dana Le",
        email: "dana.le@example.com",
        githubUrl: "https://github.com/danale",
        resumeText: "Backend engineer skilled in Node.js, PostgreSQL, and Docker. Expert in database optimization.",
      },
      {
        name: "Evan Hoang",
        email: "evan.hoang@example.com",
        githubUrl: "https://github.com/evanhoang",
        resumeText: "AI researcher experienced in Python, PyTorch, and ML. Published research in computer vision.",
      },
    ];

    const insertedApplicants = await db
      .insert(applicants)
      .values(applicantData)
      .returning();
    
    console.log(`✅ Inserted ${insertedApplicants.length} applicants\n`);

    console.log("🎉 Mock data population complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error populating mock data:", error);
    process.exit(1);
  }
}

main();
