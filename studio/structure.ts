import type {StructureResolver} from 'sanity/structure'

const PARTNER_ORDERING = [
  {field: 'sortOrder', direction: 'asc' as const},
  {field: 'name', direction: 'asc' as const},
]

/**
 * One list per partner area. Moving an organization between them is the
 * "Partner group" field, or the "Move to …" document action. The non-sponsor
 * list holds organizations kept on file but not shown on the site this year.
 */
function partnerArea(S: Parameters<StructureResolver>[0], title: string, group: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentTypeList('partner')
        .title(title)
        .filter('_type == "partner" && partnerGroup == $group')
        .params({group})
        .initialValueTemplates([])
        .defaultOrdering(PARTNER_ORDERING)
    )
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem().title('Events').child(S.documentTypeList('event').title('Events')),
      S.divider(),
      S.listItem()
        .title('Speakers')
        .child(
          S.documentTypeList('speaker')
            .title('Speakers')
            .defaultOrdering([{field: 'name', direction: 'asc'}])
        ),
      S.listItem()
        .title('Sessions')
        .child(
          S.documentTypeList('session')
            .title('Sessions')
            .defaultOrdering([{field: 'startTime', direction: 'asc'}])
        ),
      S.listItem()
        .title('Partners')
        .child(
          S.list()
            .title('Partners')
            .items([
              partnerArea(S, 'Sponsors', 'sponsor'),
              partnerArea(S, 'Community groups', 'community'),
              S.divider(),
              partnerArea(S, 'Non-sponsors (not listed)', 'nonSponsor'),
              S.divider(),
              S.listItem()
                .title('All partners')
                .child(
                  S.documentTypeList('partner')
                    .title('All partners')
                    .defaultOrdering(PARTNER_ORDERING)
                ),
            ])
        ),
      S.listItem()
        .title('Team')
        .child(
          S.documentTypeList('teamMember')
            .title('Team members')
            .defaultOrdering([
              {field: 'teamGroup', direction: 'asc'},
              {field: 'sortOrder', direction: 'asc'},
              {field: 'name', direction: 'asc'},
            ])
        ),
    ])
