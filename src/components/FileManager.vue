<script>
import { ref, computed, inject, nextTick, reactive } from 'vue';

import GirderUpload from './Upload';
import GirderUpsertFolder from './UpsertFolder.vue';
import GirderDataBrowser from './DataBrowser.vue';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderAccessControl from './AccessControl.vue';

import {
  getLocationType,
  isRootLocation,
  createLocationValidator,
} from '@/utils';

export default {
  name: 'GirderFileManager',

  components: {
    GirderAccessControl,
    GirderBreadcrumb,
    GirderUpload,
    GirderUpsertFolder,
    GirderDataBrowser,
  },

  props: {
    selected: { type: Array, default: () => [] },
    location: { type: Object, default: null, validator: createLocationValidator(true) },
    rootLocationDisabled: { type: Boolean, default: false },
    noAccessControl: { type: Boolean, default: false },
    selectable: { type: Boolean, default: false },
    dragEnabled: { type: Boolean, default: false },
    uploadEnabled: { type: Boolean, default: false },
    newFolderEnabled: { type: Boolean, default: false },
    uploadMaxShow: { type: Number, default: 0 },
    uploadMultiple: { type: Boolean, default: false },
    uploadAccept: { type: String, default: '*' },
    preUpload: { type: Function, default: async () => { } },
    postUpload: { type: Function, default: async () => { } },
    preUpsert: { type: Function, default: async () => { } },
    postUpsert: { type: Function, default: async () => { } },
    itemsPerPage: { type: Number, default: 10 },
    itemsPerPageOptions: { type: Array, default: () => [10, 25, 50] },
  },

  emits: [
    'update:selected',
    'update:location',
    'update:options',
    'rowclick',
    'row-right-click',
    'drag',
    'dragstart',
    'dragend',
    'drop',
  ],

  setup(props, ctx) {
    // ---- Injected client ----
    const girder = inject('girder');

    // ---- State ----
    const uploaderDialog = ref(false);
    const newFolderDialog = ref(false);
    const lazyLocation = ref(null);

    const collectionAndFolderMenu = reactive({
      show: false,
      x: 0,
      y: 0,
    });

    const actOnItem = ref(null);
    const showAccessControlDialog = ref(false);
    const hasAccessPermission = ref(false);

    const girderBrowser = ref(null);

    // ---- State ----
    const user = computed(() => girder.state.user);
    const internalLocation = computed({
      get() {
        if (props.location) return props.location;
        if (lazyLocation.value) return lazyLocation.value;
        return { type: 'root' };
      },
      set(val) {
        lazyLocation.value = val;
        ctx.emit('update:location', val);
      },
    });

    const uploadDest = computed(() =>
      internalLocation.value &&
        getLocationType(internalLocation.value) === 'folder'
        ? internalLocation.value
        : null,
    );

    const shouldShowNewFolder = computed(() =>
      props.newFolderEnabled &&
      !isRootLocation(internalLocation.value) &&
      user.value
    );

    const shouldShowUpload = computed(() =>
      props.uploadEnabled &&
      !isRootLocation(internalLocation.value) &&
      user.value &&
      uploadDest.value,
    );

    // ---- Validation ----
    if (!createLocationValidator(!props.rootLocationDisabled)(props.location)) {
      throw new Error(
        'root location cannot be used when root-location-disabled is true',
      );
    }

    // ---- Methods ----
    function refresh() {
      girderBrowser.value?.refresh();
    }

    async function postUploadInternal() {
      refresh();
      uploaderDialog.value = false;

      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 400)),
        props.postUpload(),
      ]);
    }

    async function postUpsertInternal() {
      refresh();
      newFolderDialog.value = false;

      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 400)),
        props.postUpsert(),
      ]);
    }

    function rowRightClick({row, event}) {
      if (props.noAccessControl) return;
  
      if (['collection', 'folder'].includes(row._modelType)) {
        collectionAndFolderMenu.show = false;
        collectionAndFolderMenu.x = event.clientX;
        collectionAndFolderMenu.y = event.clientY;
        actOnItem.value = row;

        nextTick(() => {
          collectionAndFolderMenu.show = true;
        });
        
        event.preventDefault();
      }
    }

    return {
      user,
      girderBrowser,
      internalLocation,
      uploadDest,
      shouldShowUpload,
      shouldShowNewFolder,
      uploaderDialog,
      newFolderDialog,
      collectionAndFolderMenu,
      actOnItem,
      showAccessControlDialog,
      hasAccessPermission,
      refresh,
      postUploadInternal,
      postUpsertInternal,
      rowRightClick,
      getLocationType,
      isRootLocation,
    };
  },
};
</script>

<template>
  <v-card>
    <girder-data-browser
      ref="girderBrowser"
      :location="location"
      :selectable="selectable"
      :draggable="dragEnabled"
      :root-location-disabled="rootLocationDisabled"
      :items-per-page="itemsPerPage"
      :items-per-page-options="itemsPerPageOptions"
      :selected="selected"
      @drag="$emit('drag', $event)"
      @dragend="$emit('dragend', $event)"
      @dragstart="$emit('dragstart', $event)"
      @row-right-click="rowRightClick"
      @rowclick="$emit('rowclick', $event)"
      @update:location="$emit('update:location', $event)"
      @update:options="$emit('update:options', $event)"
      @update:selected="$emit('update:selected', $event)"
    >
      <template #breadcrumb="{ location, changeLocation, rootLocationDisabled }">
        <girder-breadcrumb
          :location="location"
          :root-location-disabled="rootLocationDisabled"
          @crumbclick="changeLocation($event)"
        />
      </template>
      <template #headerwidget>
        <slot name="headerwidget"></slot>
        <v-btn v-if="shouldShowNewFolder" v-tooltip="{text: 'New folder', location: 'bottom'}" flat icon>
          <v-icon color="primary" icon="$folderNew"/>
          <v-dialog  v-model="newFolderDialog" activator="parent" max-width="800px">
            <girder-upsert-folder :key="internalLocation._id" :location="internalLocation" :pre-upsert="preUpsert"
            :post-upsert="postUpsertInternal" @dismiss="newFolderDialog = false" />
          </v-dialog>
        </v-btn>
        <v-btn v-if="shouldShowUpload" v-tooltip="{text: 'Upload files', location: 'bottom'}" flat icon>
          <v-icon color="primary" icon="$fileNew"/>
          <v-dialog v-model="uploaderDialog" activator="parent" max-width="800px">
            <girder-upload :dest="uploadDest" :pre-upload="preUpload" :post-upload="postUploadInternal"
              :multiple="uploadMultiple" :max-show="uploadMaxShow" :accept="uploadAccept" />
          </v-dialog>
        </v-btn>
      </template>
      <template #row="props">
        <slot v-bind="props" name="row"></slot>
      </template>
    </girder-data-browser>
    <v-overlay
      v-model="collectionAndFolderMenu.show"
      v-if="hasAccessPermission"
      :scrim="false"
    >
      <v-list
        class="context-menu"
        :style="{
          left: `${collectionAndFolderMenu.x}px`,
          top: `${collectionAndFolderMenu.y}px`
        }"
      >
        <v-list-item
          @click="showAccessControlDialog=true"
          title="Access Control"
        />
      </v-list>
    </v-overlay>
    <v-dialog
      v-model="showAccessControlDialog"
      max-width="700px"
      persistent="persistent"
      eager="eager"
      scrollable="scrollable"
    >
      <girder-access-control
        v-if="actOnItem"
        :model="actOnItem"
        v-model:has-permission="hasAccessPermission"
        @close="showAccessControlDialog=false"
        @update:model-access="refresh"
      />
    </v-dialog>
  </v-card>
</template>

<style lang="scss">
.context-menu {
  padding: 0px;
  position: 'fixed';
  display: flex;
}
</style>