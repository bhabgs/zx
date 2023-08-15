/*
 * @Author: lixiaowei
 * @Date: 2020-10-16 10:40:37
 * @LastEditors: lixiaowei
 * @LastEditTime: 2020-12-07 14:36:44
 * @Description: file content
 * @FilePath: /zx-client-pc/src/renderer/store/actions.js
 */
import { ConversationModel } from "../WebIM";
import { ipcRenderer } from "electron";

// 用户登录
export const SaveUserInfo = ({ commit }, { info }) => {
  commit("UpUserData", { info });
};

// 全部员工
export const setAllUser = (
  { commit, dispatch },
  { users, needClear, isDelete }
) => {
  let userMap = {};
  let userMapByCorp = {};
  users.forEach(user => {
    if(!userMap[user.accountId]) {
      userMap[user.accountId] = {...user,name: user.nickName || user.name};
    }
    userMapByCorp[`${user.accountId}#${user.corpId}`] = user;
    const data = { name: user.name || user.nickName };
    user.avatar && (data.avatar = user.avatar);
    dispatch("UpdateDialog", {
      key: user.accountId,
      type: ConversationModel.IMConversationEnum.PRIVATE,
      data
    });
  });
  dispatch("SetAllUserMap", { userMap, needClear, isDelete });
  dispatch("SetAllUserMapByCorp", {
    userMapByCorp,
    needClear,
    isDelete
  });
};

export const SetAllUserMap = ({ commit }, usersMap) => {
  commit("SETALLUSERMAP", usersMap);
};

export const SetAllUserMapByCorp = ({ commit }, userMapByCorp) => {
  commit("SETALLUSERMAPBYCORP", userMapByCorp);
};

// export const SaveUser = ({ commit, dispatch }, [user, isSaveDB = false]) => {
//   console.log(user, isSaveDB);
//   commit("SAVEUSER", user);
//   const data = { name: user.name };
//   user.avatar && (data.avatar = user.avatar);
//   dispatch("UpdateDialog", {
//     key: user.accountId,
//     type: ConversationModel.IMConversationEnum.PRIVATE,
//     data
//   });
//   if (isSaveDB) {
//     let saveUserData = [
//       {
//         key: `${user.accountId}#${user.corpId}`,
//         value: user
//       }
//     ];
//     ipcRenderer.invoke("db-save-data", {
//       db: "contact",
//       data: saveUserData
//     });
//   }
// };

export const SaveNotCorpUser = ({ commit }, user) => {
  commit("SAVENOTCORPUSER", user);
};

// 焦点消息ID
export const SetMsgIDAction = ({ commit, state }, id) => {
  commit("UPMSGID", id);
};

export const LogOutAction = ({ commit }) => {
  commit("RESETSTATE");
};

export const SetNetWorkState = ({ commit }, data) => {
  commit("SETNETWORKSTATE", data);
};

export const SetCorpId = ({ commit }, data) => {
  // 设置选中公司id
  commit("SETCORPID", data);
};

export const SetNotifyList = ({ commit }, data) => {
  // 设置通知列表数据
  commit("SetNotifyList", data);
};

export const SetNotifyUnRead = ({ commit }, data) => {
  // 设置通知列表数据
  commit("SetNotifyUnRead", data);
};

export const SetMainWinVisible = ({ commit }, data) => {
  // 更新主窗口可见性
  commit("WINVISIBLE", data);
};

export const SetActiveNotifyApp = ({ commit }, app) => {
  // 设置选中的通知应用
  commit("CommitActiveNotifyApp", app);
};

export const SetMailUnReadCount = ({ commit }, data) => {
  // 设置智邮角标
  commit("UpdataMailUnReadCount", data);
};

export const SetActionCenterUnread = ({ commit }, data) => {
  // 设置行动中心角标
  commit("UpdataActionCenterUnread", data);
};

export const SetExtCorpInfo = ({ commit }, data) => {
  commit("SetExtCorpInfo", data);
};
