# Latino Heritage Month Innovation Summit 2026

The website for the [Latino Heritage Month Innovation Summit 2026](https://lhmsummit.com/). Built with Vite, React, and Tailwind CSS.

Organized by **Compass Detroit** in partnership with **GDG Detroit** and community partners (see the Partners section on the site for the full list).

Hero animation is a custom WebGL animation created with Three.js and lil-gui. It is used to create the holo ribbons effect on the hero section. Author of initial effect attribution: [Sabo Sugi](https://x.com/sabosugi/). Effect enhanced and customized by **[Greg Miller](https://github.com/shrinkray)** for Compass Detroit.

## Quick Start

### Prerequisites

- Node.js — the version in `.nvmrc` (`nvm install && nvm use`). `engines.node` requires >=22.13.0 and pnpm enforces it, so an older 22.x will fail at install.
- pnpm — `corepack enable` picks up the `packageManager` pin automatically, or `npm i -g pnpm`

### Recommended VS Code Extensions

This project includes VS Code extension recommendations. When you open the project in VS Code, you'll be prompted to install:

- **ESLint** (`dbaeumer.vscode-eslint`) — Code linting and Tailwind CSS class ordering
- **Prettier** (`esbenp.prettier-vscode`) — Code formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — Autocomplete and IntelliSense
- **axe Accessibility Linter** (`deque-systems.vscode-axe-linter`) — Real-time accessibility linting

### Installation

```bash
git clone <repo-url>
cd mishpe26
pnpm install
pnpm run dev
```

Navigate to `http://localhost:5173`. Customize the port in `vite.config.js` if needed.

## Theme Switcher

The site supports four color themes — **Purple** (default), **Blue**, **Green**, and **Gold**. A floating palette button in the bottom-right lets visitors switch between them.

Themes work via CSS custom properties defined in `src/index.css`. The `iwd.gold` and `iwd.black` Tailwind tokens reference these variables, so the entire site re-themes instantly with zero component changes.

- Theme preference persists in `localStorage`
- Theme list and swatches: `src/constants/ui.js`
- Context: `src/components/ui/ThemeContext.jsx`
- Toggle UI: `src/components/ui/ThemeSwitcher.jsx`
- Full palette reference: [`COLOR.MD`](COLOR.MD)

## Docker

This application can be containerized using Docker for easy deployment and consistent environments.

### Prerequisites

- Docker installed on your system
- Basic understanding of Docker commands

### Building the Docker Image

1. Build the Docker image:

```bash
docker build -t mishpe26 .
```

2. Run the container:

```bash
docker run -p 3000:3000 mishpe26
```

3. Open your browser and navigate to `http://localhost:3000`

### Docker Commands

| Command                                                 | Description                                     |
| ------------------------------------------------------- | ----------------------------------------------- |
| `docker build -t mishpe26 .`                            | Build the Docker image                          |
| `docker run -p 3000:3000 mishpe26`                      | Run the container on port 3000                  |
| `docker run -d -p 3000:3000 --name mishpe-app mishpe26` | Run container in detached mode with custom name |
| `docker stop mishpe-app`                                | Stop the running container                      |
| `docker rm mishpe-app`                                  | Remove the container                            |
| `docker images`                                         | List all Docker images                          |
| `docker rmi mishpe26`                                   | Remove the Docker image                         |

### Environment Variables

The **front-end application** requires no environment variables at runtime.

The **import pipeline** (`scripts/sanity-import/`) requires a `.env` file (gitignored) with Sanity and Google credentials. See `scripts/sanity-import/.env.example` and `n8n/RUNBOOK.md` for setup instructions.

### Docker Features

- **Alpine Linux base**: Lightweight and secure
- **Non-root user**: Enhanced security by running as non-root user
- **Multi-stage optimization**: Efficient image size
- **Production-ready**: Uses Vite preview for serving the built application

## Development Scripts

| Command                     | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `pnpm run dev`              | Start the development server via Vite                             |
| `pnpm run dev:cms`          | Fetch latest Sanity content, then start dev server                |
| `pnpm run fetch:event-data` | Pull speakers/sessions from Sanity into `speakers.generated.json` |
| `pnpm run studio:dev`       | Start local Sanity Studio at `http://localhost:3333`              |
| `pnpm run build`            | Fetch from Sanity, then build for production                      |
| `pnpm run preview`          | Create a preview of the production build locally                  |
| `pnpm run lint`             | Check code for linting errors (includes Tailwind class order)     |
| `pnpm run lint:fix`         | Automatically fix linting errors                                  |
| `pnpm run format`           | Format code with Prettier                                         |
| `pnpm run format:check`     | Check code formatting with Prettier                               |
| `pnpm run commitlint`       | Validate commit message format                                    |
| `pnpm run a11y:check`       | Lint for a11y issues, then run the axe audit over every route     |
| `pnpm run audit`            | Report dependency vulnerabilities (CI fails on high/critical)     |
| `ppnpm run import:speakers` | Run the Google Sheets → Sanity speaker import script              |

## Project Structure

```text
public/                 # Static files at site root (robots.txt, sitemap.xml, social-card.jpg)
studio/                 # Sanity Studio (separate app — see studio/README.md)
scripts/sanity-import/  # Speaker import scripts for n8n / manual runs
n8n/                    # n8n workflow docs and sheet templates
src/
├── assets/             # Images, fonts, and static assets
├── components/         # UI components
├── constants/          # Application constants
├── data/               # Static data and content (e.g. devs, facilitators, organizers, speakers, and sponsors - Contains multiple years)
├── layouts/            # Section layout components
└── pages/              # Page components
```

## Content pipeline

Speaker and session data lives in **Sanity Studio** (`production` dataset). The site pulls it at build time — no n8n required for day-to-day edits.

### Edit in Studio (current workflow)

```
Sanity Studio (local :3333 or pridemi26.sanity.studio)
        ↓
pnpm run fetch:event-data  →  speakers.generated.json
        ↓
pnpm run dev  (or Vercel deploy for production)
```

| Studio | URL                                                         | Command                       |
| ------ | ----------------------------------------------------------- | ----------------------------- |
| Local  | `http://localhost:3333`                                     | `pnpm run studio:dev`         |
| Cloud  | [pridemi26.sanity.studio](https://pridemi26.sanity.studio/) | `cd studio && npm run deploy` |

Both studios edit the **same** cloud dataset. After publishing changes, run `pnpm run dev:cms` to see them on the local site.

### Bulk import (when n8n is available)

```
Google Sheet (speaker data)
        +
Google Drive folder (headshots)
        ↓
  n8n workflow (self-hosted)
        ↓
  import-speakers.mjs
        ↓
  Sanity Studio (cloud)
        ↓
  Vercel deploy hook → site rebuild
```

### Import script

```bash
pnpm run import:speakers
```

Requires `scripts/sanity-import/.env` (gitignored). Copy from `.env.example` and fill in credentials. See `.env.schema` for full documentation of each variable.

### Pipeline files

| Path                                          | Purpose                                 |
| --------------------------------------------- | --------------------------------------- |
| `scripts/sanity-import/import-speakers.mjs`   | Import engine                           |
| `scripts/sanity-import/lib/google.mjs`        | Google Sheets + Drive API client        |
| `scripts/sanity-import/lib/sanity-client.mjs` | Sanity mutations + asset upload         |
| `scripts/sanity-import/.env.example`          | Environment variable template           |
| `.env.schema`                                 | varlock schema — documents all env vars |
| `n8n/RUNBOOK.md`                              | Full setup and repeat runbook           |
| `n8n/sheet-template-speakers.md`              | Google Sheet column spec                |
| `n8n/workflows/speakers-import.example.json`  | Importable n8n workflow starter         |

## SEO & social sharing

Search engines and social platforms read static files and `index.html` directly — they do not run the React app.

| File                                      | Purpose                                                 |
| ----------------------------------------- | ------------------------------------------------------- |
| `public/robots.txt`                       | Crawler rules and sitemap location                      |
| `public/sitemap.xml`                      | List of public routes for search engines                |
| `public/social-card.jpg`                  | Preview image when links are shared                     |
| `index.html`                              | Canonical URL, Open Graph, and Twitter/X card meta tags |
| `src/components/ui/SEOStructuredData.jsx` | JSON-LD event schema on the homepage                    |

**Public routes in the sitemap** (from `src/App.jsx`):

- `/`
- `/careers-hub`
- `/connections`
- `/media`
- `/past-events`

Excluded from the sitemap: `/playground/*` (internal design previews), `/previous-events` (redirect), and 404 routes.

**When you add a public page**, add a `<url>` entry to `public/sitemap.xml` and bump `<lastmod>`.

**When the production domain changes**, update URLs in:

- `public/robots.txt`
- `public/sitemap.xml`
- `index.html` (canonical, `og:*`, `twitter:*`)
- `src/components/ui/SEOStructuredData.jsx`

**Verify after deploy:**

```bash
pnpm run build
# confirm dist/robots.txt and dist/sitemap.xml exist

curl https://lhmsummit.com/robots.txt
curl https://lhmsummit.com/sitemap.xml
```

Test link previews with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

**Note:** Subpages share the homepage Open Graph tags until per-route meta tags are added (e.g. `react-helmet-async`). For this event site, that is usually fine.

## Related projects in this repo

| Path                                   | Description                                     |
| -------------------------------------- | ----------------------------------------------- |
| [`studio/README.md`](studio/README.md) | Sanity Studio — content model, datasets, deploy |
| [`n8n/README.md`](n8n/README.md)       | Google Sheet → Sanity import workflow           |

## Development

### Code Style

This project uses ESLint and Prettier for code quality and formatting:

- Run `pnpm run lint` to check for linting issues
- Run `pnpm run format:check` to check code formatting
- Use `pnpm run lint:fix` and `pnpm run format` to automatically fix issues

Run format and lint commands from the **repository root** — CI uses the root `package.json`. The `studio/` folder is a separate app with its own Prettier config; use `npx prettier --write .` inside `studio/` for Studio-only files. `studio/` is a separate npm install with its own lockfile and is deliberately outside the pnpm workspace.

### Git Hooks

This project uses Husky and lint-staged to automatically enforce code quality:

- **Pre-commit hook** - Runs ESLint and Prettier on staged files before each commit
- **Commit-msg hook** - Validates the message against Conventional Commits
- **Pre-push hook** - Runs the full accessibility check (a11y lint + axe audit over every route)
- **Automatic formatting** - Code is automatically formatted and linted before commits
- **No manual intervention** - The hooks will fix issues automatically when possible

lint-staged covers `js`/`jsx` (ESLint + Prettier) and `mjs`, `cjs`, `ts`, `tsx`, `md`, `json`, `css`, `scss`, `yml`, `yaml`, `html` (Prettier only). CI runs `prettier --check .` across the whole repo, so anything outside those patterns can drift out of format without a local gate catching it — extend the patterns rather than relying on CI to notice.

**How it works:**

1. When you run `git commit`, the pre-commit hook triggers
2. lint-staged runs ESLint and Prettier on only the files you're committing
3. If there are fixable issues, they're automatically resolved
4. If there are unfixable issues, the commit is blocked until you fix them manually
5. Once all issues are resolved, the commit proceeds

### Conventional Commits

This project enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification for clear, consistent commit messages:

- **Commit-msg hook** - Automatically validates commit message format before each commit
- **Consistent history** - All commits follow a standardized format
- **Automation ready** - Enables automated changelog generation and semantic versioning

**Commit Message Format:**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Supported Types:**

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation changes
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or correcting tests
- `chore` - Maintenance
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert a previous commit

**Examples:**

```bash
feat: add user authentication
fix: resolve memory leak in data processing
docs: update API documentation
style: fix code formatting issues
refactor: simplify user validation logic
test: add unit tests for payment module
chore: update dependencies
```

**How it works:**

1. When you run `git commit`, the commit-msg hook triggers
2. commitlint validates your commit message against the conventional format
3. If the message is invalid, the commit is blocked with helpful error messages
4. If the message is valid, the commit proceeds normally

### Accessibility

This project prioritizes accessibility and uses several tools to ensure inclusive design:

- **Automated axe audit** - `pnpm run a11y:check` builds the site, serves it, and runs [axe-core](https://github.com/dequelabs/axe-core) against every route. Enforced by the pre-push hook and by CI, which runs the same script so local and CI coverage cannot drift.
- **ESLint jsx-a11y** - `pnpm run lint:a11y` catches accessibility problems in JSX before they ship
- **VS Code axe Accessibility Linter** - Real-time accessibility linting in the editor (when extension is installed)
- **ESLint Tailwind plugin** - Detects class ordering issues for better maintainability
- **ResponsiveImage component** - Provides proper alt text fallbacks and modern image formats
- **Semantic HTML** - Uses proper heading hierarchy and landmark elements
- **Manual accessibility testing** - Regular testing with browser accessibility tools

The audited routes live in `ROUTES` in `scripts/a11y-test.mjs` — add new routes there as they are created, or they go unchecked. Lazy-loaded routes need the `--load-delay` the script already passes: without it axe snapshots the `<Suspense>` fallback and reports missing landmarks and headings that are artifacts of the loading state, not real defects.

**Accessibility Guidelines**: This project follows WCAG 2.1 guidelines and includes proper ARIA labels, keyboard navigation support, and semantic HTML structure.

**Note**: If the axe Accessibility Linter extension is not available, you can use browser-based accessibility tools like:

- [axe DevTools browser extension](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- Built-in browser accessibility inspectors

### Tailwind CSS Class Ordering

This project uses a **manual class ordering** approach for optimal control and reliability:

1. **ESLint Tailwind plugin** detects when classes are out of order and shows warnings
2. **Developers manually fix** the class order when warnings appear
3. **Follows official Tailwind CSS class order** for consistency

**Benefits of manual ordering:**

- ✅ **Full control** over class organization
- ✅ **No conflicts** between different tools
- ✅ **Reliable** across all file types (JSX, HTML, etc.)
- ✅ **Team consistency** through ESLint warnings

**Class order reference:** Layout → Sizing → Spacing → Typography → Backgrounds → Effects → Transitions → Hover states

**Why not use Prettier Tailwind plugin:**

- ❌ **Layout breaking** - Plugin reorders classes that break specific layouts
- ❌ **Inconsistent behavior** - Plugin sometimes fails to sort classes properly
- ❌ **Version conflicts** - Plugin compatibility issues with different Prettier versions
- ❌ **Debugging complexity** - Hard to troubleshoot when sorting doesn't work as expected
- ❌ **Tool conflicts** - Can interfere with other formatting rules
- ✅ **Manual control** - Developers maintain full control over class organization

### Building for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory, ready for deployment.

### Deployment

The site is deployed on [Vercel](https://vercel.com) and uses Vercel Analytics and Speed Insights. Deployment is triggered automatically when changes are merged to `main` via the GitHub integration.

**Vercel configuration**:

- `vercel.json` – SPA rewrites so client-side routes (e.g. `/past-events`) resolve correctly
- `base: './'` in Vite config – Output works with Vercel’s static hosting
- `public/robots.txt` and `public/sitemap.xml` – Copied to `dist/` at build time and served as static files (before SPA rewrites)

**To deploy manually** (e.g. from a fork):

1. Connect the repository to Vercel
2. Use the default Vite preset (build command: `pnpm run build`, output directory: `dist/`). Vercel detects `pnpm-lock.yaml` and uses the pnpm version pinned in `packageManager`.
3. Deploy

**Alternative**: Use [Docker](#docker) for self-hosted deployments.

## Attribution

### Hero background (Three.js)

The landing hero uses a **WebGL holo ribbons animation** powered by [Three.js](https://threejs.org/) and a custom scene in this repository.

| Credit                          | Details                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Three.js**                    | Copyright © 2010–2026 [three.js authors](https://github.com/mrdoob/three.js). [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE). Used for WebGL rendering and shader materials (`ShaderMaterial` on a full-screen quad) for the raymarched hero scene.                                                                                                 |
| **Initial holo ribbons effect** | [Sabo Sugi](https://www.reddit.com/user/CollectionBulky1564/) — original WebGL concept and shaders, from [this CodePen](https://codepen.io/sabosugi/pen/vEgGvKR), adapted for this site.                                                                                                                                                                                 |
| **Site integration**            | [Greg Miller](https://github.com/shrinkray) (Compass Detroit) — React integration, color and geometry tuning, performance and accessibility behavior (static fallback, mobile pause), and scene wiring in `src/layouts/threejsHeroScene.js` and `src/layouts/LandingSectionThreejsHero.jsx`. Dev-only tuning UI uses [lil-gui](https://github.com/georgealways/lil-gui). |
| **Static hero fallback**        | When animation is off (mobile viewport, `prefers-reduced-motion`, user pause, or mobile nav over the hero), the site shows a poster frame in `src/assets/images/hero/` (`hero-ribbons.webp`) instead of running the WebGL loop.                                                                                                                                          |

Dependency versions: `three`, `lil-gui` (see `package.json`).

### Issues

This project uses GitHub Issues & GitHub Projects in the [Compass-Detroit/mishpe26](https://github.com/Compass-Detroit/mishpe26) repository for tracking development. Please create an issue if you encounter any problems or have suggestions for improvements.

### Pull Requests

Please submit a pull request for any changes you'd like to make.
