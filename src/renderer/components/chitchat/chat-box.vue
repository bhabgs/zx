<template>
  <div class="chat-box" ref="chatBox" :class="`chat-box-${dialogType}`">
    <div class="chat-head" @click="chatHeadClickHandle">
      <div
        class="chat-head-left"
        v-if="OpenDialog.conversationType === IMConversationEnum.GROUP"
      >
        <p class="item-name only-line">{{ OpenDialog.name }}</p>
        <span>（{{ OpenDialog.count }}人）</span>
        <group-sign :type="OpenDialog.groupType"></group-sign>
      </div>
      <div class="chat-head-left chat-head-private" v-else>
        <p
          class="item-name only-line"
          :class="{ 'no-point': OpenDialog.id === GetSendUser.id }"
          @click="showDetailHandle"
        >
          {{ OpenDialog.name }}
        </p>
        <div
          v-show="OpenDialog.id !== GetSendUser.id && currentPrivateUserCompany"
          class="chat-head-private-describe"
          @click="showDetailHandle"
        >
          <span
            v-text="currentPrivateUserCompany"
            :title="currentPrivateUserCompany"
          ></span>
          <button>更多</button>
        </div>
      </div>
      <div class="chat-operate chat-head-right">
        <action-center-icon
          v-if="!isSendSelf && !OpenDialog.id.includes('robot_')"
          class="!h-30px mr-10px !overflow-unset"
          :class="[
            actionCount && actionCount < 10
              ? '!min-w-32px'
              : actionCount >= 10
              ? '!min-w-36px'
              : '!min-w-30px'
          ]"
          :type="2"
          :targetId="actionTargetId"
          :actionChatType="actionChatType"
          :actionCount="actionCount"
          @select="handleOperateSelect"
        ></action-center-icon>
        <div
          v-for="item in operates"
          class="chat-operate-btn"
          :class="[item.type, item.type == currentSelect ? 'active' : '']"
          v-show="item.show"
          :key="item.type"
          :title="item.tip"
          data-operate
          @click="operateHandle(item.type)"
        ></div>
      </div>
    </div>
    <div class="chat-body" @click="closeOperate">
      <Alert
        class="alert-box"
        :type="alertOpt.type"
        show-icon
        v-if="alertOpt.show"
        >{{ alertOpt.message }}</Alert
      >
      <msg-list
        @alert="alertHandler"
        @closeOperate="closeOperate"
        @show-robot="showRobotInfoHandle"
        @edit-message="editMessageHandle"
        @multSelect="multSelect"
        @selectMessage="selectMessage"
        ref="messageList"
      ></msg-list>
    </div>
    <div
      class="chat-trigger-con"
      @mousedown="handleMousedown"
      :style="{ bottom: triggerBottom, height: `${triggerHeight}px` }"
    ></div>
    <div
      class="chat-edit"
      :style="{
        height: `${chatHeightValue * 100}%`
      }"
    >
      <!-- 转发时底部按钮 -->
      <div v-show="isMultSelect" class="mult-select-operate">
        <div
          v-for="item in multSelectOperate"
          :key="item.type"
          @click="multSelectOperateHandle(item.type)"
          class="mult-select-operate-btn"
          :class="[
            selectMessageList.length > 20 && item.type == 'single-send'
              ? 'not-allowed'
              : ''
          ]"
        >
          <div
            class="mult-select-operate-btn-icon"
            :class="{ transparent: item.type === 'quit' }"
          >
            <img :src="item.icon" alt="" />
          </div>
          <span class="mult-select-operate-btn-label">{{ item.label }}</span>
        </div>
      </div>
      <!-- 转发时底部按钮 -->
      <send-box
        v-show="!isMultSelect"
        ref="sendBox"
        @closeOperate="closeOperate"
        @showPeopleList="showPeopleList"
        :mention-people="mentionPeople"
        :ShowPeopleList="isShowPeopleList"
        @select-people="getPeople(tempSelectPeople)"
        @switch-array="switchSelectHandler"
        @changeSendBoxHeight="changeSendBoxHeight"
      ></send-box>
    </div>
    <!-- <transition name="fade" mode="in-out"> -->
    <div
      class="peopleList"
      v-show="isShowPeopleList"
      :style="peopleListStyle"
      ref="peopleList"
    >
      <div
        class="peopleItem"
        v-for="item in peopleList"
        :key="item.id"
        @click.stop="getPeople(item)"
        :class="{ select: item.id === tempSelectPeople.id }"
      >
        <user-photo
          v-if="item.id != 0 && (item.id || '').includes('robot')"
          slot="reference"
          class="user-icon"
          :user="item"
          :key="item.id"
        ></user-photo>
        <user-photo
          v-else-if="item.id != 0"
          slot="reference"
          class="user-icon"
          :user="item.id"
          key="row"
        ></user-photo>
        <div v-else class="allPeople">
          <div class="user-sign">
            <img src="~@/assets/image/common/allPeople.png" alt />
          </div>
        </div>
        <div class="userName">{{ item.name }}</div>
      </div>
    </div>
    <!-- </transition> -->
    <!-- 消息转发 -->
    <!-- <a-modal
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
    </a-modal> -->
    <!-- 消息转发 end -->
    <operate-dialog
      :openDialog="showDialog"
      :title="operateTitle"
      @close="closeOperate"
    >
      <!-- 聊天记录 -->
      <chat-records
        ref="chatRecords"
        v-show="showDialog && currentSelect == 'searchRecords'"
        @showMessage="showMessage"
      ></chat-records>
      <!-- 单聊设置 -->
      <single-setting
        v-if="
          showDialog &&
            currentSelect == 'setting' &&
            OpenDialog.conversationType !== IMConversationEnum.GROUP
        "
        :currentPrivateUserCompany="currentPrivateUserCompany"
      ></single-setting>
      <!-- 群聊设置 -->
      <group-setting
        v-if="
          showDialog &&
            currentSelect == 'setting' &&
            OpenDialog.conversationType === IMConversationEnum.GROUP
        "
        @close="closeOperate"
        @show-robot="showRobotInfoHandle"
      ></group-setting>
    </operate-dialog>
    <!-- 机器人详情 -->
    <transition name="darwerRight">
      <robot-info
        v-if="robotInfoVisible"
        :group="groupInfo"
        :robot="currentRobot"
        @close="
          () => {
            robotInfoVisible = false;
          }
        "
      ></robot-info>
    </transition>
    <!-- 编辑机器人 -->
    <edit-robot
      v-if="editRobotVisible"
      :visible.sync="editRobotVisible"
      :group="groupInfo"
      :editType="editType"
      :robot="currentRobot"
      @remove-robot="updateGroupHandle"
      @update-group="updateGroupHandle"
    ></edit-robot>
    <!-- 行动中心 -->
    <div
      v-if="actionCardsVisible"
      class="fixed top-88px right-0 w-350px h-292px z-10 bg-white rounded-bl-lg shadow-[0px_2px_12px_0px_rgba(0,0,0,0.1)]"
    >
      <action-cards-box
        :key="actionTargetId"
        :targetId="actionTargetId"
        :actionChatType="actionChatType"
        :chatName="
          actionChatType === 1 ? OpenDialog.name : `与${OpenDialog.name}的`
        "
        @close="actionCardsVisible = false"
      ></action-cards-box>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel } from "../../WebIM";
import sendBox from "@/components/chitchat/sendbox/send-box";
import MsgList from "@/components/chitchat/message/msg-list";
import SelectDialog from "@/components/chitchat/select-dialog";
import OperateDialog from "@/components/chitchat/dialog/operate-dialog";
import ChatRecords from "@/components/chitchat/chat-records";
import SingleSetting from "@/components/chitchat/single-setting";
import GroupSetting from "@/components/chitchat/group-setting";
import GetGroupInfo from "../../mixin/getGroupInfo";
import RobotManage from "./group/robot-manage";
import RobotInfo from "./group/robot-info";
import EditRobot from "./group/edit-robot";
import TransmitMessage from "./transmit-message"; // 消息转发
import ActionCenterIcon from "@/components/chatNotify/action-center-icon";
import ActionCardsBox from "@/components/chatNotify/action-cards-box";
import { ipcRenderer } from "electron";

export default {
  name: "ChatBox",
  components: {
    sendBox,
    MsgList,
    SelectDialog,
    OperateDialog,
    ChatRecords,
    SingleSetting,
    GroupSetting,
    RobotManage,
    RobotInfo,
    EditRobot,
    TransmitMessage,
    ActionCenterIcon,
    ActionCardsBox
  },
  mixins: [GetGroupInfo],
  data() {
    return {
      ConversationModel,
      IMConversationEnum: ConversationModel.IMConversationEnum,
      visibleSelect: false,
      transpondMsg: {},
      alertOpt: {
        // 弹窗设置
        message: "",
        type: "warning",
        show: false
      },
      isTranspond: false, // 是否开始转发
      isShowPeopleList: false, //是否展示@某人弹窗
      peopleList: [], //@某人列表
      peopleListStyle: null,
      mentionPeople: null, //@的人
      tempSelectIndex: 0, // 临时选中@的下标
      showDialog: false, //查找聊天记录弹窗
      currentSelect: "", //当前选中操作
      operateTitle: "", //弹窗标题
      robotInfoVisible: false,
      editRobotVisible: false,
      editType: 2,
      currentRobot: {},
      currentPrivateUser: [], // 当前单聊用户信息
      canMove: false,
      chatHeightValue: 0.324,
      triggerHeight: 20,
      maxHeight: 0.7,
      isMultSelect: false, //是否正处于多选情况
      multSelectOperate: [
        {
          icon: require("@/assets/image/chitchat/single-send.png"),
          type: "single-send",
          label: "逐条转发"
        },
        {
          icon: require("@/assets/image/chitchat/combine-send.png"),
          type: "combine-send",
          label: "合并转发"
        },
        {
          icon: require("@/assets/image/chitchat/delete.png"),
          type: "delete",
          label: "删除"
        },
        {
          icon: require("@/assets/image/chitchat/quit.png"),
          type: "quit"
        }
      ], //多选底部按钮
      selectMessageList: [], //多选的消息列表
      actionCardsVisible: false,
      actionCount: 0,
      singleActionId: ''
    };
  },
  created() {
    this.$nextTick(() => {
      let box = this.$refs.chatBox;
      let resizeObs = new ResizeObserver(this.resizeHandler);
      if (box) {
        resizeObs.observe(box);
      }
    });
  },
  mounted() {
    this.$root.$on("close-create-dialog", this.afterCloseCreateGroup);
    // 检查行动中心卡片权限
    this.checkActionUnreadTotal();
    // 监听收消息的通知
    window.eventHub.$on("refreshActionList", this.checkActionUnreadTotal);
  },
  beforeDestroy() {
    this.$root.$off("close-create-dialog", this.afterCloseCreateGroup);
    window.eventHub.$off("refreshActionList", this.checkActionUnreadTotal);
  },
  watch: {
    visibleSelect(forwardShow) {
      window.eventHub.$emit(
        forwardShow ? "hide-all-winbox" : "resume-all-winbox"
      );
    },
    showDialog(newVal, oldVal) {
      if (newVal) {
        if (this.currentSelect == "searchRecords") {
          this.$nextTick(() => {
            let container = this.$refs.chatRecords.$el;
            let input = container.getElementsByClassName("el-input__inner");
            input && input.length && input[0].focus();
          });
        }
      }
    },
    OpenDialog: {
      deep: true,
      immediate: true,
      handler(val, old) {
        if (val.conversationType === this.IMConversationEnum.PRIVATE) {
          this.currentPrivateUser.splice(0);
          let userInfo = this.GetUserByAcountIdCorp(val.id);
          this.currentPrivateUser = userInfo || [];
        } else {
          this.$refs.sendBox && this.$refs.sendBox.initList();
        }
        if (!old || val.id !== old.id) {
          this.showDialog = false;
          this.isShowPeopleList = false;
          this.currentSelect = "";
          this.actionCardsVisible = false;
          this.quitMultSelect();
          this.$nextTick(async () => {
            if (val.conversationType === this.IMConversationEnum.GROUP) {
              // 群组打开会话的时候更新缓存
              await this.getGroupInfo(val.id, "cacheToRemote");
            }
            this.$refs.chatRecords && this.$refs.chatRecords.clear();
          });
          // 取消行动中心的弹框
          this.$root.$emit("open-action-list-chat", "");
          setTimeout(() => {
            this.checkActionUnreadTotal();
            this.getActionTotalCount();
          }, 100);
        }
        this.$nextTick(() => {
          if (this.contentTime) {
            setTimeout(() => {
              const contentList = this.contentTime.split("_");
              if (contentList.length && contentList[0] == val.id) {
                this.showMessage({
                  time: contentList[1] || ""
                });
              }
            }, 500);
          }
        });
      }
    },
    contentTime(newVal) {
      if (newVal && this.OpenDialog.id) {
        const contentList = newVal.split("_");
        if (contentList.length && contentList[0] == this.OpenDialog.id) {
          this.showMessage({
            time: contentList[1] || ""
          });
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany",
      networkState: "GetNetWorkState",
      GetSendUser: "GetSendUser",
      GetUserByAcountIdCorp: "GetUserByAcountIdCorp",
      GetCorpRelate: "GetCorpRelate",
      GetNoRelateUser: "GetNoRelateUser",
      dialogType: "GetChitchatType",
      OpenDialog: "GetOpenDialog",
      GetNotCorpUsers: "GetNotCorpUsers",
      AllUserMap: "GetAllUserMap",
      contentTime: "GetsearchContentTime",
      ActionCenterUnread: "GetActionCenterUnread"
    }),
    //会话操作，单聊：发起群聊，查找聊天内容，聊天设置，群聊：添加成员，查找聊天内容，群设置
    operates() {
      // this.showDialog = false;
      let isGroup =
        this.OpenDialog.conversationType === this.IMConversationEnum.GROUP;
      return [
        {
          src: require("@/assets/image/chitchat/add-member.png"),
          activeSrc: require("@/assets/image/chitchat/add-member-active.png"),
          type: "addMember",
          show:
            this.OpenDialog.id !== this.GetSendUser.id &&
            !this.OpenDialog.id.includes("robot_"),
          tip: isGroup ? "添加成员" : "发起群聊"
        },
        {
          src: require("@/assets/image/chitchat/chat-records.png"),
          activeSrc: require("@/assets/image/chitchat/chat-records-active.png"),
          type: "searchRecords",
          show: true,
          tip: "查找聊天内容"
        },
        {
          src: require("@/assets/image/chitchat/chat-setting.png"),
          activeSrc: require("@/assets/image/chitchat/chat-setting-active.png"),
          type: "setting",
          show: !this.OpenDialog.id.includes("robot_"),
          tip: isGroup ? "群设置" : "聊天设置"
        }
      ];
    },
    tempSelectPeople() {
      const { peopleList, tempSelectIndex } = this;
      let tempdata = peopleList[tempSelectIndex];
      return tempdata;
    },
    currentPrivateUserCompany() {
      let name = "";
      let corpId = null;
      if (!this.GetNoRelateUser[this.OpenDialog.id]) {
        let corp = this.currentPrivateUser.find(
          item =>
            this.GetCompany.corp &&
            this.GetCompany.corp.id &&
            item.corpId === this.GetCompany.corp.id
        );
        let types = "";
        if (corp) {
          if (corp.visibleState != -1) {
            //非隐藏展示
            const corpInfo = corp.corp;
            const corpName = corp.corpName || (corpInfo && corpInfo.name) || "";
            // 外联且不是其他互联关系且不是协会的时候展示服务公司
            const type =
              corp.type == 1 && corp.serviceType == 1 ? "的服务人员" : "";
            if (corpInfo && corpInfo.corpAndCorpRelTypeEnums) {
              types =
                corpInfo.corpAndCorpRelTypeEnums == "UP_CORP"
                  ? "上级"
                  : corpInfo.corpAndCorpRelTypeEnums == "DWON_CORP"
                  ? "下级"
                  : corpInfo.corpAndCorpRelTypeEnums == "OTHER"
                  ? "其他"
                  : "";
            } else {
              types =
                this.GetCorpRelate(corp.corpId)[0] &&
                this.GetCorpRelate(corp.corpId)[0].text;
            }
            if (corp.type == 1 && corp.serviceType == 0) {
              types = "我的服务公司";
            }
            if (corpName) {
              name = corpName + type;
            }
            if (corp.isHide != "1") {
              // 非隐藏人员才展示部门链路
              if (corp.deptNameList && corp.deptNameList.length) {
                name += `>${corp.deptNameList[0] || ""}`;
              }
            }
          }
        } else {
          const orgList = (this.currentPrivateUser || []).filter(
            item => item.type == 0
          );
          let showList = [];
          if (orgList.length) {
            showList = orgList;
          } else {
            showList = this.currentPrivateUser || [];
          }
          for (const item of showList) {
            // types = this.GetCorpRelate(item.corpId);
            if (item.visibleState != -1) {
              //非隐藏展示
              const corpInfo = item.corp || {};
              const corpName =
                item.corpName || (corpInfo && corpInfo.name) || "";
              if (corpInfo && corpInfo.corpAndCorpRelTypeEnums) {
                types =
                  corpInfo.corpAndCorpRelTypeEnums == "UP_CORP"
                    ? "上级"
                    : corpInfo.corpAndCorpRelTypeEnums == "DWON_CORP"
                    ? "下级"
                    : corpInfo.corpAndCorpRelTypeEnums == "OTHER"
                    ? "其他"
                    : "";
              } else {
                types =
                  this.GetCorpRelate(item.corpId)[0] &&
                  this.GetCorpRelate(item.corpId)[0].text;
              }
              if (item.type == 1 && item.serviceType == 0) {
                types = "我的服务公司";
              }
              const type =
                item.type == 1 && item.serviceType == 1 ? "的服务人员" : "";
              if (corpName) {
                name = corpName + type;
              }
              if (item.isHide != "1") {
                if (item.deptNameList && item.deptNameList.length) {
                  name += `>${item.deptNameList[0] || ""}`;
                  break;
                }
              }
            }
          }
        }
        if (name && types) {
          name += `（${types}）`;
        }
      }
      return name;
    },
    triggerBottom() {
      return `calc(${this.chatHeightValue * 100}% - ${this.triggerHeight /
        2.5}px)`;
    },
    isSendSelf() {
      return (
        this.OpenDialog.conversationType === this.IMConversationEnum.PRIVATE &&
        this.OpenDialog.id === this.GetSendUser.id
      );
    },
    actionTargetId() {
      return this.OpenDialog.id;
    },
    actionChatType() {
      return this.OpenDialog.conversationType === this.IMConversationEnum.GROUP
        ? 1
        : 2;
    }
  },
  methods: {
    ...mapActions(["PushDialogue", "SendMessage"]),
    // 行动中心角标
    checkActionUnreadTotal() {
      let total = 0;
      const unreadList =
        this.ActionCenterUnread && this.ActionCenterUnread.actionCornerMarkList;
      if (Array.isArray(unreadList) && unreadList.length) {
        const matchItem = unreadList.find(
          item =>
            item.groupOrAccountId === this.actionTargetId &&
            item.chatType === this.actionChatType
        );
        if (matchItem) {
          total = matchItem.sourceUnreadNumber || 0;
        }
      }
      this.actionCardsVisible = total > 0 ? true : false;
    },
    // 获取会话的所有行动
    getActionTotalCount() {
      let sourceId = this.actionTargetId;
      if (this.actionChatType !== 1) {
        sourceId = [this.GetCompany.accountId, this.actionTargetId]
          .sort()
          .join("_");
      }
      const data = { sourceId: sourceId };
      this.$service.getActionCenterSourceUnread(data).then(res => {
        if (res.code === "M0000" && res.data) {
          this.singleActionId = res.data.actionId;
          this.actionCount = Number(res.data.allCardListCount) || 0;
        }
      });
    },
    closeTransmit(isScuccess) {
      this.visibleSelect = false;
      if (isScuccess) {
        this.quitMultSelect(); // 转发成功退出多选状态
      }
    },
    // 多选后操作
    async multSelectOperateHandle(type) {
      const messageList = this.$refs.messageList;
      let nameList = [];
      let content = "";
      if (this.OpenDialog.conversationType === this.IMConversationEnum.GROUP) {
        nameList.push(this.OpenDialog.name);
        content = `群${this.OpenDialog.name}的聊天记录`;
      } else {
        nameList.push(this.OpenDialog.name, this.GetSendUser.name);
        content = `${this.GetSendUser.name}和${this.OpenDialog.name}的聊天记录`;
      }
      if (
        ["single-send", "combine-send", "delete"].includes(type) &&
        !this.selectMessageList.length
      ) {
        this.$message.info("请至少选择一项！");
        return;
      }
      switch (type) {
        case "single-send": //逐条转发
          if (this.selectMessageList.length > 20) {
            return;
          }
          //逐条转发
          const transpondData = {
            transType: "single-send",
            content,
            messageList: this.selectMessageList,
            conversationType: this.OpenDialog.conversationType,
            nameList,
            messageCount: this.selectMessageList.length
          };
          this.$emit("transpoadHandle", transpondData);
          break;
        case "combine-send": //合并转发
          let hierarchy = 0;
          let buffer = Buffer.from(
            JSON.stringify(this.selectMessageList),
            "utf-8"
          );
          const uploadResult = await this.$service.ossUploadAli(buffer, {
            type: "txt",
            isPub: false
          });
          const summaryList = this.selectMessageList.slice(0, 4).map(item => {
            let senderUserInfo = this.AllUserMap[item.senderUserId];
            let user = senderUserInfo || item.content.user || {};
            const name = `${user.name}：`;
            if (item.messageType == MessageModel.MessageType.TextMessage) {
              return `${name}${item.content.content}`;
            } else if (
              [
                MessageModel.MessageType.FileMessage,
                MessageModel.MessageType.ZXEncryptFileMsg
              ].includes(item.messageType)
            ) {
              return `${name}[文件]`;
            } else if (
              [
                MessageModel.MessageType.ImageMessage,
                MessageModel.MessageType.ZXEncryptImgMsg,
                MessageModel.MessageType.ZXGIFMsg
              ].includes(item.messageType)
            ) {
              return `${name}[图片]`;
            } else if (
              [
                MessageModel.MessageType.ZXVideoMessage,
                MessageModel.MessageType.ZXEncryptVideoMsg
              ].includes(item.messageType)
            ) {
              return `${name}[视频]`;
            } else if (
              item.messageType === MessageModel.MessageType.ZXActionCardMsg
            ) {
              return `${name}[卡片]`;
            } else if (
              item.messageType === MessageModel.MessageType.LocationMessage
            ) {
              return `${name}[位置]`;
            } else if (
              item.messageType === MessageModel.MessageType.ZXCombineMsg
            ) {
              return `${name}[聊天记录]`;
            } else if (
              item.messageType === MessageModel.MessageType.ZXAppLinkMessage
            ) {
              return `${name}${item.content.linkTitle ||
                item.content.linkOwner}`;
            } else {
              return `${name}[不支持的消息类型，可在手机上查看]`;
            }
          });
          const combineMessageListHierarchy = this.selectMessageList
            .filter(
              item => item.messageType === MessageModel.MessageType.ZXCombineMsg
            )
            .map(item => item.content.hierarchy || 0);
          hierarchy = Math.max(...combineMessageListHierarchy, 0) + 1;
          const messageBody = {
            hierarchy,
            remoteUrl: uploadResult.url,
            conversationType: this.OpenDialog.conversationType,
            nameList,
            summaryList,
            content,
            messageCount: this.selectMessageList.length
          };
          // console.log("合并转发消息体", messageBody);
          this.$emit("transpoadHandle", {
            transType: "combine-send",
            ...messageBody
          });
          break;
        case "delete": //删除选中
          const h = this.$createElement;
          this.$msgbox({
            title: "删除消息",
            message: h("div", null, [h("p", null, "是否删除已选消息？")]),
            type: "warning",
            customClass: "setting-confirm",
            showCancelButton: true,
            confirmButtonText: "删除",
            cancelButtonText: "取消"
          })
            .then(async () => {
              if (messageList) {
                for (
                  let index = 0;
                  index < this.selectMessageList.length;
                  index++
                ) {
                  const element = this.selectMessageList[index];
                  await messageList.removeMessage(element);
                }
              }
              this.quitMultSelect();
            })
            .catch(() => {});

          break;
        case "quit": //离开
          this.quitMultSelect();
          break;
      }
    },
    // 退出选中状态
    quitMultSelect() {
      const messageList = this.$refs.messageList;
      if (messageList) {
        // 离开时退出多选状态，清空选中消息
        this.isMultSelect = false;
        this.selectMessageList.splice(0);
        messageList.isShowCheckBox = false;
        messageList.checkMessageList.splice(0);
      }
    },
    // 选择消息
    selectMessage(messageList) {
      this.selectMessageList = [...messageList];
    },
    // 多选时隐藏发送窗口展示底部按钮
    multSelect() {
      this.isMultSelect = true;
    },
    /**** 拖拽对话框相关 */
    handleMousedown(event) {
      document.addEventListener("mousemove", this.handleMousemove);
      document.addEventListener("mouseup", this.handleMouseup, true);
      this.initOffset =
        event.pageY - event.srcElement.getBoundingClientRect().top;
      this.canMove = true;
    },
    handleMousemove(event) {
      if (!this.canMove) return;
      const outerRect = this.$refs.chatBox.getBoundingClientRect();
      let offsetPercent =
        (outerRect.bottom - event.pageY - this.triggerHeight / 2) /
        outerRect.height;
      let bottomHeight =
        outerRect.bottom - event.pageY - this.triggerHeight / 2;

      if (bottomHeight <= 180) {
        offsetPercent = 180 / outerRect.height;
      }
      if (offsetPercent > this.maxHeight) offsetPercent = this.maxHeight;
      this.chatHeightValue = offsetPercent;
    },
    handleMouseup() {
      this.canMove = false;
      document.removeEventListener("mousemove", this.handleMousemove);
      document.removeEventListener("mouseup", this.handleMouseup);
      this.mask = false;
    },
    /**** 拖拽对话框相关 */
    //通过快捷键改变对话框高度
    changeSendBoxHeight(type) {
      if (type == "max") {
        this.chatHeightValue = 0.7;
      } else {
        this.chatHeightValue = 0.324;
      }
    },
    async getUserByAccountId(accountId) {
      let user = this.AllUserMap[accountId] || this.GetNotCorpUsers[accountId];
      if (!user) {
        try {
          const res = await this.$service.getAccountInformationOrganization.call(
            this,
            {
              id: accountId
            }
          );
          if (res) {
            user = { ...res, accountId: res.id };
          }
        } catch (error) {
          console.log(error, "获取用户信息失败");
        }
      }
      return user;
    },
    // 会话操作
    async operateHandle(type) {
      if (this.currentSelect != type) {
        this.showDialog = false;
        this.currentSelect = type;
        let isGroup =
          this.OpenDialog.conversationType === this.IMConversationEnum.GROUP;
        switch (type) {
          case "addMember":
            if (isGroup) {
              //添加成员
              let groupInfo = {};
              try {
                //获取最新群信息
                // const response = await this.getGroupInfoAsync(
                //   this.OpenDialog.id
                // );
                // if (response.data && response.data.data) {
                // groupInfo = response.data.data;
                // } else {
                //   throw new Error();
                // }
                groupInfo = { ...this.groupInfo };
                try {
                  let res = [];
                  if (groupInfo.type < 10) {
                    // 组织群获取公司范围
                    res = await this.$service.getGroupCompanyList({
                      corpId: groupInfo.corpId,
                      groupId: groupInfo.id
                    });
                  }
                  if (
                    groupInfo.type >= 10 ||
                    (groupInfo.type < 10 &&
                      res &&
                      Array.isArray(res) &&
                      res.length)
                  ) {
                    if (
                      groupInfo.onlyOwnerManage == 0 ||
                      this.GetCompany.accountId == groupInfo.owner
                    ) {
                      let groupMembers = [...(groupInfo.groupMembers || [])];
                      const owner = await this.getUserByAccountId(
                        groupInfo.owner
                      );
                      this.openAddMemberDialog(
                        [...groupMembers, groupInfo.owner],
                        {
                          users: [owner],
                          id: this.OpenDialog.id,
                          name: groupInfo.name,
                          limit: groupInfo.userLimit,
                          groupNumber: groupInfo.groupNumber,
                          groupType: groupInfo.type,
                          corpIdList: groupInfo.corpIdList,
                          corpId: groupInfo.corpId
                        }
                      );
                    } else {
                      this.currentSelect = "";
                      this.$Message.warning("您没有权限添加群成员");
                    }
                  } else {
                    this.currentSelect = "";
                    this.$Message.warning("您没有权限添加群成员");
                  }
                } catch (error) {
                  this.currentSelect = "";
                  this.$Message.warning("您没有权限添加群成员");
                }
              } catch (error) {
                // 如果获取最新群信息失败则默认不能添加
                groupInfo = {};
                this.currentSelect = "";
                this.$Message.warning("无法获取人员信息，信息获取失败");
              }
            } else {
              // 发起群聊
              // let user = {
              //   avatar: this.OpenDialog.avatar,
              //   accountId: this.OpenDialog.id,
              //   name: this.OpenDialog.name,
              //   type: this.dialogType == "outsource" ? 1 : 0
              // };
              // 从回话中建群暂时去掉当时会话联系人
              let users = [this.GetCompany];
              let disDel = [this.GetCompany];
              // if (this.dialogType != 'organization') {
              //   // 组织群从回话建群时不带人
              //   users.push(user);
              //   disDel.push(user);
              // }
              this.$root.$emit("create-group", {
                groupType: this.dialogType,
                users,
                disDel
              });
            }
            break;
          case "searchRecords":
            this.showDialog = true;
            this.operateTitle = "查找聊天内容"; //查找聊天记录
            break;
          case "setting":
            this.showDialog = true;
            this.operateTitle = isGroup ? "群设置" : "聊天设置"; //聊天设置，群设置
            break;
        }
        // 取消行动中心的弹框
        this.$root.$emit("open-action-list-chat", "");
      }
    },
    /**
     * 关闭创建群弹框之后处理
     */
    afterCloseCreateGroup() {
      if (!this.showDialog) {
        this.currentSelect = "";
      }
    },
    // 关闭弹窗
    closeOperate() {
      this.isShowPeopleList = false;
      this.currentSelect = "";
      this.showDialog = false;
      this.robotInfoVisible = false;
    },
    handleOperateSelect() {
      if (this.actionCount === 1 && this.singleActionId) {
        // 打开单条
        const path = `/detail/${this.singleActionId}`;
        const query = { type: 'preview' };
        ipcRenderer.invoke('open-operation-page', { to: "operation", data: { path, query } });
        return;
      }
      const data = {
        name: this.OpenDialog.name,
        id: this.actionTargetId,
        chatType: this.actionChatType
      };
      // 弹起行动中心的弹框
      this.$root.$emit("open-action-list-chat", data);
    },
    //跳转至信息位置以及该行高亮
    showMessage(item) {
      this.$refs.messageList.showMessagePosition(item.time);
      this.closeOperate();
    },
    /**
     * 得到@的人
     */
    getPeople(item) {
      this.mentionPeople = item;
      this.isShowPeopleList = false;
      window.eventHub.$emit("native-click");
    },
    /**
     * 展示@某人彈窗
     */
    showPeopleList(obj) {
      if (obj.isShow) {
        this.mentionPeople = null;
        this.peopleList = obj.data || [];
        let boxHeight = this.peopleList.length * 40;
        boxHeight = boxHeight > 300 ? 300 : boxHeight;
        let rect = obj.range.getBoundingClientRect();
        let left = rect && rect.x;
        if (left + 160 >= document.documentElement.clientWidth) {
          left = document.documentElement.clientWidth - 170;
        }
        const top = rect && rect.y - boxHeight;
        let height = boxHeight;
        if (top > 0 && top < 48) {
          height = boxHeight - top;
        } else if (top < 0) {
          height = boxHeight + top - 48;
        }
        this.peopleListStyle = {
          top: `${top < 48 ? 48 : top}px`,
          left: `${left}px`,
          height: `${height}px`
        };
      }
      this.isShowPeopleList = obj.isShow;
      this.tempSelectIndex = 0;
      this.$nextTick(() => {
        this.$refs.peopleList.scrollTop = 0;
      });
    },
    cancelHandle() {
      this.$refs.transmitMessage && this.$refs.transmitMessage.cancelHandle();
    },
    alertHandler(opt) {
      this.alertOpt = Object.assign(this.alertOpt, opt);
      setTimeout(() => {
        this.alertOpt.show = false;
      }, 1000);
    },
    /**
     * 上下方向键切换选中
     */
    switchSelectHandler({ key }) {
      const {
        peopleList,
        tempSelectIndex,
        isShowPeopleList,
        $refs,
        $nextTick
      } = this;
      if (isShowPeopleList) {
        const peopleLength = peopleList.length;
        const peopleListBox = $refs.peopleList;
        switch (key) {
          case "up":
            tempSelectIndex > 0
              ? --this.tempSelectIndex
              : (this.tempSelectIndex = peopleLength - 1);
            break;

          case "down":
            tempSelectIndex < peopleLength - 1
              ? ++this.tempSelectIndex
              : (this.tempSelectIndex = 0);
            break;
        }
        $nextTick(() => {
          try {
            let childNode = peopleListBox.querySelector(".select");
            childNode.scrollIntoViewIfNeeded(false);
          } catch (error) {}
        });
      }
    },
    resizeHandler() {
      this.isShowPeopleList = false;
    },
    chatHeadClickHandle(event) {
      this.isShowPeopleList = false;
      if (!event.target.dataset.hasOwnProperty("operate")) {
        this.closeOperate();
      }
    },
    /**
     * 展示机器人信息
     */
    async showRobotInfoHandle({ type, robotId }) {
      if (this.OpenDialog.id.includes("robot_")) return;
      let data = await this.getGroupInfo(this.OpenDialog.id, "cacheToRemote");
      let robot = (this.groupInfo.groupRobots || []).find(
        item => item.chatAccountId === robotId
      );
      if (robot) {
        this.currentRobot = robot;
        this.editType = 2;
        switch (type) {
          case "info":
            if (
              [this.groupInfo.owner, robot.chatRobotCreator].includes(
                this.GetSendUser.id
              )
            ) {
              this.editRobotVisible = true;
            } else {
              setTimeout(() => {
                this.robotInfoVisible = true;
              }, 10);
            }
            break;
        }
      } else {
        this.$message.warning({
          content: "该机器人已移除！",
          key: "robot-remove-hind"
        });
      }
    },
    // 编辑消息
    editMessageHandle(message) {
      if (!message || !message.content) {
        return;
      }
      this.$refs.sendBox.setEditContent(message);
    },
    updateGroupHandle() {
      this.getGroupInfo(this.OpenDialog.id);
    },
    showDetailHandle(e) {
      // 机器人不展示详情
      if (this.OpenDialog.id.includes("robot")) return;
      if (this.OpenDialog.id !== this.GetSendUser.id) {
        const user = { accountId: this.OpenDialog.id };
        window.eventHub.$emit("change-user-dialog", {
          show: true,
          evt: e,
          user
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  .chat-head {
    flex-shrink: 0;
    width: 100%;
    height: 40px;
    background: #ffffff;
    border-bottom: 1px solid rgb(238, 238, 238);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 20px;

    .chat-head-left {
      display: flex;
      align-items: center;
      height: 100%;
      overflow: hidden;
    }

    .chat-head-private {
      // flex-direction: column;
      // align-items: flex-start;
      justify-content: center;
      .item-name {
        cursor: pointer;
        font-size: 16px;
        font-family: PingFangSC-Medium, PingFang SC;
        font-weight: 500;
        color: #1f2329;
      }

      .no-point {
        cursor: default;
      }
    }

    .chat-head-private-describe {
      font-size: 10px;
      color: #999;
      line-height: 14px;
      cursor: pointer;
      margin-left: 4px;
      font-size: 14px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #8f959e;
      flex: 1;
      display: flex;
      overflow: hidden;
      padding-right: 40px;
      > span {
        display: block;
        flex: 1;
        font-size: 10px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      > button {
        color: #4498f0;
        flex-shrink: 0;
        font-size: 10px;
      }
    }

    .chat-head-right {
      flex-shrink: 0;
    }

    .chat-operate {
      display: flex;
      .chat-operate-btn {
        cursor: pointer;
        width: 30px;
        height: 30px;
        margin-right: 10px;
        background-repeat: no-repeat;
        background-position: center center;
        background-size: 20px 20px;
        &.addMember {
          background-image: url(~@/assets/image/chitchat/add-member.png);
          &.active,
          &:hover {
            background-image: url(~@/assets/image/chitchat/add-member-active.png);
          }
        }
        &.searchRecords {
          background-image: url(~@/assets/image/chitchat/chat-records.png);
          &.active,
          &:hover {
            background-image: url(~@/assets/image/chitchat/chat-records-active.png);
          }
        }
        &.setting {
          background-image: url(~@/assets/image/chitchat/chat-setting.png);
          &.active,
          &:hover {
            background-image: url(~@/assets/image/chitchat/chat-setting-active.png);
          }
        }
      }
    }
  }
  .chat-body {
    position: relative;
    overflow: hidden;
    width: 100%;
    flex: 1;
  }
  .mult-select-operate {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f7f9;
    > div {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-left: 80px;
      &.not-allowed {
        cursor: not-allowed;
      }
      .mult-select-operate-btn-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        &.transparent {
          background-color: transparent;
        }
        > img {
          width: 24px;
          height: 24px;
        }
      }
      .mult-select-operate-btn-label {
        font-size: 12px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
        margin-top: 18px;
      }
    }
  }
  .chat-trigger-con {
    height: 10px;
    width: 100%;
    background: transparent;
    opacity: 0;
    position: absolute;
    left: 0;
    z-index: 10;
    user-select: none;
    cursor: n-resize;
  }
  .chat-edit {
    width: 100%;
    border-top: 1px solid #e7e7e7;
  }

  .alert-box {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translate(-50%, 10px);
  }
}

/* 转发 */
.transpond-header {
  text-align: center;
  font-size: 16px;
  font-weight: 500;
}
.transpond-footer {
  text-align: center;
}
.peopleList {
  position: fixed;
  max-height: 300px;
  width: 160px;
  overflow-y: auto;
  background-color: #fff;
  box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.24);
  border-radius: 4px;
  z-index: 20;
  .peopleItem {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    cursor: pointer;
    &.select {
      background-color: #f5f6f7;
    }
    &:hover {
      background-color: #f5f6f7;
    }
    .user-photo {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      font-size: 10px;
      .user-sign {
        width: 100% !important;
        height: 100% !important;
      }
    }
    .allPeople {
      width: 24px;
      height: 24px;
      margin: 0 10px;
      .user-sign {
        background: #4786f7;
        border-radius: 50%;
        img {
          width: 20px;
          height: 20px;
          margin: 2 auto;
        }
      }
    }
    ::v-deep .user-sign-name {
      font-size: 10px !important;
    }
    .userName {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: keep-all;
    }
  }
}
</style>

<style lang="scss">
.chat-box {
  .message-container {
    background: #fff !important;
  }
  .message-item {
    .time {
      background: transparent !important;
    }
  }
  .msg-box {
    border-radius: 0px 8px 8px 8px !important;
    background: #f0f5ff !important;
  }
  .message-item-self {
    .msg-box {
      color: #1f2329 !important;
      border-radius: 8px 0px 8px 8px !important;
    }
  }
  .msg-file {
    background: #fff;
    .file-handle {
      border-top: 1px solid #f4f6f8;
      .down-button:first-of-type {
        border-right: 1px solid #f4f6f8;
      }
    }
  }
}
.chat-box-outsource {
  .message-container {
    // background: #f5fbf9 !important;
    background: rgba(243, 249, 247, 0.6) !important;
  }
  .message-item {
    --color: #36d18e;
    .time {
      &.current {
        color: #36d18e !important;
      }
    }
    &.select-message-item {
      background-color: #e4f5ee;
    }
  }
  .msg-box {
    background: #ffffff !important;
  }
  .message-item-self {
    .msg-box {
      background: #b3eccf !important;
    }
    .msg-box-no-boeder {
      background: rgba(243, 249, 247, 0.6) !important;
    }
  }
  .msg-box-no-boeder {
    background: rgba(243, 249, 247, 0.6) !important;
  }
}
.chat-box-organization {
  .message-container {
    // background: #f6f9ff !important;
    background: #f6f9ff !important;
  }
  .message-item {
    --color: #3e7eff;
    .time {
      &.current {
        color: #3e7eff !important;
      }
    }
    &.select-message-item {
      background-color: #ebf2ff;
    }
  }
  .msg-box {
    background: #ffffff !important;
  }
  .message-item-self {
    .msg-box {
      background: #cce0fe !important;
    }
    .msg-box-no-boeder {
      background: rgba(246, 249, 255, 0.6) !important;
    }
  }
  .msg-box-no-boeder {
    background: rgba(246, 249, 255, 0.6) !important;
  }
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
