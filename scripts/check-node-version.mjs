#!/usr/bin/env node
/**
 * Fail if the running Node is below package.json's engines.node floor.
 * pnpm 11.21+ also refuses to start below 22.13, so this is the check that can
 * still run when an older Node is on PATH (git hooks, Docker, n8n).
 *
 * The floor is read from engines.node rather than duplicated here so the two
 * cannot drift. Only builtins are used — preinstall runs before dependencies
 * are on disk.
 */
import { readFileSync } from 'node:fs'

const range =
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    .engines?.node ?? ''

const floor = range.match(/(\d+)\.(\d+)\.(\d+)/)
if (!floor) {
  console.error(
    `Could not read a Node version floor from engines.node ("${range}").`
  )
  process.exit(1)
}

const MIN = floor.slice(1, 4).map(Number)
const current = process.versions.node.split('.').map(Number)
const ok =
  current[0] > MIN[0] ||
  (current[0] === MIN[0] &&
    (current[1] > MIN[1] || (current[1] === MIN[1] && current[2] >= MIN[2])))

if (!ok) {
  console.error(
    `This repo requires Node >=${MIN.join('.')} (found ${process.version}).\n` +
      'Install the version in .nvmrc: nvm install && nvm use'
  )
  process.exit(1)
}
