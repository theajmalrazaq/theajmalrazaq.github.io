import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "astro-sitemap";
import node from "@astrojs/node";

export default defineConfig({
  build: {
    inlineStylesheets: "never",
  },
  site: "https://theajmalrazaq.tech/",
  vite: {
    plugins: [tailwindcss()],
  },
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [ react(), sitemap()],
});