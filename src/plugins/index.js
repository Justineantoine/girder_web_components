import { createGirderClient, createNotification } from '@/store'

import vuetify from './vuetify'
import VuetifyConfig from './vuetifyConfig'

import { GirderAuthentication, GirderLogin, GirderOAuth, GirderRegister } from '@/components'


export { VuetifyConfig }

export default function install(app, options = {}) {
  const girder = createGirderClient(options.girder || {})
  const notification = createNotification(girder.rest, options.notification || {})

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
}
