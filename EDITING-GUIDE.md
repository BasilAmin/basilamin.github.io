# Complete Editing Guide

## Everyday workflow

```bash
git pull --ff-only
npm run dev
```

Edit in VSCodium. Before publishing:

```bash
npm run check
git add -A
git commit -m "Describe the update"
git push
```

Good commit messages are specific:

```text
Publish Relay field note
Update Now page
Add Smart Sole project
Revise contact copy
Fix mobile spacing
```

## Source map

```text
site.config.mjs        Identity, homepage copy, palette, links, navigation, clock, age, calendar, quote
content/projects/      One Markdown file per project
content/posts/         One Markdown file per blog article
content/logs/          One Markdown file per build log
content/pages/         Now and standalone pages
public/                Favicon, social card, CNAME, and uploaded images
src/assets/site.css    Typography, colours, layout, themes, and responsive rules
src/assets/site.js     Search, text disruption, theme, clock, age, filters, and dialogs
scripts/build.mjs      HTML templates and static-site generator
scripts/new.mjs        New-content command
dist/                  Generated website; never edit directly
```

The rocket, Blackbird, Three.js files, and scroll-linked model rendering have been removed completely.

## Edit the homepage

Open `site.config.mjs`.

```js
name: "Basil Amin",
domain: "https://basilamin.com",
email: "basilaminxyz@gmail.com",
location: "Dublin, Ireland",
palette: "foundry",
birthDate: "2009-02-20",
clock: {
  label: "Dublin",
  timeZone: "Europe/Dublin"
},
headline: [
  "I build systems.",
  "Then I write down",
  "where reality",
  "disagreed."
],
introduction: "Your introduction."
```

Each `headline` item is one intended line.

The current-work strip uses:

```js
current: {
  title: "Now",
  label: "Relay · Smenos · mathematics",
  text: "What you are working on now.",
  href: "/now/"
}
```

The quotation appears directly beneath the homepage statement and uses:

```js
quotes: {
  sagan: "Quotation text",
  saganAttribution: "Carl Sagan"
}
```

## Email, social links, and contact

Edit in `site.config.mjs`:

```js
email: "you@example.com",
socialLinks: [
  { label: "GitHub", href: "https://github.com/YourName", display: "@YourName" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/your-profile/", display: "Your Name" }
]
```

The contact page updates automatically.

## Calendar

```js
calendarLink: "basil-amin/30min"
```

Change that value when the Cal.com event changes.

## Clock and live age

```js
clock: {
  label: "Dublin",
  timeZone: "Europe/Dublin"
}
```

Use valid IANA names such as `Europe/Dublin`, `America/New_York`, or `Asia/Tokyo`.

Visitors can change the displayed location. Their choice is stored only in their browser.

The age is calculated from:

```js
birthDate: "2009-02-20"
```

To remove the public age, delete the `clock-age` span in `renderHeader()` inside `scripts/build.mjs`, then remove the age calculation from `initLocalClock()` in `src/assets/site.js`.

## Navigation

```js
navigation: [
  { label: "Projects", href: "/projects/" },
  { label: "Blog", href: "/blog/" },
  { label: "Logs", href: "/log/" },
  { label: "Now", href: "/now/" },
  { label: "Contact", href: "/contact/" }
]
```

Keep labels short. On narrow screens, the navigation scrolls horizontally instead of breaking the layout.

## Add a project

```bash
npm run new -- project "Project name"
```

Example frontmatter:

```yaml
---
title: Relay
slug: relay
summary: A physical chess system that keeps board state and motion in sync.
year: 2026
date: 2026-07-30
status: Active
role: Designer and engineer
tags: Robotics, Embedded systems
featured: true
order: 1
draft: false
---
```

- `featured: true` makes it eligible for Selected Projects.
- `order` controls ordering; lower numbers appear first.
- `slug` controls the URL.
- `draft: true` hides it without deleting it.

Write normal Markdown below the frontmatter.

## Add a blog article

```bash
npm run new -- post "Article title"
```

```yaml
---
title: Article title
slug: article-title
description: One specific sentence that makes the article worth opening.
date: 2026-07-30
tags: Robotics, Notes
draft: false
---
```

Published articles appear in the Blog archive, homepage, search, RSS feed, and sitemap.

## Add a build log

```bash
npm run new -- log "What changed today"
```

```yaml
---
title: What changed today
slug: what-changed-today
summary: The important failure, decision, or result.
date: 2026-07-30
tags: Relay, Build Log
draft: false
---
```

Logs are deliberately shorter and faster than articles.

## Edit the Now page

Open:

```text
content/pages/now.md
```

Update the writing and the `updated` date when it materially changes.

## Add another page

```bash
npm run new -- page "Page title"
```

```yaml
---
title: Page title
description: What this page contains.
slug: page-title
nav: false
navLabel: Page
navOrder: 30
updated: 2026-07-30
draft: false
---
```

## Images in Markdown

Place images in:

```text
public/images/
```

Then use:

```markdown
![Useful description of the image.](/images/example.png)
```

Optional caption:

```markdown
![Useful description.](/images/example.png "Caption shown beneath the image.")
```

## Themes and colours

Choose the palette in `site.config.mjs`:

```js
palette: "foundry"
```

Available values:

```text
foundry    Carbon, parchment, oxide, and moss. Recommended.
merlot     Blackened plum, limestone, garnet, and lichen.
graphite   Neutral graphite, chalk, rust, and muted green.
```

Each palette contains a matched dark and light mode. The visitor-facing theme button switches between those two modes; it does not change the selected palette.

The variables for all three palettes are at the top of `src/assets/site.css`:

```css
--bg
--surface
--surface-strong
--text
--text-strong
--muted
--quiet
--line
--line-strong
--clay
--clay-bright
--moss
```

`foundry` is the default because it has the strongest balance of warmth, contrast, technical character, and long-form readability. See `COLOUR-PALETTES.md` for the design rationale and exact values.

## Fonts

Instrument Serif is the display face. Instrument Sans is the body face. The web-font request is generated in `scripts/build.mjs`; fallback stacks are near the top of `src/assets/site.css`.

## Text disruption

Elements marked with `data-scramble` receive the disruption effect. Its logic is in `src/assets/site.js`. It automatically disables for visitors who prefer reduced motion.

## Search

`Cmd/Ctrl + K` and `/` open site search. The index is generated from every published project, article, log, and page.

## Social card, favicon, and domain

```text
public/og-card.png
public/favicon.svg
public/CNAME
CNAME
```

Both `CNAME` files should contain `basilamin.com`.

## Preview and validation

```bash
npm run dev
npm run build
npm run check
npm run preview
```

## Publishing

```bash
git pull --ff-only
npm run check
git add -A
git commit -m "Publish update"
git push
```

A push to `main` triggers `.github/workflows/deploy-pages.yml`.

## Never edit generated files

Do not hand-edit:

```text
dist/
dist/feed.xml
dist/sitemap.xml
dist/search.json
```

## Troubleshooting

### Scrolling jumps when moving upward

This final version does not resize the sticky header while scrolling and contains no sticky aerospace scenes. Confirm `src/assets/site.js` does not contain `initHeader()` and that the homepage does not load `/assets/rocket.js`.

### A new item is missing

Check for `draft: true`, then run `npm run check`.

### The live site did not update

Open the repository Actions tab, inspect the failed Pages run, fix the first error, run `npm run check`, then commit and push again.

### Restore the old site

The backup branch is `backup-before-final-site`. See `REPLACE-EXISTING-SITE.md`.
