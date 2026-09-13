import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F4F0",
        background: "#F7F4F0",
        surface: "#FFF6EC",
        field: "#FFFFFF",
        foreground: "#0D1B2E",
        ink: "#0D1B2E",
        "deep-blue": "#1E2F4D",
        muted: "#8D95A1",
        mist: "#6D87A6",
        accent: "#F2B76E",
        "accent-soft": "#FFC89B",
        border: "#E7E3DE",
        "line-strong": "#E4C29B",
        selected: "#F3E9DF",
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        sm: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      maxWidth: {
        col: "560px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(13, 27, 46, 0.05)",
        soft: "0 2px 8px rgba(13, 27, 46, 0.06)",
        md: "0 6px 20px rgba(13, 27, 46, 0.08)",
        dock: "0 -10px 24px -12px rgba(13, 27, 46, 0.18)",
        cta: "0 7px 18px rgba(18, 36, 63, 0.16)",
      },
    },
  },
};

export default config;
