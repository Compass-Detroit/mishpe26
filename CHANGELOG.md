# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Holo ribbons hero animation** (`src/layouts/threejsHeroScene.js`) — raymarched SDF shader ported from [sabosugi's CodePen](https://codepen.io/sabosugi/pen/vEgGvKR), replacing the pride trail scene. Container-scoped canvas with play/pause and disposal; tuned settings live in `DEFAULT_CONFIG` and the dev-only lil-gui panel exposes them
- `scripts/a11y-test.mjs` — builds, serves, and runs the axe audit over every route, tearing the server down on every exit path. Wired to `pnpm run test:a11y`, the pre-push hook, and CI
- `scripts/check-node-version.mjs` — `preinstall` guard that fails below `engines.node` when an older Node is on PATH (git hooks, n8n)
- `pnpm-workspace.yaml` — pnpm 11 configuration: `overrides`, `allowBuilds`, and `engineStrict`
- `public/robots.txt` — crawler rules and sitemap reference
- `public/sitemap.xml` — static sitemap for public routes
- README: SEO & social sharing section, updated project structure, Studio/n8n doc links
- Navbar mobile menu: `.nav-menu-expanded` with `max-height: calc(100vh - 80px)`, `overflow-y: auto`, and `-webkit-overflow-scrolling: touch` so the menu never exceeds viewport height
- WCAG 1.4.10 Reflow: media query at `max-width: 480px` and `max-height: 400px` to un-stick the header (`position: absolute`) and reduce padding so content is not blocked at high zoom or small viewports
- `n8n/RUNBOOK.md` — step-by-step import pipeline runbook covering first-time server setup, per-event checklist, "what lives where" reference table, and troubleshooting guide; designed to travel with every cloned repo
- `.env.schema` — varlock schema documenting all import script environment variables with `@required` and `@sensitive` annotations

### Changed

- **Migrated from npm to pnpm** (`pnpm@11.22.0`, pinned via `packageManager`). Two settings moved to `pnpm-workspace.yaml` because pnpm 11 ignores them silently in `package.json`: the `@babel/core` override, and `allowBuilds` for the four packages with install scripts — `chromedriver` is load-bearing, since its install script downloads the driver the accessibility audit needs. `studio/` stays an independent npm install with its own lockfile
- Node pinned in one place: `engines.node >=22.13.0` with `engineStrict`, `.nvmrc` at `22.22.2`, and CI reading it via `node-version-file`
- **Accessibility audit now covers every route** — `/`, `/past-events`, `/careers-hub`, `/connections`, `/media`, and the 404 — instead of only the homepage. CI runs the same script as local so coverage cannot drift
- `react-router-dom` 6.30.6 → 7.18.2, clearing two moderate advisories (GHSA-wrjc-x8rr-h8h6 open redirect; GHSA-337j-9hxr-rhxg SSR hydration, which did not apply here). Near-drop-in: the app uses only the declarative API
- Renamed the hero section and its helpers from `pride`/`Pride` to `threejs`/`ThreejsHero`, including `LandingSectionThreejsHero.jsx`, `#hero-threejs`, and `.bg-threejs-hero-glass`
- CI: `actions/checkout`, `setup-node`, `upload-artifact`, and `download-artifact` bumped to `@v5`, clearing the deprecated-Node-20 warnings; `serve -s` so the SPA fallback resolves client-side routes
- lint-staged widened beyond `js`/`jsx` to cover `mjs`, `cjs`, `ts`, `tsx`, `md`, `json`, `css`, `scss`, `yml`, `yaml`, and `html`
- Renamed repository and package from `pridemi26` to `mishpe26` (GitHub: `Compass-Detroit/mishpe26`)
- **React 19 upgrade**:
  - `react` / `react-dom` 18.2 → 19.2
  - `vite` 4.4 → 8.1
  - swapped `@vitejs/plugin-react-swc` for `@vitejs/plugin-react`
  - `esbuild` 0.19 → 0.28
  - added `@babel/core` override (`^7.29.0`)
  - `vite.config.js`: enabled `legacy.inconsistentCjsInterop` (Rolldown's stricter CJS interop otherwise mis-imports `react-fast-marquee`)
  - `.eslintrc.cjs`: bumped React version setting to 19.2
- **Rebrand to Detroit Pride Innovation Summit**: repurposed from the Black History Month Innovation Summit to the Detroit Pride Innovation Summit; renamed the project/repository to `pridemi26` and updated README, CONTRIBUTING, ACCESSIBILITY, COLOR, and SECURITY docs accordingly
- **Theme system**: shipped four switchable color themes (Purple default, Blue, Green, Gold) via `iwd` Tailwind tokens and `data-theme`; updated `COLOR.MD` to match
- Open Graph and Twitter/X card meta tags in `index.html` — aligned to `pridemi26.vercel.app` (replaced legacy `iwdsummit.com` URLs)
- **Navbar**: Removed pathway/route-link logic; Navbar now only shows section (anchor) links; route links like Previous Events remain in Footer only

### Fixed

- **Security audit gate could never fail** — the CI step ran `npm audit --audit-level moderate` with a fallback ending in `exit 0`, which swallowed every severity including the high and critical findings it claimed to catch. Now `pnpm audit --audit-level high`. Enabling it surfaced 16 high-severity advisories, 3 in production dependencies, all cleared by non-breaking transitive bumps
- **Accessibility check never ran a browser** — `test:a11y` echoed "skipped due to ChromeDriver version mismatch" and exited 0, so the pre-push hook reported success without launching anything. The mismatch came from overriding `--chromedriver-path`; axe resolves its own Chrome-for-Testing pair and works when left alone
- Lazy-loaded routes reported phantom accessibility violations (`landmark-one-main`, `page-has-heading-one`, `skip-link`, `region`) because axe snapshotted the `<Suspense>` fallback before the chunk resolved. Fixed with `--load-delay`
- `commit-msg` hook: dropped npm's `--` separator, which pnpm passes through so `--edit` never reaches commitlint, making it lint the entire repo history instead of the incoming message
- CI Prettier failure on `n8n/README.md` and `studio/README.md` — the `pridemi26` → `mishpe26` rename shortened a string inside markdown tables, misaligning every pipe
- Removed the unused `/playground/*` route and page, the `hero-trails` poster images (1.96 MB), and the orphaned `lcMap.png`
- `scripts/sanity-import/import-speakers.mjs` — corrected import paths from `./sanity-client.mjs` and `./google.mjs` to `./lib/sanity-client.mjs` and `./lib/google.mjs` (files live in `lib/` subdirectory)
- `scripts/sanity-import/lib/google.mjs` — added `supportsAllDrives: true` and `includeItemsFromAllDrives: true` to Drive API calls so the import works with Google Workspace Shared Drives, not just personal Drive

## [0.2.0] - 2026-02-13

### Changed

- **Fork & rebrand**: Repurposed from Compass Detroit / Michigan DevFest for the Black History Month Innovation Summit (BHM-website)
- Updated package.json: name to `bhm-website`, repository to `Compass-Detroit/BHM-website`, added description
- Updated README, CONTRIBUTING, ACCESSIBILITY docs for Black History Month Innovation Summit
- Updated Docker documentation and image naming to `bhm-website`
- Updated index.html metadata, site.webmanifest, and GitHub issue templates
- Updated CHANGELOG links to point to BHM-website repository

## [0.1.2] - 2026-02-01

### Added

- Hash-based smooth scroll: Navbar `useEffect` scrolls to section when navigating to `/#section-id` from any page (Navbar or Footer), with retry until the home section is in the DOM
- Add new tab in navigation, "Pathways"
- Careers Hub, Connections, and Media grouped under a single “Pathways” item with caret
- Golden (primary) underline on hover for Pathways subnav items (desktop)
- Mobile: active pathway page highlighted with yellow (primary) background; Pathways section auto-expands when on a pathway page

### Changed

- **Pathways dropdown accessibility**: Focus-based open/close (`onBlur` on container); keyboard support (Enter/Space toggle, Arrow Down/Up open and focus first/last item, Escape close and return focus to trigger, Arrow keys move between items); `aria-haspopup="menu"`; removed `preventDefault` from button click; mouse leave only closes when focus is outside the dropdown
- **Footer**: Section links always use `/#section-id`; removed Footer’s own scroll logic so smooth scrolling is handled by the Navbar’s hash-based effect for both Navbar and Footer links
- Navbar z-index raised (z-30) so it stays in front of LandingSection and other content
- Removed overflow-hidden from nav and inner grid so Pathways dropdown is no longer clipped
- Pathways trigger aligned with other nav items (items-baseline, inline-flex) so “Pathways” sits on the same line
- Pathways dropdown panel nudged up slightly (-mt-0.5) for cleaner alignment

## [0.1.1] - 2026-01-30

### Added

- New pages: Connections, Media, Careers Hub
- Media section and Connections page
- Community and membership content on home

### Changed

- Navigation and copyright updates; navbar items reorganized
- Home section and sub-sections restructured
- Broader description area on home
- Team section migrated to leadership with new tabs
- Partners section refactored
- Speakers section refactored
- Remove Past Events page and redirect to Previous Events page

## [0.1.0] - 2026-01-28

### Added

- Initial Compass Detroit website setup
- Yoda404 component with floating animation
- Custom Tailwind color palette (primary, charcoal, pumpkin, burnt, lime, indigo)
- Custom font families (Montserrat, BioRhyme, Orbitron, Asimovian)
- Accessibility documentation (ACCESSIBILITY.md, CONTRAST-ANALYSIS.md)
- Git hooks for linting, formatting, and commit message validation
- ESLint and Prettier configuration
- VS Code extension recommendations

### Fixed

- Fixed git remote configuration (origin now points to Compass-Detroit/compass-website)
- Fixed Montserrat font weight to use Medium (500) instead of Thin (100)
- Fixed incorrect variable name usage

[Unreleased]: https://github.com/Compass-Detroit/mishpe26/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Compass-Detroit/mishpe26/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Compass-Detroit/mishpe26/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Compass-Detroit/mishpe26/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Compass-Detroit/mishpe26/releases/tag/v0.1.0
