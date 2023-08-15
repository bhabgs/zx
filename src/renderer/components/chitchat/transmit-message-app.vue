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
            v-show="activeTab === 3 && !showDeptAndUser"
            @showCompanyDept="selectCompanyHandle"
            @currentType="changeCurrentType"
            @selectCompany="selectCompany"
          ></outsource-group-select>
          <company-dept-user
            ref="companyDepet"
            :current="currentSelectCorp"
            :type="currentSelectCorp.companyType || 'organization'"
            :value="selectContact"
            @input="getCheckData"
            @backToCompany="backToCompany"
            v-if="activeTab === 3 && showDeptAndUser"
          ></company-dept-user>
          <!-- 组织架构end -->
        </div>
      </div>
      <div class="transmit-message-right">
        <p class="transmit-selected-title">发送给:</p>
        <div class="transmit-selected-container">
          <template v-for="(row, index) of showSelectedList">
            <mt-tag
              v-show="!row.isHide"
              :key="row.key"
              @close="cancelSelectHandle(row, index)"
              class="show-selected-tag"
              :text="row.name || row.label"
            >
              <span v-if="row.selectType === 'company'">
                {{ row.corpSelectType === "organization" ? "组织" : "外协" }}-
              </span>
            </mt-tag>
          </template>
        </div>
        <div class="transmit-show-message" id="transmit-show-message">
          <transmit-msg-img
            v-if="
              [
                MessageType.ImageMessage,
                MessageType.ZXEncryptImgMsg,
                MessageType.ZXGIFMsg
              ].includes(message.messageType)
            "
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
              )
            "
            :message="message"
          ></transmit-msg-file>
          <msg-applink
            v-else-if="message.messageType === MessageType.ZXAppLinkMessage"
            :message="message"
            preview-only
          />
          <span v-if="messageHandleList.length > 1"
            >等{{ messageHandleList.length }}个文件</span
          >
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
    MsgApplink,
    OrganizationOutsource,
    CompanyDeptUser
  },
  name: "TransmitMessageApp",
  props: {
    messageList: { type: Array, default: () => [] }
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
      selectContact: {
        users: [],
        depts: []
      },
      showComponent: {
        chart: false,
        group: false,
        contact: false
      },
      isTranspond: false, // 是否正在转发
      leaveMessage: "", // 留言
      showDeptAndUser: false, // 组织架构选择公司部门
      currentSelectCorp: {}, // 组织选择的公司
      currentSelectCorpType: "organization" //组织架构选择的公司
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
      GetSelectCompanyList: "GetSelectCompanyList"
    }),
    messageHandleList() {
      let messageList = [];
      messageList = this.messageList.map(item => {
        let content = {};
        if (item.transmitType === "text") {
          content = {
            content: item.content
          };
        } else if (item.transmitType === "applink") {
          content = item;
        } else {
          content = {
            ...item,
            name: item.fileName || item.name, // 转成文件需要的展示字段
            type: item.fileType, // 转成文件需要的展示字段
            size: (item.fileSize || item.size) * 1, // 转成文件需要的展示字段
            fileUrl: item.url, // 转成文件需要的展示字段
            content: item.url // 转成图片需要的展示字段
          };
        }
        return {
          messageType: this.getMessageType(item),
          content
        };
      });
      return messageList;
    },
    message() {
      let result = {};
      if (
        Array.isArray(this.messageHandleList) &&
        this.messageHandleList.length
      ) {
        result = this.messageHandleList[0];
      }
      return result;
    },
    selectedKeyClassify() {
      const { showSelectedList } = this;
      const result = { all: [], group: [], user: [], dept: [] };
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
            : "user";
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
      "SetSelectCompanyList"
    ]),
    getMessageType(item) {
      let type = "";
      if (item.transmitType === "file") {
        if (item.isEncrypt) {
          type = this.MessageType.ZXEncryptFileMsg;
        } else {
          type = this.MessageType.FileMessage;
        }
      } else if (item.transmitType === "image") {
        if (item.fileType.toLowerCase() == "gif") {
          type = this.MessageType.ZXGIFMsg;
        } else {
          if (item.isEncrypt) {
            type = this.MessageType.ZXEncryptImgMsg;
          } else {
            type = this.MessageType.ImageMessage;
          }
        }
      } else if (item.transmitType === "applink") {
        type = this.MessageType.ZXAppLinkMessage;
      } else {
        type = this.MessageType.TextMessage;
      }
      return type;
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
        const temp_data = {
          avatar,
          id: dialogId,
          conversationType,
          name: data.name,
          type,
          key
        };
        showSelectedList.push(temp_data);
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
          const temp_data = {
            id: item.id,
            conversationType: IMConversationEnum.GROUP,
            name: item.name,
            type: "group",
            key
          };
          this.showSelectedList.push(temp_data);
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
        ipcRenderer.invoke("sqlite-url", {
          key: "saveIncreaseRobot",
          data: { data: [{ ...data, isDelinConversation: 0 }] }
        });
        this.selectOrganizationHandle({
          item: data,
          type: "user",
          operate: "add"
        });
      }
    },
    /**
     * 取消事件
     */
    cancelHandle() {
      this.SetSelectCompanyList(null);
      this.$emit("close");
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
    transpondSendHandle() {
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
        selectContact,
        GetSendUser,
        disposeTranspondContent,
        AddDialogByKey,
        leaveMessage
      } = this;
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
          try {
            const conversationType = item.type === "user" ? PRIVATE : GROUP;
            const sendBody = {
              conversationType,
              targetId,
              senderUserId
            };
            // 发送转发消息
            // this.$service
            //   .DistributeSendMessage({ ...sendBody })
            //   .catch(e => console.error(e));
            this.messageHandleList.forEach(message => {
              // 转发文件循环发送
              const source = disposeTranspondContent(
                message.content,
                message.messageType
              );
              this.$service
                .DistributeSendMessage({
                  ...sendBody,
                  messageType: message.messageType,
                  source
                })
                .catch(e => console.error(e));
            });
            if (leaveMessageBody) {
              // 转发留言
              this.$service
                .DistributeSendMessage({ ...sendBody, ...leaveMessageBody })
                .catch(e => console.error(e));
            }
            AddDialogByKey({ key: item.id, type: conversationType });
            sentIds.push(item.key);
          } catch (error) {
            console.error(error);
          }
        }
      });
      // 来自于组织架构选中的人员（部门下携带人员及单选，需要判断哪些已经发送过）
      selectContact.users.forEach(item => {
        const { accountId } = item;
        const key = `user#${accountId}`;
        if (accountId && !sentIds.includes(key)) {
          const sendBody = {
            conversationType: PRIVATE,
            targetId: accountId,
            senderUserId,
            source,
            messageType
          };
          this.$service
            .DistributeSendMessage({ ...sendBody })
            .catch(e => console.error(e));
          if (leaveMessageBody) {
            this.$service
              .DistributeSendMessage({ ...sendBody, ...leaveMessageBody })
              .catch(e => console.error(e));
          }
          AddDialogByKey({ key: accountId, type: PRIVATE });
          sentIds.push(key);
        }
      });
      this.$message.success("转发成功");
      this.isTranspond = false;
      this.cancelHandle();
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
            const { base64, buffer, path, name, size, type, isLocal } = source;
            content = {
              base64,
              buffer,
              path,
              name,
              size,
              type,
              isLocal
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
    getCheckData(data) {
      const showList = [...this.showSelectedList];
      this.showSelectedList = showList.filter(
        item => !["dept", "user"].includes(item.type)
      );
      this.showSelectedList.push(...data.checkData);
      const { depts, users } = this.selectContact;
      this.selectContact = {
        depts: this.arrayDiffPush([...(depts || [])], [...data.depts]),
        users: this.arrayDiffPush([...(users || [])], [...data.users])
      };
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
    },
    async selectCompany(company) {
      const corpSelectType =
        company.corpSelectType || this.currentSelectCorpType;
      let companySelect = this.GetSelectCompanyList || {
        organization: [],
        outsource: []
      };
      let companyList = companySelect[corpSelectType];
      const users = await this.getAllUserByCorp(company);
      if (company.isCancel) {
        const companyUseIds = users.map(item => item.accountId);
        // 取消选择公司
        companyList = companyList.filter(item => item != company.id);
        const index = this.showSelectedList.findIndex(
          item =>
            item.id === company.id && item.corpSelectType === corpSelectType
        );
        if (index > -1) {
          this.showSelectedList.splice(index, 1);
        }
        let selectUsers = this.selectContact.users;
        selectUsers = selectUsers.filter(item => {
          let flag = false;
          if (!companyUseIds.includes(item.accountId)) {
            flag = true;
          } else if (item.corpSelectType) {
            // 取消选择组织下的公司A不取消外协下公司A的人员
            if (item.corpSelectType != corpSelectType) {
              flag = true;
            }
          }
          return flag;
        });
        this.$set(this.selectContact, "users", selectUsers);
      } else {
        companyList.push(company.id);
        this.showSelectedList.push({
          corpId: company.id,
          corpSelectType: corpSelectType,
          ...company,
          type: "company"
        });
        const companyUsers = (users || []).map(item => {
          return {
            ...item,
            isHide: true
          };
        });
        let selectUsers = this.arrayDiffPush(
          [...(this.selectContact.users || [])],
          companyUsers
        );
        this.$set(
          this.selectContact,
          "users",
          selectUsers.map(item => {
            return {
              ...item,
              corpSelectType: corpSelectType
            };
          })
        );
      }
      this.$set(companySelect, corpSelectType, companyList);
      this.SetSelectCompanyList(companySelect);
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
    }
    .outsource-group-select {
      height: 100%;
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
      display: flex;
      flex-direction: column;
      align-items: flex-end;
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
