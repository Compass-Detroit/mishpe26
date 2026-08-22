/**
 * Runs the axe accessibility audit against a locally served production build.
 *
 * Replaces a shell one-liner that could not work on macOS: `timeout` is not a
 * BSD builtin, and backgrounding `serve` with `&` left orphaned processes when
 * axe failed. This spawns both, waits for the server to actually answer, and
 * tears it down on every exit path.
 *
 * Chromedriver: axe resolves its own Chrome-for-Testing pair via
 * browser-driver-manager, which is correct locally. Overriding that with a
 * mismatched binary is what produced the "ChromeDriver version mismatch" this
 * script was stubbed out for. CI has no browser-driver-manager install, so it
 * passes a system chromedriver instead — set AXE_CHROMEDRIVER_PATH for that.
 *
 * Run `pnpm dlx browser-driver-manager install chrome` if the local pair drifts out
 * of sync with your Chrome.
 */
import { spawn } from 'node:child_process'
import process from 'node:process'

const PORT = Number(process.env.A11Y_PORT || 3000)
const ORIGIN = `http://localhost:${PORT}`
const SERVER_TIMEOUT_MS = 30_000
/** Generous: axe drives a real browser per route, so this scales with ROUTES. */
const AXE_TIMEOUT_MS = 300_000
/** Time for React.lazy chunks to resolve before axe snapshots the DOM. */
const LOAD_DELAY_MS = Number(process.env.A11Y_LOAD_DELAY || 3000)

/**
 * Every route in src/App.jsx that renders distinct UI. Auditing only "/" left
 * the rest of the site unchecked. Keep in sync when routes change.
 *
 * "/previous-events" is omitted: it is a <Navigate replace> to "/past-events",
 * so it renders nothing of its own. "/not-found" is any unmatched path — with
 * `serve -s` it returns index.html and React Router renders the 404 page.
 */
const ROUTES = process.env.A11Y_ROUTES
  ? process.env.A11Y_ROUTES.split(',').map((r) => r.trim())
  : [
      '/',
      '/past-events',
      '/careers-hub',
      '/connections',
      '/media',
      '/not-found',
    ]

/**
 * Run a package binary through `pnpm exec`. Under pnpm's symlinked layout
 * node_modules/.bin is populated for direct dependencies, but pnpm exec
 * resolves correctly regardless of hoisting and is the supported entry point.
 */
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const execArgs = (name, args) => ['exec', name, ...args]

let server = null

function stopServer() {
  if (server && server.exitCode === null && !server.killed) {
    server.kill('SIGTERM')
  }
  server = null
}

async function waitForServer() {
  const deadline = Date.now() + SERVER_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`serve exited early with code ${server.exitCode}`)
    }
    try {
      const res = await fetch(ORIGIN, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return
    } catch {
      // Not listening yet — keep polling.
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(
    `server did not respond at ${ORIGIN} within ${SERVER_TIMEOUT_MS}ms`
  )
}

function runAxe() {
  // -s serves the SPA fallback so client-side routes resolve instead of 404ing.
  const urls = ROUTES.map((route) => new URL(route, ORIGIN).href)
  console.log(`Auditing ${urls.length} routes: ${ROUTES.join(', ')}`)
  // Every route except "/" is React.lazy behind a <Suspense> fallback. Without a
  // delay axe audits that fallback — a bare "Loading…" span with no <main>, no
  // <h1>, and a skip link pointing at content that has not mounted — and reports
  // landmark-one-main / page-has-heading-one / skip-link / region on every lazy
  // route. Those are artifacts of the loading state, not real page defects.
  const args = [...urls, '--exit', '--load-delay', String(LOAD_DELAY_MS)]
  if (process.env.AXE_CHROMEDRIVER_PATH) {
    args.push('--chromedriver-path', process.env.AXE_CHROMEDRIVER_PATH)
  }

  return new Promise((resolve, reject) => {
    const axe = spawn(PNPM, execArgs('axe', args), { stdio: 'inherit' })
    const timer = setTimeout(() => {
      axe.kill('SIGKILL')
      reject(new Error(`axe timed out after ${AXE_TIMEOUT_MS}ms`))
    }, AXE_TIMEOUT_MS)

    axe.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    axe.on('close', (code) => {
      clearTimeout(timer)
      resolve(code ?? 1)
    })
  })
}

async function main() {
  server = spawn(PNPM, execArgs('serve', ['dist', '-s', '-l', String(PORT)]), {
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  server.on('error', (err) => {
    console.error(`failed to start serve: ${err.message}`)
    process.exit(1)
  })

  await waitForServer()
  const code = await runAxe()
  stopServer()
  process.exit(code)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopServer()
    process.exit(130)
  })
}

main().catch((err) => {
  console.error(`accessibility test failed: ${err.message}`)
  stopServer()
  process.exit(1)
})
