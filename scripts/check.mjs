import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "./build.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(rootDirectory, "dist");

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolutePath));
    else files.push(absolutePath);
  }
  return files;
}

function localTarget(value, sourceFile) {
  if (/^(?:[a-z]+:|\/\/)/i.test(value)) return null;
  const [rawPath, fragment = ""] = value.split("#", 2);
  const withoutQuery = rawPath.split("?", 1)[0];
  const sourceRoute = `/${path.relative(outputDirectory, path.dirname(sourceFile)).split(path.sep).join("/")}/`;
  const pathname = withoutQuery.startsWith("/")
    ? withoutQuery
    : path.posix.resolve(sourceRoute, withoutQuery || ".");
  return { pathname, fragment: decodeURIComponent(fragment) };
}

async function resolveTarget(pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const base = path.join(outputDirectory, relative);
  const candidates = pathname.endsWith("/")
    ? [path.join(base, "index.html")]
    : [base, path.join(base, "index.html")];
  for (const candidate of candidates) {
    try {
      if ((await fs.stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next valid static-file form.
    }
  }
  return null;
}

await build();

const files = await listFiles(outputDirectory);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const errors = [];
const htmlByFile = new Map();

for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  htmlByFile.set(file, html);
  const label = path.relative(rootDirectory, file);

  if (!/^<!doctype html>/i.test(html)) errors.push(`${label}: missing HTML doctype`);
  if (!/<html\s+lang="[^"]+"/i.test(html)) errors.push(`${label}: missing document language`);
  if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) errors.push(`${label}: missing meta description`);
  if (!/<link\s+rel="canonical"\s+href="https:\/\/[^"]+"/i.test(html)) errors.push(`${label}: missing HTTPS canonical URL`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${label}: duplicate id ${[...new Set(duplicateIds)].join(", ")}`);
}

for (const [file, html] of htmlByFile) {
  const label = path.relative(rootDirectory, file);
  const references = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of references) {
    const target = localTarget(reference, file);
    if (!target) continue;
    const targetFile = await resolveTarget(target.pathname);
    if (!targetFile) {
      errors.push(`${label}: broken reference ${reference}`);
      continue;
    }
    if (target.fragment && targetFile.endsWith(".html")) {
      const targetHtml = htmlByFile.get(targetFile) ?? await fs.readFile(targetFile, "utf8");
      const escapedFragment = target.fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\sid="${escapedFragment}"`).test(targetHtml)) {
        errors.push(`${label}: missing fragment target ${reference}`);
      }
    }
  }
}

if (errors.length) {
  throw new Error(`Deployment checks failed:\n- ${errors.join("\n- ")}`);
}

console.log(`Checked ${htmlFiles.length} HTML files and ${files.length} generated files.`);
