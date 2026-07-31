# Start Here — Replace the Existing Website Safely

This is the complete source for `basilamin.com`. It is intended to replace the current contents of:

```text
https://github.com/BasilAmin/basilamin.github.io
```

Keep the repository itself. Replace the files inside it. Do not delete the repository, its settings, its history, or the hidden `.git` folder.

## Requirements

- Git
- Node.js 20 or newer
- VSCodium or another editor
- This ZIP extracted to a normal folder

There is no `npm install` step. The site has no package dependencies.

## Safest first deployment

### 1. Get the existing repository locally

Existing local copy:

```bash
cd /path/to/basilamin.github.io
git pull --ff-only
```

No local copy yet:

```bash
git clone https://github.com/BasilAmin/basilamin.github.io.git
cd basilamin.github.io
```

### 2. Preserve the old website

```bash
git switch -c backup-before-final-site
git push -u origin backup-before-final-site
git switch main
```

The old site is now preserved on GitHub in `backup-before-final-site`.

### 3. Replace the files

Use your file manager:

1. Open the local `basilamin.github.io` repository folder.
2. Enable hidden-file visibility.
3. Delete the old website files and folders.
4. Keep `.git` untouched.
5. Copy everything from inside the extracted `basilamin-site-final-colour` folder into the repository root.
6. Include `.github` and `.gitignore`.
7. Do not place the enclosing replacement folder inside the repository.

The repository root should contain:

```text
.github/
content/
public/
relay/
scripts/
src/
.gitignore
CNAME
COLOUR-PALETTES.md
DEPLOYMENT.md
EDITING-GUIDE.md
LICENSE
README.md
REPLACE-EXISTING-SITE.md
START-HERE.md
package.json
site.config.mjs
vercel.json
```

The existing hidden `.git/` directory should still be present.

### 4. Test locally

```bash
npm run check
npm run dev
```

Open the address printed in the terminal, normally:

```text
http://localhost:3000
```

Check the centred homepage statement and quotation, Projects, Blog, Logs, Now, Contact, search, both themes, clock, and mobile layout.

Stop the server with `Ctrl+C`.

### 5. Commit the replacement

```bash
git status
git add -A
git commit -m "Replace website with final redesign"
git push origin main
```

`git add -A` records additions, edits, and deleted old files.

### 6. Enable GitHub Pages deployment

Open:

```text
https://github.com/BasilAmin/basilamin.github.io/settings/pages
```

Set:

```text
Build and deployment → Source → GitHub Actions
```

Then watch the deployment at:

```text
https://github.com/BasilAmin/basilamin.github.io/actions
```

The workflow is `.github/workflows/deploy-pages.yml`.

### 7. Keep the custom domain

Both files below must contain only `basilamin.com`:

```text
CNAME
public/CNAME
```

## Normal update loop

```bash
git pull --ff-only
npm run dev
```

Edit the source, then:

```bash
npm run check
git add -A
git commit -m "Describe the update"
git push
```

A push to `main` rebuilds and deploys the site.

## Create content

```bash
npm run new -- project "Project name"
npm run new -- post "Article title"
npm run new -- log "What changed today"
npm run new -- page "Page title"
```

New files start as drafts. Change:

```yaml
draft: true
```

to:

```yaml
draft: false
```

when ready.

## Never edit `dist/`

`dist/` is generated output. Edit `site.config.mjs`, `content/`, `src/`, or `public/`, then run `npm run check`.

Read `EDITING-GUIDE.md` for the complete editing reference and `REPLACE-EXISTING-SITE.md` for GitHub Desktop, rollback, and troubleshooting.
