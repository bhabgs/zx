import { ConversationModel } from "../../../WebIM";
import utils from "../../../plugin/utils";
import globalConfig from "@/global.config";
import store from "../../../store";
import {
  CHATGPT_PRIVAYE_ID,
  CHATGPT_PRIVAYE_NAME
} from "@/config/chatGpt.config";
const robot = globalConfig.robot;
// const fileManageIcon = require("@/assets/image/common/ZX_FileManager_Default@3x.jpg");

const handleList = (handleArr, originArr, belongSubgroup) => {
  const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
  const GROUP = ConversationModel.IMConversationEnum.GROUP;
  const resultArr = handleArr
    .map(conversation => {
      let conversationNode = null;
      const index = originArr.findIndex(message => {
        let flag = false;
        if (
          ((message.conversationType == PRIVATE &&
            conversation.objectType == "2") ||
            (message.conversationType == GROUP &&
              conversation.objectType == "1")) &&
          message.id == conversation.beId
        ) {
          flag = true;
        }
        return flag;
      });
      if (index > -1) {
        const isSameType =
          (belongSubgroup == 0 && originArr[index].groupType < 10) ||
          belongSubgroup != 0;
        if (isSameType) {
          //判断得到的会话是否和收纳组所属组织外联一致，一致才放入收纳组
          conversationNode = {
            ...originArr[index],
            storageId: conversation.storageId
          };
          originArr.splice(index, 1);
        }
      }
      return conversationNode;
    })
    .filter(conversation => !!conversation && Object.keys(conversation).length) //过滤掉会话列表找不到的（暂时过滤等有会话缓存时找不到从缓存取）;
    .sort((a, b) => {
      if (a.message && b.message) {
        return b.message.messageTime - a.message.messageTime;
      } else {
        if (a.message) {
          return -1;
        }
        if (b.message) {
          return 1;
        }
      }
    }); //排序
  return resultArr;
};
const Getters = {
  /**
   * 获取会话列表类型，组织、外联
   * @param {*} state
   * @returns
   */
  GetChitchatType(state) {
    return state.chitchatType;
  },
  /**
   * 获取会话列表
   * @param {*} state
   * @param {*} getters
   * @returns {Object}
   */
  GetDialogues(state, getters) {
    let map = {
      private: {},
      group: {}
    };
    state.Dialogues.map(item => {
      if (
        item.conversationType === ConversationModel.IMConversationEnum.PRIVATE
      ) {
        map.private[item.id] = item;
      } else {
        const group = getters.GetGroups[item.id];
        if (group) {
          item.groupType = group.type;
        }
        map.group[item.id] = item;
      }
    });
    return map;
  },
  GetDialoguesList(state, getters) {
    return state.Dialogues.map(item => {
      if (
        item.conversationType === ConversationModel.IMConversationEnum.GROUP
      ) {
        const group = getters.GetGroups[item.id];
        if (group) {
          item.groupType = group.type;
        }
      }
      return item;
    });
  },
  // 根据会话ID和会话类型获取收纳组ID
  getStorageIdByConversationId: state => (id, type) => {
    const storageMap = state.storageMap;
    const storageMapKeys = storageMap.keys();
    let flag = "";
    if (type == ConversationModel.IMConversationEnum.PRIVATE) {
      flag = "private";
      // 个人
    } else {
      // 群组
      flag = "group";
    }
    let result = "";
    for (let i = 0; i < storageMap.size; i++) {
      let value = storageMapKeys.next().value;
      if (value[flag].includes(id)) {
        result = storageMap.get(value);
        return result;
      }
    }
    return result;
  },
  GetStorageListSort(state, getters) {
    const GATHER = ConversationModel.IMConversationEnum.GATHER;
    const {
      GetAllOrganizationUserIds: allOrganizationUserIds,
      GetAllOutsourceUserIds: outsourceUserIds
    } = getters;
    let dialogList = [...getters.GetConversationSort.normalList]; // 非置顶会话列表
    let topList = [...getters.GetConversationSort.topList]; // 置顶会话列表
    let organizationList = [];
    let outsourceList = [];
    const topMap = getters.GetTopMap;
    const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
    const GROUP = ConversationModel.IMConversationEnum.GROUP;
    let allStorageList = [
      ...(state.storages.storageList || []).filter(item => {
        return item.isDelete === "0";
      })
    ]; //全量收纳组
    allStorageList = allStorageList.map(group => {
      const item = { ...group };
      // 0为组织，其他为外联
      item.conversationType = GATHER; // 取值为100 为收纳组type类型
      item.groupType = item.belongSubgroup == 0 ? item.belongSubgroup : 10;
      let childrenList = [...(item.relList || [])];
      let topChildrenList = [];
      let normalChildrenList = [];
      childrenList.forEach(subitem => {
        if (
          (subitem.objectType == "1" && topMap.group[subitem.beId]) ||
          (subitem.objectType == "2" && topMap.private[subitem.beId])
        ) {
          topChildrenList.push({ ...subitem, storageId: item.id });
        } else {
          normalChildrenList.push({ ...subitem, storageId: item.id });
        }
      });
      topChildrenList = handleList(
        topChildrenList,
        topList,
        item.belongSubgroup
      ); // 收纳组子会话置顶排序后
      normalChildrenList = handleList(
        normalChildrenList,
        dialogList,
        item.belongSubgroup
      ); // 收纳组子会话非置顶排序后
      item.children = [...topChildrenList, ...normalChildrenList];
      const numReminderList = item.children.filter(
        child => !child.isHint || child.isAtMe
      );
      item.isHint = !numReminderList.length; // 表示收纳组的角标是否是数字，true是圆点，false是数字
      if (numReminderList.length) {
        let num = numReminderList.reduce((total, current) => {
          total += current.reminderNumber || 0;
          return total;
        }, 0);
        if (num <= 0) {
          // 如果数字角标为0 则为圆点取全部未读
          item.isHint = true;
          item.reminderNumber = item.children.reduce((total, current) => {
            total += current.reminderNumber || 0;
            return total;
          }, 0);
        } else {
          item.reminderNumber = num;
        }
      } else {
        item.reminderNumber = item.children.reduce((total, current) => {
          total += current.reminderNumber || 0;
          return total;
        }, 0);
      }
      const topLastConversationTime = topChildrenList.length
        ? topChildrenList[0].lastConversationTime * 1 //保证时间为数字
        : null;
      const normalLastConversationTime = normalChildrenList.length
        ? normalChildrenList[0].lastConversationTime * 1 //保证时间为数字
        : null;
      if (topLastConversationTime || normalLastConversationTime) {
        // 选取最新一条回话的时间为最新时间
        if (topLastConversationTime && normalLastConversationTime) {
          // 如果有置顶也有非置顶则外层对比时间显示最新一条内容信息
          if (topLastConversationTime > normalLastConversationTime) {
            item.lastConversationTime = topLastConversationTime;
            item.message = {
              ...topChildrenList[0].message,
              name: topChildrenList[0].name
            };
          } else {
            item.lastConversationTime = normalLastConversationTime;
            item.message = {
              ...normalChildrenList[0].message,
              name: normalChildrenList[0].name
            };
          }
        } else if (topLastConversationTime) {
          // 如果只有置顶则显示置顶最新一条内容信息
          item.lastConversationTime = topLastConversationTime;
          item.message = {
            ...topChildrenList[0].message,
            name: topChildrenList[0].name
          };
        } else if (normalLastConversationTime) {
          // 如果没有置顶则显示列表最新一条内容信息
          item.lastConversationTime = normalLastConversationTime;
          item.message = {
            ...normalChildrenList[0].message,
            name: normalChildrenList[0].name
          };
        }
      } else {
        // 否则选取创建时间为最新时间
        item.lastConversationTime = new Date(item.createAt * 1);
      }
      return item;
    });
    let topGroup = allStorageList.filter(item => item.isTop == "1"); // 置顶的收纳组
    let normalGroup = allStorageList.filter(item => item.isTop != "1"); // 非置顶的收纳组
    let topAllList = [...topList, ...topGroup].sort((a, b) => {
      if (a.lastConversationTime && b.lastConversationTime) {
        return b.lastConversationTime - a.lastConversationTime;
      } else {
        if (a.lastConversationTime) {
          return -1;
        }
        if (b.lastConversationTime) {
          return 1;
        }
      }
    }); // 所有置顶（会话加收纳组）
    let normalAllList = [...dialogList, ...normalGroup].sort((a, b) => {
      if (a.lastConversationTime && b.lastConversationTime) {
        return b.lastConversationTime - a.lastConversationTime;
      } else {
        if (a.lastConversationTime) {
          return -1;
        }
        if (b.lastConversationTime) {
          return 1;
        }
      }
    }); // 所有非置顶（会话加收纳组）
    const allDialogList = [...topAllList, ...normalAllList];
    for (let i = 0; i < allDialogList.length; i++) {
      if (allDialogList[i].conversationType === PRIVATE) {
        if (
          allOrganizationUserIds.includes(allDialogList[i].id) ||
          allDialogList[i].id == getters.GetUser.id ||
          allDialogList[i].id.includes("robot_")
        ) {
          // 判断个人是不是外联用户，机器人默认为组织
          allDialogList[i].groupType = 0;
          organizationList.push(allDialogList[i]);
        } else {
          allDialogList[i].groupType = 10;
          outsourceList.push(allDialogList[i]);
        }
      } else if (allDialogList[i].conversationType === GROUP) {
        if (allDialogList[i].groupType < 10) {
          // 群组groupType为0是组织群
          organizationList.push(allDialogList[i]);
          // } else if (allDialogList[i].groupType === 1) {
        } else {
          // 群组groupType为0是外联群
          outsourceList.push(allDialogList[i]);
        }
      } else {
        // 收纳组区分组织外联
        if (allDialogList[i].belongSubgroup == 0) {
          // 统一添加groupType标识
          allDialogList[i].groupType = 0;
          organizationList.push(allDialogList[i]);
        } else {
          allDialogList[i].groupType = 10;
          outsourceList.push(allDialogList[i]);
        }
      }
    }
    return {
      organizationList,
      outsourceList,
      storageList: allStorageList.reverse(),
      organizationList_out: organizationList.filter(
        item => item.conversationType != GATHER
      ),
      outsourceList_out: outsourceList.filter(
        item => item.conversationType != GATHER
      ),
      topList: topAllList
    };
  },
  GetConversationSort(state, getters) {
    const {
      GetAllOrganizationUserIds: allOrganizationUserIds,
      GetAllOutsourceUserIds: outsourceUserIds
    } = getters;
    let dialogList = [];
    let dialogTopList = [];
    let organizationList = [];
    let outsourceList = [];
    const Dialogues = getters.GetDialoguesList;
    const topMap = getters.GetTopMap;
    const ReminderMap = { ...getters.GetReminderMap };
    const IsHintMap = { ...getters.GetIsHintMap };
    const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
    for (const dialog of Dialogues) {
      if (dialog.conversationType === PRIVATE) {
        dialog.reminderNumber = ReminderMap.private[dialog.id];
        dialog.istop = topMap.private[dialog.id];
        dialog.isHint = IsHintMap.private[dialog.id];
      } else {
        dialog.reminderNumber = ReminderMap.group[dialog.id];
        dialog.istop = topMap.group[dialog.id];
        dialog.isHint = IsHintMap.group[dialog.id];
      }
      // 免打扰时
      if (dialog.isHint) {
        const atMeReminder = (
          getters.GetAtMsgMap[`${dialog.conversationType}_${dialog.id}`] || []
        ).find(item => item.id === getters.GetUser.id);
        if (atMeReminder && atMeReminder.count) {
          // @为数字角标
          dialog.isAtMe = true;
          dialog.reminderNumber = atMeReminder.count;
        } else {
          dialog.isAtMe = false;
        }
      }
      if (
        dialog.id === store.getters.GetSendUser.id &&
        dialog.conversationType === PRIVATE
      ) {
        dialog.name = "个人文件管理";
        // dialog.avatar = fileManageIcon;
        dialog.avatar =
          "https://zx-zgiot-002.oss-cn-qingdao.aliyuncs.com/image/8dc83647909b4cc792f1f78390e07db0.jpg";
        dialog.self = true;
      }
      const key = `${dialog.conversationType}_${dialog.id}`;
      dialog.message = getters.GetLatestOneMsg[key];
      dialog.lastConversationTime =
        (dialog.message && dialog.message.messageTime) || null;
      if (dialog.istop) {
        dialogTopList.push(dialog);
      } else {
        dialogList.push(dialog);
      }
    }
    dialogTopList.sort((a, b) => {
      if (a.message && b.message) {
        return b.message.messageTime - a.message.messageTime;
      } else {
        if (a.message) {
          return -1;
        }
        if (b.message) {
          return 1;
        }
      }
    });
    dialogList.sort((a, b) => {
      if (a.message && b.message) {
        return b.message.messageTime - a.message.messageTime;
      } else {
        if (a.message) {
          return -1;
        }
        if (b.message) {
          return 1;
        }
      }
    });
    const allDialogList = [...dialogTopList, ...dialogList];
    for (let i = 0; i < allDialogList.length; i++) {
      if (allDialogList[i].conversationType === PRIVATE) {
        // 个人
        if (
          allOrganizationUserIds.includes(allDialogList[i].id) ||
          allDialogList[i].id == getters.GetUser.id ||
          allDialogList[i].id == CHATGPT_PRIVAYE_ID
        ) {
          // 判断个人是不是外联用户
          allDialogList[i].groupType = 0;
          organizationList.push(allDialogList[i]);
        } else {
          allDialogList[i].groupType = 10;
          outsourceList.push(allDialogList[i]);
        }
      } else {
        if (allDialogList[i].groupType < 10) {
          // 群组groupType为0是组织群
          organizationList.push(allDialogList[i]);
          // } else if (allDialogList[i].groupType === 1) {
        } else {
          // 群组groupType为0是外联群
          outsourceList.push(allDialogList[i]);
        }
      }
    }
    const result = {
      topList: [...dialogTopList],
      normalList: [...dialogList],
      all: [...allDialogList],
      organizationList: [...organizationList],
      outsourceList: [...outsourceList]
    };
    return result;
  },
  /**
   * 获取打开的会话
   * @param {*} state
   * @param {*} getters
   */
  GetOpenDialog: (state, getters) => {
    try {
      let OpenDialog = {};
      let type = getters.GetChitchatType;
      if (type == "organization") {
        OpenDialog = { ...state.OpenDialog };
      } else {
        OpenDialog = { ...state.OutsourceOpenDialog };
      }
      // OpenDialog = state.OutsourceOpenDialog;
      const topMap = getters.GetTopMap;
      const ReminderMap = getters.GetReminderMap;
      const IsHintMap = getters.GetIsHintMap;
      switch (OpenDialog.conversationType) {
        case ConversationModel.IMConversationEnum.GROUP:
          let detail = getters.GetGroups[OpenDialog.id] || {};
          OpenDialog.joinTime = detail.joinTime;

          OpenDialog.reminderNumber = ReminderMap.group[OpenDialog.id];
          OpenDialog.istop = topMap.group[OpenDialog.id];
          OpenDialog.isHint = IsHintMap.group[OpenDialog.id];
          OpenDialog.count = detail.groupNumber;
          break;

        case ConversationModel.IMConversationEnum.PRIVATE:
          OpenDialog.reminderNumber = ReminderMap.private[OpenDialog.id];
          OpenDialog.istop = topMap.private[OpenDialog.id];
          OpenDialog.isHint = IsHintMap.private[OpenDialog.id];
          break;
      }
      const key = `${OpenDialog.conversationType}_${OpenDialog.id}`;
      OpenDialog.message = getters.GetLatestOneMsg[key];

      return OpenDialog;
    } catch (error) {
      console.log("getOpendialog", error);
    }
  },
  GetTopMap(state) {
    return state.TopMap;
  },
  GetReminderMap(state) {
    return state.ReminderMap;
  },
  GetReminderCount(state, getters) {
    const { organizationList, outsourceList } = getters.GetConversationSort;
    const organizationIdList = (organizationList || []).map(item => item.id);
    const outsourceIdList = (organizationList || []).map(item => item.id);
    // 单聊&&非免打扰群里未读计数
    let organizationsum = 0;
    let outsourcesum = 0;
    const privateCount = state.ReminderMap.private;
    const groupCount = state.ReminderMap.group;

    for (const key in privateCount) {
      const dialog = getters.GetDialogues.private[key];
      if (!state.IsHintMap.private[key] && dialog) {
        const num = privateCount[key];
        // 机器人角标放到组织里
        if (organizationIdList.includes(key) || key.includes("robot_")) {
          organizationsum += num / 1;
        } else {
          outsourcesum += num / 1;
        }
      }
    }

    for (const key in groupCount) {
      const dialog = getters.GetDialogues.group[key];
      if (!state.IsHintMap.group[key] && dialog) {
        const num = groupCount[key];
        if (organizationIdList.includes(key)) {
          organizationsum += num / 1;
        } else {
          outsourcesum += num / 1;
        }
      } else if (state.IsHintMap.group[key] && dialog) {
        // 免打扰群@计数
        const atMeReminder = (
          getters.GetAtMsgMap[`${dialog.conversationType}_${dialog.id}`] || []
        ).find(item => item.id === getters.GetUser.id);
        if (atMeReminder && atMeReminder.count) {
          // @为数字角标
          if (organizationIdList.includes(key)) {
            organizationsum += atMeReminder.count / 1;
          } else {
            outsourcesum += atMeReminder.count / 1;
          }
        }
      }
    }
    return {
      organizationsum,
      outsourcesum
    };
  },
  GetIsHintMap(state) {
    return state.IsHintMap;
  },
  GetHintFlag(state) {
    return state.HintFlag;
  },
  GetGroupReminderCount(state, getters) {
    // 免打扰群聊计数
    const { organizationList, outsourceList } = getters.GetConversationSort;
    const organizationIdList = (organizationList || []).map(item => item.id);
    const outsourceIdList = (organizationList || []).map(item => item.id);
    let organizationsum = 0;
    let outsourcesum = 0;
    const groupCount = state.ReminderMap.group;
    for (const key in groupCount) {
      const dialog = getters.GetDialogues.group[key];
      if (state.IsHintMap.group[key] && dialog) {
        const num = groupCount[key];
        if (organizationIdList.includes(key)) {
          organizationsum += num / 1;
        } else {
          outsourcesum += num / 1;
        }
      }
    }
    return {
      organizationsum,
      outsourcesum
    };
  },
  /**
   * 获取已无更多消息状态的会话ID列表
   * @param {*} state
   */
  GetNoMoreMsg(state) {
    window.OpenDialog = state.OpenDialog;
    window.NoMoreMsg = state.NoMoreMsg;
    return state.NoMoreMsg;
  },
  GetChatUnreadCount(state, getters) {
    const {
      GetGroupReminderCount: groupReminderCount,
      GetReminderCount: reminderCount
    } = getters;
    const isDot = !(reminderCount.organizationsum + reminderCount.outsourcesum);
    let result = {
      total: {
        total: 0,
        isDot
      },
      organization: {
        total: 0,
        isDot: !reminderCount.organizationsum
      },
      outsource: {
        total: 0,
        isDot: !reminderCount.outsourcesum
      }
    };
    for (const key in result) {
      const element = result[key];
      switch (key) {
        case "total":
          {
            if (element.isDot) {
              element.total =
                groupReminderCount.organizationsum +
                groupReminderCount.outsourcesum;
            } else {
              element.total =
                reminderCount.organizationsum + reminderCount.outsourcesum;
            }
          }
          break;
        case "organization":
          {
            if (element.isDot) {
              element.total = groupReminderCount.organizationsum;
            } else {
              element.total = reminderCount.organizationsum;
            }
          }
          break;
        case "outsource":
          {
            if (element.isDot) {
              element.total = groupReminderCount.outsourcesum;
            } else {
              element.total = reminderCount.outsourcesum;
            }
          }
          break;
      }
      element.hintType = utils.hintType(element.total);
    }
    return result;
  },
  /**
   * 获取是否处于历史消息状态
   * @param {*} state
   */
  GetIsGetHistoryStatus(state) {
    return state.IsGetHistoryStatus;
  },
  /**
   * 获取当前消息发件人姓名
   * @param {*} state
   * @param {*} getters
   */
  GetSenderName(state, getters) {
    return (message, dialog) => {
      let name = "";
      let user =
        robot[message.senderUserId] ||
        getters.GetAllUserMap[message.senderUserId] ||
        {};
      if (user && user.name) {
        name = user.name;
      } else {
        if (
          message.conversationType ===
          ConversationModel.IMConversationEnum.GROUP
        ) {
          let robot = getters.GetRobot(dialog.id, message.senderUserId);
          name = (robot || {}).chatRobotName;
        }
        if (!name && message.content && message.content.user) {
          name = message.content.user.name;
        }
      }

      return name;
    };
  },
  /**
   * 获取当前搜索的聊天记录时间
   * @param {*} state
   * @returns
   */
  GetsearchContentTime(state) {
    return state.contentTime;
  },
  GetDraftListMap(state) {
    return state.draftListMap;
  }
};

export default Getters;
