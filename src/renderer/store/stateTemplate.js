export default key => {
  let result = {};

  switch (key) {
    case "baseState": // 基础模块
      result = {
        user: {}, // 登录用户信息
        AllUserMap: {}, // 登陆用户所有公司下全部用户数据map（accountId存储，不分公司）
        AllUserMapByCorp: {}, // 登陆用户所有公司下全部用户数据map，（accountId#corpId存储，分公司）
        NotCorpUser: {}, // 无公司用户数据
        MsgFocusID: "", // 活跃消息ID
        NetWorkState: "online", // 网络状态
        corpId: "", // 当前选中公司id
        NotifyList: [], // 通知模块列表数据
        NotifyUnRead: {}, // 通知未读
        ActiveNotifyApp: {}, // 选中的通知应用
        MainWinVisible: true, // 主窗口可见性
        MailUnReadCount: {}, // 智邮未读信息
        ActionCenterUnread: {}, // 行动中心未读信息
        ExtCorpInfo: {} // 企业扩展信息
      };
      break;
    case "dialogState": // 会话相关模块
      result = {
        Dialogues: [],
        OpenDialog: {},
        OutsourceOpenDialog: {},
        chitchatType: "organization",
        storages: {
          sessionList: [],
          storageList: []
        },
        storageMap: {},
        TopMap: {
          // 置顶配置
          private: {},
          group: {}
        },
        ReminderMap: {
          // 消息未读数量
          private: {},
          group: {}
        },
        HintFlag: 0, // 更新以触发声音提醒
        IsHintMap: {
          // 免打扰配置
          private: {},
          group: {}
        },
        NoMoreMsg: {
          private: [],
          group: []
        }, // 保存没有更多消息状态
        IsGetHistoryStatus: {}, // 是否获取了历史消息
        contentTime: "", // 搜索到的聊天记录时间
        draftListMap: new Map() // 草稿列表
      };
      break;
    case "groupState": // 群组相关模块
      result = {
        GroupsMap: {},
        selectCompanyList: {
          organization: [],
          outsource: []
        } // 外联建群时选择的公司
      };
      break;
    case "messageState": // 消息相关模块
      result = {
        ChatMSG: {}, // 单聊消息
        GroupMSG: {}, // 群聊消息
        AtMsgMap: {},
        LatestOneMsg: {} // 会话对应的最新一条消息
      };
      break;

    case "microAppState": // 微应用相关
      result = {
        microApp: {} // 微应用列表
      };
      break;
    case "contactState":
      result = {
        selectDept: {}, // 名录选中部门
        noRelateUser: {}, // 无关系人员列表
        robotList: [] // 机器人列表
      };
      break;
    default:
      break;
  }

  return result;
};
