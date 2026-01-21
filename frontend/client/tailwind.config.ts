import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontSize: {
        // Standard UI scale (rem-based)
        xs: ["0.75rem", { lineHeight: "1rem" }],       // 12/16
        sm: ["0.875rem", { lineHeight: "1.25rem" }],   // 14/20
        base: ["1rem", { lineHeight: "1.5rem" }],      // 16/24
        lg: ["1.125rem", { lineHeight: "1.75rem" }],   // 18/28
        xl: ["1.25rem", { lineHeight: "1.75rem" }],    // 20/28
        "2xl": ["1.5rem", { lineHeight: "2rem" }],     // 24/32
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],// 30/36
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],  // 36/40
        "5xl": ["3rem", { lineHeight: "1" }],          // 48/48
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
