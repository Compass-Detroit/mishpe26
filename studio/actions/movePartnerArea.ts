import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {useDocumentOperation} from 'sanity'

type PartnerDoc = {partnerGroup?: string}

const TARGET_LABELS: Record<string, string> = {
  sponsor: 'Move to sponsors',
  community: 'Move to community groups',
}

/**
 * One-click swap between the two partner areas. It patches `partnerGroup` and
 * leaves the change as a draft, so the move reaches the site the same way every
 * other edit does — on publish.
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
      patch.execute([{set: {partnerGroup: target}}])
      onComplete()
    },
  }
}
