/**
 * websocket 推送数据处理
 */
import PushNotice from "./push-notice-queue";
import { machineIdSync } from "node-machine-id";
import {
  PollingReadState,
  PollingNotify,
  PollingOutSideNotify,
} from "../polling-notice";
import servers from "../../service";
const deviceId = machineIdSync();
const pollingTimeout = {
  notify: null,
  contact: null,
  myInfo: null,
  contactAndMyInfo: null,
};
const notifyMap = new Map();

function disposeNotifyHandle(publishTime, data) {
  const { appId, appName, corpId, extra, id, type, extraJson } = data;
  let loginTime = sessionStorage.getItem("login-time"); // 获取登陆时间
  let publishTimestamp = new Date(publishTime).getTime();
  if (publishTimestamp < loginTime) {
    // 未登录期间推送通知
    const netType = sessionStorage.getItem("net_type");
    const action = netType == 1 ? PollingOutSideNotify : PollingNotify;

    if (notifyMap.get("length") === 100 && notifyMap.get("time")) {
      action.triggerPolling(notifyMap.get("time"));
      notifyMap.clear();
    }

    let tempTimestamp = notifyMap.has("time")
      ? notifyMap.get("time")
      : publishTimestamp; // 存储时间戳

    if (publishTimestamp < tempTimestamp) {
      tempTimestamp = publishTimestamp;
    }
    notifyMap.set("time", tempTimestamp);
    notifyMap.set("length", (notifyMap.get("length") || 0) + 1);
    console.log(notifyMap.get("length"));
    clearTimeout(pollingTimeout.notify);
    pollingTimeout.notify = setTimeout(() => {
      const timestamp = notifyMap.get("time");

      console.log("timestamp: ", timestamp);
      // 以最古老一条推送时间戳请求未读数据

      action.triggerPolling(timestamp);

      notifyMap.clear();
    }, 3000);
  } else {
    console.log("notice dispose");
    try {
      if (extraJson.remindType === "NUM") {
        // number类型通知进行推送
        PushNotice.push(extraJson, data);
      }
    } catch (error) {
      console.error(error);
    }
    window.eventHub.$emit("refreshNotice", { isOnlyGet: true });
  }
}

export default function WSPushDispose(data) {
  console.log("WSPushDispose: ", data.payloadJson);
  if (!data || !data.payloadJson) {
    return;
  }
  const { payloadJson, publishTime } = data;
  const { appId, appName, corpId, extra, id, type } = payloadJson;
  if (typeof extra === "string") {
    try {
      payloadJson.extraJson = JSON.parse(extra);
    } catch (error) {}
  } else {
    payloadJson.extraJson = extra || {};
  }
  payloadJson.extraJson.appName = payloadJson.extraJson.appName || appName;
  const loginTime = sessionStorage.getItem("login-time");
  const publishTimestamp = new Date(publishTime).getTime();
  switch (type) {
    case 1: // 通知
      disposeNotifyHandle(publishTime, payloadJson);
      break;
    case 2: // 人员/组织架构变化
      if (publishTimestamp >= loginTime) {
        // 推送消息时间大于当前登录时间才做处理
        clearTimeout(pollingTimeout.contact);
        pollingTimeout.contact = setTimeout(() => {
          const netType = sessionStorage.getItem("net_type");
          if (netType == 1) {
            servers.getChangeResultData();
          } else {
            servers.getListIuUser();
          }
        }, 5000);
      }
      break;
    case 3: // 订阅人数据
      break;
    case 4: // 订阅信息数据
      break;

    case 5: // 通知数变化
      if (publishTimestamp >= loginTime) {
        // 推送消息时间大于当前登录时间才做处理
        window.eventHub.$emit("refreshNotice", { isOnlyGet: true });
        PollingReadState.triggerPolling();
      }
      break;
    case 6: // 微应用角标变化, 微应用内部推送
      break;

    case 10:
      /**
       * @description 关联企业变化
       * @date 2021/4/13
       * @lastmodify 取消类型判断，更新个人信息和增量更新同时出发
       */
      // if (payloadJson.extraJson && payloadJson.extraJson.extraType) {
      // if (
      //   payloadJson.extraJson.extraType == 1 ||
      //   payloadJson.extraJson.extraType == 2 ||
      //   payloadJson.extraJson.extraType == 4
      // ) {
      // 关联企业关系建立、解除
      clearTimeout(pollingTimeout.contactAndMyInfo);
      pollingTimeout.contactAndMyInfo = setTimeout(() => {
        servers.getUserInfo();
        // 关联企业人员变动
        // servers.getListIuUser();
        const netType = sessionStorage.getItem("net_type");
        if (netType == 1) {
          servers.getChangeResultData();
        } else {
          servers.getListIuUser();
        }
      }, 5000);
      // } else if (payloadJson.extraJson.extraType == 3) {
      // 关联企业人员变动
      // clearTimeout(pollingTimeout.contact);
      // servers.getListIuUser();
      // pollingTimeout.contact = setTimeout(() => {
      //   servers.getListIuUser();
      // }, 5000);
      //   }
      // }
      break;
    case 8:
      // 智邮消息推送
      if (publishTimestamp >= loginTime) {
        // 推送消息时间大于当前登录时间才做处理
        const pushEvent = new CustomEvent("dispath-app-push", {
          detail: payloadJson,
        });
        window.dispatchEvent(pushEvent);
      }
      break;
    case 13:
      if (
        payloadJson.extraJson &&
        payloadJson.extraJson.pcOutType &&
        ["1", "2"].includes(`${payloadJson.extraJson.pcOutType}`)
      ) {
        let loginTime = sessionStorage.getItem("login-time");
        let outTime = payloadJson.extraJson.outTime;
        if (outTime && new Date(outTime).valueOf() > loginTime) {
          // 退出登录时间>登录时间才进行退出操作
          if (
            payloadJson.extraJson.deviceId &&
            payloadJson.extraJson.deviceId == deviceId
          ) {
            window.eventHub.$emit("logout");
            const logoutEvent = new CustomEvent("dispath-logout", {
              detail: payloadJson.extraJson,
            });
            window.dispatchEvent(logoutEvent);
          }
        }
      }
      break;

    default:
      break;
  }
}
