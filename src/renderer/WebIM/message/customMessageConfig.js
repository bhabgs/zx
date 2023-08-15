// const messageTag = [isCounted, isPersited];
// isCounted: 消息是否计数，isPersited：消息是否保存

/**
 * messageName: 消息名称
 * objectName: 消息内置名称，标识
 * messageTag: 消息标签
 * prototypes: 消息类中的属性名
 */
const CustomMessage = [
  {
    messageName: "ZXAppLinkMessage", // 链接类消息
    objectName: "ZX:AppLinkMsg",
    messageTag: [true, true],
    prototypes: [
      "linkPath", // 地址
      "linkType", // 类型, 1汇报，2项目报，3审批 4请假 5智文 6智邮  默认1
      "linkStyle", // 类型, 1：1日报，2周报，3月报 2：1大地精，2斜沟 3：1请假，2出差 3其它
      "linkOwner", // 链接指向者, 例如：张三的日报
      "linkPeriod", // 时间
      "linkDes", // 链接描述
      "extra", // 当前操作的附加信息
      "user"
    ]
  },
  {
    messageName: "ZXTipMessage", // 提示类消息
    objectName: "ZX:TipMsg",
    messageTag: [true, true],
    prototypes: [
      "operation", // 预定义的操作名：新建群 New  群头像变更 Avatar 群加人 Add 群成员退出 Quit 成员被踢 Kicked 群命名   Rename 群公告 Bulletin 群主转移 Admin 群解散 Exit 群属性发生变化 Property 群类型改变 Type 系统消息 Time(ios本地使用-其它端可以借鉴使用)     **** Exit 退出后，需要发送系统消息（所发人员时当前群成员）
      "operatorUserId", // 当前操作发起用户的用户ID
      "userInfo", // 当前操作的目标对象数组，如被当前操作目标用户的用户ID或变更后的群主名称等。（此字段时数组 请注意）
      "message", // 当前操作的消息内容
      "extra", // 当前操作的附加信息
      "user"
    ]
  },
  {
    messageName: "ZXVideoMessage", // 视频消息
    objectName: "ZX:VideoMsg",
    messageTag: [true, true],
    prototypes: [
      "localPath", // 本地URL地址，非必须
      "videoUrl", // 网络URL地址
      "duration", // 视频时长，以秒为单位
      "name", // 视频名称
      "size", // 文件大小
      "thumbnailImage", // 缩略图
      "extra", // 扩展字段
      "user"
    ]
  },
  {
    messageName: "ZXRichMessage", // 图文消息
    objectName: "ZX:RichMsg",
    messageTag: [true, true],
    prototypes: [
      "operatorUserId", // 当前操作发起用户的ID
      "operatorName", // 当前操作发起用户的名字
      "operatorUrl", // 当前操作发起用户的头像地址
      "type", // 图文消息的类型 （1-图片、2-视频、3-文件、4-语音等等）
      "title", // 图文消息的标题 （图片、视频、文件等等的名称）
      "digest", // 图文消息的内容摘要（现场设备出现故障，请及时维修等等内容）
      "url", // 图文消息URL(图片、视频、文件、等等)
      "skipUrl", // 图文消息中包含的需要跳转到的URL
      "thumbnailImage", // 缩略图
      "duration", // 时长
      "size", // 大小
      "localPath", // 本地资源地址
      "extra", // 扩展字段
      "labelList", // 图文消息的标签labelList : [{labelId: 123,labelName: 设备故障，groupId: 321}],
      "urlList", // 图文消息列表
      "handClapTime", // 随手拍操作时间
      "handClapLocation", // 随手拍定位地址
      "handClapId", // 随手拍消息Id
      "user"
    ]
  },
  {
    messageName: "ZXEncryptFileMsg", // 加密文件消息
    objectName: "ZX:EncryptFileMsg",
    messageTag: [true, true],
    prototypes: ["name", "size", "type", "fileUrl", "user", "extra"]
  },
  {
    messageName: "ZXEncryptImgMsg", // 加密图片消息
    objectName: "ZX:EncryptImgMsg",
    messageTag: [true, true],
    prototypes: ["content", "imageUri", "isFull", "user", "extra"]
  },
  {
    messageName: "ZXEncryptVideoMsg", // 加密视频消息
    objectName: "ZX:EncryptVideoMsg",
    messageTag: [true, true],
    prototypes: [
      "localPath", // 本地URL地址，非必须
      "videoUrl", // 网络URL地址
      "duration", // 视频时长，以秒为单位
      "name", // 视频名称
      "size", // 文件大小
      "thumbnailImage", // 缩略图
      "extra", // 扩展字段
      "user"
    ]
  },
  {
    messageName: "ZXActionCardMsg", // 卡片消息
    objectName: "ZX:ActionCardMsg",
    messageTag: [true, true],
    prototypes: [
      "title", // 标题
      "content", // 内容
      "imgUrl", // 图片地址
      "messageLink", // 消息链接
      "btnList", // 按钮列表
      "extra", // 扩展字段
      "user"
    ]
  },
  {
    messageName: "ZXGIFMsg", // GIF消息
    objectName: "ZX:GIFMsg",
    messageTag: [true, true],
    prototypes: [
      "size", // 标题
      "content", // 内容
      "imageUri", // 图片地址
      "width", // 消息链接
      "height", // 按钮列表
      "extra", // 扩展字段
      "user"
    ]
  },
  {
    messageName: "ZXConversationOperateMsg", // 会话操作消息体
    objectName: "ZX:ConversationOperateMsg",
    messageTag: [true, true],
    prototypes: [
      "conversationId", // 会话id
      "conversationType", // 会话类型
      "operateType", // 1：置顶操作；2：免打扰操作
      "topStatus", // 1：置顶；2：取消置顶
      "doNotDisturb", // 1：免打扰；2：非免打扰
      "time", // 时间戳
      "extra", // 扩展字段
      "user"
    ]
  },
  {
    messageName: "ZXGatherMsg", // 收纳组消息体
    objectName: "ZX:GatherMsg",
    messageTag: [true, true],
    prototypes: [
      "operateType", // 0：创建；1：重命名；2：置顶操作；3：新增子项；4：删除子项；5：移动子项到其他组；6：免打扰；7：解散（删除收纳组）
      "gatherId", // 收纳组id
      "gatherName", // 收纳组名称
      "topStatus", // 收纳组是否置顶 1：置顶；2：取消置顶
      "doNotDisturb", // 收纳组是否免打扰 1：免打扰；2：非免打扰
      "moveToGatherId", // string 移动到哪个组
      "operateChildList", // 操作收纳组的子项 <{conversationId: string; conversationType: string}>
      "time", // 时间戳
      "extra", // 扩展字段
      "user"
    ]
  },
  {
    messageName: "ZXCombineMsg", // 合并转发类消息体
    objectName: "ZX:CombineMsg",
    messageTag: [true, true],
    prototypes: [
      "remoteUrl", // 转发的消息列表转为json存到oss的远程地址
      "conversationType", // 转发的消息体来自于群聊还是私聊
      "nameList", // String数组，私聊可以传2个人名，群聊传一个群名自己判断
      "summaryList", // 合并转发类消息缩略信息展示
      "content", // 合并转发标题，（用于全文检索）
      "messageCount", // 转发的消息条数
      "extra", // 扩展字段
    ]
  }
];

export default CustomMessage;
