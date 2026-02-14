import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = params.email;
        if (typeof email !== "string" || !email) {
          throw new Error("Email is required");
        }
        const profile: {
          email: string;
          name?: string;
          role?: "admin" | "supervisor" | "viewer";
          companyId?: Id<"companies">;
        } = { email };
        if (typeof params.name === "string") profile.name = params.name;
        if (params.role === "admin" || params.role === "supervisor" || params.role === "viewer") {
          profile.role = params.role;
        }
        if (typeof params.companyId === "string") {
          profile.companyId = params.companyId as Id<"companies">;
        }
        return profile;
      },
    }),
  ],
});
