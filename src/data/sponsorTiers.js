/**
 * Sponsor tier ladder — the single source of truth for how the sponsor area is
 * ranked and laid out. Ported from the HackMI 2026 site so both events describe
 * their inventory the same way.
 *
 * Order in this array is the order the rows render, highest tier first.
 *
 * `slots` is the number of visible boxes in the row. Real sponsors fill from
 * the left; the remainder render as dashed `+` placeholders so open inventory
 * is visible to prospective sponsors. A row with more sponsors than slots grows
 * to fit rather than dropping anyone.
 *
 * `shape` picks the box proportions: `card` is the wide 7:4 plate used for the
 * paid tiers, `square` the 1:1 plate used for the smaller in-kind rows.
 *
 * Community groups are deliberately NOT on this ladder. They are a separate
 * area with a flat grid — see PartnersSection.
 *
 * The Studio has its own copy of the keys and titles in
 * studio/schemaTypes/partner.ts, because studio/ is an independent npm install
 * and cannot import from src/. Keep the two lists in sync.
 */

export const SPONSOR_TIERS = [
  {
    key: 'diamond',
    title: 'Diamond',
    slots: 1,
    shape: 'card',
    blurb: 'Presenting partner of the Summit.',
  },
  {
    key: 'platinum',
    title: 'Platinum',
    slots: 2,
    shape: 'card',
    blurb: 'Headline support across the day.',
  },
  {
    key: 'gold',
    title: 'Gold',
    slots: 4,
    shape: 'card',
    blurb: 'Funding the venue, the meals, and the seats.',
  },
  {
    key: 'media',
    title: 'Media',
    slots: 4,
    shape: 'square',
    blurb: 'Telling the story of the day.',
  },
  {
    key: 'fuel',
    title: 'Fuel',
    slots: 4,
    shape: 'square',
    blurb: 'Keeping the room fed and caffeinated.',
  },
]

export const SPONSOR_TIER_KEYS = SPONSOR_TIERS.map((tier) => tier.key)

/**
 * Tier used when a sponsor reaches the site without a usable one. Sponsors are
 * never dropped for a bad tier — a paying partner missing from the page is a
 * worse failure than one in the wrong row.
 */
export const DEFAULT_SPONSOR_TIER = 'gold'

export function isSponsorTier(value) {
  return SPONSOR_TIER_KEYS.includes(value)
}

/** Bucket a flat sponsor list into the ladder, preserving incoming order. */
export function groupSponsorsByTier(sponsors = []) {
  const byTier = Object.fromEntries(SPONSOR_TIER_KEYS.map((key) => [key, []]))

  for (const sponsor of sponsors) {
    if (!sponsor) continue
    const tier = isSponsorTier(sponsor.tier)
      ? sponsor.tier
      : DEFAULT_SPONSOR_TIER
    byTier[tier].push(sponsor)
  }

  return byTier
}
