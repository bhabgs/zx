import Vue from "vue";

export default {
  saveClientId({ clientId, corpId, accountId, source = "PC" } = {}) {
    // 保存设备ID
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.push}/device/websocket/save`, {
        clientId,
        corpId,
        accountId,
        source
      })
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      })
      .catch(error => {
        /* let msg = "设备ID保存失败";
        if (error && error.msg) {
          msg = error.msg;
        }
        Vue.prototype.$message.error(msg);
        */
        return Promise.reject(error);
      });
  }
};
