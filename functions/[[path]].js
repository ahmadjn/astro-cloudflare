/**
 * Cloudflare Function untuk deteksi bot dan mengirim data ke halaman Astro
 *
 * - Mendeteksi bot berdasarkan Cloudflare CF data
 * - Mendeteksi mobile/tablet menggunakan uaparser.js
 * - Mendeteksi crawlers dan AI bots
 * - Mengirim data deteksi ke halaman statis
 * - Tidak menggunakan cache atau modify script
 */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const userAgent = request.headers.get('user-agent') || '';

      // Import uaparser.js untuk deteksi device dan bot
      const { UAParser } = await import('ua-parser-js');
      const { Bots } = await import('ua-parser-js/extensions');
      const { Crawlers } = await import('ua-parser-js/extensions');
      const { isAIBot } = await import('ua-parser-js/helpers');

      // Parse user agent untuk device detection
      const deviceParser = new UAParser(userAgent);
      const deviceResult = deviceParser.getDevice();

      // Parse user agent untuk bot detection
      const botParser = new UAParser({ Bots });
      const botResult = botParser.setUA(userAgent).getResult();

      // Parse user agent untuk crawler detection
      const crawlerParser = new UAParser(Crawlers);
      const crawlerResult = crawlerParser.setUA(userAgent).getBrowser();

      // Deteksi device type
      const isMobile = deviceResult.type === 'mobile';
      const isTablet = deviceResult.type === 'tablet';
      const isSmartphone = isMobile && !isTablet;

      // Deteksi bot dengan kriteria lengkap
      const isBot = Boolean(
        request.cf?.clientBot || // cf.client.bot
        (request.cf?.threatScore <= 30) || // cf.threat_score le 30
        // Verified bot categories
        ['Search Engine Crawler',
          'Search Engine Optimization',
          'Monitoring & Analytics',
          'Advertising & Marketing',
          'AI Crawler',
          'Aggregator',
          'AI Assistant',
          'AI Search'
        ].includes(request.cf?.verifiedBotCategory) ||
        // UAParser bot detection
        botResult.browser.type === 'bot' ||
        // Crawler detection
        crawlerResult.type === 'crawler'
      );

      // Deteksi AI bot
      const isAIBotDetected = isAIBot(botResult);

      // Deteksi crawler
      const isCrawler = crawlerResult.type === 'crawler' ||
        botResult.browser.type === 'bot' ||
        request.cf?.verifiedBotCategory?.includes('Crawler');

      // Data deteksi sederhana - hanya true/false
      const detectionData = {
        // Bot detection
        isBot: isBot,
        isAIBot: isAIBotDetected,
        isCrawler: isCrawler,

        // Device detection
        isMobile: isMobile,
        isTablet: isTablet,
        isSmartphone: isSmartphone,

        // Cloudflare detection
        isClientBot: request.cf?.clientBot || false,
        isLowThreatScore: (request.cf?.threatScore || 100) <= 30,
        isVerifiedBot: Boolean(request.cf?.verifiedBotCategory)
      };

      // Coba ambil asset dari Astro build
      const assetUrl = new URL(url.pathname, url.origin);
      let response = await env.ASSETS.fetch(assetUrl);

      // Jika asset tidak ditemukan, coba dengan index.html
      if (!response || response.status === 404) {
        const indexUrl = new URL('/index.html', url.origin);
        response = await env.ASSETS.fetch(indexUrl);
      }

      // Jika masih tidak ditemukan, return 404
      if (!response || response.status === 404) {
        return new Response('Page not found', { status: 404 });
      }

      let html = await response.text();

      // Inject detection data ke halaman HTML
      html = injectDetectionData(html, detectionData);

      return new Response(html, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'x-is-bot': isBot ? 'true' : 'false',
          'x-is-mobile': isMobile ? 'true' : 'false',
          'x-is-tablet': isTablet ? 'true' : 'false',
          'x-is-smartphone': isSmartphone ? 'true' : 'false',
          'x-is-ai-bot': isAIBotDetected ? 'true' : 'false',
          'x-is-crawler': isCrawler ? 'true' : 'false',
          'x-is-client-bot': request.cf?.clientBot ? 'true' : 'false',
          'x-is-low-threat-score': (request.cf?.threatScore || 100) <= 30 ? 'true' : 'false',
          'x-is-verified-bot': request.cf?.verifiedBotCategory ? 'true' : 'false',
          'x-detection-data': JSON.stringify(detectionData)
        },
      });

    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: {
          'content-type': 'text/plain;charset=UTF-8',
        },
      });
    }
  },
};

// Helper function untuk mendapatkan alasan bot (tidak digunakan lagi)
function getBotReason(cf, botResult, crawlerResult) {
  if (!cf && !botResult && !crawlerResult) return 'unknown';

  // Cloudflare detection
  if (cf?.clientBot) return 'cf_client_bot';
  if (cf?.threatScore <= 30) return `cf_threat_score:${cf.threatScore}`;
  if (cf?.verifiedBotCategory) return `cf_verified_bot:${cf.verifiedBotCategory}`;

  // UAParser bot detection
  if (botResult?.browser?.type === 'bot') return `ua_bot:${botResult.browser.name || 'unknown'}`;

  // Crawler detection
  if (crawlerResult?.type === 'crawler') return `ua_crawler:${crawlerResult.name || 'unknown'}`;

  return 'not_bot';
}

// Function untuk inject detection data ke HTML
function injectDetectionData(html, detectionData) {
  // Inject detection data sebagai script tag di head
  const detectionScript = `
		<script>
			window.DETECTION_DATA = ${JSON.stringify(detectionData)};
			window.IS_BOT = ${detectionData.isBot};
			window.IS_MOBILE = ${detectionData.isMobile};
			window.IS_TABLET = ${detectionData.isTablet};
			window.IS_SMARTPHONE = ${detectionData.isSmartphone};
			window.IS_AI_BOT = ${detectionData.isAIBot};
			window.IS_CRAWLER = ${detectionData.isCrawler};
			window.IS_CLIENT_BOT = ${detectionData.isClientBot};
			window.IS_LOW_THREAT_SCORE = ${detectionData.isLowThreatScore};
			window.IS_VERIFIED_BOT = ${detectionData.isVerifiedBot};

			// Dispatch event untuk notifikasi detection
			document.addEventListener('DOMContentLoaded', function() {
				window.dispatchEvent(new CustomEvent('userDetected', {
					detail: window.DETECTION_DATA
				}));
			});
		</script>
	`;

  // Cari tag </head> dan inject script sebelum itu
  if (html.includes('</head>')) {
    html = html.replace('</head>', detectionScript + '</head>');
  } else {
    // Jika tidak ada </head>, inject di awal body
    if (html.includes('<body')) {
      html = html.replace('<body', '<body>' + detectionScript);
    } else {
      // Fallback: inject di akhir HTML
      html = html + detectionScript;
    }
  }

  return html;
}
