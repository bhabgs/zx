import Vue from "vue";
import { MessageModel, IMSDKServer, ConversationModel } from "../WebIM";
import store from "../store";
import { Message } from "element-ui";
import { fromEvent } from "rxjs";
import moment from "moment";
import Util from "../plugin/utils";
// import FileManage from "../plugin/file-manage";
// import { MessageType } from "../WebIM/message/MessageModel";
import { localImgToThumbnail } from "../../lib/utils";
import { ipcRenderer } from "electron";
import { CHATGPT_PRIVAYE_ID } from "@/config/chatGpt.config";

const waitingSendMsg = []; // 等待发送消息列表
let isSendingMsg = false; // 标识判断是否在进行发送等待中的消息
let timeoutClearWaitingMsg = null; // 用来清理等来发送消息的定时器
let isShowNetworkOffline = false; // 是否已经显示断网提醒
fromEvent(document, "network-change").subscribe(event => {
  const { detail } = event;
  if (detail.state === "online" && !isSendingMsg) {
    clearTimeout(timeoutClearWaitingMsg);
    isSendingMsg = true;
    disposeWaitingMsg("send", waitingSendMsg);
    isSendingMsg = false;
    isShowNetworkOffline = false;
  }

  if (detail.state === "offline" && detail.showHint) {
    clearTimeout(timeoutClearWaitingMsg);
    timeoutClearWaitingMsg = setTimeout(() => {
      isShowNetworkOffline = true;
      disposeWaitingMsg("fail", waitingSendMsg);
    }, 40000);
  }
});

function disposeWaitingMsg(operate, list) {
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    if (item) {
      const { fn, message } = item;
      if (operate === "send") {
        fn && message && fn(message);
      } else {
        message.sentStatus = MessageModel.SendStatus.FAILED;
        store.dispatch("UpSendStatus", {
          message: MessageModel.Message.convertMsg(message)
        });
      }
    }
    list.splice(i, 1);
    i--;
  }
}

const MessageServer = {
  async DistributeSendMessage({
    conversationType,
    targetId,
    senderUserId,
    source,
    messageType,
    extendData,
    save = true
  }) {
    console.log("发送消息消息");
    // let user = new RongIMLib.UserInfo(
    //   store.getters.GetSendUser.id,
    //   store.getters.GetSendUser.name,
    //   store.getters.GetSendUser.avatar
    // ); // 生成发送者信息
    let user = {
      id: store.getters.GetSendUser.id,
      name: store.getters.GetSendUser.name,
      portraitUri: store.getters.GetSendUser.avatar
    }; // 生成发送者信息
    // let appendMsg = null,
    //   serverKey = "SendMessage";
    let message = MessageModel.packmysend({
      content: {
        ...source,
        extra: source.extra,
        user
      },
      messageType,
      targetId,
      conversationType,
      senderUserId,
      extendData
    });
    const self = Vue.prototype;
    switch (messageType) {
      case MessageModel.MessageType.TextMessage:
        source.data !== undefined && (message.content.content = source.data);
        break;
      case MessageModel.MessageType.ImageMessage:
      case MessageModel.MessageType.ZXGIFMsg:
        if (source.isBlob || source.isLocal) {
          let baseInfo = {};
          if (source.base64) {
            baseInfo = source.base64;
          } else {
            baseInfo = await localImgToThumbnail(source.path, 10000);
          }

          message.content.content = baseInfo.base64.replace(
            /data:image\/[^;]+;base64,/g,
            ""
          );
          if (messageType === MessageModel.MessageType.ZXGIFMsg) {
            message.content.width = baseInfo.width;
            message.content.height = baseInfo.height;
          }
        }
        break;
      case MessageModel.MessageType.FileMessage:
        break;
    }
    self.$service.SendMessageHandle.call(self, message, save);
    // else if (isShowNetworkOffline && save) {
    //   message.sentStatus = MessageModel.SendStatus.FAILED;
    //   store.dispatch("UpSendStatus", {
    //     message: MessageModel.Message.convertMsg(message)
    //   });
    // } else {
    //   waitingSendMsg.push({ fn: self.$service[serverKey].bind(self), message });
    // }
  },
  SendMessageHandle(message, save = false, isResend = false) {
    console.log("发消息", message);
    const self = Vue.prototype;
    let appendMsg = null,
      serverKey = "SendMessage";
    switch (message.messageType) {
      case MessageModel.MessageType.TextMessage:
        serverKey = "SendTextMessage";
        break;
      case MessageModel.MessageType.ImageMessage:
      case MessageModel.MessageType.ZXGIFMsg:
        serverKey = "SendImageMessage";
        break;
      case MessageModel.MessageType.FileMessage:
        serverKey = "SendFileMessage";
        break;
    }
    appendMsg = MessageModel.Message.convertMsg(message);
    ipcRenderer.invoke("sqlite-receive", {
      key: "DistributeSendMessage",
      msg: appendMsg
    });
    if (save) {
      store.dispatch("SaveSendMessage", { message: appendMsg });
    }
    if (store.getters.GetNetWorkState === "online") {
      if (!message.messageUId) {
        self.$service[serverKey].call(self, message, save || isResend);
      } else {
        store.dispatch("DeleteMessage", { key: message.targetId, message });
      }
    } else {
      message.sentStatus = MessageModel.SendStatus.FAILED;
      store.dispatch("UpSendStatus", {
        message: MessageModel.Message.convertMsg(message)
      });
    }
    // message.sentStatus = MessageModel.SendStatus.FAILED;
    // store.dispatch("UpSendStatus", {
    //   message: MessageModel.Message.convertMsg(message),
    // });
  },
  /**
   * 发送消息
   * @param {*} msg
   */
  SendMessage(msg, save = true) {
    let msgIntance = new MessageModel.Message();
    let result = msgIntance
      .send(msg)
      .then(response => {
        console.log("send success", response);
        try {
          if (
            response.content.mentionedInfo &&
            response.content.mentionedInfo.type === RongIMLib.MentionedType.PART
          ) {
            const ids = response.content.mentionedInfo.userIdList.filter(id =>
              id.includes("robot")
            );
            if (ids.length) {
              Vue.prototype.$service.putMessageRobot({
                chatAccountIds: ids,
                content: response.content.content,
                groupId: response.targetId
              });
            }
          }
          // if (
          //   response.targetId === CHATGPT_PRIVAYE_ID &&
          //   msg.messageType === MessageModel.MessageType.TextMessage
          // ) {
          //   Vue.prototype.$service.putMessageRobot({
          //     chatAccountIds: [CHATGPT_PRIVAYE_ID],
          //     content: response.content.content,
          //     groupId: msg.senderUserId
          //   });
          // }
          if (
            response.targetId.includes("robot_") &&
            msg.messageType === MessageModel.MessageType.TextMessage
          ) {
            Vue.prototype.$service.putMessagepersonalAssistant({
              accountId: msg.senderUserId,
              content: response.content.content,
              personalAssistantAccountId: response.targetId
            });
          }
        } catch (error) {
          console.error(error);
        }
        let message = MessageModel.Message.convertMsg(response);
        ipcRenderer.invoke("sqlite-receive", {
          key: "SendMessage",
          msg: message
        });
        save && store.dispatch("UpSendStatus", { message });
        return message;
      })
      .catch(error => {
        console.error(error);
        let message = msg;
        if (error && error.data) {
          error.data.sentTime = error.data.sentTime || msg.sentTime;
          message = MessageModel.Message.convertMsg(error.data);
          message.errorMessage = error.message;
        } else {
          message.sentStatus = MessageModel.SendStatus.FAILED;
          message = MessageModel.Message.convertMsg(message);
        }
        save && store.dispatch("UpSendStatus", { message });
        return message;
      });
    return result;
  },
  /**
   * 发送文本消息
   * @param {Object} message 消息
   */
  SendTextMessage(message) {
    this.$service.SendMessage(message);
  },
  /**
   * 发送图片消息
   * @param {Object} message
   */
  async SendImageMessage(message) {
    let isLocal = message.content.isLocal,
      data = message.content || {},
      isEncrypt = message.content.isEncrypt;
    switch (true) {
      case isLocal:
        try {
          let msg = { ...message };
          let content = { ...data };

          if (message.content.imgUri) {
            content.imageUri = message.content.imgUri;
          } else {
            let type = data.name
              ? Util.getFileTypeByName(data.name)
              : data.type;
            let fileData = data.path ? data.path : data.buffer;
            const uploadResult = await Vue.prototype.$service.ossUploadAli(
              fileData,
              {
                type,
                isPub: false
              }
            );
            content.imageUri = uploadResult.url;
          }

          delete content.isBlob;
          delete content.data;
          delete content.isEncrypt;
          delete content.base64;
          delete content.path;
          delete content.buffer;
          delete content.isLocal;

          msg.content = content;
          this.$service.SendMessage(msg);
        } catch (error) {
          console.error(error);
          message.sentStatus = MessageModel.SendStatus.FAILED;
          store.dispatch("UpSendStatus", {
            message: MessageModel.Message.convertMsg(message)
          });
        }
        break;

      default:
        this.$service.SendMessage(message);
        break;
    }
  },
  /**
   * 发送文件消息
   * @param {Object} message
   */
  async SendFileMessage(message) {
    let isLocal = message.content.isLocal,
      data = message.content || {},
      isEncrypt = message.content.isEncrypt;

    switch (true) {
      case isLocal:
        try {
          let type = !data.type ? Util.getFileTypeByName(data.name) : data.type;
          let fileData = data.path ? data.path : data.buffer;
          const uploadResult = await Vue.prototype.$service.ossUploadAli(
            fileData,
            {
              type,
              isPub: false
            }
          );

          let msg = { ...message };
          let content = { ...data };

          delete content.isBlob;
          delete content.data;
          delete content.isEncrypt;
          delete content.base64;
          delete content.path;
          delete content.buffer;
          delete content.isLocal;

          content.fileUrl = uploadResult.url;
          msg.content = content;
          this.$service.SendMessage(msg);
        } catch (error) {
          console.error(error);
          message.sentStatus = MessageModel.SendStatus.FAILED;
          store.dispatch("UpSendStatus", {
            message: MessageModel.Message.convertMsg(message)
          });
        }
        break;

      default:
        this.$service.SendMessage(message);
        break;
    }
  },
  /**
   * 发送消息已读通知消息
   * @param {*} messageUId 消息唯一 Id
   * @param {*} lastMessageSendTime 最后一条消息的发送时间
   * @param {*} type 备用，默认赋值 1 即可。
   * @param {*} targetId 目标 Id
   * @param {*} conversationType 会话类型，群聊/单聊
   */
  SendReadReceiptMessage({ index, msg, type = 1, conversationType, key }) {
    let msgIntance = new MessageModel.Message();
    let content = new RongIMLib.ReadReceiptMessage({
      messageUId: msg.messageUId,
      lastMessageSendTime: msg.sentTime,
      type: type
    });
    let result = msgIntance
      .send({
        ...content,
        targetId: msg.targetId,
        messageType: msgIntance.messageType.ReadReceiptMessage,
        conversationType
      })
      .then(response => {
        console.log("send success", 456, response);
        store.dispatch("UpReceiptState", [msg, index, key]);
        let chatType =
          conversationType === ConversationModel.IMConversationEnum.PRIVATE
            ? 1
            : 2;
        Vue.prototype.$service.readMessageSync({
          targetId: msg.targetId,
          msgVos: [],
          chatType
        });
      })
      .catch(error => {});
    try {
      let syncContent = new RongIMLib.SyncReadStatusMessage({
        lastMessageSendTime: msg.sentTime
      });
      msgIntance
        .send({
          targetId: msg.targetId,
          content: syncContent,
          messageType: msgIntance.messageType.SyncReadStatusMessage,
          conversationType
        })
        .then(response => {
          console.log("send success", 123, response);
        })
        .catch(err => {});
    } catch (error) {}
    return result;
  },
  RecallMessageServer(message) {
    IMSDKServer.setRecallMessage(message)
      .then(result => {
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceivedRecallCommandMessage",
          msg: MessageModel.Message.convertMsg(result)
        });
        store.dispatch(
          "RecallMessage",
          MessageModel.Message.convertMsg(result)
        );
      })
      .catch(error => {
        Message.warning(error.message);
      });
  },
  /**
   * 获取历史消息
   * @param {number} conversationTyepe 会话类型
   * @param {string} targetId 会话id
   * @param {string} fromUserId 发送人Id，当前登录用户accountId
   * @param {string} toUserId 会话id
   * @param {string} lastTime 获取时间戳, null 为自动拉取, 0 为从当前时间拉取
   * @param {string} groupId 群Id
   * @param {number} size 获取条数，范围1~20，默认20
   * @param {boolean} isSave 获取后是否自动保存本地缓存中，true-保存，false-不保存，默认为true
   * @param {number} order 获取顺序, 默认为 0. 0: 获取 timestrap 之前的消息, 1: 获取 timestrap 之后的消息
   * @param {object} config 接口请求配置
   * @returns list 消息列表, 按照时间戳从小到大排序
   * @returns has 是否还有数据
   */
  async getHistoryMessageServe(
    {
      conversationType,
      targetId,
      fromUserId,
      toUserId,
      lastTime,
      groupId,
      size = 20,
      isSave = true,
      order = 0
    },
    config = {}
  ) {
    // order 为1, 并且lastTime为六个月之前时要先调用远程，获取不到再调用融云服务做补充
    // 默认融云保存最近六个月的历史消息
    // order 为0时先调用融云，获取不到时或条数不够时再调用远程服务
    const defaultTime = moment()
      .subtract(6, "month")
      .toDate()
      .getTime();
    let firstData = null;
    let secondIsServer = false; // 标记第二次请求是否强制使用服务器
    const slide = order === 0 ? "DOWN" : "UP";
    if (order === 1 && lastTime < defaultTime) {
      firstData = await this.getServerHistoryMessage(
        {
          fromUserId,
          toUserId,
          lastTime,
          groupId,
          size,
          slide
        },
        config
      );
    } else {
      firstData = await this.getIMHistoryMessage({
        conversationType,
        targetId,
        lastTime,
        size,
        order
      });
      secondIsServer = true;
    }
    let list = firstData.list || [];
    let has = firstData.has;

    const diffLength = size - list.length;

    let next_last_time = lastTime;
    if (list.length) {
      // 取列表第一条消息的时间戳继续请求
      // 从融云获取，此时时间戳由小到大，order为0获取timestamp之前，取最小的时间戳
      // 从融云获取，此时时间戳由小到大，order为1获取timestamp之后，取最大的时间戳
      // 从chat服务获取，order为0获取timestamp之前，此时时间戳由大到小排序，，取最小的时间戳
      // 从chat服务获取，order为1获取timestamp之后，此时时间戳由小到大，取最大时间戳
      let latestMsg = null;
      if (order === 0 && secondIsServer) {
        latestMsg = list[0];
      } else {
        latestMsg = list[list.length - 1];
      }
      latestMsg && (next_last_time = latestMsg.sentTime || lastTime);
    }
    if (!list.length || (!has && diffLength)) {
      let secondData = null;
      if ((order === 1 && next_last_time < defaultTime) || secondIsServer) {
        secondData = await this.getServerHistoryMessage(
          {
            fromUserId,
            toUserId,
            lastTime: next_last_time,
            groupId,
            size: diffLength,
            slide
          },
          config
        );
      } else {
        secondData = await this.getIMHistoryMessage({
          conversationType,
          targetId,
          lastTime: next_last_time,
          size: diffLength,
          order
        });
      }
      if (secondData) {
        list = list.concat(secondData.list);
        // 按照时间戳由小到大进行排序处理
        list.sort((a, b) => {
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
        has = secondData.has;
      }
    } else {
      has = true;
    }
    if (isSave) {
      list.forEach(message => {
        store.dispatch("SaveHistoryMessage", { message });
      });
    }
    ipcRenderer.invoke("sqlite-url", {
      key: "getHistoryMessageServe",
      data: list
    });
    return { has, list };
  },
  /**
   * 从远程服务器获取历史消息
   * @param {string} fromUserId 发送人Id，当前登录用户accountId
   * @param {string} toUserId 会话id
   * @param {string} lastTime 获取时间戳, null 为自动拉取, 0 为从当前时间拉取
   * @param {string} groupId 群Id
   * @param {number} size 获取条数，范围1~20，默认20
   * @param {string} slide 获取方向，DOWN-lastTime之前，UP-lastTime之后
   * @param {*} config
   * @returns 消息列表，UP时时间戳由小到大排序，DOWN时时间戳由大到小顺序排列
   */
  getServerHistoryMessage(
    { fromUserId, toUserId, lastTime, groupId, size = 20, slide },
    config = {}
  ) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/datasyn/getRcMessageInfo`,
        {
          fromUserId, // 发送人id
          toUserId, // 接收人id
          lastTime, // 最后一次时间
          groupId, // 群id
          size, // 条数
          slide
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          // 原始消息列表，UP时时间戳由小到大排序，DOWN时时间戳有大到小顺序排列
          let list = response.data.data || [];
          const length = list.length;
          list = list
            .map(message => {
              let msg = MessageModel.Message.convertHitoryMessage(message);
              return msg;
            })
            .filter(msg => !!msg);

          return {
            has: length === size,
            list
          };
        } else {
          return Promise.reject();
        }
      });
  },
  /**
   * 从IM获取历史消息
   * @param {number} conversationTyepe 会话类型
   * @param {string} targetId 会话id
   * @param {string} lastTime 获取时间戳, null 为自动拉取, 0 为从当前时间拉取
   * @param {number} size 获取条数，范围1~20，默认20
   * @param {number} order 获取顺序, 默认为 0. 0: 获取 timestrap 之前的消息, 1: 获取 timestrap 之后的消息
   * @requires  消息列表，order为0或1时，都是时间戳由小到大排序
   */
  getIMHistoryMessage({ conversationType, targetId, lastTime, size, order }) {
    return IMSDKServer.getHistoryMessage(
      conversationType,
      targetId,
      lastTime,
      size,
      order
    ).then(response => {
      let list = response.data || [];
      const length = list.length;
      if (length) {
        list = list
          .map(message => {
            if (
              ![MessageModel.MessageType.RecallCommandMessage].includes(
                message.messageType
              )
            ) {
              let msg = MessageModel.Message.convertMsg(message, true);
              return msg;
            }
          })
          .filter(item => !!item);
      }

      return { has: response.has, list };
    });
  },
  deleteMessageSync({ type, targetId, chatType, ...data }, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/datasyn/deleteMessage`,
        {
          type,
          targetId,
          accountId: store.getters.GetSendUser.id,
          deleteSource: "websocket",
          chatType,
          ...data
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data;
          return data;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  readMessageSync({ targetId, chatType, ...data }, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/datasyn/readMessage`,
        {
          targetId,
          accountId: store.getters.GetSendUser.id,
          readSource: "websocket",
          chatType,
          ...data
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data;
          return data;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};

export default MessageServer;
