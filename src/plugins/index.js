import { useGirderClient, useNotificationBus } from '@/composables'

import vuetify from './vuetify'
import VuetifyConfig from './vuetifyConfig'

import { GirderAuthentication, GirderLogin, GirderOAuth, GirderRegister, GirderUpload } from '@/components'


export { VuetifyConfig }

export default function install(app, options = {}) {
  const girder = useGirderClient(options.girder || {})
  const notification = useNotificationBus(girder.rest, options.notification || {})

  girder.rest.fetchUser().then(
    (user) => {
      girder.state.user = user
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
}
