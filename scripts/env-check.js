import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());
  } catch (err) {
    return null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const examplePath = path.join(repoRoot, '.env.example');
const envPath = path.join(repoRoot, '.env');

const exampleKeys = parseEnvFile(examplePath);
const envKeys = parseEnvFile(envPath);

if (!exampleKeys) {
  console.error('.env.example not found at', examplePath);
  process.exit(2);
}

if (!envKeys) {
  console.error('.env not found at', envPath);
  console.log('All keys from .env.example are missing (no .env present).');
  process.exit(1);
}

const missing = exampleKeys.filter(k => !envKeys.includes(k));
const present = exampleKeys.filter(k => envKeys.includes(k));

console.log('Checked .env against .env.example');
console.log('Total keys in .env.example:', exampleKeys.length);
console.log('Present keys:', present.length);
console.log('Missing keys:', missing.length);
if (missing.length) {
  console.log('\nMissing keys:');
  missing.forEach(k => console.log('-', k));
} else {
  console.log('\nAll keys from .env.example are present in .env');
}

process.exit(0);
