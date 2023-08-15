import Vue from "vue";
import { MessageModel } from "@/WebIM";
import store from "@/store";
import { IMConversationEnum } from "@/WebIM/conversation/ConversationModel";
import { ipcRenderer } from "electron";

const checkMessage = inputData => {
  const {
    operateType,
    time,
    extra,
    gatherId,
    gatherName,
    topStatus,
    belongSubgroup,
    doNotDisturb,
    finalRealChildList,
    childInfo,
    moveToGatherId,
    moveToGatherName,
    moveToGatherTopStatus,
    moveToGatherBelongSubgroup,
    moveToGatherDoNotDisturb,
    moveToGatherFinalRealChildList
  } = inputData;
  let sendData;
  if (typeof operateType === "number" && operateType >= 0 && operateType <= 7) {
    sendData = {
      operateType, // 0：创建；1：重命名；2：置顶操作；3：新增子项(添加会话、加入已有收纳组)；4：删除子项（移出、批量移出）；5：移动子项到其他组（移动至、批量移动至）；6：免打扰；7：解散（删除收纳组）
      time, // 时间戳
      extra: extra || "", // 扩展字段
      gatherId, // 收纳组id
      gatherName, // 收纳组名称
      topStatus: topStatus || 2, // 收纳组是否置顶 1：置顶；2：取消置顶
      belongSubgroup: belongSubgroup, // 组织还是外联 0：组织；1：外联
      doNotDisturb: doNotDisturb || 2, // 收纳组是否免打扰 1：免打扰；2：非免打扰
      finalRealChildList: finalRealChildList || [], //操作收纳组后的所有子项 <{conversationId: string; conversationType: string}>
      childInfo: childInfo || [], //操作收纳组的子项 <{conversationId: string; conversationType: string}> 只包含变动的项
      moveToGatherId: moveToGatherId || "", // 移动到哪个收纳组的id
      moveToGatherName: moveToGatherName || "", // 移动到的收纳组名称
      moveToGatherTopStatus: moveToGatherTopStatus || 2, // 移动到的收纳组是否置顶 1：置顶；2：取消置顶
      moveToGatherBelongSubgroup: moveToGatherBelongSubgroup, // 移动到的组织还是外联 0：组织；1：外联
      moveToGatherDoNotDisturb: moveToGatherDoNotDisturb || 2, // 移动到的收纳组是否免打扰 1：免打扰；2：非免打扰
      moveToGatherFinalRealChildList: moveToGatherFinalRealChildList || [] //操作收纳组后的所有子项 <{conversationId: string; conversationType: string}>
    };
  } else {
    sendData = null;
  }

  return sendData;
};
const sendStorageMessage = async inputData => {
  const sendData = checkMessage(inputData);
  if (!sendData) {
    console.log("消息格式不正确", inputData);
    return;
  }
  const sender = store.getters.GetSendUser;
  const messageBody = {
    conversationType: IMConversationEnum.PRIVATE,
    targetId: sender.id,
    senderUserId: sender.id,
    messageType: MessageModel.MessageType.ZXGatherMsg,
    source: sendData,
    save: false
  };
  Vue.prototype.$service.DistributeSendMessage(messageBody).catch(e => {
    console.error(e);
  });
  ipcRenderer.invoke("sqlite-receive", {
    key: "onReceivedZXGatherMsg",
    msg: messageBody.source
  });
  store.dispatch("updateStorageSyncMsg", messageBody.source);
};

export { sendStorageMessage };

export default {
  sendStorageMessage
};
