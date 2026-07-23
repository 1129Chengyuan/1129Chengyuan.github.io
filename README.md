# Portfolio site

Static multi-page site. No build step, no dependencies. Open `index.html` in a
browser, or drop the whole folder on GitHub Pages / Netlify / Vercel.

## Structure

```
index.html            home — hero, topology graph, project grid
about.html            about.md
contact.html          contact.sh
projects/index.html   all projects
projects/smalldb.html full write-up (overview / architecture / code)
projects/*.html       placeholder project pages
assets/site.css       all styling
assets/site.js        STATS + PROJECTS data, file tree, terminal, topology graph
```

Every page shares the same shell: header, directory tree on the left,
persistent terminal docked at the bottom.

## Editing

Both data structures live at the top of `assets/site.js`.

**`STATS`** — every number displayed anywhere on the site. The hero counter, the
project cards, and the SmallDB stat grid all read from it via `data-stat` and
`data-count-stat` attributes, so a benchmark rerun means changing one value, not
hunting through three files.

**`PROJECTS`** — feeds the sidebar tree, the project grid, the topology graph,
and the terminal's `ls` / `cd` / `status` commands. Fields:

| field | meaning |
|---|---|
| `id` | used by `cd <id>` and matched to the page filename |
| `name`, `cat`, `desc` | display copy |
| `file` | page inside `projects/` |
| `icon` | single character shown in the ring |
| `status` | `done` or `wip` — drives every colour and badge |
| `stats` | two `[label, value]` pairs shown on the card |
| `pos` | `{x, y}` position in the topology graph |
| `chain` | optional index — nodes with `chain` are wired into the animated pipeline in order; omit it and the node hangs off the core node instead |
| `gh` | repo URL, or `null` to grey out the "view source" button |

**Terminal commands** are in the `runCmd` function in the same file.
The prompt path is derived from `SITE_PAGE`, so renaming a page updates it.

## Adding a resume link

The resume link was removed from the header because the file didn't exist —
a dead link there is worse than none. To add it back, drop `resume.pdf` into
`assets/` and put this in the `.right` block of each page's header:

```html
<a href="assets/resume.pdf">resume</a>       <!-- top-level pages -->
<a href="../assets/resume.pdf">resume</a>    <!-- pages in projects/ -->
```

## Before publishing

- Replace the placeholder contact links if you want different social or email values
- Replace the four placeholder project pages, or delete them from `PROJECTS`
  (delete the entry and the file together)
- Verify the SmallDB numbers in `STATS` against a real benchmark run
- Optional: add `assets/og.png` (1200×630) and an `og:image` meta tag so shared
  links render a preview card
