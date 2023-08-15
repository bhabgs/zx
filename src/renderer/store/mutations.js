import Vue from "vue";
import { Util } from "@/plugin";
const { deepClone } = Util;

import stateTemplate from "@/store/stateTemplate";

// 更新用户信息
export const UpUserData = (state, { info }) => {
  state.user = info;
};

// 更新所有员工数据
export const SETALLUSERMAP = (state, { userMap, needClear, isDelete }) => {
  let AllUserMap = {};
  // 全量更新数据
  if (needClear) {
    AllUserMap = {};
  } else {
    AllUserMap = state.AllUserMap;
  }
  for (const key in userMap) {
    // 删除
    if (isDelete) {
      Vue.delete(AllUserMap, key);
    } else {
      Vue.set(AllUserMap, key, userMap[key]);
    }
  }
  Vue.set(state, "AllUserMap", AllUserMap);
};

// 更新所有员工数据
export const SETALLUSERMAPBYCORP = (
  state,
  { userMapByCorp, needClear, isDelete }
) => {
  let AllUserMapByCorp = {};
  if (needClear) {
    AllUserMapByCorp = {};
  } else {
    AllUserMapByCorp = state.AllUserMapByCorp;
  }
  for (const key in userMapByCorp) {
    // 删除
    if (isDelete) {
      Vue.delete(AllUserMapByCorp, key);
    } else {
      Vue.set(AllUserMapByCorp, key, userMapByCorp[key]);
    }
  }
  Vue.set(state, "AllUserMapByCorp", AllUserMapByCorp);
};

// 更新焦点信息ID
export const UPMSGID = (state, id) => {
  state.MsgFocusID = id;
};

export const SAVENOTCORPUSER = (state, user) => {
  Vue.set(state.NotCorpUser, user.id, user);
};

export const SAVEUSER = (state, user) => {
  Vue.set(state.AllUserMap, user.accountId, user);
  if (user.corpId) {
    Vue.set(state.AllUserMapByCorp, `${user.accountId}#${user.corpId}`, user);
  } else if (user.corpUsers) {
    for (const item of user.corpUsers) {
      item.corpId &&
        Vue.set(
          state.AllUserMapByCorp,
          `${item.accountId}#${item.corpId}`,
          item
        );
    }
  }
};

export const SETCORPID = (state, data) => {
  state.corpId = data;
};

export const SETNETWORKSTATE = (state, data) => {
  state.NetWorkState = data;
};

export const SetNotifyList = (state, list) => {
  state.NotifyList = list;
};

export const SetNotifyUnRead = (state, list) => {
  state.NotifyUnRead = list;
};

export const RESETSTATE = state => {
  const resetState = deepClone(stateTemplate("baseState"));
  for (const key in resetState) {
    if (resetState.hasOwnProperty(key)) {
      Vue.set(state, key, resetState[key]);
    }
  }
};

export const WINVISIBLE = (state, data) => {
  state.MainWinVisible = data;
};

export const CommitActiveNotifyApp = (state, app) => {
  state.ActiveNotifyApp = app;
};

export const UpdataMailUnReadCount = (state, data) => {
  state.MailUnReadCount = data;
};

export const UpdataActionCenterUnread = (state, data) => {
  state.ActionCenterUnread = data;
};

export const SetExtCorpInfo = (state, { corpId, info }) => {
  Vue.set(state.ExtCorpInfo, corpId, info);
};
