import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const migration = await readFile(
  path.join(root, "supabase/migrations/202608280003_insurers_sector_and_seed.sql"),
  "utf8",
);
const rows = [...migration.matchAll(/\('(?:[^']|'')*','([^']+)','(?:life|general|health)','[^']+','(https?:\/\/[^']+)'/g)]
  .map((match) => ({ slug: match[1], website: match[2] }));
const outputDir = path.join(root, "public/insurer-logos");
const sourceOverrides = {
  "aditya-birla-health-insurance": "https://www.adityabirlacapital.com/",
};

await mkdir(outputDir, { recursive: true });

for (const { slug, website } of rows) {
  const logoWebsite = sourceOverrides[slug] || website;
  const domain = new URL(logoWebsite).hostname;
  const destination = path.join(outputDir, `${slug}.webp`);
  try {
    await access(destination);
    process.stdout.write(`kept ${slug}.webp\n`);
    continue;
  } catch {}
  const sources = [
    `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(logoWebsite)}&sz=256`,
    `https://icon.horse/icon/${domain}`,
    `${new URL(logoWebsite).origin}/favicon.ico`,
  ];
  let logo;
  for (const source of sources) {
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(20_000) });
      if (response.ok) {
        logo = await sharp(Buffer.from(await response.arrayBuffer()))
          .resize(256, 256, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .webp({ quality: 90, alphaQuality: 100 })
          .toBuffer();
        break;
      }
    } catch {
      // Try the next provider when a site has TLS or format issues.
    }
  }
  if (!logo) throw new Error(`${slug}: logo download failed from all sources`);
  await writeFile(destination, logo);
  process.stdout.write(`created ${slug}.webp\n`);
}

process.stdout.write(`Generated ${rows.length} WebP insurer logos.\n`);
