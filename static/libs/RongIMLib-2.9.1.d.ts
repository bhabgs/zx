import { IPushConfig, ConversationType, MessageDirection, ReceivedStatus, IReadReceiptInfo, IConversationTag, LogLevel, ConnectionStatus, ITypingMessage, ErrorCode, APIContext, IMessageReaderResponse, NotificationStatus, IPluginGenerator, INaviInfo, IChatroomEntry, IRemoveChatRoomEntryOption, FileType, IUploadAuth, UploadMethod, ITagParam, ITagInfo, IConversationOption, IExtraMethod, IRTCUsers, IRTCRoomInfo, IJoinRTCRoomData, RTCApiType, KVString, IRtcTokenData, RTCMode, LogType, Logger, MentionedType as MentionedType$1 } from '@rongcloud/engine';
export { ConnectionStatus, ConversationType, ErrorCode, FileType, IDeletedExpansion, IExpansionListenerData, IMessageReaderResponse, IUpdatedExpansion, LogLevel, MessageDirection, ReceivedStatus, UploadMethod } from '@rongcloud/engine';

declare enum SentStatus {
    /**
     * 发送中。
     */
    SENDING = 10,
    /**
     * 发送失败。
     */
    FAILED = 20,
    /**
     * 已发送。
     */
    SENT = 30,
    /**
     * 对方已接收。
     */
    RECEIVED = 40,
    /**
     * 对方已读。
     */
    READ = 50,
    /**
     * 对方已销毁。
     */
    DESTROYED = 60
}

declare enum GetChatRoomType {
    NONE = 0,
    SQQUENCE = 1,
    REVERSE = 2
}

interface ISendOptionsV2 {
    /**
     * 接收定向消息的用户 id，用于向群聊中的指定人员发送定向消息，其他人无法查看
     */
    userIds?: string[];
    /**
     * 为 ture 时, 当对方为 iOS 设备且未在线时，其将收到 Voip Push. 此配置对 Android 无影响
     */
    isVoipPush?: boolean;
    /**
     * 是否发送静默消息
     * @description
     * 当值为 `true` 时，服务器将不会发送 Push 信息，移动端也不会弹出本地通知提醒
     */
    disableNotification: boolean;
    /**
     * 消息是否支持拓展内容
     */
    canIncludeExpansion?: boolean;
    /**
     * 消息拓展内容数据
     */
    expansion?: {
        [key: string]: any;
    };
    /**
     * 过滤黑/白名单
    */
    isFilerWhiteBlacklist: boolean;
    /**
     * 推送扩展消息
     */
    pushConfig?: IPushConfig;
    /**
     * 是否为状态消息
     */
    isStatusMessage?: boolean;
    /**
     * 是否为状态消息
     * @deprecated
     * 该参数已废弃，请使用 `isStatusMessage` 替代该参数。在 `isStatusMessage` 有值的情况下，该参数将失效
     */
    isStatus?: boolean;
}
interface IRecallOptionsV2 {
    /**
     * 是否发送静默消息
     * @description
     * 当值为 `true` 时，服务器将不会发送 Push 信息，移动端也不会弹出本地通知提醒
     */
    disableNotification: boolean;
    /**
     * 推送扩展消息
     */
    pushConfig?: IPushConfig;
}
/**
 * v2 版本中要吐给应用层的消息结构
 */
interface IReceivedMessageV2 {
    receiptResponse?: any;
    /**
     * 会话标识预留字段
    */
    channelId?: string;
    conversationType: ConversationType;
    targetId: string;
    senderUserId: string;
    content: any;
    objectName: string;
    messageType: string;
    messageId: number;
    messageUId: string;
    messageDirection: MessageDirection;
    offLineMessage: boolean;
    sentStatus: SentStatus;
    sentTime: number;
    receivedStatus: ReceivedStatus;
    receivedTime: number;
    canIncludeExpansion: boolean;
    expansion: {
        [key: string]: string;
    } | null;
    disableNotification: boolean;
    /**
     * 消息已读回执信息，导航配置grpRRVer=1时群组类型消息内存在, 其他情况为undefined
     */
    readReceiptInfo?: IReadReceiptInfo;
    pushConfig?: IPushConfig;
}
/**
 * @todo 非直接对用户暴露的数据类
 * 基础消息数据类
 */
declare class BaseMessage<T = any> {
    readonly messageType: string;
    readonly objectName: string;
    content: T;
    readonly isPersited: boolean;
    readonly isCounted: boolean;
    constructor(messageType: string, objectName: string, content: T, isPersited?: boolean, isCounted?: boolean);
}

interface IConversationStatus {
    /**
     * 是否置顶
     */
    isTop?: boolean;
    /**
     * 是否免打扰
     * @description
     * 1. 开启免打扰
     * 2. 关闭免打扰
     */
    notificationStatus?: 1 | 2;
    /**
     * 标签
     */
    tags?: IConversationTag[];
}
interface IReceivedConversationStatus extends IConversationStatus {
    /**
     * 会话类型
     */
    conversationType: ConversationType;
    /**
     * 会话目标 ID
     */
    targetId: string;
    /**
     * 更新时间
     */
    updatedTime: number;
    /**
     * 会话标识
    */
    channelId: string;
}
/**
 * 从服务端收到更新监听数据信息
 */
interface IReceivedUpdatedExpansion {
    /**
     * 新增、修改的扩展信息
     */
    expansion: {
        [key: string]: string;
    };
    /**
     * 扩展消息的 messageUId
     */
    messageUId: string;
}
/**
 * 从服务端收到的删除监听数据信息
 */
interface IReceivedDeletedExpansion {
    /**
     * 删除扩展的 keys
     */
    deletedKeys: string[];
    /**
     * 扩展消息的 messageUId
     */
    messageUId: string;
}
/**
 * 初始化参数配置
 */
interface IInitOption {
    /**
     * 私有云部署导航地址，公有云可传空
     */
    navi?: string;
    /**
     * 私有云部署 API 地址，公有云可传空
     */
    api?: string;
    /**
     * 连接方式，默认使用 'websocket'
    */
    connectionType?: 'websocket' | 'comet';
    /**
     * 输出日志等级
     */
    logLevel?: LogLevel;
    /**
     * 修改默认日志输出函数
     */
    logStdout?: (logLevel: LogLevel, content: string) => void;
    /**
     * 调试模式，开启后 SDK 自动向控制台输出日志
     * @deprecated
     */
    debug?: boolean;
    /**
     * 网络嗅探配置，SDK 自动重连时通过此配置进行网络探测
     * @deprecated
     */
    detect?: {
        /**
         * 网络嗅探地址。默认嗅探地址仅为测试 http 请求是否可以正常发送，并非真实地址，返回 404 属于正常情况
         * @default https://cdn.ronghub.com/im_detecting
         */
        url: string;
        /**
         * 网络嗅探间隔时间，单位：毫秒
         * @default 1500
         */
        intervalTime: number;
    };
    /**
     * @deprecated 该参数已废弃
     */
    protobuf?: string;
    /**
     * @deprecated
    */
    dbPath?: string;
    /**
     * typing 过期时间
     */
    typingExpireTime?: number;
    /**
      * 是否打开 IndexDB 存储, 默认为 true
      */
    indexDBSwitch?: boolean;
}
/**
 * 消息监听器
 */
interface IReceiveMessageListener {
    /**
     * 消息回调
     * @param message 接收到的消息
     * @param leftCount 该参数废弃，值将始终为 undefined
     * @param hasMore c++ 协议栈配套参数，消息是否收取结束
     */
    onReceived(message: IReceivedMessageV2, leftCount?: number, hasMore?: boolean): void;
}
/**
 * 连接监听器
 */
interface IConnectionStatusListener {
    onChanged(status: ConnectionStatus): void;
}
/**
 * 会话状态监听器
 */
interface IConversationStatusListener {
    /**
     * 状态回调
     */
    onChanged(status: IReceivedConversationStatus[]): void;
}
/**
 * 消息扩展监听器
 */
interface IMessageExpansionListener {
    onUpdated(data: IReceivedUpdatedExpansion): void;
    onDeleted(data: IReceivedDeletedExpansion): void;
}
/**
 * 标签监听器
 */
interface ITagListener {
    onChanged(): void;
}
/**
 * typing监听器
 */
interface ITypingListener {
    onChanged(info: ITypingMessage[]): void;
}
/**
 * 连接回调
 */
interface IConnectCallback {
    /**
     * 连接成功回调
     * @param userId
     */
    onSuccess(userId: string): void;
    /**
     * 连接用 token 失效回调
     */
    onTokenIncorrect(): void;
    /**
     * 连接失败回调
     * @param errorcode 错误码
     */
    onError(errorcode: number): void;
}
/**
 * 重连配置
 */
interface IReconnectOptions {
    /**
     * 是否自动重连
     * @default false
     */
    auto?: boolean;
    /**
     * 用于网络嗅探的地址。auto 为 true 时, 此参数必填
     */
    url?: string;
    /**
     * 网络嗅探频率, 单位为毫秒。auto 为 true 时, 此参数必填
     */
    rate?: number[];
}
interface IErrorCallback {
    /**
     * 失败回调
     * @param error
     */
    onError(error: ErrorCode, data?: unknown): void;
}
interface ISuccessCallback<T, O = void> {
    /**
     * 成功回调
     * @param data
     */
    onSuccess(data: T, other?: O): void;
}
interface ICallback<T = void, O = void> extends ISuccessCallback<T, O>, IErrorCallback {
}
interface ISendCallback<T = void, O = void> extends ICallback<T, O> {
    onBefore?(messageId: number): void;
}
/**
 * V2 API Conversation
*/
interface IV2Conversation {
    /**
     * 多组织会话业务标识
    */
    channelId: string;
    /**
     * 会话类型
     */
    conversationType: ConversationType;
    /**
     * 接收方 ID
     */
    targetId: string;
    /**
     * 当前会话的未读消息数
     */
    unreadMessageCount: number;
    /**
     * 会话中的最后一条消息
     */
    latestMessage: IReceivedMessageV2 | null;
    /**
     * ~~会话最后一条消息 ID~~
     * @deprecated
     * 该属性已废弃，请通过 `latestMessage` 取值
    */
    latestMessageId?: number;
    /**
     * ~~会话中最后一条消息的消息标识, 融云内置消息以 "RC:" 开头~~
     * @deprecated
     * 该属性已废弃，请通过 `latestMessage` 取值
    */
    objectName?: string;
    /**
     * ~~会话中最后一条消息融云服务端的发送时间~~
     * @deprecated
     * 该属性已废弃，请通过 `latestMessage` 取值
    */
    sentTime?: number;
    /**
     * 会话置顶状态
    */
    isTop: boolean;
    /**
     * 会话免打扰状态： 1 开启免打扰、 2 关闭免打扰
    */
    notificationStatus: 1 | 2;
    /**
     * ~~最后一条消息接收状态~~
     * @deprecated
     * 该属性已废弃，请通过 `latestMessage` 取值
    */
    receivedStatus?: number;
    /**
     * 会话中最后一条消息发送状态 TODO 待确认是否弃用
    */
    /**
     * 按照消息搜索会话时，匹配到的消息数量
     */
    matchCount?: number;
}
/**
 * V2 API ConversationContainTag
*/
interface IV2ConversationContainTag extends IV2Conversation {
    /**
     * 在tag中是否置顶
    */
    isTopInTag: boolean;
}
/**
 * 按 messageUId 删除消息
 */
interface IDeleteMessge {
    /**
     * 消息 UId
     */
    messageUId: string;
    /**
     * 消息发送时间
     */
    sentTime: number;
    /**
     * 消息方向
     */
    messageDirection: MessageDirection;
}
/**
 * getFileUrl 返回数据接口
 */
interface IGetFileUrl {
    /**
     * 上传后的文件下载地址
     */
    downloadUrl: string;
}
/**
 * 按时间戳删除消息
 */
interface IDelteByTime {
    conversationType: number;
    targetId: string;
    timestamp: number;
}
interface IV2ChatRoomInfo {
    /**
     * 成员列表
     * @todo 需确认数组元素的数据结构
     */
    userInfos: {
        /**
       * 用户 id
       */
        id: string;
        /**
         * 加入聊天室的时间
         */
        time: number;
    }[];
    /**
     * 房间内总人数
     */
    userTotalNums: number;
}
interface IInsertOptions {
    /**
     * 插入消息是否计入未读数: true 计数 false 不计数, 默认不计数
     */
    isUnread?: boolean;
    /**
     * 消息搜索关键字
     */
    searchContent?: string;
}

declare class ChannelClient {
    private readonly _context;
    readonly channelId: string;
    private readonly _isCPPMode;
    private readonly _storage;
    /**
     * 草稿数据
     */
    private readonly _draftMap;
    constructor(_context: APIContext, channelId: string, _isCPPMode: boolean);
    /**
     * 获取会话列表
     * @param callback 结果回调
     * @param conversationTypes 会话类型，为 null 时，返回全部会话
     * @param count 获取数量，默认 300
     */
    getConversationList(callback: ICallback<IV2Conversation[]>, conversationTypes: Number[] | null, count?: number): void;
    /**
     * 获取指定会话
     * @deprecated
     * @param conversationType
     * @param targetId
     * @param callback
     */
    getConversation(conversationType: ConversationType, targetId: string, callback: ICallback<IV2Conversation | null>): void;
    /**
     * 删除指定会话
     * @param conversationType 会话类型
     * @param targetId 会话 target_id
     * @param callback 删除回调
     */
    removeConversation(conversationType: ConversationType, targetId: string, callback: ICallback<void>): void;
    /**
     * 保存草稿
     * @description 草稿存储在内存中，如刷新或者关闭页面会导致草稿丢失。
     * 草稿功能并未在 v3 SDK 版本红实现，由 Bridge 模块实现
     * @param conversationType
     * @param targetId
     * @param draftText
     */
    saveTextMessageDraft(conversationType: ConversationType, targetId: string, draftText: string): boolean;
    /**
     * 获取草稿信息
     * @description 未登录或无草稿数据时将返回 undefined
     * @param conversationType
     * @param targetId
     */
    getTextMessageDraft(conversationType: ConversationType, targetId: string): string | undefined;
    /**
     * 删除草稿
     * @param conversationType
     * @param targetId
     */
    clearTextMessageDraft(conversationType: ConversationType, targetId: string): boolean;
    /**
     * 获取当前组织下的所有会话的消息未读数
     * @description
     * 1. 清除浏览器缓存会导致会话未读数不准确
     * 2. 会话消息未读数存储在 WebStorage 中, 若浏览器不支持或禁用 WebStorage，未读消息数将不会保存，浏览器页面刷新未读消息数将不会存在
     * @param callback
     * @param conversationTypes 要获取未读数的会话类型，若为空，则默认获取单聊、群聊及系统消息未读数
     * @param includeMuted 是否包含免打扰会话（web 暂未实现）
     */
    getTotalUnreadCount(callback: ICallback<number>, conversationTypes?: ConversationType[], includeMuted?: boolean): void;
    /**
     * 获取指定会话的消息未读数
     * @todo
     * @param conversationType
     * @param targetId
     * @param callback
     */
    getUnreadCount(conversationType: ConversationType, targetId: string, callback: ICallback<number>): void;
    /**
     * 删除指定类型会话，该方法已弃用
     * @description
     * 仅可在协议栈连接下调用
     * @param callback
     * @param {ConversationType[]} ? types
     */
    clearConversations(callback: ICallback<boolean>, conversationTypes: ConversationType[]): void;
    /**
     * 清除指定会话未读数
     * @param conversationType
     * @param targetId
     * @param callback
     */
    clearUnreadCount(conversationType: ConversationType, targetId: string, callback: ICallback<boolean>): void;
    /**
     * 设置会话状态：是否置顶、是否免打扰
     * @param conversationType
     * @param targetId
     * @param status
     * @param callback
     */
    setConversationStatus(conversationType: ConversationType, targetId: string, status: IConversationStatus, callback: ICallback): void;
    /**
     * 发送消息
     * @param conversationType 会话类型
     * @param targetId 接收方 id，当会话类型为单聊时，该值为单聊对象的 userId，为群聊时，该值应为群组 groupId
     * @param msg 消息体
     * @param callback 回调函数
     * @param isMentioned `是否为 @ 消息`
     * @param pushContent 移动端在接收到消息推送时用于显示的推送信息
     * @param pushData Push 通知时附加信息
     * @param methodType 1 : 多客服(客服后台使用);   2 : 消息撤回
     * @param options 其他设置项
     */
    sendMessage(conversationType: ConversationType, targetId: string, msg: BaseMessage, callback: ISendCallback<IReceivedMessageV2>, isMentioned?: boolean, pushContent?: string, pushData?: string, options?: ISendOptionsV2): void;
    /**
     * 消息撤回
     * @param message
     */
    sendRecallMessage(message: IReceivedMessageV2, callback: ICallback<IReceivedMessageV2>, options?: IRecallOptionsV2): void;
    /**
     * 发送正在输入状态消息
     * @description
     * 正在输入状态消息，不存储、不计数、不推送
     * @param conversationType 会话类型
     * @param targetId 会话 id
     * @param typingContentType 正在输入的消息 ObjectName，如 RC:TxtMsg
     * @param callback
     */
    sendTypingStatusMessage(conversationType: ConversationType, targetId: string, typingContentType: string, callback: ICallback<IReceivedMessageV2>): void;
    /**
     * 发送已读回执
     * @description
     * @param conversationType
     * @param targetId
     * @param callback
     */
    sendReceiptResponse(conversationType: ConversationType, targetId: string, callback: ICallback<IReceivedMessageV2 | null>): void;
    /**
     * 发送群已读回执
     * @param messageUIds
     * @param targetId
     * @param callback
     */
    sendReadReceiptMessage(messageUIds: string[], targetId: string, callback: ICallback): void;
    /**
     * 获取群已读列表
     * @param messageUIds
     * @param targetId
     * @param callback
     */
    getMessageReader(messageUId: string, targetId: string, callback: ICallback<IMessageReaderResponse>): void;
    /**
     * 更新消息扩展
     * @param expansionDic 要更新的消息扩展信息键值对
     * @param message      要更新的原始消息体
     */
    updateMessageExpansion(expansionDic: {
        [key: string]: string;
    }, message: IReceivedMessageV2, callback: ICallback): void;
    /**
     * 删除消息扩展属性
     * @param keys 消息扩展信息中待删除的 key 的列表
     * @param message 要删除消息扩展的原始消息体
     */
    removeMessageExpansionForKey(keys: string[], message: IReceivedMessageV2, callback: ICallback): void;
    /**
     * 从服务端拉取指定会话的历史消息
     * @param conversationType 会话类型
     * @param targetId 会话 ID
     * @param timestamp 获取时间戳, 0 为从当前时间拉取
     * @param count 拉取条数，获取条数, 范围 1 - 20
     * @param order 获取顺序，默认为 0。0 为升序，获取消息发送时间比 timestamp 更早的消息；1 为降序。
     * @param objectname
     */
    getHistoryMessages(conversationType: ConversationType, targetId: string, timestamp: number, count: number, callback: ICallback<Array<IReceivedMessageV2>, boolean>, objectName?: string, order?: 0 | 1): void;
    /**
     * 通过 messageUId 删除消息
     * @param conversationType 会话类型
     * @param targetId 会话 id
     * @param messages 要删除的消息 []
     * @param callback
     */
    deleteRemoteMessages(conversationType: ConversationType, targetId: string, messages: IDeleteMessge[], callback: ICallback): void;
    /**
     * 通过时间戳删除消息
     * @param param
     * @param callback
     */
    clearRemoteHistoryMessages(param: IDelteByTime, callback: ICallback): void;
    /**
     * 向本地插入一条消息，不发送到服务器
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param content 消息体
     * @param callback
    */
    insertMessage(conversationType: ConversationType, targetId: string, content: IReceivedMessageV2, callback: ICallback<IReceivedMessageV2>, options?: IInsertOptions): void;
    /**
     * 从本地消息数据库中删除某一会话指定时间之前的消息数据
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param timestamp 指定删除该时间戳之前的消息
     * @param cleanSpace 指定删除该时间戳之前的消息。是否清理数据条目所使用的磁盘空间。清理磁盘空间会阻塞进程且耗时较长，不推荐使用。
     * 数据在被抹除的情况下，未清理的磁盘空间会在后续存储操作中复用，且对数据查询无影响
    */
    deleteLocalMessagesByTimestamp(conversationType: ConversationType, targetId: string, timestamp: number, cleanSpace: boolean, callback: ICallback<boolean>): void;
    /**
     * 协议栈获取远端历史消息
     * @param conversationType 会话类型
     * @param targetId 会话 ID
     * @param timestamp 获取时间戳, 0 为从当前时间拉取
     * @param count 拉取条数，获取条数, 范围 1 - 20
    */
    getRemoteHistoryMessages(conversationType: ConversationType, targetId: string, timestamp: number, count: number, callback: ICallback<Array<IReceivedMessageV2>, boolean>, options: {
        order?: 0 | 1;
    }): void;
    /**
     * 清空会话下历史消息
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param callback
    */
    clearMessages(conversationType: ConversationType, targetId: string, callback: ICallback<boolean>): void;
    /**
     * 按内容搜索会话
     * @param keyword 关键字
     * @param conversationTypes 会话类型数组
    */
    searchConversationByContent(keyword: string, callback: ICallback<IV2Conversation[]>, conversationTypes?: ConversationType[], customMessageType?: string[]): void;
    /**
     * 按内容搜索会话内容的消息
     * @param keyword 搜索内容
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param timestamp 搜索时间, 搜索该时间之前的消息
     * @param count 获取的数量
    */
    searchMessageByContent(conversationType: ConversationType, targetId: string, keyword: string, timestamp: number, count: number, total: number, callback: ICallback<IReceivedMessageV2[], number>): void;
    /**
     * 获取会话下所有未读的 @ 消息
     * @param conversationType 会话类型
     * @param targetId 目标 ID
    */
    getUnreadMentionedMessages(conversationType: ConversationType, targetId: string): IReceivedMessageV2[];
    /**
     * 清除时间戳前的未读数
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param timestamp 目标 ID
     * @param callback
    */
    clearUnreadCountByTimestamp(conversationType: ConversationType, targetId: string, timestamp: number, callback: ICallback<boolean>): void;
    /**
     * 获取会话免打扰状态
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param callback
    */
    getConversationNotificationStatus(conversationType: ConversationType, targetId: string, callback: ICallback<NotificationStatus>): void;
}

declare type RTCRoomOption = {
    id: string;
    roomId: string;
    mode: RTCMode;
    broadcastType: number;
};
declare class IMClient {
    private readonly _context;
    private readonly _channelClient;
    private readonly _defaultChannelClient;
    private readonly _isCPPMode;
    constructor(_context: APIContext);
    /**
     * 协议栈方法校验
     */
    private assertCPPMode;
    /**
     * 装载插件，并返回相应的插件实例
     * @param plugin
     * @param options
     */
    install<T, O>(plugin: IPluginGenerator<T, O>, options: O): T | null;
    /**
     * 获取 channel proxy 实例
     * @param channelId 会话标识 ID
    */
    getChannel(channelId: string): ChannelClient | null;
    /**
     * 批量删除 channel proxy 实例
     * @param channelIds 会话标识 ID
    */
    deleteChannels(channelIds: string[]): void;
    /**
     * 获取导航新 RTC Lib 使用
    */
    getNavi(): INaviInfo | {};
    /**
     * 获取 SDK 信息 RTC Lib 使用
    */
    getSDKInfo(): {
        version: string;
    };
    /**
     * 获取 App 信息，RTC Lib 使用
    */
    getAppInfo(): {
        appKey: string;
    };
    /**
     * 获取当前用户 ID
    */
    getCurrentUserId(): string;
    /**
     * 断开当前连接
     * @description 相较于原 SDK 2.0 版本的 disconnect，此方法会返回一个 Promise 对象
     * @returns Promise<void>
     */
    disconnect(): Promise<void>;
    /**
     * 该方法等价于 disconnect
     */
    logout(): Promise<void>;
    /**
     * 清除内存或本地缓存数据
    */
    clearCache(): void;
    /**
     * 获取会话列表，相对于 2.0 的接口，该接口结果中不再展开会话中最后一条消息的数据
     * @param callback 结果回调
     * @param conversationTypes 会话类型，为 null 时，返回全部会话
     * @param count 获取数量，默认 300
     */
    getConversationList(callback: ICallback<IV2Conversation[]>, conversationTypes: Number[] | null, count?: number): void;
    /**
     * 获取指定会话
     * @description 相较于 2.0 中从本地缓存获取会话，当前方法从服务器拉取
     * @param conversationType
     * @param targetId
     * @param callback
     */
    getConversation(conversationType: ConversationType, targetId: string, callback: ICallback<IV2Conversation | null>): void;
    /**
     * 删除指定会话
     * @param conversationType 会话类型
     * @param targetId 会话 target_id
     * @param callback 删除回调
     */
    removeConversation(conversationType: ConversationType, targetId: string, callback: ICallback<void>): void;
    /**
     * 保存草稿
     * @description 草稿存储在内存中，如刷新或者关闭页面会导致草稿丢失。
     * 草稿功能并未在 v3 SDK 版本红实现，由 Bridge 模块实现
     * @param conversationType
     * @param targetId
     * @param draftText
     */
    saveTextMessageDraft(conversationType: ConversationType, targetId: string, draftText: string): boolean;
    /**
     * 获取草稿信息
     * @description 未登录或无草稿数据时将返回 undefined
     * @param conversationType
     * @param targetId
     */
    getTextMessageDraft(conversationType: ConversationType, targetId: string): string | undefined;
    /**
     * 删除草稿
     * @param conversationType
     * @param targetId
     */
    clearTextMessageDraft(conversationType: ConversationType, targetId: string): boolean;
    /**
     * 获取所有会话的消息未读数
     * @description
     * 1. 清除浏览器缓存会导致会话未读数不准确
     * 2. 会话消息未读数存储在 WebStorage 中, 若浏览器不支持或禁用 WebStorage，未读消息数将不会保存，浏览器页面刷新未读消息数将不会存在
     * @param callback
     * @param conversationTypes 要获取未读数的会话类型，若为空，则默认获取单聊、群聊及系统消息未读数（web 暂未实现）
     * @param includeMuted 是否包含免打扰会话（web 暂未实现）
     */
    getTotalUnreadCount(callback: ICallback<number>, conversationTypes?: ConversationType[], includeMuted?: boolean): void;
    /**
     * 获取指定会话的消息未读数
     * @todo
     * @param conversationType
     * @param targetId
     * @param callback
     */
    getUnreadCount(conversationType: ConversationType, targetId: string, callback: ICallback<number>): void;
    /**
     * 该方法已弃用~~按会话类型获取消息未读数~~
     * @deprecated
     * @param conversationType
     * @param callback
     */
    getConversationUnreadCount(conversationType: ConversationType, callback: ICallback<number>): void;
    /**
     * 删除指定类型会话，该方法已弃用
     * @description
     * 仅可在协议栈连接下调用
     * @param callback
     * @param {ConversationType[]} ? types
     */
    clearConversations(callback: ICallback<boolean>, conversationTypes: ConversationType[]): void;
    /**
     * 清除指定会话未读数
     * @param conversationType
     * @param targetId
     * @param callback
     */
    clearUnreadCount(conversationType: ConversationType, targetId: string, callback: ICallback<boolean>): void;
    /**
     * 设置会话状态：是否置顶、是否免打扰
     * @param conversationType
     * @param targetId
     * @param status
     * @param callback
     */
    setConversationStatus(conversationType: ConversationType, targetId: string, status: IConversationStatus, callback: ICallback): void;
    /**
     * 发送消息
     * @param conversationType 会话类型
     * @param targetId 接收方 id，当会话类型为单聊时，该值为单聊对象的 userId，为群聊时，该值应为群组 groupId
     * @param msg 消息体
     * @param callback 回调函数
     * @param isMentioned `是否为 @ 消息`
     * @param pushContent 移动端在接收到消息推送时用于显示的推送信息
     * @param pushData Push 通知时附加信息
     * @param methodType 该参数已废弃 ~~1 : 多客服(客服后台使用);   2 : 消息撤回~~
     * @param options 其他设置项
     */
    sendMessage(conversationType: ConversationType, targetId: string, msg: BaseMessage, callback: ISendCallback<IReceivedMessageV2>, isMentioned?: boolean, pushContent?: string, pushData?: string, methodType?: number, options?: ISendOptionsV2): void;
    /**
     * 消息撤回
     * @param message
     */
    sendRecallMessage(message: IReceivedMessageV2, callback: ICallback<IReceivedMessageV2>, options?: ISendOptionsV2): void;
    /**
     * 发送正在输入状态消息
     * @description
     * 正在输入状态消息，不存储、不计数、不推送
     * @param conversationType 会话类型
     * @param targetId 会话 id
     * @param typingContentType 正在输入的消息 ObjectName，如 RC:TxtMsg
     * @param callback
     */
    sendTypingStatusMessage(conversationType: ConversationType, targetId: string, typingContentType: string, callback: ICallback<IReceivedMessageV2>): void;
    /**
     * 发送已读回执
     * @description
     * @param conversationType
     * @param targetId
     * @param callback
     */
    sendReceiptResponse(conversationType: ConversationType, targetId: string, callback: ICallback<IReceivedMessageV2 | null>): void;
    /**
     * 发送群已读回执
     * @param messageUIds
     * @param targetId
     * @param callback
     */
    sendReadReceiptMessage(messageUIds: string[], targetId: string, callback: ICallback): void;
    /**
     * 获取群已读列表
     * @param messageUIds
     * @param targetId
     * @param callback
     */
    getMessageReader(messageUId: string, targetId: string, callback: ICallback<IMessageReaderResponse>): void;
    /**
     * 更新消息扩展
     * @param expansionDic 要更新的消息扩展信息键值对
     * @param message      要更新的原始消息体
    */
    updateMessageExpansion(expansionDic: {
        [key: string]: string;
    }, message: IReceivedMessageV2, callback: ICallback): void;
    /**
     * 删除消息扩展属性
    * @param keys 消息扩展信息中待删除的 key 的列表
    * @param message 要删除消息扩展的原始消息体
    */
    removeMessageExpansionForKey(keys: string[], message: IReceivedMessageV2, callback: ICallback): void;
    /**
     * 从服务端拉取指定会话的历史消息
     * @param conversationType 会话类型
     * @param targetId 会话 ID
     * @param timestamp 获取时间戳, 0 为从当前时间拉取
     * @param count 拉取条数，获取条数, 范围 1 - 20
     * @param callback
     * @param objectName
     * @param order 获取顺序，默认为 0。0 为升序，获取消息发送时间比 timestamp 更早的消息；1 为降序。
     */
    getHistoryMessages(conversationType: ConversationType, targetId: string, timestamp: number, count: number, callback: ICallback<Array<IReceivedMessageV2>, boolean>, objectName?: string, order?: 0 | 1): void;
    /**
     * 加入聊天室
     * @param chatRoomId 聊天室 id
     * @param count 拉取聊天室消息数量
     * @param callback
     */
    joinChatRoom(chatRoomId: string, count: number, callback: ICallback): void;
    /**
     * 退出聊天室
     * @param chatRoomId 聊天室 id
     * @param callback
     */
    quitChatRoom(chatRoomId: string, callback: ICallback): void;
    /**
     * 获取聊天室信息
     * @param chatRoomId 聊天室 id
     * @param count 获取人数, 范围 0 - 20
     * 1. 传入 0 获取到的聊天室信息将或仅包含成员总数，不包含具体的成员列表
     * 2. 传入其他大于 0 的值返回聊天室信息，结果仅包含包含不多于 20 人的成员信息和当前成员总数。最大值为 20
     * @param order 排序方式，1 为正序，2 为倒序
     * @param callback
     */
    getChatRoomInfo(chatRoomId: string, count: number, order: 1 | 2, callback: ICallback<IV2ChatRoomInfo>): void;
    /**
     * 在指定聊天室中设置自定义属性
     * @description 仅聊天室中不存在此属性或属性设置者为己方时可设置成功
     * @param chatRoomId 聊天室房间 id
     * @param chatroomEntry 属性信息
     * @param callback
     */
    setChatroomEntry(chatRoomId: string, chatroomEntry: IChatroomEntry, callback: ICallback): void;
    /**
     * 在指定聊天室中强制增加 / 修改任意聊天室属性
     * @description 仅聊天室中不存在此属性或属性设置者为己方时可设置成功
     * @param chatRoomId 聊天室房间 id
     * @param chatroomEntry 属性信息
     * @param callback
     */
    forceSetChatroomEntry(chatRoomId: string, chatroomEntry: IChatroomEntry, callback: ICallback): void;
    /**
     * 删除聊天室属性
     * @description 该方法仅限于删除自己设置的聊天室属性
     * @param chatRoomId 聊天室房间 id
     * @param chatroomEntry 要移除的属性信息
     * @param callback
     */
    removeChatroomEntry(chatRoomId: string, chatroomEntry: IRemoveChatRoomEntryOption, callback: ICallback): void;
    /**
     * 强制删除任意聊天室属性
     * @description 该方法仅限于删除自己设置的聊天室属性
     * @param chatRoomId 聊天室房间 id
     * @param chatroomEntry 要移除的属性信息
     * @param callback
     */
    forceRemoveChatroomEntry(chatRoomId: string, chatroomEntry: IRemoveChatRoomEntryOption, callback: ICallback): void;
    /**
     * 获取聊天室中的指定属性
     * @param chatRoomId 聊天室房间 id
     * @param key 属性键名
     * @param callback
     */
    getChatroomEntry(chatRoomId: string, key: string, callback: ICallback<string>): void;
    /**
     * 获取聊天室内的所有属性
     * @param chatRoomId 聊天室房间 id
     * @param callback
     */
    getAllChatroomEntries(chatRoomId: string, callback: ICallback<{
        [key: string]: string;
    }>): void;
    /**
     * 拉取聊天室内的历史消息
     * @param chatRoomId
     * @param count 拉取消息条数, 有效值范围 1 - 20
     * @param order 获取顺序，默认值为 0。
     * * 0：降序，用于获取早于指定时间戳发送的消息
     * * 1：升序，用于获取晚于指定时间戳发送的消息
     * @param callback
     * @param timestamp v3.0 版本中的新增参数，用于指定拉取消息用到的时间戳。默认值为0，表示按当前时间拉取
     */
    getChatRoomHistoryMessages(chatRoomId: string, count: number, order: 0 | 1, callback: ICallback<IReceivedMessageV2[], boolean>, timestamp?: number): void;
    /**
     * @deprecated
     */
    setDeviceInfo(option: {
        id: string;
    }): void;
    /**
     * 获取当前 IM 连接状态
     */
    getCurrentConnectionStatus(): ConnectionStatus;
    /**
     * 通过 messageUId 删除消息
     * @param conversationType 会话类型
     * @param targetId 会话 id
     * @param messages 要删除的消息 []
     * @param callback
     */
    deleteRemoteMessages(conversationType: ConversationType, targetId: string, messages: IDeleteMessge[], callback: ICallback): void;
    /**
     * 通过时间戳删除消息
     * @param conversationType 会话类型
     * @param targetId 会话 id
     * @param timestamp 清除时间点, 该时间之前的消息将被清除
     * @param callback
     */
    /**
     * 通过时间戳删除消息
     * @param param
     * @param callback
     */
    clearRemoteHistoryMessages(param: IDelteByTime, callback: ICallback): void;
    /**
     * 获取存储服务鉴权信息
     * @param fileType 文件类型
     * @param callback
     * @param fileName 文件名称
     * @param httpMethod STC 分段上传时的必填参数，有效值为 PUT | POST
     * @param queryString STC 分段上传时的查询字符串
     * @description
     * `httpMethod` 与 `queryString` 为 STC S3 分段上传时的专属参数，STC 分段上传包含三个过程：
     * 1. 开始分段前调用，此时 `httpMethod` 值应为 `POST`， `queryString` 值为 `uploads`,filename为空
     * 2. 上传请求前调用，此时 `httpMethod` 值应为 `PUT`，`queryString` 值为 `partNumber={partamNumer}&uploadId={uploadId}`，filename为第一个步骤生成的filename
     * 3. 上传结束前调用，此时 `httpMethod` 值应为 `POST`，`queryString` 值为 `uploadId={uploadId}`，filename为第一个步骤生成的filename
     * @returns
     */
    getFileToken(fileType: FileType, callback: ICallback<IUploadAuth & {
        bos: string;
        qiniu: string;
    }>, fileName?: string, httpMethod?: 'PUT' | 'POST', queryString?: string): void;
    /**
     * 获取文件地址
     * @param fileType 上传类型
     * @param filename 上传后的文件名
     * @param saveName 下载存储文件名
     * @param callback 结果回调函数
     * @param serverType 存储服务标识
     * @param uploadRes 上传插件返回的数据
     */
    getFileUrl(fileType: FileType, fileName: string, saveName: string, callback: ICallback<IGetFileUrl>, uploadRes?: {
        isBosRes: boolean;
        downloadUrl: string;
    }, serverType?: UploadMethod): void;
    /**
     * 创建标签
     * @param tag 标签信息
    */
    createTag(tag: ITagParam, callback: ICallback): void;
    /**
     * 删除标签
     * @param tagId 标签 ID
    */
    removeTag(tagId: string, callback: ICallback): void;
    /**
     * 编辑标签
     * @param tag 标签信息
    */
    updateTag(tag: ITagParam, callback: ICallback): void;
    /**
     * 获取标签列表
    */
    getTagList(callback: ICallback<ITagInfo[]>): void;
    /**
     * 获取会话下的标签
     * @param conversation 会话信息
     */
    getTagsForConversation(conversation: IConversationOption, callback: ICallback<IConversationTag[]>): void;
    /**
     * 添加会话到指定标签
     * @param tagId 标签 ID
     * @param conversations 要添加的会话列表
    */
    addTagForConversations(tagId: string, conversations: IConversationOption[], callback: ICallback): void;
    /**
     * 删除指定标签中会话
     * @param tagId 标签 ID
     * @param conversations 要删除的会话列表
    */
    removeTagForConversations(tagId: string, conversations: IConversationOption[], callback: ICallback): void;
    /**
     * 删除指定会话中标签
     * @param conversation 会话
     * @param tagIds 要删除的标签列表
    */
    removeTagsForConversation(conversation: IConversationOption, tagIds: string[], callback: ICallback): void;
    /**
     * 分页获取标签下会话列表
     * @param tagId 标签id
     * @param count 获取数量
     * @param timestamp 会话时间戳
    */
    getConversationListByTag(tagId: string, count: number, startTime: number, callback: ICallback<IV2ConversationContainTag[]>): void;
    /**
     * 根据标签获取未读消息数
     * @param tagId 标签id
     * @param containMuted 是否包含免打扰
     */
    getUnreadCountByTag(tagId: string, containMuted: boolean, callback: ICallback<number>): void;
    /**
     * 设置标签中会话置顶
     * @param tagId 标签id
     * @param conversation 会话
     * @param status 状态
     */
    setConversationStatusInTag(tagId: string, conversation: IConversationOption, status: {
        isTop: boolean;
    }, callback: ICallback): void;
    /**
     * 调用非标准接口 - 所谓非标准接口，是为某些特定需求或产品临时添加的，暂未采纳为标准接口的方法。
     * @param method 接口定义名称
     * @param callback 回调函数
     * @param args 参数列表
     */
    callExtra(method: string | keyof IExtraMethod, callback: ICallback<unknown, unknown>, ...args: any[]): void;
    /**
     * 是否有远端未读消息 （ C++ ）
     * @description
    */
    hasRemoteUnreadMessages(token: string, callback: ICallback<Boolean>): void;
    /**
     * 设置用户在线状态监听器
    */
    setUserStatusListener(config: {
        userIds: string[];
    }, listener: Function): void;
    /**
     * 设置用户在线状态
     * @param status 在线 10、离开 11、忙碌 12
    */
    setUserStatus(status: number, callback: ICallback<Boolean>): void;
    /**
     * 获取用户在线状态
     * @param userId 用户 ID
    */
    getUserStatus(userId: string, callback: ICallback<{
        status?: number;
    }>): void;
    /**
     * 加入黑名单
     * @param userId 用户 ID
    */
    addToBlacklist(userId: string, callback: ICallback): void;
    /**
     * 将指定用户移除黑名单
     * @param userId 用户 ID
    */
    removeFromBlacklist(userId: string, callback: ICallback): void;
    /**
     * 获取黑名单列表
    */
    getBlacklist(callback: ICallback<string[]>): void;
    /**
     * 获取指定人员在黑名单中的状态
     * @param userId 用户 ID
    */
    getBlacklistStatus(userId: string, callback: ICallback<string>): void;
    /**
     * 向本地插入一条消息，不发送到服务器
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param content 消息体
     * @param callback
    */
    insertMessage(conversationType: ConversationType, targetId: string, content: IReceivedMessageV2, callback: ICallback<IReceivedMessageV2>, options?: IInsertOptions): void;
    /**
     * 获取远端历史消息
     * @param conversationType 会话类型
     * @param targetId 会话 ID
     * @param timestamp 获取时间戳, 0 为从当前时间拉取
     * @param count 拉取条数，获取条数, 范围 1 - 20
     * @param options.order 获取顺序, 默认为 0
    */
    getRemoteHistoryMessages(conversationType: ConversationType, targetId: string, timestamp: number, count: number, callback: ICallback<Array<IReceivedMessageV2>, boolean>, options?: {
        order?: 0 | 1;
    }): void;
    /**
     * 删除本地消息
     * @param _ 会话类型，参数无效
     * @param __ 目标 ID，参数无效
     * @param messageIds 消息 ID 数组
     * @param callback
    */
    deleteLocalMessages(_: ConversationType, __: string, messageIds: number[], callback: ICallback<boolean>): void;
    /**
     * 从本地消息数据库中删除某一会话指定时间之前的消息数据
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param timestamp 指定删除该时间戳之前的消息
     * @param cleanSpace 指定删除该时间戳之前的消息。是否清理数据条目所使用的磁盘空间。清理磁盘空间会阻塞进程且耗时较长，不推荐使用。
     * 数据在被抹除的情况下，未清理的磁盘空间会在后续存储操作中复用，且对数据查询无影响
     * @param callback
    */
    deleteLocalMessagesByTimestamp(conversationType: ConversationType, targetId: string, timestamp: number, cleanSpace: boolean, callback: ICallback<boolean>): void;
    /**
     * 清空会话下历史消息
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param callback
    */
    clearMessages(conversationType: ConversationType, targetId: string, callback: ICallback<boolean>): void;
    /**
     * 获取消息
     * @param messageId 本地消息 ID 或 messageUId
    */
    getMessage(messageId: number, callback: ICallback<IReceivedMessageV2>): void;
    /**
     * 设置消息发送状态
    */
    setMessageSentStatus(messageId: number, sentStatus: number, callback: ICallback<boolean>): void;
    /**
    * 设置消息接收状态
    */
    setMessageReceivedStatus(messageId: number, receivedStatus: number, callback: ICallback<boolean>): void;
    /**
     * 设置消息内容
     * @param messageId 本地消息 ID
     * @param content 消息内容
     * @param objectName 消息类型
    */
    setMessageContent(messageId: number, content: any, objectName: string): void;
    /**
     * 设置消息搜索字段
     * @param messageId 本地消息 ID
     * @param content 消息内容
     * @param searchFiles 搜索字段
    */
    setMessageSearchField(messageId: number, content: any, searchFiles: string): void;
    /**
     * 按内容搜索会话
     * @param keyword 关键字
     * @param conversationTypes 会话类型数组
     * @param customMessageTypes 自定义消息类型,若关键字属于自定义消息类型，需传入
    */
    searchConversationByContent(keyword: string, callback: ICallback<IV2Conversation[]>, conversationTypes?: ConversationType[], customMessageTypes?: string[]): void;
    /**
     * 按内容搜索会话内的消息
     * @param keyword 搜索内容
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param timestamp 搜索时间, 搜索该时间之前的消息
     * @param count 获取的数量
    */
    searchMessageByContent(conversationType: ConversationType, targetId: string, keyword: string, timestamp: number, count: number, total: number, callback: ICallback<IReceivedMessageV2[], number>): void;
    /**
     * 获取会话下所有未读的 @ 消息
     * @param conversationType 会话类型
     * @param targetId 目标 ID
    */
    getUnreadMentionedMessages(conversationType: ConversationType, targetId: string): IReceivedMessageV2[] | null;
    /**
     * 清除时间戳前的未读数
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param timestamp 目标 ID
     * @param callback
    */
    clearUnreadCountByTimestamp(conversationType: ConversationType, targetId: string, timestamp: number, callback: ICallback<boolean>): void;
    /**
     * 获取会话免打扰状态
     * @param conversationType 会话类型
     * @param targetId 目标 ID
     * @param callback
    */
    getConversationNotificationStatus(conversationType: ConversationType, targetId: string, callback: ICallback<NotificationStatus>): void;
    getRTCUserInfoList(room: RTCRoomOption, callback: ICallback<{
        [userId: string]: {
            uris?: string;
        };
    }>): void;
    getRTCUserList(room: RTCRoomOption, callback: ICallback<IRTCUsers>): void;
    setRTCUserInfo(room: RTCRoomOption, info: {
        key: string;
        value: string;
    }, callback: ICallback<boolean>): void;
    removeRTCUserInfo(room: RTCRoomOption, info: {
        keys: string[];
    }, callback: ICallback<boolean>): void;
    getRTCRoomInfo(room: RTCRoomOption, callback: ICallback<IRTCRoomInfo>): void;
    setRTCRoomInfo(room: RTCRoomOption, info: any, callback: ICallback<boolean>): void;
    removeRTCRoomInfo(room: RTCRoomOption, info: any, callback: ICallback<boolean>): void;
    joinRTCRoom(room: RTCRoomOption, callback: ICallback<IJoinRTCRoomData>): void;
    quitRTCRoom(room: RTCRoomOption, callback: ICallback<boolean>): void;
    RTCPing(room: RTCRoomOption, callback: ICallback<boolean>): void;
    setRTCData(roomId: string, key: string, value: string, isInner: boolean, apiType: RTCApiType, callback: ICallback<boolean>, message?: {
        name: string;
        content: string;
    }): void;
    getRTCData(roomId: string, keys: string[], isInner: boolean, apiType: RTCApiType, callback: ICallback<KVString>): void;
    removeRTCData(roomId: string, keys: string[], isInner: boolean, apiType: RTCApiType, callback: ICallback<boolean>, message?: {
        name: string;
        content: string;
    }): void;
    setRTCUserData(roomId: string, key: string, value: string, isInner: boolean, callback: ICallback<boolean>, message?: {
        name: string;
        content: string;
    }): void;
    setRTCUserTotalRes(roomId: string, message: {
        name: string;
        content: string;
    }, valueInfo: string, objectName: string, callback: ICallback<boolean>): void;
    getRTCUserData(roomId: string, keys: string[], isInner: boolean, callback: ICallback<KVString>): void;
    removeRTCUserData(roomId: string, keys: string[], isInner: boolean, callback: ICallback<boolean>, message?: {
        name: string;
        content: string;
    }): void;
    setRTCRoomData(roomId: string, key: string, value: string, isInner: boolean, callback: ICallback<boolean>, message?: {
        name: string;
        content: string;
    }): void;
    getRTCRoomData(roomId: string, keys: string[], isInner: boolean, callback: ICallback<KVString>): void;
    removeRTCRoomData(roomId: string, keys: string[], isInner: boolean, callback: ICallback<boolean>, message?: any): void;
    setRTCOutData(roomId: string, data: any, type: number, callback: ICallback<boolean>, message?: any): void;
    getRTCOutData(roomId: string, userIds: string[], callback: ICallback): void;
    getRTCToken(room: RTCRoomOption, callback: ICallback<IRtcTokenData>): void;
    setRTCState(room: RTCRoomOption, content: {
        report: string;
    }, callback: ICallback<boolean>): void;
}

declare class MessageTag {
    /**
     * 是否计数
     */
    isCounted: boolean;
    /**
     * 是否存储
     */
    isPersited: boolean;
    constructor(
    /**
     * 是否计数
     */
    isCounted: boolean, 
    /**
     * 是否存储
     */
    isPersited: boolean);
}

declare type IRTCConnectionStatusListener = (status: ConnectionStatus) => void;
declare type IRTCMsgListener = (msg: IReceivedMessageV2) => void;
declare type ICallLibReceivedMsgListener = {
    onReceived?: (msg: IReceivedMessageV2) => void;
};
declare const _default$i: {
    /**
      * 初始化 IM SDK
      * @param appkey
      * @param _ 该参数已废弃，为保持向前兼容，保留占位参数
      * @param options
      */
    init(appkey: string, _: void, options?: IInitOption): void;
    /**
     * 单例模式，用于获取 IMClient 实例
     */
    getInstance(): IMClient;
    /**
     * 添加连接状态变更事件监听
     * @param listener
     */
    setConnectionStatusListener(listener: IConnectionStatusListener): void;
    /**
      * 添加消息监听器
      * @param listener
      */
    setOnReceiveMessageListener(listener: IReceiveMessageListener): void;
    /**
     * 会话状态监听器
     * @param listener
    */
    setConversationStatusListener(listener: IConversationStatusListener): void;
    /**
     * 消息扩展监听
    */
    setMessageExpansionListener(listener: IMessageExpansionListener): void;
    /**
     * tag监听
     */
    setTagListener(listener: ITagListener): void;
    /**
     * 会话中tag状态监听
     */
    setConversationTagListener(listener: ITagListener): void;
    /**
     * typing监听
     */
    setTypingStatusListener(listenner: ITypingListener): void;
    /**
      * 连接 IM 服务
      * @param token 用于连接鉴权
      * @param callback 连接状态回调
      */
    connect(token: string, callback: IConnectCallback): Promise<void>;
    /**
     * 重连 im 服务
     * @description Web IM 3.0 开始 SDK 内部会进行自动重连，不需要主动调用此方法。此方法建议主动断开连接后，再次链接时调用。
     * @param callback 重连状态回调
     * @param options 该参数已废弃
     */
    reconnect(callback: IConnectCallback, options?: IReconnectOptions | undefined): void;
    /**
      * 已注册的消息类型定义
      */
    RegisterMessage: {
        [messageType: string]: ThisType<BaseMessage<any>>;
    };
    /**
     * 已注册的消息类型映射
    */
    RegisterMessageTypeMapping: {
        [key: string]: string;
    };
    /**
     * 根据 messageType 获取对应的消息 objectName 值
     * 若无记录，则返回原字符串
     * @param messageType
     * @todo 优化算法
     */
    getMessageObjectName(messageType: string): string;
    /**
      * 注册自定义消息
      * @param messageType v2 中定义的消息类型，如：TextMessage
      * @param objectName 与移动端对齐的消息结构类型，如：RC:TxtMsg
      * @param mesasgeTag 是否存储或计数标记
      * @param searchProps 消息属性名称列表
      */
    registerMessageType(messageType: string, objectName: string, mesasgeTag: MessageTag, searchProps: string[]): void;
    /**
     * 创建 Logger 实例
     * @param tag 标签，以 'RC' 开头的为 SDK 内部使用
     * @returns Logger
     */
    createLogger(tag: string, type: LogType): Logger | null;
    /**
     * RTC Lib 内部使用消息监听器
    */
    messageWatch(watcher: IRTCMsgListener): void;
    /**
     * RTC Lib 内部使用状态监听器
    */
    statusWatch(watcher: IRTCConnectionStatusListener): void;
    /**
     * 兼容 RTC Lib
    */
    MessageType: {
        TextMessage: string;
        ImageMessage: string;
        ReferenceMessage: string;
        DiscussionNotificationMessage: string;
        VoiceMessage: string;
        RichContentMessage: string;
        HandshakeMessage: string;
        UnknownMessage: string;
        LocationMessage: string;
        InformationNotificationMessage: string;
        ContactNotificationMessage: string;
        ProfileNotificationMessage: string;
        CommandNotificationMessage: string;
        CommandMessage: string;
        TypingStatusMessage: string;
        ChangeModeResponseMessage: string;
        ChangeModeMessage: string;
        EvaluateMessage: string;
        HandShakeMessage: string;
        HandShakeResponseMessage: string;
        SuspendMessage: string;
        TerminateMessage: string;
        CustomerContact: string;
        CustomerStatusUpdateMessage: string;
        SyncReadStatusMessage: string;
        ReadReceiptRequestMessage: string;
        ReadReceiptResponseMessage: string;
        FileMessage: string;
        HQVoiceMessage: string;
        GIFMessage: string;
        SightMessage: string;
        AcceptMessage: string;
        RingingMessage: string;
        SummaryMessage: string;
        HungupMessage: string;
        InviteMessage: string;
        MediaModifyMessage: string;
        MemberModifyMessage: string;
        JrmfRedPacketMessage: string;
        JrmfRedPacketOpenedMessage: string;
        GroupNotificationMessage: string;
        PublicServiceRichContentMessage: string;
        PublicServiceMultiRichContentMessage: string;
        PublicServiceCommandMessage: string;
        RecallCommandMessage: string;
        ReadReceiptMessage: string;
        RCCombineMessage: string;
        ChrmKVNotificationMessage: string;
        LogCommandMessage: string;
    };
    /**
     * 兼容 CallLib 消息监听
    */
    _voipProvider: ICallLibReceivedMsgListener;
};

/**
 * 群组内的消息包含的 @ 数据
 */
declare class MentionedInfo {
    type?: MentionedType$1 | undefined;
    userIdList?: string[] | undefined;
    mentionedContent?: string | undefined;
    constructor(type?: MentionedType$1 | undefined, userIdList?: string[] | undefined, mentionedContent?: string | undefined);
}

declare const _default$h: any;

declare const _default$g: any;

declare const _default$f: any;

declare const _default$e: any;

declare const _default$d: any;

declare const _default$c: any;

declare const _default$b: any;

declare const _default$a: any;

declare const _default$9: any;

declare const _default$8: any;

declare const _default$7: any;

declare const _default$6: any;

declare const _default$5: any;

declare const _default$4: any;

declare class Message implements IReceivedMessageV2 {
    conversationType: ConversationType;
    targetId: string;
    senderUserId: string;
    content: Object;
    objectName: string;
    messageType: string;
    messageId: number;
    messageUId: string;
    messageDirection: MessageDirection;
    offLineMessage: boolean;
    sentStatus: SentStatus;
    sentTime: number;
    receivedStatus: ReceivedStatus;
    receivedTime: number;
    canIncludeExpansion: boolean;
    expansion: {
        [key: string]: string;
    };
    receiptResponse: any;
    disableNotification: boolean;
    constructor(conversationType: ConversationType, targetId: string, senderUserId: string, content: Object, objectName: string, messageType: string, messageId: number, messageUId: string, messageDirection: MessageDirection, offLineMessage: boolean, sentStatus: SentStatus, sentTime: number, receivedStatus: ReceivedStatus, receivedTime: number, canIncludeExpansion: boolean, expansion: {
        [key: string]: string;
    }, receiptResponse: any, disableNotification: boolean);
}

declare enum VoIPMediaType {
    MEDIA_AUDIO = 1,
    MEDIA_VEDIO = 2,
    MEDIA_VIDEO = 2
}

declare const AcceptMessage: any;
declare const RingingMessage: any;
declare const SummaryMessage: any;
declare const HungupMessage: any;
declare const InviteMessage: any;
declare const MediaModifyMessage: any;
declare const MemberModifyMessage: any;

declare const _default$3: any;

declare const _default$2: any;

/**
 * 群组 @ 类型
 * V2 与 engine 定义的 MentionedType 不一致，需重新定义
*/
declare enum MentionedType {
    /**
     * 所有人
    */
    ALL = 1,
    /**
     * 部分人
    */
    PART = 2
}

declare const _default$1: any;

declare const _default: any;

declare const ConnectionState: {
    ACCEPTED: number;
    UNACCEPTABLE_PROTOCOL_VERSION: number;
    IDENTIFIER_REJECTED: number;
    SERVER_UNAVAILABLE: number;
    TOKEN_INCORRECT: number;
    NOT_AUTHORIZED: number;
    REDIRECT: number;
    PACKAGE_ERROR: number;
    APP_BLOCK_OR_DELETE: number;
    BLOCK: number;
    TOKEN_EXPIRE: number;
    DEVICE_ERROR: number;
    HOSTNAME_ERROR: number;
    HASOHTERSAMECLIENTONLINE: number;
};

export { AcceptMessage, ChannelClient, ConnectionState, _default$a as FileMessage, _default$8 as GIFMessage, GetChatRoomType, _default$b as HQVoiceMessage, HungupMessage, IV2Conversation as IConversation, IMClient, IReceivedConversationStatus, _default$e as ImageMessage, InviteMessage, _default$g as LocationMessage, MediaModifyMessage, MemberModifyMessage, MentionedInfo, MentionedType, Message, MessageTag, _default as PublicServiceMultiRichContentMessage, _default$1 as PublicServiceRichContentMessage, _default$4 as RCCombineMessage, _default$7 as ReadReceiptMessage, _default$6 as ReadReceiptRequestMessage, _default$5 as ReadReceiptResponseMessage, _default$2 as ReferenceMessage, _default$d as RichContentMessage, RingingMessage, _default$i as RongIMClient, SentStatus, _default$9 as SightMessage, SummaryMessage, _default$3 as SyncReadStatusMessage, _default$h as TextMessage, _default$f as TypingStatusMessage, VoIPMediaType, _default$c as VoiceMessage };
