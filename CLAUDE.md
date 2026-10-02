# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free multi-page portfolio site. No build step, no package
manager, no tests. To develop: open `index.html` in a browser, or serve the
folder (`python3 -m http.server`). Deploys by dropping the folder on GitHub
Pages / Netlify / Vercel.

## Architecture

The home page (`index.html`) is a 3D ontology: me, my roles, and my projects as
line-art objects on a slab (three.js, loaded from a CDN via an import map),
with typed links between them and lines up to resume-skill panels. Its scene
and page-specific styles live in `index.html` + `assets/ontology.js`.

Every page, home included, gets the same persistent header nav and footer from
`mountChrome()` in `assets/site.js` (styles in `assets/chrome.css`, loaded by
every page), so that chrome lives in exactly one place. Case-study pages also get
an "All case studies" link and previous/next links. Contact is a section of
`about.html` (`#contact`), not its own page. Each HTML page
only contains its own body content plus a small bootstrap.

**Single source of truth: `assets/site.js`.** The data structures at the top of
the file feed nearly everything:

- **`STATS`** — every benchmark number shown anywhere. `STATS.totals` is
  **computed** at load by `deriveTotals()` from `PROJECTS` (project count,
  done/in-progress split); never hand-edit `totals`. Values are pulled into the
  DOM via `data-stat` attributes by `injectStats()`.
- **`PROJECTS`** — drives the ontology, the case-study grid
  (`projects/index.html`), and each case study's roadmap/timeline/source
  button. Key fields: `id`, `file` (page in `projects/`; a page's `SITE_PAGE`
  may match either), `status` (`done`|`wip`), `gh` (repo URL or `null` to grey
  out "view source"; private repos — PredictMarketPipeline, Dataform Slots —
  must stay `null`), `skills` (names from `SKILLS`), `related` (true links to a
  project or role, e.g. `[['gfs','Built at']]`), `pos` (fallback slab spot).
- **`ROLES`** — jobs/positions from the resume (the ontology's purple objects;
  also the About page's roles list).
- **`SKILLS`** — resume skills in groups; projects and roles reference them by
  name in `skills`. Drives the ontology's skill panels and the About page.

`assets/ontology.js` holds presentation only: `LAYOUT` (slab positions),
`MODEL` (which line-art model draws each object), `ROLE_VERB`.

## Per-page bootstrap convention

Each HTML page sets two globals before loading the shared script, and this is
how the shared code knows where it is and how to build relative links:

```html
<script>window.SITE_ROOT="";   window.SITE_PAGE="about";</script>   <!-- top-level pages ("home" for index.html) -->
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

- Shared styling is in `assets/site.css`; shared behavior and all data in
  `assets/site.js`. The home page's scene is `assets/ontology.js`.
- Removing a project means deleting both its `PROJECTS` entry and its
  `projects/*.html` file.
- See `README.md` for user-facing editing notes (adding a resume link,
  pre-publish checklist).
