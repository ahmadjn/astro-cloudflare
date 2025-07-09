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
      CSS: false,
      HTML: true,
      Image: false,
      JavaScript: false,
      SVG: true,
    }),
    compressor({
      brotli: true,
      gzip: true,
    })
  ],
});
