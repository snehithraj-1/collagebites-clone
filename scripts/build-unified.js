import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('🚀 [Vercel Unified Build] Assembling CampusBites Suite');
console.log('======================================================');

const apps = [
  { name: 'student-app', dir: 'student-app', dest: '' },
  { name: 'admin-app', dir: 'admin-app', dest: 'admin' },
  { name: 'lhk-admin-app', dir: 'lhk-admin-app', dest: 'lhk' },
  { name: 'clg-admin-app', dir: 'clg-admin-app', dest: 'clg' },
  { name: 'rider-app', dir: 'rider-app', dest: 'rider' }
];

const rootDist = path.resolve(rootDir, 'dist');
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.mkdirSync(rootDist, { recursive: true });

for (const app of apps) {
  console.log(`\n📦 Building ${app.name}...`);
  execSync(`npx vite build ${app.dir} --config ${app.dir}/vite.config.js`, {
    cwd: rootDir,
    stdio: 'inherit'
  });

  const appDist = path.resolve(rootDir, app.dir, 'dist');
  const targetDir = app.dest ? path.resolve(rootDist, app.dest) : rootDist;

  if (fs.existsSync(appDist)) {
    if (app.dest) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.cpSync(appDist, targetDir, { recursive: true });
    console.log(`✅ Mounted ${app.name} -> ${app.dest ? '/' + app.dest : '/'}`);
  }
}

console.log('\n======================================================');
console.log('🎉 [Vercel Unified Build] Complete: Output in ./dist');
console.log('======================================================\n');
