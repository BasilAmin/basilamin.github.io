import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { site } from "../site.config.mjs";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(rootDirectory, "dist");
const coreRoutes = new Set(["", "projects", "blog", "log", "contact"]);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripTags(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^(?:"|')|(?:"|')$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^(?:"|')|(?:"|')$/g, "");
}

function parseFrontmatter(raw, sourceFile) {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { attributes: {}, body: normalized.trim() };
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing === -1) throw new Error(`${sourceFile}: frontmatter is not closed.`);
  const attributes = {};
  for (const line of normalized.slice(4, closing).split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1 || /^\s/.test(line)) continue;
    attributes[line.slice(0, separator).trim()] = parseFrontmatterValue(line.slice(separator + 1));
  }
  return { attributes, body: normalized.slice(closing + 5).trim() };
}

function safeUrl(rawUrl = "") {
  const value = String(rawUrl).trim();
  if (/^(?:https?:\/\/|mailto:|\/|#|\.\.?\/)/.test(value)) return value;
  return "#";
}

function inlineMarkdown(value = "") {
  const tokens = [];
  const reserve = (html) => {
    const id = `\u0000TOKEN${tokens.length}\u0000`;
    tokens.push(html);
    return id;
  };
  let text = String(value);
  text = text.replace(/`([^`]+)`/g, (_, code) => reserve(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, href, title) => {
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
    return reserve(`<a href="${escapeHtml(safeUrl(href))}"${titleAttribute}>${escapeHtml(label)}</a>`);
  });
  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
  tokens.forEach((html, index) => {
    text = text.replace(`\u0000TOKEN${index}\u0000`, html);
  });
  return text;
}

function markdownToHtml(markdown = "") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  const headings = [];
  const headingIds = new Map();
  let paragraph = [];
  let list = null;
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list?.items.length) return;
    const tag = list.type === "ordered" ? "ol" : "ul";
    output.push(`<${tag}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`);
    list = null;
  };

  const flushCode = () => {
    if (!code) return;
    const language = code.language ? ` class="language-${escapeHtml(code.language)}"` : "";
    output.push(`<pre><code${language}>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
    code = null;
  };

  const headingId = (label) => {
    const base = slugify(stripTags(label)) || "section";
    const count = headingIds.get(base) || 0;
    headingIds.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```\s*([\w-]*)\s*$/);
    if (fence) {
      if (code) flushCode();
      else {
        flushParagraph();
        flushList();
        code = { language: fence[1] || "", lines: [] };
      }
      continue;
    }
    if (code) {
      code.lines.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const nextLine = lines[index + 1] || "";
    if (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(nextLine)) {
      flushParagraph();
      flushList();
      const headers = line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(lines[index].replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
        index += 1;
      }
      index -= 1;
      output.push(`<div class="table-wrap"><table><thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${inlineMarkdown(row[cellIndex] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    const image = line.trim().match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      flushParagraph();
      flushList();
      output.push(`<figure><img src="${escapeHtml(safeUrl(image[2]))}" alt="${escapeHtml(image[1])}" loading="lazy" decoding="async">${image[3] ? `<figcaption>${escapeHtml(image[3])}</figcaption>` : ""}</figure>`);
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const label = heading[2].trim();
      const id = headingId(label);
      output.push(`<h${level} id="${escapeHtml(id)}">${inlineMarkdown(label)}</h${level}>`);
      if (level >= 2 && level <= 3) headings.push({ level, label: stripTags(label), id });
      continue;
    }
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph();
      flushList();
      output.push("<hr>");
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushList();
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      index -= 1;
      output.push(`<blockquote>${quote.map((item) => `<p>${inlineMarkdown(item)}</p>`).join("")}</blockquote>`);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (list && list.type !== "unordered") flushList();
      list ||= { type: "unordered", items: [] };
      list.items.push(unordered[1]);
      continue;
    }
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (list && list.type !== "ordered") flushList();
      list ||= { type: "ordered", items: [] };
      list.items.push(ordered[1]);
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();
  const wordCount = stripTags(output.join(" ")).split(/\s+/).filter(Boolean).length;
  return { html: output.join("\n"), headings, wordCount, readingTime: Math.max(1, Math.ceil(wordCount / 220)) };
}

async function listMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listMarkdownFiles(absolutePath));
    else if (entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md") files.push(absolutePath);
  }
  return files;
}

function normaliseContentPath(value = "") {
  return String(value).split(/[\\/]+/).map(slugify).filter(Boolean).join("/");
}

async function readMarkdownDirectory(directoryName) {
  const directory = path.join(rootDirectory, "content", directoryName);
  let files;
  try {
    files = await listMarkdownFiles(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const documents = [];
  for (const absolutePath of files) {
    const sourceFile = path.relative(rootDirectory, absolutePath);
    const relativePath = path.relative(directory, absolutePath).split(path.sep).join("/");
    const { attributes, body } = parseFrontmatter(await fs.readFile(absolutePath, "utf8"), sourceFile);
    const fallbackRoute = relativePath.replace(/\.md$/, "").replace(/\/index$/, "");
    const rendered = markdownToHtml(body);
    documents.push({
      ...attributes,
      slug: normaliseContentPath(attributes.route || attributes.slug || fallbackRoute),
      tags: Array.isArray(attributes.tags) ? attributes.tags : String(attributes.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      body,
      sourceFile,
      ...rendered
    });
  }
  return documents;
}

function formatDate(value, options = {}) {
  if (!value) return "Undated";
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: options.long ? "long" : "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function normalisePath(value) {
  if (value === "/") return "/";
  return `/${String(value).replace(/^\/+|\/+$/g, "")}/`;
}

function absoluteUrl(routePath = "/") {
  return `${site.domain.replace(/\/$/, "")}${normalisePath(routePath)}`;
}

function renderHeader(currentPath, navigation) {
  const links = navigation.map((item, index) => {
    const href = normalisePath(item.href);
    const current = currentPath === href || (href !== "/" && currentPath.startsWith(href));
    return `<a href="${escapeHtml(href)}" data-scramble data-scramble-start="${620 + index * 58}"${current ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
  }).join("");
  const nameParts = site.name.trim().split(/\s+/);
  const surname = nameParts.pop() || "";
  const givenName = nameParts.join(" ");
  const wordmark = givenName
    ? `<span data-scramble data-scramble-start="70">${escapeHtml(givenName)}</span><span class="site-surname" data-scramble data-scramble-start="135">${escapeHtml(surname)}</span>`
    : `<span data-scramble data-scramble-start="70">${escapeHtml(surname)}</span>`;
  return `<header class="site-header" data-site-header><div class="site-shell header-inner"><a class="site-name" href="/" aria-label="${escapeHtml(site.name)} — Home">${wordmark}</a><div class="header-navigation"><nav class="site-nav" aria-label="Primary navigation">${links}</nav><div class="header-actions"><button class="location-clock" type="button" data-location-clock data-default-location="${escapeHtml(site.clock.label)}" data-default-time-zone="${escapeHtml(site.clock.timeZone)}" data-birth-date="${escapeHtml(site.birthDate)}" aria-label="Change displayed location and time zone"><span class="clock-place" data-clock-location>${escapeHtml(site.clock.label)}</span><time class="clock-time" data-clock-time>--:--:--</time><span class="clock-age"><span data-live-age>--.------</span> years</span></button><button class="command-trigger" type="button" data-command-open aria-label="Open site search"><span data-scramble data-scramble-start="${620 + navigation.length * 58}">Search</span><kbd>⌘K</kbd></button><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme"><span data-theme-label>Light</span></button></div></div></div></header>`;
}

function renderCommandPalette() {
  return `<dialog class="command-palette" data-command-dialog aria-labelledby="command-title"><div class="command-frame"><div class="command-input-row"><label id="command-title" for="command-search">Search this site</label><button type="button" data-command-close aria-label="Close search">Esc</button></div><input id="command-search" type="search" autocomplete="off" spellcheck="false" placeholder="Projects, notes, logs…" data-command-input><div class="command-results" data-command-results><p>Start typing to search every published page.</p></div><div class="command-footer"><span>↑↓ move</span><span>↵ open</span></div></div></dialog>`;
}

function renderLocationDialog() {
  const presets = [
    ["Dublin", "Europe/Dublin"],
    ["London", "Europe/London"],
    ["New York", "America/New_York"],
    ["San Francisco", "America/Los_Angeles"],
    ["Dubai", "Asia/Dubai"],
    ["Tokyo", "Asia/Tokyo"]
  ].map(([label, zone]) => `<button type="button" data-location-preset data-location-label="${escapeHtml(label)}" data-location-zone="${escapeHtml(zone)}">${escapeHtml(label)}</button>`).join("");
  return `<dialog class="location-dialog" data-location-dialog aria-labelledby="location-title"><form method="dialog" class="location-frame" data-location-form><div class="location-heading"><div><h2 id="location-title">Displayed place</h2><p>This changes the clock in this browser. The site default remains Dublin.</p></div><button type="button" data-location-close aria-label="Close location settings">Esc</button></div><div class="location-presets" aria-label="Common locations">${presets}</div><label for="location-label">Place name</label><input id="location-label" name="label" autocomplete="off" data-location-label-input><label for="location-zone">IANA time zone</label><input id="location-zone" name="zone" autocomplete="off" spellcheck="false" placeholder="Europe/Dublin" data-location-zone-input><p class="location-error" data-location-error aria-live="polite"></p><div class="location-actions"><button type="button" data-location-reset>Reset to Dublin</button><button type="submit">Save</button></div></form></dialog>`;
}

function renderFooter(hasFeed) {
  const links = [
    `<a href="mailto:${escapeHtml(site.email)}">Email</a>`,
    ...site.socialLinks.map((link) => `<a href="${escapeHtml(safeUrl(link.href))}">${escapeHtml(link.label)}</a>`),
    ...(hasFeed ? ['<a href="/feed.xml">RSS</a>'] : [])
  ].join("");
  return `<footer class="site-footer"><div class="site-shell footer-inner"><p>© ${new Date().getUTCFullYear()} ${escapeHtml(site.name)}</p><nav aria-label="Footer navigation">${links}</nav></div></footer>`;
}

function renderDocument({ title, description, currentPath, content, navigation, type = "website", publishedTime = "", noIndex = false, hasFeed = false, bodyClass = "", extraScripts = "" }) {
  const fullTitle = title === site.name ? title : `${title} — ${site.name}`;
  const canonical = absoluteUrl(currentPath);
  const socialImage = `${site.domain.replace(/\/$/, "")}/og-card.png`;
  const schema = {
    "@context": "https://schema.org",
    "@type": type === "article" ? "BlogPosting" : type === "project" ? "CreativeWork" : currentPath === "/" ? "WebSite" : "WebPage",
    name: fullTitle,
    headline: fullTitle,
    description,
    url: canonical,
    author: { "@type": "Person", name: site.name, url: site.domain },
    ...(publishedTime ? { datePublished: publishedTime } : {})
  };
  return `<!doctype html>
<html lang="en" data-palette="${escapeHtml(site.palette || "foundry")}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#0b0b0a" data-theme-color>
  ${noIndex ? '<meta name="robots" content="noindex">' : ""}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${hasFeed ? `<link rel="alternate" href="/feed.xml" type="application/rss+xml" title="${escapeHtml(site.name)} feed">` : ""}
  <script>try{const stored=localStorage.getItem("basil-theme");const system=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=stored||system}catch{document.documentElement.dataset.theme="dark"}document.documentElement.classList.add("js")</script>
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Instrument+Serif:ital@0;1&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Instrument+Serif:ital@0;1&display=swap"></noscript>
  <meta property="og:type" content="${type === "article" ? "article" : "website"}">
  <meta property="og:site_name" content="${escapeHtml(site.name)}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(socialImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(site.socialImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(socialImage)}">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
</head>
<body class="${escapeHtml(bodyClass)}">
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${renderHeader(currentPath, navigation)}
  <main id="main-content">${content}</main>
  ${renderFooter(hasFeed)}
  ${renderCommandPalette()}${renderLocationDialog()}
  <script src="/assets/site.js" defer></script>
  ${extraScripts}
</body>
</html>`;
}

function renderTags(tags = []) {
  if (!tags.length) return "";
  return `<ul class="tag-list" aria-label="Topics">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>`;
}

function renderSectionHeader(title, href = "", label = "View all") {
  return `<header class="section-header"><h2 data-scramble data-scramble-reveal>${escapeHtml(title)}</h2>${href ? `<a href="${escapeHtml(href)}" data-scramble>${escapeHtml(label)} →</a>` : ""}</header>`;
}

function renderProjectRow(project, index) {
  return `<a class="project-row" href="/projects/${escapeHtml(project.slug)}/" data-filter-row data-status="${escapeHtml(String(project.status || "" ).toLowerCase())}" data-search="${escapeHtml(`${project.title} ${project.summary} ${project.tags.join(" ")}`.toLowerCase())}"><span class="row-index">${String(index + 1).padStart(2, "0")}</span><span class="row-main"><strong data-scramble>${escapeHtml(project.title)}</strong><span>${escapeHtml(project.summary || "")}</span></span><span class="row-detail">${escapeHtml(project.status || project.year || "Project")}</span><span class="row-arrow" aria-hidden="true">↗</span></a>`;
}

function renderWritingRow(item) {
  return `<a class="writing-row" href="${escapeHtml(item.href)}"><time datetime="${escapeHtml(item.date || "")}">${escapeHtml(formatDate(item.date))}</time><span class="row-main"><strong data-scramble>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description || "")}</span></span><span class="row-detail">${escapeHtml(item.kind)}</span></a>`;
}

function recentWriting(posts, logs) {
  return [
    ...posts.map((post) => ({ kind: "Article", date: post.date, title: post.title, description: post.description || "", href: `/blog/${post.slug}/` })),
    ...logs.map((log) => ({ kind: "Log", date: log.date, title: log.title, description: log.summary || log.description || "", href: `/log/${log.slug}/` }))
  ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function renderHomeProjectRow(project, index) {
  return `<a class="home-project-row" href="/projects/${escapeHtml(project.slug)}/"><span class="row-index">${String(index + 1).padStart(2, "0")}</span><span class="home-project-copy"><strong data-scramble>${escapeHtml(project.title)}</strong><span>${escapeHtml(project.summary || "")}</span></span><span class="home-project-meta">${escapeHtml([project.year, project.status].filter(Boolean).join(" · ") || "Project")}</span><span class="row-arrow" aria-hidden="true">↗</span></a>`;
}

function renderHomeProjects(projects) {
  return `<div class="home-project-list">${projects.slice(0, 4).map(renderHomeProjectRow).join("")}</div>`;
}

function renderHomeQuote() {
  return `<figure class="home-quote"><blockquote>“${escapeHtml(site.quotes.sagan)}”</blockquote><figcaption>— ${escapeHtml(site.quotes.saganAttribution)}</figcaption></figure>`;
}

function renderHome(projects, posts, logs) {
  const latestPosts = posts.slice(0, 3);
  const latestLogs = logs.slice(0, 3);
  const featuredProjects = projects.filter((project) => project.featured === true);
  const headline = site.headline.map((line, index) => `<span class="headline-line${index === site.headline.length - 1 ? " headline-line-accent" : ""}" style="--line-index:${index}" data-scramble data-scramble-start="${180 + index * 120}">${escapeHtml(line)}</span>`).join("");
  return `<div class="site-shell home"><section class="home-masthead"><div class="home-copy"><h1 aria-label="${escapeHtml(site.headline.join(" "))}">${headline}</h1>${renderHomeQuote()}<p>${escapeHtml(site.introduction)}</p><div class="home-links"><a href="mailto:${escapeHtml(site.email)}">Email</a>${site.socialLinks.map((link) => `<a href="${escapeHtml(safeUrl(link.href))}">${escapeHtml(link.label)}</a>`).join("")}</div></div></section><a class="now-strip" href="${escapeHtml(site.current.href)}" data-reveal><span>${escapeHtml(site.current.title)}</span><strong data-scramble>${escapeHtml(site.current.label)}</strong><p>${escapeHtml(site.current.text)}</p><span>Open note →</span></a><div class="writing-columns writing-first" data-reveal><section class="home-section"><div class="section-copy">${renderSectionHeader("Blog", "/blog/", "All articles")}<p>View some of my writing here.</p></div><div class="writing-list">${latestPosts.map((post) => renderWritingRow({ kind: `${post.readingTime} min`, date: post.date, title: post.title, description: post.description || "", href: `/blog/${post.slug}/` })).join("")}</div></section><section class="home-section"><div class="section-copy">${renderSectionHeader("Build log", "/log/", "All entries")}<p>Notes from the work while it is still changing.</p></div><div class="writing-list">${latestLogs.map((log) => renderWritingRow({ kind: "Log", date: log.date, title: log.title, description: log.summary || log.description || "", href: `/log/${log.slug}/` })).join("")}</div></section></div><section class="home-section projects-home" data-reveal>${renderSectionHeader("Selected projects", "/projects/", "All projects")}${renderHomeProjects(featuredProjects)}</section></div>`;
}

function renderPageHeading(title, description, extra = "") {
  return `<header class="page-heading"><h1 data-scramble data-scramble-start="140">${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${extra}</header>`;
}

function renderProjectsIndex(projects) {
  const statuses = [...new Set(projects.map((project) => project.status).filter(Boolean))];
  return `<div class="site-shell archive-page">${renderPageHeading("Projects", "Built work, experiments, and systems still being tested.")}<div class="archive-toolbar"><div><label for="project-filter">Filter projects</label><input id="project-filter" type="search" placeholder="Search title, field, or summary" data-filter-input></div><div><label for="status-filter">Status</label><select id="status-filter" data-filter-status><option value="">All</option>${statuses.map((status) => `<option value="${escapeHtml(String(status).toLowerCase())}">${escapeHtml(status)}</option>`).join("")}</select></div></div><div class="project-list" data-filter-list>${projects.map(renderProjectRow).join("")}</div><p class="filter-empty" data-filter-empty hidden>No projects match that filter.</p></div>`;
}

function renderToc(headings) {
  if (headings.length < 2) return "";
  return `<aside class="entry-toc"><h2>On this page</h2><ol>${headings.map((heading) => `<li class="toc-level-${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.label)}</a></li>`).join("")}</ol></aside>`;
}

function renderProjectDetail(project) {
  const facts = [
    ["Status", project.status || "—"],
    ["Year", project.year || "—"],
    ["Role", project.role || "Independent project"],
    ["Fields", project.tags.join(" · ") || "—"]
  ];
  return `<div class="site-shell entry-page"><a class="back-link" href="/projects/">← Projects</a><header class="entry-heading"><h1 data-scramble data-scramble-start="140">${escapeHtml(project.title)}</h1><p>${escapeHtml(project.summary || "")}</p><dl>${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></header><div class="entry-layout"><article class="prose">${project.html || "<p>Documentation in progress.</p>"}</article>${renderToc(project.headings)}</div></div>`;
}

function renderBlogIndex(posts) {
  return `<div class="site-shell archive-page">${renderPageHeading("Blog", "Longer writing about projects, engineering, software, and ideas worth keeping.", '<a class="feed-link" href="/feed.xml">RSS feed</a>')}<div class="writing-list">${posts.map((post) => renderWritingRow({ kind: `${post.readingTime} min`, date: post.date, title: post.title, description: post.description || "", href: `/blog/${post.slug}/` })).join("")}</div></div>`;
}

function renderPost(post) {
  return `<div class="site-shell entry-page"><a class="back-link" href="/blog/">← Blog</a><header class="entry-heading"><h1 data-scramble data-scramble-start="140">${escapeHtml(post.title)}</h1><p>${escapeHtml(post.description || "")}</p><dl><div><dt>Published</dt><dd><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date, { long: true }))}</time></dd></div><div><dt>Reading time</dt><dd>${post.readingTime} min</dd></div><div><dt>Topics</dt><dd>${escapeHtml(post.tags.join(" · ") || "Notes")}</dd></div></dl></header><div class="entry-layout"><article class="prose">${post.html}</article>${renderToc(post.headings)}</div></div>`;
}

function renderLogIndex(logs) {
  return `<div class="site-shell archive-page">${renderPageHeading("Log", "Short, dated records from work in progress. Written quickly; kept because details disappear.")}<div class="log-list">${logs.map((log) => `<a class="log-row" href="/log/${escapeHtml(log.slug)}/"><time datetime="${escapeHtml(log.date)}">${escapeHtml(formatDate(log.date))}</time><span class="row-main"><strong data-scramble>${escapeHtml(log.title)}</strong><span>${escapeHtml(log.summary || log.description || "")}</span></span>${renderTags(log.tags)}</a>`).join("")}</div></div>`;
}

function renderLog(log) {
  return `<div class="site-shell entry-page compact-entry"><a class="back-link" href="/log/">← Log</a><header class="entry-heading"><h1 data-scramble data-scramble-start="140">${escapeHtml(log.title)}</h1><p>${escapeHtml(log.summary || log.description || "")}</p><dl><div><dt>Date</dt><dd><time datetime="${escapeHtml(log.date)}">${escapeHtml(formatDate(log.date, { long: true }))}</time></dd></div><div><dt>Topics</dt><dd>${escapeHtml(log.tags.join(" · ") || "Field note")}</dd></div></dl></header><article class="prose">${log.html}</article></div>`;
}

function renderContact() {
  return `<div class="site-shell contact-page">${renderPageHeading("Contact", "Email for a conversation, or choose a time that works.")}<div class="contact-layout"><section class="contact-panel"><div><a class="contact-email" href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a><button type="button" data-copy="${escapeHtml(site.email)}">Copy</button></div><dl><div><dt>Location</dt><dd>${escapeHtml(site.location)}</dd></div><div><dt>Availability</dt><dd>${escapeHtml(site.availability)}</dd></div></dl><ul>${site.socialLinks.map((link) => `<li><span>${escapeHtml(link.label)}</span><a href="${escapeHtml(safeUrl(link.href))}">${escapeHtml(link.display || link.label)}</a></li>`).join("")}</ul></section><section class="calendar-panel"><header><h2>Book 30 minutes</h2><p>The calendar below is connected to my actual availability.</p><a href="https://cal.com/${escapeHtml(site.calendarLink)}">Open booking page ↗</a></header><div id="my-cal-inline-30min" class="calendar-embed"></div></section></div></div>`;
}

function renderCalEmbed() {
  return `<script>(function(C,A,L){let p=function(a,ar){a.q.push(ar)};let d=C.document;C.Cal=C.Cal||function(){let cal=C.Cal;let ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true}if(ar[0]===L){const api=function(){p(api,arguments)};const namespace=ar[1];api.q=api.q||[];if(typeof namespace==="string"){cal.ns[namespace]=cal.ns[namespace]||api;p(cal.ns[namespace],ar);p(cal,["initNamespace",namespace])}else p(cal,ar);return}p(cal,ar)}})(window,"https://app.cal.com/embed/embed.js","init");Cal("init","30min",{origin:"https://app.cal.com"});Cal.config=Cal.config||{};Cal.config.forwardQueryParams=true;Cal.ns["30min"]("inline",{elementOrSelector:"#my-cal-inline-30min",config:{layout:"month_view",useSlotsViewOnSmallScreen:"true"},calLink:"${escapeHtml(site.calendarLink)}"});Cal.ns["30min"]("ui",{hideEventTypeDetails:false,layout:"month_view",styles:{branding:{brandColor:"#9d5f45"}}});</script>`;
}

function renderCustomPage(page) {
  return `<div class="site-shell entry-page"><a class="back-link" href="/">← Home</a><header class="entry-heading"><h1 data-scramble data-scramble-start="140">${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description || "")}</p>${page.updated ? `<p class="page-updated">Updated <time datetime="${escapeHtml(page.updated)}">${escapeHtml(formatDate(page.updated, { long: true }))}</time></p>` : ""}</header><div class="entry-layout"><article class="prose">${page.html}</article>${renderToc(page.headings)}</div></div>`;
}

function renderNotFound() {
  return `<div class="site-shell not-found"><p>404</p><h1 data-scramble data-scramble-start="140">That page is not here.</h1><p>The address may be wrong, or the page may have moved.</p><a href="/">Return home</a></div>`;
}

async function writeRoute(routePath, html) {
  const normalized = normalisePath(routePath);
  const target = normalized === "/" ? path.join(outputDirectory, "index.html") : path.join(outputDirectory, normalized.replace(/^\//, ""), "index.html");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html);
}

async function copyDirectory(source, destination) {
  try {
    const entries = await fs.readdir(source, { withFileTypes: true });
    await fs.mkdir(destination, { recursive: true });
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destinationPath = path.join(destination, entry.name);
      if (entry.isDirectory()) await copyDirectory(sourcePath, destinationPath);
      else await fs.copyFile(sourcePath, destinationPath);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function renderSitemap(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.filter((route) => !route.noIndex).map((route) => `  <url><loc>${escapeHtml(absoluteUrl(route.path))}</loc></url>`).join("\n")}\n</urlset>\n`;
}

function renderFeed(posts, logs) {
  const items = recentWriting(posts, logs).slice(0, 30).map((item) => {
    const link = `${site.domain.replace(/\/$/, "")}${item.href}`;
    return `<item><title>${escapeHtml(item.title)}</title><link>${escapeHtml(link)}</link><guid>${escapeHtml(link)}</guid><pubDate>${new Date(`${item.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escapeHtml(item.description)}</description></item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${escapeHtml(site.name)}</title><link>${escapeHtml(site.domain)}</link><description>${escapeHtml(site.description)}</description>${items}</channel></rss>\n`;
}

function validateContent(groups) {
  const routes = new Set();
  for (const [kind, documents] of Object.entries(groups)) {
    for (const document of documents) {
      if (!document.title) throw new Error(`${document.sourceFile} needs a title.`);
      if (!document.slug) throw new Error(`${document.sourceFile} needs a slug.`);
      const route = kind === "pages" ? document.slug : `${kind}/${document.slug}`;
      if (routes.has(route)) throw new Error(`Duplicate route: ${route}`);
      routes.add(route);
      if (kind === "pages" && coreRoutes.has(document.slug.split("/")[0])) throw new Error(`${document.sourceFile} conflicts with /${document.slug}/.`);
      for (const field of ["date", "updated"]) {
        if (document[field] && !isIsoDate(document[field])) throw new Error(`${document.sourceFile} has an invalid ${field}; use YYYY-MM-DD.`);
      }
    }
  }
}

function searchEntry(document, kind, href, description) {
  return {
    title: document.title,
    description: description || "",
    kind,
    href,
    tags: document.tags || [],
    text: stripTags(document.html || "").slice(0, 4000)
  };
}

export async function build() {
  const [projectsRaw, postsRaw, logsRaw, pagesRaw] = await Promise.all([
    readMarkdownDirectory("projects"),
    readMarkdownDirectory("posts"),
    readMarkdownDirectory("logs"),
    readMarkdownDirectory("pages")
  ]);
  const projects = projectsRaw.filter((item) => item.draft !== true).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const posts = postsRaw.filter((item) => item.draft !== true).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const logs = logsRaw.filter((item) => item.draft !== true).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const pages = pagesRaw.filter((item) => item.draft !== true).sort((a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999));
  validateContent({ projects, blog: posts, log: logs, pages });
  const customNavigation = pages.filter((page) => page.nav === true).map((page) => ({ label: page.navLabel || page.title, href: `/${page.slug}/` }));
  const pageRoutes = new Set(pages.map((page) => normalisePath(`/${page.slug}/`)));
  const navigation = [...new Map([...site.navigation.filter((item) => {
    const href = normalisePath(item.href);
    if (href === "/blog/") return posts.length > 0;
    if (href === "/log/") return logs.length > 0;
    if (coreRoutes.has(href.replaceAll("/", ""))) return true;
    return pageRoutes.has(href);
  }), ...customNavigation].map((item) => [normalisePath(item.href), item])).values()];

  await fs.rm(outputDirectory, { recursive: true, force: true });
  await fs.mkdir(outputDirectory, { recursive: true });
  await copyDirectory(path.join(rootDirectory, "src", "assets"), path.join(outputDirectory, "assets"));
  await copyDirectory(path.join(rootDirectory, "public"), outputDirectory);
  await fs.writeFile(path.join(outputDirectory, ".nojekyll"), "");

  const routes = [];
  const addRoute = async ({ path: routePath, title, description, content, type, publishedTime, noIndex = false, bodyClass = "", extraScripts = "" }) => {
    const normalized = normalisePath(routePath);
    await writeRoute(normalized, renderDocument({ title, description, currentPath: normalized, content, navigation, type, publishedTime, noIndex, hasFeed: posts.length + logs.length > 0, bodyClass, extraScripts }));
    routes.push({ path: normalized, title, noIndex });
  };

  await addRoute({ path: "/", title: site.name, description: site.description, content: renderHome(projects, posts, logs), bodyClass: "home-page" });
  await addRoute({ path: "/projects/", title: "Projects", description: `Projects by ${site.name}.`, content: renderProjectsIndex(projects), bodyClass: "projects-page" });
  if (posts.length) await addRoute({ path: "/blog/", title: "Blog", description: `Articles and technical notes by ${site.name}.`, content: renderBlogIndex(posts), bodyClass: "archive-page-body" });
  if (logs.length) await addRoute({ path: "/log/", title: "Log", description: `Short dated notes by ${site.name}.`, content: renderLogIndex(logs), bodyClass: "archive-page-body" });
  await addRoute({ path: "/contact/", title: "Contact", description: `Contact ${site.name}.`, content: renderContact(), bodyClass: "contact-page-body", extraScripts: renderCalEmbed() });

  for (const project of projects) await addRoute({ path: `/projects/${project.slug}/`, title: project.title, description: project.summary || site.description, content: renderProjectDetail(project), type: "project", publishedTime: project.date || "", bodyClass: "project-detail-page" });
  for (const post of posts) await addRoute({ path: `/blog/${post.slug}/`, title: post.title, description: post.description || site.description, content: renderPost(post), type: "article", publishedTime: post.date, bodyClass: "article-page" });
  for (const log of logs) await addRoute({ path: `/log/${log.slug}/`, title: log.title, description: log.summary || log.description || site.description, content: renderLog(log), type: "article", publishedTime: log.date, bodyClass: "log-detail-page" });
  for (const page of pages) await addRoute({ path: `/${page.slug}/`, title: page.title, description: page.description || site.description, content: renderCustomPage(page), bodyClass: "custom-page" });

  await fs.writeFile(path.join(outputDirectory, "404.html"), renderDocument({ title: "Page not found", description: "The requested page could not be found.", currentPath: "/404/", content: renderNotFound(), navigation, noIndex: true, hasFeed: posts.length + logs.length > 0, bodyClass: "not-found-page" }));
  await fs.writeFile(path.join(outputDirectory, "sitemap.xml"), renderSitemap(routes));
  await fs.writeFile(path.join(outputDirectory, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.domain.replace(/\/$/, "")}/sitemap.xml\n`);
  if (posts.length + logs.length) await fs.writeFile(path.join(outputDirectory, "feed.xml"), renderFeed(posts, logs));
  await fs.writeFile(path.join(outputDirectory, "search.json"), JSON.stringify([
    ...projects.map((project) => searchEntry(project, "Project", `/projects/${project.slug}/`, project.summary)),
    ...posts.map((post) => searchEntry(post, "Article", `/blog/${post.slug}/`, post.description)),
    ...logs.map((log) => searchEntry(log, "Log", `/log/${log.slug}/`, log.summary || log.description)),
    ...pages.map((page) => searchEntry(page, "Page", `/${page.slug}/`, page.description))
  ]));

  console.log(`Built ${routes.length} routes in ${path.relative(process.cwd(), outputDirectory) || "dist"}.`);
  return { routes, projects, posts, logs, pages };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
