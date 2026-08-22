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
 * Run `npx browser-driver-manager install chrome` if the local pair drifts out
 * of sync with your Chrome.
 */
import { spawn } from 'node:child_process'
import process from 'node:process'

const PORT = Number(process.env.A11Y_PORT || 3000)
const TARGET_URL = `http://localhost:${PORT}`
const SERVER_TIMEOUT_MS = 30_000
const AXE_TIMEOUT_MS = 120_000

/** Resolve a package binary without assuming node_modules/.bin is on PATH. */
const bin = (name) =>
  new URL(`../node_modules/.bin/${name}`, import.meta.url).pathname

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
      const res = await fetch(TARGET_URL, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return
    } catch {
      // Not listening yet — keep polling.
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(
    `server did not respond at ${TARGET_URL} within ${SERVER_TIMEOUT_MS}ms`
  )
}

function runAxe() {
  // -s serves the SPA fallback so client-side routes resolve instead of 404ing.
  const args = [TARGET_URL, '--exit']
  if (process.env.AXE_CHROMEDRIVER_PATH) {
    args.push('--chromedriver-path', process.env.AXE_CHROMEDRIVER_PATH)
  }

  return new Promise((resolve, reject) => {
    const axe = spawn(bin('axe'), args, { stdio: 'inherit' })
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
  server = spawn(bin('serve'), ['dist', '-s', '-l', String(PORT)], {
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
