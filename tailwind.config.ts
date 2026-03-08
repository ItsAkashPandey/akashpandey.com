import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "selector",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        cloud: {
          "0%": {
            transform: "translateX(-20%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        plane: {
          "0%": {
            transform: "translate(0, 0) rotate(-45deg)",
            opacity: "0",
          },
          "5%": {
            opacity: "1",
          },
          "95%": {
            opacity: "1",
          },
          "100%": {
            transform: "translate(-800px, -500px) rotate(-45deg)",
            opacity: "0",
          },
        },
        "plane-shadow": {
          "0%": {
            transform: "translate(8px, 8px) rotate(-45deg)",
            opacity: "0",
          },
          "5%": {
            opacity: "0.3",
          },
          "95%": {
            opacity: "0.3",
          },
          "100%": {
            transform: "translate(-792px, -492px) rotate(-45deg)",
            opacity: "0",
          },
        },
        "smooth-bounce": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-15%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "cloud": "cloud 60s linear infinite",
        "plane": "plane 20s linear infinite",
        "plane-shadow": "plane-shadow 20s linear infinite",
        "smooth-bounce": "smooth-bounce 1s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for iOS-specific improvements
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        ".ios-prevent-zoom": {
          "@media (max-width: 639px)": {
            "font-size": "16px !important",
          },
          "@media (min-width: 640px)": {
            "font-size": "0.875rem !important",
          },
        },
        ".touch-target": {
          "min-height": "36px",
          "min-width": "36px",
          "@media (min-width: 640px)": {
            "min-height": "40px",
            "min-width": "40px",
          },
        },
      });
    },
  ],
};
export default config;
