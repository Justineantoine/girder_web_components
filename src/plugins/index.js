import { useGirderClient, useNotificationBus } from '@/composables';

import vuetify from './vuetify';
import VuetifyConfig from './vuetifyConfig';

import * as GirderComponents from '@/components'

export { VuetifyConfig };

export default function install(app, options = {}) {
  const girder = useGirderClient(options.girder || {});
  const notification = useNotificationBus(girder.rest, options.notification || {});

  if (!!girder.apiRoot.value) {
    girder.rest.fetchUser().then(
      (user) => {
        girder.user = user
        if (user) {
          notification.bus.connect()
        }
      }
    );
  }
  

  // Provide states
  app.provide('girder', girder);
  app.provide('notifications', notification);
  
  // Use vuetify config
  app.use(vuetify);

  // Register components
  Object.keys(GirderComponents).forEach((componentName) => {
    app.component(componentName, GirderComponents[componentName]);
  });
}
