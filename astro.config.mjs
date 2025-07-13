// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://theajmalrazaq.github.io/",
  vite: {
    plugins: [tailwindcss()],
  },
  output: "static",
  base: "/",
});
