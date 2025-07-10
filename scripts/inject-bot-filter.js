import fs from "fs";
import path from "path";

const workerPath = path.resolve("./dist/_worker.js/index.js");

// 🚀 Bot Filter Middleware + Force Cache Split
const botMiddlewareInject = `
async function botFilterMiddleware(context, next) {
  const { request } = context;
  const cf = request.cf;

  // 🤖 Bot detection logic
  const isBot = Boolean(
    cf?.clientBot ||
    (cf?.threatScore !== undefined && cf.threatScore <= 30) ||
    [
      'Search Engine Crawler',
      'Search Engine Optimization',
      'Monitoring & Analytics',
      'Advertising & Marketing',
      'AI Crawler',
      'Aggregator',
      'AI Assistant',
      'AI Search'
    ].includes(cf?.verifiedBotCategory)
  );

  // 🏎️ Cloudflare Edge Cache
  const cache = caches.default;
  const url = new URL(request.url);
  const cacheKey = new Request(url.href + (isBot ? "?bot" : "?human"), request);

  let response = await cache.match(cacheKey);

  if (!response) {
    // 🚀 Not cached → render page
    response = await next();

    const contentType = response.headers.get('content-type') || '';
    if (isBot && contentType.includes('text/html')) {
      let html = await response.text();

      // 🪄 Remove all <script> with "ScriptObfuscated.astro" in src
      html = html.replace(
        /<script\\b[^>]*src=["'][^"']*ScriptObfuscated\\.astro[^"']*["'][^>]*><\\/script>/gi,
        ''
      );

      response = new Response(html, response);
    }

    // 🎯 Force overwrite Cache-Control
    const cacheControl = isBot
      ? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=60'
      : 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600';

    response.headers.set('cache-control', cacheControl);

    // 🏷️ Optional debug headers
    response.headers.set('x-bot', isBot ? 'true' : 'false');
    response.headers.set('x-cache-type', isBot ? 'bot-cache' : 'human-cache');

    // 💾 Save to edge cache
    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    // 🏷️ Debug header for cache hit
    response = new Response(response.body, response);
    response.headers.set('x-cache-hit', isBot ? 'bot-cache' : 'human-cache');
  }

  return response;
}

const originalMiddleware = (await _manifest.middleware()).default;

async function wrappedMiddleware(context, next) {
  return botFilterMiddleware(context, (ctx) => originalMiddleware(ctx, next));
}

_manifest.middleware = wrappedMiddleware;
`;

// 🚀 Inject logic ke _worker.js
function injectBotFilter() {
  if (!fs.existsSync(workerPath)) {
    console.error(`❌ Worker file not found: ${workerPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(workerPath, "utf-8");

  if (content.includes("botFilterMiddleware")) {
    console.log("✅ Bot filter already injected.");
    return;
  }

  content = content.replace(
    /const _exports = createExports\(_manifest\);/,
    `
${botMiddlewareInject}
const _exports = createExports(_manifest);
`
  );

  fs.writeFileSync(workerPath, content, "utf-8");
  console.log("✅ Bot filter with cache split injected successfully into _worker.js");
}

injectBotFilter();
