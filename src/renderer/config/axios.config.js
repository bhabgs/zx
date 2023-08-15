import axios from "axios";
import { Message } from "element-ui";
import { ipcRenderer } from "electron";
let api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    clientType: process.env.BASE_CLIENT,
    imType: "rc",
    version: "v1",
  },
  timeout: 60000,
});

let IsRefrshToken = false; // 是否正在刷新token
let errorFlag = false; // 判断是否已存在错误提示
const cancelTokenList = []; // 添加取消请求key的列表
const pollingList = new Set(); // token过期后等待刷新token成功后重连的接口列表

document.addEventListener("logout", (e) => {
  cancelTokenList.splice(0, cancelTokenList.length).forEach((source) => {
    try {
      source && source.cancel("logout");
    } catch (error) {}
  });
});

export default (Vue) => {
  const errorMsg = ["O_T_001", "O_T_002", "O_T_003"];
  let currentResponse;
  api.interceptors.request.use(
    (request) => {
      if (!request.cancelToken) {
        let source = axios.CancelToken.source();
        request.cancelToken = source.token;
        cancelTokenList.push(source);
      }
      if (
        request.url.indexOf("/token") === -1 &&
        request.url.indexOf("/app/login") === -1 &&
        request.url.indexOf("/authentication/form") === -1 &&
        request.url.indexOf("/authentication/qrcode") === -1
      ) {
        const token = ipcRenderer.sendSync("get-token", 1);
        token && (request.headers.Authorization = `Bearer ${token}`);
      }
      request.baseURL = Vue.prototype.$apipath.baseURL;
      return request;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      if (response.status === 200 && errorMsg.includes(response.data.code)) {
        const token = ipcRenderer.sendSync("get-token", 1);
        if (response.data.code === "O_T_003" || !token) {
          if (!errorFlag) {
            errorFlag = true;
            let message = response.data.msg || "登录已过期，请重新登录";
            Message.warning({
              message,
              showClose: true,
              center: true,
              duration: 2000,
              onClose() {
                errorFlag = false;
                window.eventHub.$emit("logout");
                IsRefrshToken = false;
                pollingList.forEach((id) => clearInterval(id));
                pollingList.clear();
              },
            });
          }
          return response;
        } else {
          if (!IsRefrshToken) {
            IsRefrshToken = true;
            currentResponse = response;
            return refreshToken().then((res) => {
              if (res) {
                let option = {
                  ...currentResponse.config,
                  baseURL: "",
                };

                if (typeof currentResponse.config.data === "string") {
                  option.data = JSON.parse(currentResponse.config.data);
                }
                IsRefrshToken = false;
                return api(option);
              }
            });
          } else {
            return new Promise((resolve, reject) => {
              let polling = setInterval(() => {
                if (!IsRefrshToken) {
                  clearInterval(polling);
                  pollingList.delete(polling);
                  let option = {
                    ...response.config,
                    baseURL: "",
                  };

                  if (typeof response.config.data === "string") {
                    option.data = JSON.parse(response.config.data);
                  }
                  resolve(api(option));
                }
              }, 10);
              pollingList.add(polling);
            });
          }
        }
      } else {
        return response;
      }
    },
    (error) => {
      console.log("接口失败", error);
      if (axios.isCancel(error) && error.message === "logout") {
      } else if (error.message == "Network Error") {
        Vue.prototype.$message.warning("网络链接失败，请检查您的网络设置");
        return Promise.reject(error);
      } else {
        return Promise.reject(error);
      }
    }
  );
  Vue.prototype.$http = api;
  Vue.prototype.$CancelToken = axios.CancelToken;
  Vue.prototype.$allRequest = axios.all;
  Vue.prototype.$Spread = axios.spread;

  function refreshToken() {
    const refresh_token = ipcRenderer.sendSync("get-token", 2);
    let data = new FormData();
    data.append("refresh_token", refresh_token);
    data.append("grant_type", "refresh_token");
    return api
      .post(`${Vue.prototype.$apipath.auth}/oauth/token`, data, {
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
          return response;
        }
        if (response.data.code === "O_T_003") {
          if (!errorFlag) {
            errorFlag = true;
            Message.warning({
              content: "登录已过期，请重新登录",
              onClose() {
                errorFlag = false;
                window.eventHub.$emit("logout");
              },
            });
          }
        }
      })
      .catch((error) => {
        if (!errorFlag) {
          errorFlag = true;
          Message.warning({
            content: "登录已过期，请重新登录",
            onClose() {
              errorFlag = false;
              window.eventHub.$emit("logout");
            },
          });
        }
      });
  }
};
