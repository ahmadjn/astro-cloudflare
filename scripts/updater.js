#!/usr/bin/env node

// PENJELASAN: Memindahkan semua import ke atas agar lebih rapi dan sesuai standar.
import { simpleGit } from 'simple-git';
import path, { dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

console.log('📦 Memuat skrip updater...');

// PENJELASAN: __filename dan __dirname tidak tersedia secara default di ES Modules.
// Cara Anda membuatnya sudah benar, ini hanya untuk penegasan.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('✅ Dependensi berhasil dimuat');

// Konfigurasi repository
const REPO_URL = 'https://github.com/ahmadjn/astro-cloudflare';
const BRANCH = 'main';
const REMOTE_NAME = 'origin';

// Fungsi untuk menampilkan pesan dengan warna
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };

  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Fungsi untuk mengecek apakah direktori adalah git repository
async function isGitRepo(dir) {
  // PERBAIKAN: Menggunakan metode checkIsRepo() dari simple-git yang lebih andal
  // daripada hanya memeriksa keberadaan folder .git.
  const git = simpleGit(dir);
  return await git.checkIsRepo();
}

// Fungsi untuk mengecek remote repository
async function checkRemote(git) {
  try {
    const remotes = await git.getRemotes(true); // true untuk detail
    const originRemote = remotes.find(remote => remote.name === REMOTE_NAME);
    return originRemote;
  } catch (error) {
    log(`Error saat memeriksa remote: ${error.message}`, 'error');
    return null;
  }
}

// Fungsi untuk setup repository jika belum ada
async function setupRepository(git) {
  try {
    log('🔧 Menyiapkan repository...', 'info');

    const originRemote = await checkRemote(git);

    if (!originRemote || originRemote.refs.fetch !== REPO_URL) {
      if (originRemote) {
        log('📡 Menghapus remote origin yang salah...', 'info');
        await git.removeRemote(REMOTE_NAME);
      }
      log(`📡 Menambahkan remote origin: ${REPO_URL}`, 'info');
      await git.addRemote(REMOTE_NAME, REPO_URL);
      log('✅ Remote origin berhasil ditambahkan', 'success');
    } else {
      log('✅ Remote origin sudah ada dan benar', 'success');
    }

    log('📥 Mengambil data dari remote...', 'info');
    await git.fetch(REMOTE_NAME);

    const branches = await git.branch(['--remotes']);
    const mainBranchExists = branches.all.some(branch => branch === `${REMOTE_NAME}/${BRANCH}`);

    if (!mainBranchExists) {
      log(`❌ Branch '${BRANCH}' tidak ditemukan di remote!`, 'error');
      return false;
    }

    const currentBranch = await git.branch();
    if (currentBranch.current !== BRANCH) {
      log(`🔄 Beralih ke branch '${BRANCH}'...`, 'info');
      try {
        // Coba checkout ke branch yang sudah ada
        await git.checkout(BRANCH);
      } catch (checkoutError) {
        // Jika gagal, buat branch baru dari remote
        log(`🌿 Membuat branch lokal '${BRANCH}' dari remote...`, 'info');
        await git.checkout(['-b', BRANCH, `${REMOTE_NAME}/${BRANCH}`]);
      }
      log(`✅ Berhasil beralih ke branch '${BRANCH}'`, 'success');
    }

    return true;
  } catch (error) {
    log(`❌ Gagal menyiapkan repository: ${error.message}`, 'error');
    return false;
  }
}

// Fungsi untuk melakukan backup file yang dimodifikasi
async function backupModifiedFiles(status) {
  const backupDir = path.join(process.cwd(), 'backup', new Date().toISOString().replace(/[:.]/g, '-'));
  const modifiedFiles = [...status.modified, ...status.created, ...status.deleted, ...status.conflicted];

  if (modifiedFiles.length === 0) {
    return null; // Tidak ada yang perlu di-backup
  }

  try {
    log(`📦 Membuat direktori backup di: ${backupDir}`, 'info');
    fs.mkdirSync(backupDir, { recursive: true });

    for (const file of modifiedFiles) {
      const sourcePath = path.join(process.cwd(), file);
      const backupPath = path.join(backupDir, file);

      if (fs.existsSync(sourcePath) && !fs.lstatSync(sourcePath).isDirectory()) {
        const backupFileDir = path.dirname(backupPath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, backupPath);
        log(`  -> Menyimpan salinan: ${file}`, 'warning');
      }
    }

    log(`✅ Backup berhasil dibuat`, 'success');
    return backupDir;
  } catch (error) {
    log(`❌ Gagal membuat backup: ${error.message}`, 'error');
    return null;
  }
}

// Fungsi utama untuk update
async function updateProject() {
  log('🚀 Memulai proses update proyek...', 'info');
  const git = simpleGit(process.cwd());

  try {
    if (!(await isGitRepo(process.cwd()))) {
      log('❌ Direktori ini bukan sebuah git repository!', 'error');
      log('💡 Untuk memulai, jalankan perintah berikut:', 'info');
      log(`   git clone ${REPO_URL} .`, 'info');
      log('   npm install', 'info');
      log('   npm run update', 'info');
      return; // Menggunakan return agar tidak keluar dari proses node secara paksa
    }

    if (!(await setupRepository(git))) {
      log('❌ Gagal menyiapkan repository. Proses update dibatalkan.', 'error');
      return;
    }

    log('📊 Memeriksa status git sebelum update...', 'info');
    await git.fetch(); // Selalu fetch terbaru sebelum cek status
    const status = await git.status();

    const isDirty = status.files.length > 0;
    if (isDirty) {
      log('⚠️ Ditemukan perubahan lokal!', 'warning');
      await backupModifiedFiles(status);
      log('💾 Perubahan lokal akan di-stash (disimpan sementara)...', 'info');
      await git.stash(['push', '--include-untracked']);
    }

    log(`📥 Menarik perubahan terbaru dari branch '${BRANCH}'...`, 'info');
    const pullResult = await git.pull(REMOTE_NAME, BRANCH);

    if (pullResult.files.length > 0) {
      log('✅ Berhasil menarik perubahan!', 'success');
      pullResult.files.forEach(file => log(`  - ${file}`, 'info'));
    } else {
      log('✅ Proyek Anda sudah yang paling baru.', 'success');
    }

    if (isDirty) {
      log('🔄 Mengembalikan perubahan lokal Anda...', 'info');
      try {
        await git.stash(['pop']);
        log('✅ Perubahan lokal berhasil dikembalikan.', 'success');
      } catch (stashError) {
        log('❌ Gagal mengembalikan stash secara otomatis karena ada konflik.', 'error');
        log('💡 Perubahan Anda yang asli sudah di-backup.', 'info');
        log('💡 Silakan selesaikan konflik secara manual lalu jalankan `git stash drop`', 'warning');
      }
    }

    const packageChanged = pullResult.files.includes('package.json') || pullResult.files.includes('package-lock.json');
    if (packageChanged) {
      log('📦 File package.json berubah, menjalankan `npm install`...', 'info');
      try {
        execSync('npm install', { stdio: 'inherit' });
        log('✅ Dependensi berhasil di-update!', 'success');
      } catch (installError) {
        log('❌ Gagal menginstall dependensi.', 'error');
        log('💡 Silakan jalankan "npm install" secara manual.', 'warning');
      }
    }

    log('🎉 Proses update proyek selesai!', 'success');
    log('💡 Mungkin Anda perlu me-restart server development jika sedang berjalan.', 'info');

  } catch (error) {
    log(`❌ Proses update gagal: ${error.message}`, 'error');
    if (error.message.includes('conflict')) {
      log('🔧 Terdeteksi konflik!', 'warning');
      log('💡 Silakan selesaikan konflik secara manual, lalu commit perubahan Anda.', 'warning');
    }
    const statusAfterError = await git.status();
    if (statusAfterError.isClean()) {
      await git.stash(['pop']).catch(() => { });
    }
  }
}

// Fungsi untuk menampilkan bantuan
function showHelp() {
  console.log(`
🚀 Astro Cloudflare Project Updater

Penggunaan:
  npm run update      - Menjalankan proses update dari GitHub.
  npm run update help - Menampilkan pesan bantuan ini.

Fitur Utama:
  ✅ Tarik otomatis dari branch 'main'.
  ✅ Backup perubahan lokal sebelum update.
  ✅ Stash dan kembalikan perubahan lokal secara otomatis.
  ✅ Instalasi dependensi otomatis jika package.json berubah.
  ✅ Penanganan konflik dasar.
  ✅ Setup repository otomatis untuk pengguna baru.

Lokasi Backup:
  ./backup/[timestamp]/

Repository:
  ${REPO_URL}
  `);
}

// PERBAIKAN: Cara yang lebih andal untuk memeriksa apakah skrip ini dijalankan secara langsung.
// Ini berfungsi di berbagai sistem operasi (Windows, Linux, macOS).
const isRunningDirectly = path.resolve(process.argv[1]) === __filename;

if (isRunningDirectly) {
  const args = process.argv.slice(2);
  if (args.includes('help')) {
    showHelp();
  } else {
    updateProject().catch(err => {
      log(`❌ Terjadi error fatal: ${err.message}`, 'error');
      process.exit(1);
    });
  }
}

export { updateProject, showHelp };
