import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        'dancing-script': ["var(--font-dancing-script)", "cursive"],
        'great-vibes': ["var(--font-great-vibes)", "cursive"],
        'pacifico': ["var(--font-pacifico)", "cursive"],
        'satisfy': ["var(--font-satisfy)", "cursive"],
        'allura': ["var(--font-allura)", "cursive"],
        'parisienne': ["var(--font-parisienne)", "cursive"],
        'sacramento': ["var(--font-sacramento)", "cursive"],
        'shadows-into-light': ["var(--font-shadows-into-light)", "cursive"],
        'mr-dafoe': ["var(--font-mr-dafoe)", "cursive"],
        'alex-brush': ["var(--font-alex-brush)", "cursive"],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

module.exports = config;