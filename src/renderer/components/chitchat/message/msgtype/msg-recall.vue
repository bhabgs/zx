<template>
  <div class="msg-txt">
    <span class="tip-txt">此消息已被撤回</span>
    <button v-if="showEditButton" @click="editMessage">重新编辑</button>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { MessageModel } from "../../../../WebIM";
export default {
  name: "MessageRecall",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number },
  },
  data() {
    return {
      MessageModel,
    };
  },
  computed: {
    showEditButton() {
      return (
        this.message.bySelf &&
        this.message.messageType === this.MessageModel.MessageType.TextMessage
      );
    },
  },
  methods: {
    editMessage() {
      let currentTime = Date.now();
      const serverTime = ipcRenderer.sendSync("get-server-time");
      if (serverTime) {
        currentTime = serverTime;
      }
      if (
        (this.message.recallTime &&
          currentTime - this.message.recallTime > 2 * 60 * 1000) ||
        (!this.message.recallTime &&
          currentTime - this.message.sentTime > 4 * 60 * 1000)
      ) {
        // 撤销超过2分钟不允许重新编辑
        // 其它客户端撤回消息时可能没有记录撤回时间，则以发送时间为准，
        // 发送超过4分钟（允许撤回时间2分钟+允许重新编辑时间2分钟）的无法重新编辑
        return this.$Message.error("已超过2分钟不可编辑");
      }
      this.$emit("edit-message", this.message);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";
.msg-txt {
  font-size: 13px;
  padding: 10px 15px;
  max-width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
  .tip-txt {
    color: #999;
  }
  button {
    color: $--default-theme-color;
    background-color: transparent;
    cursor: pointer;
  }
}
</style>
