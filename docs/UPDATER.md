# 🚀 Astro Cloudflare Project Updater

Script otomatis untuk mengupdate project dari repository GitHub menggunakan `simple-git`.

## 📋 Fitur

- ✅ **Automatic Git Pull**: Mengambil perubahan terbaru dari branch `main`
- ✅ **Backup Otomatis**: Membuat backup file yang dimodifikasi sebelum update
- ✅ **Dependency Management**: Install/update dependencies secara otomatis
- ✅ **Conflict Detection**: Mendeteksi dan menangani merge conflicts
- ✅ **Stash Management**: Menyimpan dan memulihkan perubahan lokal
- ✅ **Colored Output**: Output berwarna untuk memudahkan monitoring

## 🛠️ Instalasi

1. Install dependency yang diperlukan:
```bash
npm install
```

2. Pastikan project sudah terhubung dengan repository GitHub:
```bash
git remote -v
```

## 📖 Penggunaan

### Update Project
```bash
npm run update
```

### Tampilkan Bantuan
```bash
npm run update:help
```

### Jalankan Script Langsung
```bash
node scripts/updater.js
```

## 🔧 Cara Kerja

1. **Pre-flight Check**: Mengecek apakah direktori adalah git repository
2. **Status Check**: Memeriksa status git dan perubahan lokal
3. **Backup Creation**: Membuat backup file yang dimodifikasi (jika ada)
4. **Stash Local Changes**: Menyimpan perubahan lokal ke stash
5. **Fetch & Pull**: Mengambil perubahan terbaru dari remote
6. **Restore Changes**: Memulihkan perubahan lokal dari stash
7. **Dependency Update**: Install/update dependencies jika diperlukan

## 📁 Struktur Backup

Backup disimpan di direktori:
```
./backup/[timestamp]/
```

Contoh: `./backup/2024-01-15T10-30-45-123Z/`

## ⚠️ Peringatan

- **Local Changes**: Script akan membuat backup otomatis jika ada perubahan lokal
- **Merge Conflicts**: Jika terjadi conflict, script akan berhenti dan meminta resolusi manual
- **Dependencies**: Pastikan `package.json` ada di root directory

## 🐛 Troubleshooting

### Error: "This directory is not a git repository"
- Pastikan Anda menjalankan script dari root directory project
- Pastikan direktori memiliki folder `.git`

### Error: "Merge conflicts detected"
- Resolve conflicts secara manual
- Commit perubahan setelah resolve
- Jalankan script lagi

### Error: "Failed to restore local changes"
- Cek direktori backup untuk file yang dimodifikasi
- Restore file secara manual jika diperlukan

## 🔗 Repository

- **URL**: https://github.com/ahmadjn/astro-cloudflare
- **Branch**: main
- **Script**: `scripts/updater.js`

## 📝 Log Output

Script akan menampilkan log dengan warna:
- 🔵 **Cyan**: Informasi umum
- 🟢 **Green**: Sukses
- 🟡 **Yellow**: Peringatan
- 🔴 **Red**: Error

## 🤝 Contributing

Untuk menambahkan fitur baru ke updater:

1. Edit file `scripts/updater.js`
2. Test dengan menjalankan `npm run update`
3. Commit perubahan ke repository

## 📄 License

Script ini adalah bagian dari project Astro Cloudflare dan mengikuti license yang sama.
