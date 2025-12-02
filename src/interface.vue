<template>
  <div class="tags-interface">
    <div class="input-container">
      <SearchInput
        v-model="searchQuery"
        :placeholder="placeholder"
        :loading="loading"
        @enter="handleEnter"
        @focus="onFocus"
        @blur="onBlur"
      />

      <SearchDropdown
        :show="showDropdown"
        :results="searchResults"
        :search-query="searchQuery"
        :allow-custom="allowCustom"
        :exact-match="exactMatch"
        :selected-items="selectedItems"
        :text-path="textPath"
        :value-path="valuePath"
        @select="handleSelect"
        @add-custom="handleAddCustom"
      />
    </div>

    <TagList :items="selectedItems" @remove="removeTag" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onUnmounted } from "vue";
import SearchInput from "./components/SearchInput.vue";
import SearchDropdown from "./components/SearchDropdown.vue";
import TagList from "./components/TagList.vue";
import { useSearch } from "./composables/useSearch";
import { useTagSelection } from "./composables/useTagSelection";

export default defineComponent({
  components: {
    SearchInput,
    SearchDropdown,
    TagList,
  },
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
    const showDropdown = ref(false);

    // Use search composable
    const { searchResults, loading, handleSearch, cleanup } = useSearch({
      url: props.url,
      resultsPath: props.resultsPath,
      trigger: props.trigger,
      rate: props.rate,
    });

    // Use tag selection composable
    const { selectedItems, selectItem, addCustomTag, removeTag } =
      useTagSelection(
        {
          get value() {
            return props.value;
          },
          textPath: props.textPath,
          valuePath: props.valuePath,
        },
        emit
      );

    // Helper to get nested value from object using path
    function getNestedValue(obj: any, path: string): any {
      return path.split(".").reduce((current, key) => current?.[key], obj);
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

    // Check if search query exactly matches an existing result
    const exactMatch = computed(() => {
      return searchResults.value.some((result) => {
        const displayValue = getDisplayValue(result);
        return displayValue.toLowerCase() === searchQuery.value.toLowerCase();
      });
    });

    // Watch search query and trigger search
    watch(searchQuery, (newValue) => {
      if (newValue) {
        handleSearch(newValue);
      } else {
        searchResults.value = [];
      }
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

    // Handle item selection from dropdown
    function handleSelect(item: any) {
      selectItem(item);
      searchQuery.value = "";
      searchResults.value = [];
      showDropdown.value = false;
    }

    // Handle adding custom tag
    function handleAddCustom() {
      addCustomTag(searchQuery.value);
      searchQuery.value = "";
      searchResults.value = [];
      showDropdown.value = false;
    }

    // Handle enter key
    function handleEnter() {
      if (searchResults.value.length > 0) {
        handleSelect(searchResults.value[0]);
      } else if (props.allowCustom && searchQuery.value) {
        handleAddCustom();
      }
    }

    // Watch for results and show/hide dropdown
    watch(searchResults, (results) => {
      if (searchQuery.value && (results.length > 0 || props.allowCustom)) {
        showDropdown.value = true;
      }
    });

    onUnmounted(() => {
      cleanup();
    });

    return {
      searchQuery,
      searchResults,
      selectedItems,
      loading,
      showDropdown,
      exactMatch,
      handleSelect,
      handleAddCustom,
      removeTag,
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
</style>
