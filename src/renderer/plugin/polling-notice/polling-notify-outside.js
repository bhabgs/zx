/**
 * 通知增量轮询
 */
import { ipcRenderer } from "electron";
import NoticeServer from "../../service/notice";
import { PushNotice } from "../push-dispose";
import axios from "axios";

const { pollingOutSideNoticeServer, pollingReadStatusServer } = NoticeServer;

let pollingTimeout = null; // 定时器实例
let pollTimestamp = null; // 增量轮训的时间戳
let cancelToken = null;
export default class PollingOutSideNotify {
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
  static triggerPolling(timestamp) {
    clearTimeout(pollingTimeout);
    pollingHandle(timestamp);
  }
}

/**
 * 通知增量查询
 */

async function pollingHandle(timestamp = pollTimestamp) {
  cancelToken && cancelToken.cancel();
  cancelToken = axios.CancelToken.source();
  clearTimeout(pollingTimeout);
  try {
    pollTimestamp = timestamp; // 防止未保存时间戳
    const result = await pollingOutSideNoticeServer(
      { firstNotifyTime: timestamp },
      { cancelToken: cancelToken.token }
    );
    let list = result.data || [];
    if (list.length) {
      const ids = [];
      list = list.filter(item => {
        try {
          const data = JSON.parse(item.extra);
          data.appName = item.appName;
          item.extraJson = data;
          if (data.remindType === "NUM") {
            // number类型通知进行推送
            ids.push(data.id);
            return true;
          }
        } catch (error) {}
        return false;
      });
      if (ids.length) {
        // 查询number类型通知的已读未读状态
        const readStateResult = await pollingReadStatusServer({ ids });
        if (readStateResult.data && readStateResult.data.length) {
          const readIds = [];
          readStateResult.data.forEach(item => {
            item.readStatus && readIds.push(item.id); // 筛选出已读的通知Id，进行弹框关闭
          });
          if (readIds.length) {
            list = list.filter(item => !readIds.includes(item.extraJson.id));
            ipcRenderer.invoke("top-notice", "closeIds", readIds);
          }
        }
      }
      if (list.length) {
        list.reverse().forEach(item => {
          // number类型通知进行推送
          item.extraJson && PushNotice.push(item.extraJson, item);
        });
      }
    }
    pollTimestamp = result.ctime; // 更新时间戳
  } catch (error) {
    console.error(error);
  }
  clearTimeout(pollingTimeout);
  pollingTimeout = setTimeout(() => {
    pollingHandle();
  }, 30000);
}
