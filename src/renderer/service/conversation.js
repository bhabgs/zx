import Vue from "vue";
import { MessageModel, ConversationModel, IMSDKServer } from "../WebIM";
import store from "../store";
import { IMConversationEnum } from "../WebIM/conversation/ConversationModel";
import {
  CHATGPT_PRIVAYE_ID,
  CHATGPT_PRIVAYE_NAME,
  TO_CHATGPT_PRIVAYE
} from "@/config/chatGpt.config";

export default {
  /**
   * 获取会话列表并进行数据处理
   * @param {*} types
   * @param {*} limit
   */
  getConversationByIM(types = null, limit = 50) {
    return IMSDKServer.getConversationList(types, limit).then(response => {
      if (response) {
        const promises = [];
        response.forEach(item => {
          let latestMessage = item.latestMessage;
          latestMessage.targetId = latestMessage.targetId || item.targetId;
          let msg = MessageModel.Message.convertMsg(latestMessage, true);

          if (
            msg.targetId === store.getters.GetSendUser.id &&
            msg.senderUserId !== store.getters.GetSendUser.id
          ) {
            return;
          }
          // if (
          //   [MessageModel.MessageType.RecallCommandMessage].includes(
          //     msg.messageType
          //   )
          // ) {
          let data = {
            conversationType: msg.conversationType,
            toUserId: msg.targetId,
            targetId: msg.targetId,
            fromUserId: store.getters.GetSendUser.id,
            lastTime: 0,
            size: 2
          };
          promises.push(data);
          // Vue.prototype.$service.getHistoryMessageServe(data);
          // } else {
          //   store.dispatch("SaveHistoryMessage", {
          //     message: msg,
          //     isLast: true
          //   });
          // }
        });

        return Promise.all(
          promises.map(data =>
            Vue.prototype.$service.getHistoryMessageServe(data)
          )
        ).finally(() => {
          store.dispatch("SaveConversation", response);
          const TopMap = store.getters.GetTopMap;
          const robots = store.getters.GetRobotList;
          if (robots && robots.length) {
            for (let i = 0; i < robots.length; i++) {
              if (!robots[i].isDelinConversation && robots[i].isDel != 1) {
                // 在会话中删除的机器人初始化不展示;
                if (
                  robots[i].isDelinConversation !== 1 &&
                  robots[i].isDelinConversation !== 0
                ) {
                  this.createChatGptConversation(robots[i], true);
                } else {
                  const isTop = TopMap.private[robots[i].accountId] || false;
                  this.createChatGptConversation(robots[i], isTop);
                }
              }
            }
          }
        });
      }
    });
  },
  // 获取属性（置顶，免打扰）
  getGroupAttribute({ accountId }, config = {}) {
    return this.$http
      .post(
        `${this.$apipath.chatPath}/group/getGroupAttribute`,
        {
          accountId
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      });
  },
  // 设置属性（置顶、免打扰）
  // beId：被操作（群、人）id
  // operateType：1、置顶，2、免打扰
  // onOff：1、添加，2、取消
  // objectType：1、群，2、人
  setGroupAttribute(
    { beId, conversationType, operateType, onOff, topStatus, doNotDisturb },
    config = {}
  ) {
    const { corpId, accountId } = store.getters.GetCompany;
    const sender = store.getters.GetSendUser;
    const objectType = conversationType === IMConversationEnum.PRIVATE ? 2 : 1;
    return this.$http
      .post(
        `${this.$apipath.chatPath}/group/setGroupAttribute`,
        {
          corpId,
          accountId,
          beId,
          operateType,
          onOff,
          objectType
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          if (response.data) {
            const sendData = {
              operateType,
              conversationId: beId,
              topStatus,
              doNotDisturb
            };
            sendData.conversationType = IMConversationEnum[
              conversationType
            ].toLowerCase();

            let dataKey = operateType === 1 ? "topStatus" : "doNotDisturb";

            sendData[dataKey] = onOff;
            sendData.time = response.data.ctime;
            Vue.prototype.$service
              .DistributeSendMessage({
                conversationType: IMConversationEnum.PRIVATE,
                targetId: sender.id,
                senderUserId: sender.id,
                messageType: MessageModel.MessageType.ZXConversationOperateMsg,
                source: sendData,
                save: false
              })
              .catch(e => {
                console.error(e);
              });
            store.dispatch("disposeConversationSyncMsg", {
              ...sendData,
              onOff
            });
          }
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      });
  },
  searchRecordList(postdata, config = {}) {
    return this.$http
      .post(`${this.$apipath.search}/searchByType`, postdata, config)
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      });
  },
  searchRecordAll(postdata, config = {}) {
    return this.$http
      .post(`${this.$apipath.search}/search`, postdata, config)
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      });
  },
  /**
   * 创建自己和自己的对话，即个人文件管理
   * @param {Boolean} isAdd 是否添加到会话列表
   * @param {Boolean} isHis 是否获取历史消息
   */
  createSelfConversation(isAdd = true, isHis = true) {
    const SendUser = store.getters.GetSendUser;
    let dialogue = null;
    dialogue = new ConversationModel.IMConversation(
      {
        id: SendUser.id,
        avatar: SendUser.avatar,
        groupType: 0,
        name: SendUser.userName
      },
      ConversationModel.IMConversationEnum.PRIVATE
    );
    if (isAdd) {
      store.dispatch("PushDialogue", dialogue);
    }

    if (isHis) {
      let data = {
        conversationType: ConversationModel.IMConversationEnum.PRIVATE,
        toUserId: SendUser.id,
        targetId: SendUser.id,
        fromUserId: SendUser.id,
        lastTime: 0,
        size: 2
      };
      Vue.prototype.$service.getHistoryMessageServe(data);
    }

    return dialogue;
  },

  /**
   * 创建chatGPT会话
   * @param {*} isAdd
   * @param {*} isHis
   */
  createChatGptConversation(robot, isTop = true) {
    const SendUser = store.getters.GetSendUser;
    let dialogue = null;
    dialogue = new ConversationModel.IMConversation(
      {
        id: robot.accountId,
        avatar: robot.iconUrl,
        groupType: 0,
        name: robot.name
      },
      ConversationModel.IMConversationEnum.PRIVATE
    );
    store.dispatch("PushDialogue", dialogue);
    if (isTop) {
      // 默认chatGpt机器人置顶
      store.dispatch("UpdataConversationAttribute", {
        conversationType: ConversationModel.IMConversationEnum.PRIVATE,
        beId: robot.accountId,
        operateType: 1,
        onOff: 1
      });
    }

    let data = {
      conversationType: ConversationModel.IMConversationEnum.PRIVATE,
      toUserId: robot.accountId,
      targetId: robot.accountId,
      fromUserId: SendUser.id,
      lastTime: 0,
      size: 2
    };
    Vue.prototype.$service.getHistoryMessageServe(data);

    return dialogue;
  }
};
