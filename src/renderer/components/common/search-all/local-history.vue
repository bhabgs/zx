<template>
  <div class="local-history-wrapper">
    <div class="local-history-top">
      <div class="local-history-top-left">历史搜索</div>
      <div class="local-history-top-right">
        <img
          src="@/assets/image/search/delete.png"
          alt=""
          @click="clearLocalHistory"
        />
        <img
          @click="hideLocalHistory"
          src="@/assets/image/search/hide.png"
          alt=""
        />
      </div>
    </div>
    <div class="local-history-bottom">
      <div
        class="local-history-item"
        v-for="item in showList"
        :key="item.id + '_' + item.type"
        @click="selectHandle(item)"
      >
        <user-photo
          :hasDefault="true"
          class="avatar-box"
          :user="item.id"
          v-if="item.type === 'contact'"
        ></user-photo>
        <user-photo
          :hasDefault="true"
          class="avatar-box"
          :user="getRobot(item)"
          v-if="item.type === 'robot'"
        ></user-photo>
        <group-photo
          :hasDefault="true"
          class="avatar-box"
          :group="item"
          v-if="item.type === 'group'"
        ></group-photo>
        <span class="local-history-value" v-if="item.type === 'robot'">{{
          getRobot(item).name
        }}</span>
        <span class="local-history-value" v-else>{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { MessageBox } from "element-ui";
export default {
  name: "LocalHistory",
  props: {
    showList: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  data() {
    return {};
  },
  mounted() {},

  watch: {},
  beforeDestroy() {},
  methods: {
    clearLocalHistory() {
      MessageBox.confirm("确认删除全部搜索历史？", "", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        customClass: "warningDialog",
        showClose: false,
        closeOnPressEscape: false,
        type: "warning"
      })
        .then(() => {
          this.$emit("clearLocal");
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },
    hideLocalHistory() {
      this.$emit("hideHistory");
    },
    selectHandle(item) {
      if (item.type === "robot") {
        this.$emit("selectHandle", {
          type: "robot",
          ...JSON.parse(item.value)
        });
      } else {
        this.$emit("selectHandle", item);
      }
    },
    getRobot(item) {
      const temp = JSON.parse(item.value);
      return {
        ...temp,
        avatar: temp.iconUrl
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.local-history-wrapper {
  padding: 0 12px;
  .local-history-top {
    display: flex;
    justify-content: space-between;
    height: 40px;
    align-items: center;
    .local-history-top-left {
      height: 12px;
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #8f959e;
    }
    .local-history-top-right {
      display: flex;
      align-items: center;
      img {
        cursor: pointer;
        width: 16px;
        height: 16px;
        margin-left: 8px;
      }
    }
  }
  .local-history-bottom {
    display: flex;
    flex-wrap: wrap;
    .local-history-item {
      max-width: 100%;
      overflow: hidden;
      height: 30px;
      padding: 0 8px;
      display: flex;
      align-items: center;
      background: #f4f6f8;
      cursor: pointer;
      margin: 0 8px 8px 0;
      border-radius: 15px;
      .avatar-box {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        flex: 0 0 22px;
        margin: 0 4px 0 0;
        ::v-deep .group-photo-item {
          img {
            vertical-align: top;
          }
        }
        ::v-deep > p {
          font-size: 10px;
        }
      }
      .local-history-value {
        flex: 1;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #1f2329;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
