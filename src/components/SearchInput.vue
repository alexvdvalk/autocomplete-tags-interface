<template>
  <v-input
    :model-value="modelValue"
    :placeholder="placeholder || 'Type to search...'"
    @update:model-value="$emit('update:modelValue', $event)"
    @keydown.enter.prevent="$emit('enter')"
    @focus="$emit('focus')"
    @blur="$emit('blur')"
  >
    <template v-if="loading" #append>
      <v-progress-circular indeterminate small />
    </template>
  </v-input>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SearchInput",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      default: "Type to search...",
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "enter", "focus", "blur"],
});
</script>
