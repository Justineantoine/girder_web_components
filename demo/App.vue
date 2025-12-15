<script setup>
import { ref, inject, computed, watchEffect } from 'vue'
import { useTheme } from 'vuetify'

import Headline from './Headline.vue';
import NavLink from './NavLink.vue';

const girder = inject('girder');
const theme = useTheme();

// ---- State ----
const authOauth = ref(true);
const authRegister = ref(true);
const forgotPasswordUrl = ref('/#?dialog=resetpassword');
const badges = ref([
  'https://img.shields.io/circleci/build/github/girder/girder_web_components/master?style=for-the-badge',
  'https://img.shields.io/npm/v/@girder/components?style=for-the-badge',
  'https://img.shields.io/npm/dm/@girder/components?style=for-the-badge',
  'https://img.shields.io/bundlephobia/min/@girder/components?style=for-the-badge',
  'https://img.shields.io/github/stars/girder/girder_web_components?style=for-the-badge',
]);
const currentTheme = ref(theme.global.name.value);
const internalLocation = ref(null);

const loggedOut = computed(() => !girder.state.user);

const location = computed({
  get() {
    return internalLocation.value ||
      (loggedOut.value
        ? {
            _id: '5c8a72438d777f072b97f9e1',
            _modelType: 'folder',
          }
        : girder.rest.user
      );
  },
  set(value) {
    internalLocation.value = value;
  },
});

const uploadDest = computed(() => {
  if (location.value._modelType === 'folder') {
    return location.value;
  }
  return {
    name: 'temp',
    _id: '5e2a25fdaf2e2eed35309112',
    _modelType: 'folder',
  };
});

function logout() {
  girder.rest.logout();
}

</script>

<template>
  <v-app class="app">
    <v-navigation-drawer app>
      <v-list nav>
        <a class="text-h6">Components</a>
        <nav-link
          title="Authentication"
          href="#auth"
        />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container>
        <v-col
          xl="8"
          offset-xl="2"
          lg="10"
          offset-lg="1"
          md="12"
          offset-md="0"
        >
          <div class="text-h3 d-flex justify-space-between">
            Girder Web Components
            <v-switch
              v-model="currentTheme"
              value="dark"
              false-value="light"
              @click="theme.toggle()"
              class="mx-4 my-0"
              hide-details="hide-details"
              label="Dark theme"
              inset
            />
          </div>
          <div class="text-subtitle-1 mb-1">
            A Vue + Vuetify library for interacting with
            <a href="https://www.kitware.com/">Kitware's</a>
            data management platform,
            <a href="https://girder.readthedocs.io/en/stable/">Girder</a>
          </div>
          <img
            v-for="badge in badges"
            :key="badge"
            :src="badge"
            class="pr-3"
          />
          <div class="text-subtitle-1">
            This demo integrates with
            <a href="https://data.kitware.com">data.kitware.com</a>
          </div>

          <a id="auth"></a>
          <headline
            title="girder-authentication"
            link="src/components/Authentication/Authentication.vue"
            description="allows users to authenticate with girder"
          />
          <v-row class="ml-2">
            <v-switch
              v-model="authRegister"
              class="ma-2"
              hide-details="hide-details"
              label="Register tab"
            />
            <v-switch
              v-model="authOauth"
              class="ma-2"
              hide-details="hide-details"
              label="OAuth options"
            />
          </v-row>
          <girder-authentication
              v-if="loggedOut"
              :key="girder.state.token"
              :force-otp="false"
              :register="authRegister"
              :oauth="authOauth"
              :forgot-password-url="forgotPasswordUrl"
            />
          <v-btn
            v-else
            color="primary"
            prepend-icon="$logout"
            @click="logout()"
          >
            Log Out
          </v-btn>

          <a id="upload"></a>
          <headline
            title="girder-upload"
            link="src/components/Upload.vue"
            description="upload files to a specified location in girder"
          />
          <girder-upload
            :dest="uploadDest"
          />
        </v-col>
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss" scoped>
.app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
