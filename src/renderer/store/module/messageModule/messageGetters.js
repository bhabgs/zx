import { ConversationModel } from "../../../WebIM";
import GlobalConfig from "../../../global.config";

const GETTERS = {
  GetMessages(state, getters) {
    // 获取消息
    let msgList = []; // 消息列表
    let ids = []; // 消息id集合
    if (
      getters.GetOpenDialog.conversationType ===
      ConversationModel.IMConversationEnum.PRIVATE
    ) {
      msgList = state.ChatMSG[getters.GetOpenDialog.id] || [];
    } else {
      msgList = state.GroupMSG[getters.GetOpenDialog.id] || [];
    } // 根据会话类型去除消息列表
    msgList = [...msgList];
    msgList = msgList.filter((msg, index, list) => {
      if (!msg.messageUId) {
        return msg;
      } else if (!ids.includes(msg.messageUId)) {
        ids.push(msg.messageUId);

        return msg;
      }
    }); // 根据messageUId去除重复消息
    msgList = msgList
      .reverse()
      .map((msg, index, list) => {
        const nextMsg = list[index + 1];
        if (nextMsg) {
          const diffTime = msg.messageTime - nextMsg.messageTime;
          msg.showTime = diffTime > GlobalConfig.message_show_time_space;
        } else {
          msg.showTime = true;
        }
        return msg;
      })
      .reverse(); // 消息时间展示计算
    return msgList;
  },
  GetAtMsgMap(state) {
    return state.AtMsgMap;
  },
  GetLatestOneMsg(state) {
    return state.LatestOneMsg;
  },
  /* GetPrivateLatestMsg(state, getters) {
    let LatestMessage = {};
    try {
      let ChatMSG = state.ChatMSG;
      Object.keys(ChatMSG).forEach(key => {
        let msgList = ChatMSG[key];
        if (msgList) {
          LatestMessage[key] = msgList[msgList.length - 1];
        }
      });
    } catch (error) {}

    return LatestMessage;
  },
  GetGroupLatestMsg(state) {
    let LatestMessage = {};
    try {
      let GroupMSG = state.GroupMSG;
      Object.keys(GroupMSG).forEach(key => {
        let msgList = GroupMSG[key];
        if (msgList) {
          LatestMessage[key] = msgList[msgList.length - 1];
        }
      });
    } catch (error) {}

    return LatestMessage;
  }, */
  getMessageTimeMap(state) {
    let PrivateMap = {},
      GroupMap = {};
    for (const convId in state.ChatMSG) {
      const msgList = state.ChatMSG[convId] || [];
      PrivateMap[convId] = PrivateMap[convId] || [];
      msgList.forEach(msg => {
        PrivateMap[convId].push(`${msg.sentTime}_${msg.senderUserId}`);
      });
    }

    for (const convId in state.GroupMSG) {
      const msgList = state.GroupMSG[convId] || [];
      GroupMap[convId] = GroupMap[convId] || [];
      msgList.forEach(msg => {
        GroupMap[convId].push(`${msg.sentTime}_${msg.senderUserId}`);
      });
    }

    return { PrivateMap, GroupMap };
  },
  getPrivateMsg(state) {
    return state.ChatMSG;
  },
  getGroupMsg(state) {
    return state.GroupMSG;
  }
};

export default GETTERS;
