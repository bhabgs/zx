/*
 * @Author: lixiaowei
 * @Date: 2020-11-24 17:00:29
 * @LastEditors: lixiaowei
 * @LastEditTime: 2020-11-25 15:41:22
 * @Description: file content
 * @FilePath: /zx-client-pc/src/renderer/service/corp.js
 */
import Vue from "vue";
import store from "@/store";

export default {
  /**
   *
   * @param {object} data 参数，必传，包含corpId--公司Id，adspaceCode--
   * @param {object} config 配置，非必传
   */
  getCorpExtInfo(
    { corpId, adspaceCode = "pczhixin_workbench_banner" },
    config = {}
  ) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(
        `${$apipath.contactPath}/corp/getCorpExtInfo`,
        { corpId, adspaceCode },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          store.dispatch("SetExtCorpInfo", { corpId, info: data });
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
