import { executeDB } from "./index";
import { SQL } from "../../modules/sqlite/sql";

const _convertFormat = data => {
  try {
    let result;
    if (typeof data == "string" && data) {
      result = JSON.parse(data);
    } else {
      result = data;
    }
    return result;
  } catch (err) {
    console.error(err);
    return data;
  }
};
const _convertDate = dateStr => {
  try {
    let result = new Date(dateStr).getTime();
    return result;
  } catch (err) {
    console.error(err);
    return null;
  }
};
// 全文检索：查询联系人
const globalContact = async input => {
  try {
    const search = (input && input.search) || "";

    let allUsers =
      (await executeDB({
        sql: SQL.UNION_GLOBALSEARCH_CONTACT,
        data: { ...search, type: "globalContact" }
      })) || [];

    allUsers = allUsers.map(item => {
      return {
        ...item,
        corpLabelName: _convertFormat(item.corpLabelName) || [],
        deptNameList: _convertFormat(item.deptNameList) || [],
        depts: _convertFormat(item.depts) || []
      };
    });
    let accountUsers = {};
    allUsers.forEach(item => {
      if (accountUsers[item.accountId]) {
        accountUsers[item.accountId].corpUsers.push(item);
      } else {
        accountUsers[item.accountId] = { ...item, corpUsers: [item] };
      }
    });
    let result = [];
    for (let key in accountUsers) {
      result.push(accountUsers[key]);
    }
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};
const queryContatByAccountId = async input => {
  let accountIds = input.accountIds || [];
  let result;
  result = await executeDB({
    sql: SQL.QUERY_ACCOUNT_BY_ACCOUNTID,
    data: accountIds.map(item => {
      return { accountId: item };
    })
  });
  result = result.map(item => {
    return {
      ...item,
      depts: _convertFormat(item.depts)
    };
  });
  return result;
};
const queryContatByCorpId = async input => {
  let corpIds = input.corpIds || [];
  let result;
  result = await executeDB({
    sql: SQL.QUERY_ACCOUNT_BY_CORPID,
    data: corpIds.map(item => {
      return { coprId: item };
    })
  });
  result = result.map(item => {
    return {
      ...item,
      depts: _convertFormat(item.depts)
    };
  });
  return result;
};
const queryContatByAccountIdType = async input => {
  let accountId = input.accountId;
  let type = input.type;
  let result;
  result = await executeDB({
    sql: SQL.QUERY_ACCOUNT_BY_ACCOUNTID_TYPE,
    data: [{ accountId, type }]
  });
  result = result.map(item => {
    return {
      ...item,
      depts: _convertFormat(item.depts)
    };
  });
  return result;
};

// 全文检索：查询群组
const globalGroup = async input => {
  try {
    const search = (input && input.search) || "";
    let result;
    result = await executeDB({
      sql: SQL.UNION_GLOBALSEARCH_GROUP,
      data: { ...search, type: "globalGroup" }
    });
    let messageList =
      (await executeDB({
        sql: SQL.UNION_GLOBALSEARCH_GROUP_MESSAGE,
        data: [{ __search__: search }]
      })) || [];
    messageList = messageList.map(item => {
      return {
        ...item,
        content: _convertFormat(item.content)
      };
    });
    let messageMap = {};
    messageList.forEach(item => {
      messageMap[item.targetId] = item;
    });
    result = result.map(item => {
      let itemMessageMap = messageMap[item.id];
      let base = {
        ...item,
        groupMembers: _convertFormat(item.groupMembers) || [],
        groupRobots: _convertFormat(item.groupRobots) || [],
        count: item.groupNumber,
        createTime: _convertDate(item.createAt),
        groupMemberList:
          item.owner +
          "," +
          (_convertFormat(item.groupMembers) || []).join(","),
        isgroup: true,
        updateTime: _convertDate(item.updateAt)
      };

      if (itemMessageMap) {
        if (!itemMessageMap.messageTime) {
          itemMessageMap.messageTime = itemMessageMap.sentTime;
        }
        return {
          ...base,
          message: itemMessageMap,
          conversationType: itemMessageMap.conversationType,
          lastConversationTime: itemMessageMap.receivedTime,
          self: itemMessageMap.bySelf && itemMessageMap.bySelf == 1
          // avatar: null,
          // groupType: 0,
          // isHint: true,
          // istop: null,
          // reminderNumber: null,
          // sign: "",
        };
      } else {
        return base;
      }
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};
// 插入上次入库时间
const indbTime = async input => {
  try {
    const id = (input && input.id) || "";
    let result = {};
    let list = [];
    if (id) {
      list = await executeDB({
        sql: SQL.QUERY_UPDATETIME_BY_KEY,
        data: [{ id }]
      });
    } else {
      list = await executeDB({
        sql: SQL.QUERY_UPDATETIME
      });
    }
    list.forEach(item => {
      result[item.id] = item.updateTime;
    });
    return result;
  } catch (err) {
    console.error(err);
    return {};
  }
};
// 查询所有人信息（以accountId和corpId为主键）
const getAllAccount = async () => {
  try {
    let result;
    result = await executeDB({
      sql: SQL.QUERY_ACCOUNT
    });
    result = result.map(item => {
      return {
        ...item,
        corpLabelName: _convertFormat(item.corpLabelName),
        deptNameList: _convertFormat(item.deptNameList),
        depts: _convertFormat(item.depts)
      };
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};
// 查询所有群组（以id为主键）
const getAllGroup = async () => {
  try {
    let result;
    result = await executeDB({
      sql: SQL.QUERY_GROUP
    });
    result = result.map(item => {
      return {
        ...item,
        groupMembers: _convertFormat(item.groupMembers),
        groupRobots: _convertFormat(item.groupRobots)
      };
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 查询所有收纳组
const getAllStorage = async () => {
  try {
    let result;
    result = await executeDB({
      sql: SQL.QUERY_STORAGE
    });
    result = result.map(item => {
      return {
        ...item,
        relList: _convertFormat(item.relList)
      };
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 查询session的状态信息
const getAllStorageSession = async () => {
  try {
    let result;
    result = await executeDB({
      sql: SQL.QUERY_GROUP_ATTRIBUTE
    });
    result = result.map(item => {
      return {
        ...item,
        relList: _convertFormat(item.relList)
      };
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 本地搜索历史
const getLocalSearchHistory = async input => {
  try {
    let type = input && input.type;
    let result;
    if (type) {
      result = await executeDB({
        sql: SQL.QUERY_LOCAL_SEARCH_HISTORY_BY_TYPE_LIMIT,
        data: [{ type }]
      });
    } else {
      result = await executeDB({
        sql: SQL.QUERY_LOCAL_SEARCH_HISTORY_LIMIT
      });
    }
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 获取所有群助手列表
const queryAllRobot = async () => {
  try {
    let result;
    result = await executeDB({
      sql: SQL.QUERY_ALL_ROBOT
    });
    result = result.map(item => {
      return {
        ...item,
        relList: _convertFormat(item.relList)
      };
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 全文检索：查询机器人
export const globalRobot = async input => {
  try {
    const search = (input && input.search) || "";

    const result =
      (await executeDB({
        sql: SQL.QUERY_BY_KEY_ROBOT,
        data: { ...search, type: "globalRobot" }
      })) || [];

    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const executeQuery = async ({ key, input = {} }) => {
  try {
    let result;
    switch (key) {
      case "globalContact": // 全文检索：查询联系人
        result = await globalContact(input);
        break;
      case "globalGroup": // 全文检索：查询群组
        result = await globalGroup(input);
        break;
      case "indbTime": // 查询各个表上次入库时间
        result = await indbTime(input);
        break;
      case "getAllAccount": //查询所有人信息（以accountId和corpId为主键）
        result = await getAllAccount();
        break;
      case "getAllGroup": //查询所有群组（以id为主键）
        result = await getAllGroup();
        break;
      case "getAllStorage": //查询所有收纳组
        result = await getAllStorage();
        break;
      case "getAllStorageSession": //查询所有收纳组
        result = await getAllStorageSession();
        break;
      case "getLocalSearchHistory": //查询本地存储
        result = await getLocalSearchHistory();
        break;
      case "queryContatByAccountId": //根据accountId查询人员
        result = await queryContatByAccountId(input);
        break;
      case "queryContatByCorpId": //根据corpId查询人员
        result = await queryContatByCorpId(input);
        break;
      case "queryContatByAccountIdType": //根据corpId查询人员
        result = await queryContatByAccountIdType(input);
        break;

      case "queryAllRobot": // 获取所有机器人
        result = await queryAllRobot();
        break;

      case "globalRobot": // 获取所有机器人
        result = await globalRobot(input);
        break;
      default:
        console.log(`${key} is not defined in executeQuery.`);
        break;
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
