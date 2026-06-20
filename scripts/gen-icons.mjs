// Generate PWA icons (192 / 512 / maskable) from an inline SVG, so installs look
// right on Android/iOS. Run once after changing the design:  node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')

// Full-bleed blue background (required for maskable) + a centered white target,
// kept within the maskable safe zone (~center 80%).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb"/>
  <g fill="none" stroke="#ffffff" stroke-width="22">
    <circle cx="256" cy="256" r="132"/>
    <circle cx="256" cy="256" r="86"/>
  </g>
  <circle cx="256" cy="256" r="34" fill="#ffffff"/>
</svg>`

async function main() {
  await mkdir(OUT, { recursive: true })
  const buf = Buffer.from(svg)
  await sharp(buf).resize(192, 192).png().toFile(join(OUT, 'icon-192.png'))
  await sharp(buf).resize(512, 512).png().toFile(join(OUT, 'icon-512.png'))
  await sharp(buf).resize(512, 512).png().toFile(join(OUT, 'maskable-512.png'))
  console.log('✅ Icons written to public/icons/')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
