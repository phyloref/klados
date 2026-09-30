# Klados

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.7103131.svg)](https://doi.org/10.5281/zenodo.7103131)

Klados allows users to curate [phyloreferences]
side-by-side with the phylogenies they were originally defined on. The curated phylogenies
are stored in the [Phyx format], which can be downloaded as an [OWL 2 ontology]
in the [JSON-LD format]. Phyx files can be incorporated into the [Clade Ontology].

## Citing Klados

You can currently cite Klados as:

> Vaidya G, Becker A, Cellinese N, Lapp H (2023) Klados: a tool for authoring, testing and curating phyloreferences. GitHub: https://github.com/phyloref/klados DOI: [10.5281/zenodo.7103131](https://doi.org/10.5281/zenodo.7103131)

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
```

This serves Klados at http://localhost:5173/klados/.

### Compiles and minifies for production
```
npm run build
```

This writes the compiled site into `dist/`, with asset paths under
`/klados/` (the `base` in `vite.config.js`) so it can be served from
GitHub Pages. Publishing a release runs
`.github/workflows/deploy-to-github-pages.yml`, which builds the site
and deploys `dist/` to the `gh-pages` branch. `npm run preview` serves
the built site locally.

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

ESLint checks for code problems but not formatting, and Prettier is not
run on this codebase. `.prettierrc.json` only keeps editors that format on
save close to the existing style. See [AGENTS.md](AGENTS.md#commands).

### Customize configuration
See the [Vite configuration reference](https://vite.dev/config/).

  [phyloreferences]: http://phyloref.org
  [Phyx format]: https://github.com/phyloref/phyx.js/wiki/Phyx-format
  [OWL 2 ontology]: https://www.w3.org/TR/owl2-overview/
  [JSON-LD format]: https://en.wikipedia.org/wiki/JSON-LD
  [Clade Ontology]: https://github.com/phyloref/clade-ontology/
