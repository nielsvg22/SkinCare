import sharp from "sharp";
import { fileURLToPath } from "node:url";

const svgPath = fileURLToPath(new URL("./icon.svg", import.meta.url));
const iosAssets = fileURLToPath(new URL("../ios/App/App/Assets.xcassets/", import.meta.url));

// App icon: iOS requires a fully opaque 1024x1024 PNG (no alpha channel).
await sharp(svgPath)
  .resize(1024, 1024)
  .flatten({ background: "#16233A" })
  .png()
  .toFile(iosAssets + "AppIcon.appiconset/AppIcon-512@2x.png");
console.log("generated AppIcon-512@2x.png");

// Splash screen: brand background with the icon centered, at 2732x2732 —
// used for all three scale variants per Contents.json.
const iconBuf = await sharp(svgPath).resize(560, 560).png().toBuffer();
const splash = await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: "#faf6ef" },
})
  .composite([{ input: iconBuf, gravity: "center" }])
  .png()
  .toBuffer();

for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await sharp(splash).toFile(iosAssets + "Splash.imageset/" + name);
  console.log("generated", name);
}
