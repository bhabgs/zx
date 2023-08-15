## 消息

## MessageModel

> 消息模型

```
export {
  MessageType,
  Message
}
```

1. **MessageType**
   > 消息类型:

| 消息分类   | 消息行为标识                                                                           |
| ---------- | -------------------------------------------------------------------------------------- |
| 内容类消息 | 表示一个用户间发送的包含具体内容的消息，需要展现在聊天界面上，如文字消息、语音消息等。 |
| 通知类消息 | 表示一个通知信息，可能展现在聊天界面上，如提示条通知。                                 |
| 状态类消息 | 表示一个状态，用来实现如“对方正在输入”的功能。                                         |
| 信令类消息 | 融云在实现 SDK 自身业务功能时使用的，开发者不需要对其做任何处理。                      |

- **内容类消息**

| 消息类型           | ObjectName         | 类名                                   |
| ------------------ | ------------------ | -------------------------------------- |
| 文字消息           | `RC:TxtMsg`        | `TextMessage`                          |
| 语音消息           | `RC:VcMsg`         | `VoiceMessage`                         |
| 图片消息           | `RC:ImgMsg`        | `ImageMessage`                         |
| 图文消息           | `RC:ImgTextMsg`    | `RichContentMessage`                   |
| 文件消息           | `RC:FileMsg`       | `FileMessage`                          |
| 位置消息           | `RC:LBSMsg`        | `LocationMessage`                      |
| 小视频消息         | `RC:SightMsg`      | `SightMessage`                         |
| 公众服务单图文消息 | `RC:PSImgTxtMsg`   | `PublicServiceRichContentMessage`      |
| 公众服务多图文消息 | `RC:PSMultiImgMsg` | `PublicServiceMultiRichContentMessage` |

- **通知类消息**

| 消息类型         | ObjectName      | 类名                             |
| ---------------- | --------------- | -------------------------------- |
| 好友通知消息     | `RC:ContactNtf` | `ContactNotificationMessage`     |
| 资料通知消息     | `RC:ProfileNtf` | `ProfileNotificationMessage`     |
| 通用命令通知消息 | `RC:CmdNtf`     | `CommandNotificationMessage`     |
| 提示条通知消息   | `RC:InfoNtf`    | `InformationNotificationMessage` |
| 群组通知消息     | `RC:GrpNtf`     | `GroupNotificationMessage`       |
| 已读通知消息     | `RC:ReadNtf`    | `ReadReceiptMessage`             |
| 公众服务命令消息 | `RC:PSCmd`      | `PublicServiceCommandMessage`    |
| 命令消息         | `RC:CmdMsg`     | `CommandMessage`                 |

- **状态类消息**

| 消息类型             | ObjectName    | 类名                         |
| -------------------- | ------------- | ---------------------------- |
| 对方正在输入状态消息 | `RC:TypSts`   | `TypingStatusMessage`        |
| 群消息已读状态回执   | `RC:RRRspMsg` | `ReadReceiptResponseMessage` |

### Message

- **SentStatus**
  > 消息状态
- [x] `10` 发送中
- [x] `20` 发送失败
- [x] `30` 已发送
- [x] `40` 对方已接收
- [x] `50` 对方已读
- [x] `60` 对方已销毁

* 接收到的消息已读回执

```javascript
{
  content: {
    lastMessageSendTime: 1550648743509
    messageName: "ReadReceiptMessage"
    messageUId: "B917-F1CL-C8O4-1GJF"
    type: null
  }
  conversationType: 1
  extra: undefined
  isLocalMessage: undefined
  messageDirection: 2
  messageId: "1_5179358"
  messageType: "ReadReceiptMessage"
  messageUId: "B917-F3S9-II64-1FHI"
  objectName: "RC:ReadNtf"
  offLineMessage: false
  receiptResponse: undefined
  receivedStatus: 1
  receivedTime: 1550648751643
  senderUserId: "263"
  sentStatus: undefined
  sentTime: 1550648753702
  targetId: "263"
}
```

----------------------------分割线------------------------------
以下三端确定统一字段格式：
----------------------------分割线------------------------------

//主要信息
@property(nonatomic, copy) NSString *messageId;//消息的 ID
@property (nonatomic, copy) NSString *fromUserNickName;//发送人姓名
@property (nonatomic, copy) NSString *fromUserAvatar;//发送人头像
@property (nonatomic, copy) NSString *fromUserId;//发送用户 Id
@property (nonatomic, copy) NSString *toUserId;//接收用户 Id
@property (nonatomic, copy) NSString *groupId;//群组 id
@property (nonatomic, copy) NSString *msgTimestamp;//发送时间
@property (nonatomic, copy) NSString *objectName;//消息类型
@property (nonatomic, copy) NSString *channelType;//会话类型
@property (nonatomic, copy) NSString *extra;//拓展字段

//多媒体
@property (nonatomic, copy) NSString *url;//服务地址
@property (nonatomic, copy) NSString *size;//大小（视频）
@property (nonatomic, copy) NSString *name;//名称（文件、视频）
@property (nonatomic, copy) NSString *duration;//时长（语音、视频）

//文本
@property (nonatomic, copy) NSString \*content;//文本内容

//图片
@property (nonatomic, copy) NSString \*isFull;//是否原图 true 发送原图、false 不发送原图

//语音

//位置
@property (nonatomic, copy) NSString *locData;//data 图
@property (nonatomic, copy) NSString *latitude;//纬度
@property (nonatomic, copy) NSString *longitude;//经度
@property (nonatomic, copy) NSString *poi;//信息

//文件
@property (nonatomic, copy) NSString \*fileType;//文件类型

//视频
@property (nonatomic, copy) NSString \*videoThumbnail;//视频缩略图

//链接消息类型
/** 链接 */
@property (nonatomic, copy) NSString *linkPath;
/** 类型 1 汇报，2 项目报，3 审批 4 请假 5 智文 6 智邮 默认 1 */
@property (nonatomic, copy) NSString *linkType;
/** 二级类型 1：1 日报，2 周报，3 月报 2：1 大地精，2 斜沟 3：1 请假，2 出差 3 其它 */
@property (nonatomic, copy) NSString *linkStyle;
/** 发送者, 例如：张三的日报 */
@property (nonatomic, copy) NSString *linkOwner;
/** 时间 */
@property (nonatomic, copy) NSString *linkPeriod;
/** 描述-今日工作总结 */
@property (nonatomic, copy) NSString *linkDes;
