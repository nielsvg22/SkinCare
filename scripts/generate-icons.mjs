import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const svgPath = fileURLToPath(new URL("./icon.svg", import.meta.url));
const outDir = fileURLToPath(new URL("../public/icons/", import.meta.url));

await mkdir(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-192.png", size: 192, padding: 0.2 },
  { name: "icon-maskable-512.png", size: 512, padding: 0.2 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

for (const t of targets) {
  const base = sharp(svgPath);
  if (t.padding) {
    const inner = Math.round(t.size * (1 - t.padding * 2));
    const buf = await sharp(svgPath).resize(inner, inner).toBuffer();
    await sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: { r: 243, g: 233, b: 216, alpha: 1 },
      },
    })
      .composite([{ input: buf, gravity: "center" }])
      .png()
      .toFile(outDir + t.name);
  } else {
    await base.resize(t.size, t.size).png().toFile(outDir + t.name);
  }
  console.log("generated", t.name);
}
