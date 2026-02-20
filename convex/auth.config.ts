// JWT_PRIVATE_KEY and JWKS must be set in Convex dashboard (see Convex Auth manual).
// domain: CONVEX_SITE_URL is auto-set by Convex; SITE_URL fallback for compatibility.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL ?? process.env.SITE_URL,
      applicationID: "convex",
    },
  ],
};
