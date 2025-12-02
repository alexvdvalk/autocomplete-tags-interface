<template>
  <div v-if="items.length > 0" class="tags">
    <Tag
      v-for="(item, index) in items"
      :key="index"
      :display-value="getDisplayValue(item)"
      @remove="$emit('remove', index)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Tag from "./Tag.vue";

export default defineComponent({
  name: "TagList",
  components: {
    Tag,
  },
  props: {
    items: {
      type: Array as PropType<any[]>,
      required: true,
    },
  },
  emits: ["remove"],
  setup() {
    // Get display value for a selected tag
    function getDisplayValue(item: any): string {
      if (item && typeof item === "object" && "label" in item) {
        return item.label;
      }
      return String(item);
    }

    return {
      getDisplayValue,
    };
  },
});
</script>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>

