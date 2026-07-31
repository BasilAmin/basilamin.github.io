---
title: basilamin.com
slug: personal-website
summary: A hand-built publishing system for projects, field notes, and longer writing.
year: 2026
date: 2026-07-20
status: Active
role: Design, writing, development
tags: HTML, CSS, JavaScript, Publishing
featured: false
order: 1
---

## Why it exists

I wanted an internet home that behaves like a workshop rather than a portfolio template. It needs to hold finished projects, rough logs, articles, and pages that change over time without turning every update into a development task.

## How it works

The source is deliberately ordinary:

- projects, articles, logs, and pages are Markdown files;
- a small Node build script validates the content and generates static HTML;
- a JSON search index powers the command palette;
- the finished site can be hosted anywhere that serves static files.

There is no database, client framework, or dependency chain between the writing and the published page.

## Editing model

Each kind of content has its own folder:

- `content/projects/` publishes to `/projects/`;
- `content/posts/` publishes to `/blog/`;
- `content/logs/` publishes to `/log/`;
- `content/pages/` creates standalone pages such as `/now/`.

The Obsidian vault is the private editorial layer. Only notes explicitly marked for publication should cross into the repository.

## Design decisions

The interface uses rows, borders, and clear type instead of floating panels. A searchable command menu and route tree borrow the useful ideas behind several 21st.dev components, but the implementation is original, framework-free, and shaped around this site rather than dropped in as a demo.

The result is meant to feel more like a well-kept technical notebook than a startup landing page.
