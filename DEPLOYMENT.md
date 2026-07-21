# Publish basilamin.com with GitHub Pages

The repository already contains the GitHub Actions workflow required to build `dist/` and publish it.

## 1. Check the site locally

From the project folder:

```bash
npm run dev
```

Open `http://localhost:3000`, check every page, and stop the server when finished.

Run one final production build:

```bash
npm run build
```

## 2. Create the GitHub repository

Create a public repository named:

```text
basilamin.github.io
```

Keep `package.json`, `site.config.mjs`, `content/`, `src/`, `scripts/`, and `.github/` at the repository root.

## 3. Push the source

Run these commands inside the project folder:

```bash
git init
git branch -M main
git add .
git commit -m "Launch personal website"
git remote add origin https://github.com/BasilAmin/basilamin.github.io.git
git push -u origin main
```

A commit records the change locally. A push sends it to GitHub and starts the deployment workflow.

## 4. Enable GitHub Pages

In the repository, open:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Then open the Actions tab. The workflow is named:

```text
Deploy website to GitHub Pages
```

A successful run ends with a green checkmark.

## 5. Add basilamin.com

In:

```text
Settings → Pages → Custom domain
```

enter:

```text
basilamin.com
```

Save it before changing DNS.

At the company where the domain was purchased, add these records for the root domain:

```text
Type   Host   Value
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
```

Add this record for `www`:

```text
Type    Host   Value
CNAME   www    basilamin.github.io
```

Some registrars use a blank host field instead of `@`.

Do not delete unrelated `MX` or `TXT` records. Those may be used for email or domain verification.

When GitHub finishes checking the DNS, enable:

```text
Enforce HTTPS
```

## Updating the live site

Make changes locally, check them, then run:

```bash
git add .
git commit -m "Describe the update"
git push
```

Every push to `main` rebuilds and publishes the site.

With GitHub Desktop, the equivalent is:

```text
Commit to main → Push origin
```

## Vercel instead

The project also contains `vercel.json` with:

```text
Build command: npm run build
Output directory: dist
```

Vercel can import the same GitHub repository and deploy it automatically. Do not point `basilamin.com` at GitHub Pages and Vercel at the same time. Pick one live host.
