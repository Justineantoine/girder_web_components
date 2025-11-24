<script>
import { ref, inject, watchEffect } from 'vue';
import GirderLogin from './Login';
import GirderRegister from './Register';
import { OauthTokenPrefix, OauthTokenSuffix } from '@/utils/restClient';

export default {
  name: 'GirderAuthentication',

  components: {
    GirderLogin,
    GirderRegister,
  },

  props: {
    register: { type: Boolean, default: false },
    oauth: { type: Boolean, default: false },
    forgotPasswordUrl: { type: String, default: null },
    forgotPasswordRoute: { type: [Object, String], default: null },
    forceOtp: { type: Boolean, default: false },
    hideForgotPassword: { type: Boolean, default: false },
  },

  setup(props) {
    // Inject Girder REST client
    const girder = inject("girder");

    // State
    const activeTab = ref("login");
    const oauthProviders = ref([]);

    // Load OAuth providers automatically when props or client changes
    watchEffect(async () => {
      if (!props.oauth) {
        oauthProviders.value = [];
        return;
      }

      try {
        const result = await girder.rest.axios.get("oauth/provider", {
          params: {
            redirect: `${window.location.href}${OauthTokenPrefix}{girderToken}${OauthTokenSuffix}`,
            list: true,
          },
        });

        oauthProviders.value = result.data || [];
      } catch (e) {
        oauthProviders.value = [];
      }
    });

    return {
      activeTab,
      oauthProviders,
      girder,
    };
  },
};
</script>

<template>
  <v-card variant="flat">
    <v-tabs
      v-model="activeTab"
      background-color="primary"
      dark="dark"
    >
      <v-tab 
      text="Log In"
      value="login"
      />
      <v-tab 
      v-if="register"
      text="Register"
      value="registration"
      />
    </v-tabs>
    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item value="login">
        <girder-login
          :oauth-providers="oauthProviders"
          v-bind="{ forceOtp, forgotPasswordUrl, forgotPasswordRoute, hideForgotPassword }"
          @forgotpassword="$emit('forgotpassword')"
        />
      </v-tabs-window-item>
      <v-tabs-window-item
        v-if="register"
        value="registration"
      >
        <girder-register :oauth-providers="oauthProviders" />
      </v-tabs-window-item>
    </v-tabs-window>
    
  </v-card>
</template>


