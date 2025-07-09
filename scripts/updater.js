#!/usr/bin/env node

console.log('📦 Loading updater script...');

import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('✅ Dependencies loaded successfully');

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
  try {
    return fs.existsSync(path.join(dir, '.git'));
  } catch (error) {
    return false;
  }
}

// Fungsi untuk mengecek remote repository
async function checkRemote(git) {
  try {
    const remotes = await git.getRemotes();
    const originRemote = remotes.find(remote => remote.name === REMOTE_NAME);
    return originRemote;
  } catch (error) {
    log(`Error checking remotes: ${error.message}`, 'error');
    return null;
  }
}

// Fungsi untuk setup repository jika belum ada
async function setupRepository(git) {
  try {
    log('🔧 Setting up repository...', 'info');

    // Cek apakah sudah ada remote origin
    const originRemote = await checkRemote(git);

    if (!originRemote) {
      log('📡 Adding remote origin...', 'info');
      await git.addRemote(REMOTE_NAME, REPO_URL);
      log('✅ Remote origin added successfully', 'success');
    } else {
      log('✅ Remote origin already exists', 'success');
    }

    // Fetch untuk mendapatkan semua branches
    log('📥 Fetching from remote...', 'info');
    await git.fetch([REMOTE_NAME]);

    // Cek apakah branch main ada
    const branches = await git.branch(['-a']);
    const mainBranchExists = branches.all.some(branch => branch.includes('origin/main'));

    if (!mainBranchExists) {
      log('❌ Main branch not found in remote', 'error');
      return false;
    }

    // Cek branch saat ini
    const currentBranch = await git.branch();

    if (currentBranch.current !== BRANCH) {
      log(`🔄 Switching to ${BRANCH} branch...`, 'info');
      try {
        await git.checkout([BRANCH]);
        log(`✅ Switched to ${BRANCH} branch`, 'success');
      } catch (checkoutError) {
        log(`🔄 Creating local ${BRANCH} branch...`, 'info');
        await git.checkout(['-b', BRANCH, `origin/${BRANCH}`]);
        log(`✅ Created and switched to ${BRANCH} branch`, 'success');
      }
    }

    return true;
  } catch (error) {
    log(`❌ Failed to setup repository: ${error.message}`, 'error');
    return false;
  }
}

// Fungsi untuk mengecek status git
async function checkGitStatus(git) {
  try {
    const status = await git.status();
    return status;
  } catch (error) {
    log(`Error checking git status: ${error.message}`, 'error');
    return null;
  }
}

// Fungsi untuk melakukan backup file yang dimodifikasi
async function backupModifiedFiles(git, status) {
  const backupDir = path.join(process.cwd(), 'backup', new Date().toISOString().replace(/[:.]/g, '-'));

  try {
    // Buat direktori backup
    if (!fs.existsSync(path.dirname(backupDir))) {
      fs.mkdirSync(path.dirname(backupDir), { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup file yang dimodifikasi
    const modifiedFiles = [...status.modified, ...status.created, ...status.deleted];

    for (const file of modifiedFiles) {
      const sourcePath = path.join(process.cwd(), file);
      const backupPath = path.join(backupDir, file);

      if (fs.existsSync(sourcePath)) {
        // Buat direktori backup jika belum ada
        const backupFileDir = path.dirname(backupPath);
        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }

        // Copy file ke backup
        fs.copyFileSync(sourcePath, backupPath);
        log(`Backed up: ${file}`, 'warning');
      }
    }

    log(`Backup created at: ${backupDir}`, 'success');
    return backupDir;
  } catch (error) {
    log(`Error creating backup: ${error.message}`, 'error');
    return null;
  }
}

// Fungsi utama untuk update
async function updateProject() {
  console.log('🔧 Initializing updateProject function...');
  log('🚀 Starting project update...', 'info');

  try {
    console.log('🔧 Creating simpleGit instance...');
    // Inisialisasi simple-git
    const git = simpleGit(process.cwd());
    console.log('✅ simpleGit instance created');

    // Cek apakah ini adalah git repository
    if (!(await isGitRepo(process.cwd()))) {
      log('❌ This directory is not a git repository!', 'error');
      log('💡 To initialize this as a git repository, run:', 'info');
      log('   git init', 'info');
      log('   git remote add origin https://github.com/ahmadjn/astro-cloudflare', 'info');
      log('   git fetch origin', 'info');
      log('   git checkout -b main origin/main', 'info');
      log('   npm run update', 'info');
      process.exit(1);
    }

    // Setup repository jika diperlukan
    const setupSuccess = await setupRepository(git);
    if (!setupSuccess) {
      log('❌ Failed to setup repository', 'error');
      log('💡 Please check your internet connection and try again', 'warning');
      process.exit(1);
    }

    // Cek status git sebelum update
    log('📊 Checking git status...', 'info');
    const status = await checkGitStatus(git);

    if (!status) {
      log('❌ Failed to check git status', 'error');
      process.exit(1);
    }

    // Cek apakah ada perubahan lokal
    const hasLocalChanges = status.modified.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.staged.length > 0;

    if (hasLocalChanges) {
      log('⚠️  Local changes detected!', 'warning');
      log(`Modified files: ${status.modified.length}`, 'warning');
      log(`Created files: ${status.created.length}`, 'warning');
      log(`Deleted files: ${status.deleted.length}`, 'warning');

      // Backup file yang dimodifikasi
      const backupDir = await backupModifiedFiles(git, status);

      if (backupDir) {
        log('💾 Backup created successfully', 'success');
      } else {
        log('❌ Failed to create backup', 'error');
        process.exit(1);
      }
    }

    // Fetch latest changes
    log('📥 Fetching latest changes from remote...', 'info');
    try {
      await git.fetch(['--all']);
    } catch (fetchError) {
      log('⚠️  Warning: Could not fetch from remote', 'warning');
      log('💡 This might be due to network issues or authentication', 'info');
      log('💡 For public repositories, this is usually not a problem', 'info');
    }

    // Cek branch saat ini
    const currentBranch = await git.branch();
    log(`📍 Current branch: ${currentBranch.current}`, 'info');

    // Stash perubahan lokal jika ada
    if (hasLocalChanges) {
      log('💾 Stashing local changes...', 'info');
      await git.stash(['--include-untracked']);
    }

    // Pull latest changes
    log(`📥 Pulling latest changes from ${BRANCH}...`, 'info');
    let pullResult;
    try {
      pullResult = await git.pull('origin', BRANCH);
      log('✅ Pull completed successfully!', 'success');
      log(`📝 Summary: ${pullResult.summary.changes} changes`, 'info');
    } catch (pullError) {
      log('❌ Failed to pull from remote', 'error');
      log('💡 This might be due to:', 'info');
      log('   - Network connectivity issues', 'info');
      log('   - Authentication problems (if private repo)', 'info');
      log('   - Local changes conflicting with remote', 'info');
      log('💡 For public repositories, try:', 'info');
      log('   git pull origin main', 'info');
      process.exit(1);
    }

    // Pop stash jika ada perubahan yang di-stash
    if (hasLocalChanges) {
      log('🔄 Restoring local changes...', 'info');
      try {
        await git.stash(['pop']);
        log('✅ Local changes restored successfully!', 'success');
      } catch (stashError) {
        log('⚠️  Warning: Could not restore all local changes', 'warning');
        log('Check the backup directory for your modified files', 'info');
      }
    }

    // Install dependencies jika package.json berubah
    if (pullResult && pullResult.summary.changes > 0) {
      log('📦 Checking for dependency updates...', 'info');

      if (fs.existsSync('package.json')) {
        log('📦 Installing/updating dependencies...', 'info');

        const { execSync } = await import('child_process');
        try {
          execSync('npm install', { stdio: 'inherit' });
          log('✅ Dependencies updated successfully!', 'success');
        } catch (installError) {
          log('❌ Error installing dependencies', 'error');
          log('Please run "npm install" manually', 'warning');
        }
      }
    }

    log('🎉 Project update completed successfully!', 'success');
    log('💡 You may need to restart your development server', 'info');

  } catch (error) {
    log(`❌ Update failed: ${error.message}`, 'error');

    if (error.message.includes('conflict')) {
      log('🔧 Merge conflicts detected!', 'warning');
      log('Please resolve conflicts manually and try again', 'warning');
    }

    process.exit(1);
  }
}

// Fungsi untuk menampilkan bantuan
function showHelp() {
  console.log(`
🚀 Astro Cloudflare Project Updater

Usage:
  npm run update    - Update project from GitHub
  npm run update:help - Show this help message

Features:
  ✅ Automatic git pull from main branch
  ✅ Backup local changes before update
  ✅ Automatic dependency installation
  ✅ Conflict detection and handling
  ✅ Stash and restore local changes
  ✅ Public repository support (no login required)
  ✅ Automatic repository setup

Backup Location:
  ./backup/[timestamp]/

Repository:
  ${REPO_URL}

Authentication:
  🔓 Public repository - no login required
  🔐 For private repos, configure git credentials:
     git config --global user.name "Your Name"
     git config --global user.email "your.email@example.com"
     git config --global credential.helper store

Setup for New Users:
  1. Install Git, Node.js, and npm
  2. Clone repository: git clone ${REPO_URL}
  3. Run updater: npm run update
  `);
}

// Main execution
async function main() {
  try {
    console.log('🔍 Updater script starting...');

    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h') || args.includes('help')) {
      showHelp();
      return;
    }

    console.log('🚀 Calling updateProject...');
    await updateProject();
    console.log('✅ Update completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error in updater:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run the updater
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateProject, showHelp };
