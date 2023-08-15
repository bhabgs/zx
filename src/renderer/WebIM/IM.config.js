export default {
  /**
   * 重连配置
   */
  reconnectConfig: {
    auto: false, // 默认false，true启用自动重连，启用则为必选参数
    // 网络嗅探地址 [http(s)://]cdn.ronghub.com/RongIMLib-2.2.6.min.js 可选
    // url: "cdn.ronghub.com/RongIMLib-2.2.6.min.js",
    // 重试频率 [100, 1000, 3000, 6000, 10000, 180000] 单位为毫秒，可选
    // rate: [100, 1000]
  },
  EmojiConfig: {
    size: 24, // 大小，默认24，建议18-58
    url: "//f2e.cn.ronghub.com/sdk/emoji-48.png", // Emoji背景图片
    lang: "zh", // Emoji对应名称语言，默认zh
    // 扩展表情
    extension: {}
    // 新增Emoji背景图url
    // url: ''
  }
};
