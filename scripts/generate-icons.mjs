// Generates Upstream app icons from SVG to PNG at various sizes.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0a0b10"/>
  <rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-opacity="0.3"/>
  <polyline points="20,40 32,22 44,40" fill="none" stroke="#60A5FA" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="24" y1="47" x2="40" y2="47" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-opacity="0.5"/>
  <line x1="27" y1="51" x2="37" y2="51" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-opacity="0.3"/>
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
