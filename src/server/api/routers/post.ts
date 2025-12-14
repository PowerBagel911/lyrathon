import { z } from "zod";
import { sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { companies } from "~/server/db/schema";

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
});
