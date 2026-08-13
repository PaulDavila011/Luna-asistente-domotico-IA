import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#06070d",
          900: "#0b0e1a",
          800: "#121629",
          700: "#1b2140",
        },
        moon: {
          glow: "#c9d6ff",
          soft: "#8b9fd6",
        },
        listen: "#7c6ff0",
        speak: "#7c6ff0",
        idle: "#3a4266",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        ring: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        breathe: "breathe 3.2s ease-in-out infinite",
        ring: "ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
