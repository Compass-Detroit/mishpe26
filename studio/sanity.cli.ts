import {defineCliConfig} from 'sanity/cli'
import {dataset, projectId} from './env'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    /**
     * Hosted Studio at https://lhmsummit.sanity.studio.
     *
     * `appId` was issued by `d1h6cagq` on the first deploy; keeping it here
     * stops the CLI prompting for an application ID. The previous project's
     * values (`aj9y2tf4rkv6rois3swpx99g` / `pridemi26`) belonged to `b18a6pbd`
     * and are not valid here.
     */
    studioHost: 'lhmsummit',
    appId: 'tkg9fdryrlzy9lse6vflz0i7',
  },
})
