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
/**
 * 业务的处理函数
 */
// 人员
const saveAllAccount = async (data, inFile = false) => {
  //  全量调用时，先清空时间，再清空数据，接着插入数据，最后更新时间
  try {
    if (data && data.list) {
      await executeDB({
        sql: SQL.DELETE_UPDATETIME_BY_KEY,
        data: [{ id: "account" }],
        inFile
      });
      await executeDB({
        sql: SQL.DELETE_ACCOUNT,
        inFile
      });
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_ACCOUNT,
        data: data.list || [],
        inFile
      });
    }
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "account", updateTime: data.ctime }],
        inFile
      });
    }
  } catch (err) {
    console.error(err);
  }
};
const getAccountInformationOrganization = async (data, input) => {
  try {
    // 改接口只用于查询个人头像时用的，与入库的账号信息结构不同，因此不再做入库处理
    const id = input && input.id;
    let user = data.data || {};
    const tdata = {
      ...user,
      type: user.form || user.type
    };
    let currentUser = await executeDB({
      sql: SQL.QUERY_ACCOUNT_BY_ACCOUNTID,
      data: [{ accountId: id }]
    });
    currentUser = currentUser.map(item => {
      return {
        ...item,
        depts: _convertFormat(item.depts)
      };
    });
    let deleteList = [];
    let addList = [];
    let corpUsers = tdata.corpUsers;
    if (corpUsers && corpUsers.length) {
      const exitCorpIds = corpUsers.map(item => item.corpId);
      deleteList = currentUser.filter(item => {
        const corpId =
          item.corpId || (item.depts && item.depts && item.depts[0].corpId);
        return !exitCorpIds.includes(corpId);
      });
      addList = corpUsers.map(item => {
        return {
          ...item,
          avatar: tdata.avatar,
          canJoin: item.corp.canJoin,
          corpName: item.corp.name,
          createAt: item.corp.createAt,
          depts: item.corp.depts,
          imAccount: tdata.imAccount,
          isCertified: tdata.isCertified,
          isHide: tdata.isHide,
          isSubscribe: tdata.isSubscribe,
          leaveDate: tdata.leaveDate,
          nickName: tdata.nickName,
          status: tdata.status,
          type: item.type || item.form,
          visibleState: tdata.visibleState
        };
      });
      await executeDB({
        sql: SQL.DELETE_ACCOUNT_BY_KEY,
        data: deleteList
      });
      executeDB({
        sql: SQL.DELETE_ACCOUNT_BY_KEY,
        data: deleteList,
        inFile: true
      });
    } else {
      // 无公司用户也缓存
      addList = [
        {
          ...tdata,
          accountId: tdata.id,
          corpId: "null",
          isHide: tdata.visibleState == -1 ? 1 : 0
        }
      ];
      deleteList = [{ accountId: tdata.id }];
      await executeDB({
        sql: SQL.DELETE_ACCOUNT_BY_ACCOUNTID,
        data: deleteList
      });
      executeDB({
        sql: SQL.DELETE_ACCOUNT_BY_ACCOUNTID,
        data: deleteList,
        inFile: true
      });
    }
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_ACCOUNT,
      data: addList,
      inFile: false
    });

    executeDB({
      sql: SQL.INSERT_OR_REPLACE_ACCOUNT,
      data: addList,
      inFile: true
    });
  } catch (err) {
    console.log("入库失败");
    console.error(err);
  }
};
const getChangeResultData = async (data, input, inFile = false) => {
  try {
    const corpIds = (input && input.corpIds) || [];
    const userList = data.data || [];
    // 删除用户和更新用户的逻辑
    let deleteSqliteList = [];
    let updateSqliteList = [];
    for (let index = 0; index < userList.length; index++) {
      const element = userList[index].accountInfomationDTO || {};
      deleteSqliteList.push({ accountId: element.id });
      if (Array.isArray(element.corpUsers) && element.corpUsers.length) {
        // 如果当前用户有公司则添加数据存储
        updateSqliteList.push(
          ...(element.corpUsers.map(item => {
            return {
              avatar: element.avatar,
              accountId: userList[index].accountId,
              ...element,
              ...item,
              corpName: item.corp.name,
              form: element.form || element.type, // 选择最外层的type
              type: element.form || element.type // 选择最外层的type
            };
          }) || [])
        );
      }
    }
    let result = await executeDB({
      sql: SQL.DELETE_ACCOUNT_BY_ACCOUNTID,
      data: deleteSqliteList,
      inFile
    });
    result = await executeDB({
      sql: SQL.INSERT_OR_REPLACE_ACCOUNT,
      data: updateSqliteList,
      inFile
    });
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "account", updateTime: data.ctime }],
        inFile
      });
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
const getListIuUser = async (data, inFile = false) => {
  try {
    let result;
    if (data && data.data) {
      let updateList = [].concat(data.data.addUsers, data.data.updUsers);
      let deleteList = [].concat(data.data.delUsers);
      result = await Promise.all([
        executeDB({
          sql: SQL.INSERT_OR_REPLACE_ACCOUNT,
          data: updateList,
          inFile
        }),
        executeDB({
          sql: SQL.DELETE_ACCOUNT,
          data: deleteList,
          inFile
        })
      ]);
      if (data && data.ctime) {
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
          data: [{ id: "account", updateTime: data.ctime }],
          inFile
        });
      }
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
const fixContact = async (data, inFile = false) => {
  /**
   * 修复联系人过程分5步
   * 1.获取入参的所有人员的accountId
   * 2.用户表删除所有这些accountId的数据
   * 3.获取剩余用户，取到所有剩余用户的accountId
   * 3.剩余用户的数据visibleState置为-1(不可搜索到)，corpId、corpLabelName、corpName置为空。（相当于是离职人员）
   * 4.把入参的所有输入插入account表
   * 5.更新更新时间表
   */
  if (data && data.list) {
    // 获取所有accountId
    const accountIds = [...new Set(data.list.map(item => item.accountId))];
    // 用户表删除所有这些accountId的数据
    await executeDB({
      sql: SQL.DELETE_ACCOUNT_BY_ACCOUNTID,
      data: accountIds.map(item => {
        return { accountId: item };
      })
    });
    // 获取所有剩余id
    let result = await executeDB({
      sql: SQL.QUERY_ACCOUNT
    });
    const accountRest = result.map(item => item.accountId);
    // 用户表剩余数据修改
    await executeDB({
      sql: SQL.UPDATE_ALL_ACCOUNT({
        corpLabelName: null,
        corpName: null,
        visibleState: -1,
        excludeList: accountRest
      }),
      data: [{ corpLabelName: null, corpName: null, visibleState: -1 }],
      inFile,
      selective: true
    });
    // 插入所有新数据
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_ACCOUNT,
      data: data.list || [],
      inFile
    });
    // 更新  更新时间表   的用户增量更新时间
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "account", updateTime: data.ctime }],
        inFile
      });
    }
  }
};
// 群组
const saveAllGroup = async (data, inFile = false) => {
  try {
    const resultList = data.list;
    let memberList = [];
    let robotList = [];
    resultList.forEach(item => {
      memberList = memberList.concat(
        (item.groupMembers || []).map(sub => {
          return {
            id: item.id,
            accountId: sub
          };
        })
      );
      robotList = robotList.concat(
        (item.groupRobots || []).map(sub => {
          return {
            id: item.id,
            ...sub
          };
        })
      );
    });
    let result;
    await executeDB({
      sql: SQL.DELETE_UPDATETIME_BY_KEY,
      data: [{ id: "group" }],
      inFile
    });
    result = await Promise.all([
      executeDB({
        sql: SQL.DELETE_GROUP,
        inFile
      }),
      executeDB({
        sql: SQL.DELETE_GROUP_GROUPMEMBERS,
        inFile
      }),
      executeDB({
        sql: SQL.DELETE_GROUP_GROUPROBOTS,
        inFile
      })
    ]);
    result = await Promise.all([
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP,
        data: resultList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_GROUPMEMBERS,
        data: memberList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_GROUPROBOTS,
        data: robotList,
        inFile
      })
    ]);
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "group", updateTime: data.ctime }],
        inFile
      });
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
const saveIncreaseGroup = async (data, inFile = false) => {
  try {
    let result;
    const resultList = data.list;
    let memberList = [];
    let robotList = [];

    resultList.forEach(item => {
      memberList = memberList.concat(
        (item.groupMembers || []).map(sub => {
          return {
            id: item.id,
            accountId: sub
          };
        })
      );
      robotList = robotList.concat(
        (item.groupRobots || []).map(sub => {
          return {
            id: item.id,
            ...sub
          };
        })
      );
    });
    const delResultList = data.list.filter(item => item.isDelete == 2);
    result = await Promise.all([
      executeDB({
        sql: SQL.DELETE_GROUP_BY_KEY,
        data: delResultList,
        inFile
      }),
      executeDB({
        sql: SQL.DELETE_GROUP_GROUPMEMBERS_BY_ID,
        data: delResultList,
        inFile
      }),
      executeDB({
        sql: SQL.DELETE_GROUP_GROUPROBOTS_BY_ID,
        data: delResultList,
        inFile
      })
    ]);
    result = await Promise.all([
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP,
        data: resultList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_GROUPMEMBERS,
        data: memberList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_GROUPROBOTS,
        data: robotList,
        inFile
      })
    ]);
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "group", updateTime: data.ctime }],
        inFile
      });
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
const groupInfoApi = async (data, inFile = false) => {
  try {
    let resultList = data.data ? [data.data] : [];
    let memberList = [];
    let robotList = [];
    resultList.forEach(item => {
      memberList = memberList.concat(
        (item.groupMembers || []).map(sub => {
          return {
            id: item.id,
            accountId: sub
          };
        })
      );
      robotList = robotList.concat(
        (item.groupRobots || []).map(sub => {
          return {
            id: item.id,
            ...sub
          };
        })
      );
    });
    await Promise.all([
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP,
        data: resultList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_GROUPMEMBERS,
        data: memberList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_GROUPROBOTS,
        data: robotList,
        inFile
      })
    ]);
  } catch (err) {
    console.error(err);
  }
};
const createGroup = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};
const updateGroup = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};
const quitGroup = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};
const transferGroup = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

// 收纳组
const createStorage = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const deleteStorage = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const editStorage = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const getTopAndDisturbList = async (data, input, inFile = false) => {
  const isGlobal = !(input && input.startTime);
  try {
    const sessionList = (data.data && data.data.sessionList) || [];
    const storageList = (data.data && data.data.storageList) || [];
    const delStorageList = storageList.filter(item => item.isDelete == 1);
    let rellist = [];
    storageList.map(item => {
      rellist = rellist.concat(
        (item.relList || []).map(sub => {
          return {
            id: item.id,
            beId: sub.beId,
            objectType: sub.objectType
          };
        })
      );
    });
    if (isGlobal) {
      await executeDB({
        sql: SQL.DELETE_UPDATETIME_BY_KEY,
        data: [{ id: "storage" }],
        inFile
      });
      await Promise.all([
        executeDB({
          sql: SQL.DELETE_GROUP_ATTRIBUTE,
          inFile
        }),
        executeDB({
          sql: SQL.DELETE_STORAGE,
          inFile
        }),
        executeDB({
          sql: SQL.DELETE_STORAGE_RELLIST,
          inFile
        })
      ]);
    } else {
      await Promise.all([
        executeDB({
          sql: SQL.DELETE_STORAGE_BY_KEY,
          data: delStorageList,
          inFile
        }),
        executeDB({
          sql: SQL.DELETE_STORAGE_RELLIST_BY_ID,
          data: delStorageList,
          inFile
        })
      ]);
    }

    await Promise.all([
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_GROUP_ATTRIBUTE,
        data: sessionList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_STORAGE,
        data: storageList,
        inFile
      }),
      executeDB({
        sql: SQL.INSERT_OR_REPLACE_STORAGE_RELLIST,
        data: rellist,
        inFile
      })
    ]);
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "storage", updateTime: data.ctime }],
        inFile
      });
    }
  } catch (err) {
    console.error(err);
  }
};

const joinStorage = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const quitStorage = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const setStorageDisturb = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const setStorageTop = async data => {
  try {
    await executeDB({
      sql: SQL.EMPTY_SQL,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const getHistoryMessageServe = async data => {
  try {
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_MESSAGE,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const removeMessage = async (data, input) => {
  try {
    await executeDB({
      sql: SQL.DELETE_MESSAGE_BY_KEY,
      data
    });
  } catch (err) {
    console.error(err);
  }
};

const setLocalSearchHistory = async (data, inFile) => {
  try {
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_LOCAL_SEARCH_HISTORY,
      data,
      inFile
    });
  } catch (err) {
    console.error(err);
  }
};

const clearLocalSearchHistory = async (data, inFile) => {
  try {
    let isClearAll = data && data.length < 1;
    if (isClearAll) {
      await executeDB({
        sql: SQL.DELETE_LOCAL_SEARCH_HISTORY,
        inFile
      });
    } else {
      await executeDB({
        sql: SQL.DELETE_LOCAL_SEARCH_HISTORY_BY_KEY,
        data,
        inFile
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// 机器人
const saveAllRobot = async (data, inFile = false) => {
  try {
    console.log("saveAllRobot");
    let resultList = data.data || [];

    resultList = resultList.map(item => ({
      ...item,
      corpIdList: _convertFormat(item.corpIdList)
    }));
    let result;
    await executeDB({
      sql: SQL.DELETE_UPDATETIME_BY_KEY,
      data: [{ id: "robot" }],
      inFile
    });
    result = await executeDB({
      sql: SQL.DELETE_ALL_ROBOT,
      inFile
    });
    result = await executeDB({
      sql: SQL.INSERT_OR_REPLACE_ROBOT,
      data: resultList,
      inFile
    });
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "robot", updateTime: data.ctime }],
        inFile
      });
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
const saveIncreaseRobot = async (data, inFile = false) => {
  try {
    let result;
    let resultList = data.data || [];

    resultList = resultList.map(item => ({
      ...item,
      corpIdList: _convertFormat(item.corpIdList)
    }));
    const delResultList = data.data.filter(item => item.isDelete == 1);
    if (delResultList.length) {
      result = await executeDB({
        sql: SQL.DELETE_BY_KEY_ROBOT,
        data: delResultList,
        inFile
      });
    }
    result = await executeDB({
      sql: SQL.INSERT_OR_REPLACE_ROBOT,
      data: resultList,
      inFile
    });
    if (data && data.ctime) {
      await executeDB({
        sql: SQL.INSERT_OR_REPLACE_UPDATETIME,
        data: [{ id: "robot", updateTime: data.ctime }],
        inFile
      });
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};

// 针对每个sql语句做的入库处理
export const executeURL = async ({ key = "", data = [], input }) => {
  try {
    let result;
    switch (key) {
      case "saveAllAccount": // 用户
        result = await saveAllAccount(data);
        saveAllAccount(data, true);
        break;
      case "getAccountInformationOrganization": // 用户
        result = await getAccountInformationOrganization(data, input);
        break;
      case "getChangeResultData": // 用户
        result = await getChangeResultData(data, input);
        getChangeResultData(data, input, true);
        break;
      case "getListIuUser": // 用户
        result = await getListIuUser(data);
        getListIuUser(data, true);
        break;
      case "fixContact": // 用户
        result = await fixContact(data);
        fixContact(data, true);
        break;
      case "saveAllGroup": // 群组
        result = await saveAllGroup(data);
        saveAllGroup(data, true);
        break;
      case "saveIncreaseGroup": // 群组
        result = await saveIncreaseGroup(data);
        saveIncreaseGroup(data, true);
        break;
      case "groupInfoApi": // 群组
        result = await groupInfoApi(data);
        groupInfoApi(data, true);
        break;
      case "createGroup": // 群组
        result = await createGroup(data);
        break;
      case "updateGroup": // 群组
        result = await updateGroup(data);
        break;
      case "quitGroup": // 群组
        result = await quitGroup(data);
        break;
      case "transferGroup": // 群组
        result = await transferGroup(data);
        break;
      case "createStorage": // 收纳组
        result = await createStorage(data);
        break;
      case "deleteStorage": // 收纳组
        result = await deleteStorage(data);
        break;
      case "editStorage": // 收纳组
        result = await editStorage(data);
        break;
      case "getTopAndDisturbList": // 收纳组
        result = await getTopAndDisturbList(data, input);
        getTopAndDisturbList(data, input, true);
        break;
      case "joinStorage": // 收纳组
        result = await joinStorage(data);
        break;
      case "quitStorage": // 收纳组
        result = await quitStorage(data);
        break;
      case "setStorageDisturb": // 收纳组
        result = await setStorageDisturb(data);
        break;
      case "setStorageTop": // 收纳组
        result = await setStorageTop(data);
        break;
      case "getHistoryMessageServe":
        result = await getHistoryMessageServe(data);
        break;
      case "removeMessage":
        result = await removeMessage(data, input);
        break;
      case "setLocalSearchHistory":
        result = await setLocalSearchHistory(data);
        setLocalSearchHistory(data, true);
        break;
      case "clearLocalSearchHistory":
        result = await clearLocalSearchHistory(data);
        clearLocalSearchHistory(data, true);
        break;

      case "saveAllRobot": // 存储所有群助手
        result = await saveAllRobot(data);
        saveAllRobot(data, true);
        break;
      case "saveIncreaseRobot": // 增量存储群助手
        result = await saveIncreaseRobot(data);
        saveIncreaseRobot(data, true);
        break;

      default:
        console.log(`${key} is not defined in executeURL.`);
        break;
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
