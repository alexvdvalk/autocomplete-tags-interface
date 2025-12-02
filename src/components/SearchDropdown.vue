<template>
  <div
    v-if="show && hasResults"
    class="dropdown"
    @mousedown.prevent
  >
    <DropdownItem
      v-for="result in results"
      :key="getResultKey(result)"
      :formatted-text="formatDisplayText(result)"
      :is-active="isSelected(result)"
      :show-icon="isSelected(result)"
      @click="$emit('select', result)"
    />

    <DropdownItem
      v-if="allowCustom && searchQuery && !exactMatch"
      :formatted-text="`Add: <strong>${searchQuery}</strong>`"
      :is-custom="true"
      :show-icon="true"
      icon-name="add"
      @click="$emit('add-custom')"
    />

    <DropdownItem
      v-if="results.length === 0 && !allowCustom"
      formatted-text="<span class='no-results'>No results found</span>"
      :is-disabled="true"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import DropdownItem from "./DropdownItem.vue";

export default defineComponent({
  name: "SearchDropdown",
  components: {
    DropdownItem,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    results: {
      type: Array as PropType<any[]>,
      required: true,
    },
    searchQuery: {
      type: String,
      required: true,
    },
    allowCustom: {
      type: Boolean,
      default: false,
    },
    exactMatch: {
      type: Boolean,
      default: false,
    },
    selectedItems: {
      type: Array as PropType<any[]>,
      required: true,
    },
    textPath: {
      type: String,
      required: true,
    },
    valuePath: {
      type: String,
      default: null,
    },
  },
  emits: ["select", "add-custom"],
  setup(props) {
    const hasResults = computed(() => {
      if (!props.searchQuery) return false;
      return (
        props.results.length > 0 ||
        (props.allowCustom && props.searchQuery && !props.exactMatch)
      );
    });

    // Helper to get nested value from object using path
    function getNestedValue(obj: any, path: string): any {
      return path.split(".").reduce((current, key) => current?.[key], obj);
    }

    // Extract value and label from an item
    function extractValueAndLabel(item: any): { value: any; label: string } {
      if (typeof item === "string") {
        return { value: item, label: item };
      }

      const valuePath = props.valuePath || props.textPath;
      let value;
      if (valuePath) {
        value = getNestedValue(item, valuePath);
      }
      if (value === undefined) {
        value = item.value || item.id || item.name || item;
      }

      let label;
      if (props.textPath) {
        label = getNestedValue(item, props.textPath);
      }
      if (label === undefined) {
        label =
          item.name || item.title || item.label || item.text || String(value);
      }

      return { value, label: String(label) };
    }

    // Get unique key for result item
    function getResultKey(result: any): string | number {
      const valuePath = props.valuePath || props.textPath;
      const value = getNestedValue(result, valuePath);
      return value || Math.random();
    }

    // Check if item is already selected
    function isSelected(item: any): boolean {
      const itemObj = extractValueAndLabel(item);
      return props.selectedItems.some(
        (selected) => selected.value === itemObj.value
      );
    }

    // Get display value for an item
    function getDisplayValue(item: any): string {
      if (typeof item === "string") return item;
      if (!item) return "";

      const textValue = getNestedValue(item, props.textPath);
      if (textValue !== undefined) return String(textValue);

      return (
        item.name ||
        item.title ||
        item.label ||
        item.text ||
        item.id ||
        String(item)
      );
    }

    // Format display text for dropdown (highlight search)
    function formatDisplayText(result: any): string {
      const displayValue = getDisplayValue(result);
      if (!props.searchQuery) return displayValue;

      const regex = new RegExp(`(${props.searchQuery})`, "gi");
      return displayValue.replace(regex, "<strong>$1</strong>");
    }

    return {
      hasResults,
      getResultKey,
      isSelected,
      formatDisplayText,
    };
  },
});
</script>

<style scoped>
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  background-color: var(--theme--background);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.no-results {
  color: var(--theme--foreground-subdued);
}
</style>

