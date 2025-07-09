# Script Converter JSON ke Content Posts Astro

Script ini mengkonversi data JSON AI Apps dari folder `data/` ke content posts Astro yang siap digunakan untuk static site builder.

## Fitur

- ✅ Mengkonversi 119 file JSON dari 5 kategori
- ✅ Download dan convert gambar ke format WebP
- ✅ Format data sesuai kebutuhan content posts
- ✅ Generate slug otomatis dari title
- ✅ Filter reviews dengan score >= 4
- ✅ Format installs ke format yang lebih readable (2.3M+, 1.5K+, dll)

## Cara Penggunaan

```bash
npm run convert
```

## Struktur Data yang Dikonversi

### Input (JSON)

- `app.title` → `title`
- `app.AIReview` → `content` (HTML format)
- `app.descriptionHTML` → `description` (diformat dengan tag `<p>`)
- `app.summary` → `summary`
- `app.maxInstalls` → `installs` (diformat: 2.3M+, 1.5K+, dll)
- `app.scoreText` → `rating`
- `app.reviews` → `reviews` (filter score >= 4, max 5 review)
- `app.developer` → `developer`
- `app.genre` → `genre`
- `app.icon` → download & convert ke WebP
- `app.headerImage` → download & convert ke WebP
- `app.screenshots` → download & convert ke WebP (max 3)
- `app.url` → `url`

### Output (Markdown)

- File disimpan di `src/content/posts/[slug].md`
- Gambar disimpan di `public/images/[slug]-[type].webp`
- Frontmatter dengan semua metadata
- Content dengan format HTML yang proper

## Dependencies

- `sharp` - untuk image processing dan konversi ke WebP
- `fs` - untuk file system operations
- `path` - untuk path manipulation
- `https` - untuk download gambar
- `url` - untuk URL handling

## Kategori yang Diproses

1. **Art & Design** - 19 apps
2. **Entertainment** - 12 apps
3. **Photography** - 44 apps
4. **Productivity** - 30 apps
5. **Video Players & Editors** - 14 apps

**Total: 119 apps**

## Format Output

Setiap file markdown memiliki struktur:

```markdown
---
title: "App Title"
summary: "App summary"
installs: "2.3M+"
rating: "4.3"
developer: "Developer Name"
genre: "Art & Design"
category: "Art & Design"
images: ["/images/slug-icon.webp", "/images/slug-header.webp", ...]
url: "https://play.google.com/store/apps/details?id=..."
slug: "app-slug"
publishDate: 2025-07-07T03:31:55.965Z
---

[Formatted description with proper HTML]

[AI Review content]
```

## Error Handling

- Script menangani error download gambar
- Error konversi gambar tidak menghentikan proses
- Logging untuk setiap file yang diproses
- Summary report di akhir proses

## Performance

- Download gambar secara parallel
- Konversi WebP dengan quality 80%
- Temporary files dibersihkan setelah konversi
- Progress indicator untuk setiap kategori
