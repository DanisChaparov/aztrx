// Generates Aztrx app icons from SVG to PNG at various sizes.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="15" fill="#0a0b10"/>
  <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-opacity="0.35"/>
  <rect x="15" y="30" width="8" height="18" rx="4" fill="#E6E8EE"/>
  <rect x="28" y="18" width="8" height="30" rx="4" fill="#3B82F6"/>
  <rect x="41" y="30" width="8" height="18" rx="4" fill="#E6E8EE"/>
</svg>`;

const svgBuffer = Buffer.from(svg);

const sizes = [
  { name: "icon-256.png", size: 256, target: join(root, "apps", "desktop", "public") },
  { name: "icon-32.png", size: 32, target: join(root, "apps", "desktop", "public") },
  { name: "icon-16.png", size: 16, target: join(root, "apps", "desktop", "public") },
  { name: "favicon.ico", size: 32, target: join(root, "apps", "web", "public") },
];

for (const { name, size, target } of sizes) {
  const png = await sharp(svgBuffer).resize(size, size).png().toBuffer();
  writeFileSync(join(target, name), png);
  console.log(`  ${name} (${size}x${size})`);
}

console.log("Done — icons generated.");
