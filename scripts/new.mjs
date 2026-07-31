import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [kind, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(" ").trim();
const date = new Date().toISOString().slice(0, 10);
const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
const definitions = {
  project: {
    folder: "projects",
    filename: `${slug}.md`,
    body: `---\ntitle: ${title}\nslug: ${slug}\nsummary: One clear sentence about what this project does.\nyear: ${date.slice(0, 4)}\ndate: ${date}\nstatus: Draft\nrole: Your role\ntags: Engineering\nfeatured: false\norder: 99\ndraft: true\n---\n\n## Why it exists\n\nWrite here.\n\n## What I built\n\nWrite here.\n\n## What changed my mind\n\nWrite here.\n`
  },
  post: {
    folder: "posts",
    filename: `${date}-${slug}.md`,
    body: `---\ntitle: ${title}\nslug: ${slug}\ndescription: One sentence that makes the article worth opening.\ndate: ${date}\ntags: Notes\ndraft: true\n---\n\nWrite here.\n`
  },
  log: {
    folder: "logs",
    filename: `${date}-${slug}.md`,
    body: `---\ntitle: ${title}\nslug: ${slug}\nsummary: What changed, failed, or became clear.\ndate: ${date}\ntags: Build Log\ndraft: true\n---\n\nWrite here.\n`
  },
  page: {
    folder: "pages",
    filename: `${slug}.md`,
    body: `---\ntitle: ${title}\ndescription: What this page is for.\nslug: ${slug}\nnav: false\ndraft: true\nupdated: ${date}\n---\n\nWrite here.\n`
  }
};

if (!definitions[kind] || !title || !slug) {
  console.error('Use: npm run new -- project|post|log|page "Title"');
  process.exit(1);
}

const definition = definitions[kind];
const target = path.join(root, "content", definition.folder, definition.filename);
await fs.mkdir(path.dirname(target), { recursive: true });
try {
  await fs.writeFile(target, definition.body, { flag: "wx" });
  console.log(path.relative(root, target));
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.error(`${path.relative(root, target)} already exists.`);
  process.exit(1);
}
