import { z } from "zod";
import { sql, eq } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { companies, jobs } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  // Fetch company names, optionally filtered by search string
  getCompanyNames: publicProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || "";
      
      if (!search) {
        // Return all company names if no search
        const result = await ctx.db
          .select({ name: companies.name })
          .from(companies)
          .limit(50);
        return result.map((row) => row.name);
      }
      
      // Case-insensitive search
      const result = await ctx.db
        .select({ name: companies.name })
        .from(companies)
        .where(sql`LOWER(${companies.name}) LIKE LOWER(${`%${search}%`})`)
        .limit(50);
      
      return result.map((row) => row.name);
    }),

  // Get or create a company by name
  getOrCreateCompany: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const companyName = input.name.trim();
      
      // Check if company already exists
      const existing = await ctx.db
        .select()
        .from(companies)
        .where(sql`LOWER(${companies.name}) = LOWER(${companyName})`)
        .limit(1);
      
      if (existing.length > 0) {
        return existing[0]!;
      }
      
      // Create new company
      const [newCompany] = await ctx.db
        .insert(companies)
        .values({ name: companyName })
        .returning();
      
      return newCompany!;
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
});
