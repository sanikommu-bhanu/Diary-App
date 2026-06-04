import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fairy: {
          purple: "rgb(var(--fairy-purple-rgb) / <alpha-value>)",
          "purple-dark": "rgb(var(--fairy-purple-dark-rgb) / <alpha-value>)",
          rose: "rgb(var(--fairy-rose-rgb) / <alpha-value>)",
          "rose-dark": "rgb(var(--fairy-rose-dark-rgb) / <alpha-value>)",
          lavender: "rgb(var(--fairy-lavender-rgb) / <alpha-value>)",
          dark: "rgb(var(--fairy-dark-rgb) / <alpha-value>)",
          "dark-2": "rgb(var(--fairy-dark-2-rgb) / <alpha-value>)",
          "dark-3": "rgb(var(--fairy-dark-3-rgb) / <alpha-value>)",
          glass: "rgb(var(--fairy-glass-rgb) / <alpha-value>)",
          border: "rgb(var(--fairy-border-rgb) / <alpha-value>)",
          text: "rgb(var(--fairy-text-rgb) / <alpha-value>)",
          "text-muted": "rgb(var(--fairy-text-muted-rgb) / <alpha-value>)",
        },
        mood: {
          happy: "#fbbf24",
          sad: "#60a5fa",
          calm: "#34d399",
          angry: "#f87171",
          dreamy: "#a78bfa",
          romantic: "#f472b6",
          neutral: "#9ca3af",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "fairy-gradient": "linear-gradient(135deg, rgb(var(--fairy-bg-start-rgb)) 0%, rgb(var(--fairy-bg-mid-rgb)) 50%, rgb(var(--fairy-bg-end-rgb)) 100%)",
        "fairy-card": "linear-gradient(135deg, rgb(var(--fairy-purple-rgb) / 0.12), rgb(var(--fairy-rose-rgb) / 0.1))",
        "fairy-button": "linear-gradient(135deg, rgb(var(--fairy-purple-rgb)), rgb(var(--fairy-rose-rgb)))",
        "fairy-glow": "radial-gradient(ellipse at center, rgb(var(--fairy-purple-rgb) / 0.18) 0%, transparent 70%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delay": "float 6s ease-in-out 2s infinite",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(192,132,252,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(192,132,252,0.6)" },
        },
      },
      boxShadow: {
        "fairy": "0 0 40px rgba(192,132,252,0.2)",
        "fairy-lg": "0 0 80px rgba(192,132,252,0.3)",
        "glass": "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-hover": "0 12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        "button": "0 4px 20px rgba(192,132,252,0.4)",
        "button-hover": "0 6px 30px rgba(192,132,252,0.6)",
      },
      backdropBlur: {
        "xs": "4px",
      },
    },
  },
  plugins: [],
};

export default config;
