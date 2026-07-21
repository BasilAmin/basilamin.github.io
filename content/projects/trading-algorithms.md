---
title: Trading Algorithms
slug: trading-algorithms
summary: A collection of algorithmic trading strategies and backtesting implementations for quantitative finance.
year: 2026
date: 2026-07-20
status: In progress
tags: Python, Trading, Finance, Algorithmic
featured: true
order: 5
---
## Why I built it

I wanted a place on the internet that I control and understand. Social platforms are useful for discovery, but they are not a good archive for projects, unfinished ideas, or notes I may want to find again.

## How it works

The site is ordinary HTML, CSS, and JavaScript. Projects and blog posts are Markdown files. A small Node script reads those files and produces the final pages in `dist/`.

That gives me clean directory URLs without making me learn or maintain a frontend framework:

- `content/projects/` becomes `/projects/`
- `content/posts/` becomes `/blog/`
- `content/pages/` becomes standalone directories such as `/now/`
- `content/log.mjs` supplies the short updates on `/log/`

## Design choices

The homepage is an index rather than a sales page. Navigation is plain text, every row is a real link, and recent projects, logs, and writing share one chronological list.

The orbital study is the only major visual element. Its motion is deliberately slow, and meteors appear rarely enough to remain incidental. The colour palette uses near-black, warm white, and smoked violet. The layout relies on borders, spacing, and type instead of rounded cards, gradients, or large interface panels.

## Next

The useful part starts now: adding real work, writing project notes while the details are still fresh, and letting the site become more personal over time.
