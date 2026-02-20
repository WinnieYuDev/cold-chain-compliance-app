import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex";

const GlobalChat = dynamic(
  () => import("@/components/GlobalChat").then((m) => ({ default: m.GlobalChat })),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ThermoGuard — Cold Chain Compliance",
  description: "ThermoGuard helps companies that ship food and pharmaceuticals monitor cold chain compliance, detect excursions, and maintain audit-ready records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ConvexClientProvider>
          {children}
          <GlobalChat />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
