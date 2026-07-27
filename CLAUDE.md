# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free multi-page portfolio site. No build step, no package
manager, no tests. To develop: open `index.html` in a browser, or serve the
folder (`python3 -m http.server`). Deploys by dropping the folder on GitHub
Pages / Netlify / Vercel.

## Architecture

Every page (except the `index.html` title card) renders the same shell — header,
directory-tree sidebar, and a persistent terminal docked at the bottom. That
chrome is **not** hand-written per page; it is injected by `mountChrome()` in
`assets/site.js` so it lives in exactly one place. Each HTML page only contains
its own body content plus a small bootstrap.

**Single source of truth: `assets/site.js`.** Two data structures at the top of
the file feed nearly everything:

- **`STATS`** — every benchmark number shown anywhere. `STATS.totals` is
  **computed** at load by `deriveTotals()` from the `PROJECTS` array (project
  count, done/in-progress split, summed LOC, latest `lastTouched`); never
  hand-edit `totals`. Values are pulled into the DOM via `data-stat` (static
  text) and `data-count-stat` (animated counter) attributes by `injectStats()`.
- **`PROJECTS`** — one array driving the sidebar tree, project grid, topology
  graph, hover previews, topbar status line, and the terminal's `ls`/`cd`/
  `status` commands. Adding an entry makes the project appear everywhere at
  once. Key fields: `id` (matches `cd <id>` and page filename), `file` (page in
  `projects/`), `status` (`done`|`wip`, drives all colors/badges), `chain`
  (optional index wiring the node into the animated pipeline; omit and it hangs
  off the core node), `pos` (topology graph coords), `gh` (repo URL or `null` to
  grey out "view source"), `lastTouched` (drives status line + hover preview —
  there is no separate activity structure).

The terminal command handler is `runCmd()` in the same file; the prompt path is
derived from `SITE_PAGE`, so renaming a page updates it automatically.

## Per-page bootstrap convention

Each HTML page sets two globals before loading the shared script, and this is
how the shared code knows where it is and how to build relative links:

```html
<script>window.SITE_ROOT="";   window.SITE_PAGE="title";</script>   <!-- top-level pages -->
<script>window.SITE_ROOT="../"; window.SITE_PAGE="smalldb";</script> <!-- pages in projects/ -->
```

`SITE_ROOT` (read as `R` in JS) prefixes every internal link; top-level pages use
`""`, pages under `projects/` use `"../"`. Match this when adding a page.

## Cache busting

CSS/JS are linked with a `?v=YYYYMMDD` query string (e.g.
`site.css?v=20260723`). When you change `assets/site.css` or `assets/site.js`,
bump this version on **every** page that references them, or browsers serve
stale assets.

## Notes for edits

- All styling is in `assets/site.css` (single file). All behavior is in
  `assets/site.js` (single file).
- Removing a project means deleting both its `PROJECTS` entry and its
  `projects/*.html` file.
- See `README.md` for user-facing editing notes (adding a resume link,
  pre-publish checklist).
