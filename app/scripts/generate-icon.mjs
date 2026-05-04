import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'assets');

function makeSVG(size, rounded = false) {
  const r = rounded ? size * 0.22 : 0;
  const pad = size * 0.12;
  const w = size - pad * 2;
  const cx = size / 2;

  // Bar chart dimensions
  const barW = w * 0.13;
  const barGap = w * 0.05;
  const baseY = size * 0.72;
  const bars = [
    { h: w * 0.28, color: '#6366f1', opacity: 0.65 },
    { h: w * 0.42, color: '#6366f1', opacity: 0.78 },
    { h: w * 0.56, color: '#818cf8', opacity: 0.9  },
    { h: w * 0.70, color: '#a5b4fc', opacity: 1    },
  ];
  const totalBarWidth = bars.length * barW + (bars.length - 1) * barGap;
  const startX = cx - totalBarWidth / 2;

  const barEls = bars.map((b, i) => {
    const x = startX + i * (barW + barGap);
    const y = baseY - b.h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${b.h.toFixed(1)}" rx="${(barW * 0.3).toFixed(1)}" fill="${b.color}" opacity="${b.opacity}"/>`;
  }).join('\n  ');

  // Trend line points (top-center of each bar)
  const points = bars.map((b, i) => {
    const x = startX + i * (barW + barGap) + barW / 2;
    const y = baseY - b.h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastX = (startX + (bars.length - 1) * (barW + barGap) + barW / 2).toFixed(1);
  const lastY = (baseY - bars[bars.length - 1].h).toFixed(1);
  const lineW = (size * 0.022).toFixed(1);
  const dotR  = (size * 0.034).toFixed(1);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#4f46e5" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>

  <!-- Glow area under line -->
  <polygon points="${points} ${lastX},${baseY.toFixed(1)} ${(startX + barW / 2).toFixed(1)},${baseY.toFixed(1)}" fill="url(#glow)"/>

  <!-- Bars -->
  ${barEls}

  <!-- Trend line -->
  <polyline
    points="${points}"
    fill="none"
    stroke="#22c55e"
    stroke-width="${lineW}"
    stroke-linecap="round"
    stroke-linejoin="round"/>

  <!-- Trend dot -->
  <circle cx="${lastX}" cy="${lastY}" r="${dotR}" fill="#22c55e"/>
  <circle cx="${lastX}" cy="${lastY}" r="${(Number(dotR) * 1.7).toFixed(1)}" fill="#22c55e" opacity="0.25"/>

  <!-- App name initial -->
  <text
    x="${(size * 0.5).toFixed(1)}"
    y="${(size * 0.35).toFixed(1)}"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="${(size * 0.18).toFixed(1)}"
    font-weight="800"
    fill="#f8fafc"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="-2">FP</text>
</svg>`;
}

async function generate(svgStr, outPath, size) {
  const buf = Buffer.from(svgStr);
  await sharp(buf, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅ ${outPath.split('/').slice(-2).join('/')}`);
}

// icon.png — 1024x1024
await generate(makeSVG(1024, false), join(ASSETS, 'icon.png'), 1024);

// splash-icon.png — 512x512 centred on transparent (Expo scales it)
await generate(makeSVG(512, false), join(ASSETS, 'splash-icon.png'), 512);

// adaptive-icon.png — foreground layer 1024x1024 (Android, sem fundo)
const adaptiveSVG = makeSVG(1024, false).replace('url(#bg)', 'transparent').replace(/<rect width.*?fill="url\(#bg\)".*?\/>/,'');
await generate(Buffer.from(adaptiveSVG).toString(), join(ASSETS, 'adaptive-icon.png'), 1024);

console.log('\n🎨 Ícones gerados em app/assets/');
