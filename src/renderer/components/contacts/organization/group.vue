<template>
  <!-- 集团结构 -->
  <div class="group-block">
    <div
      class="group-block-label"
      @click.stop.prevent="selectGroup"
      :class="showGroup.isExpand ? 'expand-label' : ''"
      :style="{
        paddingLeft: `${(showGroup.level + 1) * 16}px`,
        backgroundColor: showGroup.level > 0 ? '#F4F6F8' : '#E0E4E8'
      }"
    >
      <i class="el-icon-caret-bottom" v-show="showGroup.level > 0"></i>
      {{
        showGroup.label
      }}
      <span>
        （{{
          showGroup.num
        }}{{ showGroup.labelType == "2" ? "人" : "家" }}）
      </span>
    </div>
    <div class="group-block-content" :style="{ height: showGroup.isExpand ? 'auto' : '0px' }">
      <div class="organization-list-group" v-for="child in showGroup.children" :key="child.id">
        <group-block
          v-if="child.type < 3"
          :groupInfo="child"
          :showType="showType"
          :isShowGroup="isShowGroup"
          :contactType="contactType"
          :showArrow="showArrow"
        ></group-block>
        <company-block
          :showType="showType"
          v-if="child.type == 3"
          :companyInfo="child"
          :showGroup="isShowGroup"
          :contactType="contactType"
          :showArrow="showArrow"
        ></company-block>
      </div>
    </div>
  </div>
</template>

<script>
import GroupBlock from "./group";
import CompanyBlock from "./company";
export default {
  name: "GroupBlock",
  components: {
    GroupBlock,
    CompanyBlock
  },
  props: {
    groupInfo: {
      type: Object,
      default: () => {
        return {};
      }
    },
    showType: {
      type: String,
      default: "contact"
    },
    contactType: {
      type: String,
      default: "organization"
    },
    isShowGroup: {
      type: Boolean,
      default: false
    },
    showArrow: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {};
  },
  computed: {
    showGroup() {
      return this.groupInfo;
    }
  },
  methods: {
    selectGroup() {
      if (this.showGroup.level > 0) {
        this.$root.$emit("selectActive", this.showGroup);
      }
    }
  }
};
</script>

<style lang="scss">
.group-block {
  overflow: hidden;
  .group-block-label {
    height: 28px;
    background: #e0e4e8;
    opacity: 0.5;
    padding-left: 16px;
    font-size: 12px;
    font-family: SourceHanSansCN-Regular, SourceHanSansCN;
    font-weight: 400;
    color: #5c5d5f;
    display: flex;
    align-items: center;
    cursor: pointer;
    opacity: 0.5;
    i {
      transform: rotate(270deg);
      color: #5c5d5f;
    }
    &.expand-label {
      i {
        transform: rotate(0deg);
      }
    }
    span {
      font-size: 10px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #5c5d5f;
    }
  }
  .group-block-content {
  }
}
</style>
