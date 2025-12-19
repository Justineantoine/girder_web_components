<script setup>
import { ref, inject, computed } from 'vue'
import { useTheme } from 'vuetify'

import Headline from './Headline.vue';
import NavLink from './NavLink.vue';
import { hasAdminAccess } from '@';

// ---- Injected client ----
const girder = inject('girder');

// ---- State ----
const theme = useTheme();
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
const dragEnabled = ref(false);
const rootLocationDisabled = ref(false);
const selected = [];
const selectable = ref(true);
const uploadEnabled = ref(true);
const uploadMultiple = ref(true);
const upsertEdit = ref(false);
const newFolderEnabled= ref(true);
const dropped = ref([]);
const droppedStrings = ref([]);
const apiRoot = ref(girder.state.apiRoot);
console.log(apiRoot.value)
// ---- Computed ----
const loggedOut = computed(() => !girder.state.user);
const location = computed({
  get() {
    return internalLocation.value ||
      (loggedOut.value
        ? {
            _id: '5c8a72438d777f072b97f9e1',
            _modelType: 'folder',
          }
        : girder.state.user
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

// ---- Methods ----
function logout() {
  girder.rest.logout();
}

function dragend({ items }) {
  dropped.value = items;
}

function drop(event) {
  droppedStrings.value = event.dataTransfer.getData('application/x-girder-items');
}

function handleSearchSelect(item) {
  if (['user', 'folder'].indexOf(item._modelType) >= 0) {
    location.value = item;
  } else {
    location.value = { _modelType: 'folder', _id: item.folderId };
  }
}

function setApiRoot(path) {
  console.log(path);
  apiRoot.value = path;
  // girder.rest.setApiRoot(path);
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
        ></nav-link>
        <nav-link
          title="Upload"
          href="#upload"
        ></nav-link>
        <nav-link
          title="Search"
          href="#search"
        ></nav-link>
        <nav-link
          title="File Manager"
          href="#file-manager"
        ></nav-link>
        <nav-link
          title="Access Control"
          href="#access-control"
        ></nav-link>
        <nav-link
          title="Upsert Folder"
          href="#upsert-folder"
        ></nav-link>
        <nav-link
          title="Breadcrumb"
          href="#breadcrumb"
        ></nav-link>
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
            ></v-switch>
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
          ></img>
          <div class="text-subtitle-1">
            This demo integrates with
            <a href="https://data.kitware.com">data.kitware.com</a>
          </div>

          <v-text-field v-model="apiRoot" append-icon="mdi-circle" @update:model-value="setApiRoot"> </v-text-field>

          <a id="auth"></a>
          <headline
            title="girder-authentication"
            link="src/components/Authentication/Authentication.vue"
            description="allows users to authenticate with girder"
          ></headline>
          <v-row class="ma-2">
            <v-switch
              v-model="authRegister"
              class="ma-2"
              hide-details="hide-details"
              label="Register tab"
              color="primary"
            ></v-switch>
            <v-switch
              v-model="authOauth"
              class="ma-2"
              hide-details="hide-details"
              label="OAuth options"
              color="primary"
            ></v-switch>
          </v-row>
          <girder-authentication
              v-if="loggedOut"
              :key="girder.state.token"
              :force-otp="false"
              :register="authRegister"
              :oauth="authOauth"
              :forgot-password-url="forgotPasswordUrl"
          ></girder-authentication>
          <v-btn
            v-else
            color="primary"
            prepend-icon="$logout"
            @click="logout()"
            text="Log out"
          ></v-btn>

          <a id="upload"></a>
          <headline
            title="girder-upload"
            link="src/components/Upload/Upload.vue"
            description="upload files to a specified location in girder"
          ></headline>
          <girder-upload
            :dest="uploadDest"
          ></girder-upload>
          <a id="search"></a>
          <headline
            title="girder-search"
            link="src/components/Search.vue"
            description="provides global search functionality"
          ></headline>
          <v-card class="pa-3">
            <girder-search @select="handleSearchSelect"></girder-search>
          </v-card>

          <a id="file-manager"></a>
          <headline
            title="girder-file-manager"
            link="src/components/FileManager.vue"
            description="a wrapper around girder-data-browser. It packages the browser with
            defaults including folder creation, item upload, and a breadcrumb bar"
          ></headline>
          <v-row class="ma-2 justify-space-around">
            <v-switch
              v-model="selectable"
              hide-details="hide-details"
              label="Select"
              color="primary"
            ></v-switch>
            <v-switch
              v-model="dragEnabled"
              hide-details="hide-details"
              label="Draggable"
              color="primary"
            ></v-switch>
            <v-switch
              v-model="newFolderEnabled"
              hide-details="hide-details"
              label="New Folder"
              color="primary"
            ></v-switch>
            <v-switch
              v-model="uploadEnabled"
              hide-details="hide-details"
              label="Upload"
              color="primary"
            ></v-switch>
            <v-switch
              v-model="rootLocationDisabled"
              hide-details="hide-details"
              label="Root Disabled"
              color="primary"
            ></v-switch>
          </v-row>
          <girder-file-manager
            ref="girderFileManager"
            v-model:selected="selected"
            v-model:location="location"
            :items-per-page-options="[10, 20, -1]"
            :drag-enabled="dragEnabled"
            :new-folder-enabled="newFolderEnabled"
            :selectable="selectable"
            :root-location-disabled="rootLocationDisabled"
            :upload-multiple="uploadMultiple"
            :upload-enabled="uploadEnabled"
            @dragend="dragend"
          >
            <template #row="props">
              <i>{{ props.item.name }}</i>
            </template>
          </girder-file-manager>
          <v-card
            v-if="dragEnabled"
            @dragenter.prevent=""
            @dragover.prevent=""
            @drop="drop"
            title="Drop Zone"
            class="mt-3"
          >
            <v-card-text>
              <p v-if="!(dropped.length)">
                Drag a row here to see results
              </p>
              <v-list-item
                v-else
                v-for="{ item } in dropped"
                :key="item._id"
                :title="item.name"
                :subtitle="`${item._modelType} -- ${item.size}`"
              ></v-list-item>
            </v-card-text>
          </v-card>

          <a id="access-control"></a>
          <headline
            title="girder-access-control"
            link="src/components/AccessControl.vue"
            description="access controls for folders and items"
          ></headline>
          <girder-access-control v-if="hasAdminAccess(uploadDest)" :model="uploadDest"></girder-access-control>
          <v-card v-else text="Must have Admin access to folder or collection"></v-card>

          <a id="upsert-folder"></a>
          <headline
            title="girder-upsert-folder"
            link="src/components/UpsertFolder.vue"
            description="create and edit folders"
          ></headline>
          <v-row class="ma-2">
            <v-switch
              v-model="upsertEdit"
              label="Edit Mode"
              hide-details
              color="primary"
            ></v-switch>
          </v-row>
          <girder-upsert-folder
            :location="uploadDest"
            :edit="upsertEdit"
          ></girder-upsert-folder>
          
          <a id="breadcrumb"></a>
          <headline
            title="girder-breadcrumb"
            link="src/components/Breadcrumb.vue"
            description="filesystem path breadcrumb"
          ></headline>
          <v-card class="pa-3">
            <girder-breadcrumb :location="uploadDest"></girder-breadcrumb>
          </v-card>
        </v-col>
      </v-container>
    </v-main>
  </v-app>
</template>
