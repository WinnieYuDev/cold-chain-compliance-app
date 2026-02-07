import { v } from "convex/values";
import { query } from "./_generated/server";

export const listFacilities = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("facilities"),
      name: v.string(),
      region: v.string(),
      type: v.string(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("facilities").collect();
  },
});
