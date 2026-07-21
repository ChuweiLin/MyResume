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

## Status

Work in progress — see project owner for current step.
