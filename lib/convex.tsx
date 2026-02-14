"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
