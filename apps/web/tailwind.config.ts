import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--bg-paper)",
        surface: {
          DEFAULT: "var(--surface)",
          sage: "var(--surface-sage)",
        },
        brand: {
          deep: "var(--brand-deep)",
          evergreen: "var(--brand-evergreen)",
        },
        accent: {
          lime: "var(--accent-lime)",
        },
        charcoal: "var(--text-charcoal)",
        muted: "var(--text-muted)",
        border: "var(--border)",
        caution: {
          peach: "var(--caution-peach)",
          text: "var(--caution-text)",
        },
        success: {
          bg: "var(--success-bg)",
          text: "var(--success-text)",
        },
        error: {
          bg: "var(--error-bg)",
          text: "var(--error-text)",
        },
        focus: {
          ring: "var(--focus-ring)",
        },
      },
      fontFamily: {
        display: ["var(--font-dm-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body: ["var(--font-geist-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        "xs": ["12px", { lineHeight: "16px" }],
        "sm": ["14px", { lineHeight: "20px" }],
        "base": ["16px", { lineHeight: "1.6" }],
        "lg": ["18px", { lineHeight: "1.6" }],
        "xl": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em" }],
        "3xl": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em" }],
        "4xl": ["36px", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "5xl": ["44px", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "6xl": ["52px", { lineHeight: "1.12", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        button: "12px",
        input: "12px",
        card: "18px",
        dialog: "24px",
      },
      boxShadow: {
        soft: "0 6px 24px rgba(23, 53, 46, 0.08)",
        card: "0 2px 10px rgba(23, 53, 46, 0.06)",
        subtle: "0 1px 3px rgba(23, 53, 46, 0.04)",
        elevated: "0 12px 36px rgba(23, 53, 46, 0.10)",
      },
      maxWidth: {
        container: "1120px",
        prose: "65ch",
      },
    },
  },
  plugins: [],
};

export default config;
