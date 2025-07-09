import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read site config
const configPath = path.join(__dirname, "../site.json");
const siteConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Generate ads.txt content
let adsTxtContent = "";

// Add AdSense accounts
if (siteConfig.analytics.adsense.enabled) {
  adsTxtContent += `${siteConfig.analytics.adsense.pub_id.replace("ca-pub-", "pub-")}, DIRECT, f08c47fec0942fa0\n`;
}

// Add Ad Manager account
if (siteConfig.analytics.admanager.enabled) {
  adsTxtContent += `${siteConfig.analytics.admanager.config.pub_id.replace("ca-pub-", "pub-")}, DIRECT, f08c47fec0942fa0\n`;
}

// Write to public directory
const outputPath = path.join(__dirname, "../public/ads.txt");
fs.writeFileSync(outputPath, adsTxtContent);

console.log("✅ ads.txt generated successfully");
console.log("📄 Content:");
console.log(adsTxtContent);
