/**
 * 通知增量轮询
 */
import Server from "../../service";
import axios from "axios";
import store from "../../store";

const pullingTime = 1 * 60 * 60 * 1000; // 轮询间隔1小时

const { getCorpExtInfo } = Server;

let pollingTimeout = null; // 定时器实例
let cancelToken = null;
export default class PollingExtCorpInfo {
  constructor() {}

  /**
   * 启动轮询
   */
  static startPulling() {
    PollingExtCorpInfo.stopPulling();
    pollingHandle();
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
  static triggerPolling(timestamp) {
    clearTimeout(pollingTimeout);
    pollingHandle();
  }
}

/**
 * 通知增量查询
 */

async function pollingHandle() {
  cancelToken && cancelToken.cancel();
  cancelToken = axios.CancelToken.source();
  clearTimeout(pollingTimeout);

  pollingTimeout = setTimeout(async () => {
    try {
      const corpId = store.getters.GetCompany.corpId;
      if (corpId) {
        const result = await getCorpExtInfo(
          { corpId },
          {
            cancelToken: cancelToken.token
          }
        );
      }
    } catch (error) {
      console.error(error);
    }
    pollingHandle();
  }, pullingTime);
}
