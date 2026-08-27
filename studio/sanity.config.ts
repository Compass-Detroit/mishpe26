import {defineConfig} from 'sanity'
import {movePartnerArea} from './actions/movePartnerArea'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {dataset, projectId, studioTitle} from './env'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: studioTitle,

  projectId,
  dataset,

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, {schemaType}) => (schemaType === 'partner' ? [...prev, movePartnerArea] : prev),
  },
})
