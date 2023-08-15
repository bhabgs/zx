import Vue from "vue";
import msgTools from "@/store/module/messageModule/msgTools";
import { MessageModel, ConversationModel } from "../../../WebIM";
import globalConfig from "@/global.config";
import { IMConversationEnum } from "../../../WebIM/conversation/ConversationModel";
import { MessageType } from "../../../WebIM/message/MessageModel";

const robot = globalConfig.robot;

const ACTIONS = {
  /**
   * 接收消息保存
   * @param {*} param0
   * @param {*} param1
   */
  ReceiveMessage({ commit, getters, dispatch }, { message }) {
    // 保存接收信息
    if (!message || !message.targetId) {
      return false;
    }
    let key = message.targetId;
    const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
    const mapKey = message.conversationType === PRIVATE ? "private" : "group";
    // todo
    try {
      let sendUser = robot[message.senderUserId] ||
        getters.GetAllUserMap[message.senderUserId] || { name: "" }; // 发送人信息
      let name = sendUser.name;
      let avatar = sendUser.avatar;

      if (message.messageType === MessageModel.MessageType.ZXTipMessage) {
        // 提示类消息
        msgTools.formatMessage({ dispatch, message, getters });
        // 新群本地标记免打扰
        if (message.content.operation === 'New' && message.conversationType === ConversationModel.IMConversationEnum.GROUP) {
          const { id } =JSON.parse(message.content.extra)
          // commit('DialogModule/SetConversationAttribute', {
          commit('SetConversationAttribute', {
            conversationType: 3,
            beId: id,
            operateType: 2,
            onOff: 1
          // }, { root: true });
          });
        }
      }
      message.bySelf &&
        message.sentStatus === MessageModel.SendStatus.SENDING &&
        (message.sentStatus = MessageModel.SendStatus.SENT);
      if (
        !message.bySelf &&
        getters.GetOpenDialog.id !== message.targetId &&
        !getters.GetIsHintMap[mapKey][message.targetId]
      ) {
        msgTools.sendNotify(name, avatar, message);
      }
      // let conversation = getters.GetDialogues[mapKey][message.targetId];
      // Logger.info({
      //   msg: "收到一条消息！",
      //   messageType: message.messageType,
      //   conversation: conversation.name,
      //   messageUId: message.messageUId,
      //   sentTime: new Date(message.sentTime).toLocaleString(),
      //   receivedTime: new Date(message.receivedTime).toLocaleString(),
      // });
    } catch (error) {}
    commit("SAVEMSG", { key, message, getters });
    dispatch("UpdateReminderMap", {
      key,
      data: message,
      type: true,
      number: 1
    });
    dispatch("AddDialogByKey", { key, type: message.conversationType });
  },
  /**
   * 发送消息保存
   * @param {*} param0
   * @param {*} param1
   */
  SaveSendMessage({ commit, dispatch, getters }, { message }) {
    // 保存发送信息
    if (!message || !message.targetId) {
      return false;
    }
    commit("SAVEMSG", { key: message.targetId, message, getters });
  },
  /**
   * 历史消息保存
   * @param {*} param0
   * @param {*} param1
   */
  SaveHistoryMessage(
    { commit, dispatch, getters },
    { message, isLast = false }
  ) {
    // 保存历史消息
    if (
      !message ||
      !message.targetId ||
      [
        MessageType.RecallCommandMessage,
        MessageType.ZXConversationOperateMsg,
        MessageType.ZXGatherMsg
      ].includes(message.messageType)
    ) {
      return false;
    }
    const key = message.targetId;
    const mapKey =
      message.conversationType === ConversationModel.IMConversationEnum.PRIVATE
        ? "PrivateMap"
        : "GroupMap";
    const timeMap = getters.getMessageTimeMap[mapKey][key] || [];
    if (
      timeMap &&
      timeMap.includes(`${message.sentTime}_${message.senderUserId}`)
    ) {
      return;
    }
    msgTools.formatMessage({ dispatch, message, getters, isHistory: true });
    commit("SAVEMSG", { key, message, isHistory: !isLast, getters, isLast });
    dispatch("AddDialogByKey", { key, type: message.conversationType });
  },

  UpReceiptState({ commit, getters }, [msg, index, key]) {
    // 接收到的消息更新已读回执的状态
    commit("UPREADSTATE", {
      msg,
      index,
      key
    });
  },
  UpSendStatus({ commit, getters }, { index, message }) {
    // 发送消息的状态
    commit("UPSENDSTATUS", { key: message.targetId, message, index });
  },

  ReadReceiptMessage({ commit, dispatch, getters }, { message }) {
    /**
     * 发送消息已读
     */
    let sender = message.senderUserId;
    if (sender === getters.GetSendUser.id) {
      return;
    }
    commit("READRECEIPTMESSAGE", { message });
  },
  DeleteMessage({ commit, getters, dispatch }, data) {
    commit("DELETEMESSAGE", data);
  },
  ClearDialogMessage({ commit, dispatch }, data) {
    commit("CLEARDIALOGMESSAGE", data);
  },
  DeleteAtMsgMapBykey({ commit }, data) {
    commit("DELETEATMSGBYKEY", data);
  },
  RecallMessage({ commit, getters, state, dispatch }, data) {
    if (data) {
      try {
        let msgKey =
          data.messageState === MessageModel.MessageState.RECEIVE
            ? data.targetId
            : data.content.targetId;

        const listKey =
          data.conversationType === ConversationModel.IMConversationEnum.PRIVATE
            ? "ChatMSG"
            : "GroupMSG";

        const msgList = state[listKey][msgKey] || [];
        for (let i = msgList.length - 1; i >= 0; i--) {
          const msg = msgList[i];
          if (msg.messageUId === data.content.messageUId) {
            let text = "撤回一条消息";

            if (msg.bySelf) {
              text = "您撤回了一条消息";
            } else {
              const user = getters.GetAllUserMap[msg.senderUserId];
              let name = "";
              if (user) {
                name = user.name;
              }
              text = `${name}撤回了一条消息`;
            }
            if (
              msg.sentStatus === MessageModel.SendStatus.SENT &&
              !msg.bySelf
            ) {
              dispatch("UpdateReminderMap", {
                type: false,
                key: msg.targetId,
                data: msg,
                number: 1,
                all: false
              });
            }
            msg.messageState = MessageModel.MessageState.RECALL;
            msg.systemMessage = text;
            msg.recallTime = data.messageTime;
            commit("RECALLMESSAGE", { data, index: i, newMsg: msg, msgKey });
            break;
          }
        }
      } catch (error) {}
    }
  },
  /**
   * 处理会话同步消息
   */
  disposeConversationSyncMsg({ commit, dispatch }, content) {
    const {
      conversationType,
      conversationId: beId,
      operateType,
      topStatus,
      doNotDisturb
    } = content;
    // const onOff = operateType === 1 ? topStatus : doNotDisturb;
    //置顶会话和免打扰都修改确保最新的数据是正确的
    dispatch("UpdataConversationAttribute", {
      conversationType: IMConversationEnum[conversationType.toUpperCase()],
      beId,
      operateType: 1,
      onOff: topStatus
    });
    dispatch("UpdataConversationAttribute", {
      conversationType: IMConversationEnum[conversationType.toUpperCase()],
      beId,
      operateType: 2,
      onOff: doNotDisturb
    });
  }
};

export default ACTIONS;
