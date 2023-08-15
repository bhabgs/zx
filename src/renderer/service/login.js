import { IMSDKServer } from "../WebIM";
import Vue from "vue";
import store from "@/store";
import { ipcRenderer } from "electron";
import jsencrypt from "jsencrypt";
import os, { platform } from "os";
const exec = require("child_process").exec;

import { dbkey } from "../../config";
import { privateKey, pubKey } from "../plugin/login-crypto";
import { machineIdSync } from "node-machine-id";
import { execSync } from "child_process";

const deviceId = machineIdSync();

function getIpAddress() {
  var ifaces = os.networkInterfaces();
  for (var dev in ifaces) {
    let iface = ifaces[dev];
    for (let i = 0; i < iface.length; i++) {
      let { family, address, internal } = iface[i];

      if (family === "IPv4" && address !== "127.0.0.1" && !internal) {
        return address;
      }
    }
  }
}
function getDeviceType() {
  let result = `${os.version()} ${os.arch()}`;
  if (platform() == "darwin") {
    // mac
    const systeminfo = execSync("system_profiler SPHardwareDataType", {
      encoding: "utf8",
    });
    console.log("system-menu", systeminfo);
    let osName = systeminfo
      .split("\n")
      .find((item) => item.toLowerCase().includes("name"));
    if (osName) {
      result = osName.split(":")[1].trim();
    }
  }
  return result;
}
async function getLocateByIp() {
  try {
    const res = await ipcRenderer.invoke("get-current-locate");
    if (res) {
      return res;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}
export default {
  async logout() {
    const { $service } = Vue.prototype;
    const token = ipcRenderer.sendSync("get-token", 1);
    if (token) {
      try {
        await $service.removeToken();
      } catch (error) {}
    }
    IMSDKServer.logout();
  },
  getUserInfo(config = {}) {
    const { $http, $apipath } = Vue.prototype;
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    const url =
      net_type == 1
        ? `${$apipath.contactPath}/orInv/contactV2/get_my_info_organization`
        : `${$apipath.contactPath}/account/get_my_info_organization`;
    return $http
      .get(url, config)
      .then((response) => {
        if (response.data.code === "M0000") {
          store.dispatch("SaveUserInfo", { info: response.data.data });
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  async getUserInfoByLogin(config = {}) {
    // const locateInfo = (await getLocateByIp()) || null;
    const locateInfo = {
        address: "未知",
        ip: "未知"
    }
    let currentIp = "";
    let city = "未知";
    if (locateInfo) {
      currentIp = locateInfo.ip;
      const cityList = locateInfo.address.split(" ");
      if (cityList && cityList.length) {
        city = cityList.filter((item) => !!item).at(2) || "";
      }
    } else {
      currentIp = getIpAddress();
    }
    const deviceCode = getDeviceType();
    const { $http, $apipath } = Vue.prototype;
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    const url =
      net_type == 1
        ? `${$apipath.contactPath}/orInv/contactV2/get_my_info_organization_login`
        : `${$apipath.contactPath}/account/get_my_info_organization`;
    return $http
      .post(
        url,
        {
          clientType: "pc",
          deviceCode,
          deviceId,
          deviceName: os.userInfo().username || os.hostname(),
          location: city,
          loginIp: currentIp,
        },
        config
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          store.dispatch("SaveUserInfo", { info: response.data.data });
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  loginByPwd(username, password) {
    let data = new FormData();
    data.append("username", username);

    const encrypt = new jsencrypt();
    encrypt.setPublicKey(pubKey);

    let encryptPWD = encrypt.encrypt(password);
    data.append("password", encryptPWD);

    data.append("deviceId", deviceId);

    return this.$http
      .post(`${this.$apipath.auth}/authentication/form`, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${window.btoa("webapp:webapp")}`,
        },
      })
      .then((response) => {
        if (response.data.code === "M0000") {
          ipcRenderer.send("save-token", {
            type: 1,
            token: response.data.data["access_token"],
          });
          ipcRenderer.send("save-token", {
            type: 2,
            token: response.data.data["refresh_token"],
          });
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  async getCorpAllUser({
    corpId,
    pageNum = 1,
    pageSize = 20000,
    corpType,
    allPeople = [],
  }) {
    let userResult = await this.$service.getCompanyUsers.call(this, {
      corpId,
      pageNum,
      pageSize,
      corpType,
    });
    if (pageNum === 1) {
      try {
        Vue.prototype.sqlite_update_time.account[corpId] =
          userResult.ctime || Date.now();
      } catch (err) {}

      // ipcRenderer.invoke("db-save-data", {
      //   db: "base",
      //   data: {
      //     key: dbkey.corpUserTimestamp(corpId),
      //     value: userResult.ctime || Date.now()
      //   }
      // });
    }
    if (userResult && userResult.data) {
      let data = userResult.data;
      if (data.list.length === pageSize) {
        allPeople = allPeople.concat(data.list);
        let nextResult = await this.$service.getCorpAllUser.call(this, {
          corpId,
          pageNum: ++data.pageNum,
          allPeople,
          corpType,
        });
        return nextResult;
      } else {
        allPeople = allPeople.concat(data.list);
        return allPeople;
      }
    }
  },
  async getGroup({ pageNum = 1, accountId, allGroup = [] }) {
    let groupResult = await this.$service.groupListApi.call(this, {
      accountId,
      pageNum,
      pageSize: 100,
    });
    if (groupResult) {
      store.dispatch("PushGroup", groupResult.resultList);
      allGroup = allGroup.concat(groupResult.resultList);
      if (groupResult.pageConfig && groupResult.pageConfig.pages > pageNum) {
        let nextResult = await this.$service.getGroup.call(this, {
          pageNum: pageNum + 1,
          accountId,
          allGroup,
        });
        return nextResult;
      } else {
        return allGroup;
      }
    }
  },
  async getGroupVo({ pageNum = 1, accountId, updateTime, allGroup = [] }) {
    let groupResult = await this.$service.groupListApiVo.call(this, {
      accountId,
      pageNum,
      pageSize: 100,
      updateTime,
    });

    if (groupResult) {
      store.dispatch("PushGroup", groupResult.resultList);
      if (groupResult.pageConfig && groupResult.pageConfig.pages > pageNum) {
        let nextResult = await this.$service.getGroupVo.call(this, {
          pageNum: pageNum + 1,
          accountId,
          updateTime,
          allGroup,
        });
        return nextResult;
      } else {
        allGroup = allGroup.concat(groupResult.resultList);
        return allGroup;
      }
    }
  },
  async getStorage({ startTime = 0 }) {
    let storageResult = await this.$service.getTopAndDisturbList.call(this, {
      startTime,
    });
    if (storageResult) {
      if (startTime) {
        let sqliteStorage = await ipcRenderer.invoke("sqlite-query", {
          key: "getAllStorage",
        });
        let sqliteSession = await ipcRenderer.invoke("sqlite-query", {
          key: "getAllStorageSession",
        });
        let newStorage = {
          sessionList: storageResult.sessionList.concat(sqliteSession),
          storageList: storageResult.storageList.concat(sqliteStorage),
        };
        store.dispatch("updateStorage", newStorage);
      } else {
        store.dispatch("updateStorage", storageResult);
      }
    }
    return storageResult;
  },
  // 清理token
  removeToken() {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(`${$apipath.auth}/oauth/removeToken`)
      .then((response) => {
        if (response.data.code === "M0000") {
          ipcRenderer.send("del-token", { type: 3 });
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  getAllSecret() {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .get(`${$apipath.oss}/secret`)
      .then((response) => {
        if (response.data.code === "M0000") {
          const encrypt = new jsencrypt();
          encrypt.setPrivateKey(privateKey);

          let secrets = (response.data.data || []).map((item) => {
            item.decode = encrypt.decrypt(item.key);
            return item;
          });
          return ipcRenderer.invoke("save-secret", secrets);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  getSecretByUUID(uuid) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .get(`${$apipath.oss}/secret/${uuid}`)
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data;
          if (data && data.uuid) {
            const encrypt = new jsencrypt();
            encrypt.setPrivateKey(privateKey);

            data.decode = encrypt.decrypt(data.key);
            return ipcRenderer.invoke("save-secret", [data]);
          }
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  //获取默认登录设置
  getLoginDefaultSetting() {
    return Vue.prototype.$http
      .get(`/contact/noauth/v1/corp/loginSetting/clientGetDefaultSettings`)
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  //获取客户端登录设置
  getLoginClientSetting(corpId) {
    return Vue.prototype.$http
      .get(
        `${Vue.prototype.$apipath.contactPath}/corp/loginSetting/clientGetSettings?corpId=${corpId}`
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  getAllLoginClientSetting() {
    return Vue.prototype.$http
      .get(
        `${Vue.prototype.$apipath.contactPath}/corp/loginSetting/clientGetSettingsForCorps `
      )
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  // 获取登录类型
  getLoginType(qrFlag = undefined) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(`/auth/zxScanCode/deviceRequest`, {
        deviceId,
        qrFlag: qrFlag != undefined ? `${qrFlag}` : undefined,
        clientType: "pc",
      })
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  // 发送登陆
  sendLogin(authUniqueCode) {
    const { $http, $apipath } = Vue.prototype;
    return $http
      .post(`/auth/zxScanCode/sendLogin`, {
        authUniqueCode,
      })
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  // 轮询获取登录状态
  getAuthentication(authUniqueCode) {
    const { $http } = Vue.prototype;
    let data = new FormData();
    data.append("authUniqueCode", authUniqueCode);
    return $http
      .post(`/auth/authentication/qrcode`, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${window.btoa("webapp:webapp")}`,
        },
      })
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data });
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
  //获取登录的设备记录
  getLoginDeviceLog() {
    return Vue.prototype.$http
      .get(`/auth/mobileAuthEndPoint/getMyDeviceList`)
      .then((response) => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  },
};
