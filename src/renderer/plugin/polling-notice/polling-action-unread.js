
import NoticeServer from "../../service/notice";
import axios from "axios";
import store from "../../store";

const { getActionCenterAllUnread } = NoticeServer;

let pollingTimeout = null; // 定时器实例
let cancelToken = null;

export default class PollingActionUnRead {
  constructor() {}

  /**
   * 仅触发一次轮询
   */
  static setupPolling(msg) {
    pollingActionUnread(msg);
  }

  /**
   * 启动轮询
   */
  static startPolling() {
    cancelToken && cancelToken.cancel("stop");
    clearTimeout(pollingTimeout);
    pollingActionUnread();
    // 定时器
    pollingTimeout = setTimeout(() => {
      pollingActionUnread();
    }, 30000);
    PollingActionUnRead.isPolling = true;
  }

  /**
   * 停止轮询
   */
  static stopPolling() {
    cancelToken && cancelToken.cancel("stop");
    clearTimeout(pollingTimeout);
    PollingActionUnRead.isPolling = false;
  }

  /**
   * 触发一次查询 (正在轮询时)
   */
  static triggerPolling(timestamp) {
    if (PollingActionUnRead.isPolling) {
      clearTimeout(pollingTimeout);
      pollingActionUnread();
      // 定时器
      pollingTimeout = setTimeout(() => {
        pollingActionUnread();
      }, 30000);
    }
  }
}

PollingActionUnRead.isPolling = false;

async function pollingActionUnread(cmdMsg) {
  cancelToken && cancelToken.cancel();
  cancelToken = axios.CancelToken.source();
  try {
    const result = await getActionCenterAllUnread({
      cancelToken: cancelToken.token
    });
    if (result && result.code === "M0000" && result.data) {
      const list = (result.data.actionCornerMarkList || []).map(item => {
        let node = { ...item };
        node.actionUpdateTime = new Date(item.unreadUpdateAt).getTime();
        return node;
      });
      const data = { ...result.data, actionCornerMarkList: [...list] };
      store.dispatch("SetActionCenterUnread", data);
      // 通知iframe刷新列表页
      window.eventHub.$emit("refreshActionList", cmdMsg);
    }
  } catch (error) {
    console.error(error);
  }
}
