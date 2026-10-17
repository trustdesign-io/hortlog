// Launch screens for the home-screen app on iPhone and iPad: the leaf on the
// dark green, one image per screen size (iOS needs exact sizes).
// Run: node scripts/generate-splash.mjs  → public/splash/*.png + src/lib/splash-screens.json
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const icon = readFileSync('public/app-icon.svg', 'utf8')
const leaf = icon.slice(icon.indexOf('<g transform'), icon.lastIndexOf('</svg>'))

// [width, height, pixel ratio] in device pixels, portrait
const SCREENS = [
  [1320, 2868, 3], [1206, 2622, 3], [1290, 2796, 3], [1179, 2556, 3], [1284, 2778, 3], [1170, 2532, 3],
  [1125, 2436, 3], [1242, 2688, 3], [828, 1792, 2], [1242, 2208, 3], [750, 1334, 2], [640, 1136, 2],
  [2048, 2732, 2], [1668, 2388, 2], [1640, 2360, 2], [1668, 2224, 2], [1620, 2160, 2], [1536, 2048, 2], [1488, 2266, 2],
]

const out = []
for (const [w, h, dpr] of SCREENS) {
  const size = Math.round(Math.min(w, h) * 0.32)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#121A14"/>
  <svg x="${(w - size) / 2}" y="${(h - size) / 2}" width="${size}" height="${size}" viewBox="0 0 1200 1200">${leaf}</svg>
</svg>`
  const file = `splash/${w}x${h}.png`
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`public/${file}`)
  out.push({
    url: `/${file}`,
    media: `(device-width: ${w / dpr}px) and (device-height: ${h / dpr}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
  })
}
writeFileSync('src/lib/splash-screens.json', JSON.stringify(out, null, 2) + '\n')
console.log(`${out.length} launch screens`)
