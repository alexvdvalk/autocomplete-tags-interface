import { ref, watch, Ref } from "vue";

export interface TagItem {
  value: any;
  label: string;
}

export interface UseTagSelectionOptions {
  value: any;
  textPath: string;
  valuePath: string | null;
}

export function useTagSelection(options: UseTagSelectionOptions, emit: any) {
  const { textPath, valuePath } = options;
  
  const selectedItems = ref<TagItem[]>([]);

  // Helper to get nested value from object using path
  function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  // Parse value from JSON format
  function parseValue(value: any) {
    if (!value) {
      selectedItems.value = [];
      return;
    }

    if (Array.isArray(value)) {
      selectedItems.value = value;
    } else if (typeof value === "string") {
      // Try to parse JSON string
      try {
        const parsed = JSON.parse(value);
        selectedItems.value = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        selectedItems.value = [];
      }
    } else if (typeof value === "object") {
      selectedItems.value = [value];
    }
  }

  // Emit the value as JSON array
  function emitValue() {
    emit("input", selectedItems.value);
  }

  // Extract value and label from an item
  function extractValueAndLabel(item: any): TagItem {
    // For custom string tags
    if (typeof item === "string") {
      return { value: item, label: item };
    }

    // Extract value using valuePath
    const vPath = valuePath || textPath;
    let itemValue;
    if (vPath) {
      itemValue = getNestedValue(item, vPath);
    }
    if (itemValue === undefined) {
      itemValue = item.value || item.id || item.name || item;
    }

    // Extract label using textPath
    let label;
    if (textPath) {
      label = getNestedValue(item, textPath);
    }
    if (label === undefined) {
      label =
        item.name || item.title || item.label || item.text || String(itemValue);
    }

    return { value: itemValue, label: String(label) };
  }

  // Check if item is already selected
  function isSelected(item: any): boolean {
    const itemObj = extractValueAndLabel(item);
    return selectedItems.value.some(
      (selected) => selected.value === itemObj.value
    );
  }

  // Select an item
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
  }

  // Add a custom tag
  function addCustomTag(customValue: string) {
    if (!customValue.trim()) return;

    const trimmedValue = customValue.trim();
    selectedItems.value.push({ value: trimmedValue, label: trimmedValue });
    emitValue();
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

  // Watch for external value changes
  watch(
    () => options.value,
    (newValue) => {
      parseValue(newValue);
    }
  );

  // Initialize
  parseValue(options.value);

  return {
    selectedItems,
    selectItem,
    addCustomTag,
    removeTag,
    isSelected,
    extractValueAndLabel,
  };
}

