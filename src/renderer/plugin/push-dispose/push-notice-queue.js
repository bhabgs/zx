/**
 * 推送固定通知强提醒处理
 */

import { ipcRenderer } from "electron";
const remote = require('@electron/remote'); 
import Vue from "vue";
import store from "@/store";
import { PollingReadState } from "../polling-notice";
import AudioNotify from "../audio-notify";
import NoticeServer from "../../service/notice";

const { getNotificationWithRead } = NoticeServer;

const NoticeMap = new Map();
let activeWin = null; // 保存打开窗口实例

function openNoticeUrl(url, corpId) {
  const app = Vue.prototype;
  const data = {
    corpId
  };
  app.$service.getUserCode.call(app, data).then(res => {
    const userCode = res.data;
    if (url.includes("userCode=_userCode")) {
      url = url.replace("_userCode", userCode);
    } else if (url.includes("?")) {
      url = `${url}&userCode=${userCode}`;
    } else {
      url = `${url}?userCode=${userCode}`;
    }

    url += `&corpId=${corpId}&netType=${app.net_type || 1}&clientType=${
      app.$apipath.clientType
    }`;
    activeWin && activeWin.close(); // 关闭前一个打开窗口，解决大量占用内存资源
    activeWin = window.open(url);
  });
}

export default class PushNotice {
  /**
   * 通知推送固定弹框初始化
   */
  static init() {
    // 启动状态查询轮询
    PollingReadState.startPulling(() => {
      const ids = [];
      NoticeMap.forEach(notify => {
        ids.push(notify.id);
      });
      return ids;
    });
  }

  /**
   * 展示通知
   * @param {*} notice
   */
  static push(notice, originData) {
    const key = notice.id;
    if (!NoticeMap.has(key)) {
      AudioNotify.play();
      NoticeMap.set(key, notice);
      const properties = notice.properties || {}; // 扩展数据
      let badge = properties.badge; // 标签
      let tags = null;
      try {
        if (typeof badge === "string") {
          // 如果为string尝试作为json字符串解析
          badge = JSON.parse(badge);
        }
        if (Array.isArray(badge)) {
          // 如果是数组进行赋值
          tags = badge;
        }
      } catch (error) {
        // json 解析失败
      }
      ipcRenderer
        .invoke("top-notice", "show", {
          id: notice.id,
          title: properties.appName || notice.appName || "",
          content: {
            title: notice.title,
            text: notice.content,
            tags
          }
        })
        .then(({ type }) => {
          if (type === "check") {
            // 立即查看处理
            const netType = sessionStorage.getItem("net_type");
            let url = properties.pcUrl || properties.url;
            if (netType === "2") {
              url = properties.innerUrl || url;
            }
            getNotificationWithRead(notice.id, notice.corpId).finally(() => {
              window.eventHub.$emit("refreshNotice", { isOnlyGet: true });
            });
            if (url) {
              // 存在URL，独立窗口打开
              openNoticeUrl(url, notice.corpId);
            } else {
              // 无URL，打开智信并定位到通知
              remote.getCurrentWindow().show();
              const evt = new CustomEvent("show-notify", {
                bubbles: true,
                cancelable: false,
                detail: {
                  appId: originData.appId, 
                  notificationType: originData.type
                }
              });
              window.dispatchEvent(evt);
            }
          }
        })
        .catch(e => {
          // 忽略，不做处理
          console.error(e);
        })
        .finally(() => {
          // 清理处理过的通知
          NoticeMap.delete(key);
        });
    }
  }

  /**
   * 重置推送
   */
  static reset() {
    NoticeMap.clear();
  }
}
