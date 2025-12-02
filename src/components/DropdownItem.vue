<template>
  <div
    class="dropdown-item"
    :class="itemClass"
    @click="$emit('click')"
  >
    <span v-html="formattedText"></span>
    <v-icon
      v-if="showIcon"
      :name="iconName"
      small
      class="check-icon"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "DropdownItem",
  props: {
    formattedText: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    showIcon: {
      type: Boolean,
      default: false,
    },
    iconName: {
      type: String,
      default: "check",
    },
  },
  emits: ["click"],
  setup(props) {
    const itemClass = computed(() => ({
      active: props.isActive,
      custom: props.isCustom,
      disabled: props.isDisabled,
    }));

    return {
      itemClass,
    };
  },
});
</script>

<style scoped>
.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color var(--fast) var(--transition);
}

.dropdown-item:hover {
  background-color: var(--theme--background-accent);
}

.dropdown-item.active {
  background-color: var(--theme--background-accent);
  color: var(--theme--primary);
}

.dropdown-item.custom {
  border-top: var(--theme--border-width) solid
    var(--theme--border-color-subdued);
  color: var(--theme--primary);
}

.dropdown-item.disabled {
  cursor: default;
  color: var(--theme--foreground-subdued);
}

.dropdown-item.disabled:hover {
  background-color: transparent;
}

.check-icon {
  margin-left: 8px;
  flex-shrink: 0;
}
</style>

