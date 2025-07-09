# Astro Cloudflare Project

Website premium AI apps dengan tema dark, fitur analytics, dan sistem obfuscation JavaScript.

## 📋 System Requirements

- **Node.js**: 18.x atau lebih tinggi
- **npm**: 9.x atau lebih tinggi
- **Wrangler CLI**: Untuk deploy ke Cloudflare

## 🪟 Tutorial Instalasi Git, Node.js, dan npm (Windows)

### 1. Install Git
1. Download Git dari [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Jalankan installer, klik "Next" terus hingga selesai (pengaturan default sudah cukup)
3. Setelah selesai, buka Command Prompt dan cek instalasi:
   ```bash
   git --version
   ```

### 2. Install Node.js & npm
1. Download Node.js LTS dari [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
2. Jalankan installer, klik "Next" terus hingga selesai (otomatis akan menginstall npm juga)
3. Setelah selesai, cek instalasi:
   ```bash
   node -v
   npm -v
   ```

### 3. (Opsional) Update npm ke versi terbaru
```bash
npm install -g npm
```

### 4. Setup untuk User Baru
Untuk user yang belum familiar dengan Git atau belum login GitHub, lihat dokumentasi lengkap di:
📖 **[docs/SETUP_FOR_NEW_USERS.md](docs/SETUP_FOR_NEW_USERS.md)**

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/ahmadjn/astro-cloudflare
cd astro-cloudflare
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Wrangler CLI (jika belum)
```bash
npm install -g wrangler
```

### 4. Setup Cloudflare
```bash
wrangler login
```

## ⚙️ Configuration

### 1. Site Configuration (`site.json`)
File konfigurasi utama yang mengatur semua aspek website:

```json
{
  "site": {
    "name": "Premium AI Apps",
    "title": "Discover the Best AI Apps",
    "description": "Find the best AI applications for your needs",
    "domain": "yourdomain.com",
    "author": "Premium AI Apps",
    "keywords": "AI apps, artificial intelligence, mobile apps",
    "og_image": "/og-image.jpg",
    "favicon": "/favicon.svg"
  },
  "deploy": {
    "platform": "cloudflare",
    "region": "auto"
  },
  "analytics": {
    "gtag": {
      "enabled": true,
      "code": "AW-XXXXXXXXXX"
    },
    "adsense": {
      "enabled": true,
      "pub_id": "ca-pub-XXXXXXXXXX",
      "ad_slot": "XXXXXXXXXX"
    },
    "admanager": {
      "enabled": true,
      "config": {
        "pub_id": "ca-pub-XXXXXXXXXX",
        "ad_display_path": "/XXXXXXXXXX/ca-pub-XXXXXXXXXX-tag",
        "ad_interstitial_path": "/XXXXXXXXXX/interstitial"
      }
    }
  },
  "build": {
    "output": "static",
    "adapter": "@astrojs/cloudflare"
  },
  "landing": {
    "static_slugs": [
      "premium-ai-apps",
      "best-ai-apps",
      "start-ai-apps"
    ]
  }
}
```

### 2. Generated Config Files
Script `generate-config.js` akan menggenerate file konfigurasi dari `site.json`:

- **wrangler.jsonc**: Konfigurasi Cloudflare Workers
- **astro.config.mjs**: Konfigurasi Astro

### 3. Configuration Fields
- **site**: Informasi website (name, title, description, domain, author, keywords, og_image, favicon)
- **deploy**: Konfigurasi deployment (platform, region)
- **analytics**: Konfigurasi analytics (gtag, adsense, admanager)
- **build**: Konfigurasi build (output, adapter)
- **landing**: Konfigurasi landing page (static_slugs untuk prerender)

## 🛠️ Development

### 1. Development Server
```bash
npm run dev
```
Server development akan berjalan di `http://localhost:4321`

### 2. Edit Content
- **Apps**: Edit file di `src/content/apps/`
- **Categories**: Edit file di `src/content/categories/`
- **Scripts**: Edit file di `src/components/`

### 3. Obfuscation JavaScript
Untuk mengobfuscate script JavaScript:

```bash
npm run obfuscate
```

Script ini akan:
- Minify dengan Terser
- Obfuscate dengan JavaScript Obfuscator
- Generate file `*Obfuscated.astro`

### 4. Preview Production Build
```bash
npm run preview
```

## 🏗️ Build

### 1. Generate Config
```bash
npm run generate-config
```

### 2. Convert JSON to Content
```bash
npm run convert
```

### 3. Generate Ads.txt
```bash
npm run generate-ads
```

### 4. Build Project
```bash
npm run build
```

Build akan menghasilkan:
- Static files di `dist/`
- Server entrypoints untuk Cloudflare Workers
- Compressed files (gzip & brotli)

## 🚀 Deploy

### 1. Deploy ke Cloudflare
```bash
npm run deploy
```

Command ini akan menjalankan:
1. Convert JSON to content
2. Generate config files
3. Generate ads.txt
4. Obfuscate JavaScript
5. Build project
6. Deploy ke Cloudflare Workers

### 2. Manual Deploy
```bash
wrangler deploy
```

## 📦 Package.json Commands

### Development
- `npm run dev` - Start development server
- `npm run preview` - Preview production build

### Build
- `npm run build` - Build project dengan generate config
- `npm run generate-config` - Generate config files dari site.json
- `npm run convert` - Convert JSON files ke content
- `npm run generate-ads` - Generate ads.txt file

### Obfuscation
- `npm run obfuscate` - Obfuscate semua JavaScript scripts

### Deploy
- `npm run deploy` - Deploy lengkap dengan semua proses
- `npm run cf-typegen` - Generate Cloudflare types

## 🎯 Features

### 1. Content Management
- **Dynamic Content**: JSON to Markdown conversion

### 2. User Detection System
- **Cloudflare Function**: Deteksi bot dan device menggunakan CF data + uaparser.js
- **Simplified Data**: Hanya mengembalikan nilai boolean (true/false)
- **Data Injection**: Inject detection data ke halaman statis
- **Client-side Access**: Data tersedia di JavaScript
- **Event System**: Custom events untuk bot/human/device handling
- **No Cache**: Setiap request fresh tanpa cache
- **No Script Modification**: Tidak modify/remove script

📖 **[docs/USER_DETECTION.md](docs/USER_DETECTION.md)** - Dokumentasi lengkap user detection
- **Categories**: Organized app categories
- **SEO Optimized**: Meta tags dan structured data

### 2. Analytics System
- **Google Analytics (gtag)**: Tracking dan reporting
- **Google AdSense**: Monetization dengan pub_id dan ad_slot
- **Google Ad Manager**: Advanced ad management dengan config
- **Configurable**: Enable/disable per component

### 3. JavaScript Obfuscation
- **Terser Minification**: Code compression
- **JavaScript Obfuscator**: Advanced encryption
- **Modular Scripts**: Terpisah dari layout
- **Universal System**: Satu script untuk semua

### 4. SEO & Performance
- **Meta Tags**: Complete SEO optimization
- **Compression**: Gzip dan Brotli compression
- **Static Generation**: Fast loading
- **Cloudflare CDN**: Global distribution

### 5. Landing Pages
- **Dynamic Routes**: `/landing/*` support dengan SSR
- **Static Pages**: Pre-generated landing pages dari site.json
- **Configurable Slugs**: Mudah menambah/ubah slug di site.json
- **Ad Integration**: AdSense dan Ad Manager

### 6. Landing Page Configuration
Untuk menambah atau mengubah slug landing page yang di-prerender:

1. **Edit site.json**:
```json
{
  "landing": {
    "static_slugs": [
      "premium-ai-apps",
      "best-ai-apps",
      "start-ai-apps",
      "new-landing-page"  // Tambah slug baru
    ]
  }
}
```

2. **Build dan Deploy**:
```bash
npm run build
npm run deploy
```

Slug yang ada di `static_slugs` akan di-prerender, sedangkan slug lain akan menggunakan SSR.

## 📝 Recent Changes

### v0.0.1
- ✅ Implementasi sistem obfuscation JavaScript
- ✅ Integrasi Google Analytics, AdSense, Ad Manager
- ✅ Dynamic content management
- ✅ SEO optimization
- ✅ Cloudflare Workers deployment
- ✅ Compression dan performance optimization
- ✅ Landing page system dengan configurable slugs
- ✅ Config generation system
- ✅ UniversalAdScriptObfuscated di semua halaman

## 🔧 Troubleshooting

### Build Errors
1. Pastikan Node.js versi 18+ terinstall
2. Jalankan `npm install` untuk install dependencies
3. Cek syntax error di content files
4. Jalankan `npm run generate-config` terlebih dahulu

### Deploy Errors
1. Pastikan Wrangler CLI terinstall dan login
2. Cek platform dan region di site.json
3. Pastikan domain sudah terdaftar di Cloudflare
4. Cek permissions untuk deploy

### Obfuscation Errors
1. Install dependencies: `npm install terser javascript-obfuscator --save-dev`
2. Cek syntax error di script asli
3. Pastikan reserved keywords tidak di-mangle
4. Test script obfuscated di browser

### Analytics Issues
1. Cek gtag code di site.json
2. Pastikan Google Analytics sudah setup
3. Cek AdSense pub_id dan ad_slot
4. Verifikasi Ad Manager config

## 📚 Dependencies

### Production
```json
{
  "astro": "^4.x.x",
  "@astrojs/cloudflare": "^8.x.x",
  "@astrojs/compress": "^1.x.x"
}
```

### Development
```json
{
  "terser": "^5.x.x",
  "javascript-obfuscator": "^4.x.x",
  "wrangler": "^3.x.x"
}
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test dengan `npm run build`
5. Submit pull request

## 📄 License

MIT License - lihat file LICENSE untuk detail.
