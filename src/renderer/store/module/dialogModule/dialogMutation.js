import Vue from "vue";
import { Util } from "@/plugin";
const { deepClone } = Util;
import { ConversationModel } from "../../../WebIM";

import stateTemplate from "@/store/stateTemplate";

const Mutations = {
  SETCHITCHATTYPE(state, type) {
    state.chitchatType = type;
  },
  /**
   * 添加会话
   * @param {*} state
   * @param {*} data
   */
  PUSHDIALOGUR(state, data) {
    // 增加会话
    state.Dialogues.unshift(data);
  },
  /**
   * 设置打开会话
   * @param {*} state
   * @param {*} data
   */
  SETOPENDIALOG(state, data) {
    // 设置打开会话
    // state.OpenDialog = { ...data };
    if (data.groupType >= 10) {
      Vue.set(state, "OutsourceOpenDialog", { ...data });
    } else {
      Vue.set(state, "OpenDialog", { ...data });
    }
  },
  /**
   * 删除会话
   * @param {*} state
   * @param {*} param1
   */
  DELETEDIALOG(state, { data, onlyDel }) {
    let openDialog = {};
    if (data.groupType < 10) {
      openDialog = state.OpenDialog || {};
    } else {
      openDialog = state.OutsourceOpenDialog || {};
    }
    // 删除会话
    const PRIVATE = ConversationModel.IMConversationEnum.PRIVATE;
    for (let index = 0; index < state.Dialogues.length; index++) {
      const dialog = state.Dialogues[index];
      if (
        dialog.id === data.id &&
        data.conversationType === dialog.conversationType
      ) {
        state.Dialogues.splice(index, 1);
        break;
      }
    }
    if (
      !onlyDel &&
      openDialog.id === data.id &&
      openDialog.conversationType === data.conversationType
    ) {
      if (data.groupType < 10) {
        state.OpenDialog = {};
      } else {
        state.OutsourceOpenDialog = {};
      }
    }
  },
  /**
   * 设置会话属性
   * @param {number} conversationType 会话类型
   * @param {string} beId：被操作（群、人）id
   * @param {number} operateType 操作类型，1：置顶，2：免打扰
   * @param {number} onOff 设置值，1：添加，2：取消
   *
   */
  SetConversationAttribute(
    state,
    { conversationType, beId, operateType, onOff }
  ) {
    let mapKey = ConversationModel.IMConversationEnum[conversationType],
      operate = "";
    mapKey = mapKey && mapKey.toLowerCase();
    switch (operateType) {
      case 1:
        operate = "TopMap";
        break;
      case 2:
        operate = "IsHintMap";
        break;
    }
    if (mapKey && operate) {
      if (onOff === 1) {
        if (
          (operate === "IsHintMap" && mapKey === "group") ||
          operate === "TopMap"
        ) {
          // 只有群聊免打扰或者置顶操作才做此操作
          Vue.set(state[operate][mapKey], beId, true);
        }
      } else {
        Vue.delete(state[operate][mapKey], beId);
      }
    }
  },
  /**
   * 更新会话数据
   * @param {*} state
   * @param {*} param1
   */
  UPDATEDIALOG(state, { key, type, data }) {
    // 更新对话数据
    let IsOpen = state.OpenDialog.id === key;
    for (let i = 0; i < state.Dialogues.length; i++) {
      const dialog = state.Dialogues[i];
      if (dialog.id === key && dialog.conversationType === type) {
        for (const k in data) {
          if (data.hasOwnProperty(k)) {
            Vue.set(dialog, k, data[k]);
            if (IsOpen) {
              Vue.set(state.OpenDialog, k, data[k]);
            }
          }
        }
        Vue.set(state.Dialogues, i, dialog);
        break;
      }
    }
  },
  /**
   * 更新会话对应的新消息数
   * @param {*} state
   * @param {*} param1
   */
  UPDATEREMINDERMAP(
    state,
    { key, type, number, all, conversationType, isAtMe = false }
  ) {
    try {
      let mapKey =
        conversationType === ConversationModel.IMConversationEnum.PRIVATE
          ? "private"
          : "group";
      let tampMap = state.ReminderMap[mapKey];
      if (type) {
        let temp = tampMap[key];
        if (temp === undefined) {
          temp = number;
        } else {
          temp += number;
        }
        Vue.set(tampMap, key, temp);
        Vue.set(state.ReminderMap, mapKey, tampMap);
        if (!state.IsHintMap[mapKey][key] || isAtMe) {
          state.HintFlag += number;
        }
      } else {
        const total = state.ReminderMap[mapKey][key];
        const count = all ? state.ReminderMap[mapKey][key] : number;
        if (count) {
          if (state.HintFlag > 0) {
            state.HintFlag -= count;
          }
          let num = total >= count ? total - count : 0;

          Vue.set(tampMap, key, num);
          Vue.set(state.ReminderMap, mapKey, tampMap);
        }
      }
    } catch (error) {}
  },
  /**
   * 修改会话是否有更多消息的状态
   * @param {*} state
   * @param {*} param1
   */
  CHANGENOMOREMSG(state, { data, action, conversationType }) {
    const key =
      conversationType === ConversationModel.IMConversationEnum.GROUP
        ? "group"
        : "private";
    const cacheData = state.NoMoreMsg[key];
    switch (action) {
      case "add":
        !cacheData.includes(data) && state.NoMoreMsg[key].push(data);
        break;

      case "del":
        const index = cacheData.indexOf(data);
        index !== -1 && state.NoMoreMsg[key].splice(index, 1);
        break;
    }
  },
  /**
   * 设置会话是否处于历史消息状态
   * @param {*} state
   * @param {string} key  会话类型与会话Id拼接的key，type_id
   * @param {boolean} status 是否处于历史消息，true--处于，false--未处于
   */
  CommitIsGetHistoryStatus(state, { key, status }) {
    Vue.set(state.IsGetHistoryStatus, key, status);
  },
  updateStorageList(state, { sessionList, storageList } = {}) {
    if (sessionList) {
      Vue.set(state.storages, "sessionList", [...sessionList]);
    }
    if (storageList) {
      Vue.set(state.storages, "storageList", [...storageList]);
    }
  },
  UPDATESTORAGEMAP(state, data) {
    const storageMap = new Map();
    (data || []).forEach(element => {
      const data = {
        group: (element.relList || [])
          .filter(item => item.objectType == "1")
          .map(item => item.beId),
        private: (element.relList || [])
          .filter(item => item.objectType == "2")
          .map(item => item.beId)
      };
      storageMap.set(data, element.id);
    });
    state.storageMap = storageMap;
  },
  RESETSTATE(state) {
    const resetState = deepClone(stateTemplate("dialogState"));
    for (const key in resetState) {
      if (resetState.hasOwnProperty(key)) {
        Vue.set(state, key, resetState[key]);
      }
    }
  },
  SETCONTENTTIME(state, time) {
    state.contentTime = time;
  },

  SETDRAFTLISTMAP(state, draftListMap) {
    state.draftListMap = draftListMap;
  }
};

export default Mutations;
