/**
 * One-shot migration of src/data/2026/team.js into Sanity `teamMember`
 * documents, headshots included.
 *
 * Unlike import-speakers.mjs, which pulls from Google Sheets and Drive, the
 * team roster already lives in this repo with its images on disk. So this
 * reads the existing module and uploads from src/data/2026/assets/.
 *
 * team.js cannot simply be imported: it resolves headshots through the `@/`
 * alias, which Node does not understand. Rather than retype thirteen records
 * (the bios are long, and a transcription slip would be silent), the module is
 * read as text, its image imports are rewritten to plain path strings, and the
 * result is evaluated. Deterministic, and the source of truth stays team.js.
 *
 * Usage:
 *   node scripts/sanity-import/import-team.mjs --dry-run
 *   node scripts/sanity-import/import-team.mjs
 *
 * Requires SANITY_WRITE_TOKEN for a real run. Documents use a stable
 * `team-<slug>` id, so re-running updates in place rather than duplicating.
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import {
  createSanityClient,
  uploadImage,
  imageFieldFromAsset,
} from './lib/sanity-client.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const TEAM_MODULE = path.join(ROOT, 'src/data/2026/team.js')
const SRC = path.join(ROOT, 'src')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'd1h6cagq'
const DATASET = process.env.SANITY_DATASET || 'production'
const EVENT_YEAR = Number(process.env.SANITY_EVENT_YEAR || 2026)

/** `team` in the static data maps 1:1 onto `teamGroup` in the schema. */
const TEAM_GROUP = {
  compass: 'compass',
  devteam: 'devteam',
  facilitator: 'facilitator',
  board: 'board',
  marketing: 'marketing',
}

export const teamDocId = (slug) => `team-${slug}`

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Evaluate team.js with its image imports replaced by the paths they resolve
 * to, so `avatar` arrives as a string this script can read off disk.
 */
export async function readTeamRoster(modulePath = TEAM_MODULE) {
  const source = await readFile(modulePath, 'utf8')

  const imports = new Map()
  const importPattern = /^import\s+(\w+)\s+from\s+'([^']+)'/gm
  for (const [, identifier, specifier] of source.matchAll(importPattern)) {
    imports.set(identifier, specifier.replace(/^@\//, ''))
  }

  let body = source.replace(importPattern, '')
  // `avatar: JennaRitten` -> `avatar: "data/2026/assets/.../jenna_ritten.webp"`
  for (const [identifier, relativePath] of imports) {
    body = body.replace(
      new RegExp(`\\b${identifier}\\b`, 'g'),
      JSON.stringify(relativePath)
    )
  }

  const module = await import(
    `data:text/javascript;base64,${Buffer.from(body).toString('base64')}`
  )
  return module.teamData
}

/** Shape one static record into a teamMember document. */
export function toTeamMemberDoc(member, { eventYear, imageField }) {
  const slug = slugify(member.name)
  const teamGroup = TEAM_GROUP[member.team]

  if (!teamGroup) {
    throw new Error(
      `${member.name}: team "${member.team}" is not a known team group ` +
        `(${Object.keys(TEAM_GROUP).join(', ')}).`
    )
  }

  const doc = {
    _id: teamDocId(slug),
    _type: 'teamMember',
    name: member.name,
    slug: { _type: 'slug', current: slug },
    role: member.role,
    teamGroup,
    // Position within a group came from array order in the static file.
    sortOrder: member.id ?? 0,
    published: true,
    event: {
      _type: 'reference',
      _ref: `event-${eventYear}`,
    },
    importKey: `team.js:${member.id}`,
  }

  // Only set what exists — empty strings would render as blank fields in the
  // Studio and read as deliberate rather than absent.
  if (member.organization) doc.organization = member.organization
  if (member.university) doc.university = member.university
  if (member.bio) doc.bio = member.bio
  if (member.linkedin) doc.linkedIn = member.linkedin
  if (member.twitter) doc.twitter = member.twitter
  if (member.github) doc.github = member.github
  if (typeof member.commits === 'number') doc.commits = member.commits
  if (member.avatar) doc.headshotFilename = path.basename(member.avatar)
  if (imageField) doc.headshot = imageField

  return doc
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  const roster = await readTeamRoster()
  console.log(`Read ${roster.length} team members from src/data/2026/team.js`)

  let client = null
  if (!dryRun) {
    const token = process.env.SANITY_WRITE_TOKEN
    if (!token) {
      throw new Error(
        'SANITY_WRITE_TOKEN is required for a real run. Re-run with --dry-run ' +
          'to preview without it.'
      )
    }
    client = createSanityClient({
      projectId: PROJECT_ID,
      dataset: DATASET,
      token,
    })
  }

  const imageCache = new Map()
  const docs = []

  for (const member of roster) {
    let imageField = null

    if (member.avatar) {
      const absolute = path.join(SRC, member.avatar)
      const filename = path.basename(absolute)

      if (!existsSync(absolute)) {
        console.warn(
          `Headshot missing on disk for ${member.name}: ${member.avatar}. ` +
            `Importing without an image.`
        )
      } else if (dryRun) {
        imageField = `<would upload ${filename}>`
      } else if (imageCache.has(filename)) {
        imageField = imageCache.get(filename)
      } else {
        const buffer = await readFile(absolute)
        const asset = await uploadImage(client, buffer, filename)
        imageField = imageFieldFromAsset(asset)
        imageCache.set(filename, imageField)
      }
    }

    docs.push(
      toTeamMemberDoc(member, {
        eventYear: EVENT_YEAR,
        imageField: dryRun ? null : imageField,
      })
    )

    if (dryRun) {
      const doc = docs.at(-1)
      console.log(
        `  ${doc._id.padEnd(28)} ${doc.teamGroup.padEnd(11)} ` +
          `${doc.role}${imageField ? `  [${imageField}]` : '  [no image]'}`
      )
    }
  }

  if (dryRun) {
    console.log(`\nDry run — nothing written. ${docs.length} documents ready.`)
    return
  }

  // createOrReplace keeps the stable id, so a re-run corrects a bad import
  // rather than producing a second copy of the roster.
  let written = 0
  for (const doc of docs) {
    await client.createOrReplace(doc)
    written += 1
  }

  console.log(
    `Wrote ${written} teamMember documents to ${PROJECT_ID}/${DATASET}`
  )
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
