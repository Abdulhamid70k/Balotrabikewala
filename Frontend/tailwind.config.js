/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#f97316",
          dark:    "#ea580c",
          light:   "#fff7ed",
          muted:   "#fed7aa",
        },
      },
      boxShadow: {
        card:       "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
        "card-hover":"0 8px 24px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};