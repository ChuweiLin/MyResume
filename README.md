# My Publications

A web page of published papers with charts showing citation growth over the
years, built for sharing publicly.

## Structure

- `scripts/` — reusable scripts (data fetching, chart generation, etc.)
- `data/` — publication and citation data
- `site/` — the published web page

## Updating publication data

```
python3 -X utf8 scripts/sync_publications.py
```

Fetches the latest works from OpenAlex, refreshes the DOI column in
`data/publications.xlsx` (leaving any manually-edited title/venue/type/year
untouched), and regenerates `site/data/publications.json` and
`site/data/citations.json`.

## Editing cheatsheet

Quick reference for manual edits — no build step needed, just save and refresh
the browser (or re-run the server if it isn't already running).

### Color

All colors are CSS variables at the top of `site/styles.css`, in **three
matching blocks** — edit the same variable in all three or light/dark modes
will disagree:

| Lines | Block | When it applies |
|---|---|---|
| 1–15 | `:root { ... }` | Light mode (default) |
| 17–33 | `@media (prefers-color-scheme: dark) { ... }` | Dark mode via OS/browser preference |
| 35–49 | `:root[data-theme="dark"] { ... }` | Dark mode via the page's own toggle button |

Key variables:

| Variable | Controls |
|---|---|
| `--page` | Page background |
| `--surface-1` | Card backgrounds (project/collaboration cards, chart card) |
| `--card-bg` | Inner elements (pills, timeline items, paper cards, photo boxes) |
| `--text-primary` / `--text-secondary` / `--text-muted` | Text shades, darkest → lightest |
| `--series-1` / `--series-1-wash` | Main accent (teal) — links, chart line, active tab, odd skill pills, its transparent wash |
| `--accent-warm` | Secondary accent (amber) — paper type tags, even skill pills, latest-citations stat |
| `--border` / `--gridline` / `--baseline` | Borders and chart gridlines |

### Content

| What | Where |
|---|---|
| Name, bio/summary paragraph, contact links | `site/data/profile.json` → `summary`, and the `<div class="links">` in `site/index.html` |
| Projects (name, affiliation, summary, skills, figure, related pubs) | `site/data/profile.json` → `projects[]` |
| Collaborations (name, collaborator, summary, related pubs) | `site/data/profile.json` → `collaboration[]` |
| Education entries | `site/data/profile.json` → `education[]` |
| Publications list / citation chart | Don't hand-edit — run `python3 -X utf8 scripts/sync_publications.py` to pull from OpenAlex (see above) |

`related publications` in a project/collaboration entry is a list of DOI
strings — each one must exactly match a `doi` value in
`site/data/publications.json` or it'll render as a bare link instead of the
paper's title.

`profile.json` is plain JSON — keep commas/quotes valid or the page will fail
to load silently (check the browser console if content stops appearing).

### Style (layout, spacing, fonts)

Everything else in `site/styles.css`, grouped by what you're touching:

- Cards: `.project`, `.collaboration`, `.paper`
- Education journey curve: `.edu-journey`, `.edu-stop`, `.edu-stop-marker`
- Skill/pill tags: `.skills-list li`
- Hero layout: `header.hero`, `.hero-photo`, `.hero-content`
- Tab nav: `.nav-tab`, `.tab-panel`
- Citation chart: `.chart-card`, `.chart-line`, `.chart-area`, `.chart-dot`
- Lightbox popup: `.lightbox`, `.lightbox img`, `.lightbox-close`

### Figures

- **Headshot**: replace `site/image/headshot.jpeg` with a new file of the same
  name (or update the `src` in the `.hero-photo img` tag in `site/index.html`
  if you rename it).
- **Project figures**: put the image in `site/image/`, then point to it from
  the matching project's `"figure"` field in `profile.json` (e.g.
  `"figure": "image/project1.png"`). Clicking it opens the full-size lightbox
  automatically — no extra wiring needed.
- Recommended format: WebP for figures with text + gradients/plots (sharper
  than JPEG, smaller than PNG); JPEG or WebP is fine for photos. Keep the
  longest edge around 2000–2400px — the lightbox never displays it larger
  than the viewport anyway.

## Status

Work in progress — see project owner for current step.
