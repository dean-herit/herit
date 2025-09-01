export default {
  // TypeScript and JavaScript files
  "**/*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],

  // JSON files
  "**/*.json": ["prettier --write"],

  // CSS and styling files
  "**/*.{css,scss,less}": ["prettier --write"],

  // Markdown files
  "**/*.md": ["prettier --write"],

  // Config files - be extra careful with these
  "**/*.config.{js,ts,mjs}": ["eslint --fix", "prettier --write"],
};
