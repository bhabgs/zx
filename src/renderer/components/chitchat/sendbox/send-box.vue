<template>
  <div
    class="send-container"
    :class="`send-container-${dialogType}`"
    @dragleave.prevent
    @dragover.prevent
    @drop.stop.prevent="dropHandle"
  >
    <div class="conversation-sign">
      <div class="send-box-top">
        <!-- 表情 -->
        <span
          class="btn-icon iconfont icon-biaoqing"
          :class="{ 'focus-btn-icon': emojiState }"
          @click.stop="selectEmojiHandle"
        ></span>
        <!-- 截图 -->
        <a-popover overlayClassName="jietu-pop" v-model="jietupopvisible">
          <template slot="content">
            <a-button block @click="screenCaptureHandler($event)">
              截图
              <template v-if="screenshortKey">
                (
                <span class="blue-color" v-text="screenshortKey"></span>)
              </template>
            </a-button>
            <a-button
              type="link"
              block
              @click="screenCaptureHandler($event, 'hidden')"
            >
              按住
              <span class="blue-color" v-if="platform === 'darwin'"
                >&#8679;</span
              >
              <span class="blue-color" v-else>Shift</span>点击
              <span class="iconfont icon-jieping blue-color"></span>
              可隐藏窗口
            </a-button>
          </template>
          <span
            class="btn-icon iconfont icon-jieping"
            @click="screenCaptureHandler($event)"
          ></span>
        </a-popover>
        <!-- 文件 -->
        <span
          class="btn-icon iconfont icon-wenjian"
          @click="selectFileHandle"
        ></span>
        <!-- @ -->
        <span class="btn-icon iconfont icon-at" @click="insertATa"></span>
        <!-- 发起行动中心 -->
        <span
          v-if="!OpenDialog.id.includes('robot_')"
          class="mr-20px flex items-center justify-center w-5 h-5 cursor-pointer"
          @click="handleActionCenter"
        >
          <svg-icon
            class="w-full h-full text-#aaadbb hover:bg-primary"
            name="action-create"
          ></svg-icon>
        </span>
        <!-- 快速定位至当前对话 -->
        <div
          class="send-button-tip"
          title="点击 快速定位至当前对话"
          @click="scrollCurrentDialog"
        >
          <p class="name">发送至：</p>
          <user-photo
            class="margin0"
            :user="OpenDialog"
            v-if="
              OpenDialog.conversationType ===
                ConversationModel.IMConversationEnum.PRIVATE
            "
          ></user-photo>
          <group-photo
            class="margin0"
            :group="OpenDialog"
            v-if="
              OpenDialog.conversationType ===
                ConversationModel.IMConversationEnum.GROUP
            "
          ></group-photo>
          <p
            class="name"
            :class="{ 'text-center': name.length < 5 }"
            v-text="maxFilter(name)"
          ></p>
        </div>
      </div>
      <div
        class="right-box"
        v-if="!showAllScreen"
        @click="changeSendBoxHeight('max')"
      >
        <el-tooltip
          v-model="isShowTooltip"
          effect="dark"
          content="全屏输入"
          placement="bottom"
          :enterable="false"
          :visible-arrow="false"
          transition="x"
        >
          <img
            class="open"
            src="~@/assets/image/chitchat/open-send.png"
            alt=""
          />
        </el-tooltip>
      </div>
      <div class="right-box" v-else @click="changeSendBoxHeight('min')">
        <el-tooltip
          v-model="isShowTooltip"
          effect="dark"
          content="收起"
          placement="bottom"
          :enterable="false"
          :visible-arrow="false"
          transition="x"
        >
          <img
            class="close"
            src="~@/assets/image/chitchat/put-away-send.png"
            alt=""
          />
        </el-tooltip>
      </div>
    </div>
    <div class="send-box">
      <div class="send-box-body">
        <section
          class="editor"
          id="edit"
          placeholder="请输入消息"
          :contenteditable="IsContenteditable"
          ref="edit"
          @input="inputHandle"
          @keydown="keyDownHandle"
          @keypress="editKeypressHandle"
          @paste="pasteHandle"
          @click="editClickHandle"
        ></section>

        <div class="send-button">
          <div class="send-button-left">
            <span>按下Enter发送&nbsp;&nbsp;&nbsp;按下Ctrl+Enter换行</span>
            <button @click="sendHandle()">发送</button>
          </div>
        </div>
      </div>
    </div>
    <input id="file" ref="file" type="file" hidden />

    <a-modal
      v-model="showImg"
      :centered="true"
      :title="isPasteOnlyImg ? '发送图片' : '发送文件'"
      wrap-class-name="vertical-center-modal"
    >
      <template #footer>
        <span :style="{ color: '#ccc', fontSize: '12px', marginRight: '10px' }"
          >按下Enter发送</span
        >
        <a-button key="cancel" @click="ShowImgCancelHandle">取消</a-button>
        <a-button key="ok" type="primary" @click="ShowImgSendHandle"
          >发送</a-button
        >
      </template>
      <div class="show-file-box">
        <div class="img-show-box" v-if="isPasteOnlyImg">
          <img :src="showPasteFileList[0].showUrl" ref="showImgTarget" alt />
          <p>
            <span v-text="showPasteFileList[0].name"></span>&nbsp;&nbsp;
            <span>
              {{ showPasteFileList[0].size | sizeformat }}
            </span>
          </p>
        </div>
        <div v-else class="file-show-list">
          <div
            v-for="(file, index) of showPasteFileList"
            :key="`paste-file-${index}`"
            class="file-show-item"
          >
            <img
              v-if="(file.mime || '').includes('image')"
              :src="file.showUrl"
              alt
            />
            <div v-else class="file-icon" :class="file.showUrl"></div>
            <div class="file-info">
              <p v-text="file.name" :title="file.name"></p>
              <p>{{ file.size | sizeformat }}</p>
            </div>
            <a-icon
              class="close-button"
              type="close"
              @click="deleteFileHandler(index)"
            />
          </div>
        </div>
      </div>
    </a-modal>

    <!-- <a-modal
      v-model="isSelectPaste"
      title="选择粘贴的形式"
      wrap-class-name="select-paste-modal"
      :centered="true"
    >
      <div class="show-file-box">
        <div class="img-show-box">
          <img :src="selectPasteShowUrl" alt="" />
        </div>
      </div>
      <div slot="footer">
        <a-button @click="selectPasteHandler(1)">保留文字</a-button>
        <a-button @click="selectPasteHandler(2)" type="primary"
          >转为图片</a-button
        >
      </div>
    </a-modal>-->

    <a-modal
      v-model="showHintOpt.show"
      :title="showHintOpt.title"
      :centered="true"
      wrap-class-name="vertical-center-modal"
      @ok="hintOperateHandle('ok')"
      @cancel="hintOperateHandle('cancel')"
      :cancelButtonProps="{ style: { display: 'none' } }"
      ok-text="确定"
    >
      <div class="show-hint-box">
        <p v-text="showHintOpt.content"></p>
      </div>
    </a-modal>

    <select-emoji
      v-if="emojiState"
      class="select-emoji"
      :style="`right: ${emojiPanel.right}px; bottom: ${emojiPanel.bottom}px;`"
      @selectEmoji="selectface"
    ></select-emoji>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { Message } from "iview";
import { Util, Edit } from "../../../plugin";
import { MessageModel, Emoji, ConversationModel } from "../../../WebIM";

import selectEmoji from "@/components/chitchat/sendbox/select-emoji";
import { ipcRenderer, clipboard } from "electron";
const remote = require("@electron/remote");
import { promises, constants, createReadStream, read } from "fs";
import FileType from "file-type";
import path from "path";

import { localImgToThumbnail } from "../../../../lib/utils";
import ClipboardJS from "../../../plugin/clipboard";
import { resolve } from "dns";
import SvgIcon from "../../common/svg-icon.vue";

const { stat, access, lstat, readdir, readFile, open } = promises;

const { Menu, MenuItem } = remote;

const { browser, throttle, getFileTypeByName } = Util;
const { pleaseCaretAtEnd, restoreSelection, deleteRange, pleaseBr } = Edit;

export default {
  name: "SendBox",
  components: { selectEmoji, SvgIcon },
  props: {
    mentionPeople: {
      type: Object,
      default: () => {
        return {};
      }
    },
    ShowPeopleList: { type: Boolean } // 是否显示了@人列表
  },
  data() {
    return {
      MessageModel,
      ConversationModel,
      emojiState: false, // 选择表情是否显示
      EditBlurSelect: "", // 保存编辑框失焦时的光标位置
      EmojiSelect: "", // 是否应该使用焦点
      pasteImg: {},
      showPasteFileList: [], // 展示粘贴的文件
      imgBlobsUrl: "",
      showImg: false,
      editFocus: "",
      IsContenteditable: true,
      EditOffset: {
        start: 0,
        end: 0
      },
      peopleList: [], //@某人列表展示
      originPeopleList: [],
      aSomeOneList: [], //@的某人
      pasteNode: null, //粘贴的节点
      selectPasteShowUrl: "", // 选择粘贴形式时展示图片的链接
      isSelectPaste: false, // 控制是否进行选择粘贴形式
      showHintOpt: {
        show: false, // 控制提示弹窗的展示隐藏
        title: "提示",
        content: "",
        ok: null // 确定按钮回调注册
      }, // 提示弹窗配置
      isScreenCapture: false, // 是否已经打开截图
      jietupopvisible: false, // 用于控制截图pop窗关闭显示
      isMaximized: false, //窗口是否是最大化
      emojiPanel: {
        bottom: 0,
        right: 0
      },
      screenshortKey: "",
      platform: process.platform,
      showAllScreen: false, //是否全屏输入
      isShowTooltip: false,
      observeInstance: null
    };
  },
  mounted() {
    const { captureComplete, initShortcut } = this;
    /**
     * 监听截图传递事件，做对应处理
     */
    ipcRenderer.on("capture-complete", captureComplete);
    ipcRenderer.on("update-global-shortcut", initShortcut);
    this.initRange();
    this.initObserve();
    initShortcut();
    document.onkeydown = e => {
      if (e.keyCode === 13 && this.showImg) {
        this.ShowImgSendHandle();
      }
    };
  },
  beforeDestroy() {
    ipcRenderer.off("capture-complete", this.captureComplete);
    ipcRenderer.off("update-global-shortcut", this.initShortcut);
  },
  activated() {
    this.initRange();
  },
  computed: {
    ...mapGetters({
      dialogType: "GetChitchatType",
      OpenDialog: "GetOpenDialog",
      GetCompany: "GetCompany",
      groups: "GetGroups",
      GetSendUser: "GetSendUser",
      GetAllUserMap: "GetAllUserMap",
      GetNotCorpUsers: "GetNotCorpUsers",
      GetNoRelateUser: "GetNoRelateUser",
      GetDraftListMap: "GetDraftListMap"
    }),
    sendToId() {
      // 监测会话窗的名字是否变化
      return this.OpenDialog.id;
    },
    name() {
      let txt = this.OpenDialog.name;
      return txt;
    },
    /**
     * 是否仅展示图片
     */
    isPasteOnlyImg() {
      const { showPasteFileList } = this;
      let flag =
        showPasteFileList.length === 1 &&
        (showPasteFileList[0].mime || "").includes("image");

      return flag;
    },
    /**
     * 如果当前打开会话是群组，获取群组信息
     */
    currentGroup() {
      const { groups, OpenDialog } = this;
      let info = {};
      if (
        OpenDialog.conversationType ===
        ConversationModel.IMConversationEnum.GROUP
      ) {
        info = groups[OpenDialog.id] || {};
      }

      return info;
    },
    /**
     * 类型Id拼接key
     */
    currentTypeKey() {
      const typeKey = `${this.OpenDialog.conversationType}_${this.OpenDialog.id}`;
      return typeKey;
    },
    isSendSelf() {
      return (
        this.OpenDialog.conversationType ===
          ConversationModel.IMConversationEnum.PRIVATE &&
        this.OpenDialog.id === this.GetSendUser.id
      );
    }
  },
  watch: {
    $route(route) {
      if (route.name == "chitchat") {
        this.initRange();
      }
    },
    sendToId(val) {
      // 监测会话窗的名字是否变化
      // 变化时关闭表情选择面板，清空输入框
      this.emojiState = false;
      let br = "";
      this.$refs.edit.innerHTML = br;
      this.initRange();
    },
    emojiState(val) {
      if (val) {
        window.addEventListener("click", this.closeSelectEmoji);
      } else {
        window.removeEventListener("click", this.closeSelectEmoji);
      }
    },
    mentionPeople: {
      deep: true,
      handler(val, old) {
        if (val) {
          this.setAtData(val);
        }
      }
    },
    EditBlurSelect: {
      deep: true,
      handler(val, old) {
        if (this.OpenDialog && this.OpenDialog.id) {
          this.sendHandle(2); // 内容变化时保存草稿
          let node = val.commonAncestorContainer;
          let str = node.data;
          if (str) {
            str = str.substring(0, val.endOffset);
            this.handleContentChange(str, val);
          } else {
            this.changeAtPeopleListState("close");
          }
        }
      }
    },
    pasteNode: {
      deep: true,
      handler(val, old) {
        if (!!val) {
          try {
            let spanRange = new Range();
            spanRange.setStart(val.childNodes[0], val.innerHTML.length);
            spanRange.setEnd(val.childNodes[0], val.innerHTML.length);
            if (!!spanRange.commonAncestorContainer.data) {
              let str = spanRange.commonAncestorContainer.data.substring(
                0,
                spanRange.endOffset
              );
              this.handleContentChange(str, spanRange);
            }
          } catch (error) {}
        }
      }
    },
    showImg(val) {
      if (!val) {
        this.imgBlobsUrl = "";
        this.IsContenteditable = true;
      }
    }
  },
  methods: {
    ...mapActions({
      SendMessage: "SendMessage",
      UpSendStatus: "UpSendStatus",
      SetIsGetHistoryStatus: "SetIsGetHistoryStatus",
      SetDraftListMap: "SetDraftListMap"
    }),
    /**
     * 对编辑框创建监听
     */
    initObserve() {
      this.observeInstance = new MutationObserver(this.observeCallback);
    },
    startObserve() {
      this.$nextTick(() => {
        let target = document.getElementById("edit");
        this.observeInstance.observe(target, {
          childList: true, // 子节点变化
          subtree: true, // 扩展监视范围到目标节点下的整个子树的所有节点
          characterData: true, // 监视指定目标节点或子节点树中节点所包含的字符数据的变化
          characterDataOldValue: true, // 在文本在受监视节点上发生更改时记录节点文本的先前值
          attributes: true // 观察受监视元素的属性值变更
        });
      });
    },
    // 插入@
    insertATa() {
      this.$nextTick(() => {
        let node = document.createElement("span");
        node.innerText = "@";
        let range = this.EditBlurSelect;
        if (range) {
          range.insertNode(node);
          restoreSelection(range, false);
          this.setEditScroll();
          this.pasteNode = node;
        }
      });
      // 收起行动中心列表
      this.$root.$emit("action-list-close");
    },
    async handleContentChange(str, range) {
      if (
        this.OpenDialog.conversationType !==
        ConversationModel.IMConversationEnum.GROUP
      ) {
        return false;
      }
      if (this.originPeopleList.length) {
        this.peopleList = [...this.originPeopleList];
      } else {
        await this.initList();
      }
      if (str && str.charAt(str.length - 1) === "@") {
        // 当前光标前的文本为@符号时
        this.changeAtPeopleListState("show", {
          data: this.peopleList,
          range: range
        });
      } else {
        if (
          str &&
          str.length > 0 &&
          str.includes("@") &&
          !str.includes(String.fromCharCode(0))
        ) {
          let name = str.substring(str.lastIndexOf("@") + 1);
          this.peopleList = this.peopleList.filter(
            item => item.name && item.name.includes(name)
          );
          if (this.peopleList.length > 0) {
            this.changeAtPeopleListState("show", {
              data: this.peopleList,
              range: range
            });
          } else {
            this.changeAtPeopleListState("close");
          }
        } else {
          this.changeAtPeopleListState("close");
        }
      }
    },
    async getUserName(id) {
      let user =
        this.GetAllUserMap[id] ||
        this.GetNotCorpUsers[id] ||
        this.GetNoRelateUser[id];
      if (!user) {
        try {
          const res = await this.$service.getAccountInformationOrganization.call(
            this,
            {
              id
            }
          );
          if (res) {
            user = res;
          }
        } catch (error) {
          console.log(error, "获取用户信息失败");
        }
      }
      let name = user ? user.name || user.nickName : id;
      return name;
    },
    inputHandle(e) {
      this.pasteNode = null;
      this.saveSelection();
    },
    keyDownHandle(ev) {
      let e = ev || event || window.event;
      const { keyCode, ctrlKey, altKey } = e;
      const { checkAtHandler, ShowPeopleList } = this;
      switch (keyCode) {
        case 8:
          // 退格、删除键，keypress无法监听，使用keydown
          checkAtHandler();
          break;
        case 37: // ←
        case 39: // →
          ShowPeopleList && e.preventDefault();
          break;
        case 38: // ↑
          ShowPeopleList && this.$emit("switch-array", { key: "up" });
          ShowPeopleList && e.preventDefault();
          break;
        case 40: // ↓
          ShowPeopleList && this.$emit("switch-array", { key: "down" });
          ShowPeopleList && e.preventDefault();
          break;
        case 27: // Esc
          this.$emit("showPeopleList", { isShow: false });
          break;
        default:
          break;
      }
    },
    editKeypressHandle(ev) {
      let e = ev || event || window.event;
      const { keyCode, ctrlKey, altKey } = e;
      const { sendHandle, ShowPeopleList } = this;
      switch (true) {
        case keyCode === 13 && !ctrlKey && !altKey:
          // 回车
          e.preventDefault(); // 取消事件默认行为
          if (ShowPeopleList) {
            this.$emit("select-people");
          } else {
            sendHandle(); // 进行消息发送
          }
          break;

        case (keyCode === 10 || keyCode === 13) && ctrlKey:
          // ctrl + enter进行换行
          pleaseBr();
          this.setEditScroll();
          break;

        case keyCode === 8:
          break;

        default:
          break;
      }
    },
    initRange(getDraft = true) {
      const edit = this.$refs.edit;
      if (getDraft) {
        let draft = this.getDraft();
        draft && (edit.innerHTML = draft);
      }

      if (edit.firstChild) {
        const range = document.createRange();
        range.selectNodeContents(edit);
        const selection = window.getSelection();
        selection.removeAllRanges();
        range.collapse(false);
        selection.addRange(range);
        this.setEditScroll();
      } else {
        edit.focus();
      }
      this.saveSelection();
    },
    /**
     * 获取草稿并进行处理展示
     */
    getDraft() {
      const { sendToId, OpenDialog } = this;
      const codeKey = Emoji.getCodeKey();

      let draft = RongIMLib.RongIMClient.getInstance().getTextMessageDraft(
        OpenDialog.conversationType,
        sendToId
      );
      draft && (draft = Emoji.symbolToHTML(draft));
      if (draft) {
        draft = draft.map(item => {
          let result =
            item.type === "txt"
              ? item.content
              : `<img src=${item.content} ${codeKey}=${item.code}>`;

          return result;
        });

        draft = draft.join("");
      }
      return draft;
    },
    editFocusHandle() {
      this.$emit("closeOperate");
      this.saveSelection();
    },
    editBlurHandle(e) {
      this.saveSelection();
    },
    editClickHandle(e) {
      // 收起行动中心列表
      this.$root.$emit("action-list-close");
      this.$nextTick(() => {
        this.saveSelection();
        this.emojiState = false;
      });
    },
    saveSelection() {
      try {
        const selection = window.getSelection();
        if (selection) {
          const EditBlurSelect = selection.getRangeAt(0);
          if (
            EditBlurSelect &&
            (EditBlurSelect.startContainer.contentEditable === "true" ||
              EditBlurSelect.startContainer.parentElement.contentEditable ===
                "true" ||
              EditBlurSelect.startContainer.nodeName === "#text")
          ) {
            this.EditOffset.start = this.EditBlurSelect.startOffset;
            this.EditOffset.end = this.EditBlurSelect.endOffset;
            this.EditBlurSelect = EditBlurSelect.cloneRange();
          }
        }
      } catch (error) {}
    },
    // 选择表情面板
    selectEmojiHandle(e) {
      // 收起行动中心列表
      this.$root.$emit("action-list-close");
      this.$nextTick(() => {
        // 计算表情弹窗的位置
        const { target } = e;
        let domRect = target.getBoundingClientRect();
        const { x, y, width } = domRect;
        let innerHeight = window.innerHeight;
        const innerWidth = window.innerWidth;
        this.$set(this.emojiPanel, "right", innerWidth - x - width - 14);
        this.$set(this.emojiPanel, "bottom", innerHeight - y + 5);

        this.emojiState = !this.emojiState;
        window.eventHub.$emit("native-click");
      });
    },
    selectface(face) {
      // 获取选择的表情
      try {
        const rang = this.EditBlurSelect;
        if (face.msg) {
          //插入表情的快捷文字
          let textNode = document.createElement("span");
          textNode.append(face.msg);
          rang.insertNode(textNode);
        }
        let node = document.createElement("img");
        node.src = face.path;
        node.setAttribute(Emoji.getCodeKey(), face.content);
        rang.insertNode(node);
        restoreSelection(rang, false);
        node.scrollIntoViewIfNeeded(false);
        // 表情存储草稿
        this.sendHandle(2);
      } catch (error) {}
    },
    closeSelectEmoji() {
      this.emojiState = false;
    },
    /**
     * 发送处理事件
     * @param type {Number} 发送类型，1：发送，2：保存草稿
     */
    sendHandle(type = 1) {
      const { formatText, sendText, changeDaft } = this;
      let editBox = document.getElementById("edit");
      // 发送文本消息，触发事件，将要发送的信息进行处理，然后传递给发送函数
      let content = editBox.innerHTML;
      const result = formatText(content);
      content = result.text;
      if (type === 2) {
        changeDaft(1, content);
      } else {
        /**
         * 复制表情 粘贴删掉 再粘贴 会多出一个br 此处if判断用于删掉这种情况下的br
         * 手动ctrl+enter输入的回车不会删掉
         * 注释：发现回车一次在移动端多出了一行 在PC端没有多出
         */
        if (
          editBox.childNodes.length == 2 &&
          editBox.childNodes[0].innerHTML &&
          editBox.childNodes[0].innerHTML.includes("data-zhixin-emoji-text") &&
          editBox.childNodes[1].nodeName == "BR"
        ) {
          content = content.substring(0, content.length - 1);
        }
        sendText(content); // 发送
        changeDaft(2);
        editBox.innerHTML = "";
        this.emojiState = false;
        this.changeSendBoxHeight("min");
        this.showAllScreen = false;
      }
    },
    sendText(data) {
      // 发送文本消息
      data = data;
      let trimstr = data.trim();
      if (!trimstr) {
        this.hintMessage("不能发送空白消息");
        return false;
      }
      if (data.length > 1000) {
        let name = "";
        for (const char of trimstr) {
          if (char.charCodeAt(0) > 64) {
            name += char;
          }
          if (name.length >= 12) {
            break;
          }
        }

        name = `${name}_${this.$moment().format("YYYYMMDDHHmm")}.txt`;

        let buffer = Buffer.from(data, "utf-8");
        let sendInfo = {
          name,
          buffer,
          size: buffer.length,
          type: "txt",
          isBlob: false,
          isLocal: true
        };
        this.sendFileSure(sendInfo);
      } else {
        let extendData = null;
        let source = { data };
        if (this.aSomeOneList.length > 0) {
          let mentioneds = new RongIMLib.MentionedInfo(); // @消息对象
          extendData = {
            isMentiondMsg: true,
            appData: null,
            methodType: null
          };

          let userIdList = this.aSomeOneList.map(item => {
            if (data.includes(`@${item.name}`)) {
              return item.id;
            }
          });
          userIdList = userIdList.filter(id => id !== undefined);
          userIdList = [...new Set(userIdList)];
          if (userIdList.length) {
            if (userIdList.includes(0)) {
              mentioneds.type = RongIMLib.MentionedType.ALL;
            } else {
              mentioneds.type = RongIMLib.MentionedType.PART;
              mentioneds.userIdList = userIdList;
            }
            source.mentionedInfo = mentioneds;
          } else {
            extendData.isMentiondMsg = false;
          }
        }
        this.aSomeOneList = [];
        this.sendActions(
          source,
          this.MessageModel.MessageType.TextMessage,
          extendData
        );
      }
    },
    /**
     * @description 改变草稿的值
     * @param type {Number} 操作类型，1：保存，2：清空
     * @param data {String} 草稿内容，清空草稿为空
     */
    changeDaft(type = 1, data = "") {
      const { sendToId, OpenDialog } = this;
      const instance = RongIMLib.RongIMClient.getInstance();
      const draft = this.GetDraftListMap || new Map();
      if (data === "" || type === 2) {
        instance.clearTextMessageDraft(OpenDialog.conversationType, sendToId);
        draft.delete(OpenDialog.id);
      } else {
        instance.saveTextMessageDraft(
          OpenDialog.conversationType,
          sendToId,
          data
        );
        draft.set(OpenDialog.id, data);
        this.SetDraftListMap(draft);
      }
    },
    selectFileHandle() {
      // 发送文件(包括图片)
      this.emojiState = false;
      let self = this;
      let inputFile = document.getElementById("file");
      inputFile.onchange = function() {
        if (!inputFile.value) {
          return false;
        }
        const file = inputFile.files[0];
        self.sendFileByLocal([file.path], false);
        inputFile.value = "";
      };
      inputFile.click();
    },
    screenCaptureHandler(eve, type = "default") {
      // 截屏
      const { shiftKey } = eve;
      const { isScreenCapture } = this;
      const currentWindow = remote.getCurrentWindow();
      if (currentWindow.isMaximized() && (type === "hidden" || shiftKey)) {
        this.isMaximized = true;
      } else {
        this.isMaximized = false;
      }
      if (!isScreenCapture) {
        (type === "hidden" || shiftKey) && ipcRenderer.send("minimize");
        ipcRenderer.send("capture-screen", { hotKey: this.screenshortKey });
        this.isScreenCapture = true;
        this.jietupopvisible = false;
      }
    },
    async pasteHandle(e) {
      /**
       * 粘贴事件处理
       * 格式化文本，粘贴发送图片
       */
      e.preventDefault();
      let data = await ClipboardJS.readData({ selectImgOrText: true });

      for (const item of data) {
        switch (item.type) {
          case "image":
            this.pasteImage(item.content);
            break;
          case "file":
            this.sendFileByLocal([item.content.filePath]);
            break;
          case "html":
          case "text":
            let isMail = await this.isFileFromMail();
            if (isMail) {
              this.pasteFileFromMail();
            } else {
              this.pasteTextOrHtml();
            }
            break;
        }
        break;
      }
      this.sendHandle(2); // 粘贴后保存草稿
    },
    /**
     * 使用本地路径发送文件
     * @param {String[]} paths 本地路径数组
     * @param {Boolean} isShow 是否展示提示框
     */
    async sendFileByLocal(paths, isShow = true) {
      console.time("send file by local!!");
      try {
        if (paths && paths.length) {
          let fileList = [];
          for (const filePath of paths) {
            try {
              console.time("send file by local stat!!");
              let fileState = await stat(filePath);
              console.timeEnd("send file by local stat!!");

              if (fileState.isFile()) {
                let name = path.basename(filePath) || "";
                if (!this.checkFileSize(fileState.size, name)) return;

                console.time("send file by local type!!");
                let type = (await FileType.fromFile(filePath)) || {};
                console.timeEnd("send file by local type!!");

                let sendInfo = {};
                let temptype = getFileTypeByName(name);
                type = temptype ? { ...type, ext: temptype } : { ...type };
                switch (true) {
                  case !type:
                    continue;
                  case (type.mime || "").includes("image"):
                    let base64Res = await localImgToThumbnail(filePath, 10000);
                    sendInfo = {
                      base64: base64Res,
                      showUrl: base64Res.base64
                    };
                    break;

                  default:
                    let fileIcon = this.$myUtils.getFileIconClass(
                      temptype || type.ext
                    );
                    sendInfo = {
                      showUrl: fileIcon
                    };
                }

                sendInfo = {
                  isLocal: true,
                  path: filePath,
                  type: type.ext,
                  mime: type.mime,
                  name,
                  size: fileState.size,
                  ...sendInfo
                };

                fileList.push(sendInfo);

                // 不展示直接发送
                !isShow && this.sendFileSure(sendInfo);
              } else {
                this.showHintOpt.title = "提示";
                this.showHintOpt.content = "不能发送文件夹";
                this.showHintOpt.show = true;
              }
            } catch (error) {
              console.error(error);
            }
          }

          // 展示弹框，用户可取消，点击发送后发送
          if (isShow) {
            fileList.length && this.showPasteImg(fileList);
          }
        }
      } catch (error) {
      } finally {
      }
      console.timeEnd("send file by local!!");
    },
    async isFileFromMail() {
      let result = false;
      try {
        const { readText } = clipboard;
        let jsonStr = readText("clipboard");
        let jsonObj = JSON.parse(jsonStr);
        if (
          jsonObj.type == "file" &&
          jsonObj.fileData &&
          jsonObj.fileData.length > 0
        ) {
          result = true;
        }
      } catch (err) {
        result = false;
      } finally {
        return result;
      }
    },
    async pasteFileFromMail() {
      // 粘贴文本处理
      try {
        const { readText } = clipboard;
        let jsonStr = readText("clipboard");
        let jsonObj = JSON.parse(jsonStr);
        let list = jsonObj.fileData;
        this.showPasteFileList = list.map(item => {
          return {
            ...item,
            name: item.fileName,
            size: parseInt(item.fileSize || "0"),
            type: item.fileType,
            isLocal: false,
            showUrl: this.$myUtils.getFileIconClass(item.fileType || ""),
            fileUrl: item.url
          };
        });
        this.showImg = true;
      } catch (err) {
        // console.error(err)
      }
    },
    async pasteTextOrHtml() {
      // 粘贴文本处理
      const { readText, readHTML } = clipboard;
      let text = readText("clipboard");
      let htmlContent = readHTML("clipboard");
      let selection; // 获取光标的位置
      let range; // 获取选中的内容
      let emojiKey = Emoji.getCodeKey();

      let textNode = document.createElement("span");

      if (htmlContent.includes(emojiKey)) {
        let textArr = this.formatPasteText(htmlContent);
        textArr.forEach(item => {
          if (item.type === "img") {
            textNode.innerHTML += item.content;
          } else {
            // textNode.append(item.content);
            textNode.innerHTML += item.content.replace(
              /(\r\n)|(\n)|(\r)/g,
              "<br>"
            );
          }
        });
      } else {
        // textNode.append(text);
        textNode.innerHTML += text.replace(/(\r\n)|(\n)|(\r)/g, "<br>");
      }
      selection = window.getSelection();
      range = selection.getRangeAt(0);

      if (range.toString()) {
        // 有选中内容，删除
        range.deleteContents();
      }
      range.insertNode(textNode); // 插入粘贴内容

      if (range) {
        restoreSelection(range, false);
        this.pasteNode = textNode;
      } else if (this.EditBlurSelect) {
        restoreSelection(this.EditBlurSelect, false);
      } else {
        pleaseCaretAtEnd(edit);
      }
      this.setEditScroll(edit);
    },
    /**
     * 粘贴图片，获取到的为buffer
     */
    async pasteImage(data) {
      // 粘贴图片
      let imgToPng;
      if (data) {
        imgToPng = data.buffer;
      } else {
        const { readImage } = clipboard;
        const { platform } = process;

        let image = readImage("clipboard");
        imgToPng = image.toPNG();
      }

      let type = await FileType.fromBuffer(imgToPng);

      if (imgToPng.length) {
        let base64Res = await localImgToThumbnail(Buffer.from(imgToPng), 10000);
        type = type || { ext: "png", mime: "image/png" };
        this.showPasteImg([
          {
            isLocal: true,
            buffer: imgToPng,
            base64: base64Res,
            showUrl: base64Res.base64,
            type: type.ext,
            mime: type.mime,
            size: imgToPng.length
          }
        ]);
      }
    },
    selectPasteHandler(type) {
      this.isSelectPaste = false;
      switch (type) {
        case 1:
          this.pasteTextOrHtml();
          break;

        case 2:
          this.pasteImage();
          break;

        default:
          this.pasteTextOrHtml();
          break;
      }
    },
    setEditScroll() {
      let editBox = document.getElementById("edit");
      let selection = window.getSelection();
      editBox.scrollTop = editBox.scrollHeight;
    },
    dropHandle(ev) {
      // 拖拽发送
      let e = ev || window.event;
      e.preventDefault();
      let items = e.dataTransfer.items || e.dataTransfer.files;
      let files = [];
      let isExistDirectory = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let file = item.getAsFile();
        let entryInfo = item.webkitGetAsEntry();
        if (files.length < 20) {
          file &&
            (entryInfo.isFile
              ? this.checkFileSize(file.size, file.name)
                ? files.push(file)
                : ""
              : entryInfo.isDirectory
              ? isExistDirectory.push(file)
              : "");
        } else {
          this.$Message.error("文件不能超过20个");
          break;
        }
      }
      let filePath = files.map(file => file.path);
      if (isExistDirectory.length) {
        this.showHintOpt.title = "拖拽文件";
        this.showHintOpt.content = "不能拖拽文件夹";
        const bindSend = this.sendFileByLocal.bind(this, filePath);
        this.showHintOpt.ok = bindSend;
        this.showHintOpt.cancel = bindSend;
        this.showHintOpt.show = true;
      } else {
        this.sendFileByLocal(filePath);
      }
    },
    showPasteImg(data) {
      this.showPasteFileList = data;
      this.showImg = true;
      this.IsContenteditable = false;
    },
    ShowImgSendHandle() {
      this.showImg = false;
      this.showPasteFileList.forEach(file => {
        delete file.showUrl;
        this.sendFileSure(file);
      });
      this.showPasteFileList = [];
      restoreSelection(this.EditBlurSelect, false);
    },
    ShowImgCancelHandle() {
      this.showImg = false;
    },
    deleteFileHandler(index) {
      // 删除粘贴文件列表中的文件
      this.showPasteFileList.splice(index, 1);
      !this.showPasteFileList.length &&
        setTimeout(() => {
          this.showImg = false;
        }, 300);
    },
    sendFileSure(file) {
      // 确定发送文件
      const { checkFileSize } = this;
      if (checkFileSize(file.size)) {
        let messageType = null;
        let mime = file.mime || file.type || "";
        if (mime.includes("image")) {
          messageType =
            mime === "image/gif"
              ? MessageModel.MessageType.ZXGIFMsg
              : this.MessageModel.MessageType.ImageMessage;
        } else {
          messageType = this.MessageModel.MessageType.FileMessage;
        }
        this.sendActions(
          {
            base64: file.base64,
            buffer: file.buffer,
            path: file.path,
            fileUrl: file.fileUrl,
            name: file.name,
            size: file.size,
            type: file.type,
            isLocal: file.isLocal
          },
          messageType
        );
      }
    },
    sendActions(source, messageType, extendData = {}) {
      this.SetIsGetHistoryStatus({
        key: this.currentTypeKey,
        status: false
      });
      this.$service.DistributeSendMessage.call(this, {
        conversationType: this.OpenDialog.conversationType,
        targetId: this.sendToId,
        senderUserId: this.GetSendUser.id,
        source,
        messageType,
        extendData: { ...extendData }
      });
      window.eventHub.$emit("send-hander", {
        id: this.OpenDialog.id,
        conversationType: this.OpenDialog.conversationType
      });
    },
    formatText(text) {
      text = this.tagFilter(text)
        .replace(new RegExp("&lt;", "gi"), "<")
        .replace(new RegExp("&gt;", "gi"), ">")
        .replace(new RegExp("&quot;", "gi"), "@")
        .replace(new RegExp("&copy;", "gi"), "©")
        .replace(new RegExp("&nbsp;", "gi"), " ")
        .replace(new RegExp("&amp;", "gi"), "&"); // & 必须放到最后处理
      if (
        text.search(new RegExp(`<img(.*?)${Emoji.getCodeKey()}="`, "gi")) > -1
      ) {
        text = text.replace(
          new RegExp(`<img(.*?)${Emoji.getCodeKey()}="(.*?)"(.*?)>`, "gi"),
          e => {
            const emoji = e.split(
              new RegExp(`${Emoji.getCodeKey()}="(.*?)"`, "gi")
            );
            return emoji[1];
          }
        );
      }
      return { text };
    },
    formatPasteText(htmlContent) {
      let text = htmlContent;
      text = text.replace(new RegExp(/<![^>]+StartFragment[^>]+>/, "i"), "");
      text = this.tagFilter(text).trim();
      let matchIterator = text.matchAll(/<img [^<>]*src="([^<>"]+)"[^<>]*>/gi);

      let textArr = [],
        start = 0;
      for (const item of matchIterator) {
        const { 0: content, index } = item;
        const end = index + content.length;
        if (start !== index) {
          textArr.push({ type: "text", content: text.substring(start, index) });
        }
        start = end;
        //拿到自己复制表情的编码
        let temp_code = content.replace(
          /<img [^<>]*data-zhixin-emoji-text="([^<>"]+)"[^<>]*>/gi,
          (e, src) => {
            return src;
          }
        );
        let temp_text = content.replace(
          /<img [^<>]*src="([^<>"]+)"[^<>]*>/gi,
          (e, src) => {
            let emojiName = src.replace(/.*(?=\/faces)/gi, "");
            return this.getEmojiImg(emojiName, temp_code);
          }
        );
        textArr.push({ type: "img", content: temp_text });
      }

      if (start !== text.length) {
        textArr.push({ type: "text", content: text.substring(start) });
      }
      return textArr;
    },
    tagFilter(text) {
      const result = text
        .replace(new RegExp('style="[^<>/]+;"', "gi"), "")
        .replace(new RegExp("^(<(table|tbody|p|tr|h[1-6])[^<>]*>)+", "gi"), "")
        .replace(
          new RegExp(
            "<(table|tbody|br|tr|div|p|h[1-6])[^<>img]*>|</(table|tbody|br|tr|div|p|h[1-6])>",
            "gi"
          ),
          "\n"
        )
        .replace(new RegExp("<(?!img|.\\)\\])[^<>]+?>", "gi"), "")
        .replace(new RegExp("<img[^<>]*>", "gi"), e => {
          return new RegExp(Emoji.getCodeKey(), "gi").test(e) ? e : "";
        });

      return result;
    },
    /**
     * emojiName: "/faces/赞.png"
     * emojicode: "[赞]"
     * 用传过来的编码组成新的img标签
     * 原先通过Emoji.pathToSymbol()方法重新获取编码 因为汉字乱码 导致找不到对应编码 以致于发出复制的消息后图片消失
     */
    getEmojiImg(emojiName, emojicode) {
      return `<img src="${
        this.$apipath.emojiPath.root
      }${emojiName}" ${Emoji.getCodeKey()}="${emojicode}">`;
    },
    hintMessage: throttle(text => {
      Message.warning(text);
    }, 500),
    maxFilter(val) {
      let txt = val;
      if (val.length >= 15) {
        txt = `${val.substr(0, 14)}...`;
      }
      return txt;
    },
    /**
     * 提示弹窗操作处理
     */
    hintOperateHandle(type) {
      const { showHintOpt } = this;
      this.showHintOpt.show = false;
      switch (type) {
        case "ok":
          const okHandle = showHintOpt.ok || new Function();
          okHandle();
          break;

        case "cancel":
          const cancelHandle = showHintOpt.cancel || new Function();
          cancelHandle();
          break;

        default:
          break;
      }
    },
    /**
     * 检测文件大小是否超标
     */
    checkFileSize(size, name = "", limit = 200) {
      let result = null;
      if (size > limit * 1024 * 1024) {
        this.$Message.warning({
          content: `文件${name}大于${limit}M，不能发送!`,
          duration: 2
        });
        result = false;
      } else {
        result = true;
      }

      return result;
    },
    /**
     * 更改'@'人选择列表状态
     */
    changeAtPeopleListState(type, data) {
      const { ShowPeopleList } = this;
      switch (type) {
        case "close":
          ShowPeopleList && this.$emit("showPeopleList", { isShow: false });
          break;

        case "show":
          // this.$emit("showPeopleList", { isShow: true, ...data });
          this.$emit("showPeopleList", { isShow: true, range: data.range, data: JSON.parse(JSON.stringify(data.data)) });
          break;
      }
    },
    /**
     * 用户选择‘@’人处理
     */
    async setAtData(data) {
      this.observeInstance.disconnect();
      const {
        OpenDialog,
        currentGroup,
        GetSendUser,
        $Message,
        selectAtNode
      } = this;
      if (data.id === 0) {
        // @所有人
        await this.$service.groupInfoApi({ id: OpenDialog.id });
        if (
          currentGroup.onlyOwnerAtAll === 1 &&
          currentGroup.owner !== GetSendUser.id
        ) {
          $Message.warning("您无权限@所有人");
          return false;
        }
      }
      if (this.aSomeOneList.filter(item => item.id === data.id).length <= 0) {
        this.aSomeOneList.push(data);
      }
      if (Object.keys(data).length > 0) {
        const rang = this.EditBlurSelect;
        let deletRange = new Range();
        if (!!this.pasteNode) {
          let length = this.pasteNode.innerHTML.length;
          let childnode = this.pasteNode.childNodes[0];
          deletRange.setStart(childnode, length >= 1 ? length - 1 : 0);
          deletRange.setEnd(childnode, length);
        } else {
          let editBox = rang.commonAncestorContainer;
          let endOffset = rang.endOffset;
          let value = editBox.nodeValue.substring(0, endOffset);
          let start = value.lastIndexOf("@");
          deletRange.setStart(editBox, start);
          deletRange.setEnd(editBox, endOffset);
        }
        deletRange.deleteContents();
        restoreSelection(rang, false);
        let node = document.createElement("span");
        node.innerHTML = `<span class='blueText'>@${data.name}</span>`;
        node.setAttribute("class", "mentionBox");
        node.setAttribute("id", data.id);
        node.setAttribute("name", "mentionBox");
        rang.insertNode(node);
        node.onclick = e => {
          let parentNode = e.target.parentNode;
          selectAtNode(parentNode);
        };
        restoreSelection(rang, false);
        let nullNode = document.createElement("span");
        nullNode.innerHTML = " ";
        // nullNode.onclick = (e) => {
        //   let parentNode = e.target.previousElementSibling;
        //   selectAtNode(parentNode);
        // }
        rang.insertNode(nullNode);
        node.scrollIntoViewIfNeeded(false);
        restoreSelection(rang, false);
      }
      // @人保存草稿
      this.sendHandle(2);
    },
    /**
     *
     */
    selectAtNode(parentNode) {
      let totalRange = new Range();

      totalRange.setStart(parentNode, 0);
      totalRange.setEnd(parentNode, parentNode.childNodes.length);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(totalRange);
    },
    /**
     * 删除
     */
    checkAtHandler() {
      let rang = new Range();
      let node = window.getSelection().focusNode;
      let spanNode = null;
      let isOnlySomeOne = false;
      if (
        node.data == " " ||
        (node.data &&
          node.data.substring(0, 1) == " " &&
          window.getSelection().focusOffset == 1)
      ) {
        spanNode = node.parentNode.previousElementSibling;
      } else if (
        node.children &&
        node.children.length > 0 &&
        node.children.namedItem("mentionBox") != null &&
        node.lastChild.innerHTML == " "
      ) {
        spanNode = node.children && node.children.namedItem("mentionBox");
      } else if (
        node.className == "mentionBox" &&
        node.children &&
        node.childNodes.length == 1 &&
        node.childNodes[0].className == "blueText"
      ) {
        spanNode = node;
      } else if (
        node.children &&
        node.children.length == 2 &&
        node.children.namedItem("mentionBox") != null &&
        node.lastElementChild.innerHTML == " "
      ) {
        spanNode = node.children && node.children.namedItem("mentionBox");
        isOnlySomeOne = true;
      } else if (
        node.children &&
        node.childNodes.length == 3 &&
        node.children.namedItem("mentionBox") != null &&
        node.lastChild.nodeName == "FONT" &&
        node.lastChild.className.includes("hideSpan")
      ) {
        spanNode = node.children && node.children.namedItem("mentionBox");
        isOnlySomeOne = true;
      }
      if (!!spanNode && (spanNode.className == "mentionBox" || isOnlySomeOne)) {
        if (spanNode.id) {
          this.aSomeOneList = this.aSomeOneList.filter(
            item => item != spanNode.id
          );
        }
        rang.selectNodeContents(spanNode);
        deleteRange(rang);
      }
    },
    observeCallback(data) {
      const { saveSelection } = this;
      saveSelection();
    },
    /**
     * 截图输出
     */
    captureComplete(e, { type }) {
      const { pasteImage } = this;
      switch (type) {
        case "paste":
          // 进行粘贴处理
          this.$message.success("已复制");
          // 按照产品要求选择截屏图片后不再弹窗
          // if (this.$route.name !== "chitchat") {
          //   // 非当前页面不执行操作，防止快捷键截屏时出现发送确认
          //   return;
          // }
          // remote.getCurrentWindow().show();
          // pasteImage();
          // if (this.isMaximized) {
          //   ipcRenderer.send("maximize");
          // }
          break;
        case "show":
          // 截图编辑界面已全部展示
          setTimeout(() => {
            this.isScreenCapture = false;
          }, 200);
          break;
        default:
          break;
      }
    },
    async initShortcut() {
      const data = (await ipcRenderer.invoke("get-shortcut")) || {};
      this.screenshortKey = (data.screenshort || {}).showName || "";
    },
    async setEditContent(message) {
      // 根据mentionedInfo构造@列表aSomeOneList
      if (message.content.mentionedInfo) {
        if (message.content.mentionedInfo.type === 1) {
          this.aSomeOneList = [
            {
              id: 0,
              name: "所有人"
            },
            ...this.peopleList
          ];
        } else {
          let userList = [];
          message.content.mentionedInfo.userIdList.forEach(userId => {
            let target = this.peopleList.find(item => item.id === userId);
            if (target) {
              userList.push(target);
            }
          });
          this.aSomeOneList = userList;
        }
      }

      // 根据消息构建修改内容，注意表情需要将code转换成img标签，@人名需要高亮处理
      let content = [];
      if (message.content.emoji) {
        content = message.content.emojiContent;
      } else {
        content = [
          {
            type: "txt",
            content: message.content.content
          }
        ];
      }
      const codeKey = Emoji.getCodeKey();
      let value = [];
      if (content) {
        value = content.map(item => {
          let result =
            item.type === "txt"
              ? this.translateAtHandler(
                  item.content.replace(/(\r\n)|(\n)|(\r)/g, "<br>"),
                  this.aSomeOneList
                )
              : `<img src=${item.content} ${codeKey}=${item.code}>`;
          return result;
        });
        value.push(`<font class='hideSpan'></font>`); // 多添加一个空span防止光标问题
      }
      const edit = this.$refs.edit;
      edit.innerHTML = value.join("");
      // 为@人名元素添加点击选中事件
      const nodes = edit.getElementsByClassName("mentionBox");
      nodes.forEach(node => {
        node.onclick = e => {
          let parentNode = e.target.parentNode;
          this.selectAtNode(parentNode);
        };
      });

      this.sendHandle(2);
      this.initRange(false);
    },
    /**
     * 处理消息内容中的@人名部分，需要高亮显示
     */
    translateAtHandler(content, aSomeOneList) {
      // 按照“@+人名+空格”的格式对文本进行提取
      let userList = content.match(/(@\S+ )/g);
      if (userList) {
        userList.forEach(user => {
          const userName = user.replace(/^@/, "").replace(/ $/, "");
          // 如果@后面的文字在aSomeOneList中，说明是有效的用户名字，则高亮处理
          const target = aSomeOneList.find(item => item.name === userName);
          if (target) {
            content = content.replace(
              user,
              `<span class="mentionBox" name="mentionBox"><span class="blueText">@${userName}</span></span><span> </span>`
            );
          }
        });
      }
      return content;
    },
    async initList() {
      this.peopleList.splice(0);
      this.originPeopleList.splice(0);
      if (
        this.OpenDialog.conversationType ==
        ConversationModel.IMConversationEnum.GROUP
      ) {
        this.peopleList = await this.getPeopleList();
        this.peopleList.unshift({ name: "所有人", id: 0 });
        this.originPeopleList = [...this.peopleList];
      }
    },
    async getPeopleList() {
      let allPeopleList = [...this.currentGroup.groupMembers];
      allPeopleList.push(this.currentGroup.owner);
      let peopleIdList = allPeopleList.filter(
        item => item != this.GetSendUser.id
      );
      const peopleListAsync =
        peopleIdList.length > 0 &&
        peopleIdList.map(async item => {
          const name = await this.getUserName(item);
          // await new Promise((resolve) => setTimeout(resolve, 5000));
          return {
            name,
            id: item
          };
        });
      const peopleList = [];
      const currentGroupId = this.currentGroup.id;
      for await (const item of peopleListAsync) {
        const hasItem = peopleList.findIndex(people => people.id === item.id);
        if (hasItem < 0) {
          peopleList.push(item);
        }
      }
      let robotList = (this.currentGroup.groupRobots || []).map(item => {
        let data = {
          id: item.chatAccountId,
          name: item.chatRobotName,
          avatar: item.chatRobotImage
        };
        return data;
      });
      if (currentGroupId === this.currentGroup.id) {
        return [...robotList, ...peopleList];
      } else {
        return [...robotList];
      }
    },
    //快捷键改变发送消息输入框高度
    changeSendBoxHeight(type) {
      this.isShowTooltip = false;
      setTimeout(() => {
        this.$emit("changeSendBoxHeight", type);
        if (type == "max") {
          this.showAllScreen = true;
        } else {
          this.showAllScreen = false;
        }
      }, 50);
    },
    // 点击发送至后面的人或群组名，左侧会话滑动到对应位置
    scrollCurrentDialog() {
      const dialog = {
        id: this.OpenDialog.id,
        conversationType: this.OpenDialog.conversationType
      };
      window.eventHub.$emit("scroll-current-dialog-handler", dialog);
    },
    // 跳转行动中心
    handleActionCenter() {
      const path = `/create/${
        this.OpenDialog.conversationType ===
        this.ConversationModel.IMConversationEnum.GROUP
          ? "group"
          : "chat"
      }/${this.OpenDialog.id}`;
      ipcRenderer.invoke("open-operation-page", {
        to: "operation",
        data: { path }
      });
    }
  }
};
</script>

<style lang="scss">
$--top-height: 30px;
$--edit-width: calc(100% - 80px);
.send-container {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #eee;
  flex-direction: column;
  .conversation-sign {
    -webkit-touch-callout: none; /*系统默认菜单被禁用*/
    -webkit-user-select: none; /*webkit浏览器*/
    -khtml-user-select: none; /*早期浏览器*/
    -moz-user-select: none; /*火狐*/
    -ms-user-select: none; /*IE10*/
    user-select: none;
    flex: 0 0 40px;
    flex-shrink: 0;
    padding: {
      left: 16px;
      right: 6px;
    }
    display: flex;
    align-items: center;
    background: #fff;
    justify-content: space-between;
    .send-box-top {
      user-select: none;
      position: relative;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      .btn-icon {
        margin-right: 20px;
        color: #aaadbb;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        font-weight: 500;
        &.aTa {
          padding-bottom: 2px;
        }
        &:hover {
          color: #3e7eff;
        }
      }
      .focus-btn-icon {
        color: #4598f0;
      }
      .send-button-tip {
        display: flex;
        align-items: center;
        > p {
          font-size: 14px;
          font-weight: 400;
          color: #5d616b;
        }
        .margin0 {
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          font-size: 10px;
          margin: 0 6px;
          img {
            vertical-align: super;
          }
        }
        .name {
          overflow: hidden;
          white-space: pre-wrap;
          word-break: break-all;
          // font-size: 10px;
        }
        &:hover {
          * {
            cursor: pointer;
          }
        }
      }
    }
    .right-box {
      display: flex;
      align-items: center;
      img {
        width: 18px;
        height: 18px;
        margin: 10px;
      }
      &:hover {
        .open {
          content: url(~@/assets/image/chitchat/open-hover.png);
        }
        .close {
          content: url(~@/assets/image/chitchat/put-away-hover.png);
        }
      }
    }
  }
  .send-box {
    flex: 1;
    background-color: #fff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .send-box-body {
      flex: 1;
      background-color: #fff;
      display: flex;
      flex-direction: column;
      padding-bottom: 10px;
      overflow: hidden;
      .send-button {
        margin-right: 10px;
        text-align: right;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        -webkit-touch-callout: none; /*系统默认菜单被禁用*/
        -webkit-user-select: none; /*webkit浏览器*/
        -khtml-user-select: none; /*早期浏览器*/
        -moz-user-select: none; /*火狐*/
        -ms-user-select: none; /*IE10*/
        user-select: none;
        display: flex;
        justify-content: flex-end;
        .send-button-left {
          display: flex;
          align-items: center;
          > span {
            color: #c9cfd8;
            font-size: 10px;
            margin-left: 10px;
          }
          > button {
            border-radius: 4px;
            margin-left: 10px;
            width: 60px;
            height: 34px;
            border-radius: 4px;
            font-size: 14px;
            font-family: MicrosoftYaHeiUI;
            color: #ffffff;
          }
        }
      }
    }
    .editor {
      padding: 5px;
      width: 100%;
      flex: 1;
      z-index: inherit !important;
      outline: none;
      overflow: hidden auto;
      word-break: break-all;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      font-size: 14px;
      image-rendering: -webkit-optimize-contrast;
      &:empty::before {
        content: attr(placeholder);
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
      }
      img {
        width: 28px;
        height: 28px;
      }
      // .mentionBox {
      // }
      .blueText {
        color: #4598f0;
      }

      * {
        word-break: break-all;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  }

  /* 表情选择 */
  .select-emoji {
    position: fixed;
  }
  &.send-container-outsource {
    .send-box {
      .editor {
        caret-color: #36d18e;
      }
      .send-button-left {
        > button {
          background: #36d18e;
        }
      }
    }
    .send-box-top {
      .send-button-tip:hover {
        .name {
          color: #36d18e;
        }
      }
    }
  }
  &.send-container-organization {
    .send-box {
      .editor {
        caret-color: #3e7eff;
      }
      .send-button-left {
        > button {
          background: #3e7eff;
        }
      }
    }
    .send-box-top {
      .send-button-tip:hover {
        .name {
          color: #3e7eff;
        }
      }
    }
  }
}
// 附件弹层
.show-file-box {
  height: 300px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  overflow-y: auto;
  .img-show-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    > p {
      width: 100%;
      display: flex;
      justify-content: space-between;
      margin-top: 13px;

      > span {
        &:first-of-type {
          flex: 1;
          word-break: break-all;
        }
        &:nth-of-type(2) {
          flex-shrink: 0;
        }
      }
    }

    img {
      max-width: 100%;
    }
  }
  img {
    max-width: 100%;
    max-height: 100%;
  }

  .file-show-list {
    width: 100%;
    .file-show-item {
      width: 100%;
      height: 50px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 4px;
      border: 1px solid #e7e7e7;
      overflow: hidden;

      > img {
        flex-shrink: 0;
        width: 28px;
        max-height: 36px;
        margin: 0 10px;
        user-select: none;
      }
    }

    .close-button {
      flex-shrink: 0;
      margin: 0 15px;
      font-size: 9px;
      color: #7d8790;
      opacity: 0.9;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }

    .file-icon {
      flex-shrink: 0;
      width: 28px;
      height: 36px;
      margin: 0 10px;
      user-select: none;
    }

    .file-info {
      flex: 1;
      overflow: hidden;
      > p {
        font-size: 14px;
        color: #333;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        &:last-of-type {
          color: #999;
        }
      }
    }
  }
}

// 截图pop窗
.jietu-pop {
  .ant-popover-inner-content {
    padding: 0;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  button {
    height: 30px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: left;
    color: #333;
    font-weight: 500;
    border: 0;

    span {
      &.blue-color {
        color: #4498f0;
      }
    }
  }
}
</style>
