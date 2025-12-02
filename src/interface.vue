<template>
  <div class="tags-interface">
    <div class="input-container">
      <v-input
        v-model="searchQuery"
        :placeholder="placeholder || 'Type to search...'"
        @input="handleSearch"
        @keydown.enter.prevent="handleEnter"
        @focus="onFocus"
        @blur="onBlur"
      >
        <template v-if="loading" #append>
          <v-progress-circular indeterminate small />
        </template>
      </v-input>

      <div
        v-if="showDropdown && hasResults"
        class="dropdown"
        @mousedown.prevent
      >
        <div
          v-for="result in searchResults"
          :key="getResultKey(result)"
          class="dropdown-item"
          :class="{ active: isSelected(result) }"
          @click="selectItem(result)"
        >
          <span v-html="formatDisplayText(result)"></span>
          <v-icon
            v-if="isSelected(result)"
            name="check"
            small
            class="check-icon"
          />
        </div>

        <div
          v-if="allowCustom && searchQuery && !exactMatch"
          class="dropdown-item custom"
          @click="addCustomTag"
        >
          <span
            >Add: <strong>{{ searchQuery }}</strong></span
          >
          <v-icon name="add" small class="check-icon" />
        </div>

        <div
          v-if="searchResults.length === 0 && !allowCustom"
          class="dropdown-item disabled"
        >
          <span class="no-results">No results found</span>
        </div>
      </div>
    </div>

    <div v-if="selectedItems.length > 0" class="tags">
      <span
        v-for="(item, index) in selectedItems"
        :key="index"
        class="tag"
        @click="removeTag(index)"
      >
        {{ getTagDisplayValue(item) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from "vue";

export default defineComponent({
  props: {
    value: {
      type: [String, Array, Object],
      default: null,
    },
    url: {
      type: String,
      required: true,
    },
    resultsPath: {
      type: String,
      default: null,
    },
    textPath: {
      type: String,
      default: "name",
    },
    valuePath: {
      type: String,
      default: null,
    },
    trigger: {
      type: String,
      default: "debounce",
    },
    rate: {
      type: Number,
      default: 500,
    },
    placeholder: {
      type: String,
      default: "Type to search...",
    },
    iconLeft: {
      type: String,
      default: null,
    },
    iconRight: {
      type: String,
      default: null,
    },
    allowCustom: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["input"],
  setup(props, { emit }) {
    const searchQuery = ref("");
    const searchResults = ref<any[]>([]);
    const selectedItems = ref<any[]>([]);
    const loading = ref(false);
    const showDropdown = ref(false);
    let searchTimeout: NodeJS.Timeout | null = null;
    let lastSearchTime = 0;

    const hasResults = computed(() => {
      if (!searchQuery.value) return false;
      return (
        searchResults.value.length > 0 ||
        (props.allowCustom && searchQuery.value && !exactMatch.value)
      );
    });

    // Focus handler - show dropdown if we have a query
    function onFocus() {
      if (searchQuery.value) {
        showDropdown.value = true;
      }
    }

    // Blur handler with delay for click events
    function onBlur() {
      setTimeout(() => {
        showDropdown.value = false;
      }, 200);
    }

    // Parse the initial value
    onMounted(() => {
      parseValue();
    });

    // Watch for external value changes
    watch(
      () => props.value,
      () => {
        parseValue();
      }
    );

    // Parse value from JSON format
    function parseValue() {
      if (!props.value) {
        selectedItems.value = [];
        return;
      }

      if (Array.isArray(props.value)) {
        selectedItems.value = props.value;
      } else if (typeof props.value === "string") {
        // Try to parse JSON string
        try {
          const parsed = JSON.parse(props.value);
          selectedItems.value = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          selectedItems.value = [];
        }
      } else if (typeof props.value === "object") {
        selectedItems.value = [props.value];
      }
    }

    // Emit the value as JSON array
    function emitValue() {
      // selectedItems contains objects with value and label
      emit("input", selectedItems.value);
    }

    // Helper to get nested value from object using path
    function getNestedValue(obj: any, path: string): any {
      return path.split(".").reduce((current, key) => current?.[key], obj);
    }

    // Handle search with throttle or debounce
    function handleSearch() {
      if (!searchQuery.value || searchQuery.value.length < 1) {
        searchResults.value = [];
        return;
      }

      if (props.trigger === "throttle") {
        // Throttle: Execute immediately if enough time has passed
        const now = Date.now();
        if (now - lastSearchTime >= props.rate) {
          lastSearchTime = now;
          performSearch();
        } else {
          // Schedule for later if within rate limit
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }
          searchTimeout = setTimeout(() => {
            lastSearchTime = Date.now();
            performSearch();
          }, props.rate - (now - lastSearchTime));
        }
      } else {
        // Debounce: Wait for user to stop typing
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(async () => {
          await performSearch();
        }, props.rate);
      }
    }

    // Perform external API search
    async function performSearch() {
      if (!props.url || !searchQuery.value) {
        searchResults.value = [];
        showDropdown.value = false;
        return;
      }

      loading.value = true;
      try {
        // Replace {{value}} placeholder with search query
        const url = props.url.replace(
          /\{\{value\}\}/g,
          encodeURIComponent(searchQuery.value)
        );

        // Fetch from external API
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Extract results from response using resultsPath
        let results = data;
        if (props.resultsPath) {
          results = getNestedValue(data, props.resultsPath);
        }

        // Ensure results is an array
        if (!Array.isArray(results)) {
          console.error("API response is not an array:", results);
          searchResults.value = [];
          showDropdown.value = false;
          return;
        }

        searchResults.value = results;
        // Show dropdown if we have results or can add custom tags
        showDropdown.value = results.length > 0 || props.allowCustom;
      } catch (error) {
        console.error("API search error:", error);
        searchResults.value = [];
        showDropdown.value = false;
      } finally {
        loading.value = false;
      }
    }

    // Check if item is already selected
    function isSelected(item: any): boolean {
      const itemObj = extractValueAndLabel(item);
      return selectedItems.value.some(
        (selected) => selected.value === itemObj.value
      );
    }

    // Check if search query exactly matches an existing result
    const exactMatch = computed(() => {
      return searchResults.value.some((result) => {
        const displayValue = getDisplayValue(result);
        return displayValue.toLowerCase() === searchQuery.value.toLowerCase();
      });
    });

    // Select an item from search results
    function selectItem(item: any) {
      if (isSelected(item)) {
        // Deselect if already selected
        removeTagByValue(item);
      } else {
        // Extract and store object with value and label
        const tagObject = extractValueAndLabel(item);
        selectedItems.value.push(tagObject);
        emitValue();
      }
      searchQuery.value = "";
      searchResults.value = [];
      showDropdown.value = false;
    }

    // Extract value and label from an item
    function extractValueAndLabel(item: any): { value: any; label: string } {
      // For custom string tags
      if (typeof item === "string") {
        return { value: item, label: item };
      }

      // Extract value using valuePath
      const valuePath = props.valuePath || props.textPath;
      let value;
      if (valuePath) {
        value = getNestedValue(item, valuePath);
      }
      if (value === undefined) {
        value = item.value || item.id || item.name || item;
      }

      // Extract label using textPath
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

    // Add a custom tag
    function addCustomTag() {
      if (!searchQuery.value.trim()) return;

      const customValue = searchQuery.value.trim();
      selectedItems.value.push({ value: customValue, label: customValue });
      emitValue();
      searchQuery.value = "";
      searchResults.value = [];
      showDropdown.value = false;
    }

    // Handle enter key
    function handleEnter() {
      if (searchResults.value.length > 0) {
        selectItem(searchResults.value[0]);
      } else if (props.allowCustom && searchQuery.value) {
        addCustomTag();
      }
    }

    // Remove a tag by index
    function removeTag(index: number) {
      selectedItems.value.splice(index, 1);
      emitValue();
    }

    // Remove tag by value
    function removeTagByValue(item: any) {
      const itemObj = extractValueAndLabel(item);
      const index = selectedItems.value.findIndex(
        (selected) => selected.value === itemObj.value
      );
      if (index !== -1) {
        removeTag(index);
      }
    }

    // Get display value for an item (used for search results dropdown)
    function getDisplayValue(item: any): string {
      if (typeof item === "string") return item;
      if (!item) return "";

      // Use textPath to get display value from search result object
      const textValue = getNestedValue(item, props.textPath);
      if (textValue !== undefined) return String(textValue);

      // Fallback to common display fields
      return (
        item.name ||
        item.title ||
        item.label ||
        item.text ||
        item.id ||
        String(item)
      );
    }

    // Get display value for a selected tag (which is now an object with value and label)
    function getTagDisplayValue(item: any): string {
      if (item && typeof item === "object" && "label" in item) {
        return item.label;
      }
      // Fallback for backward compatibility
      return String(item);
    }

    // Format display text for dropdown (highlight search)
    function formatDisplayText(result: any): string {
      const displayValue = getDisplayValue(result);
      if (!searchQuery.value) return displayValue;

      const regex = new RegExp(`(${searchQuery.value})`, "gi");
      return displayValue.replace(regex, "<strong>$1</strong>");
    }

    onMounted(() => {
      parseValue();
    });

    onUnmounted(() => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    });

    return {
      searchQuery,
      searchResults,
      selectedItems,
      loading,
      showDropdown,
      hasResults,
      exactMatch,
      handleSearch,
      selectItem,
      addCustomTag,
      removeTag,
      isSelected,
      getDisplayValue,
      getTagDisplayValue,
      formatDisplayText,
      getResultKey,
      handleEnter,
      onFocus,
      onBlur,
    };
  },
});
</script>

<style scoped>
.tags-interface {
  position: relative;
}

.input-container {
  position: relative;
}

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

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  background-color: var(--theme--primary);
  color: var(--theme--primary-text);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--fast) var(--transition);
  transition-property: background-color, opacity;
  user-select: none;
}

.tag:hover {
  background-color: var(--theme--primary-accent);
}

.no-results {
  color: var(--theme--foreground-subdued);
}
</style>
