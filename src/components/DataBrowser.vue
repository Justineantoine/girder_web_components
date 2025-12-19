<script>
import { ref, reactive, computed, watch, inject } from 'vue';
import { DataTable } from './DataPresentation';
import {
  createLocationValidator,
  getLocationType,
  getSingularLocationTypeName,
  isRootLocation,
  formatSize,
  getResourceIcon,
} from '@/utils';

const GIRDER_FOLDER_ENDPOINT = 'folder';
const GIRDER_ITEM_ENDPOINT = 'item';

export default {
  name: "GirderDataBrowser",

  components: {
    DataTable,
  },

  props: {
    draggable: { type: Boolean, default: false },
    location: {
      type: Object,
      required: true,
      validator: createLocationValidator(true),
    },
    selectable: { type: Boolean, default: false },
    rootLocationDisabled: { type: Boolean, default: false },
    selected: { type: Array, default: () => [] },
    itemsPerPage: { type: Number, default: 10 },
    itemsPerPageOptions: { type: Array, default: () => [10, 25, 50] },
  },

  emits: [
    'drag',
    'dragend',
    'dragstart',
    'row-right-click',
    'rowclick',
    'update:location',
    'update:options',
    'update:selected',
  ],

  setup(props, ctx) {
    // ---- Injected client ----
    const girder = inject("girder");

    // ---- State ----
    const options = reactive({
      itemsPerPage: props.itemsPerPage,
      page: 1,
    });

    const internalRefreshCounter = ref(0);
    const rows = ref([]);
    const rowsLoading = ref(false);
    const counts = ref({
      nFolders: 0,
      nItems: 0,
      nUsers: 0,
      nCollections: 0,
    });
    const internalSelected = ref(props.selected);

    // ---- Computed ----
    const isSelectable = computed(
      () =>
        props.selectable &&
        props.location &&
        !isRootLocation(props.location),
    );
    
    const serverItemsLength = computed(() =>
      Object.values(counts.value).reduce((a, b) => a + b, 0),
    );

    // ---- Validation ----
    if (!createLocationValidator(!props.rootLocationDisabled)(props.location)) {
      throw new Error(
        'root location cannot be used when root-location-disabled is true',
      );
    }
  
    // ---- Methods ----
    function rowClick(row) {
      ctx.emit('rowclick', row, props.location);
      if (getLocationType(row) !== 'item') {
        changeLocation(row);
      }
    }

    function changeLocation(newLocation) {
      const oldLocation = props.location;
      if (
        oldLocation._id !== newLocation._id ||
        getLocationType(oldLocation) !== getLocationType(newLocation)
      ) {
        ctx.emit('update:location', newLocation);
      }
    }

    function refresh() {
      internalSelected.value = [];
      internalRefreshCounter.value++;
    }

    async function fetchPaginatedRows() {
      if (counts.value.nFolders || counts.value.nItems) {
        return fetchPaginatedFolderRows();
      }

      const type = getLocationType(props.location);
      if (['users', 'collections'].includes(type)) {
        return fetchPaginatedCollectionOrUserRows(
          getSingularLocationTypeName(props.location),
        );
      }

      if (type === 'root') {
        return generateRootRows();
      }

      return [];
    }

    async function fetchPaginatedFolderRows() {
      rowsLoading.value = true;

      const { nFolders, nItems } = counts.value;
      const { page, itemsPerPage } = options;
      const location = props.location;

      let folderNotPublic = false;
      if (!location.created && location._modelType === 'folder') {
        folderNotPublic = !(await girder.rest.get(`folder/${location._id}`)).data
          .public;
      }

      const promises = [];

      const folderOffset =
        itemsPerPage === -1 ? 0 : (page - 1) * itemsPerPage;

      const foldersLeft = Math.max(nFolders - folderOffset, 0);
      if (foldersLeft > 0) {
        promises.push(
          girder.rest.get(GIRDER_FOLDER_ENDPOINT, {
            params: {
              parentType: location._modelType,
              parentId: location._id,
              limit: itemsPerPage === -1 ? 0 : itemsPerPage,
              offset: folderOffset,
            },
          }),
        );
      }

      const itemOffset = Math.max(folderOffset - nFolders, 0);
      const itemsLeft = Math.max(nItems - itemOffset, 0);

      if (
        itemsLeft > 0 &&
        (itemsPerPage === -1 || itemsPerPage - foldersLeft > 0)
      ) {
        promises.push(
          girder.rest.get(GIRDER_ITEM_ENDPOINT, {
            params: {
              folderId: location._id,
              limit:
                itemsPerPage === -1
                  ? 0
                  : itemsPerPage - foldersLeft,
              offset: itemOffset,
            },
          }),
        );
      }

      const rowsData = (await Promise.all(promises))
        .flatMap((r) => r.data)
        .map((item) => ({
          ...item,
          humanSize: item.size ? formatSize(item.size) : '',
          icon: getResourceIcon(item),
          notPublic:
            item._modelType === 'folder'
              ? !item.public
              : folderNotPublic,
        }));

      rowsLoading.value = false;
      return rowsData;
    }

    async function fetchPaginatedCollectionOrUserRows(type) {
      rowsLoading.value = true;

      const { page, itemsPerPage } = options;
      const { data } = await girder.rest.get(type, {
        params: {
          limit: itemsPerPage >= 0 ? itemsPerPage : null,
          offset: (page - 1) * itemsPerPage,
        },
      });

      rowsLoading.value = false;
      return data.map((item) => ({
        ...item,
        name:
          item._modelType === 'user'
            ? `${item.firstName} ${item.lastName}`
            : item.name,
        humanSize: item.size ? formatSize(item.size) : '',
        icon: getResourceIcon(item),
      }));
    }

    function generateRootRows() {
      const rows = [{ type: 'collections', name: 'Collections', icon: '$collection' }];
      if (girder.rest.user) {
        rows.push({ type: 'users', name: 'Users', icon: '$user' });
      }
      return rows;
    }

    function getResourceType(type) {
      return type === 'collections' ? 'collection' : type === 'users' ? 'user' : '';
    }

    async function fetchCounts() {
      const base = {
        nFolders: 0,
        nItems: 0,
        nUsers: 0,
        nCollections: 0,
      };

      const type = getLocationType(props.location);
      const { _id } = props.location;

      try {
        if (['folder', 'user', 'collection'].includes(type)) {
          const { data } = await girder.rest.get(`${type}/${_id}/details`);
          counts.value = {
            ...base,
            nFolders: data.nFolders || 0,
            nItems: data.nItems || 0,
          };
          return;
        }

        if (type === 'users' || type === 'collections') {
          const { data } = await girder.rest.get(
            `${getResourceType(type)}/details`,
          );
          const key = Object.keys(data)[0];
          counts.value = { ...base, [key]: Object.values(data)[0] };
          return;
        }

        if (type === 'root') {
          counts.value = { ...base, nUsers: 1, nCollections: 1 };
          return;
        }

        counts.value = base;
      } catch {
        counts.value = base;
      }
    }

    // ---- Watchers ----
    watch(
      [internalRefreshCounter, () => props.location, () => girder.rest.user],
      fetchCounts,
      { immediate: true },
    );

    watch(
      () => props.location,
      (location) => {
        if (createLocationValidator(!props.rootLocationDisabled)(location)) {
          options.page = 1;
          internalSelected.value = [];
        }
      },
    );

    watch(
      () => props.selected,
      (val) => {
        internalSelected.value = val;
      },
    );

    watch([counts, options], async () => {
      rows.value = await fetchPaginatedRows();
    });

    return {
      options,
      rows,
      rowsLoading,
      counts,
      serverItemsLength,
      isSelectable,
      internalSelected,
      changeLocation,
      rowClick,
      refresh,
    };
  },
};
</script>

<template>
  <data-table
    v-model:selected="internalSelected"
    v-model:options="options"
    :draggable="draggable"
    :rows="rows"
    :server-items-length="serverItemsLength"
    :loading="rowsLoading"
    :selectable="isSelectable"
    @rowclick="rowClick"
    @row-right-click="$emit('rowRightClick', $event)"
    @drag="$emit('drag', $event)"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @drop="$emit('drop', $event)"
    @update:selected="$emit('update:selected', $event)"
    @update:options="$emit('update:options', $event)"
  >
    <template #header>
        <slot v-bind="{ location, changeLocation, rootLocationDisabled }" name="breadcrumb"></slot>
        <v-spacer />
        <slot name="headerwidget"></slot>
    </template>
    <template #row="props">
      <slot
        v-bind="props"
        name="row"
      ></slot>
    </template>
  </data-table>
</template>
