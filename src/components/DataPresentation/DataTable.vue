<script>
import { getLocationType, isRootLocation } from '@/utils';

export default {
  name: 'DataTable',

  props: {
    draggable: {type: Boolean, default: false},
    loading: {type: Boolean, required: true},
    options: {type: Object, required: true},
    rows: {type: Array, required: true},
    selectable: {type: Boolean, required: true},
    serverItemsLength: {type: Number, required: true},
    selected: {type: Array, default: () => []},
  },

  emits: [
    'drag',
    'dragend',
    'dragstart',
    'row-right-click',
    'rowclick',
    'update:options',
    'update:selected',
  ],

  setup(props, ctx) {
    // ---- Methods ----
    function handleRowSelect({ shiftKey }, rowProps) {
      if (props.selectable) {
        if (shiftKey) {
          rowProps.toggleSelect(rowProps.internalItem, rowProps.index, true);
        }
      } else {
        ctx.emit('rowclick', rowProps.item);
      }
    }

    function getRowClass(item) {
      const rowSelectable =
        (!props.selectable && getLocationType(item) === 'folder') ||
        isRootLocation(item) ||
        getLocationType(item) === 'user';

      return {
        'select-cursor': rowSelectable,
        'not-public': item.notPublic,
      };
    }

    function getItemClass(item) {
      return {
        'select-cursor': getLocationType(item) !== 'item',
      };
    }

    function emitDrag(eventName, event, items) {
      const modelListString = JSON.stringify(
        items.map(({ item }) => ({
          _id: item._id,
          _modelType: item._modelType,
        })),
      );

      event.dataTransfer.setData(
        'application/x-girder-items',
        modelListString,
      );

      ctx.emit(eventName, { event, items });
    }

    return {
      getLocationType,
      isRootLocation,
      handleRowSelect,
      getRowClass,
      getItemClass,
      emitDrag,
    };
  },
};
</script>

<template>
  <v-data-table
    :model-value="selected"
    :items="rows"
    :items-length="serverItemsLength"
    :loading="loading"
    :items-per-page="options.itemsPerPage"
    :page="options.page"
    hover
    item-value="_id"
    show-select
    hide-default-header
    class="girder-data-table"
    @update:options="val => $emit('update:options', val)"
    @update:model-value="$emit('update:selected', $event)"
  >
    <template #top="{ allSelected, someSelected, selectAll }">
      <div class="girder-data-table-header">
        <v-checkbox
          v-if="selectable"
          :model-value="allSelected"
          :indeterminate="someSelected && !allSelected"
          @update:model-value="selectAll"
          hide-details
          color="accent"
        />
        <v-divider v-if="selectable" class="ma-3" vertical/>
        <slot name="header"></slot>
      </div>
    </template>

    <template #item="props">
      <tr
        :key="props.item._id"
        :draggable="draggable"
        :active="props.isSelected(props.internalItem)"
        :class="getRowClass(props.item)"
        @click="handleRowSelect($event, props)"
        @drag="emitDrag('drag', $event, [props])"
        @dragstart="emitDrag('dragstart', $event, [props])"
        @dragend="emitDrag('dragend', $event, [props])"
      >
        <td v-if="selectable">
          <v-checkbox
            :model-value="props.isSelected(props.internalItem)"
            hide-details
            @update:model-value="event => props.toggleSelect(props.internalItem, props.index, event)"
          />
        </td>

        <td
          @contextmenu="$emit('row-right-click', { row: props.item, event: $event })"
        >
          <span
            :class="getItemClass(props.item)"
            class="text-container nobreak"
            @click.stop="$emit('rowclick', props.item)"
          >
            <v-icon
              :color="props.isSelected ? 'accent' : undefined"
              class="pr-2"
              :icon="props.item.icon"
            />

            <slot name="row" v-bind="props">
              {{ props.item.name }}
            </slot>
          </span>
        </td>

        <td class="text-right nobreak">
          {{ props.item.humanSize }}
        </td>
      </tr>
    </template>

    <template #no-data>
      <div class="text-center">No Data Available</div>
    </template>

    <template #no-results>
      <div class="text-center">No Data Available</div>
    </template>
  </v-data-table>
</template>

<style lang="scss">
.girder-data-table {
  padding-left: 12px;
  padding-right: 12px;
  cursor: default;

  .select-cursor {
    opacity: 0.8;

    &:hover {
      opacity: 1;
      cursor: pointer;
    }
  }

  &.v-data-table {
    tr {
      height: 56px;
      .v-input--selection-controls.v-input--checkbox {
        margin: 0 10px;
        border-right: 1.5px solid gray;
      }

      .text-container i {
        vertical-align: bottom;
      }

      .nobreak {
        white-space: nowrap;
      }
    }
    td {
      padding: 0px !important;
    }

    td:first-child {
      width: 65px
    }

    &.theme--light {
      tr {
        &.itemRow[active],
        &.itemRow:hover {
          background: #e1f5fe !important;
        }
      }
    }
  }

  .v-data-table__progress .v-progress-linear {
    position: absolute;
  }
}
.girder-data-table-header {
  height: 56px;
  display: flex;
  flex-direction: row;
  align-items: center;
}


</style>
