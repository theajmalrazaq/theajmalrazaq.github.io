import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "astro-sitemap";

export default defineConfig({
  build: {
    inlineStylesheets: "never",
  },
  site: "https://theajmalrazaq.tech/",
  vite: {
    plugins: [tailwindcss()],
  },
  output: "static",
  integrations: [react(), sitemap()],
});
