/**
 * Fetch published speakers/sessions and partners from Sanity and write
 * frontend-ready JSON. Run before build (or manually via
 * pnpm fetch:event-data).
 */
import { writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@sanity/client'
import prettier from 'prettier'
/**
 * Deep relative path rather than the `@/` alias the rest of the codebase uses:
 * this script is run directly by Node for `prebuild`, and Node resolves neither
 * jsconfig.json nor vite.config.js aliases. The alias convention applies to
 * code that goes through the bundler.
 */
import { SPONSOR_TIER_KEYS, isSponsorTier } from '../src/data/sponsorTiers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUTPUT = path.join(ROOT, 'src/data/2026/speakers.generated.json')
const PARTNERS_OUTPUT = path.join(ROOT, 'src/data/2026/partners.generated.json')
const OPTIONAL_ENV = path.join(ROOT, 'scripts/sanity-import/.env')

const DEFAULT_PROJECT_ID = 'd1h6cagq'
const DEFAULT_DATASET = 'production'
const DEFAULT_EVENT_YEAR = 2026
const DEFAULT_TRACK = 'Level Up'
/**
 * Placeholder venue until the Summit location is confirmed. Intentionally not
 * 'TBA': the site is not published until there is a real location to promote,
 * so a stale-but-concrete default is preferable to a blank one here.
 */
const DEFAULT_ROOM = 'IBM HQ'

const SESSIONS_QUERY = `*[_type == "session" && event->year == $year && published == true] | order(startTime asc, title asc) {
  _id,
  "sessionSlug": slug.current,
  title,
  abstract,
  description,
  track,
  tags,
  startTime,
  room,
  durationMinutes,
  participants[]{
    sortOrder,
    isModerator,
    speaker->{
      _id,
      "speakerSlug": slug.current,
      name,
      bio,
      organization,
      position,
      isWTM,
      isGDE,
      linkedIn,
      twitter,
      github,
      mastodon,
      published,
      "featuredSessionId": featuredSession->_id,
      "avatar": headshot.asset->url
    }
  }
}`

const PARTNERS_QUERY = `*[_type == "partner" && event->year == $year && published == true] | order(sortOrder asc, name asc) {
  "id": slug.current,
  name,
  partnerGroup,
  tier,
  "desc": description,
  url,
  "logo": logo.asset->url,
  "logoAlt": logo.alt
}`

function readEnv(name, fallback) {
  const value = process.env[name]?.trim()
  return value || fallback
}

/** Load scripts/sanity-import/.env when present; never required for public CDN reads. */
function loadOptionalEnvFile() {
  if (!existsSync(OPTIONAL_ENV)) return

  for (const line of readFileSync(OPTIONAL_ENV, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function stableSpeakerSessionId(speakerSlug, sessionSlug) {
  const input = `${speakerSlug}::${sessionSlug}`
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 1
}

function buildRow(session, participant) {
  const speaker = participant.speaker
  if (!speaker?.published) return null

  const speakerSlug = speaker.speakerSlug
  const sessionSlug = session.sessionSlug
  if (!speakerSlug || !sessionSlug) return null

  const row = {
    id: stableSpeakerSessionId(speakerSlug, sessionSlug),
    name: speaker.name,
    avatar: speaker.avatar ?? '',
    bio: speaker.bio ?? '',
    organization: speaker.organization ?? '',
    position: speaker.position ?? '',
    isWTM: Boolean(speaker.isWTM),
    isGDE: Boolean(speaker.isGDE),
    isModerator: Boolean(participant.isModerator),
    sortOrder: participant.sortOrder ?? 0,
    session: {
      title: session.title,
      abstract: session.abstract ?? '',
      description: session.description ?? session.abstract ?? '',
      tags: session.tags?.length ? session.tags : [DEFAULT_TRACK],
      track: session.track || DEFAULT_TRACK,
      time: session.startTime || 'TBA',
      room: session.room || DEFAULT_ROOM,
      sessionDuration: session.durationMinutes ?? 60,
    },
  }

  if (speaker.linkedIn) row.linkedIn = speaker.linkedIn
  if (speaker.twitter) row.twitter = speaker.twitter
  if (speaker.github) row.github = speaker.github
  if (speaker.mastodon) row.mastodon = speaker.mastodon

  row._sessionId = session._id
  row._featuredSessionId = speaker.featuredSessionId ?? null

  return row
}

function enrichSessionParticipants(rows) {
  const bySessionId = new Map()

  for (const row of rows) {
    const sessionId = row._sessionId
    if (!bySessionId.has(sessionId)) bySessionId.set(sessionId, [])
    bySessionId.get(sessionId).push(row)
  }

  for (const row of rows) {
    const group = bySessionId.get(row._sessionId) ?? [row]
    const participants = group
      .map(({ name, avatar, isModerator, sortOrder }) => ({
        name,
        avatar,
        isModerator: Boolean(isModerator),
        sortOrder: sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    row.session.speakers = participants.map((p) => p.name)
    row.session.moderators = participants
      .filter((p) => p.isModerator)
      .map((p) => p.name)
    row.session.panelists = participants
      .filter((p) => !p.isModerator)
      .map((p) => p.name)
    row.session.participants = participants
  }

  return rows
}

function prioritizeFeaturedSessions(rows) {
  const result = [...rows]
  const firstIndexByName = new Map()

  result.forEach((row, index) => {
    if (!firstIndexByName.has(row.name)) {
      firstIndexByName.set(row.name, index)
    }
  })

  for (const [name, firstIdx] of firstIndexByName) {
    const featuredIdx = result.findIndex(
      (row) => row.name === name && row._sessionId === row._featuredSessionId
    )
    if (featuredIdx > firstIdx) {
      const [featured] = result.splice(featuredIdx, 1)
      result.splice(firstIdx, 0, featured)
    }
  }

  return result
}

function stripInternalFields(rows) {
  return rows.map(({ _sessionId, _featuredSessionId, ...row }) => row)
}

function resolveSource(options) {
  return {
    projectId:
      options.projectId ?? readEnv('SANITY_PROJECT_ID', DEFAULT_PROJECT_ID),
    dataset: options.dataset ?? readEnv('SANITY_DATASET', DEFAULT_DATASET),
    eventYear: Number(
      options.eventYear ??
        readEnv('SANITY_EVENT_YEAR', String(DEFAULT_EVENT_YEAR))
    ),
  }
}

function createSanityClient({ projectId, dataset }) {
  return createClient({
    projectId,
    dataset,
    apiVersion: '2026-06-01',
    useCdn: false,
    token: process.env.SANITY_READ_TOKEN || undefined,
  })
}

export async function fetchEventSpeakers(options = {}) {
  const { projectId, dataset, eventYear } = resolveSource(options)
  const client = createSanityClient({ projectId, dataset })

  const sessions = await client.fetch(SESSIONS_QUERY, { year: eventYear })

  const rows = []
  for (const session of sessions) {
    const participants = [...(session.participants ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    )

    for (const participant of participants) {
      const row = buildRow(session, participant)
      if (row) rows.push(row)
    }
  }

  return prioritizeFeaturedSessions(enrichSessionParticipants(rows))
}

/**
 * Partners split into the two areas the site renders: sponsors first, then the
 * community groups that volunteer their efforts. Sort order sets position
 * within an area.
 *
 * Sponsors carry a `tier` through to the frontend, which buckets them into the
 * ladder in src/data/sponsorTiers.js. They stay a flat list here so the shape
 * of partners.generated.json does not change when a tier is added or renamed.
 * Community groups are not tiered. Partners in the `nonSponsor` group are kept
 * in Sanity but written to neither area.
 */
export async function fetchEventPartners(options = {}) {
  const { projectId, dataset, eventYear } = resolveSource(options)
  const client = createSanityClient({ projectId, dataset })

  const rows = await client.fetch(PARTNERS_QUERY, { year: eventYear })

  const grouped = { sponsors: [], community: [] }
  const AREA_BY_GROUP = { sponsor: 'sponsors', community: 'community' }
  /**
   * A deliberate "keep the record, show nothing" state, as opposed to a group
   * we do not recognise. Dropped without a warning — it is the author saying
   * this organization is not with us this year, not a data problem.
   */
  const NOT_LISTED = 'nonSponsor'
  let notListed = 0

  for (const {
    id,
    name,
    partnerGroup,
    tier,
    desc,
    url,
    logo,
    logoAlt,
  } of rows) {
    if (!id || !name) continue

    if (partnerGroup === NOT_LISTED) {
      notListed += 1
      continue
    }

    const area = AREA_BY_GROUP[partnerGroup]
    if (!area) {
      console.warn(
        `fetch-event-data: partner "${name}" has partnerGroup ` +
          `"${partnerGroup ?? '(unset)'}", which is not one of sponsor, ` +
          `community or ${NOT_LISTED}. Skipping it rather than guessing an area.`
      )
      continue
    }

    // Type-checked, not coerced: anything that is not a string is replaced with
    // '' rather than stringified. `?? ''` would pass a non-string through, and
    // truncateDescription slices it on the way to the card.
    const entry = {
      id,
      name,
      logo: typeof logo === 'string' ? logo : '',
      logoAlt: typeof logoAlt === 'string' ? logoAlt : '',
      desc: typeof desc === 'string' ? desc : '',
      url: typeof url === 'string' ? url : '',
    }

    if (area === 'sponsors') {
      /**
       * The tier row is 1:1 with Sanity, so there is no default to fall back
       * on — placing an untiered sponsor in a row would assert a level nobody
       * agreed to. The Studio requires a tier on every sponsor, so this only
       * catches documents written before the field existed. Named loudly,
       * because the consequence is a sponsor missing from the page.
       */
      if (!isSponsorTier(tier)) {
        console.warn(
          `fetch-event-data: sponsor "${name}" has tier ` +
            `"${tier ?? '(unset)'}", which is not one of ` +
            `${SPONSOR_TIER_KEYS.join(', ')}. LEAVING IT OFF THE SITE — ` +
            `set a tier on this partner in the Studio and publish.`
        )
        continue
      }

      entry.tier = tier
    }

    grouped[area].push(entry)
  }

  if (notListed > 0) {
    console.log(
      `fetch-event-data: ${notListed} partner(s) marked non-sponsor and left ` +
        `off the site.`
    )
  }

  /**
   * `sourceRows` is what the query returned, before any filtering. It is what
   * tells an authoritative empty result ("every partner is a non-sponsor")
   * apart from a suspicious one ("this dataset or year has no partners at
   * all") — the two are indistinguishable by the size of `grouped`.
   */
  return { ...grouped, sourceRows: rows.length }
}

async function writeFormattedJson(filePath, data) {
  const config = await prettier.resolveConfig(filePath)
  const formatted = await prettier.format(JSON.stringify(data), {
    ...(config ?? {}),
    filepath: filePath,
    parser: 'json',
  })
  await writeFile(filePath, formatted, 'utf8')
}

/**
 * Rows already committed to a generated file: a count when the file parses,
 * 0 when it is absent, or `null` when it exists but cannot be counted.
 *
 * `null` is deliberately distinct from 0 — an unreadable file may still hold
 * real data, so it must not be treated as "safe to overwrite".
 */
function committedRowCount(filePath, countRows) {
  if (!existsSync(filePath)) return 0
  try {
    return countRows(JSON.parse(readFileSync(filePath, 'utf8')))
  } catch {
    return null
  }
}

/**
 * Refuse to replace real committed data with an empty result. `prebuild` runs
 * on every `vite build`, so an empty dataset — or a query that silently matches
 * nothing after a schema change — would otherwise blank a section site-wide.
 * Non-fatal: the build continues against the existing file.
 */
function shouldKeepExisting(filePath, freshCount, existingCount) {
  if (freshCount > 0 || existingCount === 0) return false

  const relative = path.relative(ROOT, filePath)
  const state =
    existingCount === null
      ? `${relative} could not be parsed, so its contents are unknown`
      : `${relative} has ${existingCount}`

  console.warn(
    `fetch-event-data: query returned 0 rows but ${state}. ` +
      `Keeping the existing file.\n` +
      `  Publish content for the target event, or set SANITY_PROJECT_ID ` +
      `/ SANITY_DATASET / SANITY_EVENT_YEAR to the intended source.`
  )
  return true
}

async function writeSpeakers() {
  const rows = await fetchEventSpeakers()
  const output = stripInternalFields(rows)
  const existing = committedRowCount(OUTPUT, (parsed) =>
    Array.isArray(parsed) ? parsed.length : null
  )

  if (shouldKeepExisting(OUTPUT, output.length, existing)) return

  await writeFormattedJson(OUTPUT, output)

  console.log(
    `Wrote ${output.length} speaker-session rows to ${path.relative(
      ROOT,
      OUTPUT
    )}`
  )
}

function partnerCount(grouped) {
  if (!grouped || typeof grouped !== 'object') return null
  const { sponsors, community } = grouped
  if (!Array.isArray(sponsors) || !Array.isArray(community)) return null
  return sponsors.length + community.length
}

async function writePartners() {
  const { sponsors, community, sourceRows } = await fetchEventPartners()
  const grouped = { source: 'sanity', sponsors, community }
  const existing = committedRowCount(PARTNERS_OUTPUT, partnerCount)

  /**
   * Guarded on the query result, not the filtered one. Filtering everything out
   * is a real answer and must overwrite the file — otherwise marking every
   * partner a non-sponsor would leave the previous roster on the site, which is
   * exactly what the non-sponsor group exists to prevent.
   */
  if (shouldKeepExisting(PARTNERS_OUTPUT, sourceRows, existing)) return

  await writeFormattedJson(PARTNERS_OUTPUT, grouped)

  console.log(
    `Wrote ${sponsors.length} sponsors and ${community.length} ` +
      `community groups to ${path.relative(ROOT, PARTNERS_OUTPUT)}`
  )
}

async function main() {
  loadOptionalEnvFile()
  await writeSpeakers()
  await writePartners()
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  main().catch((error) => {
    console.error('fetch-event-data failed:', error.message)
    process.exit(1)
  })
}
