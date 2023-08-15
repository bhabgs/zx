import Vue from "vue";

import { IMConversationEnum } from "../conversation/ConversationModel";
import Emoji from "../emoji";
import { Util, Queue } from "../../plugin";
import { IMSDKServer, ConversationModel } from "..";
import store from "../../store";
import CustomMessage from "./customMessageConfig";

/**
 * 消息类型
 */
const MessageType = {
  DiscussionNotificationMessage: "DiscussionNotificationMessage",
  TextMessage: "TextMessage",
  ImageMessage: "ImageMessage",
  VoiceMessage: "VoiceMessage",
  RichContentMessage: "RichContentMessage",
  HandshakeMessage: "HandshakeMessage",
  HandShakeResponseMessage: "HandShakeResponseMessage",
  UnknownMessage: "UnknownMessage",
  SuspendMessage: "SuspendMessage",
  LocationMessage: "LocationMessage",
  InformationNotificationMessage: "InformationNotificationMessage",
  ContactNotificationMessage: "ContactNotificationMessage",
  ProfileNotificationMessage: "ProfileNotificationMessage",
  CommandNotificationMessage: "CommandNotificationMessage",
  ReadReceiptMessage: "ReadReceiptMessage",
  TypingStatusMessage: "TypingStatusMessage",
  FileMessage: "FileMessage",
  GroupNotificationMessage: "GroupNotificationMessage",
  RecallCommandMessage: "RecallCommandMessage",
  InviteMessage: "InviteMessage",
  HungupMessage: "HungupMessage",
  ReadReceiptRequestMessage: "ReadReceiptRequestMessage",
  ReadReceiptResponseMessage: "ReadReceiptResponseMessage",
  SyncReadStatusMessage: "SyncReadStatusMessage",
  CommandMessage: "CommandMessage",
};

const MsgObjectNameEnum = {
  TextMessage: "RC:TxtMsg", // 文字消息
  ImageMessage: "RC:ImgMsg", // 图片消息
  VoiceMessage: "RC:VcMsg", // 语音消息
  RichContentMessage: "RC:ImgTextMsg", // 图文消息
  FileMessage: "RC:FileMsg", // 文件消息
  LocationMessage: "RC:LBSMsg", // 位置消息
  SightMessage: "RC:SightMsg", // 小视频消息
  PublicServiceRichContentMessage: "RC:PSImgTxtMsg", // 公众服务单图文消息
  PublicServiceMultiRichContentMessage: "RC:PSMultiImgTxtMsg", // 公众服务多图文消息
  ContactNotificationMessage: "RC:ContactNtf", // 好友通知消息
  ProfileNotificationMessage: "RC:ProfileNtf", //资料通知消息
  CommandNotificationMessage: "RC:CmdNtf", //通用命令通知消息
  InformationNotificationMessage: "RC:InfoNtf", //提示条通知消息
  GroupNotificationMessage: "RC:GrpNtf", //群组通知消息
  ReadReceiptMessage: "RC:ReadNtf", //已读通知消息
  PublicServiceCommandMessage: "RC:PSCmd", //公众服务命令消息
  CommandMessage: "RC:CmdMsg", //命令消息
  TypingStatusMessage: "RC:TypSts", //对方正在输入状态消息
  ReadReceiptResponseMessage: "RC:RRRspMsg", //群消息已读状态回执
  "RC:TxtMsg": "TextMessage",
  "RC:ImgMsg": "ImageMessage",
  "RC:VcMsg": "VoiceMessage",
  "RC:ImgTextMsg": "RichContentMessage",
  "RC:FileMsg": "FileMessage",
  "RC:LBSMsg": "LocationMessage",
  "RC:SightMsg": "SightMessage",
  "RC:PSImgTxtMsg": "PublicServiceRichContentMessage",
  "RC:PSMultiImgTxtMsg": "PublicServiceMultiRichContentMessage",
  "RC:ContactNtf": "ContactNotificationMessage",
  "RC:ProfileNtf": "ProfileNotificationMessage",
  "RC:CmdNtf": "CommandNotificationMessage",
  "RC:InfoNtf": "InformationNotificationMessage",
  "RC:GrpNtf": "GroupNotificationMessage",
  "RC:ReadNtf": "ReadReceiptMessage",
  "RC:PSCmd": "PublicServiceCommandMessage",
  "RC:CmdMsg": "CommandMessage",
  "RC:TypSts": "TypingStatusMessage",
  "RC:RRRspMsg": "ReadReceiptResponseMessage"
};

/**
 * 将自定义消息添加到枚举中
 */
CustomMessage.forEach(message => {
  MessageType[message.messageName] = message.messageName;
  MsgObjectNameEnum[message.messageName] = message.objectName;
  MsgObjectNameEnum[message.objectName] = message.messageName;
});

/**
 * 接收到消息的状态
 */
const RecState = {
  0: "UNREAD",
  1: "READ",
  2: "LISTENED",
  4: "DOWNLOADED",
  8: "RETRIEVED",
  UNREAD: 0,
  READ: 1,
  LISTENED: 2,
  DOWNLOADED: 4,
  RETRIEVED: 8
};

/**
 * 发送消息的状态
 */
const SendStatus = {
  10: "SENDING",
  20: "FAILED",
  30: "SENT",
  40: "RECEIVED",
  50: "READ",
  60: "DESTROYED",
  SENDING: 10,
  FAILED: 20,
  SENT: 30,
  RECEIVED: 40,
  READ: 50,
  DESTROYED: 60
};

/**
 * 消息的形式
 */
const MessageState = {
  1: "SENT",
  2: "RECEIVE",
  3: "RECALL",
  SENT: 1,
  RECEIVE: 2,
  RECALL: 3
};

const SendMessageQueue = new Queue(); // 初始化消息发送队列
let timedTask = null;
SendMessageQueue.subscribe(() => {
  if (!timedTask) {
    try {
      if (SendMessageQueue.size() < 2) {
        QueueSending();
      }
      timedTask = setInterval(() => {
        QueueSending();
      }, 200);
    } catch (error) {}
  }
});

function QueueSending() {
  let item = SendMessageQueue.dequeue();

  try {
    item && item.fn(...item.args);
  } catch (error) {
    window.Logger.log({ message: "[MessageModel]IMSDKServer.sendMessage call failed", content: `${item.args[2].content.content && item.args[2].content.content.substr(0, 2)}...`, error: error.message || error });
    item && item.args[3] && item.args[3].onError(RongIMLib.ErrorCode.UNKNOWN, null);
  }

  if (SendMessageQueue.size() === 0) {
    clearInterval(timedTask);
    timedTask = null;
  }
}

/**
 * 消息类
 * IM消息类再封装
 * 主要增加SDK message 转换
 */
const customMsgType = CustomMessage.map(msg => msg.messageName);
class Message {
  instance = IMSDKServer.getInstance();
  messageType = MessageType;
  constructor() {}

  send(sourceMsg) {
    let isMentiondMsg = false;
    let pushText = null;
    let appData = null;
    let methodType = null;
    let opts = null;
    if (sourceMsg.extendData && Object.keys(sourceMsg.extendData).length > 0) {
      isMentiondMsg = sourceMsg.extendData.isMentiondMsg;
      pushText = sourceMsg.extendData.pushText;
      appData = sourceMsg.extendData.appData;
      methodType = sourceMsg.extendData.methodType;
      opts = sourceMsg.extendData.opts;
    }
    this.ConType = IMConversationEnum[sourceMsg.conversationType];
    const conversationType = RongIMLib.ConversationType[this.ConType];
    const MessageObject = customMsgType.includes(sourceMsg.messageType)
      ? RongIMClient.RegisterMessage[sourceMsg.messageType]
      : RongIMLib[sourceMsg.messageType]; // 获取消息对象

    const msg = new MessageObject(sourceMsg.content); // 生成消息内容

    const promise = new Promise((resolve, reject) => {
      SendMessageQueue.enqueue({
        fn: this.instance.sendMessage.bind(this.instance),
        args: [
          conversationType,
          sourceMsg.targetId,
          msg,
          {
            onSuccess(message) {
              resolve(message);
            },
            onError(errorCode, message) {
              const errorResult = Message.SendErrorHandler(errorCode, message);
              reject(errorResult);
            }
          },
          isMentiondMsg,
          pushText,
          appData,
          // methodType,  // 2.9.1已去掉该参数
          opts
        ]
      });
    });
    return promise;
  }

  static convertMsg(SDKMsg, isHis = false) {
    let msg = {};
    msg.bySelf = SDKMsg.messageDirection === 1;
    msg.conversationType = SDKMsg.conversationType;
    msg.extra = SDKMsg.extra;
    msg.isLocalMessage = SDKMsg.isLocalMessage;
    msg.messageDirection = SDKMsg.messageDirection; // 1：发送SEND，2：接收RECEIVE
    msg.messageId = SDKMsg.messageId;
    msg.messageType = SDKMsg.messageType;
    msg.messageUId = SDKMsg.messageUId;
    msg.objectName = SDKMsg.objectName;
    msg.offLineMessage = SDKMsg.offLineMessage;
    msg.receiptResponse = SDKMsg.receiptResponse;
    msg.receivedStatus = SDKMsg.receivedStatus; // 0: UNREAD 1：READ，2：LISTENED，4：DOWNLOADED
    msg.recState = SDKMsg.receivedStatus;
    msg.receivedTime = SDKMsg.receivedTime;
    msg.senderUserId = SDKMsg.senderUserId;
    msg.sentStatus = SDKMsg.sentStatus;
    if (
      (!SDKMsg.sentStatus || msg.sentStatus === SendStatus.SENT) &&  // 融云历史消息返回的都是未读状态，此处只能当做已读处理
      msg.bySelf &&
      SDKMsg.receivedStatus !== undefined &&
      SDKMsg.offLineMessage
    ) {
      msg.sentStatus = SendStatus.READ;
    }
    msg.sentTime = SDKMsg.sentTime;
    msg.targetId = SDKMsg.targetId;
    msg.sentStatusText = Message.getSentStatusText(SDKMsg.sentStatus);
    msg.messageTime = SDKMsg.sentTime;
    msg.messageState =
      SDKMsg.messageState === undefined
        ? SDKMsg.messageDirection
        : SDKMsg.messageState;

    switch (msg.messageType) {
      case MessageType.TextMessage:
        let txtmsg = {};
        let content = Emoji.unicodeToEmoji(SDKMsg.content.content);
        let transformContent = Emoji.symbolToHTML(content);

        if (Util.dataType(transformContent) === "array") {
          txtmsg.emoji = true;
          txtmsg.emojiContent = transformContent;
        }
        txtmsg.content = content;
        msg.content = {
          ...SDKMsg.content,
          ...txtmsg
        };
        break;

      default:
        msg.content = SDKMsg.content;
        break;
    }
    return msg;
  }

  static convertHitoryMessage(hisMsg) {
    let message = {};
    message.bySelf = store.getters.GetSendUser.id === hisMsg.fromUserId;
    message.conversationType =
      ConversationModel.IMConversationEnum[hisMsg.channelType];
    message.extra = hisMsg.extra;
    message.isLocalMessage = true;
    message.messageDirection = message.bySelf ? 1 : 2; // 1：发送SEND，2：接收RECEIVE
    message.messageId = hisMsg.messageId;
    message.messageType = MsgObjectNameEnum[hisMsg.objectName];
    message.objectName = hisMsg.objectName;
    message.receivedStatus = RecState.READ; // 0: UNREAD 1：READ，2：LISTENED，4：DOWNLOADED
    message.senderUserId = hisMsg.fromUserId;
    message.sentStatus = SendStatus.READ;
    if (
      message.conversationType === ConversationModel.IMConversationEnum.PRIVATE
    ) {
      message.targetId = message.bySelf ? hisMsg.toUserId : hisMsg.fromUserId;
    } else {
      message.targetId = hisMsg.groupId;
    }
    message.sentStatusText = Message.getSentStatusText(hisMsg.sentStatus);
    message.messageTime = +hisMsg.msgTimestamp;

    message.sentTime = message.messageTime;
    message.receivedTime = message.messageTime;

    message.content = {
      content: hisMsg.content,
      extra: hisMsg.extra,
      messageName: message.messageType,
      user: {
        id: hisMsg.fromUserId,
        name: hisMsg.fromUserNickName,
        portraitUri: hisMsg.fromUserAvatar
      }
    };

    switch (message.messageType) {
      case MessageType.TextMessage:
        let txtmsg = {};
        let content = hisMsg.content;
        let transformContent = Emoji.symbolToHTML(content);

        if (Util.dataType(transformContent) === "array") {
          txtmsg.emoji = true;
          txtmsg.emojiContent = transformContent;
        }
        txtmsg.content = content;
        message.content = {
          ...txtmsg
        };
        break;
      case MessageType.ImageMessage:
        message.content = {
          ...message.content,
          content: hisMsg.imageBase64,
          name: hisMsg.name,
          size: hisMsg.size,
          imageUri: hisMsg.url
        };
        break;

      case MessageType.FileMessage:
        message.content = {
          ...message.content,
          content: hisMsg.imageUri,
          name: hisMsg.name,
          size: hisMsg.size,
          fileUrl: hisMsg.url
        };
        break;
      case MessageType.VoiceMessage:
        message.content = {
          ...message.content,
          content: hisMsg.audioBase64,
          name: hisMsg.name,
          size: hisMsg.size,
          type: hisMsg.fileType,
          duration: hisMsg.duration
        };
        break;
      case MessageType.ZXVideoMessage:
        message.content = {
          ...message.content,
          thumbnailImage: hisMsg.videoBase64,
          name: hisMsg.name,
          size: hisMsg.size,
          videoUrl: hisMsg.url
        };
        break;
      case MessageType.LocationMessage:
        message.content = {
          ...message.content,
          content: hisMsg.locData,
          poi: hisMsg.poi
        };
        break;

      default:
        message.content = {
          content: hisMsg.content
        };
        break;
    }
    return message;
  }

  static getSentStatusText(status) {
    let info = "";
    switch (status) {
      case SendStatus.SENDING:
        info = "发送中";
        break;
      case SendStatus.FAILED:
        info = "发送失败";
        break;
      case SendStatus.SENT:
        info = "已发送";
        break;
      case SendStatus.RECEIVED:
        info = "对方已接收";
        break;
      case SendStatus.READ:
        info = "对方已读";
        break;
      case SendStatus.DESTROYED:
        info = "对方已销毁";
        break;
    }
    return info;
  }

  static SendErrorHandler(errorCode, message) {
    let info = "";
    switch (errorCode) {
      case RongIMLib.ErrorCode.TIMEOUT:
        info = "超时";
        break;
      case RongIMLib.ErrorCode.UNKNOWN:
        info = "未知错误";
        break;
      case RongIMLib.ErrorCode.REJECTED_BY_BLACKLIST:
        info = "您在黑名单中，无法向对方发送消息";
        break;
      case RongIMLib.ErrorCode.NOT_IN_DISCUSSION:
        info = "您已不在讨论组中";
        break;
      case RongIMLib.ErrorCode.NOT_IN_GROUP:
        info = "您已不在群组中";
        break;
      case RongIMLib.ErrorCode.NOT_IN_CHATROOM:
        info = "您已不在聊天室中";
        break;

      default:
        info = "发送失败";
        break;
    }
    return { code: errorCode, message: info, data: message };
  }
}

/**
 * 发送消息包装
 * 生成SDK Message
 * @param {*} msg 消息内容
 * @param {*} msgType 消息类型
 * @param {*} targetId 目标会话ID
 * @param {*} targetType 目标会话类型
 * @param {*} senderUserId 发送人ID
 */
function packmysend({
  content,
  messageType,
  targetId,
  conversationType,
  senderUserId,
  extendData
}) {
  content.extra = {
    ...(content.extra || {}),
    "pc-sign-uuid": Util.getRandomId()
  };
  // let msgouter = new RongIMLib.Message(content, conversationType);
  let msgouter = new RongIMLib.Message(conversationType);
  msgouter.content = content;
  msgouter.targetId = targetId;
  // msgouter.sentTime =
  //   new Date().getTime() - IMSDKServer.getInstance().getDeltaTime();
  msgouter.sentTime = new Date().getTime();
  msgouter.messageDirection = RongIMLib.MessageDirection.SEND;
  msgouter.messageType = messageType;
  msgouter.senderUserId = senderUserId;
  msgouter.extendData = extendData;
  msgouter.sentStatus = SendStatus.SENDING;
  // IMSDKServer.getInstance().insertMessage(
  //   conversationType,
  //   targetId,
  //   msgouter,
  //   {
  //     onSuccess(result, atched) {},
  //     onError(error) {}
  //   }
  // );
  return msgouter;
}

export { MessageType, RecState, SendStatus, MessageState, Message, packmysend };
