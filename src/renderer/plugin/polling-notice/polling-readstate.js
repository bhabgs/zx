/**
 * 通知增量轮询
 */

import NoticeServer from "../../service/notice";
import { ipcRenderer } from "electron";

const { pollingReadStatusServer } = NoticeServer;

let pollingTimeout = null; // 定时器实例
let getIdsHandle = null; // 获取当前展示弹框通知的Id方法
export default class PollingReadState {
  constructor() {}

  /**
   * 启动轮询
   * @param {*} timestamp
   */
  static startPulling(getIds) {
    getIdsHandle = getIds; // 获取当前展示弹框通知的Id方法
    PollingReadState.pollingHandle();
  }

  /**
   * 停止轮询
   */
  static stopPulling() {
    clearTimeout(pollingTimeout);
  }

  /**
   * 触发一次查询
   */
  static triggerPolling() {
    clearTimeout(pollingTimeout);
    PollingReadState.pollingHandle();
  }

  /**
   * 通知增量查询
   */
  static pollingHandle() {
    clearTimeout(pollingTimeout);
    if (getIdsHandle) {
      const ids = getIdsHandle();
      if (ids.length) {
        pollingReadStatusServer({ ids })
          .then(result => {
            if (result.data && result.data.length) {
              const readIds = [];
              result.data.forEach(item => {
                item.readStatus && readIds.push(item.id); // 筛选出已读的通知Id，进行弹框关闭
              });
              readIds.length &&
                ipcRenderer.invoke("top-notice", "closeIds", readIds);
            }
          })
          .finally(() => {
            clearTimeout(pollingTimeout);
            pollingTimeout = setTimeout(() => {
              PollingReadState.pollingHandle();
            }, 10000);
          });
      } else {
        pollingTimeout = setTimeout(() => {
          PollingReadState.pollingHandle();
        }, 10000);
      }
    }
  }
}
