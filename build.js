import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('  BLEN DIGITAL - Production Build Start ');
console.log('========================================');

try {
  console.log('\n[1/3] Installing backend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });

  console.log('\n[2/3] Installing frontend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

  console.log('\n[3/3] Building Vite frontend for production...');
  execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });

  console.log('\n========================================');
  console.log('  BLEN DIGITAL - Build Completed Successfully! ');
  console.log('========================================\n');
} catch (err) {
  console.error('\n[Build Error] Production build failed:', err.message);
  process.exit(1);
}
