const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

async function run() {
  const svgPath = path.resolve(__dirname, '..', 'public', 'favicon.svg');
  const outPath = path.resolve(__dirname, '..', 'public', 'favicon.ico');
  const svg = fs.readFileSync(svgPath);
  try {
    // Render PNG at 32x32
    const pngBuffer = await sharp(svg).resize(32, 32).png().toBuffer();
    const icoBuffer = await pngToIco(pngBuffer);
    fs.writeFileSync(outPath, icoBuffer);
    console.log('favicon.ico generated');
  } catch (err) {
    console.error('Failed to generate favicon.ico', err);
    process.exit(1);
  }
}

run();
