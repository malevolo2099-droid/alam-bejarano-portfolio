import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const imageRoot = path.join(root, "public", "images", "work");
const manifestPath = path.join(root, "src", "data", "responsive-assets.json");
const portraitSource = path.join(root, "portafolio desordenado", "MacloyCristopher-264.jpg");
const portraitOutput = path.join(root, "public", "images", "profile", "alam-portrait.webp");
const widths = [480, 960, 1600];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.name.endsWith(".webp") && !/-w\d+\.webp$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

const assets = {};
await mkdir(path.dirname(portraitOutput), { recursive: true });
await sharp(portraitSource)
  .rotate()
  .resize({ width: 1800, withoutEnlargement: true })
  .webp({ quality: 84, effort: 5 })
  .toFile(portraitOutput);

for (const file of [...await walk(imageRoot), portraitOutput]) {
  const metadata = await sharp(file).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Image dimensions unavailable for ${file}`);
  }

  const relativePath = `/${path.relative(path.join(root, "public"), file).split(path.sep).join("/")}`;
  const candidates = [];
  for (const width of widths) {
    if (width >= metadata.width) continue;
    const variantPath = file.replace(/\.webp$/, `-w${width}.webp`);
    await sharp(file)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(variantPath);
    candidates.push(`${relativePath.replace(/\.webp$/, `-w${width}.webp`)} ${width}w`);
  }
  candidates.push(`${relativePath} ${metadata.width}w`);
  assets[relativePath] = {
    width: metadata.width,
    height: metadata.height,
    srcset: candidates.join(", "),
  };
}

await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(assets, null, 2)}\n`, "utf8");
console.log(`Generated responsive variants for ${Object.keys(assets).length} images.`);
