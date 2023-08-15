import Vue from "vue";

import { MessageModel, ConversationModel } from "../../../WebIM";
import { Util } from "@/plugin";
const { deepClone } = Util;

import stateTemplate from "@/store/stateTemplate";

const MUTATIONS = {
  /**
   * 保存消息
   * @param {*} state
   * @param {*} param1
   */
  SAVEMSG(
    state,
    { key, message, isHistory = false, isLast = false, getters = {} }
  ) {
    // 保存消息
    const listKey =
      message.conversationType === ConversationModel.IMConversationEnum.PRIVATE
        ? "ChatMSG"
        : "GroupMSG";

    const dialogId = `${message.conversationType}_${key}`;

    if (state[listKey][key]) {
      let temp = state[listKey][key];
      if (isHistory && !isLast) {
        temp.unshift(message);
      } else {
        temp.push(message);
      }
      temp.sort((a, b) => {
        if (a && b) {
          return a.messageTime - b.messageTime;
        } else {
          if (a) {
            return 1;
          }
          if (b) {
            return -1;
          }
        }
      });
      Vue.set(state[listKey], key, temp);
    } else {
      Vue.set(state[listKey], key, [message]);
    }
    this.commit("UpdateLatestOneMsg", { message }); // 跟新会话的最新一条消息
    let isOpen =
      getters.GetOpenDialog &&
      getters.GetOpenDialog.id === message.targetId &&
      getters.GetOpenDialog.conversationType === message.conversationType;
    if (!isHistory) {
      if (isOpen && !isLast) {
        window.eventHub.$emit("openConversationRcMessage", {
          self: message.bySelf,
        });
      }
    }

    if (
      !isHistory &&
      message.content.mentionedInfo &&
      !isOpen &&
      !message.bySelf
    ) {
      const mentionedInfo = message.content && message.content.mentionedInfo;
      let oldArray = state.AtMsgMap[dialogId] || [];
      if (message.receivedStatus == MessageModel.RecState.UNREAD) {
        if (mentionedInfo.type === 1) {
          const selfId = getters.GetSendUser.id; // 登陆人accountId
          // !oldArray.includes(selfId) && oldArray.push(selfId);
          const index = oldArray.findIndex((item) => item.id === selfId);
          if (index >= 0) {
            const ele = oldArray[index];
            oldArray.splice(index, 1, { id: selfId, count: ele.count + 1 });
          } else {
            oldArray.push({ id: selfId, count: 1 });
          }
        } else {
          (mentionedInfo.userIdList || []).forEach((id) => {
            // !oldArray.includes(id) && oldArray.push(id);
            const index = oldArray.findIndex((item) => item.id === id);
            if (index >= 0) {
              const ele = oldArray[index];
              oldArray.splice(index, 1, { id, count: ele.count + 1 });
            } else {
              oldArray.push({ id, count: 1 });
            }
          });
        }
      }
      oldArray.length && Vue.set(state.AtMsgMap, dialogId, oldArray);
    }
  },
  UPREADSTATE(state, { msg, index }) {
    // 更新接受消息的已读回执状态
    try {
      const listKey =
        msg.conversationType === ConversationModel.IMConversationEnum.PRIVATE
          ? "ChatMSG"
          : "GroupMSG";
      let list = state[listKey];
      let key = msg.targetId;
      if (list !== undefined && list.hasOwnProperty(key)) {
        if (index !== undefined) {
          let message = list[key][index];
          if (message) {
            message.receivedStatus = MessageModel.RecState.READ;
            Vue.set(state[listKey][key], index, message);
          }
        } else {
          const msgList = list[key];
          let length = msgList.length;
          for (let i = length - 1; i > -1; i--) {
            const message = msgList[i];
            if (
              !message.bySelf &&
              message.messageTime <= msg.messageTime &&
              message.receivedStatus === MessageModel.RecState.UNREAD
            ) {
              message.receivedStatus = MessageModel.RecState.READ;
              Vue.set(state[listKey][key], i, message);
            } else {
              break;
            }
          }
        }
      }
    } catch (error) {}
  },
  UPSENDSTATUS(state, { key, message, index }) {
    // 发送消息的状态
    try {
      const listKey =
        message.conversationType ===
        ConversationModel.IMConversationEnum.PRIVATE
          ? "ChatMSG"
          : "GroupMSG";
      if (typeof index === "number") {
        if (state[listKey].hasOwnProperty(key)) {
          let msg = state[listKey][key][index];
          Vue.set(state[listKey][key], index, { ...msg, ...message });
        }
      } else {
        try {
          let msgList = state[listKey][key] || [];
          msgList = [...msgList];
          let length = msgList.length;
          for (let i = length - 1; i > -1; i--) {
            const msg = msgList[i];
            if (
              message.content.extra &&
              msg.content.extra &&
              message.content.extra["pc-sign-uuid"] ===
                msg.content.extra["pc-sign-uuid"]
            ) {
              Vue.set(state[listKey][key], i, { ...msg, ...message });
              break;
            }
          }
        } catch (error) {}
      }
      // 发送消息后，消息时间会以服务器时间为准，因此需要重新对消息排序
      let temp = state[listKey][key];
      temp.sort((a, b) => {
        if (a && b) {
          return a.messageTime - b.messageTime;
        } else {
          if (a) {
            return 1;
          }
          if (b) {
            return -1;
          }
        }
      });
      Vue.set(state[listKey], key, temp);
      /* 处理会话最新一条消息 */
      const tempkey = `${message.conversationType}_${message.targetId}`;
      const tempmsg = state.LatestOneMsg[tempkey];
      if (
        tempmsg &&
        message.content.extra &&
        tempmsg.content.extra &&
        message.content.extra["pc-sign-uuid"] ===
          tempmsg.content.extra["pc-sign-uuid"]
      ) {
        Vue.set(state.LatestOneMsg, tempkey, {
          ...tempmsg,
          ...temp[temp.length - 1],
        });
      }
    } catch (error) {}
  },
  READRECEIPTMESSAGE(state, { message }) {
    // 更新消息的已读状态
    const listKey =
      message.conversationType === ConversationModel.IMConversationEnum.PRIVATE
        ? "ChatMSG"
        : "GroupMSG";
    let key = message.targetId;
    let messageList = state[listKey][key] || [];
    const { FAILED, READ, RECEIVED, DESTROYED, SENT } = MessageModel.SendStatus;

    for (let i = messageList.length - 1; i > -1; i--) {
      const msg = messageList[i];
      if (
        msg.bySelf &&
        msg.messageTime <= message.content.lastMessageSendTime &&
        msg.sentStatus === SENT
      ) {
        msg.sentStatus = READ;
        msg.sentStatusText = MessageModel.Message.getSentStatusText(
          msg.sentStatus
        );
        Vue.set(state[listKey][key], i, msg);
      } else if (
        msg.bySelf &&
        msg.messageTime <= message.content.lastMessageSendTime &&
        [READ].includes(msg.sentStatus)
      ) {
        break;
      } else {
        continue;
      }
    }
  },
  /**
   * 删除一条消息
   * @param {*} state
   * @param {*} param1
   */
  DELETEMESSAGE(state, { key, message, index }) {
    const listKey =
      message.conversationType === ConversationModel.IMConversationEnum.PRIVATE
        ? "ChatMSG"
        : "GroupMSG";
    if (typeof index === "number") {
      state[listKey][key].splice(index, 1);
    } else {
      const msgList = state[listKey][key] || [];
      for (let i = 0; i < msgList.length; i++) {
        const msg = msgList[i];
        if (msg.messageId == message.messageId) {
          state[listKey][key].splice(i, 1);
          const temp = msgList[msgList.length - 1];
          temp &&
            this.commit("UpdateLatestOneMsg", {
              message: temp,
              delmsg: message,
            });
          break;
        }
      }
    }
  },
  /**
   * 清空整个会话的消息
   * @param {*} state
   * @param {*} data
   */
  CLEARDIALOGMESSAGE(state, data) {
    const listKey =
      data.conversationType === ConversationModel.IMConversationEnum.PRIVATE
        ? "ChatMSG"
        : "GroupMSG";
    if (state[listKey][data.id]) {
      Vue.set(state[listKey], data.id, []);
    }
    if (data.clearLatest) {
      this.commit("UpdateLatestOneMsg", {
        operate: "del",
        targetId: data.id,
        conversationType: data.conversationType,
      });
    }
  },
  /**
   * 重置当前模块的state
   * @param {*} state
   */
  RESETSTATE(state) {
    const resetState = deepClone(stateTemplate("messageState"));
    for (const key in resetState) {
      if (resetState.hasOwnProperty(key)) {
        Vue.set(state, key, resetState[key]);
      }
    }
  },
  /**
   * 清空@消息
   * @param {*} state
   * @param {*} data
   */
  DELETEATMSGBYKEY(state, data) {
    Vue.set(state.AtMsgMap, `${data.conversationType}_${data.id}`, []);
  },
  /**
   * 撤回消息更新数据
   * @param {*} state
   * @param {*} param1
   */
  RECALLMESSAGE(state, { index, newMsg, msgKey }) {
    const listKey =
      newMsg.conversationType === ConversationModel.IMConversationEnum.PRIVATE
        ? "ChatMSG"
        : "GroupMSG";
    state[listKey][msgKey].splice(index, 1, newMsg);
    /* 处理会话最新一条消息数据 */
    const tempkey = `${newMsg.conversationType}_${newMsg.targetId}`;
    const tempmsg = state.LatestOneMsg[tempkey];
    if (tempmsg.sentTime === newMsg.sentTime) {
      for (const key in newMsg) {
        Vue.set(state.LatestOneMsg[tempkey], key, newMsg[key]);
      }
    }
  },
  /**
   * 更新会话的最新一条消息
   * @param {*} state
   * @param {*} message 消息
   * @param {string} operate 操作类型，set --- 强制赋值， add --- 添加、更新， del --- 删除、清空，默认add
   * @param {string} targetId 会话Id，如果传了message并且有targetId可不传当前参数
   * @param {string} conversationType 会话类型，如果传了message并且有conversationType可不传当前参数
   * @param {string} delmsg 被删除的消息，当删除消息时用来判断删除的是否是最新一条消息
   */
  UpdateLatestOneMsg(
    state,
    { message, operate = "add", targetId, conversationType, delmsg }
  ) {
    let key = `${conversationType}_${targetId}`;
    switch (operate) {
      case "add":
        const { sentTime } = message;
        key = `${message.conversationType}_${message.targetId}`;
        message.systemMessage = message.systemMessage || null;
        if (
          !state.LatestOneMsg[key] ||
          state.LatestOneMsg[key].sentTime <= sentTime
        ) {
          Vue.set(state.LatestOneMsg, key, message);
        } else if (
          delmsg &&
          state.LatestOneMsg[key].sentTime === delmsg.sentTime
        ) {
          Vue.set(state.LatestOneMsg, key, { ...message });
        }
        break;

      case "del":
        Vue.delete(state.LatestOneMsg, key);
        break;

      case "set":
        Vue.set(state.LatestOneMsg, key, message);
        break;
    }
  },
};

export default MUTATIONS;
