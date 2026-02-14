import { v } from "convex/values";
import { mutation } from "./_generated/server";

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Create a company (e.g. during registration). Returns the new company id. */
export const createCompany = mutation({
  args: { name: v.string() },
  returns: v.id("companies"),
  handler: async (ctx, args) => {
    const slug = slugFromName(args.name) || "company";
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      // Ensure unique slug by appending a short random suffix if needed
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
      const id = await ctx.db.insert("companies", {
        name: args.name.trim(),
        slug: uniqueSlug,
        createdAt: Date.now(),
      });
      return id;
    }
    return await ctx.db.insert("companies", {
      name: args.name.trim(),
      slug,
      createdAt: Date.now(),
    });
  },
});
