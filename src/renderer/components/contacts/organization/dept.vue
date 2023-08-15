<template>
  <!-- 集团结构 -->
  <div
    class="dept-block"
    :class="[
      showChildren && showChildren.length ? 'has-children' : '',
      `dept-block-${companyType}`
    ]"
  >
    <div
      class="dept-block-label"
      :class="showDept.isActive && !showGroup ? 'active-label' : ''"
      @click.stop.prevent="selectDept"
    >
      <img
        :src="
          require(`@/assets/image/contacts/dept_${companyType}${
            showDept.isActive && !showGroup ? '_active' : ''
          }.png`)
        "
        alt=""
      />
      <div :title="showDept.label">{{ showDept.label || showDept.name }}</div>
      <span>{{ showDept.num || showDept.userCnt }}人</span>
    </div>
    <div
      class="dept-block-content"
      :style="{ height: showDept.isExpand ? 'auto' : '0px' }"
    >
      <div
        class="dept-block-dept"
        v-for="child in showChildren"
        :key="child.id"
      >
        <dept-block
          v-if="child.type == 4"
          :showGroup="showGroup"
          :deptInfo="child"
        ></dept-block>
      </div>
    </div>
  </div>
</template>

<script>
import DeptBlock from "./dept";
export default {
  name: "DeptBlock",
  components: {
    DeptBlock
  },
  props: {
    deptInfo: {
      type: Object,
      default: () => {
        return {};
      }
    },
    showGroup: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {};
  },
  computed: {
    showDept() {
      return this.deptInfo;
    },
    showChildren() {
      let children = [];
      children = (this.showDept.children || []).filter(item => item.type == 4);
      return children;
    },
    companyType() {
      const key = sessionStorage.getItem("contacts-route-id") || "organization";
      return key;
    }
  },
  methods: {
    selectDept() {
      this.$root.$emit("selectActive", this.showDept);
    }
  }
};
</script>

<style lang="scss">
.dept-block {
  position: relative;
  &.has-children {
    border-bottom: 1px solid #f4f6f8;
  }
  .dept-block-label {
    padding: 0 16px;
    height: 32px;
    display: flex;
    align-items: center;
    font-size: 12px;
    font-family: SourceHanSansCN-Regular, SourceHanSansCN;
    font-weight: 400;
    color: #5d616b;
    cursor: pointer;
    overflow: hidden;
    img {
      width: 14px;
      height: 14px;
      margin-right: 8px;
      flex-shrink: 0;
      flex-shrink: 0;
    }
    > div {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    span {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 400;
      color: #8f959e;
    }
    &.active-label {
      color: #ffffff !important;
      * {
        color: #ffffff !important;
      }
    }
  }
  .dept-block-content {
    padding-left: 16px;
    transition: all 0.15s ease-in-out;
    overflow: hidden;
  }
  &.dept-block-organization {
    border-left: 1px solid rgba($color: #3e7eff, $alpha: 0.4);
    .dept-block-label {
      &.active-label {
        background: linear-gradient(
          90deg,
          rgba(62, 126, 255, 0.8) 0%,
          #3e7eff 100%
        );
      }
    }
  }
  &.dept-block-outsource {
    border-left: 1px solid rgba($color: #36d18e, $alpha: 0.4);
    .dept-block-label {
      &.active-label {
        background: linear-gradient(
          270deg,
          #36d18e 0%,
          rgba(54, 209, 142, 0.8) 100%
        );
      }
    }
  }
}
</style>
