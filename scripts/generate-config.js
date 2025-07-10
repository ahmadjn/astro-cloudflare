import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read site config
const siteConfigPath = path.join(__dirname, '../site.json');
const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));

console.log('🔧 Generating config files from site.json...');

// Generate wrangler.jsonc
const wranglerConfig = {
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": siteConfig.site.domain.toLowerCase().replace(/\./g, '-'),
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2025-07-05",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist",
  },
  "observability": {
    "enabled": false,
  },
  "routes": [
    {
      "pattern": siteConfig.site.domain,
      "custom_domain": true
    }
  ],
  "placement": {
    "mode": "smart",
  },
};

// Generate astro.config.mjs
const astroConfig = `// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import playformCompress from "@playform/compress";
import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
  site: "https://${siteConfig.site.domain}",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: "cloudflare",
  }),
  output: "${siteConfig.build.output}",
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
`;

// Write files
const wranglerPath = path.join(__dirname, '../wrangler.jsonc');
const astroPath = path.join(__dirname, '../astro.config.mjs');

fs.writeFileSync(wranglerPath, JSON.stringify(wranglerConfig, null, 2));
fs.writeFileSync(astroPath, astroConfig);

console.log('✅ Generated wrangler.jsonc');
console.log('✅ Generated astro.config.mjs');
console.log('✅ Config generation completed!');
