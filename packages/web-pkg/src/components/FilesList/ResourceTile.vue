<template>
  <div
    class="oc-tile-card oc-card oc-card-default oc-rounded"
    :data-item-id="resource.id"
    :class="{
      'oc-tile-card-selected': isResourceSelected,
      'oc-tile-card-disabled': isResourceDisabled && !isProjectSpaceResource(resource),
      'state-trashed': isResourceDisabled && isProjectSpaceResource(resource)
    }"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <resource-link
      class="oc-card-media-top oc-flex oc-flex-center oc-flex-middle oc-m-rm"
      :resource="resource"
      :folder-link="resourceRoute"
      :is-resource-clickable="isResourceClickable"
      tabindex="-1"
      @click="$emit('click')"
    >
      <div class="oc-tile-card-selection">
        <slot name="selection" :item="resource" />
      </div>
      <oc-tag
        v-if="isResourceDisabled && isProjectSpaceResource(resource)"
        class="resource-disabled-indicator oc-position-absolute"
        type="span"
      >
        <span v-text="$gettext('Disabled')" />
      </oc-tag>
      <div
        v-oc-tooltip="tooltipLabelIcon"
        class="oc-tile-card-preview oc-flex oc-flex-middle oc-flex-center"
        :aria-label="tooltipLabelIcon"
      >
        <div class="oc-tile-card-hover"></div>
        <slot name="imageField" :item="resource">
          <oc-img
            v-if="shouldDisplayThumbnails(resource)"
            class="tile-preview"
            :src="resource.thumbnail"
          />
          <resource-icon
            v-else
            :resource="resource"
            :size="resourceIconSize"
            class="tile-default-image oc-pt-xs"
          >
            <template v-if="showStatusIcon" #status>
              <oc-icon v-bind="statusIconAttrs" size="xsmall" />
            </template>
          </resource-icon>
        </slot>
      </div>
    </resource-link>
    <div class="oc-card-body oc-p-s">
      <div class="oc-flex oc-flex-between oc-flex-middle">
        <div class="oc-flex oc-flex-middle oc-text-truncate resource-name-wrapper">
          <resource-list-item
            :resource="resource"
            :is-icon-displayed="false"
            :is-extension-displayed="isExtensionDisplayed"
            :is-resource-clickable="isResourceClickable"
            :folder-link="resourceRoute"
            @click="$emit('click')"
          />
        </div>
        <div class="oc-flex oc-flex-middle">
          <!-- Slot for indicators !-->
          <slot name="indicators" :item="resource" class="resource-indicators" />
          <!-- Slot for individual actions -->
          <slot name="actions" :item="resource" />
          <!-- Slot for contextmenu -->
          <slot name="contextMenu" :item="resource" />
        </div>
      </div>
      <p v-if="resourceDescription" class="oc-text-left oc-my-rm oc-text-truncate">
        <small v-text="resourceDescription" />
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import ResourceIcon from './ResourceIcon.vue'
import ResourceListItem from './ResourceListItem.vue'
import ResourceLink from './ResourceLink.vue'
import { isProjectSpaceResource, Resource } from '@ownclouders/web-client'
import { useGettext } from 'vue3-gettext'
import { isSpaceResource } from '@ownclouders/web-client'
import { isResourceTxtFileAlmostEmpty } from '../../helpers'

export default defineComponent({
  name: 'ResourceTile',
  components: { ResourceListItem, ResourceIcon, ResourceLink },
  props: {
    /**
     * Resource to be displayed within the tile
     */
    resource: {
      type: Object as PropType<Resource>,
      default: () => ({})
    },
    resourceRoute: {
      type: Object,
      default: () => ({})
    },
    isResourceSelected: {
      type: Boolean,
      required: false,
      default: false
    },
    isResourceClickable: {
      type: Boolean,
      required: false,
      default: true
    },
    isResourceDisabled: {
      type: Boolean,
      required: false,
      default: false
    },
    isExtensionDisplayed: {
      type: Boolean,
      default: true
    },
    resourceIconSize: {
      type: String,
      default: 'xlarge',
      validator: (value: string) => {
        return ['large', 'xlarge', 'xxlarge', 'xxxlarge'].includes(value)
      }
    }
  },
  emits: ['click', 'contextmenu'],
  setup(props) {
    const { $gettext } = useGettext()
    const showStatusIcon = computed(() => {
      return props.resource.locked || props.resource.processing
    })

    const statusIconAttrs = computed(() => {
      if (props.resource.locked) {
        return {
          name: 'lock',
          fillType: 'fill'
        }
      }

      if (props.resource.processing) {
        return {
          name: 'loop-right',
          fillType: 'line'
        }
      }

      return {}
    })

    const tooltipLabelIcon = computed(() => {
      if (props.resource.locked) {
        return $gettext('This item is locked')
      }
      return null
    })
    const resourceDescription = computed(() => {
      if (isSpaceResource(props.resource)) {
        return props.resource.description
      }
      return ''
    })

    const shouldDisplayThumbnails = (resource: Resource) => {
      return resource.thumbnail && !isResourceTxtFileAlmostEmpty(resource)
    }

    return {
      statusIconAttrs,
      showStatusIcon,
      tooltipLabelIcon,
      resourceDescription,
      shouldDisplayThumbnails,
      isProjectSpaceResource
    }
  }
})
</script>

<style lang="scss">
.oc-tile-card {
  background-color: var(--oc-color-background-highlight) !important;
  box-shadow: none;
  height: 100%;
  display: flex;
  flex-flow: column;
  outline: 1px solid var(--oc-color-border);

  &-disabled {
    pointer-events: none;
    background-color: var(--oc-color-background-muted) !important;
    opacity: 0.7;
    filter: grayscale(0.6);

    // Show tooltip on status indicators without handler
    span.oc-status-indicators-indicator {
      pointer-events: all;
    }
  }

  &.state-trashed {
    .tile-image,
    .tile-default-image > svg {
      filter: grayscale(100%);
      opacity: 80%;
    }
  }

  .tile-default-image {
    position: relative;
  }

  .oc-card-media-top {
    position: relative;
    aspect-ratio: 16/9;
    justify-content: center;
    width: 100%;

    .oc-tag {
      color: var(--oc-color-text-default);

      &.resource-disabled-indicator {
        z-index: 1;
      }
    }

    .tile-preview {
      aspect-ratio: 16/9;
      height: 100%;
      object-fit: cover;
      width: 100%;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
    }

    &:hover {
      .oc-tile-card-hover {
        opacity: 15%;
      }
    }
  }

  &-selected {
    outline: 2px solid var(--oc-color-swatch-primary-hover);

    .oc-tile-card-preview {
      width: calc(100% - var(--oc-space-medium));
      height: calc(100% - var(--oc-space-medium));

      .tile-preview,
      .oc-tile-card-hover {
        border-radius: 5px !important;
      }

      .oc-tile-card-hover {
        opacity: 10%;
      }
    }
  }

  &-selection {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;

    input {
      background-color: var(--oc-color-background-muted);
    }

    input.oc-checkbox-checked {
      background-color: var(--oc-color-swatch-inverse-default);
    }
  }

  &-preview {
    position: absolute;
    height: 100%;
    width: 100%;
    text-align: center;
  }

  &-hover {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #000;
    opacity: 0;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }

  .resource-name-wrapper {
    color: var(--oc-color-text-default);
    max-width: 70%;
    overflow: hidden;
  }
}
</style>
