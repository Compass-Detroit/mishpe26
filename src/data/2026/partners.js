/**
 * Sponsors and community groups for the public site.
 * Generated from Sanity before each build — see scripts/fetch-event-data.mjs.
 */
import partnersGenerated from './partners.generated.json'

function rows(list) {
  return Array.isArray(list) ? list : []
}

export const partnersData = {
  sponsors: rows(partnersGenerated.sponsors),
  community: rows(partnersGenerated.community),
}
