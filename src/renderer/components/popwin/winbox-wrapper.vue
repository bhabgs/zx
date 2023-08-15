<template>
  <div ref="wrapper" class="body-wrapper" @click="handleBodyClick">
    <span class="icon-forward" @click="handleForward" ref="forwardIcon"></span>
    <div v-if="rect" class="inner-header-line">
      <mask-icon
        @click.native="() => winbox.close()"
        name="arrow"
        class="back-icon"
        :rotate="180"
        size="14"
        color="#8F959E"
      />
      <div class="forward-title">
        <template v-if="conversationType === 1">
          <b>{{ nameList[0] }}</b> 和 <b>{{ nameList[1] }}</b> 的聊天记录
        </template>
        <template v-else>
          群 <b>{{ nameList[0] }}</b> 的聊天记录
        </template>
      </div>
    </div>
    <div class="list-wrapper">
      <!-- <div>合并<el-switch v-model="allFromMe" />逐条</div> -->
      <el-divider class="divider" v-if="!allFromMe">
        {{ dayRange }}
      </el-divider>
      <ul class="message-list" id="scroll-body">
        <li
          class="message-item"
          :class="{ 'message-item-hide': item.hideTimeAndPhoto }"
          v-for="(item, index) in msgList"
          :id="item.sentTime"
          :key="`${item.messageId}-${index}`"
        >
          <!-- <div v-if="index === 0 || !isSameDay(item, msgList[index - 1])">
            ----------
          </div> -->
          <p class="system-message" v-if="item.errorMessage !== undefined">
            <span>{{ item.errorMessage }}</span>
          </p>
          <!-- 通知、广播 -->
          <p
            class="system-message"
            v-if="item.messageType === MessageModel.MessageType.ZXTipMessage"
          >
            <span>{{ item.systemMessage }}</span>
          </p>
          <!-- 聊天信息 -->
          <div
            class="preson-message"
            v-else
            :class="{ 'message-item-self': allFromMe }"
          >
            <user-photo
              class="user-sign"
              :class="{ 'user-sign-hide': item.hideTimeAndPhoto }"
              :user="item.content.user"
              v-if="
                item.content.user &&
                (item.content.user.id || '').includes('robot_')
              "
              @click.native="showRobotInfoHandle(item.content.user)"
            ></user-photo>
            <user-photo
              class="user-sign"
              :class="{ 'user-sign-hide': item.hideTimeAndPhoto }"
              :user="item.senderUserId"
              :hasInfo="true"
              v-else
            ></user-photo>
            <div
              class="message-wrapper"
              :class="{ 'message-wrapper-self': allFromMe }"
            >
              <p
                class="message-time"
                :class="{
                  'msg-time-self': allFromMe,
                  'msg-time-hide': item.hideTimeAndPhoto,
                }"
              >
                <span class="from-name only-line" v-if="!allFromMe">{{
                  parseName(item)
                }}</span>
                <span
                  class="time"
                  :class="{ current: $myUtils.isCurrentDay(item.sentTime) }"
                  >{{ $myUtils.formatDateFilter(item.sentTime, 1) }}</span
                >
              </p>
              <div :style="{ display: 'flex' }">
                <!-- msg-box-no-boeder：单个表情无会话气泡 -->
                <div
                  class="msg-box"
                  :class="{
                    'msg-box-no-boeder':
                      item.messageState !== MessageModel.MessageState.RECALL &&
                      item.messageType ===
                        MessageModel.MessageType.TextMessage &&
                      item.content.emojiContent &&
                      item.content.emojiContent.length === 2 &&
                      item.content.emojiContent[0].type == 'txt' &&
                      item.content.emojiContent[0].content == '' &&
                      item.content.emojiContent[1].type == 'emoji',
                    'msg-box-no-boeder-hide': item.hideTimeAndPhoto,
                  }"
                  @contextmenu.prevent.stop="
                    msgContextMenu($event, { item, index })
                  "
                >
                  <msg-recall
                    v-if="
                      item.messageState === MessageModel.MessageState.RECALL
                    "
                    :message="item"
                    :index="index"
                    @edit-message="recallThenEdit"
                  ></msg-recall>
                  <msg-file
                    v-else-if="
                      [
                        MessageModel.MessageType.FileMessage,
                        MessageModel.MessageType.ZXEncryptFileMsg,
                      ].includes(item.messageType) || item.imgIsTiff
                    "
                    :message="item"
                    :index="index"
                    :isLoading="false"
                    @download="downloadHandle"
                  ></msg-file>
                  <msg-txt
                    v-else-if="
                      item.messageType === MessageModel.MessageType.TextMessage
                    "
                    :message="item"
                    :index="index"
                  ></msg-txt>
                  <msg-img
                    v-else-if="
                      [
                        MessageModel.MessageType.ImageMessage,
                        MessageModel.MessageType.ZXEncryptImgMsg,
                        MessageModel.MessageType.ZXGIFMsg,
                      ].includes(item.messageType) && !item.imgIsTiff
                    "
                    :message="item"
                    :index="index"
                    @showimg="showFullScreenImg"
                  ></msg-img>
                  <msg-audio
                    v-else-if="
                      item.messageType === MessageModel.MessageType.VoiceMessage
                    "
                    :message="item"
                    :index="index"
                  ></msg-audio>
                  <msg-video
                    v-else-if="
                      [
                        MessageModel.MessageType.ZXVideoMessage,
                        MessageModel.MessageType.ZXEncryptVideoMsg,
                      ].includes(item.messageType)
                    "
                    :message="item"
                    :index="index"
                  ></msg-video>
                  <msg-location
                    v-else-if="
                      item.messageType ===
                      MessageModel.MessageType.LocationMessage
                    "
                    :message="item"
                    :index="index"
                  ></msg-location>
                  <!-- <msg-rich
                    v-else-if="
                      item.messageType === MessageModel.MessageType.ZXRichMessage
                    "
                    :message="item"
                    :index="index"
                    @showimg="showFullScreenImg"
                  ></msg-rich>-->
                  <msg-actioncard
                    v-else-if="
                      item.messageType ===
                      MessageModel.MessageType.ZXActionCardMsg
                    "
                    :message="item"
                    :index="index"
                  ></msg-actioncard>
                  <msg-combine
                    v-else-if="
                      item.messageType === MessageModel.MessageType.ZXCombineMsg
                    "
                    :message="item"
                    :index="index"
                  ></msg-combine>
                  <msg-applink
                    v-else-if="item.messageType === MessageModel.MessageType.ZXAppLinkMessage"
                    :message="item"
                    :index="index"
                  />
                  <msg-unknown v-else></msg-unknown>
                </div>
              </div>
            </div>
          </div>
          <p
            class="group-file"
            :class="{ 'group-file-self': allFromMe }"
            v-if="
              !item.systemMessage &&
              item.conversationType ===
                ConversationModel.IMConversationEnum.GROUP &&
              [
                MessageModel.MessageType.FileMessage,
                MessageModel.MessageType.ZXEncryptFileMsg,
              ].includes(item.messageType)
            "
          >
            群文件
          </p>

          <el-divider class="space" v-if="!allFromMe"></el-divider>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import { mapGetters } from "vuex";
import WinBox from "winbox/src/js/winbox";
import "winbox/src/css/winbox.css";
import MessageTemplate from "@/components/chitchat/message/msgtype";

import { MessageModel, ConversationModel, IMSDKServer } from "../../WebIM";
import FileManage from "../../plugin/file-manage";
import { getHashUrl } from "../../../modules/utils";
import moment from "moment";

export default {
  components: { ...MessageTemplate },
  props: [
    "conversationType",
    "nameList",
    "rect",
    "remoteUrl",
    "messageList",
    "zIndex",
    "origin",
  ],
  data() {
    return {
      ConversationModel,
      msgList: [],
      MessageModel,
      // allFromMe: false,
    };
  },
  computed: {
    ...mapGetters({
      userInfo: "GetUser",
      OpenDialog: "GetOpenDialog",
      Messages: "GetMessages",
      AllUserMap: "GetAllUserMap",
      senderInfo: "GetSendUser",
      MainWinVisible: "GetMainWinVisible",
      NoMoreMsg: "GetNoMoreMsg",
      GetIsGetHistoryStatus: "GetIsGetHistoryStatus",
      GetSenderName: "GetSenderName",
      dialogType: "GetChitchatType",
      contentTime: "GetsearchContentTime",
    }),
    cacheKey() {
      return this.rect ? `${this.remoteUrl}-inner` : this.remoteUrl;
    },
    allFromMe() {
      return !!this.messageList;
    },
    dayRange() {
      if (this.msgList.length === 0) return "";
      const firstDayStr = moment(this.msgList[0].sentTime).format("YYYY/MM/DD");
      const lastDayStr = moment(
        this.msgList[this.msgList.length - 1].sentTime
      ).format("YYYY/MM/DD");
      return firstDayStr === lastDayStr
        ? firstDayStr
        : `${firstDayStr} - ${lastDayStr}`;
    },
  },
  watch: {
    "$route.name"(newRoute, oldRoute) {
      console.log("$route.name", newRoute);
      if (newRoute === "chitchat") {
        // this.winbox.dom.style.display = "block";
        this.winbox.show();
      } else if (newRoute === "login") {
        this.winbox.close();
      } else {
        // this.winbox.dom.style.display = "none";
        this.winbox.hide();
      }
    },
    allFromMe() {
      this.formatMsgList();
    },
  },
  async mounted() {
    console.log("winbox-wrapper mounted", this);
    if (this.remoteUrl && this._winboxMap[this.cacheKey]) {
      const targetBox = this._winboxMap[this.cacheKey];
      setTimeout(() => {
        targetBox.dom.style.display = "";
        targetBox.minimize(false).show().focus();
      }, 100);
      this.$destroy();
      return;
    }
    if (this.messageList) {
      this.originList = this.messageList;
    } else {
      let data;
      data = await ipcRenderer.invoke("get-combine-msg-data", {
        url: this.remoteUrl,
      });
      if (!data) {
        await FileManage.saveCombineFile(this.remoteUrl);
        data = await ipcRenderer.invoke("get-combine-msg-data", {
          url: this.remoteUrl,
        });
      }
      this.originList = data;
    }
    this.formatMsgList();

    let title;
    if (this.conversationType === 1) {
      title = `<b>${this.nameList[0]}</b> 和 <b>${this.nameList[1]}</b> 的聊天记录`;
    } else {
      title = `群 <b>${this.nameList[0]}</b> 的聊天记录`;
    }
    const div = document.createElement("div");
    div.innerHTML = title;
    this.winbox = new WinBox(div.textContent, {
      mount: this.$el,
      class: ["winbox-wrapper", "no-full"],
      index: this.zIndex,
      ...(this.rect
        ? {
            x: this.rect.x,
            y: this.rect.y,
            width: this.rect.width,
            height: this.rect.height,
          }
        : {
            width: 500,
            height: (window.innerHeight * 5) / 6,
            x: window.outerWidth / 2 - 200,
            y: 56,
            top: 48,
            bottom: 0,
            left: 60,
            right: 0,
          }),
      onfocus: function () {
        console.log("onfocus");
        // this.setBackground("#3e7eff");
      },
      onblur: function () {
        console.log("onblur");
        // this.setBackground("#ccc");
      },
      onclose: () => {
        this.$destroy();
      },
    });
    const minIcon = this.winbox.dom.querySelector(".wb-min");
    minIcon.insertAdjacentElement("afterend", this.$refs.forwardIcon);
    // 有转发窗口，不显示转发按钮
    const transpondModalList = Array.from(
      document.querySelectorAll(".transpond-modal")
    );
    if (
      transpondModalList.find(
        (dom) => window.getComputedStyle(dom).display !== "none"
      )
    ) {
      this.$refs.forwardIcon.style.display = "none";
    }
    const titleEl = this.winbox.dom.querySelector(".wb-title");
    titleEl.innerHTML = title;
    console.log("winbox", this.winbox);
    this._winboxMap[this.cacheKey] = this.winbox;
    if (this.rect) {
      this.winbox
        .addClass("no-move")
        .addClass("no-resize")
        .addClass("hide-header");
    }
    window.addEventListener("resize", this.resizeHandler);
    window.eventHub.$on("hide-all-winbox", this.hideMe);
    window.eventHub.$on("resume-all-winbox", this.resumeMe);
  },
  beforeDestroy() {
    console.log("winbox-wrapper beforeDestroy");
    window.removeEventListener("resize", this.resizeHandler);
    window.eventHub.$off("hide-all-winbox", this.hideMe);
    window.eventHub.$off("resume-all-winbox", this.resumeMe);
    // this.winbox.close();
  },
  destroyed() {
    console.log("winbox-wrapper destroyed");
    if (this.remoteUrl && this.winbox) {
      delete this._winboxMap[this.cacheKey];
    }
  },

  methods: {
    handleBodyClick(e) {
      if (this.rect) e.stopPropagation();
    },
    handleForward() {
      window.eventHub.$emit("transpond", this.origin);
    },
    hideMe() {
      this.$refs.forwardIcon.style.display = "none";
      this.winbox.dom.style.display = "none";
    },
    resumeMe() {
      this.$refs.forwardIcon.style.display = "";
      this.winbox.dom.style.display = "";
    },
    resizeHandler() {
      if (this.rect) {
        this.winbox.close();
        return;
      }
      this.winbox.maximize(false);
      const { left, top, right, bottom, width, height } =
        this.winbox.dom.getBoundingClientRect();
      if (this.winbox.min || (bottom === 0 && right === 0)) {
        // 不可见状态
        return;
      }
      this.winbox.resize(500, (window.innerHeight * 5) / 6);
      this.winbox.move(window.outerWidth / 2 - 200, 56);
    },
    isSameDay({ sentTime: time1 }, { sentTime: time2 }) {
      const day1 = new Date(time1);
      const day2 = new Date(time2);
      return (
        day1.getFullYear() === day2.getFullYear() &&
        day1.getMonth() === day2.getMonth() &&
        day1.getDate() === day2.getDate()
      );
    },
    parseName(message) {
      let name = "";
      if (message) {
        name = this.GetSenderName(message, this.OpenDialog);
      }
      return name;
    },
    formatMsgList() {
      const typeMap = {
        "RC:TxtMsg": "TextMessage",
        "RC:VcMsg": "VoiceMessage",
        "RC:ImgMsg": "ImageMessage",
        "RC:FileMsg": "FileMessage",
        "ZX:EncryptFileMsg": "ZXEncryptFileMsg",
        "RC:LBSMsg": "LocationMessage",
        "ZX:CombineMsg": "ZXCombineMsg",
        "ZX:VideoMsg": "ZXVideoMessage",
        "ZX:AppLinkMsg": "ZXAppLinkMessage"
      };
      console.log("origin list:", this.originList);
      const nowTime = +new Date();
      const list = this.originList.map((item) => ({
        ...item,
        messageType: item.messageType || typeMap[item.objectName],
        ...(this.allFromMe && {
          senderUserId: this.userInfo.id,
          messageTime: nowTime,
          sentTime: nowTime,
        }),
      }));
      this.msgList = list.map((item, index) => {
        let hideTimeAndPhoto = false;
        if (
          index !== 0 &&
          list[index - 1].messageType !==
            MessageModel.MessageType.ZXTipMessage &&
          item.senderUserId === list[index - 1].senderUserId &&
          item.messageTime &&
          list[index - 1].messageTime &&
          item.messageTime - list[index - 1].messageTime <= 30 * 1000
        ) {
          hideTimeAndPhoto = true;
        }
        let imgIsTiff = false;
        if (
          [
            MessageModel.MessageType.ImageMessage,
            MessageModel.MessageType.ZXEncryptImgMsg,
            MessageModel.MessageType.ZXGIFMsg,
          ].includes(item.messageType)
        ) {
          if (item.content && item.content.type) {
            imgIsTiff = ["tiff", "tif"].includes(
              item.content.type.toLocaleLowerCase()
            );
          } else {
            if (item.content && item.content.imageUri) {
              imgIsTiff =
                item.content.imageUri.toLocaleLowerCase().includes("tif") ||
                item.content.imageUri.toLocaleLowerCase().includes("tiff");
            }
          }
        }
        return {
          ...item,
          imgIsTiff,
          hideTimeAndPhoto,
        };
      });
    },
    async downloadHandle(message, cb) {
      // 下载
      let self = this;
      const fileName =
        message.content.name || this.$moment().format("YYYYMMDDHHmmss");
      let url = message.content.imageUri || message.content.fileUrl;
      const type_source = url || fileName;
      const type = type_source.substr(type_source.lastIndexOf(".") + 1);
      const isEncrypt = [
        MessageModel.MessageType.ZXEncryptFileMsg,
        MessageModel.MessageType.ZXEncryptImgMsg,
        MessageModel.MessageType.ZXEncryptVideoMsg,
      ].includes(message.messageType);

      const result = await FileManage.downloadFile({
        url,
        name: fileName,
        isEncrypt,
        sign: true,
      });
      const key = getHashUrl(url);
      ipcRenderer
        .invoke("db-save-data", {
          db: "fileDown",
          data: { key, value: result.filePath },
        })
        .finally(() => {
          cb && cb(key, result.filePath);
        });
    },
    close() {
      this.winbox.close();
    },
    showFullScreenImg(currentMsg) {
      // 查看大图
      let index = 0;
      let ImgMsgs = [];
      for (let i = 0; i < this.msgList.length; i++) {
        const msg = this.msgList[i];
        const msgTypes = [
          this.MessageModel.MessageType.ImageMessage,
          this.MessageModel.MessageType.ZXRichMessage,
          this.MessageModel.MessageType.ZXEncryptImgMsg,
          this.MessageModel.MessageType.ZXGIFMsg,
        ];
        const messageType = msg.messageType;
        if (msgTypes.includes(messageType)) {
          let isEncrypt =
            messageType === this.MessageModel.MessageType.ZXEncryptImgMsg;
          let senderUserInfo = this.AllUserMap[msg.senderUserId];
          let user = senderUserInfo || msg.content.user || {};
          const transpondData = {
            messageType,
            content: msg.content,
            messageId: this.OpenDialog.id,
            conversationType: this.OpenDialog.conversationType,
          };
          const tempData = {
            messageType,
            isEncrypt,
            avatar: user.avatar || user.portraitUri,
            title: user.name + "分享的图片",
            groupTitle: `来自：${this.OpenDialog.name}`,
            time: msg.messageTime,
            isPub: false,
            thumb: msg.content.content || msg.content.thumbnailImage,
            url: msg.content.imageUri || msg.content.url,
            transpondData,
          };
          if (msg.sentStatus === MessageModel.SendStatus.SENDING) {
            // 消息发送中
            tempData.path = msg.content.path;
            tempData.local = true;
          }
          ImgMsgs.push(tempData);
          if (msg.messageId == currentMsg.messageId) {
            index = ImgMsgs.length - 1;
          }
        }
      }
      ipcRenderer.invoke("show-media", {
        operate: ["transpond"],
        type: "image",
        index,
        list: ImgMsgs,
      });
    },
  },
};
</script>
<style lang="scss">
.winbox-wrapper {
  min-width: 300px;
  min-height: 48px !important;
  background: #f3f4f5;
  box-shadow: 0px 0px 22px 0px rgba(0, 0, 0, 0.1);
  .wb-header {
    height: 48px;
  }
  .wb-min {
    background-position: center bottom 16px;
  }
  .wb-title {
    color: #1f2329;
    height: 48px;
    line-height: 48px;
    padding-left: 16px;
  }
  .body-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    .inner-header-line {
      display: flex;
      gap: 4px;
      padding: 16px;
      align-items: center;
      .back-icon {
        cursor: pointer;
      }
      .forward-title {
        flex: 1;
        font-size: 12px;
      }
    }
    .list-wrapper {
      flex: 1;
      overflow: auto;
    }
  }
  .wb-icon {
    // height: 48px;
    position: relative;
    right: 8px;
    top: 7px;
    filter: invert(0.5);
  }
  .msg-file {
    background: #fff;
  }
  .el-divider {
    margin: 16px 16px 24px;
    width: auto;
    background-color: #e0e4e8;
    white-space: nowrap;
    &.space {
      // margin-left: 50px;
      // margin-right: 0;
      margin: 12px 0 0 50px;
    }
    .el-divider__text {
      background: #f6f9ff;
      color: #8f959e;
      padding: 0 16px;
      font-size: 12px;
    }
  }
  .icon-forward {
    background-image: url(~@/assets/image/forward.svg);
    background-size: 24px auto;
  }
  .wb-body {
    background: #f6f9ff;
    top: 48px;
  }
  // &.focus {
  //   background: #3e7eff;
  // }
  .wb-max {
    display: none;
  }
  &.min {
    // background: #ccc !important;
    .wb-max,
    .icon-forward {
      display: none;
    }
  }
  &.hide-header {
    .wb-header {
      display: none;
    }
    .wb-body {
      top: 0;
    }
  }
}
</style>
<style lang="scss" scoped>
.wrapper {
  // min-width: 300px;
}
</style>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

$--message-margin: 0;

.message-list {
  // 消息列表
  padding: 0 0 15px 0;
  .message-item {
    padding: 10px 16px;
    // margin-top: 10px;
    padding-top: 0;
    margin-top: 0;
    &.message-item-hide {
      padding-top: 0;
      margin-top: 0;
    }
    .message-time {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 5px;
      // margin-left:
      text-align: center;
      > span {
        display: inline-block;
        color: #999;
        font-size: 12px;
      }
      .time {
        margin-left: 8px;
        background-color: transparent;
        line-height: 1;
        border-radius: 2px;
        padding: 3px 5px;
        font-size: 10px;
        &.current {
          color: #4498f0;
        }
      }
      &.msg-time-self {
        justify-content: flex-end;
      }
      &.msg-time-hide {
        display: none;
      }
    }
    .system-message {
      padding: 0 15%;
      text-align: center;
      font-size: 12px;
      color: #999;
      letter-spacing: 1px;
    }
    .preson-message {
      margin: {
        right: $--message-margin;
        left: 0;
      }
      height: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
      .system-message {
        padding: 0;
      }
    }
    .user-sign {
      margin: {
        right: 10px;
        left: 0;
      }
      align-self: flex-start;
      &.user-sign-hide {
        visibility: hidden;
      }
    }

    .message-wrapper {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      &.message-wrapper-self {
        align-items: flex-end;
      }
    }

    .msg-box {
      overflow: hidden;
      min-width: 40px;
      min-height: 20px;
      // border: 1px solid #ffffff;
      border-radius: 0 8px 8px / 8px;
      background-color: #ffffff;
    }
    .msg-box-no-boeder {
      border: 0 !important;
      border-radius: 0 !important;
      &.msg-box-no-boeder-hide {
        margin-top: -10px;
      }
    }

    // 发送消息样式
    .message-item-self {
      margin: {
        right: 0;
        left: $--message-margin;
      }
      flex-direction: row-reverse;
      .msg-box {
        border-radius: 16px 0 16px 16px / 16px;
        background-color: #d7e5ff;
        border-color: #d7e5ff;
      }
      .msg-state {
        margin: {
          right: 9px;
          bottom: 13px;
        }
        flex-shrink: 0;
        align-self: flex-end;
        text-align: right;
        line-height: 1;
        font-size: 12px;
        color: $--chat-msg-state-color;
      }
      // 发送进度指示
      .send-progress {
        margin-right: 5px;
        margin-bottom: 5px;
        flex-shrink: 0;
        align-self: flex-end;
        text-align: right;
        color: #999;
        font-size: 12px;
      }
      .user-sign {
        margin: {
          right: 0;
          left: 10px;
        }
      }
    }
  }

  ::v-deep img[data-zhixin-emoji-text] {
    width: 28px;
    height: 28px;
  }
}
/* 群组中人名显示 */
.from-name {
  // padding-bottom: 5px;
  color: #999;
  font-size: 14px;
  line-height: 1;
}
/* 消息错误状态提示 */
.error-state {
  margin-right: 10px;
  font-size: 24px;
  color: red;
}

/* 群文件 */
.group-file {
  align-self: flex-start;
  margin: 10px 0 0 60px;
  width: 46px;
  line-height: 18px;
  text-align: center;
  font-size: 12px;
  color: #7d858e;
  background-color: #dae1ea;
  border-radius: 4px;
  &.group-file-self {
    margin: 10px 60px 0 auto;
  }
}
.new-message-hint {
  position: absolute;
  right: 5px;
  bottom: 10px;
  button {
    display: flex;
    align-items: center;
    padding: 8px 10px 8px 15px;
    background-color: #fff;
    box-shadow: 0 0 4px 0 rgba($color: #000, $alpha: 0.1);
    border-radius: 100px 0px 0px 100px;
    font-size: 12px;
    color: #666;
    line-height: 16px;

    i {
      width: 12px;
      height: 12px;
      background-image: url(~@/assets/image/chitchat/down_arrow.png);
      background-repeat: no-repeat;
      background-size: 100% 100%;
    }
  }

  &.new-message {
    > button {
      color: $--default-theme-color;
      > i {
        background-image: url(~@/assets/image/chitchat/down_arrow_active.png);
      }
    }
  }
}
</style>
