import Vue from "vue";
import { Message } from "element-ui";
import { ConversationModel, MessageModel, IMSDKServer } from "../../../WebIM";
import { Util } from "@/plugin";
import { ipcRenderer } from "electron";

let DialogQueue = [],
  watchAllUserAndGroup = null;

const Actions = {
  SetChitchatType({ commit }, type) {
    commit("SETCHITCHATTYPE", type);
  },
  PushDialogue({ commit, getters, dispatch }, data) {
    if (data.id) {
      const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
      const dialog =
        data.conversationType === PRIVATE
          ? getters.GetDialogues.private[data.id]
          : getters.GetDialogues.group[data.id];

      if (dialog) {
        dispatch("DeleteDialog", { data, onlyDel: true });
      }

      commit("PUSHDIALOGUR", data);
    }
  },
  AddDialogByKey({ dispatch, getters }, { key, type }) {
    const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
    const GROUP = ConversationModel.IMConversationEnum.GROUP;

    let dialog =
      type === PRIVATE
        ? getters.GetDialogues.private[key]
        : getters.GetDialogues.group[key];

    if (!dialog) {
      if (type === PRIVATE) {
        const allUserMap = getters.GetAllUserMap;
        const user = allUserMap[key];
        if (user) {
          const dialog = createUserDialog(user);
          dispatch("PushDialogue", dialog);
        } else {
          if (!key.includes("robot_")) {
            Vue.prototype.$service.getAccountInformationOrganization
              .call(Vue.prototype, {
                id: key
              })
              .then(result => {
                if (result) {
                  let data;
                  if (result.corpUsers && result.corpUsers.length) {
                    data = {
                      ...result.corpUsers[0],
                      avatar: result.avatar,
                      groupType: result.form || result.type
                    };
                  } else {
                    // 预留离职人员处理
                    data = {
                      ...result,
                      accountId: result.id,
                      name: result.nickName
                    };
                  }
                  if (data) {
                    const dialog = createUserDialog(data);
                    dispatch("PushDialogue", dialog);
                  }
                }
              })
              .catch(error => {
                pushAddDialogQueue({ type, key });
              });
          } else {
            const robots = getters.GetRobotList;
            if (robots && robots.length) {
              const robot = robots.find(item => item.accountId === key);
              if (robot) {
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
                dispatch("PushDialogue", dialogue);
                ipcRenderer.invoke("sqlite-url", {
                  key: "saveIncreaseRobot",
                  data: {
                    data: [
                      {
                        ...robot,
                        isDelinConversation: 0
                      }
                    ]
                  }
                });
              }
            }
          }
        }
      } else if (type === GROUP) {
        if (getters.GetGroups[key]) {
          const group = getters.GetGroups[key];
          const dialog = createGroupDialog(group);
          dispatch("PushDialogue", dialog);
        } else {
          Vue.prototype.$service.groupInfoApi
            .call(Vue.prototype, { id: key })
            .then(result => {
              if (result) {
                let data = result.data.data;
                const dialog = createGroupDialog(data);
                dispatch("PushDialogue", dialog);
              }
            })
            .catch(error => {
              pushAddDialogQueue({ type, key });
            });
        }
      }
    } else {
      dispatch("PushDialogue", dialog);
    }
  },
  SetOpenDialog({ commit, dispatch }, data) {
    commit("SETOPENDIALOG", data);
    dispatch("UpdateReminderMap", {
      type: false,
      key: data.id,
      conversationType: data.conversationType,
      data,
      number: 0
    });
    dispatch("DeleteAtMsgMapBykey", data);
  },
  // 删除会话
  DeleteDialog({ commit, dispatch }, { data, onlyDel, isToast = true }) {
    commit("DELETEDIALOG", { data, onlyDel });
    if (!onlyDel) {
      IMSDKServer.removeConversation(data.conversationType, data.id)
        .then(result => {
          dispatch("UpdateReminderMap", {
            type: false,
            key: data.id,
            conversationType: data.conversationType,
            number: 0
          });
        })
        .catch(error => {
          isToast && Message.warning("删除失败");
        });
    }
  },
  UpdateDialog({ commit }, { key, type, data }) {
    commit("UPDATEDIALOG", { key, type, data });
  },
  /**
   * 根据移动端发送的消息修改收纳组列表
   * @param {*} param0
   * @param {*} data
   */
  updateStorageSyncMsg({ state, commit, dispatch }, storage) {
    const allStorageList = [...(state.storages.storageList || [])];
    // 确保operateType为数字
    const data = {
      ...storage,
      id: storage.gatherId,
      name: storage.gatherName || "",
      isDelete: "0",
      isDisturb: storage.doNotDisturb,
      isTop: storage.topStatus,
      relList: (storage.finalRealChildList || []).map(item => {
        return {
          objectType: item.conversationType == "group" ? "1" : "2",
          beId: item.conversationId
        };
      })
    };
    // 不能只考虑创建、加入子项涉及会话可能为空的情况，其他端推送来的会话本地都可能没有
    dispatch(
      "SaveConversation",
      data.relList.map(item => {
        return {
          targetId: item.beId,
          conversationType:
            item.objectType == 1
              ? ConversationModel.IMConversationEnum.GROUP
              : ConversationModel.IMConversationEnum.PRIVATE
        };
      })
    );
    switch (storage.operateType * 1) {
      case 0:
        // 创建,创建时回话返回时间默认为收纳组创建时间
        data.createAt = data.time;
        allStorageList.push({ ...data });
        break;
      case 1:
      // 重命名
      case 2:
      // 置顶操作
      case 6:
      // 免打扰
      case 3:
      // 新增子项
      case 4:
        // 删除子项
        // 因为传了所有信息过来所以这些修改收纳组操作可以将原有的收纳组直接替换
        const changeIndex = allStorageList.findIndex(
          item => item.id == data.id
        );
        const oldData = allStorageList[changeIndex];
        if (changeIndex > -1) {
          // 更新时回话传回来的时间默认为更新时间
          allStorageList.splice(changeIndex, 1, {
            ...oldData,
            ...data
          });
        }
        break;
      case 5:
        // 移动至
        // 移动到的收纳组
        const moveToStorage = {
          id: storage.moveToGatherId,
          belongSubgroup: storage.moveToGatherBelongSubgroup,
          name: storage.moveToGatherName || "",
          isDelete: "0",
          isDisturb: storage.moveToGatherDoNotDisturb,
          isTop: storage.moveToGatherTopStatus,
          relList: (storage.moveToGatherFinalRealChildList || []).map(item => {
            return {
              objectType: item.conversationType == "group" ? "1" : "2",
              beId: item.conversationId
            };
          })
        };
        dispatch(
          "SaveConversation",
          moveToStorage.relList.map(item => {
            return {
              targetId: item.beId,
              conversationType:
                item.objectType == 1
                  ? ConversationModel.IMConversationEnum.GROUP
                  : ConversationModel.IMConversationEnum.PRIVATE
            };
          })
        );
        const moveToIndex = allStorageList.findIndex(
          item => item.id == storage.moveToGatherId
        );
        // 移除的收纳组
        const moveOutIndex = allStorageList.findIndex(
          item => item.id == storage.gatherId
        );

        if (moveToIndex > -1 && moveOutIndex > -1) {
          const moveToData = allStorageList[moveToIndex];
          const moveOutData = allStorageList[moveOutIndex];
          // 移动出的收纳组删除子项
          allStorageList.splice(moveOutIndex, 1, {
            ...moveOutData,
            ...data,
            updateAt: data.time
          });
          // 移动至的收纳组添加子项
          allStorageList.splice(moveToIndex, 1, {
            ...moveToData,
            ...moveToStorage,
            updateAt: data.time
          });
        }
        break;
      case 7:
        // 解散
        const deleteStorageIndex = allStorageList.findIndex(
          item => item.id == data.id
        );
        allStorageList.splice(deleteStorageIndex, 1);
        break;
    }
    dispatch("updateStorageMap", allStorageList);
    commit("updateStorageList", { storageList: allStorageList });
  },
  updateStorage(
    { commit, dispatch },
    data = { sessionList: [], storageList: [] }
  ) {
    // 修改群属性
    dispatch("SaveAttribute", data.sessionList);
    // 修改收纳组与群组之间的map
    dispatch("updateStorageMap", data.storageList);
    commit("updateStorageList", data);
    data.storageList
      .filter(item => {
        return item.isDelete == "0";
      })
      .forEach(storage => {
        dispatch(
          "SaveConversation",
          storage.relList.map(item => {
            return {
              targetId: item.beId,
              conversationType:
                item.objectType == 1
                  ? ConversationModel.IMConversationEnum.GROUP
                  : ConversationModel.IMConversationEnum.PRIVATE
            };
          })
        );
      });
  },
  updateStorageMap({ commit, dispatch }, data) {
    // 修改群属性
    commit("UPDATESTORAGEMAP", data);
  },
  /**
   * 更新会话属性
   * 设置免打扰，置顶等
   */
  UpdataConversationAttribute({ commit }, data) {
    data &&
      Object.keys(data).length &&
      commit("SetConversationAttribute", data);
  },
  UpdateReminderMap(
    { commit, getters, dispatch },
    { key, data = {}, conversationType, type, number, all = true }
  ) {
    let converType = conversationType || data.conversationType;
    if (
      type &&
      (data.bySelf ||
        (getters.GetOpenDialog.id === key && getters.GetMainWinVisible))
    ) {
      return;
    }
    let isAtMe = false;
    if (data.content && data.content.mentionedInfo) {
      const { mentionedInfo } = data.content;
      if (
        mentionedInfo.type === 1 ||
        mentionedInfo.userIdList.includes(getters.GetUser.id)
      ) {
        isAtMe = true;
      }
    }
    if (!type) {
      // 已读回执清空@
      dispatch("DeleteAtMsgMapBykey", {
        ...data,
        id: data.targetId || data.id
      });
    }

    commit("UPDATEREMINDERMAP", {
      key,
      type,
      number,
      all,
      conversationType: converType,
      isAtMe
    });
  },
  // 保存从融云获取到的会话列表
  SaveConversation({ commit, dispatch, getters }, data = []) {
    if (
      Util.isEmptyObject(getters.GetAllUserMap) &&
      Util.isEmptyObject(getters.GetGroups)
    ) {
      data.map(item => {
        pushAddDialogQueue({
          key: item.targetId,
          type: item.conversationType
        });
      });
      watchAllUserAndGroup = null;
      watchUserAndGroup.call(this, dispatch);
    } else {
      data.map(item => {
        dispatch("AddDialogByKey", {
          key: item.targetId,
          type: item.conversationType
        });
      });
    }
  },
  // 保存登录时从后台获取到的会话属性
  SaveAttribute({ commit, dispatch }, data = []) {
    data.forEach(item => {
      const conversationType =
        item.objectType == 2
          ? ConversationModel.IMConversationEnum.PRIVATE
          : ConversationModel.IMConversationEnum.GROUP;
      if (item.isTop == 1) {
        dispatch("UpdataConversationAttribute", {
          conversationType,
          beId: item.beId,
          operateType: 1,
          onOff: 1
        });
      } else {
        dispatch("UpdataConversationAttribute", {
          conversationType,
          beId: item.beId,
          operateType: 1,
          onOff: 0
        });
      }
      if (item.isDisturb == 1) {
        dispatch("UpdataConversationAttribute", {
          conversationType,
          beId: item.beId,
          operateType: 2,
          onOff: 1
        });
      } else {
        dispatch("UpdataConversationAttribute", {
          conversationType,
          beId: item.beId,
          operateType: 2,
          onOff: 0
        });
      }
    });
  },
  ChangeNoMoreMsg({ commit }, { data, action, conversationType }) {
    data && commit("CHANGENOMOREMSG", { data, action, conversationType });
  },
  /**
   * 设置会话是否处于历史消息状态
   * @param {*} state
   * @param {string} key  会话类型与会话Id拼接的key，type_id
   * @param {boolean} status 是否处于历史消息，true--处于，false--未处于
   */
  SetIsGetHistoryStatus({ commit }, { key, status }) {
    commit("CommitIsGetHistoryStatus", { key, status });
  },
  openConversationById(
    { commit, dispatch, getters },
    { id, conversationType }
  ) {
    const conversationList = getters.GetConversationSort.all;
    const conversation = conversationList.find(
      item => item.id === id && item.conversationType === conversationType
    );
    if (conversation) {
      dispatch("SetOpenDialog", conversation);
    }
  },
  SetContentTime({ commit }, time) {
    commit("SETCONTENTTIME", time);
  },

  SetDraftListMap({ commit }, draftListMap) {
    commit("SETDRAFTLISTMAP", draftListMap);
  }
};

/**
 * 辅助方法
 */

function watchUserAndGroup(dispatch) {
  if (!watchAllUserAndGroup) {
    watchAllUserAndGroup = this.watch(
      state => state,
      state => {
        if (
          (!Util.isEmptyObject(state.GroupsModule.GroupsMap) &&
            !Util.isEmptyObject(state.AllUserMap)) ||
          !Util.isEmptyObject(state.AllUserMap)
        ) {
          const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
          const GROUP = ConversationModel.IMConversationEnum.GROUP;

          for (let index = 0; index < DialogQueue.length; index++) {
            const item = DialogQueue[index];
            let data = null,
              dialog = null;
            switch (item.type) {
              case PRIVATE:
                data = state.AllUserMap[item.id];
                if (data) {
                  dialog = createUserDialog(data);
                }
                break;
              case GROUP:
                data = state.GroupsModule.GroupsMap[item.id];
                if (data) {
                  dialog = createGroupDialog(data);
                }
                break;
              default:
                break;
            }
            if (dialog) {
              dispatch("PushDialogue", dialog);
              DialogQueue.splice(index, 1);
              index && index--;
            }
          }

          watchAllUserAndGroup &&
            (watchAllUserAndGroup(), (watchAllUserAndGroup = null));
        }
      },
      { deep: true }
    );
  }
}

function pushAddDialogQueue({ type, key }) {
  for (let i = 0; i < DialogQueue.length; i++) {
    const item = DialogQueue[i];
    if (item.id === key) {
      DialogQueue.splice(i, 1);
      break;
    }
  }
  DialogQueue.unshift({
    id: key,
    type
  });
}

function createGroupDialog(group) {
  let result = new ConversationModel.IMConversation(
    {
      id: group.id,
      name: group.name,
      corpId: group.corpId,
      creator: group.creator,
      createAt: group.createAt,
      count: group.groupNumber
    },
    ConversationModel.IMConversationEnum.GROUP
  );

  return result;
}

function createUserDialog(user) {
  // console.log("会话列表用户", user, user && user.name);
  let result = new ConversationModel.IMConversation(
    {
      id: user.accountId,
      avatar: user.avatar,
      name: user.name,
      groupType: user.groupType >= 10 ? 10 : 0,
      corpId: user.corpId
    },
    ConversationModel.IMConversationEnum.PRIVATE
  );

  return result;
}

export default Actions;
