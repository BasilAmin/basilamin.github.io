# Replace `BasilAmin/basilamin.github.io`

Target repository:

```text
https://github.com/BasilAmin/basilamin.github.io
```

## Command-line workflow

Clone or update:

```bash
git clone https://github.com/BasilAmin/basilamin.github.io.git
cd basilamin.github.io
```

Or, inside an existing local clone:

```bash
git pull --ff-only
```

Create a backup branch:

```bash
git switch -c backup-before-final-site
git push -u origin backup-before-final-site
git switch main
```

Use the file manager to replace the repository contents. Keep `.git`, copy hidden `.github` and `.gitignore`, and copy the contents of `basilamin-site-final-colour`, not the enclosing folder.

Validate:

```bash
npm run check
npm run dev
```

Publish:

```bash
git status
git add -A
git commit -m "Replace website with final redesign"
git push origin main
```

Configure Pages:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

## GitHub Desktop workflow

1. Clone or add `BasilAmin/basilamin.github.io` in GitHub Desktop.
2. Create and publish `backup-before-final-site`.
3. Switch back to `main`.
4. Choose **Repository → Show in Explorer/Finder**.
5. Delete the old site files while keeping `.git`.
6. Copy the replacement files into the repository root.
7. Run `npm run check` in VSCodium.
8. Review all additions, changes, and deletions in GitHub Desktop.
9. Commit with `Replace website with final redesign`.
10. Push origin.
11. Confirm the Pages workflow in the Actions tab.

## Roll back

The safest rollback creates a new commit from the backup branch:

```bash
git switch main
git checkout backup-before-final-site -- .
git add -A
git commit -m "Restore previous website"
git push
```

## Common problems

### Deployment did not start

Confirm the push reached `main` and that this file exists:

```text
.github/workflows/deploy-pages.yml
```

### Deployment failed

Run:

```bash
npm run check
```

Fix the first reported error, commit, and push again.

### The live site still looks old

- Confirm the Actions run is green.
- Confirm Pages uses GitHub Actions.
- Hard-refresh the browser.
- Confirm the custom domain in Settings → Pages.

### The custom domain disappeared

Restore both `CNAME` files. Each should contain:

```text
basilamin.com
```

### A page is missing

Check its frontmatter. `draft: true` intentionally excludes it from the site.
