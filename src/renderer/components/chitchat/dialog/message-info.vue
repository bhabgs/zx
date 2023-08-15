<template>
  <article class="msg-info-box">
    <div class="msg-info">
      <span class="conversation-name">{{ info.message.name }}</span>
      <span
        v-if="AtMeMsgMap[`${info.conversationType}_${info.id}`]"
        class="at-user"
        >[有人@我]</span
      >
      <span
        v-if="
          info.message.messageState === MessageModel.MessageState.RECALL ||
          info.message.messageType === MessageType.ZXTipMessage
        "
        v-text="info.message.systemMessage"
      ></span>
      <template v-else>
        <span
          v-if="
            info.conversationType ===
              ConversationModel.IMConversationEnum.GROUP ||
            (info.conversationType ===
              ConversationModel.IMConversationEnum.GATHER &&
              info.children[0] &&
              info.children[0].conversationType ===
                ConversationModel.IMConversationEnum.GROUP)
          "
          >{{ getName(info.message) }}&nbsp;:&nbsp;</span
        >
        <span
          v-if="
            info.message.errorMessage !== undefined &&
            info.message.errorMessage !== null
          "
          >{{ info.message.errorMessage }}</span
        >
        <font v-else-if="info.message.messageType === MessageType.TextMessage">
          <template v-if="info.message.content.emoji">
            <template v-for="(row, index) of info.message.content.emojiContent">
              <span
                :key="index"
                v-if="row.type === 'txt'"
                v-text="row.content"
              ></span>
              <img :key="index" v-else :src="row.content" />
            </template>
          </template>
          <template v-else>{{ info.message.content.content }}</template>
        </font>
        <span
          v-else-if="
            [
              MessageType.ImageMessage,
              MessageType.ZXEncryptImgMsg,
              MessageType.ZXGIFMsg,
            ].includes(info.message.messageType)
          "
          >[图片]</span
        >
        <span
          v-else-if="
            [MessageType.VoiceMessage].includes(info.message.messageType)
          "
          >[语音]</span
        >
        <span
          v-else-if="
            [MessageType.FileMessage, MessageType.ZXEncryptFileMsg].includes(
              info.message.messageType
            )
          "
          >[文件]</span
        >
        <span
          v-else-if="
            [
              MessageType.ZXVideoMessage,
              MessageType.ZXEncryptVideoMsg,
            ].includes(info.message.messageType)
          "
          >[视频]</span
        >
        <span
          v-else-if="info.message.messageType === MessageType.LocationMessage"
          >[位置]</span
        >
        <span
          v-else-if="
            info.message.messageType === MessageModel.MessageType.ZXRichMessage
          "
          >[图文]</span
        >
        <span
          v-else-if="
            info.message.messageType === MessageModel.MessageType.ZXCombineMsg
          "
          >[聊天记录]</span
        >
        <span
          v-else-if="
            info.message.messageType === MessageModel.MessageType.ZXAppLinkMessage
          "
          >{{ info.message.content.linkTitle || info.message.content.linkOwner }}</span
        >
        <span
          v-else-if="
            info.message.messageType ===
            MessageModel.MessageType.ZXActionCardMsg
          "
        >
          {{
            info.message.content.title ||
            info.message.content.content ||
            "[收到一条新消息]"
          }}
        </span>
        <span v-else-if="info.message">[不支持的消息]</span>
      </template>
    </div>
  </article>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel } from "../../../WebIM";
import globalConfig from "@/global.config";

const robot = globalConfig.robot;
export default {
  name: "MessageInfo",
  props: {
    info: { type: Object, required: true },
    showGroupName: { type: Boolean, default: false },
  },
  data() {
    return {
      MessageModel,
      ConversationModel,
      IMConversationEnum: ConversationModel.IMConversationEnum,
      MessageType: MessageModel.MessageType,
    };
  },
  created() {},
  computed: {
    ...mapGetters({
      AtMsgMap: "GetAtMsgMap",
      GetCompany: "GetCompany",
      GetSenderName: "GetSenderName",
    }),
    AtMeMsgMap() {
      let result = {};
      for (const key in this.AtMsgMap) {
        const item = this.AtMsgMap[key];
        const atMe = (item || []).find(
          (item) => item.id === this.GetCompany.accountId
        );
        if (atMe && atMe.count) {
          result[key] = true;
        }
      }

      return result;
    },
  },
  methods: {
    getName(message) {
      let name = "";
      if (message) {
        name = this.GetSenderName(message, this.info);
      }

      return name;
    },
  },
};
</script>

<style lang="scss" scoped>
.msg-info-box {
  overflow: hidden;
  flex: 1;
  margin: {
    right: 10px;
  }
  .msg-info {
    width: 100%;
    height: 16px;
    align-items: flex-start;
    justify-content: flex-start;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: #999;
    font-size: 12px;

    *:not(img) {
      line-height: 16px;
    }

    img {
      width: 14px;
      flex-basis: 14px;
      height: 14px;
      flex-shrink: 0;
      vertical-align: middle;
    }
  }
}
</style>
