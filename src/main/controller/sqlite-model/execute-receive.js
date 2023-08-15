import { executeDB } from "./index";
import { SQL } from "../../modules/sqlite/sql";
// 将支持类型的消息存储到本地
const onReceived = async (msg) => {
  try {
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_MESSAGE,
      data: [msg],
    });
  } catch (err) {
    console.error(err);
  }
};
const DistributeSendMessage = async (msg) => {
  try {
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_MESSAGE,
      data: [msg],
    });
  } catch (err) {
    console.error(err);
  }
};
const SendMessage = async (msg) => {
  try {
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_MESSAGE,
      data: [msg],
    });
  } catch (err) {
    console.error(err);
  }
};

const onReceivedRecallCommandMessage = async (msg) => {
  try {
    /**
     * TODO 收到撤回的消息处理逻辑
     */
    let messageUId = msg && msg.content && msg.content.messageUId;
    let list = await executeDB({
      sql: SQL.UNION_RECALL_MESSAGE_BY_MESSAGEID,
      data: [{ messageUId }],
    });

    let presentMsge = list && list.length > 0 ? list[0] : msg;
    let systemMessage = `${presentMsge.name || ""}撤回了一条消息`;
    let result = {
      ...presentMsge,
      systemMessage,
      messageState: 3, //MessageModel.MessageState.RECALL
      recallTime: msg.messageTime,
      sentTime: msg.sentTime,
      messageTime: msg.sentTime,
    };
    await executeDB({
      sql: SQL.INSERT_OR_REPLACE_MESSAGE,
      data: [result],
    });
  } catch (err) {
    console.error(err);
  }
};
const onReceivedZXGatherMsg = async (msg) => {
  try {
    console.log(msg);
    const type = msg.operateType * 1;
    let storageData = [
      {
        id: msg.gatherId,
        belongSubgroup: msg.belongSubgroup,
        isDelete: 0,
        isDisturb: msg.doNotDisturb,
        isTop: msg.topStatus,
        name: msg.gatherName,
        relList: msg.finalRealChildList.map((item) => {
          return {
            beId: item.conversationId,
            objectType: item.conversationType == "group" ? "1" : "2",
          };
        }),
        updateAt: msg.time,
      },
    ];
    let rellistData = msg.finalRealChildList.map((item) => {
      return {
        id: msg.gatherId,
        beId: item.conversationId,
        objectType: item.conversationType == "group" ? "1" : "2",
      };
    });
    switch (type) {
      case 0:
      // 创建
      case 3:
        // 新增子项
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE,
          data: storageData,
        });
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE_RELLIST,
          data: rellistData,
        });
        break;

      case 1:
      // 重命名
      case 2:
      // 置顶操作
      case 6:
        // 免打扰
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE,
          data: storageData,
        });
        break;
      case 4:
        // 删除子项
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE,
          data: storageData,
        });
        await executeDB({
          sql: SQL.DELETE_STORAGE_RELLIST_BY_ID,
          data: [{ id: msg.gatherId }],
        });
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE_RELLIST,
          data: rellistData,
        });
        break;
      case 5:
        // 移动至
        // 移动到的收纳组
        let storageMoveData = [
          {
            id: msg.moveToGatherId,
            belongSubgroup: msg.moveToGatherBelongSubgroup,
            isDelete: 0,
            isDisturb: msg.doNotDisturb,
            isTop: msg.moveToGatherTopStatus,
            name: msg.moveToGatherName,
            relList: msg.moveToGatherFinalRealChildList.map((item) => {
              return {
                beId: item.conversationId,
                objectType: item.conversationType == "group" ? "1" : "2",
              };
            }),
            updateAt: msg.time,
          },
        ];
        let rellistMoveData = msg.moveToGatherFinalRealChildList.map((item) => {
          return {
            id: msg.moveToGatherId,
            beId: item.conversationId,
            objectType: item.conversationType == "group" ? "1" : "2",
          };
        });

        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE,
          data: storageMoveData,
        });
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE_RELLIST,
          data: rellistMoveData,
        });

        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE,
          data: storageData,
        });
        await executeDB({
          sql: SQL.DELETE_STORAGE_RELLIST_BY_ID,
          data: [{ id: msg.gatherId }],
        });
        await executeDB({
          sql: SQL.INSERT_OR_REPLACE_STORAGE_RELLIST,
          data: rellistData,
        });

        break;
      case 7:
        // 解散
        await executeDB({
          sql: SQL.DELETE_STORAGE_BY_KEY,
          data: [{ id: msg.gatherId }],
        });
        await executeDB({
          sql: SQL.DELETE_STORAGE_RELLIST_BY_ID,
          data: [{ id: msg.gatherId }],
        });
        break;
    }
  } catch (err) {
    console.error(err);
  }
};
const onReceivedZXConversationOperateMsg = async (msg) => {
  try {
    /**
     * TODO 收到会话同步消息处理逻辑
     */
  } catch (err) {
    console.error(err);
  }
};
export const executeReceive = async ({ key = "", msg }) => {
  try {
    let result;
    switch (key) {
      case "onReceived": // 将支持类型的消息存储到本地
        result = await onReceived(msg);
        break;
      case "DistributeSendMessage": // 发送的消息也要存到本地的消息
        result = await DistributeSendMessage(msg);
        break;
      case "SendMessage": // 发送的消息也要存到本地的消息
        result = await SendMessage(msg);
        break;

      case "onReceivedRecallCommandMessage": // 收到撤回消息
        result = await onReceivedRecallCommandMessage(msg);
        break;
      case "onReceivedZXConversationOperateMsg": // 收到会话同步的消息
        result = await onReceivedZXConversationOperateMsg(msg);
        break;
      case "onReceivedZXGatherMsg": // 收到收纳组类型的消息
        result = await onReceivedZXGatherMsg(msg);
        break;
      default:
        console.log(`${key} is not defined in executeURL.`);
        break;
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};
