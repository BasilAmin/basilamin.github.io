import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { site } from "../site.config.mjs";
import { logEntries } from "../content/log.mjs";

const filePath = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(filePath);
const rootDirectory = path.resolve(scriptsDirectory, "..");
const outputDirectory = path.join(rootDirectory, "dist");

const coreRoutes = new Set(["", "projects", "log", "blog", "contact"]);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripTags(value = "") {
  return String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatterValue(key, value) {
  const trimmed = value.trim().replace(/^(["'])(.*)\1$/, "$2");
  if (["true", "false"].includes(trimmed.toLowerCase())) {
    return trimmed.toLowerCase() === "true";
  }
  if (["order", "navOrder", "year"].includes(key) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (key === "tags") {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return trimmed;
}

function parseFrontmatter(raw, sourceFile = "Markdown file") {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { attributes: {}, body: normalized.trim() };
  }

  const closingMatch = /\n---(?:\n|$)/.exec(normalized.slice(4));
  if (!closingMatch) {
    throw new Error(`${sourceFile}: frontmatter opened with --- but was not closed.`);
  }
  const endIndex = closingMatch.index + 4;
  const bodyStart = endIndex + closingMatch[0].length;

  const attributes = {};
  const header = normalized.slice(4, endIndex);
  for (const line of header.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    attributes[key] = parseFrontmatterValue(key, value);
  }

  return {
    attributes,
    body: normalized.slice(bodyStart).trim()
  };
}

function safeUrl(rawUrl = "") {
  const value = rawUrl.trim();
  if (
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("mailto:") ||
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("./") ||
    value.startsWith("../")
  ) {
    return value;
  }
  return "#";
}

function inlineMarkdown(value = "") {
  const tokens = [];
  const token = (html) => {
    const id = `\u0000TOKEN${tokens.length}\u0000`;
    tokens.push(html);
    return id;
  };

  let text = String(value);
  text = text.replace(/`([^`]+)`/g, (_, code) => token(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const cleanHref = safeUrl(href);
    return token(`<a href="${escapeHtml(cleanHref)}">${escapeHtml(label)}</a>`);
  });

  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/_([^_]+)_/g, "<em>$1</em>");

  tokens.forEach((html, index) => {
    text = text.replace(`\u0000TOKEN${index}\u0000`, html);
  });

  return text;
}

function markdownToHtml(markdown = "") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) return;
    const tag = listType === "ordered" ? "ol" : "ul";
    output.push(`<${tag}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`);
    listType = null;
    listItems = [];
  };

  const flushCode = () => {
    if (!inCode) return;
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : "";
    output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    inCode = false;
    codeLanguage = "";
    codeLines = [];
  };

  for (const line of lines) {
    const codeFence = line.match(/^```\s*([\w-]*)\s*$/);
    if (codeFence) {
      if (inCode) {
        flushCode();
      } else {
        flushParagraph();
        flushList();
        inCode = true;
        codeLanguage = codeFence[1] || "";
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      flushParagraph();
      flushList();
      const source = safeUrl(image[2]);
      const caption = image[3] || "";
      output.push(`<figure class="prose-figure"><img src="${escapeHtml(source)}" alt="${escapeHtml(image[1])}" loading="lazy" decoding="async">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const label = heading[2].trim();
      output.push(`<h${level} id="${escapeHtml(slugify(stripTags(label)))}">${inlineMarkdown(label)}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      output.push(`<blockquote><p>${inlineMarkdown(quote[1])}</p></blockquote>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType && listType !== "unordered") flushList();
      listType = "unordered";
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType && listType !== "ordered") flushList();
      listType = "ordered";
      listItems.push(ordered[1]);
      continue;
    }

    if (/^_{3,}$|^-{3,}$|^\*{3,}$/.test(line.trim())) {
      flushParagraph();
      flushList();
      output.push("<hr>");
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();
  return output.join("\n");
}

async function listMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(absolutePath));
    } else if (entry.name.endsWith(".md")) {
      files.push(absolutePath);
    }
  }

  return files;
}

function normaliseContentPath(value = "") {
  return String(value)
    .split(/[\\/]+/)
    .map(slugify)
    .filter(Boolean)
    .join("/");
}

async function readMarkdownDirectory(directoryName) {
  const directory = path.join(rootDirectory, "content", directoryName);
  let fileNames = [];

  try {
    fileNames = await listMarkdownFiles(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const documents = [];
  for (const absolutePath of fileNames) {
    const raw = await fs.readFile(absolutePath, "utf8");
    const relativePath = path.relative(directory, absolutePath).split(path.sep).join("/");
    const sourceFile = path.relative(rootDirectory, absolutePath);
    const { attributes, body } = parseFrontmatter(raw, sourceFile);
    const fallbackRoute = relativePath.replace(/\.md$/, "").replace(/\/index$/, "");
    const slug = normaliseContentPath(attributes.route || attributes.slug || fallbackRoute);

    documents.push({
      ...attributes,
      slug,
      body,
      html: markdownToHtml(body),
      sourceFile
    });
  }

  return documents;
}

function formatDate(dateValue, options = {}) {
  if (!dateValue) return "Undated";
  const date = new Date(`${dateValue}T12:00:00Z`);
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
  const base = site.domain.replace(/\/$/, "");
  return `${base}${normalisePath(routePath)}`;
}

function renderHeader(currentPath, navigation) {
  const links = navigation
    .filter((item) => normalisePath(item.href) !== "/")
    .map((item) => {
      const href = normalisePath(item.href);
      const isCurrent = currentPath === href || (href !== "/" && currentPath.startsWith(href));
      return `<a href="${escapeHtml(href)}"${isCurrent ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
    })
    .join("");
  const indexHref = currentPath === "/" ? "#site-index" : "/#site-index";

  return `
    <header class="site-header">
      <div class="site-shell header-inner">
        <a class="site-name" href="/">${escapeHtml(site.name)}</a>
        <nav class="site-nav" aria-label="Primary navigation">${links}</nav>
        <a class="mobile-index-link" href="${indexHref}">Index</a>
      </div>
    </header>`;
}

function renderFooter(hasFeed) {
  const links = [
    `<a href="mailto:${escapeHtml(site.email)}">Email</a>`,
    ...site.socialLinks.map((link) => `<a href="${escapeHtml(safeUrl(link.href))}">${escapeHtml(link.label)}</a>`),
    ...(hasFeed ? ['<a href="/feed.xml">RSS</a>'] : [])
  ].join("");

  return `
    <footer class="site-footer">
      <div class="site-shell footer-inner">
        <p>© ${new Date().getUTCFullYear()} ${escapeHtml(site.name)}</p>
        <nav aria-label="Footer navigation">${links}</nav>
      </div>
    </footer>`;
}

function renderDocument({
  title,
  description,
  currentPath,
  content,
  navigation,
  type = "website",
  publishedTime = "",
  noIndex = false,
  hasFeed = false
}) {
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
    author: {
      "@type": "Person",
      name: site.name,
      url: site.domain
    },
    ...(publishedTime ? { datePublished: publishedTime } : {})
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#0a0a0c">
  ${noIndex ? '<meta name="robots" content="noindex">' : ""}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${hasFeed ? `<link rel="alternate" href="/feed.xml" type="application/rss+xml" title="${escapeHtml(site.name)} blog">` : ""}
  <link rel="stylesheet" href="/assets/site.css">
  <meta property="og:type" content="${type === "article" ? "article" : "website"}">
  <meta property="og:site_name" content="${escapeHtml(site.name)}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(socialImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(site.socialImageAlt || `${site.name} — projects, notes, and experiments`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(socialImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(site.socialImageAlt || `${site.name} — projects, notes, and experiments`)}">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${renderHeader(currentPath, navigation)}
  <main id="main-content">${content}</main>
  ${renderFooter(hasFeed)}
  <script src="/assets/site.js" defer></script>
</body>
</html>`;
}

function renderTags(tags = []) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `<span class="tag-list">${escapeHtml(tags.join(", "))}</span>`;
}

function renderEmptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function renderProjectRow(project) {
  return `
    <a class="project-row" href="/projects/${escapeHtml(project.slug)}/">
      <span class="row-code">${escapeHtml(project.year || "Project")}</span>
      <span class="row-copy">
        <strong>${escapeHtml(project.title)}</strong>
        <span>${escapeHtml(project.summary || "")}</span>
      </span>
      <span class="row-meta">${escapeHtml(project.status || "Project")}</span>
    </a>`;
}

function renderPostRow(post) {
  return `
    <a class="post-row" href="/blog/${escapeHtml(post.slug)}/">
      <time datetime="${escapeHtml(post.date || "")}">${escapeHtml(formatDate(post.date))}</time>
      <span class="row-copy">
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.description || "")}</span>
      </span>
      ${renderTags(post.tags)}
    </a>`;
}

function logEntryId(entry) {
  return slugify(`${entry.date || "undated"}-${entry.title || "update"}`);
}

function renderRecentRow(item) {
  return `
    <a class="recent-row" href="${escapeHtml(item.href)}">
      <span class="recent-date">${escapeHtml(item.displayDate)}</span>
      <span class="recent-kind">${escapeHtml(item.kind)}</span>
      <span class="row-copy">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.description || "")}</span>
      </span>
    </a>`;
}

function recentItems(projects, posts) {
  return [
    ...projects.filter((project) => project.featured !== false).map((project) => ({
      kind: "project",
      sortDate: project.date || `${project.year || "0000"}-01-01`,
      displayDate: project.year || "Project",
      title: project.title,
      description: project.summary || "",
      href: `/projects/${project.slug}/`
    })),
    ...posts.map((post) => ({
      kind: "writing",
      sortDate: post.date || "0000-01-01",
      displayDate: formatDate(post.date),
      title: post.title,
      description: post.description || "",
      href: `/blog/${post.slug}/`
    })),
    ...logEntries.map((entry) => ({
      kind: "log",
      sortDate: entry.date || "0000-01-01",
      displayDate: formatDate(entry.date),
      title: entry.title || "Update",
      description: entry.text || "",
      href: `/log/#${logEntryId(entry)}`
    }))
  ]
    .sort((a, b) => String(b.sortDate).localeCompare(String(a.sortDate)))
    .slice(0, 5);
}

function renderOrbitalVisual() {
  return `
    <div class="orbital-stage" aria-hidden="true">
      <svg class="orbital-visual" data-orbital-visual viewBox="0 0 500 500" focusable="false">
        <defs>
          <clipPath id="sphere-clip"><circle cx="250" cy="250" r="126"/></clipPath>
          <clipPath id="orbit-front"><rect x="0" y="250" width="500" height="250"/></clipPath>
        </defs>
        <g class="orbit-ring orbit-ring-a">
          <ellipse cx="250" cy="250" rx="205" ry="72" transform="rotate(-23 250 250)" class="orbit-path orbit-path-back"/>
        </g>
        <g class="orbit-ring orbit-ring-b">
          <ellipse cx="250" cy="250" rx="180" ry="96" transform="rotate(61 250 250)" class="orbit-path orbit-path-secondary orbit-path-back"/>
        </g>
        <circle cx="250" cy="250" r="126" class="sphere-body"/>
        <g data-sphere-grid>
          <g clip-path="url(#sphere-clip)">
            <g>
              <ellipse cx="250" cy="250" rx="126" ry="126" class="orbital-longitude" data-sphere-meridian data-phase="0"/>
              <ellipse cx="250" cy="250" rx="126" ry="126" class="orbital-longitude" data-sphere-meridian data-phase="0.392699"/>
              <ellipse cx="250" cy="250" rx="126" ry="126" class="orbital-longitude" data-sphere-meridian data-phase="0.785398"/>
              <ellipse cx="250" cy="250" rx="126" ry="126" class="orbital-longitude" data-sphere-meridian data-phase="1.178097"/>
              <ellipse cx="250" cy="250" rx="126" ry="126" class="orbital-longitude" data-sphere-meridian data-phase="1.570796"/>
            </g>
            <ellipse cx="250" cy="250" rx="126" ry="35" class="orbital-latitude"/>
            <ellipse cx="250" cy="250" rx="126" ry="76" class="orbital-latitude"/>
            <ellipse cx="250" cy="250" rx="126" ry="108" class="orbital-latitude"/>
          </g>
          <circle cx="250" cy="250" r="126" class="sphere-outline"/>
        </g>
        <g clip-path="url(#orbit-front)">
          <g class="orbit-ring orbit-ring-a">
            <ellipse cx="250" cy="250" rx="205" ry="72" transform="rotate(-23 250 250)" class="orbit-path orbit-path-front"/>
            <circle cx="61.3" cy="330.1" r="4.25" class="orbit-node"/>
          </g>
          <g class="orbit-ring orbit-ring-b">
            <ellipse cx="250" cy="250" rx="180" ry="96" transform="rotate(61 250 250)" class="orbit-path orbit-path-secondary orbit-path-front"/>
            <circle cx="166.2" cy="296.9" r="3" class="orbit-node orbit-node-secondary"/>
          </g>
        </g>
        <circle cx="250" cy="250" r="2.5" class="sphere-centre"/>
      </svg>
    </div>`;
}

function renderDirectoryRow(item, projects, posts) {
  const href = normalisePath(item.href);
  const detail = href === "/projects/"
    ? `${projects.length} ${projects.length === 1 ? "project" : "projects"}`
    : href === "/blog/"
      ? `${posts.length} ${posts.length === 1 ? "article" : "articles"}`
      : href === "/log/"
        ? `${logEntries.length} ${logEntries.length === 1 ? "note" : "notes"}`
        : href === "/contact/"
          ? "email"
          : "page";

  return `
    <a class="directory-row" href="${escapeHtml(href)}">
      <code>${escapeHtml(href)}</code>
      <span class="directory-description">${escapeHtml(item.description || item.label || "")}</span>
      <span class="directory-detail">${escapeHtml(detail)}</span>
    </a>`;
}

function renderHome(projects, posts, pages, navigation) {
  const directories = navigation
    .filter((item) => normalisePath(item.href) !== "/")
    .map((item) => ({
      ...item,
      description: item.description || pages.find((page) => normalisePath(`/${page.slug}/`) === normalisePath(item.href))?.description || ""
    }));

  for (const page of pages) {
    const href = `/${page.slug}/`;
    if (directories.some((item) => normalisePath(item.href) === normalisePath(href))) continue;
    directories.push({ label: page.title, href, description: page.description || "" });
  }

  const socialLinks = site.socialLinks
    .map((link) => `<a href="${escapeHtml(safeUrl(link.href))}">${escapeHtml(link.label)}</a>`)
    .join("");
  const recent = recentItems(projects, posts);
  const nowPage = pages.find((page) => page.slug === "now");
  const nowLink = nowPage?.updated
    ? `Updated ${formatDate(nowPage.updated)} →`
    : "Read more →";

  return `
    <div class="site-shell home">
      <section class="home-intro">
        <canvas id="space-canvas" aria-hidden="true"></canvas>
        <div class="home-copy">
          <h1>${escapeHtml(site.headline)}</h1>
          <p>${escapeHtml(site.introduction)}</p>
          <p class="home-links"><a href="mailto:${escapeHtml(site.email)}">Email</a>${socialLinks}</p>
        </div>
        ${renderOrbitalVisual()}
      </section>

      <section class="home-section" aria-labelledby="site-index-heading">
        <header class="section-header"><h2 id="site-index-heading">Index</h2></header>
        <nav class="directory-list" id="site-index" aria-label="Site index">${directories.map((item) => renderDirectoryRow(item, projects, posts)).join("")}</nav>
      </section>

      ${nowPage ? `<section class="home-now" aria-labelledby="now-heading">
        <h2 id="now-heading">Now</h2>
        <p>${escapeHtml(site.now)}</p>
        <a href="/now/">${escapeHtml(nowLink)}</a>
      </section>` : ""}

      ${recent.length ? `<section class="home-section" aria-labelledby="recent-heading">
        <header class="section-header"><h2 id="recent-heading">Recent</h2></header>
        <div class="recent-list">${recent.map(renderRecentRow).join("")}</div>
      </section>` : ""}
    </div>`;
}

function renderProjectsIndex(projects) {
  return `
    <div class="site-shell">
      <header class="page-heading">
        <h1>Projects</h1>
        <p>Projects, experiments, and tools I have built.</p>
      </header>
      <section class="archive-section">
        <div class="project-list">${projects.length ? projects.map(renderProjectRow).join("") : renderEmptyState("No projects published yet.")}</div>
      </section>
    </div>`;
}

function renderProjectDetail(project) {
  return `
    <div class="site-shell entry-page">
      <header class="entry-heading">
        <a class="back-link" href="/projects/">← Projects</a>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.summary || "")}</p>
        <dl class="entry-meta">
          <div><dt>Year</dt><dd>${escapeHtml(project.year || "—")}</dd></div>
          <div><dt>Status</dt><dd>${escapeHtml(project.status || "—")}</dd></div>
          <div><dt>Fields</dt><dd>${escapeHtml((project.tags || []).join(", ") || "—")}</dd></div>
        </dl>
      </header>
      <article class="prose">${project.html}</article>
    </div>`;
}

function renderBlogIndex(posts) {
  return `
    <div class="site-shell">
      <header class="page-heading">
        <h1>Blog</h1>
        <p>Longer notes about projects, physics, software, and whatever I am trying to understand.</p>
        <a class="inline-link" href="/feed.xml">RSS feed</a>
      </header>
      <section class="archive-section">
        <div class="post-list">${posts.length ? posts.map(renderPostRow).join("") : renderEmptyState("No articles published yet.")}</div>
      </section>
    </div>`;
}

function renderPost(post) {
  return `
    <div class="site-shell entry-page">
      <header class="entry-heading">
        <a class="back-link" href="/blog/">← Blog</a>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.description || "")}</p>
        <dl class="entry-meta">
          <div><dt>Published</dt><dd><time datetime="${escapeHtml(post.date || "")}">${escapeHtml(formatDate(post.date, { long: true }))}</time></dd></div>
          <div><dt>Filed under</dt><dd>${escapeHtml((post.tags || []).join(", ") || "Notes")}</dd></div>
        </dl>
      </header>
      <article class="prose">${post.html}</article>
    </div>`;
}

function renderLog() {
  const sorted = [...logEntries].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return `
    <div class="site-shell">
      <header class="page-heading">
        <h1>Log</h1>
        <p>Small dated notes from projects, reading, and work in progress.</p>
      </header>
      <section class="archive-section">
        <div class="log-list">${sorted.length ? sorted
          .map(
            (entry) => `
            <article class="log-entry" id="${escapeHtml(logEntryId(entry))}">
              <time datetime="${escapeHtml(entry.date)}">${escapeHtml(formatDate(entry.date))}</time>
              <div><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.text)}</p></div>
              ${renderTags(entry.tags)}
            </article>`
          )
          .join("") : renderEmptyState("No log entries yet.")}</div>
      </section>
    </div>`;
}

function renderContact() {
  const socialItems = site.socialLinks
    .map((link) => `<li><span>${escapeHtml(link.label)}</span><a href="${escapeHtml(safeUrl(link.href))}">${escapeHtml(link.display || link.label)}</a></li>`)
    .join("");

  return `
    <div class="site-shell contact-page">
      <header class="page-heading">
        <h1>Contact</h1>
        <p>Email is the best way to reach me.</p>
      </header>
      <section class="contact-details">
        <div>
          <a class="contact-email" href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>
          <button type="button" data-copy="${escapeHtml(site.email)}" aria-live="polite">Copy email</button>
        </div>
        <dl>
          <div><dt>Location</dt><dd>${escapeHtml(site.location)}</dd></div>
          <div><dt>Availability</dt><dd>${escapeHtml(site.availability)}</dd></div>
        </dl>
        <ul>${socialItems}</ul>
      </section>
    </div>`;
}

function renderCustomPage(page) {
  return `
    <div class="site-shell entry-page">
      <header class="entry-heading">
        <a class="back-link" href="/">← Home</a>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description || "")}</p>
        ${page.updated ? `<p class="page-updated">Updated <time datetime="${escapeHtml(page.updated)}">${escapeHtml(formatDate(page.updated, { long: true }))}</time></p>` : ""}
      </header>
      <article class="prose">${page.html}</article>
    </div>`;
}

function renderNotFound() {
  return `
    <div class="site-shell not-found">
      <p>404</p>
      <h1>That page is not here.</h1>
      <p>The address may be wrong, or the page may have moved.</p>
      <a href="/">Return home</a>
    </div>`;
}


async function writeRoute(routePath, html) {
  const normalized = normalisePath(routePath);
  const target =
    normalized === "/"
      ? path.join(outputDirectory, "index.html")
      : path.join(outputDirectory, normalized.replace(/^\//, ""), "index.html");
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
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, destinationPath);
      } else {
        await fs.copyFile(sourcePath, destinationPath);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function renderSitemap(routes) {
  const urls = routes
    .filter((route) => !route.noIndex)
    .map((route) => `  <url><loc>${escapeHtml(absoluteUrl(route.path))}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function renderFeed(posts) {
  const base = site.domain.replace(/\/$/, "");
  const items = posts
    .slice(0, 20)
    .map((post) => {
      const link = `${base}/blog/${post.slug}/`;
      const pubDate = new Date(`${post.date}T12:00:00Z`).toUTCString();
      return `
    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid>${escapeHtml(link)}</guid>
      <pubDate>${escapeHtml(pubDate)}</pubDate>
      <description>${escapeHtml(post.description || "")}</description>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(site.name)}</title>
    <link>${escapeHtml(base)}</link>
    <description>${escapeHtml(site.description)}</description>${items}
  </channel>
</rss>\n`;
}

function validateContent(projects, posts, pages) {
  const seen = new Set();
  const check = (kind, document) => {
    if (!document.title) throw new Error(`${document.sourceFile} needs a title.`);
    if (!document.slug) throw new Error(`${document.sourceFile} needs a slug.`);
    const routeKey = kind === "page" ? document.slug : `${kind}/${document.slug}`;
    if (seen.has(routeKey)) throw new Error(`Duplicate route: ${routeKey}`);
    seen.add(routeKey);
    if (kind === "page" && coreRoutes.has(document.slug.split("/")[0])) {
      throw new Error(`${document.sourceFile} conflicts with the built-in /${document.slug}/ route.`);
    }
    for (const field of ["date", "updated"]) {
      if (document[field] && !isIsoDate(document[field])) {
        throw new Error(`${document.sourceFile} has an invalid ${field}; use YYYY-MM-DD.`);
      }
    }
  };
  projects.forEach((item) => check("projects", item));
  posts.forEach((item) => check("blog", item));
  pages.forEach((item) => check("page", item));
  logEntries.forEach((entry, index) => {
    if (!entry.title) throw new Error(`content/log.mjs entry ${index + 1} needs a title.`);
    if (!isIsoDate(entry.date)) {
      throw new Error(`content/log.mjs entry ${index + 1} has an invalid date; use YYYY-MM-DD.`);
    }
  });
}

export async function build() {
  const [projectsRaw, postsRaw, pagesRaw] = await Promise.all([
    readMarkdownDirectory("projects"),
    readMarkdownDirectory("posts"),
    readMarkdownDirectory("pages")
  ]);

  const projects = projectsRaw
    .filter((item) => item.draft !== true)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const posts = postsRaw
    .filter((item) => item.draft !== true)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const pages = pagesRaw
    .filter((item) => item.draft !== true)
    .sort((a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999));
  validateContent(projects, posts, pages);

  const customNavigation = pages
    .filter((page) => page.nav === true)
    .map((page) => ({
      label: page.navLabel || page.title,
      href: `/${page.slug}/`,
      description: page.description || ""
    }));
  const pageRoutes = new Set(pages.map((page) => normalisePath(`/${page.slug}/`)));
  const coreNavigation = site.navigation.filter((item) => {
    const href = normalisePath(item.href);
    if (href === "/blog/") return posts.length > 0;
    if (coreRoutes.has(href.replaceAll("/", ""))) return true;
    return pageRoutes.has(href);
  });
  const navigation = [...new Map(
    [...coreNavigation, ...customNavigation].map((item) => [normalisePath(item.href), item])
  ).values()];

  await fs.rm(outputDirectory, { recursive: true, force: true });
  await fs.mkdir(outputDirectory, { recursive: true });
  await copyDirectory(path.join(rootDirectory, "src", "assets"), path.join(outputDirectory, "assets"));
  await copyDirectory(path.join(rootDirectory, "public"), outputDirectory);
  await fs.writeFile(path.join(outputDirectory, ".nojekyll"), "");

  const routes = [];
  const addRoute = async ({ path: routePath, title, description, content, type, publishedTime, noIndex = false }) => {
    const normalized = normalisePath(routePath);
    const html = renderDocument({
      title,
      description,
      currentPath: normalized,
      content,
      navigation,
      type,
      publishedTime,
      noIndex,
      hasFeed: posts.length > 0
    });
    await writeRoute(normalized, html);
    routes.push({ path: normalized, title, noIndex });
  };

  await addRoute({
    path: "/",
    title: site.name,
    description: site.description,
    content: renderHome(projects, posts, pages, navigation)
  });
  await addRoute({
    path: "/projects/",
    title: "Projects",
    description: `Projects by ${site.name}: ${site.description}`,
    content: renderProjectsIndex(projects)
  });
  await addRoute({
    path: "/log/",
    title: "Log",
    description: `Short project and learning notes from ${site.name}.`,
    content: renderLog()
  });
  if (posts.length) {
    await addRoute({
      path: "/blog/",
      title: "Blog",
      description: `Essays and technical notes from ${site.name}.`,
      content: renderBlogIndex(posts)
    });
  }
  await addRoute({
    path: "/contact/",
    title: "Contact",
    description: `Contact ${site.name}.`,
    content: renderContact()
  });

  for (const project of projects) {
    await addRoute({
      path: `/projects/${project.slug}/`,
      title: project.title,
      description: project.summary || site.description,
      content: renderProjectDetail(project),
      type: "project",
      publishedTime: project.date || ""
    });
  }

  for (const post of posts) {
    await addRoute({
      path: `/blog/${post.slug}/`,
      title: post.title,
      description: post.description || site.description,
      content: renderPost(post),
      type: "article",
      publishedTime: post.date
    });
  }

  for (const page of pages) {
    await addRoute({
      path: `/${page.slug}/`,
      title: page.title,
      description: page.description || site.description,
      content: renderCustomPage(page)
    });
  }

  const notFound = renderDocument({
    title: "Page not found",
    description: "The requested page could not be found.",
    currentPath: "/404/",
    content: renderNotFound(),
    navigation,
    noIndex: true,
    hasFeed: posts.length > 0
  });
  await fs.writeFile(path.join(outputDirectory, "404.html"), notFound);

  await fs.writeFile(path.join(outputDirectory, "sitemap.xml"), renderSitemap(routes));
  await fs.writeFile(
    path.join(outputDirectory, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${site.domain.replace(/\/$/, "")}/sitemap.xml\n`
  );
  if (posts.length) {
    await fs.writeFile(path.join(outputDirectory, "feed.xml"), renderFeed(posts));
  }

  console.log(`Built ${routes.length} routes in ${path.relative(process.cwd(), outputDirectory) || "dist"}.`);
  return { routes, projects, posts, pages };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
