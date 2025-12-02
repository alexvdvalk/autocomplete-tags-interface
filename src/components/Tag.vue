<template>
  <span
    class="tag"
    @click="$emit('remove')"
  >
    {{ displayValue }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Tag",
  props: {
    displayValue: {
      type: String,
      required: true,
    },
  },
  emits: ["remove"],
});
</script>

<style scoped>
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
</style>

