import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // MediaCloud brand palette - premium enterprise SaaS feel.
        // Deep indigo/navy as primary, with a violet accent.
        // Swap these once final brand colors are approved.
        brand: {
          50: "#f2f4ff",
          100: "#e5e9ff",
          200: "#c4cbff",
          300: "#9ca6ff",
          400: "#6f77f5",
          500: "#4b4fdb",
          600: "#3a3bb8",
          700: "#2f2f93",
          800: "#26256f",
          900: "#181752",
          950: "#0d0c30",
        },
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b6b6c0",
          400: "#8c8c9c",
          500: "#6d6d80",
          600: "#565669",
          700: "#464655",
          800: "#2c2c38",
          900: "#1a1a22",
          950: "#0e0e13",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 4px 24px -8px rgba(13,12,48,0.12)",
        card: "0 1px 2px rgba(13,12,48,0.06), 0 8px 24px -12px rgba(13,12,48,0.10)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
