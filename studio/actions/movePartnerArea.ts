import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {useDocumentOperation} from 'sanity'

type PartnerDoc = {partnerGroup?: string}

const TARGET_LABELS: Record<string, string> = {
  sponsor: 'Move to sponsors',
  community: 'Move to community groups',
}

/**
 * One-click swap between the two listed partner areas. It patches
 * `partnerGroup` and leaves the change as a draft, so the move reaches the site
 * the same way every other edit does — on publish.
 *
 * There is deliberately no one-click route to `nonSponsor`: un-listing an
 * organization is worth the two clicks on the "Partner group" radio. A partner
 * already sitting in `nonSponsor` targets Sponsor here, which reads as
 * restoring it.
 */
export const movePartnerArea: DocumentActionComponent = (props: DocumentActionProps) => {
  const {id, type, draft, published, onComplete} = props
  const {patch} = useDocumentOperation(id, type)

  const doc = (draft ?? published) as PartnerDoc | null
  const target = doc?.partnerGroup === 'sponsor' ? 'community' : 'sponsor'

  return {
    label: TARGET_LABELS[target],
    disabled: !doc,
    onHandle: () => {
      // Only sponsors hold a tier, so moving out of Sponsor drops it in the
      // same patch. Leaving it behind would fail validation on a field the
      // form hides once the move lands.
      patch.execute([
        {set: {partnerGroup: target}},
        ...(target === 'sponsor' ? [] : [{unset: ['tier']}]),
      ])
      onComplete()
    },
  }
}
