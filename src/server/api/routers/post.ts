import { z } from "zod";
import { sql, eq, and } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { 
  companies, 
  jobs, 
  applicants, 
  applications,
  cvClaims,
  repositories,
  evidenceValidation,
  jobFitAnalysis
} from "~/server/db/schema";

// Helper function to remove null bytes from strings (PostgreSQL doesn't allow 0x00 in text fields)
function sanitizeString(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\0/g, '');
}

// Helper function to recursively sanitize JSONB objects and arrays
function sanitizeJsonb(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeJsonb);
  }
  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeJsonb(val);
    }
    return sanitized;
  }
  return value;
}

export const postRouter = createTRPCRouter({
  // Fetch company names, optionally filtered by search string
  getCompanyNames: publicProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || "";
      
      if (!search) {
        // Return all companies if no search
        const result = await ctx.db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .limit(50);
        return result;
      }
      
      // Case-insensitive search
      const result = await ctx.db
        .select({ id: companies.id, name: companies.name })
        .from(companies)
        .where(sql`LOWER(${companies.name}) LIKE LOWER(${`%${search}%`})`)
        .limit(50);
      
      return result;
    }),

  // Get a company by name (case-insensitive)
  getCompanyByName: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const companyName = input.name.trim();
      
      // Check if company exists
      const [company] = await ctx.db
        .select()
        .from(companies)
        .where(sql`LOWER(${companies.name}) = LOWER(${companyName})`)
        .limit(1);
      
      return company ?? null;
    }),

  // Get company by ID
  getCompanyById: publicProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [company] = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);
      
      return company ?? null;
    }),

  // Get all companies with optional search
  getAllCompanies: publicProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || "";
      
      if (!search) {
        // Return all companies
        const result = await ctx.db
          .select()
          .from(companies)
          .orderBy(companies.name);
        return result;
      }
      
      // Case-insensitive search on name and description
      const result = await ctx.db
        .select()
        .from(companies)
        .where(
          sql`LOWER(${companies.name}) LIKE LOWER(${`%${search}%`}) OR LOWER(${companies.description}) LIKE LOWER(${`%${search}%`})`
        )
        .orderBy(companies.name);
      
      return result;
    }),

  // Create a new company
  createCompany: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        website: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if company with same name already exists (case-insensitive)
      const [existingCompany] = await ctx.db
        .select()
        .from(companies)
        .where(sql`LOWER(${companies.name}) = LOWER(${input.name.trim()})`)
        .limit(1);

      if (existingCompany) {
        throw new Error("A company with this name already exists.");
      }

      // Validate and process website - add http:// if no protocol is provided
      let websiteValue: string | null = null;
      if (input.website && input.website.trim()) {
        let websiteUrl = input.website.trim();
        
        // Add http:// if no protocol is provided
        if (!websiteUrl.match(/^https?:\/\//i)) {
          websiteUrl = `http://${websiteUrl}`;
        }
        
        try {
          // Validate URL format
          new URL(websiteUrl);
          websiteValue = websiteUrl;
        } catch {
          throw new Error("Invalid website URL format.");
        }
      }

      // Create new company
      const [newCompany] = await ctx.db
        .insert(companies)
        .values({
          name: input.name.trim(),
          website: websiteValue,
          description: (input.description && input.description.trim()) || null,
        })
        .returning();

      return newCompany!;
    }),

  // Get all jobs for a specific company
  getJobsByCompany: publicProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(jobs)
        .where(eq(jobs.companyId, input.companyId))
        .orderBy(jobs.createdAt);
      
      return result;
    }),

  // Create a new job
  createJob: publicProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        requiredSkills: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newJob] = await ctx.db
        .insert(jobs)
        .values({
          companyId: input.companyId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          requiredSkills: input.requiredSkills,
        })
        .returning();

      return newJob!;
    }),

  // Update an existing job
  updateJob: publicProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        requiredSkills: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedJob] = await ctx.db
        .update(jobs)
        .set({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          requiredSkills: input.requiredSkills,
        })
        .where(eq(jobs.id, input.jobId))
        .returning();

      return updatedJob!;
    }),

  // Delete a job
  deleteJob: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(jobs)
        .where(eq(jobs.id, input.jobId));

      return { success: true };
    }),

  // Create application (create applicant if needed, then application)
  createApplication: publicProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        email: z.string().email(),
        name: z.string().optional(),
        githubUrl: z.string().url(),
        resumeText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if applicant exists by email
      const [existingApplicant] = await ctx.db
        .select()
        .from(applicants)
        .where(eq(applicants.email, input.email))
        .limit(1);

      let applicantId: string;
      
      if (existingApplicant) {
        // Update existing applicant
        const [updated] = await ctx.db
          .update(applicants)
          .set({
            name: input.name || existingApplicant.name,
            githubUrl: input.githubUrl,
            resumeText: input.resumeText || existingApplicant.resumeText,
          })
          .where(eq(applicants.id, existingApplicant.id))
          .returning();
        applicantId = updated!.id;
      } else {
        // Create new applicant
        const [newApplicant] = await ctx.db
          .insert(applicants)
          .values({
            email: input.email,
            name: input.name || null,
            githubUrl: input.githubUrl,
            resumeText: input.resumeText || null,
          })
          .returning();
        applicantId = newApplicant!.id;
      }

      // Create application
      const [newApplication] = await ctx.db
        .insert(applications)
        .values({
          applicantId,
          companyId: input.companyId,
          status: "pending",
        })
        .returning();

      return { application: newApplication!, applicantId };
    }),

  // Store application analysis results (called after /api/extract)
  storeApplicationAnalysis: publicProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        analysisResult: z.any(), // Accept any structure from route.ts
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { applicationId, analysisResult } = input;

      // Store results in normalized tables
      // 1. CV Claims
      if (analysisResult.cv_claims) {
        await ctx.db.insert(cvClaims).values({
          applicationId,
          skills: sanitizeJsonb(analysisResult.cv_claims.skills || []),
          projects: sanitizeJsonb(analysisResult.cv_claims.projects || []),
          certifications: sanitizeJsonb(analysisResult.cv_claims.certifications || []),
        });
      }

      // 2. GitHub Repositories
      if (analysisResult.github_evidence?.data) {
        for (const repoData of analysisResult.github_evidence.data) {
          await ctx.db.insert(repositories).values({
            applicationId,
            repoName: sanitizeString(repoData.repo?.name || ''),
            repoUrl: sanitizeString(repoData.repo?.url || ''),
            isFork: repoData.repo?.fork || false,
            pushedAt: repoData.repo?.pushed_at ? new Date(repoData.repo.pushed_at) : null,
            languages: sanitizeJsonb(repoData.evidence?.languages) || null,
            rootFiles: sanitizeJsonb(repoData.evidence?.root_files) || null,
            dependencies: sanitizeJsonb(repoData.evidence?.dependencies) || null,
            imports: sanitizeJsonb(repoData.evidence?.imports) || null,
            recentCommits: sanitizeJsonb(repoData.evidence?.recent_commits) || null,
            readmeExcerpt: sanitizeString(repoData.evidence?.readme_excerpt) || null,
          });
        }
      }

      // 3. Evidence Validation
      if (analysisResult.evidence_validation) {
        await ctx.db.insert(evidenceValidation).values({
          applicationId,
          matchScore: analysisResult.evidence_validation.match_score || 0,
          summary: sanitizeString(analysisResult.evidence_validation.summary || ''),
          skillBreakdown: sanitizeJsonb(analysisResult.evidence_validation.skill_breakdown || []),
        });
      }

      // 4. Job Fit Analysis
      if (analysisResult.job_fit) {
        await ctx.db.insert(jobFitAnalysis).values({
          applicationId,
          preferredRole: sanitizeString(analysisResult.job_fit.preferred_role || ''),
          roleMatchScores: sanitizeJsonb(analysisResult.job_fit.role_match_scores || {}),
          skillCoveragePercentage: analysisResult.job_fit.skill_coverage_percentage || 0,
          summary: sanitizeString(analysisResult.job_fit.summary || ''),
          matchedSkills: sanitizeJsonb(analysisResult.job_fit.matched_skills || []),
          missingSkills: sanitizeJsonb(analysisResult.job_fit.missing_skills || []),
        });
      }

      return { success: true };
    }),

  // Get all applications for a company (for Who Applied page)
  getApplicationsByCompany: publicProcedure
    .input(z.object({ companyId: z.string().uuid(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const statusFilter = input.status || "pending";
      
      const result = await ctx.db
        .select({
          application: applications,
          applicant: applicants,
        })
        .from(applications)
        .innerJoin(applicants, eq(applications.applicantId, applicants.id))
        .where(
          and(
            eq(applications.companyId, input.companyId),
            eq(applications.status, statusFilter)
          )
        )
        .orderBy(applications.appliedAt);

      return result.map((row) => ({
        id: row.application.id,
        appliedAt: row.application.appliedAt,
        applicant: row.applicant,
        status: row.application.status,
      }));
    }),

  // Drop an application (delete it)
  dropApplication: publicProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(applications)
        .where(eq(applications.id, input.applicationId));

      return { success: true };
    }),

  // Proceed with an application (mark as proceeded)
  proceedApplication: publicProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(applications)
        .set({ status: "proceeded" })
        .where(eq(applications.id, input.applicationId))
        .returning();

      return updated!;
    }),

  // Get full analysis for an application
  getApplicationAnalysis: publicProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [cvClaim] = await ctx.db
        .select()
        .from(cvClaims)
        .where(eq(cvClaims.applicationId, input.applicationId))
        .limit(1);

      const repos = await ctx.db
        .select()
        .from(repositories)
        .where(eq(repositories.applicationId, input.applicationId));

      const [evidence] = await ctx.db
        .select()
        .from(evidenceValidation)
        .where(eq(evidenceValidation.applicationId, input.applicationId))
        .limit(1);

      const [jobFit] = await ctx.db
        .select()
        .from(jobFitAnalysis)
        .where(eq(jobFitAnalysis.applicationId, input.applicationId))
        .limit(1);

      return {
        cvClaims: cvClaim || null,
        repositories: repos,
        evidenceValidation: evidence || null,
        jobFitAnalysis: jobFit || null,
      };
    }),
});
