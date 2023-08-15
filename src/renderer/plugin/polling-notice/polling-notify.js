/**
 * 通知增量轮询
 */

import NoticeServer from "../../service/notice";
import { PushNotice } from "../push-dispose";
import axios from "axios";

const { pollingNoticeServer } = NoticeServer;

let pollingTimeout = null; // 定时器实例
let pollTimestamp = null; // 增量轮训的时间戳
let cancelToken = null;
export default class PollingNotify {
  constructor() {}

  /**
   * 启动轮询
   * @param {*} timestamp
   */
  static startPulling(timestamp) {
    pollTimestamp = timestamp;
    pollingHandle();
    PushNotice.init();
  }

  /**
   * 停止轮询
   */
  static stopPulling() {
    cancelToken && cancelToken.cancel("stop");
    clearTimeout(pollingTimeout);
  }

  /**
   * 触发一次查询
   */
  static triggerPolling(timestamp = pollTimestamp) {
    clearTimeout(pollingTimeout);
    pollingHandle(timestamp);
  }
}

/**
 * 通知增量查询
 */
function pollingHandle(timestamp = pollTimestamp) {
  cancelToken && cancelToken.cancel();
  cancelToken = axios.CancelToken.source();
  clearTimeout(pollingTimeout);

  pollingNoticeServer(
    { firstNotifyTime: timestamp },
    { cancelToken: cancelToken.token }
  )
    .then(result => {
      pollTimestamp = result.ctime;
      if (result.data && result.data.list.length) {
        result.data.list.reverse().forEach(item => {
          PushNotice.push(item, result);
        });
      }
    })
    .finally(() => {
      clearTimeout(pollingTimeout);
      pollingTimeout = setTimeout(() => {
        pollingHandle();
      }, 10000);
    });
}
