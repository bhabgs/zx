<template>
  <div class="search-record-item" @click.stop="showMessageHandle">
    <div class="search-record-item-inner">
      <user-photo
        v-if="record.dialogueType === 'PRIVATE' || !record.dialogueType"
        :hasDefault="true"
        class="search-record-item-avatar"
        :user="avatarInfo.accountId"
      ></user-photo>
      <group-photo
        class="search-record-item-avatar"
        :group="avatarInfo"
        :hasDefault="true"
        v-else
      ></group-photo>
      <div class="search-record-item-right">
        <div class="search-record-item-right-info">
          <div
            class="search-record-item-right-info-name"
            v-html="record.dialogueName || record.userName"
          ></div>
          <div
            class="search-record-item-right-info-time"
            :class="{
              current: $myUtils.isCurrentDay(
                (record.dialogueTime || record.time) * 1
              )
            }"
          >
            {{ dialogueTime }}
          </div>
        </div>
        <div
          class="search-record-item-right-content"
          v-html="record.lastMessage || record.content"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SearchRecordItem",
  data() {
    return {};
  },
  props: {
    record: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  components: {},
  computed: {
    avatarInfo() {
      return {
        accountId: this.record.dialogueId || this.record.accountId,
        id: this.record.dialogueId
      };
    },
    dialogueTime() {
      const time = this.record.dialogueTime || this.record.time;
      if (time) {
        return this.$myUtils.formatDateFilter(time * 1, 2);
      } else {
        return "";
      }
    }
  },
  watch: {},
  created() {},
  mounted() {},
  methods: {
    showMessageHandle() {
      this.$emit("showMessage", this.record);
    }
  }
};
</script>

<style scoped lang="scss">
.search-record-item {
  height: 72px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  .search-record-item-inner {
    padding: 0 8px;
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    &:hover {
      background: #f0f5ff;
      border-radius: 4px;
    }
  }
  &::after {
    content: "";
    width: calc(100% - 56px);
    height: 1px;
    position: absolute;
    bottom: 0;
    right: 0;
    background: #e7e7e7;
  }
  * {
    line-height: 1;
  }
  .search-record-item-avatar {
    margin-right: 8px;
    margin-left: 0;
  }
  .search-record-item-right {
    flex: 1;
    overflow: hidden;
    height: 100%;
    justify-content: center;
    display: flex;
    flex-direction: column;
    &-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      .search-record-item-right-info-name {
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #1f2329;
      }
      .search-record-item-right-info-time {
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #c9cfd8;
        &.current {
          color: #3e7eff;
        }
      }
    }
    &-content {
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #5d616b;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>
