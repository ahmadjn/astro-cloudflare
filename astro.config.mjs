// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import playformCompress from "@playform/compress";
import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
  site: "https://test.duniapondok.com",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "cloudflare",
  }),
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    playformCompress({
      CSS: true,
      HTML: true,
      Image: true,
      JavaScript: true,
      SVG: true,
    }),
    compressor({
      brotli: true,
      gzip: true,
    })
  ],
});
