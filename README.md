# basilamin.com

Plain HTML and CSS. No framework, build step or package install.

## The map

- `index.html` - home page and its section lists
- `writing/index.html` - writing index
- `writing/*.html` - posts
- `styles.css` - shared design for every page
- `assets/images/` - images
- `templates/page.html` - starter for a normal page
- `templates/post.html` - starter for a writing post

## Edit text or contact links

Open `index.html`, change the words between the HTML tags, save, then publish using the steps below.

Contact links are near the top of `index.html` and in each page footer:

```html
<a href="mailto:basilaminxyz@gmail.com">Email</a>
<a href="https://github.com/BasilAmin">GitHub</a>
```

## Add a normal page

1. Copy the template:

   ```bash
   cp templates/page.html projects/relay.html
   ```

   Create the folder first if needed: `mkdir -p projects`.
2. Replace `PAGE TITLE`, the description and the page text.
3. Add it to a section in `index.html`:

   ```html
   <li><a href="/projects/relay.html"><strong>Relay</strong></a><p>Short description.</p></li>
   ```

## Add a writing post

1. Copy the post template:

   ```bash
   cp templates/post.html writing/my-post-title.html
   ```

2. Replace the title, description, date and post text.
3. Add the same link to both `writing/index.html` and the Writing list in `index.html`:

   ```html
   <li><a href="/writing/my-post-title.html"><strong>My post title</strong></a> <span class="meta">(September 2026)</span><p>One-line summary.</p></li>
   ```

Use lowercase filenames and hyphens. Do not use spaces.

## Add an image

Put the file in `assets/images/`, then add:

```html
<figure>
  <img src="/assets/images/relay-board.jpg" alt="Relay robot above a chessboard" width="1200" height="800">
  <figcaption>Relay moving a piece.</figcaption>
</figure>
```

Write useful `alt` text. Keep images under about 1 MB. Include `width` and `height` so the page does not jump while loading.

## Add a video or other embed

Use the provider's embed URL, not its normal watch-page URL:

```html
<div class="embed">
  <iframe
    src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
    title="DESCRIBE THE VIDEO"
    loading="lazy"
    allowfullscreen></iframe>
</div>
```

Only embed sources you trust. An embed lets that provider load code and may set cookies for visitors. A plain link is the private option.

## Preview and check

From the repository folder:

```bash
python3 scripts/check_site.py
python3 -m http.server 8000
```

Open http://localhost:8000. Check the home page, the changed page and the narrow mobile view. Stop the preview with `Ctrl+C`.

## Publish safely

```bash
git status
git diff
git add index.html writing styles.css assets README.md templates scripts
git commit -m "Describe the site change"
git push origin main
```

GitHub Pages deploys `main` automatically. Watch the run at:
https://github.com/BasilAmin/basilamin.github.io/actions

If it fails, open the failed run and do not make another change until the error is fixed. Every published version remains recoverable in Git history.
