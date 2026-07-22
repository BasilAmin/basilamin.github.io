# basilamin.com

A small static personal website for projects, short logs, longer writing, and standalone pages. The homepage is a directory and recent-work index rather than a portfolio pitch. It uses normal HTML, CSS, JavaScript, Markdown, and a small Node build script.

There is no React, Next.js, Astro, database, package dependency, or client-side framework.

## Never edit `dist/`

The build deletes and recreates `dist/` every time it runs.

```text
site.config.mjs + content/ + src/ → npm run build → dist/
```

Edit the files on the left. Treat `dist/` as generated output.

## Run the site locally

Install Node.js 20 or newer, open a terminal in the project folder, and run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The server watches the source files and rebuilds after a save. There is no `npm install` step because the site has no dependencies.

Create the production build with:

```bash
npm run build
```

Before pushing, run the complete production and link-integrity check:

```bash
npm run check
```

## Folder map

| Path | Purpose |
|---|---|
| `site.config.mjs` | Name, domain, email, homepage writing, social links, and main navigation |
| `content/projects/` | One Markdown file per project |
| `content/posts/` | One Markdown file per blog article |
| `content/pages/` | Standalone pages and nested page directories |
| `content/log.mjs` | Short dated log entries |
| `src/assets/site.css` | Layout, colour, typography, responsive rules, and CSS motion |
| `src/assets/site.js` | Sphere animation, rare meteors, and copy-email behaviour |
| `scripts/build.mjs` | Shared HTML and the static-site generator |
| `public/` | Favicon, social-sharing image, and any images you publish |
| `examples/` | Unpublished project and article examples |
| `dist/` | Generated output; never edit it directly |

# Homepage

Most homepage writing is in `site.config.mjs`:

```js
export const site = {
  name: "Basil Amin",
  domain: "https://basilamin.com",
  email: "basilaminxyz@gmail.com",
  location: "Dublin, Ireland",
  headline: "Projects, notes, and experiments.",
  introduction: "...",
  now: "Learning about drone swarms and multi-agent systems.",
  availability: "Email is open."
};
```

The homepage is assembled automatically:

- **Index** comes from `site.navigation` and every published file in `content/pages/`.
- **Now** comes from `site.now`; its updated date comes from `content/pages/now.md`.
- **Recent** combines projects, posts, and logs into one chronological list.
- **Blog** and **RSS** remain hidden until at least one published article exists.

# Pages and directories

A public directory is a folder containing an `index.html` file. The generator creates that folder for you.

```text
content/pages/library.md
        ↓ npm run build
 dist/library/index.html
        ↓ public URL
       /library/
```

## Add a top-level page

Create `content/pages/library.md`:

```md
---
title: Library
description: Books, papers, links, and references I want to keep.
slug: library
nav: false
navLabel: Library
navOrder: 30
updated: 2026-07-21
---
Write the page here.
```

This creates:

```text
/library/
```

Every published standalone page appears in the homepage Index.

```md
nav: true
```

adds it to the desktop header.

```md
nav: false
```

keeps the header compact while leaving the page in the homepage Index.

## Edit a page

Open its Markdown file and edit either the frontmatter between the `---` lines or the writing beneath it.

Useful fields:

```text
title        Page heading and browser title
description  Search description and homepage Index description
slug         Top-level URL name
route        Exact nested URL such as notes/physics
nav          true adds the page to the desktop header
navLabel     Shorter label for the header
navOrder     Order among custom header pages
updated      Optional YYYY-MM-DD date shown near the page title
draft        true prevents the page from being published
```

## Delete a page

Delete its source Markdown file and rebuild:

```text
Delete content/pages/library.md
→ removes /library/
```

Because `dist/` is rebuilt from scratch, the old generated directory disappears automatically.

## Rename a page

Change:

```md
slug: library
```

to:

```md
slug: reading
```

The next build removes `/library/` and creates `/reading/`. Update any hand-written links that still point to the old address.

## Add a nested directory

Create:

```text
content/pages/notes/physics.md
```

With:

```md
---
title: Physics notes
description: Notes from problems, reading, and small simulations.
nav: false
---
Write the page here.
```

The file path creates:

```text
/notes/physics/
```

To create the directory root `/notes/`, add:

```text
content/pages/notes/index.md
```

A complete source structure might be:

```text
content/pages/
└── notes/
    ├── index.md
    ├── physics.md
    ├── robotics.md
    └── software.md
```

It produces:

```text
/notes/
/notes/physics/
/notes/robotics/
/notes/software/
```

You can also set an exact nested address:

```md
---
title: Orbital mechanics notes
route: notes/physics/orbital-mechanics
nav: false
---
```

## Delete a directory

Delete every source Markdown file that creates it, then remove the empty source folder:

```text
content/pages/notes/index.md
content/pages/notes/physics.md
content/pages/notes/robotics.md
```

The generated `/notes/` directories disappear after the next build.

# Projects

Projects live in `content/projects/`.

## Add a project

Create `content/projects/my-project.md`:

```md
---
title: My Project
slug: my-project
summary: One direct sentence explaining what it is.
year: 2026
date: 2026-07-21
status: In progress
tags: Physics, Software
featured: true
order: 2
draft: false
---
## Problem

Explain what you wanted to solve.

## Work

Explain what you built and which decisions mattered.

## Result

Record what worked, what failed, and what you would change.
```

This creates:

```text
/projects/my-project/
```

It appears in `/projects/` and the homepage Recent list.

```text
order
```

controls the Projects archive order.

```text
date
```

controls the project’s position in the homepage Recent list. If omitted, the year is used.

## Edit or delete a project

Edit its Markdown file to update it. Delete the file to remove the project page and every generated reference to it.

Changing `slug` changes its public URL.

# Blog

Articles live in `content/posts/`. The folder may not exist until you add the first article.

## Add an article

Create `content/posts/my-article.md`:

```md
---
title: My Article
slug: my-article
description: A direct description of the article.
date: 2026-07-21
tags: Robotics, Notes
draft: false
---
Write the article here.
```

This creates:

```text
/blog/my-article/
```

The first published article also makes these appear automatically:

```text
/blog/
Blog in the header and homepage Index
/feed.xml
RSS in the footer
```

Delete the article file to remove it. If no published articles remain, Blog and RSS are hidden again.

# Logs

Logs are shorter than articles and do not create separate pages. They all live in:

```text
content/log.mjs
```

Add a new object at the top of the array:

```js
export const logEntries = [
  {
    date: "2026-07-21",
    title: "A useful change",
    text: "One or two sentences about what changed or what I learned.",
    tags: ["project", "notes"]
  }
];
```

The complete list appears at `/log/`. Recent entries also appear on the homepage and link directly to their position in the Log.

To edit a log, change its object. To delete one, remove the complete object, including its braces. Keep commas between the remaining objects.

# Drafts

Add this to the frontmatter of a page, project, or article while it is unfinished:

```md
draft: true
```

Draft files stay in the repository but are excluded from the build, navigation, sitemap, RSS feed, and Recent list.

Change it to `false` or remove the line when the item is ready.

# Images in projects, articles, and pages

Put an image in `public/images/`, for example:

```text
public/images/swarm-simulation.png
```

Then use normal Markdown on its own line:

```md
![Agents converging toward a target.](/images/swarm-simulation.png)
```

Add an optional caption in quotation marks:

```md
![Agents converging toward a target.](/images/swarm-simulation.png "A test using thirty agents and one target.")
```

The generated image is responsive, lazy-loaded, and includes the alt text you write between the square brackets.

# Edit the design

The visual system is in `src/assets/site.css`. The palette is at the top:

```css
--bg: #0a0a0c;
--surface: #121116;
--text: #eeece8;
--muted: #aaa6ad;
--faint: #8d8892;
--line: #2b2930;
--line-strong: #403c46;
--accent: #958ab5;
--accent-dim: #665f79;
```

Useful selectors:

```text
.site-header       Header and navigation
.home-intro        Compact homepage introduction
#space-canvas      Static stars and rare meteors
.orbital-stage     SVG orbital study
.directory-row     Homepage directory Index
.home-now          Current focus row
.recent-row        Combined project, writing, and log rows
.project-row       Project archive rows
.post-row          Blog archive rows
.prose             Project, article, and standalone-page writing
@media             Mobile layouts
```

Shared HTML is in `scripts/build.mjs`. Search for `renderHome`, `renderProjectDetail`, `renderPost`, `renderLog`, or `renderCustomPage`.

# Publish an update

Check the site locally, then run:

```bash
git add .
git commit -m "Describe the update"
git push
```

A commit records the change on your computer. The push sends it to GitHub. The included GitHub Actions workflow rebuilds `dist/` and publishes the new version automatically.

# Before publishing

Read through:

```text
site.config.mjs
content/pages/now.md
content/projects/personal-website.md
content/log.mjs
```

The files in `examples/` are not published. Copy one into `content/projects/` or `content/posts/` when you need a starting structure.
