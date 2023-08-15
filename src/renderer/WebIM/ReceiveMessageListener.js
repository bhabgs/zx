import store from "../store";
import { MessageModel } from "../WebIM";
import { ipcRenderer } from "electron";

export default {
  // 接收到的消息
  onReceived(message) {
    // 判断消息类型
    !message.sentTime &&
      Logger.error({
        message: "message not sentTime",
        objectName: message.objectName,
      });
    message.receivedStatus === MessageModel.RecState.READ
      ? (message.receivedStatus = MessageModel.RecState.UNREAD)
      : "";
    if (
      message.senderUserId === store.getters.GetSendUser.id &&
      message.sentStatus === undefined
    ) {
      message.sentStatus = MessageModel.SendStatus.SENT;
    }
    console.log("received message ", message);
    switch (message.messageType) {
      case MessageModel.MessageType.ZXCombineMsg:
      case MessageModel.MessageType.TextMessage:
        // message.content.content => 消息内容
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.VoiceMessage:
        // 对声音进行预加载
        // message.content.content 格式为 AMR 格式的 base64 码
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.ImageMessage:
      case MessageModel.MessageType.ZXGIFMsg:
        // message.content.content => 图片缩略图 base64。
        // message.content.imageUri => 原图 URL。
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.FileMessage:
        // message.content.content => 图片缩略图 base64。
        // message.content.imageUri => 原图 URL。
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.RichContentMessage:
        // message.content.content => 息内容。
        // message.content.imageUri => 图片 base64。
        // message.content.url => 原图 URL。
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.LocationMessage:
        // message.content.latiude => 纬度。
        // message.content.longitude => 经度。
        // message.content.content => 位置图片 base64。
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.DiscussionNotificationMessage:
        // message.content.extension => 讨论组中的人员。
        break;

      case MessageModel.MessageType.InformationNotificationMessage:
        // do something...
        break;
      case MessageModel.MessageType.ContactNotificationMessage:
        // do something...
        break;
      case MessageModel.MessageType.ProfileNotificationMessage:
        // do something...
        break;
      case MessageModel.MessageType.CommandNotificationMessage:
        // do something...
        break;
      case MessageModel.MessageType.CommandMessage:
        // do something...
        if (message.content && message.content.name === "actionCornerRefresh") {
          window.eventHub.$emit("polling-action-unread", message.content.data);
        }
        break;
      case MessageModel.MessageType.UnknownMessage:
        // 未知消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;
      case MessageModel.MessageType.SyncReadStatusMessage:
      case MessageModel.MessageType.ReadReceiptMessage:
      case MessageModel.MessageType.ReadReceiptResponseMessage:
        store.dispatch("ReadReceiptMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        if (message.senderUserId === store.getters.GetSendUser.id) {
          store.dispatch("UpdateReminderMap", {
            type: false,
            key: message.targetId,
            data: message,
            number: 0,
          });
        }
        break;
      case MessageModel.MessageType.RecallCommandMessage:
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceivedRecallCommandMessage",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch(
          "RecallMessage",
          MessageModel.Message.convertMsg(message)
        );
        break;

      case MessageModel.MessageType.ZXTipMessage:
        // 自定义通知类消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.ZXAppLinkMessage:
        // 自定义链接类消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.ZXVideoMessage:
        // 自定义视频消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.ZXRichMessage:
        // 自定义图文消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;
      case MessageModel.MessageType.ZXEncryptFileMsg:
        // 自定义加密文件消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;
      case MessageModel.MessageType.ZXEncryptImgMsg:
        // 自定义加密图片消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;
      case MessageModel.MessageType.ZXEncryptVideoMsg:
        // 自定义加密视频消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.ZXActionCardMsg:
        // 自定义卡片消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceived",
          msg: MessageModel.Message.convertMsg(message),
        });
        store.dispatch("ReceiveMessage", {
          message: MessageModel.Message.convertMsg(message),
        });
        break;

      case MessageModel.MessageType.ZXConversationOperateMsg:
        // 会话操作同步消息
        ipcRenderer.invoke("sqlite-receive", {
          key: "onReceivedZXConversationOperateMsg",
          msg: message,
        });
        store.dispatch("disposeConversationSyncMsg", message.content);
        break;
      case MessageModel.MessageType.ZXGatherMsg:
        const time = sessionStorage.getItem("storageUpdateTime");
        if (!time || message.content.time > time) {
          // 如果没有更新时间或者回话时间大于更新时间才进行操作
          // 收纳组操作同步消息
          ipcRenderer.invoke("sqlite-receive", {
            key: "onReceivedZXGatherMsg",
            msg: message.content,
          });
          store.dispatch("updateStorageSyncMsg", message.content);
        }
        break;

      default:
        // do something...
        break;
    }
  },
};
