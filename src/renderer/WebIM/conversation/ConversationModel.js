import store from "../../store";
import IMSDKServer from "../IMSDKServer";

// const fileManageIcon = require("@/assets/image/common/ZX_FileManager_Default@3x.jpg");

export const IMConversationEnum = {
  PRIVATE: 1, // 单聊会话类型，枚举值为 1
  DISCUSSION: 2, // 讨论组会话类型，枚举值为 2
  GROUP: 3, // 群组会话类型，枚举值为 3
  CHATROOM: 4, // 聊天室会话类型，枚举值为 4
  CUSTOMER_SERVICE: 5, // 客服会话类型，枚举值为 5
  SYSTEM: 6, // 系统消息类型，枚举值为 6
  APP_PUBLIC_SERVICE: 7, // 公众账号（默认关注）会话类型，枚举值为 7
  PUBLIC_SERVICE: 8, // 公众账号 (手动关注) 会话类型，枚举值为 8
  GATHER: 100, // 收纳组，枚举值为 100
  1: "PRIVATE",
  2: "DISCUSSION",
  3: "GROUP",
  4: "CHATROOM",
  5: "CUSTOMER_SERVICE",
  6: "SYSTEM",
  7: "APP_PUBLIC_SERVICE",
  8: "PUBLIC_SERVICE",
  100: "GATHER",
};

export class IMConversation {
  constructor(data, Covtype) {
    this.conversationType = Covtype; // 会话类型
    this.id = data.id; // 会话id
    this.name = data.name; // 会话名称
    this.avatar = data.avatar; // 会话头像，可为空
    this.self = false;
    this.groupType = data.groupType;
    if (this.id === store.getters.GetSendUser.id && Covtype === IMConversationEnum.PRIVATE) {
      this.name = "个人文件管理";
      // this.avatar = fileManageIcon;
      this.avatar = "https://zx-zgiot-002.oss-cn-qingdao.aliyuncs.com/image/8dc83647909b4cc792f1f78390e07db0.jpg";
      this.self = true;
    }
    switch (Covtype) {
      case IMConversationEnum.PRIVATE:
        this.sign = data.imAccount; // 会话标志，老数据会有，可无
        break;
      case IMConversationEnum.GROUP:
        this.sign = data.id;
        this.groupType = data.groupType; // 群组类型
        this.count = data.count; // 群人数
        this.creator = data.creator; // 群人数
        this.createAt = data.createAt; // 群人数
        this.createAt = data.createAt; // 群人数

        break;

      default:
        break;
    }
    IMSDKServer.createConversation(Covtype, this.id, this.name);
  }
}
