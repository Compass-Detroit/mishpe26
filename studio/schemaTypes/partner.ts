import {defineField, defineType} from 'sanity'

const PARTNER_GROUP_OPTIONS = [
  {title: 'Sponsor', value: 'sponsor'},
  {title: 'Community group', value: 'community'},
]

const PARTNER_GROUP_LABELS: Record<string, string> = Object.fromEntries(
  PARTNER_GROUP_OPTIONS.map(({title, value}) => [value, title])
)

function partnerGroupLabel(value: string | undefined): string | undefined {
  if (!value) return undefined
  return PARTNER_GROUP_LABELS[value] ?? value
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
        'Sponsors are shown first, three to a row on larger cards. Community groups follow, ' +
        'four to a row. Use the "Move to …" action to switch an organization between them.',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
      description: 'Transparent PNG or WebP reads best against the light logo plate.',
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
        'Lower numbers appear first within a group. All cards in a group are the same size.',
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
      sortOrder: 'sortOrder',
      media: 'logo',
      year: 'event.year',
    },
    prepare: ({title, group, sortOrder, media, year}) => ({
      title: title ?? 'Unnamed partner',
      subtitle: [year, partnerGroupLabel(group), `#${sortOrder ?? 0}`].filter(Boolean).join(' · '),
      media,
    }),
  },
})
