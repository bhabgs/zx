import Vue from "vue";
import { ipcRenderer } from "electron";

export default {
  // 置顶会话、会话免打扰
  setSessionTopAndDisturb({
    accountId,
    beId,
    objectType,
    onOff,
    operateType
  } = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/session/setSessionTopAndDisturb`,
        {
          accountId,
          beId,
          objectType,
          onOff,
          operateType
        }
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 创建收纳组
  createStorage({ name = "", belongSubgroup, sessionList = [] } = {}) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/storage/create`, {
        name,
        belongSubgroup,
        sessionList
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "createStorage",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 删除收纳组
  deleteStorage({ storageIdList = [] } = {}) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/storage/delete`, {
        storageIdList
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "deleteStorage",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 編輯收纳组
  editStorage({ name, storageId } = {}) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/storage/edit`, {
        name,
        storageId
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "editStorage",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 增量获取会话信息
  getTopAndDisturbList({ startTime }) {
    return Vue.prototype.$http
      .get(`${Vue.prototype.$apipath.chatPath}/storage/getTopAndDisturbList`, {
        params: {
          startTime
        }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          // 存下收纳组更新时间对比回话时间以判断是否需要根据回话更新
          sessionStorage.setItem("storageUpdateTime", response.data.ctime);
          const data = response.data.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "getTopAndDisturbList",
            data: response.data,
            input: { startTime }
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 加入收纳组
  joinStorage(data) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/storage/joinStorage`, data)
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "joinStorage",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 移出收纳组
  quitStorage(data) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/storage/quitStorage`, data)
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "quitStorage",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 设置收纳组免打扰
  setStorageDisturb({ isDisturb = "", storageId } = {}) {
    return Vue.prototype.$http
      .get(`${Vue.prototype.$apipath.chatPath}/storage/setStorageDisturb`, {
        params: {
          isDisturb,
          storageId
        }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "setStorageDisturb",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 置顶收纳组
  setStorageTop({ isTop, storageId } = {}) {
    return Vue.prototype.$http
      .get(`${Vue.prototype.$apipath.chatPath}/storage/setStorageTop`, {
        params: {
          isTop,
          storageId
        }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          ipcRenderer.invoke("sqlite-url", {
            key: "setStorageTop",
            data: response.data
          });
          return data;
        } else {
          this.$Message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
