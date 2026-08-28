import {defineField, defineType} from 'sanity'

/**
 * Which area of the site a partner renders in — or, for `nonSponsor`, that it
 * renders nowhere. Keeping a not-listed organization as a real document (rather
 * than deleting it or unpublishing it) preserves its logo, copy and slug for the
 * year it comes back.
 */
const PARTNER_GROUP_OPTIONS = [
  {title: 'Sponsor', value: 'sponsor'},
  {title: 'Community group', value: 'community'},
  {title: 'Non-sponsor', value: 'nonSponsor'},
]

/**
 * Sponsor tier ladder, highest first. Mirrors src/data/sponsorTiers.js on the
 * frontend, which also owns the slot counts and row shapes. studio/ is an
 * independent npm install and cannot import from src/, so the keys and titles
 * live in both places — keep them in sync.
 */
const SPONSOR_TIER_OPTIONS = [
  {title: 'Diamond', value: 'diamond'},
  {title: 'Platinum', value: 'platinum'},
  {title: 'Gold', value: 'gold'},
  {title: 'Media', value: 'media'},
  {title: 'Fuel', value: 'fuel'},
]

const PARTNER_GROUP_LABELS: Record<string, string> = Object.fromEntries(
  PARTNER_GROUP_OPTIONS.map(({title, value}) => [value, title])
)

const SPONSOR_TIER_LABELS: Record<string, string> = Object.fromEntries(
  SPONSOR_TIER_OPTIONS.map(({title, value}) => [value, title])
)

function partnerGroupLabel(value: string | undefined): string | undefined {
  if (!value) return undefined
  return PARTNER_GROUP_LABELS[value] ?? value
}

function sponsorTierLabel(value: string | undefined): string | undefined {
  if (!value) return undefined
  return SPONSOR_TIER_LABELS[value] ?? value
}

export const partner = defineType({
  name: 'partner',
  title: 'Partner',
  type: 'document',
  fields: [
    defineField({
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
      description: 'Stable key for imports (e.g. gdg-detroit).',
    }),
    defineField({
      name: 'partnerGroup',
      title: 'Partner group',
      type: 'string',
      options: {list: PARTNER_GROUP_OPTIONS, layout: 'radio'},
      initialValue: 'community',
      validation: (rule) => rule.required(),
      description:
        'Sponsors are shown first, ranked into tiers. Community groups follow in a single ' +
        'flat grid, four to a row. Non-sponsors appear nowhere on the site — use it for an ' +
        'organization that is not with us this year but whose details are worth keeping. ' +
        'Use the "Move to …" action to switch an organization between areas.',
    }),
    defineField({
      name: 'tier',
      title: 'Sponsor tier',
      type: 'string',
      options: {list: SPONSOR_TIER_OPTIONS, layout: 'radio'},
      /**
       * Hidden for anything that is not a sponsor — but only while it is
       * actually empty. A partner demoted from Sponsor keeps whatever tier it
       * had, and validation runs on hidden fields too — so the leftover value
       * would be flagged on a field the form was concealing. Keeping a stale
       * value visible makes it clearable.
       */
      hidden: ({parent, value}) => parent?.partnerGroup !== 'sponsor' && !value,
      description:
        'Which row this sponsor sits in, highest first: Diamond (1 slot), Platinum (2), ' +
        'Gold (4), then the in-kind rows Media (4) and Fuel (4). Unfilled slots render as ' +
        'dashed placeholders, so the tier is also a statement about open inventory. ' +
        'Only sponsors are tiered; community groups and non-sponsors leave this blank.',
      validation: (rule) => [
        /**
         * An error, because the consequence is severe and silent: the tier row
         * is 1:1 with Sanity, so a sponsor without one is left off the page
         * entirely. Better to block the publish than to lose a sponsor.
         */
        rule.custom((value, context) => {
          const group = (context.parent as {partnerGroup?: string} | undefined)?.partnerGroup
          if (group === 'sponsor' && !value) {
            return 'Pick a tier for every sponsor — it decides which row the logo lands in.'
          }
          return true
        }),
        /**
         * Only a warning. Switching the group by hand leaves the old tier
         * behind, and Studio disables Publish on a validation error — as an
         * error this stranded the very edit the author was making. A leftover
         * tier cannot reach the page anyway: non-sponsors are dropped outright
         * and community groups never consult the field. So flag it for tidying
         * and let the publish through.
         */
        rule
          .custom((value, context) => {
            const group = (context.parent as {partnerGroup?: string} | undefined)?.partnerGroup
            if (group !== 'sponsor' && value) {
              return 'Only sponsors are tiered, so this is ignored. Clear it to keep the record tidy.'
            }
            return true
          })
          .warning(),
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
      description: 'Transparent PNG or WebP reads best against the light logo plate.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description:
            'Describes the logo when the image fails to load. The card link is already ' +
            'labelled with the partner name, so usually just "<Name> logo". Leave blank ' +
            'only if the logo is purely decorative.',
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 5,
      description: 'Shown on the card back. The first ~100 characters are what most people read.',
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      description: 'Rendered as the card link, so only http(s) addresses are accepted.',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.integer(),
      description:
        'Lower numbers appear first — within a tier for sponsors, within the grid for ' +
        'community groups. It does not move a sponsor between tiers; only the tier does that.',
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      group: 'partnerGroup',
      tier: 'tier',
      sortOrder: 'sortOrder',
      media: 'logo',
      year: 'event.year',
    },
    prepare: ({title, group, tier, sortOrder, media, year}) => ({
      title: title ?? 'Unnamed partner',
      subtitle: [
        year,
        // A tiered sponsor reads better as "Diamond" than "Sponsor · Diamond".
        group === 'sponsor'
          ? sponsorTierLabel(tier) ?? 'Sponsor · no tier'
          : partnerGroupLabel(group),
        `#${sortOrder ?? 0}`,
      ]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})
