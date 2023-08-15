<template>
  <div :class="['check-row', { checked, disabled }]" @click="handleCheck">
    <!-- check icon -->
    <mask-icon
      v-if="multipleSelect"
      class="check-icon"
      v-bind="getIconProps(checkStatus)"
      size="16"
    />
    <img
      v-else
      class="check-single-icon"
      :src="require(`@/assets/image/chitchat/list-radio-${checked ? 'checked' : 'uncheck'}.png`)"
    />
    <!-- slot -->
    <div :class="['check-row-inner', { checked }]">
      <slot />
    </div>
    <!-- arrow icon -->
    <mask-icon
      v-if="$listeners.go"
      class="change-dept-icon"
      name="arrow"
      size="12"
      :color="checked ? '#EFF2F6' : '#D6DCE6'"
      @click.native="$emit('go', $event)"
    />
  </div>
</template>
<script>
import maskIcon from "../mask-icon.vue";

const iconPropsMap = {
  unchecked: {
    name: "unchecked",
    color: "#8F959E",
  },
  checked: {
    name: "checked",
  },
};
export default {
  components: { maskIcon },
  name: "CheckRow",
  props: {
    data: Object,
    checked: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否多选
    multipleSelect: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {};
  },
  computed: {
    checkStatus() {
      return this.checked ? "checked" : "unchecked";
    },
  },
  methods: {
    getIconProps(type) {
      return iconPropsMap[type];
    },
    handleCheck(e) {
      e.stopPropagation();
      if (this.disabled) return;
      this.$emit("checked", this.data, !this.checked);
    },
  },
};
</script>
<style lang="scss" scoped>
.check-row {
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  color: #5d616b;
  --color: var(--type-color);
  --disabled-check-color: #c9cfd8;
  .check-icon,
  .change-dept-icon,
  .check-row-inner {
    cursor: pointer;
  }
  .check-single-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 8px;
  }
  &.checked {
    .change-dept-icon {
      cursor: default;
    }
  }
  &.disabled {
    --color: var(--disabled-check-color);
    .check-icon {
      cursor: not-allowed;
    }
  }
  .check-row-inner {
    display: flex;
    flex: 1;
    align-items: center;
    user-select: none;
    &.checked {
      color: var(--type-color);
    }
  }
}
</style>
