// Generates a proper Windows .ico file from the Upstream SVG logo.
// Windows requires .ico (not .png) for app icon, taskbar, window title bar.
// Run: node scripts/generate-ico.mjs
import sharp from "sharp";
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const svg = readFileSync(join(root, "apps", "web", "public", "icon.svg"), "utf-8");
const svgBuffer = Buffer.from(svg);

// ICO format: header (6 bytes) + one directory entry per image (16 bytes each) + image data
// ICO header: 00 00 (reserved), 01 00 (type=ICO), NN 00 (image count)
// Directory entry: width, height, palette, reserved, planes (2), bpp (2), size (4), offset (4)

const sizes = [256, 64, 48, 32, 16];
const images = [];

for (const size of sizes) {
  const png = await sharp(svgBuffer).resize(size, size).png().toBuffer();
  images.push({ size, data: png });
}

// Write ICO
const headerSize = 6;
const entrySize = 16;
const dirSize = headerSize + images.length * entrySize;

let offset = dirSize;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);      // reserved
header.writeUInt16LE(1, 2);      // type: ICO
header.writeUInt16LE(images.length, 4); // count

const entries = [];
for (const img of images) {
  const entry = Buffer.alloc(entrySize);
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // width (0 = 256)
  entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // height
  entry.writeUInt8(0, 2);        // palette
  entry.writeUInt8(0, 3);        // reserved
  entry.writeUInt16LE(1, 4);     // planes
  entry.writeUInt16LE(32, 6);    // bpp
  entry.writeUInt32LE(img.data.length, 8);  // size
  entry.writeUInt32LE(offset, 12);           // offset
  entries.push(entry);
  offset += img.data.length;
}

const ico = Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);

// Write to both locations
const desktopPublic = join(root, "apps", "desktop", "public", "icon.ico");
const webPublic = join(root, "apps", "web", "public", "favicon.ico");
writeFileSync(desktopPublic, ico);
writeFileSync(webPublic, ico);
console.log(`icon.ico generated — ${ico.length} bytes, ${images.length} sizes: ${sizes.join(", ")}`);
console.log(`  ${desktopPublic}`);
console.log(`  ${webPublic}`);
