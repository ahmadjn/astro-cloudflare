import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 Obfuscating All Scripts...\n');

// Scripts to obfuscate
const scripts = [
  {
    name: 'LandingScript',
    path: 'src/components/LandingScript.astro',
    output: 'src/components/LandingScriptObfuscated.astro'
  },
  {
    name: 'UniversalAdScript',
    path: 'src/components/UniversalAdScript.astro',
    output: 'src/components/UniversalAdScriptObfuscated.astro'
  },
  {
    name: 'PremiumAccessScript',
    path: 'src/components/PremiumAccessScript.astro',
    output: 'src/components/PremiumAccessObfuscated.astro'
  }
];

async function obfuscateScript(script) {
  console.log(`📦 Processing ${script.name}...`);

  try {
    // Read the original script
    const scriptPath = path.join(__dirname, '..', script.path);
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Extract the JavaScript part (between <script> tags)
    const scriptMatch = scriptContent.match(/<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.error(`❌ No script tag found in ${script.path}`);
      return false;
    }

    const originalScript = scriptMatch[1];

    // Step 1: Minify with Terser
    console.log(`  📦 Step 1: Minifying with Terser...`);
    const terserResult = await minify(originalScript, {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
        passes: 2
      },
      mangle: {
        toplevel: true,
        reserved: ['googletag', 'document', 'window', 'console']
      },
      format: {
        comments: false
      }
    });

    if (!terserResult.code) {
      console.error(`❌ Terser minification failed for ${script.name}`);
      return false;
    }

    const minifiedScript = terserResult.code;
    console.log(`  ✅ Terser minification completed`);

    // Step 2: Obfuscate the minified JavaScript
    console.log(`  🔒 Step 2: Obfuscating with JavaScript Obfuscator...`);
    const obfuscationResult = JavaScriptObfuscator.obfuscate(minifiedScript, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    });

    // Create obfuscated component
    const obfuscatedComponent = `---
// Obfuscated ${script.name} Component
// Generated automatically - DO NOT EDIT
---

<script>
${obfuscationResult.getObfuscatedCode()}
</script>`;

    // Write obfuscated component
    const obfuscatedPath = path.join(__dirname, '..', script.output);
    fs.writeFileSync(obfuscatedPath, obfuscatedComponent);

    console.log(`  ✅ Obfuscated script saved to ${script.output}`);
    console.log(`  📊 Original size: ${originalScript.length} characters`);
    console.log(`  📊 Minified size: ${minifiedScript.length} characters`);
    console.log(`  📊 Obfuscated size: ${obfuscationResult.getObfuscatedCode().length} characters`);
    console.log(`  📊 Minification ratio: ${Math.round((1 - minifiedScript.length / originalScript.length) * 100)}%`);
    console.log(`  📊 Total compression ratio: ${Math.round((1 - obfuscationResult.getObfuscatedCode().length / originalScript.length) * 100)}%\n`);

    return true;

  } catch (error) {
    console.error(`❌ Error processing ${script.name}:`, error.message);
    return false;
  }
}

// Process all scripts
async function processAllScripts() {
  let successCount = 0;

  for (const script of scripts) {
    const success = await obfuscateScript(script);
    if (success) successCount++;
  }

  console.log(`🎉 Obfuscation completed!`);
  console.log(`✅ Successfully obfuscated ${successCount}/${scripts.length} scripts`);
  console.log(`\n📁 Generated files:`);
  scripts.forEach(script => {
    console.log(`  - ${script.output}`);
  });

  if (successCount === scripts.length) {
    console.log(`\n💡 Next steps:`);
    console.log(`  - Update your pages to use obfuscated components`);
    console.log(`  - Run npm run build to test`);
    console.log(`  - Run npm run deploy to deploy with obfuscated scripts`);
  } else {
    console.log(`\n⚠️  Some scripts failed to obfuscate. Check the errors above.`);
    process.exit(1);
  }
}

processAllScripts();
