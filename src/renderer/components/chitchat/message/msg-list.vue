<template>
  <div class="message-container" id="message-container">
    <iscroll-view
      ref="messageScrollView"
      @loadNext="loadMoreMessage(1)"
      @loadUp="loadMoreMessage()"
      @scroll="scrollHandle"
    >
      <div class="load-message-container">
        <button
          v-if="!isNoMore && !isLoadingMessage"
          @click="loadMoreMessage(0)"
        >
          查看更多消息
        </button>
        <div style="height:20px">
          <p v-if="isNoMore && !isLoadingMessage">
            已没有更多消息~
          </p>
          <i v-if="isLoadingMessage" class="loading-icon el-icon-loading"></i>
        </div>
      </div>
      <ul class="message-list" id="scroll-body">
        <li
          class="message-item"
          :class="[
            {
              'message-item-hide': item.hideTimeAndPhoto,
              'select-message-item':
                checkMessageList.includes(item.sentTime) && isShowCheckBox,
            },
          ]"
          v-for="(item, index) in messageList"
          :id="item.sentTime"
          :key="`${item.messageId}-${index}`"
        >
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
            v-else
            class="message-item-block"
            @click="checkMessage(item.sentTime, item)"
          >
            <mask-icon
              v-if="getCanCheck(item)"
              v-show="isShowCheckBox"
              class="check-icon"
              v-bind="getIconProps(item.sentTime)"
              size="16"
            />
            <div
              class="person-message"
              :class="{ 'message-item-self': item.bySelf }"
            >
              <user-photo
                class="user-sign"
                :class="{ 'user-sign-hide': item.hideTimeAndPhoto }"
                :user="{
                  ...item.content.user,
                  avatar:
                    'https://zx-zgiot-002.oss-cn-qingdao.aliyuncs.com/image/b852a63cb7af4c68a211cc5aabbfbf69.png'
                }"
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
                :class="{ 'message-wrapper-self': item.bySelf }"
              >
                <p
                  class="message-time"
                  :class="{
                    'msg-time-self': item.bySelf,
                    'msg-time-hide': item.hideTimeAndPhoto,
                  }"
                >
                  <span
                    class="from-name only-line"
                    v-if="
                      OpenDialog.conversationType ===
                        ConversationModel.IMConversationEnum.GROUP &&
                      !item.bySelf
                    "
                    >{{ parseName(item) }}</span
                  >
                  <span
                    class="time"
                    :class="{
                      current: $myUtils.isCurrentDay(item.messageTime),
                    }"
                    >{{ $myUtils.formatDateFilter(item.messageTime, 1) }}</span
                  >
                </p>
                <div
                  :style="{
                    display: 'flex',
                    alignItems: 'center',
                  }"
                >
                  <span
                    v-if="
                      item.bySelf &&
                      sendMessageLoading.includes(item.messageType) &&
                      item.sentStatus === MessageModel.SendStatus.SENDING
                    "
                    class="send-progress el-icon-loading"
                  ></span>
                  <Tooltip
                    class="error-state"
                    v-if="item.sentStatus === MessageModel.SendStatus.FAILED"
                    content="消息发送失败"
                    placement="right-start"
                    @click.native="reSendFaildMsg(item, index)"
                  >
                    <Icon type="md-warning" />
                  </Tooltip>
                  <span
                    v-if="
                      !OpenDialog.id.includes('robot') &&
                      !OpenDialog.self &&
                      item.conversationType ===
                        ConversationModel.IMConversationEnum.PRIVATE &&
                      item.bySelf &&
                      item.messageState !== MessageModel.MessageState.RECALL &&
                      statusMap.includes(item.sentStatus) &&
                      !isShowCheckBox
                    "
                    class="msg-state"
                    >{{ getStatusText(item) }}</span
                  >
                  <!-- msg-box-no-boeder：单个表情无会话气泡 -->
                  <div
                    class="msg-box"
                    :class="{
                      'msg-box-no-boeder':
                        item.messageState !==
                          MessageModel.MessageState.RECALL &&
                        item.messageType ===
                          MessageModel.MessageType.TextMessage &&
                        item.content.emojiContent &&
                        item.content.emojiContent.length === 2 &&
                        item.content.emojiContent[0].type == 'txt' &&
                        item.content.emojiContent[0].content == '' &&
                        item.content.emojiContent[1].type == 'emoji',
                      'msg-box-no-boeder-hide': item.hideTimeAndPhoto,
                    }"
                    @click="msgClickMenu($event, { item })"
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
                      :isLoading="
                        item.bySelf &&
                        sendMessageLoading.includes(item.messageType) &&
                        item.sentStatus === MessageModel.SendStatus.SENDING
                      "
                      @download="downloadHandle"
                    ></msg-file>
                    <msg-txt
                      v-else-if="
                        item.messageType ===
                        MessageModel.MessageType.TextMessage
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
                        item.messageType ===
                        MessageModel.MessageType.VoiceMessage
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
                        item.messageType ===
                        MessageModel.MessageType.ZXCombineMsg
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
          </div>
          <p
            class="group-file"
            :class="{ 'group-file-self': item.bySelf }"
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
        </li>
      </ul>
    </iscroll-view>
    <transition name="list">
      <div
        class="new-message-hint"
        v-if="showDownMsg || openConverNewMessage"
        :class="{ 'new-message': openConverNewMessage }"
      >
        <button @click="showNewMessageHandler">
          <i></i>
          &nbsp;{{
            openConverNewMessage
              ? `${openConverNewMessage}条新消息`
              : "回到最后"
          }}
        </button>
      </div>
    </transition>
    <transition name="fade">
      <ul
        v-if="IsMenu"
        class="menu-container"
        :style="`top: ${top}px; left: ${left}px;`"
      >
        <li
          v-for="item in operateButtons"
          @click="SelectMenuHandle(item.type)"
          :key="item.type"
        >
          <img :src="item.icon" />
          <button>{{ item.label }}</button>
        </li>
        <!-- <li>
          <button @click="SelectMenuHandle('reply')" v-show="IsShowMenu.reply">回复</button>
        </li>-->
      </ul>
    </transition>
  </div>
</template>

<script>
import { ipcRenderer, clipboard, nativeImage } from "electron";
import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel, IMSDKServer } from "../../../WebIM";
import { Util } from "../../../plugin";
import globalConfig from "@/global.config";
import msgTools from "../../../store/module/messageModule/msgTools";
import FileManage from "../../../plugin/file-manage";
import { getHashUrl } from "../../../../modules/utils";
import ClipboardJs from "../../../plugin/clipboard";
import { MessageBox } from "element-ui";
window.ClipboardJs = ClipboardJs;

const fs = require("fs");
const request = require("request");
const remote = require("@electron/remote");

const robot = globalConfig.robot;

import MessageTemplate from "@/components/chitchat/message/msgtype";

const { dialog } = remote;
const buttons = [
  {
    type: "edit",
    label: "修改",
    icon: require("@/assets/image/message/edit.png"),
  },
  {
    type: "copy",
    label: "复制",
    icon: require("@/assets/image/message/copy.png"),
  },
  {
    type: "transpond",
    label: "转发",
    icon: require("@/assets/image/message/transmit.png"),
  },
  {
    type: "download",
    label: "下载",
    icon: require("@/assets/image/message/download.png"),
  },
  {
    type: "delete",
    label: "删除",
    icon: require("@/assets/image/message/delete.png"),
  },
  {
    type: "recall",
    label: "撤回",
    icon: require("@/assets/image/message/recall.png"),
  },
  {
    type: "multSelect",
    label: "多选",
    icon: require("@/assets/image/message/multSelect.png"),
  },
];

export default {
  name: "MessageContainer",
  components: { ...MessageTemplate },
  data() {
    return {
      IsMenu: false,
      top: 0,
      left: 0,
      contextMenuData: {},
      progress: {},
      msgLength: 0,
      timeoutFlag: "",
      activeNode: "",
      scrollDistance: 0, // 滚动距离
      statusMap: [
        MessageModel.SendStatus.SENT,
        MessageModel.SendStatus.READ,
        MessageModel.SendStatus.RECEIVED,
      ],
      sendMessageLoading: [
        MessageModel.MessageType.ImageMessage,
        MessageModel.MessageType.FileMessage,
        MessageModel.MessageType.TextMessage,
      ],
      MessageModel,
      ConversationModel,
      cancelMessage: null,
      isLoadingMessage: false, // 是否正在加载更多消息
      scrollTimeout: null, // 滚动事件限流使用
      isFirstScreen: true, // 是否为首屏（最新一页消息）
      openConverNewMessage: 0, // 浏览历史消息过程中出现的新消息数
      positionTime: "", //查找记录所在位置
      tempMessageList: [], // 用来展示搜索定位历史消息的临时列表
      showDownMsg: false, // 是否显示跳转到最新按钮
      isShowCheckBox: false, // 是否展示多选框
      checkMessageList: [],
    };
  },
  created() {
    ipcRenderer.on("ReadReceiptMsgEvent", (event, data) => {
      if (Array.isArray(data)) {
        this.ReadReceiptMessage(data);
      }
    });
  },
  mounted() {
    this.positionTime = "";
    window.addEventListener("click", this.closeMenu);
    window.addEventListener("resize", this.closeMenu);
    window.eventHub.$on("downloadEvent", this.downloadHandle);
    window.eventHub.$on(
      "openConversationRcMessage",
      this.openConversationRcMessageHandler
    );
    this.scrollBottom({ isBottom: true });
    this.ReadLastMessage(
      [...this.messageList],
      this.OpenDialog.id,
      this.OpenDialog.conversationType,
      undefined,
      this.OpenDialog.name
    );
    // this.loadMoreMessage();
    this.showDownMsg = false;
  },
  activated() {
    this.positionTime = "";
    this.scrollBottom({ isBottom: true });
  },
  beforeDestroy() {
    this.positionTime = "";
    window.eventHub.$off("downloadEvent", this.downloadHandle);
    window.eventHub.$off(
      "openConversationRcMessage",
      this.openConversationRcMessageHandler
    );
  },
  computed: {
    ...mapGetters({
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
    messageList() {
      let list = [];
      const {
        tempMessageList,
        GetIsGetHistoryStatus,
        currentTypeKey,
        Messages,
      } = this;
      if (GetIsGetHistoryStatus[currentTypeKey]) {
        list = tempMessageList;
      } else {
        list = Messages;
      }
      list = list.map((item, index) => {
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
      return list || [];
    },
    IsShowMenu() {
      let msg = this.contextMenuData.item;
      let isShow = {};
      isShow.delete = true;
      isShow.multSelect = this.getCanCheck(msg);
      isShow.transpond =
        msg &&
        this.getMessageType([
          "txt",
          "img",
          "file",
          "video",
          "combine",
          "applink"
        ]).includes(msg.messageType);
      isShow.copy =
        msg &&
        this.getMessageType(["txt", "img"]).includes(msg.messageType) &&
        msg.messageType !== this.MessageModel.MessageType.ZXGIFMsg;
      isShow.download =
        msg && this.getMessageType(["img", "file"]).includes(msg.messageType);
      let currentTime = Date.now();
      const serverTime = ipcRenderer.sendSync("get-server-time");
      if (serverTime) {
        currentTime = serverTime;
      }
      if (
        currentTime - msg.messageTime > 2 * 60 * 1000 ||
        !msg.bySelf ||
        msg.sentStatus === MessageModel.SendStatus.FAILED
      ) {
        isShow.recall = false;
      } else {
        isShow.recall = true;
      }
      isShow.edit =
        msg && this.getMessageType(["txt"]).includes(msg.messageType);
      return isShow;
    },
    dialogMenuHeight() {
      let height = 0;
      Object.keys(this.IsShowMenu).forEach((key) => {
        if (this.IsShowMenu[key]) {
          height += 48;
        }
      });
      return height;
    },
    openIsType() {
      const result = {
        group:
          this.OpenDialog.conversationType ===
          ConversationModel.IMConversationEnum.GROUP,
      };
      return result;
    },
    isNoMore() {
      // 是否没有更多消息
      const key =
        this.OpenDialog.conversationType ===
        ConversationModel.IMConversationEnum.GROUP
          ? "group"
          : "private";
      const data = this.NoMoreMsg[key];
      return data.includes(this.OpenDialog.id);
    },
    operateButtons() {
      let result = buttons.filter((item) => this.IsShowMenu[item.type]);
      return result;
    },
    /**
     * 类型Id拼接key
     */
    currentTypeKey() {
      const typeKey = `${this.OpenDialog.conversationType}_${this.OpenDialog.id}`;
      return typeKey;
    },
  },
  watch: {
    $route(newRoute) {
      const { messageList, ReadLastMessage, msgLength } = this;
      if (newRoute.name === "chitchat" && msgLength) {
        ReadLastMessage(
          [...messageList],
          this.OpenDialog.id,
          this.OpenDialog.conversationType,
          undefined,
          this.OpenDialog.name
        );
      }
    },
    Messages: {
      deep: true,
      handler(val, oldVal) {
        let leng = 0;
        if (val) {
          leng = val.length;
        }
        this.msgLength = leng;
      },
    },
    OpenDialog: {
      deep: true,
      handler(val, oldVal) {
        if (val.id !== oldVal.id) {
          this.isShowCheckBox = false; // 切换会话时取消多选
          this.showDownMsg = false;
          this.isLoadingMessage = false;
          this.cancelMessage && this.cancelMessage.cancel();
          this.positionTime = "";
          this.isFirstScreen = true;
          this.msgLength = this.Messages.length;
          this.scrollBottom({ isBottom: true });
          const typeKey = `${val.conversationType}_${val.id}`;
          this.tempMessageList.splice(0);
          if (this.GetIsGetHistoryStatus[typeKey]) {
            // 如果切換的会话处于历史消息展示中，则清空历史消息获取最新消息
            this.SetIsGetHistoryStatus({ key: typeKey, status: false });
          } else if (!this.contentTime && this.msgLength <= 10) {
            // 从搜索中选择聊天记录路跳转则不请求新的聊天消息
            this.loadMoreMessage();
          }
          if (this.msgLength) {
            this.ReadLastMessage(
              [...this.Messages],
              val.id,
              val.conversationType,
              true,
              val.name
            );
          }
          this.scrollDistance = 0;
          this.openConverNewMessage = 0;
        }
      },
    },
    MainWinVisible(val) {
      const { ReadLastMessage, msgLength, messageList, OpenDialog, $route } =
        this;
      if (val && $route.name === "chitchat") {
        if (msgLength) {
          ReadLastMessage(
            [...messageList],
            this.OpenDialog.id,
            this.OpenDialog.conversationType,
            undefined,
            this.OpenDialog.name
          );
        }
      }
    },
    isFirstScreen(val) {
      if (val) {
        const { ReadLastMessage, messageList } = this;
        if (messageList.length) {
          ReadLastMessage(
            [...messageList],
            this.OpenDialog.id,
            this.OpenDialog.conversationType,
            undefined,
            this.OpenDialog.name
          );
        }
      }
    },
  },
  methods: {
    ...mapActions([
      "DeleteMessage",
      "UpdateReminderMap",
      "ChangeNoMoreMsg",
      "SaveHistoryMessage",
      "SetIsGetHistoryStatus",
      "SetContentTime",
    ]),
    msgClickMenu(e, { item }) {
      if (
        [
          MessageModel.MessageType.FileMessage,
          MessageModel.MessageType.ZXEncryptFileMsg,
          MessageModel.MessageType.ImageMessage,
          MessageModel.MessageType.ZXEncryptImgMsg,
          MessageModel.MessageType.ZXGIFMsg,
          MessageModel.MessageType.ZXVideoMessage,
          MessageModel.MessageType.ZXEncryptVideoMsg,
          MessageModel.MessageType.ZXActionCardMsg,
          MessageModel.MessageType.LocationMessage,
          MessageModel.MessageType.ZXCombineMsg,
        ].includes(item.messageType)
      ) {
        e.stopPropagation();
      }
    },
    getCanCheck(item) {
      // 部分消息类型以及未撤回且发送成功的消息才能被转发
      return (
        [
          MessageModel.MessageType.FileMessage,
          MessageModel.MessageType.ZXEncryptFileMsg,
          MessageModel.MessageType.TextMessage,
          MessageModel.MessageType.ImageMessage,
          MessageModel.MessageType.ZXEncryptImgMsg,
          MessageModel.MessageType.ZXGIFMsg,
          MessageModel.MessageType.ZXVideoMessage,
          MessageModel.MessageType.ZXEncryptVideoMsg,
          MessageModel.MessageType.ZXActionCardMsg,
          MessageModel.MessageType.LocationMessage,
          MessageModel.MessageType.ZXCombineMsg,
          MessageModel.MessageType.ZXAppLinkMessage,
        ].includes(item.messageType) &&
        item.messageState !== MessageModel.MessageState.RECALL &&
        [
          MessageModel.SendStatus.RECEIVED,
          MessageModel.SendStatus.READ,
          MessageModel.SendStatus.SENT,
        ].includes(item.sentStatus)
      );
    },
    // 选中消息
    checkMessage(sentTime, item) {
      if (this.getCanCheck(item)) {
        // if (item.content.hierarchy && item.content.hierarchy == 5) {
        //   // 如果合并转发层级大于5则不能选
        //   this.$message.info("该消息转发次数超过上限！");
        //   return;
        // }
        let index = this.checkMessageList.findIndex(
          (item) => item === sentTime
        );
        if (index > -1) {
          this.checkMessageList.splice(index, 1);
        } else {
          if (this.checkMessageList.length >= 100) {
            MessageBox.confirm("消息多选支持100条", "", {
              confirmButtonText: "好的",
              customClass: "warningDialog",
              showClose: false,
              showCancelButton: false,
              closeOnPressEscape: false,
              type: "warning",
            })
              .then(() => {})
              .catch(() => {});
          } else {
            this.checkMessageList.push(sentTime);
          }
        }
        let messageList = this.messageList.filter((item) =>
          this.checkMessageList.includes(item.sentTime)
        );
        if (messageList.length === 21) {
          this.$message.info("多选超过20条，仅支持合并转发");
        }
        this.$emit("selectMessage", messageList);
      }
    },
    getIconProps(sentTime) {
      const type = this.checkMessageList.includes(sentTime)
        ? "checked"
        : "unchecked";
      if (type === "checked") {
        return {
          name: "checked",
        };
      } else {
        return {
          name: "unchecked",
          color: "#8F959E",
        };
      }
    },
    /**
     * @param order 获取顺序, 默认为 0. 0: 获取 timestrap 之前的消息, 1: 获取 timestrap 之后的消息3
     */
    loadMoreMessage(
      order = 0,
      {
        targetId = this.OpenDialog.id,
        conversationType = this.OpenDialog.conversationType,
        joinTime = this.OpenDialog.joinTime,
      } = {}
    ) {
      if (this.isLoadingMessage && this.OpenDialog.id === targetId) {
        return;
      }
      const lastMsg = this.messageList[0];
      let lastTime = null;
      if (this.positionTime) {
        lastTime = Number(this.positionTime) - 10;
      } else if (order == 1) {
        lastTime = this.messageList[this.messageList.length - 1].sentTime;
      } else if (!!lastMsg) {
        lastTime = lastMsg.sentTime;
      }
      if (!this.messageList.length) {
        this.ChangeNoMoreMsg({
          data: targetId,
          action: "del",
          conversationType: conversationType,
        });
      }
      const data = {
        fromUserId: this.senderInfo.id,
        targetId,
        conversationType,
        lastTime: lastTime || Date.now(),
        order,
      };
      let isGroup = false;
      if (conversationType === ConversationModel.IMConversationEnum.GROUP) {
        data.groupId = targetId;
        isGroup = true;
      }
      this.getMessageList(data, joinTime, isGroup);
    },
    msgContextMenu(ev, data) {
      if (this.isShowCheckBox) {
        // 多选时去掉右键按钮
        return;
      }
      this.$emit("closeOperate");
      if (
        (data.item.bySelf &&
          this.sendMessageLoading.includes(data.item.messageType) &&
          data.item.sentStatus === MessageModel.SendStatus.SENDING) ||
        data.item.messageState === MessageModel.MessageState.RECALL
      ) {
        return;
      }
      this.contextMenuData = data;
      this.IsMenu = false;
      const winX = window.innerWidth;
      const winY = window.innerHeight;
      let e = ev || window.event;
      this.top = e.clientY;
      if (e.clientY + this.dialogMenuHeight > winY) {
        this.top = e.clientY - this.dialogMenuHeight;
      }
      this.left = e.clientX;
      if (e.clientX + 110 > winX) {
        this.left = winX - 110;
      }
      this.IsMenu = true;
      this.activeNode = ev.currentTarget;
      let selection = window.getSelection();
      if (
        selection.isCollapsed &&
        this.getMessageType(["txt"]).includes(data.item.messageType)
      ) {
        let range = document.createRange();
        range.selectNodeContents(ev.currentTarget);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
    openConversationRcMessageHandler({ self }) {
      if (!this.isFirstScreen && !self) {
        ++this.openConverNewMessage;
      } else {
        this.scrollBottom({ isBottom: true });
      }
    },
    //展示查找的聊天记录所在位置
    showMessagePosition(time, isGet = false) {
      this.$nextTick(() => {
        let elemtent = document.getElementById(time);
        if (elemtent) {
          elemtent.style.background = "#e3f0fd";
          this.positionTime = "";
          this.checkShowIscroll();
          setTimeout(() => {
            elemtent.style.background = "transparent";
          }, 3000);
          elemtent.scrollIntoView({
            block: "center",
          });
          this.showDownMsg = true;
          // 保存一下滚动的位置防止点击查看更多时定位到底部
          this.scrollThrottle({
            target: this.$refs.messageScrollView.$el.getElementsByClassName(
              "iscroll-view-container"
            )[0],
          });
        } else if (isGet) {
          // 已查询过数据，未查询到
          this.$message.info("未找到对应消息！");
          this.positionTime = "";
          this.SetIsGetHistoryStatus({
            key: this.currentTypeKey,
            status: false,
          });
          this.$nextTick(() => {
            // 保存一下滚动的位置防止点击查看更多时定位到底部
            this.scrollThrottle({
              target: this.$refs.messageScrollView.$el.getElementsByClassName(
                "iscroll-view-container"
              )[0],
            });
          });
        } else {
          this.tempMessageList.splice(0);
          this.positionTime = time;
          this.SetIsGetHistoryStatus({
            key: this.currentTypeKey,
            status: true,
          });
          this.loadMoreMessage(1);
        }
        this.SetContentTime("");
      });
    },
    getMessageList(data, joinTime, isGroup) {
      this.cancelMessage && this.cancelMessage.cancel();
      this.isLoadingMessage = true;
      this.cancelMessage = this.$CancelToken.source();
      const { targetId, conversationType } = data;
      // 登录人最多能看入群4小时前的消息
      const allowTime = joinTime - globalConfig.group_msg_time;
      this.$service
        .getHistoryMessageServe(
          {
            ...data,
            toUserId: targetId,
            isSave: false,
          },
          {
            cancelToken: this.cancelMessage.token,
          }
        )
        .then((response) => {
          if (joinTime && isGroup) {
            let length = response.list.length;
            response.list = response.list.filter(
              (msg) => msg && msg.sentTime > allowTime
            );
            length !== response.list.length && (response.has = false); // 根据过滤完入群限制消息之后的消息数量变化，判断一下是否还有历史消息能拉取
          }
          // 有消息并且都是不显示的类型，改变时间戳参数继续请求
          const {
            RecallCommandMessage,
            ZXConversationOperateMsg,
            ZXGatherMsg,
          } = this.MessageModel.MessageType;
          const noCanShow = response.list.every(({ messageType }) =>
            [
              RecallCommandMessage,
              ZXConversationOperateMsg,
              ZXGatherMsg,
            ].includes(messageType)
          );
          console.log("getMessageList", { noCanShow });
          if (response.list.length > 0 && noCanShow) {
            this.getMessageList(
              {
                ...data,
                lastTime:
                  data.order === 0
                    ? response.list[0].messageTime
                    : response.list[response.list.length - 1].messageTime,
              },
              joinTime,
              isGroup
            );

            Promise.reject("cancel msg handle");
          }

          return response;
        })
        .then((result) => {
          const typeKey = `${conversationType}_${targetId}`;
          if (this.GetIsGetHistoryStatus[typeKey]) {
            // 如果获取消息的会话处于查询历史消息状态
            // 并且是处于打开展示状态
            if (targetId === this.OpenDialog.id) {
              const getters = this.$store.getters;
              if (data.order == 1) {
                result.list.forEach((message) => {
                  msgTools.formatMessage({ message, getters, isHistory: true });
                  this.tempMessageList.push(message);
                });
              } else {
                result.list.reverse().forEach((message) => {
                  msgTools.formatMessage({ message, getters, isHistory: true });
                  this.tempMessageList.unshift(message);
                });
              }
            }
          } else {
            result.list.forEach((message) => {
              message &&
                this.SaveHistoryMessage({ message, isLast: data.order == 1 });
            });
            if (!result.has) {
              // 没有历史消息时vuex中保存一下状态
              this.ChangeNoMoreMsg({
                data: targetId,
                action: "add",
                conversationType,
              });
            }
          }
          this.isLoadingMessage = false;
          if (targetId === this.OpenDialog.id) {
            if (this.positionTime) {
              this.showMessagePosition(this.positionTime, true);
            } else if (data.order == 1) {
              this.isFirstScreen = false;
              this.scrollBottom({}, true);
            } else {
              this.scrollBottom();
            }
          }
        })
        .catch((error) => {
          console.error(error);
          if (error && error == "22406") {
            this.ChangeNoMoreMsg({
              data: targetId,
              action: "add",
              conversationType,
            });
          } else if (targetId === this.OpenDialog.id) {
            this.$emit("alert", {
              message: "消息获取失败",
              type: "warning",
              show: true,
            });
          }
          this.isLoadingMessage = false;
        });
    },
    getMessageType(types = []) {
      let result = [];
      types.forEach((type) => {
        switch (type) {
          case "txt":
            result.push(this.MessageModel.MessageType.TextMessage);
            break;
          case "img":
            result.push(
              this.MessageModel.MessageType.ImageMessage,
              this.MessageModel.MessageType.ZXEncryptImgMsg,
              this.MessageModel.MessageType.ZXGIFMsg
            );
            break;
          case "file":
            result.push(
              this.MessageModel.MessageType.FileMessage,
              this.MessageModel.MessageType.ZXEncryptFileMsg
            );
            break;
          case "audio":
            result.push(this.MessageModel.MessageType.VoiceMessage);
            break;
          case "video":
            result.push(this.MessageModel.MessageType.ZXVideoMessage);
            break;
          case "rich":
            result.push(this.MessageModel.MessageType.ZXRichMessage);
            break;
          case "combine":
            result.push(this.MessageModel.MessageType.ZXCombineMsg);
          case "applink":
            result.push(this.MessageModel.MessageType.ZXAppLinkMessage);
        }
      });

      return result;
    },
    closeMenu() {
      this.IsMenu = false;
    },
    scrollHandle(ev) {
      const e = ev || event || window.event;
      if (this.IsMenu) {
        this.closeMenu();
      }
      this.scrollThrottle(e);
    },
    scrollThrottle: Util.throttle(function (e) {
      const scrollHeight = e.target.scrollHeight;
      const scrollTop = e.target.scrollTop;
      const clientHeight = e.target.clientHeight;

      this.scrollDistance = scrollHeight - scrollTop;
      if (this.scrollDistance < clientHeight * 2) {
        if (!this.GetIsGetHistoryStatus[this.currentTypeKey]) {
          // 非历史消息展示
          this.showDownMsg = false;
          this.isFirstScreen = true;
          this.openConverNewMessage = 0;
        } else {
          // 历史消息展示
          if (
            this.tempMessageList[this.tempMessageList.length - 1] &&
            this.Messages[this.Messages.length - 3] &&
            this.tempMessageList[this.tempMessageList.length - 1].sentTime >=
              this.Messages[this.Messages.length - 3].sentTime
          ) {
            this.SetIsGetHistoryStatus({
              key: this.currentTypeKey,
              status: false,
            });
            this.$nextTick(() => {
              const ratio =
                (scrollHeight / e.target.scrollHeight) * this.scrollDistance;
              e.target.scrollTop = e.target.scrollHeight - ratio;
              this.showDownMsg = false;
            });
          }
        }
      } else {
        this.showDownMsg = true;
        this.isFirstScreen = false;
      }
    }, 150),
    scrollBottom({ isBottom = false } = {}, isScroll = null) {
      this.$nextTick(() => {
        if (
          (this.isFirstScreen || isBottom) &&
          !this.GetIsGetHistoryStatus[this.currentTypeKey]
        ) {
          // 首屏或主动到底部 非定位历史消息
          const scrollBody = document.getElementById("scroll-body");
          if (scrollBody) {
            scrollBody.scrollIntoView(false);
          }
          // 消息显示最新一条时尝试发送已读回执
          const { MainWinVisible, ReadLastMessage, messageList, $route } = this;
          if (
            messageList.length &&
            MainWinVisible &&
            $route.name === "chitchat"
          ) {
            ReadLastMessage(
              [...messageList],
              this.OpenDialog.id,
              this.OpenDialog.conversationType,
              undefined,
              this.OpenDialog.name
            );
          }
        } else if (!isScroll) {
          const container =
            this.$refs.messageScrollView.$el &&
            this.$refs.messageScrollView.$el.getElementsByClassName(
              "iscroll-view-container"
            )[0];
          container.scrollTo(0, container.scrollHeight - this.scrollDistance);
        }
      });
    },
    showNewMessageHandler() {
      this.SetIsGetHistoryStatus({ key: this.currentTypeKey, status: false });
      this.scrollBottom({ isBottom: true });
      this.openConverNewMessage = 0;
      this.showDownMsg = false;
      this.isFirstScreen = true;
    },
    showFullScreenImg(currentMsg) {
      // 查看大图
      let index = 0;
      let ImgMsgs = [];
      for (let i = 0; i < this.messageList.length; i++) {
        const msg = this.messageList[i];
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
    SelectMenuHandle(type) {
      this.closeMenu();
      switch (type) {
        case "delete":
          this.removeMessage(this.contextMenuData.item);
          break;

        case "download":
          this.downloadHandle(this.contextMenuData.item);
          break;

        case "transpond":
          window.eventHub.$emit("transpond", this.contextMenuData.item);
          break;

        case "reply":
          break;

        case "copy":
          this.setCopyData(this.contextMenuData.item);
          break;
        case "recall":
          this.recallMessage(this.contextMenuData.item);
          break;
        case "edit":
          this.editMessage(this.contextMenuData.item);
          break;
        case "multSelect":
          this.isShowCheckBox = true;
          // 初始时选中
          this.$emit("multSelect");
          this.checkMessage(
            this.contextMenuData.item.sentTime,
            this.contextMenuData.item
          );
          break;
      }
    },
    recallMessage(message) {
      // 消息撤回
      this.$service.RecallMessageServer(message);
      const selection = window.getSelection();
      selection.removeAllRanges();
    },
    editMessage(message) {
      // 消息修改
      let currentTime = Date.now();
      const serverTime = ipcRenderer.sendSync("get-server-time");
      if (serverTime) {
        currentTime = serverTime;
      }
      if (
        currentTime - message.messageTime <= 2 * 60 * 1000 &&
        message.bySelf &&
        message.sentStatus !== MessageModel.SendStatus.FAILED
      ) {
        // 2分钟内的消息修改时需要先撤回再修改
        this.$service.RecallMessageServer(message);
      }
      const selection = window.getSelection();
      selection.removeAllRanges();
      this.$emit("edit-message", message);
    },
    recallThenEdit(message) {
      // 撤回消息后重新编辑
      this.$emit("edit-message", message);
    },
    ReadLastMessage(
      messageList,
      conversationId,
      conversationType,
      noVerify = false,
      conversationName
    ) {
      if (!this.isFirstScreen || this.showDownMsg) {
        return false;
      }
      messageList = [...messageList];
      messageList.reverse();
      for (let i = 0; i < messageList.length; i++) {
        const message = messageList[i];

        if (
          message &&
          !message.bySelf &&
          (message.receivedStatus !== MessageModel.RecState.READ || noVerify) &&
          message.messageUId &&
          message.sentTime
        ) {
          this.$service.SendReadReceiptMessage({
            msg: message,
            conversationType,
            key: conversationId,
          });
          // window.Logger.info({
          //   msg: "发送会话已读",
          //   conversation: conversationName || "",
          //   messageUId: message.messageUId,
          //   sentTime: new Date(message.sentTime).toLocaleString(),
          //   receivedTime: new Date(message.receivedTime).toLocaleString()
          // });
          setTimeout(() => {
            this.UpdateReminderMap({
              type: false,
              key: conversationId,
              conversationType,
              number: 0,
            });
          }, 0);
          break;
        }
      }
    },
    ReadReceiptMessage([msg, index]) {
      // 发送已读回执
      // 每条消息发送已读回执
      if (
        msg &&
        msg.receivedStatus !== MessageModel.RecState.READ &&
        msg.messageUId &&
        msg.sentTime
      ) {
        this.$service.SendReadReceiptMessage({
          index,
          msg,
          conversationType: this.OpenDialog.conversationType,
        });
      }
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
    signUrl(url, type) {
      const postData = { url };
      if (type === "image") {
        postData.process = "image/auto-orient,1";
      }
      return this.$service.getSignedUrlByOss(postData).then((result) => {
        return result;
      });
    },
    async setCopyData(message) {
      if (
        message &&
        this.getMessageType(["img"]).includes(message.messageType)
      ) {
        const progressHandle = (...args) => {
          console.log("args: ", args);
        };
        let url = message.content.imageUri;
        url = await this.signUrl(url);
        const isEncrypt = [MessageModel.MessageType.ZXEncryptImgMsg].includes(
          message.messageType
        );
        let result = await FileManage.cacheFile({
          url,
          isEncrypt,
          progress: progressHandle,
        });
        clipboard.writeImage(nativeImage.createFromPath(result.localPath));
        this.$Message.success("复制成功");
      } else {
        // 设置复制选区
        const selection = window.getSelection();
        // const range = selection.getRangeAt(0);
        // // debugger;
        // const selectionDoc = range.cloneContents();
        // const selectionText = selection.toString();
        // // const selectionHTML = selection.focusNode.innerHTML;
        // const div = document.createElement("div");
        // div.appendChild(selectionDoc);
        // // clipboard.writeText(selectionText);
        // // clipboard.writeHTML(div.innerHTML);
        // clipboard.write({
        //   text: selectionText,
        //   html: div.innerHTML
        // });
        // selection.removeAllRanges();

        document.execCommand("copy");
        selection.removeAllRanges();
      }
    },
    getStatusText(data) {
      // 根据消息的状态码返回已读未读
      let statusTxt = "";
      let typeTxt = "读";
      if (data.sentStatus === MessageModel.SendStatus.SENT) {
        statusTxt = "未";
      } else if (
        [
          MessageModel.SendStatus.RECEIVED,
          MessageModel.SendStatus.READ,
        ].includes(data.sentStatus)
      ) {
        statusTxt = "已";
      }

      return `${statusTxt}${typeTxt}`;
    },
    parseName(message) {
      let name = "";
      if (message) {
        name = this.GetSenderName(message, this.OpenDialog);
      }

      return name;
    },
    reSendFaildMsg(message) {
      // 重发失败的消息
      this.$service.SendMessageHandle.call(this, message, false, true);
    },
    async removeMessage(message, index) {
      const { id, conversationType } = this.OpenDialog;
      const { messageUId, sentTime, messageDirection } = message;
      if (messageUId) {
        try {
          const messages = [{ messageUId, sentTime, messageDirection }];
          await IMSDKServer.clearConversitionRomoteMessages(
            conversationType,
            id,
            messages
          );
          ipcRenderer.invoke("sqlite-url", {
            key: "removeMessage",
            data: [message],
            input: { conversationType, id },
          });
        } catch (error) {
          this.$Message.warning("删除失败");
          return;
        }
        let chatType =
          conversationType === ConversationModel.IMConversationEnum.PRIVATE
            ? 1
            : 2;
        this.$service.deleteMessageSync({
          type: 1,
          targetId: id,
          chatType,
          msgVos: [{ msgUID: messageUId, msgTimestamp: sentTime }],
        });
      }

      this.DeleteMessage({
        key: id,
        message,
      });
    },
    /**
     * 检查是否出现滚动条
     */
    checkShowIscroll() {
      const scrollBody = document.getElementById("scroll-body");
      if (scrollBody.clientHeight <= scrollBody.parentElement.clientHeight) {
        this.loadMoreMessage(1);
      }
    },
    /**
     * 点击机器人头像，需要展示机器人详情
     */
    showRobotInfoHandle(data) {
      this.$emit("show-robot", { type: "info", robotId: data.id });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

$--message-margin: 20%;

.message-container {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 3px;
  background-color: $--chat-main-bg-color;
  .menu-container {
    // 右键菜单
    position: fixed;
    top: 0;
    z-index: 9999;
    width: 100px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba($color: #000, $alpha: 0.3);
    user-select: none;
    > li {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:not(:last-of-type) {
        border-bottom: 1px solid #e7e7e7;
      }
      &:hover {
        background-color: $--menu-hover-bgcolor;
      }
      > img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
      }
      > button {
        background-color: transparent;
        user-select: none;
      }
    }
  }

  .load-message-container {
    // 消息查看更多
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    button {
      color: $--default-theme-color;
      background-color: transparent;
      cursor: pointer;
    }
    p {
      color: #999;
    }
    .loading-icon {
      margin-top: 5px;
      font-size: 16px;
    }
  }
  .message-list {
    // 消息列表
    padding: 0 0 15px 0;
    .message-item {
      padding: 10px 20px;
      margin-top: 10px;
      &.message-item-hide {
        padding: 5px 20px;
        margin-top: 0;
        .message-item-block {
          align-items: center;
        }
      }
      .message-item-block {
        display: flex;
        .check-icon {
          cursor: pointer;
          margin-top: 12px;
          margin-right: 16px;
        }
        .person-message {
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
          background-color: #e7e7e7;
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
        border-radius: 0 16px 16px / 16px;
        background-color: #ffffff;
      }
      .show-image {
        cursor: pointer;
        width: 18px;
        height: 18px;
        margin: 0 12px;
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
          right: 0 !important;
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
            left: 9px;
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
}
</style>
