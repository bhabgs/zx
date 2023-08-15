<!--
 * @Author: lixiaowei
 * @Date: 2021-04-12 15:49:40
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-05-25 10:46:17
 * @Description: 消息转发
 * @FilePath: /zx-client-pc/src/renderer/components/chitchat/transmit-message.vue
-->
<template>
  <section class="transmit-message-container">
    <div class="transmit-message-title">转发</div>
    <div class="transmit-message-body">
      <div class="transmit-message-left">
        <search-box
          :needRobot="true"
          class="transmit-search-contanier"
          placeholder="搜索联系人、群组"
          @select="searchSelectHandle"
        ></search-box>
        <div class="transmit-switch-tab-box">
          <template v-for="row of switchBtns">
            <a-button
              :key="row.type"
              type="link"
              :class="{ 'active-btn': activeTab === row.type }"
              @click="switchTabHandle(row)"
              >{{ row.text }}</a-button
            >
          </template>
        </div>
        <div class="transmit-tab-container">
          <!-- 最近联系人 -->
          <ul
            class="last-contacts"
            ref="lastcontacts"
            v-if="showComponent.chart"
            v-show="activeTab === 1"
          >
            <li
              v-for="(row, key) in allConversation"
              :key="key"
              class="contact-item"
              @click="selectDialogHandle(row)"
            >
              <a-checkbox
                class="mt-checkbox-circle"
                :checked="selectedKeyClassify.all.includes(row.key)"
              ></a-checkbox>
              <user-photo
                class="iconfont select-icon"
                :user="row"
                v-if="row.conversationType === IMConversationEnum.PRIVATE"
              ></user-photo>
              <group-photo
                class="iconfont select-icon"
                :group="row"
                v-if="row.conversationType === IMConversationEnum.GROUP"
              ></group-photo>
              <div class="content-info">
                <p class="item-name only-line">{{ row.name }}</p>
                <group-sign :type="row.groupType"></group-sign>
              </div>
            </li>
          </ul>
          <!-- 最近联系人end -->
          <!-- 群组 -->
          <select-group-list
            v-if="showComponent.group"
            v-show="activeTab === 2"
            ref="selectGroup"
            :selected="selectedIdClassify.group"
            @changeSelect="groupSelectHandle"
          ></select-group-list>
          <!-- 群组end -->
          <!-- 组织架构 -->
          <!-- <only-select-organizational
            v-if="showComponent.contact"
            v-show="activeTab === 3"
            v-model="selectContact"
            ref="selectOrganization"
            :selected="selectedIdClassify.user"
            @checked="selectOrganizationHandle"
          ></only-select-organizational>-->
          <outsource-group-select
            v-if="showComponent.contact"
            type="organization"
            v-show="activeTab === 3 && !showDeptAndUser"
            @showCompanyDept="selectCompanyHandle"
            @currentType="changeCurrentType"
          ></outsource-group-select>
          <company-dept-user
            ref="companyDepet"
            :current="currentSelectCorp"
            :type="currentSelectCorp.companyType || 'organization'"
            :checkedObj="checkedObj"
            :disabledObj="{}"
            @backToCompany="backToCompany"
            @toggle-user="toggleChecked"
            v-if="activeTab === 3 && showDeptAndUser"
          ></company-dept-user>
          <!-- 组织架构end -->
        </div>
      </div>
      <div class="transmit-message-right" id="transmit-container">
        <p class="transmit-selected-title">发送给:</p>
        <div class="transmit-selected-container">
          <template v-for="(row, index) of showSelectedList">
            <mt-tag
              :key="row.key"
              @close="cancelSelectHandle(row, index)"
              class="show-selected-tag"
              :text="row.name || row.label"
            >
              <span v-if="row.selectType === 'company'">
                {{ row.corpSelectType === "organization" ? "组织" : "外联" }}-
              </span>
            </mt-tag>
          </template>
        </div>
        <div class="transmit-show-message" id="transmit-show-message">
          <TransmitSumary
            v-if="
              !!message.transType ||
                message.messageType == MessageType.ZXCombineMsg
            "
            :transpondData="!!message.transType ? message : message.content"
            @showCombineDetail="showCombineDetail"
          >
          </TransmitSumary>
          <transmit-msg-img
            v-else-if="
              [
                MessageType.ImageMessage,
                MessageType.ZXEncryptImgMsg,
                MessageType.ZXGIFMsg
              ].includes(message.messageType) && !imgIsTiff
            "
            @showimg="showFullScreenImg"
            :message="message"
          ></transmit-msg-img>
          <transmit-msg-text
            v-else-if="message.messageType === MessageType.TextMessage"
            :message="message"
          ></transmit-msg-text>
          <transmit-msg-file
            v-else-if="
              [MessageType.FileMessage, MessageType.ZXEncryptFileMsg].includes(
                message.messageType
              ) || imgIsTiff
            "
            :message="message"
          ></transmit-msg-file>
          <transmit-msg-video
            v-else-if="
              [MessageType.ZXVideoMessage].includes(message.messageType)
            "
            :message="message"
          ></transmit-msg-video>
          <transmit-msg-video
            v-else-if="
              [MessageType.ZXVideoMessage].includes(message.messageType)
            "
            :message="message"
          ></transmit-msg-video>
          <msg-applink
            v-else-if="message.messageType === MessageType.ZXAppLinkMessage"
            :message="message"
            preview-only
          />
        </div>
        <textarea
          class="transmit-input-message-box"
          placeholder="给对方留言"
          maxlength="1000"
          v-model="leaveMessage"
        ></textarea>
        <div class="transmit-footer">
          <a-button @click="cancelHandle">取消</a-button>
          <a-button
            type="primary"
            @click="confirmHandle"
            :disabled="!showSelectedList.length"
          >
            确定({{ showSelectedList.filter(item => !item.isHide).length }})
          </a-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapGetters, mapActions } from "vuex";
import SearchBox from "./search-box.vue";
import SelectGroupList from "./select-group-list.vue";
import OnlySelectOrganizational from "./only-select-organizational.vue";
import { ConversationModel, MessageModel } from "../../WebIM";
import TransmitMsgImg from "./message/transmit-msgs/transmit-msg-img.vue";
import TransmitMsgText from "./message/transmit-msgs/transmit-msg-text.vue";
import TransmitMsgFile from "./message/transmit-msgs/transmit-msg-file.vue";
import transmitMsgVideo from "./message/transmit-msgs/transmit-msg-video.vue";
import TransmitSumary from "./message/transmit-msgs/transmit-sumary.vue";
import MsgApplink from "./message/msgtype/msg-applink.vue";
import { IMConversationEnum } from "../../WebIM/conversation/ConversationModel";
import { MessageType } from "../../WebIM/message/MessageModel";
import commonOperateVue from "../common/common-operate.vue";
import OrganizationOutsource from "@/components/common/organization-outsource";
import CompanyDeptUser from "@/components/common/group/company-dept-user";
export default {
  components: {
    SearchBox,
    SelectGroupList,
    OnlySelectOrganizational,
    TransmitMsgImg,
    TransmitMsgText,
    TransmitMsgFile,
    TransmitSumary,
    transmitMsgVideo,
    OrganizationOutsource,
    CompanyDeptUser,
    MsgApplink
  },
  name: "TransmitMessage",
  props: {
    message: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      IMConversationEnum: ConversationModel.IMConversationEnum,
      MessageType: MessageModel.MessageType,
      switchBtns: [
        { text: "最近联系人", type: 1, key: "chart" },
        { text: "群组", type: 2, key: "group" },
        { text: "组织架构", type: 3, key: "contact" }
      ],
      activeTab: 0, // 当前展示tab
      showSelectedList: [], // 展示已选择
      checkedObj: {}, // 组织架构选中的人员
      showComponent: {
        chart: false,
        group: false,
        contact: false
      },
      isTranspond: false, // 是否正在转发
      leaveMessage: "", // 留言
      showDeptAndUser: false, // 组织架构选择公司部门
      currentSelectCorp: {}, // 组织选择的公司
      currentSelectCorpType: "organization", //组织架构选择的公司
      showCombineDialog: null // 合并转发详情弹窗
    };
  },
  created() {},
  mounted() {
    this.switchTabHandle(this.switchBtns[0]);
  },
  computed: {
    ...mapGetters({
      ConversationSort: "GetConversationSort",
      AllUserMap: "GetAllUserMap",
      GetSendUser: "GetSendUser",
      GetSelectCompanyList: "GetSelectCompanyList",
      RobotList: "GetRobotList"
    }),
    imgIsTiff() {
      let result = false;
      if (
        [
          MessageModel.MessageType.ImageMessage,
          MessageModel.MessageType.ZXEncryptImgMsg,
          MessageModel.MessageType.ZXGIFMsg
        ].includes(this.message.messageType)
      ) {
        if (this.message.content && this.message.content.type) {
          result = ["tiff", "tif"].includes(
            this.message.content.type.toLocaleLowerCase()
          );
        } else {
          if (this.message.content && this.message.content.imageUri) {
            result =
              this.message.content.imageUri
                .toLocaleLowerCase()
                .includes("tif") ||
              this.message.content.imageUri
                .toLocaleLowerCase()
                .includes("tiff");
          }
        }
      }
      return result;
    },
    selectedKeyClassify() {
      const { showSelectedList } = this;
      const result = { all: [], group: [], private: [], user: [], dept: [] };
      showSelectedList.forEach(item => {
        result.all.push(item.key);
        switch (item.type) {
          case "group":
            result.group.push(item.key);
            break;
          case "user":
            result.user.push(item.key);
            break;
          case "dept":
            result.dept.push(item.key);
            break;
          case "private":
            result.private.push(item.key);
            break;
        }
      });
      return result;
    },
    selectedIdClassify() {
      const { showSelectedList } = this;
      const result = { group: [], user: [], dept: [] };
      showSelectedList.forEach(item => {
        switch (item.type) {
          case "group":
            result.group.push(item.id);
            break;
          case "user":
            result.user.push(item.id);
            break;
          case "dept":
            result.dept.push(item.id);
            break;
        }
      });
      return result;
    },
    allConversation() {
      let result = this.ConversationSort.all.map(({ ...item }) => {
        const classifyKey =
          item.conversationType === ConversationModel.IMConversationEnum.GROUP
            ? "group"
            : "private";
        const signKey = `${classifyKey}#${item.id}`;
        item.type = classifyKey;
        item.key = signKey;

        return item;
      });

      result.sort((a, b) => {
        if (a.message && b.message) {
          return b.message.messageTime - a.message.messageTime;
        } else {
          if (a.message) {
            return -1;
          }
          if (b.message) {
            return 1;
          }
        }
      });

      return result;
    }
  },
  watch: {},
  methods: {
    ...mapActions([
      "AddDialogByKey",
      "openConversationById",
      "SetSelectCompanyList",
      "PushDialogue"
    ]),
    showCombineDetail() {
      this.$nextTick(() => {
        const container = document.getElementById("transmit-container");
        let rect = {};
        if (container) {
          rect = container.getBoundingClientRect();
        }
        const content =
          this.message.messageType == this.MessageType.ZXCombineMsg
            ? this.message.content
            : this.message;
        this.showCombineDialog = this.$showCombineMsg({
          ...content,
          rect,
          zIndex: 1001
        });
      });
    },
    /**
     * tab切换
     */
    switchTabHandle(row) {
      if (!this.showComponent[row.key]) {
        this.showComponent[row.key] = true;
      }
      this.activeTab = row.type;
    },
    /**
     * 选择最近会话
     */
    selectDialogHandle(data) {
      const { showSelectedList, selectedKeyClassify } = this;
      const { id: dialogId, key, type, conversationType, avatar } = data;
      if (selectedKeyClassify.all.includes(key)) {
        this.deleteSelectedHandle(key);
      } else {
        if (selectedKeyClassify.all.length < 9) {
          const temp_data = {
            avatar,
            id: dialogId,
            conversationType,
            name: data.name,
            type,
            key
          };
          showSelectedList.push(temp_data);
        } else {
          this.$message.info("最多只能选择9个会话");
        }
      }
    },
    /**
     * 取消选择
     */
    cancelSelectHandle(data, index) {
      this.showSelectedList.splice(index, 1);
      switch (data.type) {
        case "group":
          const selectGroup = this.$refs.selectGroup;
          selectGroup && selectGroup.cancelSelect(data.id);
          break;
        case "user":
          this.toggleChecked({ ...data, isUser: true });
          break;
        case "dept":
          const companyDepet = this.$refs.companyDepet;
          companyDepet && companyDepet.closeTag(data);
          break;
        case "company":
          this.selectCompany({
            ...data,
            isCancel: true
          });
          break;
      }
    },
    /**
     * 删除已选
     */
    deleteSelectedHandle(key) {
      const { showSelectedList, selectedKeyClassify } = this;
      const index = selectedKeyClassify.all.indexOf(key);
      if (index !== -1) {
        showSelectedList.splice(index, 1);
      }
    },
    /**
     * 群组（取消）选择事件
     */
    groupSelectHandle(data) {
      const { item, type } = data;
      if (type === "add") {
        const key = `group#${item.id}`;
        if (!this.selectedKeyClassify.all.includes(key)) {
          if (this.selectedKeyClassify.all.length < 9) {
            const temp_data = {
              id: item.id,
              conversationType: IMConversationEnum.GROUP,
              name: item.name,
              type: "group",
              key
            };
            this.showSelectedList.push(temp_data);
          } else {
            this.$message.info("最多只能选择9个会话");
          }
        }
      } else {
        this.deleteSelectedHandle(`group#${item.id}`);
      }
    },
    /**
     * 查看大图
     */
    showFullScreenImg() {
      // 查看大图
      let index = 0;
      let ImgMsgs = [];
      const msgTypes = [
        this.MessageType.ImageMessage,
        this.MessageType.ZXRichMessage,
        this.MessageType.ZXEncryptImgMsg,
        this.MessageType.ZXGIFMsg
      ];
      const messageType = this.message.messageType;
      if (msgTypes.includes(messageType)) {
        let isEncrypt = messageType === this.MessageType.ZXEncryptImgMsg;
        let senderUserInfo = this.AllUserMap[this.message.senderUserId];
        let user = senderUserInfo || this.message.content.user || {};
        const transpondData = {
          messageType,
          content: this.message.content
        };
        let url = "";
        if (this.message.isEdit) {
          url = this.message.showOssUrl;
        } else {
          url = this.message.content.imageUri || this.message.content.url;
        }
        const tempData = {
          messageType,
          isEncrypt,
          avatar: user.avatar || user.portraitUri,
          title: user.name + "分享的图片",
          time: this.message.messageTime,
          isPub: false,
          thumb:
            this.message.content.content || this.message.content.thumbnailImage,
          url,
          transpondData
        };
        ImgMsgs.push(tempData);
      }
      ipcRenderer.invoke("show-media", {
        operate: ["transpond"],
        type: "image",
        index,
        list: ImgMsgs
      });
    },
    /*
     * 组织架构（取消）选择事件
     */
    selectOrganizationHandle(data) {
      const { item, type, operate } = data;
      const id = type === "user" ? item.accountId : item.id;
      const key = `${type}#${id}`;
      if (operate === "add") {
        // 选中
        if (!this.selectedKeyClassify.all.includes(key)) {
          const temp_data = {
            id,
            avatar: type === "user" ? item.avatar : undefined,
            conversationType:
              type === "user" ? IMConversationEnum.PRIVATE : undefined,
            name: item.name,
            type,
            key
          };
          this.showSelectedList.push(temp_data);
        }
      } else {
        // 取消选中
        this.deleteSelectedHandle(key);
      }
    },
    /**
     * 搜索结果选择
     */
    searchSelectHandle(data) {
      if (data.isgroup) {
        this.groupSelectHandle({ item: data, type: "add" });
      } else {
        this.toggleChecked({
          ...data,
          isUser: true
        });
      }
    },
    /**
     * 取消事件
     */
    cancelHandle(isScuccess) {
      if (this.showCombineDialog && !this.showCombineDialog._isDestroyed) {
        try {
          this.showCombineDialog.close();
        } catch (error) {
          console.log(error);
        }
      }
      this.SetSelectCompanyList(null);
      this.$emit("close", isScuccess);
    },
    /**
     * 确定事件
     */
    confirmHandle() {
      this.transpondSendHandle();
    },
    /**
     * 消息转发处理
     */
    async transpondSendHandle() {
      // 消息转发
      const { showSelectedList } = this;
      if (!showSelectedList.length) {
        return;
      }
      if (this.isTranspond) {
        return;
      }
      this.isTranspond = true;
      const {
        message,
        selectContact,
        GetSendUser,
        disposeTranspondContent,
        AddDialogByKey,
        leaveMessage
      } = this;
      const { messageType, content, isEdit } = message;

      if (content.extra && content.extra["pc-sign-uuid"]) {
        this.$delete(content.extra, "pc-sign-uuid");
      }
      let data = {};
      if (isEdit) {
        data = { ...message };
      } else {
        data = { ...content };
      }
      const source = disposeTranspondContent(data, messageType);
      const senderUserId = GetSendUser.id;
      // 进行消息发送
      const sentIds = []; // 记录已发送id，防止部门下选中和单独选中时重复发送
      const { PRIVATE, GROUP } = IMConversationEnum;
      let leaveMessageBody = null;
      if (leaveMessage.trim()) {
        leaveMessageBody = {
          source: { data: leaveMessage },
          messageType: MessageType.TextMessage
        };
      }
      showSelectedList.forEach(item => {
        const { id: targetId } = item;
        if (
          !["dept", "company"].includes(item.type) &&
          targetId &&
          item.key &&
          !sentIds.includes(item.key)
        ) {
          const conversationType = ["user", "private"].includes(item.type)
            ? PRIVATE
            : GROUP;
          this.sendMessageHandle(
            message,
            conversationType,
            targetId,
            senderUserId,
            leaveMessageBody,
            source
          );
          AddDialogByKey({ key: item.id, type: conversationType });
          sentIds.push(item.key);
        }
      });

      // const robotList = showSelectedList.filter(
      //   item => item.accountId && item.accountId.includes("robot_")
      // );
      // if (robotList.length) {
      //   await ipcRenderer.invoke("sqlite-url", {
      //     key: "saveIncreaseRobot",
      //     data: {
      //       data: robotList.map(item => {
      //         const robot = this.RobotList.find(
      //           robot => robot.accountId === item.accountId
      //         );
      //         return {
      //           ...robot,
      //           isDelinConversation: 0
      //         };
      //       })
      //     }
      //   });
      // }
      // 去掉转发打开新的会话逻辑
      // if (sentIds.length === 1) {
      //   // 只转发给一个会话进行会话打开操作
      //   const keys = sentIds[0].split("#");
      //   const conversationType = keys[0] === "user" ? PRIVATE : GROUP;
      //   const id = keys[1];
      //   const conversation = this.allConversation.find(
      //     (item) => item.id === id && item.conversationType === conversationType
      //   );
      //   if (
      //     conversation &&
      //     ![null, undefined].includes(conversation.groupType)
      //   ) {
      //     this.$router.push({
      //       name: "chitchat",
      //       query: {
      //         type: conversation.groupType >= 10 ? "outsource" : "organization",
      //       },
      //     });
      //   }
      //   this.openConversationById({ id, conversationType });
      // }

      this.$message.success("转发成功");
      this.isTranspond = false;
      this.cancelHandle(true);
    },
    async sendMessageHandle(
      message,
      conversationType,
      targetId,
      senderUserId,
      leaveMessageBody,
      source
    ) {
      try {
        let sendBody = {};
        if (message.transType === "single-send") {
          sendBody = {
            conversationType,
            targetId,
            senderUserId
          };
          // 逐条转发
          for (let i = 0; i < message.messageList.length; i++) {
            const element = message.messageList[i];
            const source = this.disposeTranspondContent(
              element.content,
              element.messageType
            );
            // 发送转发消息
            this.$service
              .DistributeSendMessage({
                ...sendBody,
                source,
                messageType: element.messageType
              })
              .catch(e => console.error(e));
          }
        } else {
          sendBody = {
            conversationType,
            targetId,
            senderUserId,
            source: message.transType === "combine-send" ? message : source,
            messageType:
              message.transType === "combine-send"
                ? this.MessageType.ZXCombineMsg
                : message.messageType
          };
          // 发送转发消息
          this.$service
            .DistributeSendMessage({ ...sendBody })
            .catch(e => console.error(e));
        }
        if (leaveMessageBody) {
          // 转发留言
          this.$service
            .DistributeSendMessage({ ...sendBody, ...leaveMessageBody })
            .catch(e => console.error(e));
        }
      } catch (error) {
        console.error(error);
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
            messageName: source.messageName
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
              showUrl
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
              imgUri: showOssUrl
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
    // 处理勾选、取消勾选、删除已选择人员和组织
    async toggleChecked(deptOrUser) {
      const { isUser, accountId } = deptOrUser;
      if (isUser) {
        const indexInSelected = this.showSelectedList.findIndex(
          item => item.isUser && item.accountId === accountId
        );
        if (this.checkedObj[accountId]) {
          // 取消勾选人员，删除已选择人员
          // 取消勾选人员，删除已选择人员所有引用
          if (indexInSelected !== -1) {
            this.showSelectedList.splice(indexInSelected, 1);
          }
          this.$set(this.checkedObj, accountId, false);
        } else {
          if (this.selectedKeyClassify.all.length >= 9) {
            this.$message.info("最多只能选择9个会话");
            return;
          }
          // 勾选人员
          // this.checkedObj[accountId]=true
          this.showSelectedList.push({
            ...deptOrUser,
            id: accountId,
            type: "user",
            key: `user#${accountId}`
          });
          this.$set(this.checkedObj, accountId, true);
        }
      }
    },
    arrayDiffPush(oldArr, addArr) {
      for (let i = 0; i < addArr.length; i++) {
        const index = oldArr.findIndex(item => {
          let result = true;
          if (item.isDept) {
            result = item.id == addArr[i].id;
          } else {
            result = item.accountId == addArr[i].accountId;
          }
          return result;
        });
        if (index < 0) {
          oldArr.push(addArr[i]);
        }
      }
      return oldArr;
    },
    backToCompany() {
      this.showDeptAndUser = false;
    },
    selectCompanyHandle(item) {
      this.currentSelectCorp = item;
      this.showDeptAndUser = true;
    },
    async getAllUserByCorp(company) {
      try {
        const users = await this.$service.getCorpAllUser.call(this, {
          corpId: company.corpId,
          corpType: company.corpTypeEnums || company.corpType
        });
        return users || [];
      } catch (error) {
        return [];
      }
    },
    changeCurrentType(type) {
      this.currentSelectCorpType = type;
    }
  }
};
</script>

<style lang="scss">
.transmit-message-container {
  width: 690px;
  height: 540px;

  .transmit-message-title {
    height: 50px;
    line-height: 50px;
    background-color: #eaedf2;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
  }

  .transmit-search-contanier {
    margin: {
      bottom: 0;
    }
  }

  .transmit-message-body {
    display: flex;
    height: calc(100% - 50px);
  }
  .transmit-message-left,
  .transmit-message-right {
    flex: 1 0 50%;
    height: 100%;
    overflow: hidden;
  }
  .transmit-message-left {
    border-right: 1px solid #dde0e3;
  }

  .transmit-switch-tab-box {
    height: 40px;
    border-bottom: 1px solid #dde0e3;

    > button {
      padding: 0;
      height: 100%;
      margin: {
        left: 20px;
      }
      color: #1f2329;
      font-size: 14px;
      font-weight: bold;

      &.active-btn {
        color: #4498f0;
      }
    }
  }

  .transmit-tab-container {
    height: calc(100% - 82px);
    .company-dept-user {
      height: 100%;
      .company-dept-user-breadcrumb {
        margin-top: 0 !important;
      }
    }
    .outsource-group-select {
      height: 100%;
      padding-top: 0 !important;
      .organization-outsourtce-header {
        border-top: none !important;
      }
    }
  }

  .last-contacts {
    width: 100%;
    height: 100%;
    overflow: hidden auto;
    > li {
      padding: 10px 20px;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.2s linear;
      &:hover {
        background-color: #e4e6ea;
      }
    }

    .content-info {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      user-select: none;
    }
  }

  .transmit-message-right {
    display: flex;
    flex-direction: column;

    .transmit-selected-title {
      flex-shrink: 0;
      height: 40px;
      line-height: 40px;
      padding: 0 10px;
      font-size: 14px;
    }

    .transmit-selected-container {
      margin: {
        bottom: 10px;
      }
      padding: 0 10px;
      flex: 1;
      min-height: 158px;
      overflow: hidden auto;

      > .show-selected-tag {
        margin: {
          right: 10px;
          bottom: 10px;
        }
      }
    }
    .transmit-show-message {
      margin: {
        bottom: 10px;
      }
      padding: 0 10px;
      min-height: 46px;
      max-height: calc(50% - 20px);
      overflow: hidden;
      .ant-tooltip {
        width: 325px;
        max-width: 325px;
      }
      .ant-tooltip-inner {
        background: #fff;
        color: #1f2329;
        max-height: 180px;
        overflow-y: auto;
      }
      .ant-tooltip-arrow::before {
        background-color: #fff;
      }
    }

    .transmit-input-message-box {
      flex-shrink: 0;
      margin: 0 10px;
      padding: 5px 10px;
      height: 60px;
      border-radius: 4px;
      border: 1px solid #dde0e3;
      outline-width: 1px;
      font-size: 12px;
      &::placeholder {
        color: #c9cfd8;
      }
      &:focus {
        outline-color: #4498f0 !important;
      }
    }

    .transmit-footer {
      flex-shrink: 0;
      padding: 10px;
      text-align: right;
    }
  }
}
</style>
