<template>
  <section class="chitchat-container">
    <chat-box
      ref="chatBox"
      v-if="!IsNot"
      @transpoadHandle="transpondEventhubHandle"
    ></chat-box>
    <not-select-chat v-if="IsNot"></not-select-chat>
    <!-- 消息转发 -->
    <a-modal
      v-model="visibleSelect"
      @cancel="cancelHandle"
      wrapClassName="transpond-modal"
      :maskClosable="false"
      :closable="true"
      :footer="null"
      width="690"
      destroyOnClose
    >
      <transmit-message
        ref="transmitMessage"
        :message="transpondMsg"
        @close="closeTransmit"
      ></transmit-message>
    </a-modal>
    <!-- 消息转发 end -->
  </section>
</template>

<script>
import ChatBox from "@/components/chitchat/chat-box";
import { mapGetters } from "vuex";
import { ipcRenderer } from "electron";

import TransmitMessage from "@/components/chitchat/transmit-message"; // 消息转发
import { MessageModel, ConversationModel } from "../../WebIM";
export default {
  name: "Chitchat",
  components: {
    ChatBox,
    TransmitMessage,
  },
  data() {
    return {
      visibleSelect: false,
      transpondMsg: {},
    };
  },
  mounted() {
    ipcRenderer.on("transpond", this.transpoadHandle);
    ipcRenderer.on("sendEditImage", this.sendEditImageHandle);
    window.eventHub.$on("transpond", this.transpondEventhubHandle);
  },
  watch: {},
  beforeDestroy() {
    ipcRenderer.off("transpond", this.transpoadHandle);
    ipcRenderer.off("sendEditImage", this.sendEditImageHandle);
    window.eventHub.$off("transpond", this.transpondEventhubHandle);
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      dialogType: "GetChitchatType",
      GetSendUser: "GetSendUser",
    }),
    IsNot() {
      let flag = true;
      if (this.OpenDialog.id) {
        flag = false;
        if (this.dialogType === "organization") {
          if (this.OpenDialog.groupType >= 10) {
            flag = true;
          }
        } else {
          if (this.OpenDialog.groupType < 10) {
            flag = true;
          }
        }
      }
      return flag;
    },
  },
  methods: {
    closeTransmit(isScuccess) {
      this.visibleSelect = false;
      if (isScuccess) {
        if (this.$refs.chatBox && this.$refs.chatBox.quitMultSelect) {
          this.$refs.chatBox.quitMultSelect();
        } // 转发成功退出多选状态
      }
    },
    cancelHandle() {
      this.$refs.transmitMessage && this.$refs.transmitMessage.cancelHandle();
    },
    transpondEventhubHandle(transpondData) {
      this.transpoadHandle(null, { transpondData });
    },
    transpoadHandle(e, { transpondData: msg }) {
      ipcRenderer.send("get-focus");
      if (this.visibleSelect) {
        return;
      }
      this.transpondMsg = msg;
      this.visibleSelect = true;
    },
    sendEditImageHandle(e, { transpondData: msg }) {
      ipcRenderer.send("get-focus");
      if (msg.messageType) {
        const { messageType, content, isEdit } = msg;
        const { GetSendUser, disposeTranspondContent } = this;
        if (content.extra && content.extra["pc-sign-uuid"]) {
          this.$delete(content.extra, "pc-sign-uuid");
        }
        let data = {};
        if (isEdit) {
          data = { ...msg };
        } else {
          data = { ...content };
        }
        const source = disposeTranspondContent(data, messageType);
        const senderUserId = GetSendUser.id;
        const conversationType = msg.conversationType;
        const sendBody = {
          conversationType,
          targetId: msg.messageId,
          senderUserId,
          source,
          messageType,
        };
        // 发送消息
        this.$service
          .DistributeSendMessage({ ...sendBody })
          .catch((e) => console.error(e));
      }
    },
    /**
     * 处理转发消息，生成对应消息体
     */
    disposeTranspondContent(source, messageType) {
      let content = {};
      switch (messageType) {
        case MessageModel.MessageType.TextMessage:
          content = {
            content: source.content,
            extra: source.extra,
            messageName: source.messageName,
          };
          break;
        case MessageModel.MessageType.ImageMessage:
          if (source.isEdit) {
            const {
              base64,
              buffer,
              path,
              name,
              size,
              type,
              isLocal,
              showOssUrl,
              showUrl,
            } = source;
            content = {
              base64,
              buffer,
              path,
              name,
              size,
              type,
              isLocal,
              content: showUrl,
              imgUri: showOssUrl,
            };
          } else {
            content = source;
          }
          break;

        default:
          content = source;
          break;
      }

      return content;
    },
  },
};
</script>

<style lang="scss" scoped>
.chitchat-container {
  height: 100%;
  width: 100%;
}
.transpond-modal {
  display: flex;
  align-content: center;
  justify-content: center;
  .ant-modal {
    width: auto !important;
    max-width: none;
    position: static;
    margin: 0;
    padding: 0;
  }
  .ant-modal-content {
    overflow: hidden;
  }
  .ant-modal-body {
    padding: 0 !important;
  }
}
</style>
