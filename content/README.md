# Content

Every public entry is one Markdown file. The build reads frontmatter, renders the body, and creates a static page.

| Folder | Public route | Use it for |
|---|---|---|
| `projects/` | `/projects/` | Case studies and ongoing work |
| `posts/` | `/blog/` | Longer articles |
| `logs/` | `/log/` | Short dated updates |
| `pages/` | `/<slug>/` | Optional standalone pages |

Create a correctly formatted draft:

```bash
npm run new -- project "Project name"
npm run new -- post "Article title"
npm run new -- log "What changed today"
npm run new -- page "Page title"
```

Use dates in `YYYY-MM-DD` format. Set `draft: true` while an entry is private. Project order is controlled by the numeric `order` property. Tags are a comma-separated line.

The body supports headings, paragraphs, emphasis, links, images, lists, blockquotes, code fences, horizontal rules, and Markdown tables.
