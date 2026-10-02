# Portfolio site

Static multi-page site. No build step, no dependencies. Open `index.html` in a
browser, or drop the whole folder on GitHub Pages / Netlify / Vercel.

## Structure

```
index.html            home — the 3D ontology (roles, projects, skills)
about.html            about, roles, skills, contact (#contact)
projects/index.html   case-study grid
projects/*.html       one case study per project
assets/site.css       styles for every page except the home scene
assets/site.js        PROJECTS / ROLES / SKILLS / STATS data + shared helpers
assets/ontology.js    the home page's three.js scene
```

Every page, home included, gets the same persistent header nav and footer,
injected by `mountChrome()` in `assets/site.js` and styled by `assets/chrome.css`.
Case studies also get an "All case studies" link and previous/next links.

## Editing

All data lives at the top of `assets/site.js`.

**`PROJECTS`** — feeds the ontology, the case-study grid, and each case study's
roadmap and "view source" button. Fields:

| field | meaning |
|---|---|
| `id` | identifier; a page's `SITE_PAGE` matches either this or `file` |
| `name`, `cat`, `desc` | display copy |
| `file` | page inside `projects/` |
| `status` | `done` or `wip` |
| `stats` | `[label, value]` pairs shown on the card |
| `skills` | names from `SKILLS` — drawn as lines on the ontology |
| `related` | true links, e.g. `[['gfs','Built at']]` (to a project or a role) |
| `gh` | repo URL, or `null` to grey out "view source" (private repos stay `null`) |
| `pos` | fallback slab position if `assets/ontology.js` has none |

**`ROLES`** — jobs and positions (purple on the ontology, listed on About).
**`SKILLS`** — the resume's skills, grouped; the About page and the ontology's
panels render them.
**`STATS`** — benchmark numbers, pulled in via `data-stat` attributes.

Where an object sits on the slab and which 3D model draws it are set in
`LAYOUT` and `MODEL` at the top of `assets/ontology.js`.

## Before publishing

- Replace the placeholder contact links if you want different social or email values
- Removing a project means deleting its `PROJECTS` entry and its page together
- Verify the SmallDB numbers in `STATS` against a real benchmark run
- Optional: add `assets/og.png` (1200×630) and an `og:image` meta tag so shared
  links render a preview card
