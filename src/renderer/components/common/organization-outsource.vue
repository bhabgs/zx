<template>
  <div class="organization-outsourtce-header">
    <div class="nav-wrapper" :class="`active-${activeIndex}`">
      <button
        v-for="(btn, index) of showButtonList"
        :key="index"
        @click="goToPage(btn, index)"
        :class="{ 'active-btn': activeIndex === index }"
      >
        <img
          :src="
            require(`@/assets/outsource/${btn.icon}${activeIndex === index ? '_blue' : ''
              }.png`)
          "
          alt
        />
        <template v-if="isSelect">选择{{ btn.name }}人员</template>
        <template v-else>{{ btn.name }}</template>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "OrganizationOutsource",
  props: {
    active: {
      type: String | Number,
      default: 0
    },
    btnList: {
      type: Array,
      default: () => {
        return [];
      }
    },
    isSelect: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {};
  },
  computed: {
    activeIndex() {
      return this.active;
    },
    showButtonList() {
      return this.btnList;
    }
  },
  methods: {
    goToPage(config) {
      this.$emit("changeListType", config);
    }
  }
};
</script>
 
<style lang="scss">
.organization-outsourtce-header {
  .nav-wrapper {
    user-select: none;
    width: 100%;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid #e7e7e7;
    position: relative;
    &::after {
      content: "";
      width: 1px;
      height: 12px;
      position: absolute;
      background: #e7e7e7;
      top: 14px;
      left: 50%;
    }
    &.active-0 {
      .active-btn {
        color: #3e7eff;
      }
    }
    &.active-1 {
      .active-btn {
        color: #36d18e;
      }
    }
    > button {
      position: relative;
      background-color: transparent;
      width: 50%;
      height: 100%;
      font-size: 14px;
      color: #8f959e;
      text-align: center;
      transition: all 0.15s linear;
      position: relative;
      img {
        width: 16px;
        height: 16px;
      }
    }
  }
}
</style>
