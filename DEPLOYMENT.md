# Deployment

Target repository:

```text
https://github.com/BasilAmin/basilamin.github.io
```

Read `START-HERE.md` before replacing the current site.

## Required check

```bash
npm run check
```

## GitHub Pages

```bash
git add -A
git commit -m "Publish update"
git push origin main
```

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys `dist/`.

Set:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

## Custom domain

Keep `CNAME` and `public/CNAME`. Each should contain:

```text
basilamin.com
```

## Vercel

```text
Build command: npm run build
Output directory: dist
Node version: 20 or newer
```

## Other static hosts

Run `npm run build` and publish `dist/`.

## Release checklist

1. Pull `main`.
2. Edit source files, not `dist/`.
3. Run `npm run check`.
4. Run `npm run preview`.
5. Check homepage, projects, blog, logs, Now, contact, search, themes, clock, and 404.
6. Check desktop and mobile widths.
7. Review `git status` and `git diff`.
8. Commit and push.
9. Confirm the Actions run is green.
10. Confirm the custom domain, HTTPS, favicon, RSS, and sitemap.
