import Vue from "vue";
// import { Notify, Util } from "@/plugin";
import { MessageModel, ConversationModel } from "../../../WebIM";
import globalConfig from "@/global.config";

const robot = globalConfig.robot;

// const throttleNotify = Util.Debounce(Notify, 1000);

const tools = {
  sendNotify(name, avatar, msg) {
    let body = "";
    switch (true) {
      case msg.messageType === MessageModel.MessageType.TextMessage:
        let content = msg.content;
        if (!content.emojiContent) {
          body = content.content;
        } else {
          content.emojiContent.forEach(item => {
            if (item.type === "txt") {
              body += item.content;
            } else {
              body += "[表情]";
            }
          });
        }
        break;
      case msg.messageType === MessageModel.MessageType.ImageMessage:
        body = "[图片]";
        break;
      case msg.messageType === MessageModel.MessageType.FileMessage:
        body = "[文件]";
        break;
      case msg.messageType === MessageModel.MessageType.VoiceMessage:
        body = "[语音]";
        break;
      case msg.messageType === MessageModel.MessageType.SightMessage:
        body = "[视频]";
        break;
      default:
        body = "[不支持消息类型]";
        break;
    }

    /**
     * 禁止桌面弹窗提示 by lixiaowei 2019/08/23
     */
    /*     if (body) {
      let option = { body };
      avatar ? (option.icon = avatar) : "";
      throttleNotify(name, option);
    } */
  },
  formatMessage({ dispatch, message, getters, isHistory = false }) {
    let Company = getters.GetCompany;
    let AllUserMap = getters.GetAllUserMap;
    let AllGroups = getters.GetGroups;
    let content = message.content;

    if (message.messageType === MessageModel.MessageType.ZXTipMessage) {
      let IsMyOperate = content.operatorUserId === Company.accountId; // 是否是登录人操作的
      let userInfo = content.userInfo || [];
      let userName = userInfo.map(item =>
        item.userId === Company.accountId ? "你" : item.nickname
      ); // 群被操作人员的名字
      let userIds = userInfo.map(item => item.userId); // 群被操作的人员id
      let createUser =
        AllUserMap[content.operatorUserId] ||
        robot[content.operatorUserId] ||
        {}; // 群创建人

      let operatorName = IsMyOperate ? "你" : createUser.name || ""; // 操作人姓名

      let pullFlag = false; // 是否往本地插入群信息，默认否

      switch (content.operation) {
        case "New": // 新建群
          message.systemMessage = `${operatorName}邀请${userName.join(
            "、"
          )}加入群聊`;
          break;
        case "Add": // 群加人
          message.systemMessage = `${operatorName}邀请${userName.join(
            "、"
          )}加入群聊`;
          pullFlag = true;
          break;
        case "Quit": // 群成员退出
          message.systemMessage = `${userName.join("、")}退出群聊`;
          pullFlag = true;
          break;
        case "Kicked": // 成员被踢
          message.systemMessage = `${operatorName}将${userName.join(
            "、"
          )}移出群聊`;
          pullFlag = true;
          break;
        case "Rename": // 群命名
          message.systemMessage = `${operatorName}将群名称改为“${content.message}”`;
          !isHistory &&
            dispatch("RenameGroup", {
              id: message.targetId,
              newName: content.message,
              conversationType: ConversationModel.IMConversationEnum.GROUP
            });
          break;
        case "Bulletin": // 群公告
          break;
        case "Admin": // 群主转移
          message.systemMessage = `${operatorName}把群主转让给了${userName.join(
            "、"
          )}`;
          pullFlag = true;
          break;
        case "Exit": // 群解散
          break;
        case "Property": // 群属性发生变化
          pullFlag = true;
          break;
        case "Type": // 群类型改变
          pullFlag = true;
          break;
        case "Time": // 系统消息(ios本地使用-其它端可以借鉴使用)
          break;
        case "Avatar": // 群头像变更
          break;
        case "RobotAdd": // 群助手新增
        case "RobotDelete": // 群助手移除
        case "RobotUpdate": // 群助手更新信息
          message.systemMessage = message.content.message;
          pullFlag = true;
          break;

        default:
          break;
      }

      if (!isHistory && pullFlag) {
        let group = AllGroups[message.targetId];
        group &&
          Vue.prototype.$service
            .groupInfoApi({
              corpId: group.corpId,
              id: group.id
            })
            .then(response => response.data.data)
            .then(result => {
              dispatch("UpdateDialog", {
                key: result.id,
                type: ConversationModel.IMConversationEnum.GROUP,
                data: {
                  count: result.groupNumber,
                  creator: result.creator,
                  name: result.name
                }
              });
            });
      }
    }
  }
};

export default tools;
