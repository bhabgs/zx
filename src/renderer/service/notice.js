import Vue from "vue";
import store from "../store";

export default {
  /**
   * 增量查询未读通知
   * @param {*} param0
   */
  pollingNoticeServer(
    { firstNotifyTime, readStatus = false } = {},
    config = {}
  ) {
    const { accountId, corpId } = store.getters.GetCompany;
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.notify}/notification/list`,
        {
          corpId,
          accountId,
          firstNotifyTime,
          readStatus,
        },
        config
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
  /**
   * 根据通知Id查询状态
   * @param {*} param0
   */
  pollingReadStatusServer({ ids } = {}, config = {}) {
    const { accountId, corpId } = store.getters.GetCompany;
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.notify}/notification/readStatus`,
        {
          accountId,
          ids,
        },
        config
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
  getNotificationWithRead(id, corpId) {
    return Vue.prototype.$http
      .get(`${Vue.prototype.$apipath.notify}/notification/${id}`, {
        headers: {
          corpId,
        },
      })
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
  /**
   * 增量查询未读通知
   * @param {*} firstNotifyTime
   * @param {*} type 推送类型，1--通知推送
   * @param {*} param0
   */
  pollingOutSideNoticeServer({ firstNotifyTime, type = 1 } = {}, config = {}) {
    const { accountId, corpId } = store.getters.GetCompany;
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.push}/push/log`,
        {
          accountId,
          startTime: firstNotifyTime,
          type,
        },
        config
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
  /**
   * 查询智邮未读总数
   * @param {*} param0
   */
  pollingMailUnReadCount(config = {}) {
    const { corpId, id: userId } = store.getters.GetCompany;
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.mail}/messageUnReadCount/getAllUnreadTotal`,
        { corpId, userId },
        {
          ...config,
        }
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
  /**
   * 查询行动中心未读总数
   */
  getActionCenterAllUnread(data = {}, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.actionCenter}/actionUnreadDetail/cornerMarkList`,
        { sourceType: 1, ...data },
        { ...config, }
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
  /**
   * 总角标和智信群聊私聊角标
   */
  getActionCenterSourceUnread(data = {}, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.actionCenter}/actionUnreadDetail/cornerMarkTotal`,
        { sourceType: 1, ...data },
        { ...config, }
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      });
  },
};
