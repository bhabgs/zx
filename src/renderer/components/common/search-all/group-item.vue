<!-- 全文检索群组展示项 -->
<template>
  <div class="search-group-item" @click.stop="selectGroup">
    <group-photo
      class="search-group-item-avatar"
      :hasDefault="true"
      :group="groupInfo"
    ></group-photo>
    <div class="search-group-item-right">
      <div class="search-group-item-right-top">
        <div class="search-group-item-right-top-name">
          <div class="group-name" v-html="showGroupName"></div>
          ({{ groupInfo.groupNumber }})
        </div>
        <div
          v-if="groupInfo.message"
          class="search-group-item-right-top-right"
          :class="{
            current: $myUtils.isCurrentDay(groupInfo.message.messageTime)
          }"
        >
          {{ $myUtils.formatDateFilter(groupInfo.message.messageTime * 1, 2) }}
        </div>
      </div>
      <div
        class="search-group-item-right-contain-people"
        v-if="!!showGroupMember"
      >
        包含：<span v-html="showGroupMember"></span>
      </div>
      <div class="search-group-msg-info-wrapper" v-if="groupInfo.message">
        <message-info
          :key="
            `${groupInfo.conversationType}_${groupInfo.id}_${groupInfo.message.messageTime}`
          "
          v-if="groupInfo.message"
          :info="groupInfo"
        ></message-info>
      </div>
    </div>
  </div>
</template>

<script>
import messageInfo from "@/components/chitchat/dialog/message-info";
export default {
  name: "SearchGroupItem",
  data() {
    return {};
  },
  props: {
    groupInfo: {
      type: Object,
      default: () => {
        return {};
      }
    },
    search: { type: String, default: "" }
  },
  components: {
    messageInfo
  },
  computed: {
    showGroupMember() {
      if (this.groupInfo.searchResult.type.includes("member")) {
        return this.groupInfo.searchResult.member;
      } else {
        return "";
      }
    },
    showGroupName() {
      if (this.groupInfo.searchResult.type.includes("name")) {
        return this.groupInfo.searchResult.name;
      } else {
        let name = this.groupInfo.name;
        return name;
      }
    }
  },
  watch: {},
  created() {},
  mounted() {},
  methods: {
    selectGroup() {
      this.$emit("selectHandle", {
        ...this.groupInfo,
        type: "group"
      });
    }
  }
};
</script>

<style scoped lang="scss">
.search-group-item {
  display: flex;
  padding-top: 16px;
  cursor: pointer;
  &:hover {
    background: #f0f5ff;
    border-radius: 4px;
  }
  .search-group-item-right {
    padding-right: 12px;
    flex: 1;
    overflow: hidden;
    padding-bottom: 13px;
    border-bottom: 1px solid #e7e7e7;
    &-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow: hidden;
      margin-bottom: 8px;
      &-name {
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #1f2329;
        flex: 1;
        overflow: hidden;
        display: flex;
        .group-name {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
      &-right {
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #c9cfd8;
        flex-shrink: 0;
        margin-left: 14px;
        &.current {
          color: #3e7eff;
        }
      }
    }
    &-contain-people {
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #5d616b;
      margin-bottom: 5px;
    }
    .search-group-msg-info-wrapper {
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #8f959e;
      overflow: hidden;
      text-overflow: ellipsis;
      line-clamp: 2;
    }
  }
}
</style>
