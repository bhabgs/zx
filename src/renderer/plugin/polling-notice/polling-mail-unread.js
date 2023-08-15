/**
 * 通知增量轮询
 */
import NoticeServer from "../../service/notice";
import axios from "axios";
import store from "../../store";

const { pollingMailUnReadCount } = NoticeServer;

let pollingTimeout = null; // 定时器实例
let cancelToken = null;
export default class PollingMailUnRead {
  constructor() {}

  /**
   * 启动轮询
   */
  static startPulling() {
    cancelToken && cancelToken.cancel("stop");
    pollingHandle();
    PollingMailUnRead.isPolling = true;
  }

  /**
   * 停止轮询
   */
  static stopPulling() {
    cancelToken && cancelToken.cancel("stop");
    clearTimeout(pollingTimeout);
    PollingMailUnRead.isPolling = false;
  }

  /**
   * 触发一次查询
   */
  static triggerPolling(timestamp) {
    if (PollingMailUnRead.isPolling) {
      clearTimeout(pollingTimeout);
      pollingHandle();
    }
  }
}

PollingMailUnRead.isPolling = false;

/**
 * 通知增量查询
 */

async function pollingHandle() {
  cancelToken && cancelToken.cancel();
  cancelToken = axios.CancelToken.source();
  clearTimeout(pollingTimeout);
  try {
    const result = await pollingMailUnReadCount({
      cancelToken: cancelToken.token
    });
    if (result && result.code === "M0000") {
      store.dispatch("SetMailUnReadCount", result.data);
    }
  } catch (error) {
    console.error(error);
  }
  clearTimeout(pollingTimeout);
  pollingTimeout = setTimeout(() => {
    pollingHandle();
  }, 30000);
}
