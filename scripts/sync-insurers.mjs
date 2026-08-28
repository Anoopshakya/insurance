import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const env = Object.fromEntries(
  (await readFile(path.join(root, ".env.local"), "utf8"))
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, "")];
    }),
);
const sql = await readFile(
  path.join(root, "supabase/migrations/202608280003_insurers_sector_and_seed.sql"),
  "utf8",
);
const pattern = /\('((?:[^']|'')*)','([^']+)','(life|general|health)','([^']+)','([^']+)','((?:[^']|'')*)',(true|false)\)/g;
const rows = [...sql.matchAll(pattern)].map((match) => ({
  name: match[1].replaceAll("''", "'"),
  slug: match[2],
  sector: match[3],
  logo_url: match[4],
  website_url: match[5],
  description: match[6].replaceAll("''", "'"),
  active: match[7] === "true",
  api_status: "not_integrated",
}));

const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !serviceKey) throw new Error("Supabase URL or service role key is missing");
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const sectorProbe = await fetch(`${baseUrl}/rest/v1/insurers?select=sector&limit=1`, { headers });
const includeSector = sectorProbe.ok;
const payload = rows.map((row) => includeSector ? row : Object.fromEntries(Object.entries(row).filter(([key]) => key !== "sector")));
const response = await fetch(`${baseUrl}/rest/v1/insurers?on_conflict=name`, {
  method: "POST",
  headers: {
    ...headers,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify(payload),
});
if (!response.ok) throw new Error(`Supabase upsert failed (${response.status}): ${await response.text()}`);
const saved = await response.json();
process.stdout.write(`Upserted ${saved.length} insurers${includeSector ? " with sectors" : "; sectors will be populated when the migration is applied"}.\n`);
