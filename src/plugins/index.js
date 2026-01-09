import { useGirderClient, useNotificationBus } from '@/composables'

import vuetify from './vuetify'
import VuetifyConfig from './vuetifyConfig'

import {
  GirderAuthentication,
  GirderLogin,
  GirderOAuth,
  GirderRegister,
  GirderUpload,
  GirderDataBrowser,
  GirderFileManager,
  GirderMarkdownEditor,
  GirderBreadcrumb,
  GirderUpsertFolder,
  GirderSearch,
  GirderAccessControl,
  GirderDataDetails,
  GirderDataTable,
  GirderDetailList,
  GirderMarkdown,
  GirderDropzone,
  GirderUploadFileList,
} from '@/components'
import { EventProp } from 'vuetify/lib/util/helpers.mjs'


export { VuetifyConfig }

export default function install(app, options = {}) {
  const girder = useGirderClient(options.girder || {})
  const notification = useNotificationBus(girder.rest, options.notification || {})

  girder.rest.fetchUser().then(
    (user) => {
      girder.user.value = user
      if (user) {
        notification.bus.connect()
      }
    }
  )

  // Provide states
  app.provide('girder', girder)
  app.provide('notifications', notification)

  // Use vuetify config
  app.use(vuetify)

  // Register components
  app.component('GirderAuthentication', GirderAuthentication)
  app.component('GirderLogin', GirderLogin)
  app.component('GirderOAuth', GirderOAuth)
  app.component('GirderRegister', GirderRegister)
  app.component('GirderUpload', GirderUpload)
  app.component('GirderDataBrowser', GirderDataBrowser)
  app.component('GirderFileManager', GirderFileManager)
  app.component('GirderMarkdownEditor', GirderMarkdownEditor)
  app.component('GirderBreadcrumb', GirderBreadcrumb)
  app.component('GirderUpsertFolder', GirderUpsertFolder)
  app.component('GirderSearch', GirderSearch)
  app.component('GirderAccessControl', GirderAccessControl)
  app.component('GirderDataDetails', GirderDataDetails)
  app.component('GirderDataTable', GirderDataTable)
  app.component('GirderDetailList', GirderDetailList)
  app.component('GirderMarkdown', GirderMarkdown)
  app.component('GirderDropzone', GirderDropzone)
  app.component('GirderUploadFileList', GirderUploadFileList)
}
