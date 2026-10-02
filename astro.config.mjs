import { defineConfig } from "astro/config";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  site: "https://malevolo2099-droid.github.io",
  base: isGitHubActions ? "/alam-bejarano-portfolio/" : "/",
  output: "static",
  compressHTML: true,
});