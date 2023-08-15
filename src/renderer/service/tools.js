import Vue from "vue";
import OSS from "ali-oss";
import { dialog, ipcRenderer, shell, ipcMain } from "electron";
const remote = require('@electron/remote');

import semver from "semver";
import { appendUrlParams } from "../../lib/utils";

import store from "../store";

import { Util } from "@/plugin";
import fs from "fs";

const zxLogo = require("../assets/image/login/logo.png");

let IgnoreUpdate = false;

// 用来做oss临时账号过期测试，勿删
/* let OssSts = {
  expiration: "111111",
  accessKeyId: "STS.NJLCci1JvpAQDZMBCJapmxs2q",
  accessKeySecret: "83e8xGceKT31vVrwEg1g99SU5pvfsGQnKj4UzmJgaV9V",
  securityToken:
    "CAIS9gF1q6Ft5B2yfSjIr4n5CNnd3JVXx4O6Rnz8pkMfbf9Bl7aZkzz2IHFFe3RvAO4ds/o/mmpT7/sclqxhW9pEQBQ01gz+E9EFnzm6aq/t5uaHj9Vd+qDHdEGXDxnkpriwB8zyUNLafNq0dlnAjVUd6LDmdDKkLTPHXJqSkswlFJd1ODO1dj1bHtxbCxJ/ocsBTxvrOO2qLwThjxi3bi9hsREujnhku+btgJ/eyGKH0AGqkbVN+tutc8n/MpA1BvolDYfpht4RX7HazStd5yJN8KpLl6Fe8V/FxIrMUgYMvEzYaLeKooM1d1YkOLJQCb5UI3gGNkO3G4YagAG0aECbwvHPRW87kKW6fN3omv60+kAcXJKqB0gjX0kesCm+fEur2hcpqr+1sJhJ6diRXRvNyi4HP/QkGW2SuZL4l7leXigCpzCYL9+4N3/nIwMUIr+4gJ81mRc5qd8nJEylDlwyjP7wJPNMO+o9yTjumkFONkQR94VwXoYazIRUCA==",
  requestId: ""
}; */

let OssSts = {
  expiration: "",
  accessKeyId: "",
  accessKeySecret: "",
  securityToken: "",
  requestId: "",
  secure: true
};

let flag = 0;

export default {
  getUserCode({ appId, corpId }) {
    // 获取userCode
    return this.$http
      .get(`${this.$apipath.auth}/oauth/getAuthCode`, {
        params: {
          appId,
          corpId
        }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      })
      .catch(error => {
        let msg = "用户授权失败";
        if (error && error.msg) {
          msg = error.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  /**
   * 获取用户可见App列表
   * @param {*} type  1-查询开页面为应用;2-查询通知列表微应用
   * @param {*} name  搜索关键字
   * @param {*} filterNull  是否过滤URL为空的
   * @param {*} config
   */
  getAllMicroApp(
    {
      corpId,
      userId,
      type = 1,
      name = undefined,
      version = "v3",
      filterNull = true,
      isShowErr = true // 是否显示错误信息
    },
    config = {}
  ) {
    // 获取微应用列表
    return this.$http
      .get(`${this.$apipath.micro_app}/micro_app/list_enable_apps`, {
        params: {
          corpId,
          userId,
          type,
          name,
          version
        },
        ...config
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const netType = sessionStorage.getItem("net_type"); // 登陆方式，1-外网登陆，2-内网登陆
          let appList = response.data.data || [];

          appList = appList.map(item => {
            const app = { ...item };
            if (netType == 2) {
              // 针对内网做路径处理
              const extendData = item.corpAppExtend || {};
              app.pcHomePageUrl = extendData.pcHomePageUrlExtend;
              app.logo = extendData.logoExtend;
              app.notificationUrl = extendData.notificationUrlExtend;
              app.notificationLogo = extendData.notificationLogoExtend;
            }
            app.logo = app.logo || zxLogo;
            app.notificationLogo = app.notificationLogo || zxLogo;
            return app;
          });

          if (filterNull) {
            // 过滤路径为空的应用
            appList = appList.filter(app =>
              type === 1 ? app.pcHomePageUrl : app.notificationUrl
            );
          }
          response.data.data = appList;
          type === 1 &&
            name === undefined &&
            store.dispatch("SetMicroApps", response.data.data);
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      })
      .catch(error => {
        let msg = "获取数据失败";
        if (error && error.msg) {
          msg = error.msg;
        }
        isShowErr && Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  /**
   * 获取用户可见App列表带分类信息
   * @param {*} type  1-查询开页面为应用;2-查询通知列表微应用
   * @param {*} name  搜索关键字
   * @param {*} filterNull  是否过滤URL为空的
   * @param {*} config
   */
  getAllMicroAppAndType(
    {
      corpId,
      userId,
      type = 1,
      name = undefined,
      version = "v3",
      filterNull = true
    },
    config = {}
  ) {
    // 获取微应用列表
    return this.$http
      .get(`${this.$apipath.micro_app}/micro_app/list_enable_appsAndType`, {
        params: {
          corpId,
          userId,
          type,
          name,
          version
        },
        ...config
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const netType = sessionStorage.getItem("net_type"); // 登陆方式，1-外网登陆，2-内网登陆
          response.data.data = response.data.data || {};
          let appList = response.data.data.listAppDTO || [];

          appList = appList.map(item => {
            const app = { ...item };
            if (netType == 2) {
              // 针对内网做路径处理
              const extendData = item.corpAppExtend || {};
              app.pcHomePageUrl = extendData.pcHomePageUrlExtend;
              app.logo = extendData.logoExtend;
              app.notificationUrl = extendData.notificationUrlExtend;
              app.notificationLogo = extendData.notificationLogoExtend;
            }
            app.logo = app.logo || zxLogo;
            app.notificationLogo = app.notificationLogo || zxLogo;
            return app;
          });
          if (filterNull) {
            // 过滤路径为空的应用
            appList = appList.filter(app =>
              type === 1 ? app.pcHomePageUrl : app.notificationUrl
            );
          }
          response.data.data.listAppDTO = appList;
          type === 1 &&
            name === undefined &&
            store.dispatch("SetMicroApps", response.data.data);
          return response.data;
        } else {
          return Promise.reject(response.data);
        }
      })
      .catch(error => {
        let msg = "获取数据失败";
        if (error && error.msg) {
          msg = error.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  // 上传图片到oss服务
  ossUpload(formData, config = {}) {
    return this.$http
      .post(
        `${this.$apipath.oss}/image/upload?bucket=2&path=2`,
        formData,
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data.data;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 上传文件到oss服务
  ossUploadFile(formData, config = {}) {
    return this.$http
      .post(`${this.$apipath.oss}/file/upload`, formData, config)
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data.data;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        this.$message.error("上传失败！");
        return Promise.reject(error);
      });
  },
  // 获取OSS的子账号
  getOssSts() {
    return this.$http
      .post(`${this.$apipath.oss}/oss/securityToken`)
      .then(response => {
        if (response.data.code === "M0000") {
          OssSts.expiration = response.data.data.expiration;
          OssSts.accessKeyId = response.data.data.accessKeyId;
          OssSts.accessKeySecret = response.data.data.accessKeySecret;
          OssSts.securityToken = response.data.data.securityToken;
          OssSts.requestId = response.data.data.requestId;
          return response.data.data;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        this.$message.error("上传失败！");
        return Promise.reject(error);
      });
  },
  /**
   * 使用oss SDK签名链接
   * @param {*} param0
   * @param {*} config
   */
  async getSignedUrlByOss({ url, process }, config = {}) {
    /**
     * 为了使用图片旋转，采用oss自签名
     */
    let signUrl = url;
    const { alioss } = Vue.prototype.$apipath;
    if (signUrl.includes(alioss.pubBucket)) {
      return signUrl;
    } else if (signUrl.includes("?")) {
      signUrl = signUrl.substring(0, signUrl.indexOf("?"));
    }
    try {
      const option = {
        region: alioss.region,
        accessKeyId: "",
        accessKeySecret: "",
        stsToken: "",
        bucket: alioss.bucket,
        secure: true
      };
      if (
        !OssSts.expiration ||
        new Date(OssSts.expiration).getTime() - Date.now() < 10 * 60 * 1000
      ) {
        let result = await Vue.prototype.$service.getOssSts.call(Vue.prototype);
      }
      option.accessKeyId = OssSts.accessKeyId;
      option.accessKeySecret = OssSts.accessKeySecret;
      option.stsToken = OssSts.securityToken;
      const client = new OSS(option);

      signUrl = signUrl.substr(signUrl.indexOf("com/") + 3);

      const opt = { expires: 3600 };
      process && (opt.process = process);

      signUrl = client.signatureUrl(signUrl, opt);
    } catch (error) {
      console.error(error);
    }

    return signUrl;
  },
  // 与后台交换携带token的可用链接
  getSignedUrl({ url }, config = {}) {
    return this.$http
      .post(`${this.$apipath.oss}/oss/getSignedUrl`, { url }, config)
      .then(response => {
        if (response.data.code === "M0000") {
          let resultUrl = response.data.data;
          return resultUrl;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // oss直传
  async ossUploadAli(fileData, opt = {}) {
    let { type = "", isPub = false, folder, before } = opt;
    before && before();
    const { $apipath, $service } = Vue.prototype;
    try {
      const bucket = isPub ? $apipath.alioss.pubBucket : $apipath.alioss.bucket;
      folder = folder || $apipath.alioss.folder;

      let option = {
        region: $apipath.alioss.region,
        accessKeyId: "",
        accessKeySecret: "",
        stsToken: "",
        bucket,
        secure: true
      };
      if (
        !OssSts.expiration ||
        new Date(OssSts.expiration).getTime() - Date.now() < 10 * 60 * 1000
      ) {
        let result = await $service.getOssSts.call(Vue.prototype);
      }
      option.accessKeyId = OssSts.accessKeyId;
      option.accessKeySecret = OssSts.accessKeySecret;
      option.stsToken = OssSts.securityToken;

      let client = new OSS(option);
      let uuid = Util.getRandomId();

      type = type || "";
      type = type.indexOf(".") === 0 ? type : "." + type;

      let name = `pc_${uuid}_${Date.now()}${type}`;
      if (typeof fileData === "string") {
        fileData = await fs.promises.readFile(fileData);
      }
      let result = await client.multipartUpload(`${folder}/${name}`, fileData, {
        timeout: 600000,
        mime: type,
        progress: function (percent) {
          if (opt && opt.progress) {
            opt.progress({ percent });
          }
        },
      });
      flag = 0;
      result.bucket = bucket;
      result.folder = folder;
      console.log(result);
      fileData = null;
      if (!result.url) {
        const tmpUrl = result.res.requestUrls[0];
        if (tmpUrl) {
          result.url =
            tmpUrl.indexOf("?") === -1
              ? tmpUrl
              : tmpUrl.substr(0, tmpUrl.indexOf("?"));
        } else {
          result.url = `https://${result.bucket}.${option.region}.aliyuncs.com/${result.name}`;
        }
      }
      return Promise.resolve(result);
    } catch (error) {
      if (
        error &&
        error.code === "InvalidAccessKeyId" &&
        error.status === 403 &&
        flag < 3
      ) {
        ++flag;
        OssSts.expiration = "";
        return $service.ossUploadAli(fileData, {
          ...opt,
          before() {
            fileData = null;
          }
        });
      } else {
        flag = 0;
        return Promise.reject(error);
      }
    }
  },
  getAppVersion(config = {}, isAlert = true) {
    const { $http, $apipath } = Vue.prototype;
    const appInfo = remote.getGlobal("appInfo");
    let result = $http
      .get(`${$apipath.platform}/appVersion/selectZxVersion`, {
        ...config,
        params: {
          type: "zx",
          appType: appInfo.appType
        }
      })
      .then(async response => {
        if (response.data.code === "M0000") {
          let data = response.data.data || [];
          data = data.find(item => item.appType == appInfo.appType);
          if (!isAlert) {
            return data;
          }
          if (data.code) {
            localStorage.setItem("appVersion", data.code);
          }
          if (semver.lt(appInfo.version, data.code)) {
            try {
              let message = "",
                buttons = [];
              let contentList = data.contents || [];
              message = contentList.map(item => item.text).join("\n");
              if (data.whetherUpdate === 1) {
                message = `有新的版本，请更新后进行使用\n\n${message}`;
                buttons = ["确定"];
                // 强更时清除缓存
                let clear = await ipcRenderer.invoke("db-clear-data-all", {});
                localStorage.setItem(
                  "isClearDb",
                  JSON.stringify({ type: "3.0.3", isClear: true })
                );
              } else {
                message = `有新的版本，是否进行更新\n\n${message}`;
                buttons = ["忽略", "确定"];
              }

              if (data.whetherUpdate === 1 || !IgnoreUpdate) {
                ipcRenderer
                  .invoke("open-information-dialog", {
                    type: "info",
                    title: `v${data.code} 版本更新`,
                    message,
                    buttons
                  })
                  .then(async result => {
                    if (buttons[result.index] == "确定") {
                      let url = data.url;
                      ipcRenderer.invoke("upgrade-version", {
                        url,
                        closeOther: data.whetherUpdate === 1
                      });
                    }
                    IgnoreUpdate = true;
                  });
              }
            } catch (error) {}
          }
        } else {
          return Promise.reject(response.data);
        }
      })
      .catch(error => {});
    return result;
  },
  //记录微应用访问次数
  recordMicroApps(data, config = {}) {
    return Vue.prototype.$http
      .post(`/log/appoperation/create`, data, config)
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
