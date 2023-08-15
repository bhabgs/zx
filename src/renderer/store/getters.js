import utils from "../plugin/utils";
import state from "./state";

// 获取用户信息
export const GetUser = (state) => {
  return state.user;
};

export const GetSendUser = (state, getters) => {
  let user = {};
  if (getters.GetCompany) {
    user.id = getters.GetCompany.accountId;
    user.name = getters.GetCompany.name;
    user.avatar = getters.GetUser.avatar;
  }
  return user;
};

export const GetCompany = (state, getters) => {
  const outList = (getters.GetCompanyByRelate.out || []).filter(
    (item) => item.corp && item.corp.canJoin == "1"
  );
  let company = {},
    companyList = (getters.GetDirectlyCompany || []).concat(outList) || [];
  if (companyList && companyList.length) {
    if (state.corpId) {
      company = companyList.find((item) => item.corpId === state.corpId);
    } else {
      company = companyList.find(
        (item) => item.corp.corpTypeEnums === 0 && item.corpId === "6"
      );
    }
    !company && (company = companyList[0] || {});
  } else {
    company = { ...getters.GetUser, accountId: getters.GetUser.id };
  }
  return company;
};

export const GetAllCompany = (state) => {
  const companyList = (state.user && state.user.corpUsers) || [];
  return companyList;
};

/**
 * 根据企业关系拆分企业列表
 * @param {*} state
 */
export const GetCompanyByRelate = (state) => {
  const result = { direct: [], sup: [], sub: [], other: [], out: [] };
  const companyList = (state.user && state.user.corpUsers) || [];
  const netType = sessionStorage.getItem("net_type");
  if (companyList && companyList.length) {
    if (netType == "1") {
      // 外网还是原来处理逻辑
      companyList.forEach((item) => {
        if (item.corp) {
          if (item.corp.corpTypeEnums === 0 && item.corp.canJoin == 0) {
            result.direct.push(item);
          } else if (item.corp.corpAndCorpRelTypeEnums === "UP_CORP") {
            result.sup.push(item);
          } else if (item.corp.corpAndCorpRelTypeEnums === "DWON_CORP") {
            result.sub.push(item);
          } else if (item.corp.corpAndCorpRelTypeEnums === "OTHER") {
            result.other.push(item);
          } else {
            result.out.push(item);
          }
        }
      });
    } else {
      // 内网全部为直属公司
      result.direct = [...companyList];
    }
  }
  return result;
};

/**
 * 获取直属企业
 * @param {*} state
 * @param {*} getters
 */
export const GetDirectlyCompany = (state, getters) => {
  const list = getters.GetCompanyByRelate.direct;
  return list;
};

/**
 * 根据企业Id，获取企业所在类型
 * @param {*} state
 * @param {*} getters
 */
export const GetCorpRelate = (state, getters) => {
  const result = (corpId) => {
    let types = [];
    for (const type in getters.GetCompanyByRelate) {
      const list = getters.GetCompanyByRelate[type] || [];
      const corp = list.find((item) => item.corpId === corpId);
      if (corp) {
        let text =
          type === "other"
            ? "其他"
            : type === "sub"
            ? "下级"
            : type === "sup"
            ? "上级"
            : "";
        types.push({ corp, type, text });
      }
    }
    return types;
  };

  return result;
};

// 获取所有员工
export const GetAllUserMap = (state) => {
  return state.AllUserMap;
};

// 获取所有员工
export const GetAllOrganizationUserIds = (state) => {
  const ids = [];
  const allUsers = state.AllUserMapByCorp;
  for (const key in allUsers) {
    const userAccountId = key.split("#")[0];
    if (
      allUsers[key].type == 0 ||
      allUsers[key].form == 0 ||
      allUsers[key].accountId == state.user.id
    ) {
      // 组织用户
      ids.push(userAccountId);
    }
  }
  return ids;
};
// 获取所有员工
export const GetAllOutsourceUserIds = (state) => {
  const ids = [];
  const allUsers = state.AllUserMapByCorp;
  for (const key in allUsers) {
    const userAccountId = key.split("#")[0];
    // 外联用户
    if (allUsers[key].type == 1 || allUsers[key].form == 1) {
      ids.push(userAccountId);
    }
  }
  return ids;
};

// 获取所有员工分公司
export const GetAllUserMapByCorp = (state) => {
  return state.AllUserMapByCorp;
};

export const GetUserByAcountIdCorp = (state) =>
  function (accountId) {
    let time = performance.now();
    let keys = Object.keys(state.AllUserMapByCorp);
    keys = keys.filter((key) => key.split("#")[0] === accountId);
    let userInfo = [];
    userInfo = keys.map((key) => state.AllUserMapByCorp[key]);
    return userInfo;
  };

export const GetNotCorpUsers = (state) => {
  return state.NotCorpUser;
};

// 获取焦点消息ID
export const GetMsgFocusID = (state) => {
  return state.MsgFocusID;
};

export const GetNetWorkState = (state) => {
  return state.NetWorkState;
};

export const GetNotifyList = (state) => {
  return state.NotifyList || [];
};

export const GetMainWinVisible = (state) => {
  return state.MainWinVisible;
};

export const GetNotifyUnReadCount = (state, getters) => {
  return (
    state.NotifyUnRead || {
      total: 0,
      hintType: "",
      numberTotal: 0,
      numberType: "",
    }
  );
};

export const GetActiveNotifyApp = (state) => {
  return state.ActiveNotifyApp || {};
};

// 获取智邮未读数据
export const GetMailUnReadCount = (state) => {
  return state.MailUnReadCount;
};

// 行动中心未读数据
export const GetActionCenterUnread = (state) => {
  return state.ActionCenterUnread;
};

export const GetExtCorpInfo = (state, getters) => {
  const corpId = getters.GetCompany.corpId;
  let data = state.ExtCorpInfo[corpId] || {};

  return data;
};
