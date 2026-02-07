import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F172A",
        accent: "#2563EB",
        warning: "#F59E0B",
        danger: "#DC2626",
        success: "#16A34A",
      },
    },
  },
  plugins: [],
};
export default config;
