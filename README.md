# basilamin.com

A hand-built static personal website for projects, a blog, build logs, a current-work note, and contact. Markdown is transformed into the finished site by a small Node build script.

Repository:

```text
https://github.com/BasilAmin/basilamin.github.io
```

Read:

- `START-HERE.md` to replace the existing live repository safely.
- `REPLACE-EXISTING-SITE.md` for GitHub Desktop, rollback, and troubleshooting.
- `EDITING-GUIDE.md` for the complete editing reference.

## Run locally

Node.js 20 or newer is required.

```bash
npm run dev
```

No `npm install` is required.

## Validate and publish

```bash
npm run check
git add -A
git commit -m "Publish update"
git push
```

## Create content

```bash
npm run new -- project "Project name"
npm run new -- post "Article title"
npm run new -- log "What changed today"
npm run new -- page "Page title"
```

## Main source files

```text
site.config.mjs        Identity, copy, links, clock, birth date, calendar, quote
content/projects/      Project case studies
content/posts/         Blog articles
content/logs/          Build logs
content/pages/         Now and standalone pages
src/assets/site.css    Visual system and themes
src/assets/site.js     Search, disruption, theme, clock, and live age
scripts/build.mjs      Page templates and site generator
public/                Social card, favicon, CNAME, and images
dist/                  Generated output; never edit directly
```

The final homepage contains no rocket, Blackbird, Three.js runtime, or scroll-linked model rendering.
