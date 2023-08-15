import WebIMConfig from "./IM.config";
import ConnectionStatusListener from "@/WebIM/ConnectionStatusListener";
import ReceiveMessageListener from "@/WebIM/ReceiveMessageListener";
import Emoji from "./emoji";
import CustomMessageConfig from "./message/customMessageConfig";
export default class IMSDKServer {
  constructor(options = {}) {
    // 执行初始化
    const { AppKey } = options;
    RongIMLib.RongIMClient.init(AppKey);
    // 初始化Emoji
    RongIMLib.RongIMEmoji.init(WebIMConfig.EmojiConfig);
    Emoji.init(WebIMConfig.EmojiConfig);
    // 注册自定义消息
    CustomMessageConfig.map(messageConfig => {
      IMSDKServer.registerMessageType(
        messageConfig.messageName,
        messageConfig.objectName,
        messageConfig.messageTag,
        messageConfig.prototypes
      );
    });
    // 设置链接状态监听（status标识当前连接状态）
    // 连接状态监听器
    RongIMClient.setConnectionStatusListener(ConnectionStatusListener);
    // 消息监听器
    RongIMClient.setOnReceiveMessageListener(ReceiveMessageListener);
  }
  /**
   *
   *
   */
  connect(data) {
    const { token } = data;
    const promise = new Promise((resolve, reject) => {
      if (token) {
        let loginOption = {
          onSuccess(...result) {
            resolve(IMSDKServer.LoginSuccessHandler(result));
          },
          onTokenIncorrect(...error) {
            reject(IMSDKServer.LoginTokenIncorrect(error));
          },
          onError(...error) {
            reject(IMSDKServer.LoginErrorHandler(error));
          }
        };
        // 连接服务器
        RongIMLib.RongIMClient.connect(token, loginOption);
      } else {
        reject({ code: "imerror", message: "登录失败, IMTOKEN 不存在" });
      }
    });

    return promise;
  }

  /**
   * 登录成功Callback
   * @param {*} userId
   */
  static LoginSuccessHandler(userId) {
    this.instance = RongIMClient.getInstance();
    return this.instance;
  }
  /**
   * 登录token过期
   */
  static LoginTokenIncorrect(e) {
    return { code: "im_token_invalid", message: "IMTOKEN 无效" };
  }
  /**
   * 登录失败Callback
   */
  static LoginErrorHandler(errorCode) {
    let info = "";
    switch (errorCode) {
      case RongIMLib.ErrorCode.TIMEOUT:
        info = "超时";
        break;
      case RongIMLib.ErrorCode.UNKNOWN:
        info = "未知错误";
        break;
      case RongIMLib.ConnectionState.UNACCEPTABLE_PROTOCOL_VERSION:
        info = "不可接收的协议版本";
        break;
      case RongIMLib.ConnectionState.IDENTIFIER_REJECTED:
        info = "appkey不正确";
        break;
      case RongIMLib.ConnectionState.SERVER_UNAVAILABLE:
        info = "服务器不可用";
        break;
      case RongIMLib.ConnectionState.NOT_AUTHORIZED:
        info = "未认证";
        break;
      case RongIMLib.ConnectionState.REDIRECT:
        info = "重新获取导航";
        break;
      case RongIMLib.ConnectionState.APP_BLOCK_OR_DELETE:
        info = "应用已被封禁或已被删除";
      case RongIMLib.ConnectionState.BLOCK:
        info = "用户被封禁";
        break;
    }
    return { code: errorCode, message: info };
  }

  /**
   * 获取IM实例
   */
  static getInstance() {
    return RongIMLib.RongIMClient.getInstance();
  }

  /**
   * 重连
   * @param {Function} callback 回调函数
   */
  static reconnect(callback) {
    // RongIMLib.RongIMClient.reconnect(callback, WebIMConfig.reconnectConfig);
    RongIMLib.RongIMClient.reconnect(callback);  // 融云SDK2.6已经废弃重连config
  }

  static getConnectStatus() {
    return RongIMLib.RongIMClient.ConnectionStatusListener.ConnectionState;
  }

  /**
   * 清理会话未读数
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   */
  static clearUnreadCount(type, targetId) {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().clearUnreadCount(type, targetId, {
        onSuccess(data) {
          resolve(data);
        },
        onError(error) {
          reject(error);
        }
      });
    });

    return promise;
  }

  /**
   * 获取会话对应的未读
   * @param {Number} type
   * @param {String} targetId
   */
  static getUnreadCount(type, targetId) {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().getUnreadCount(type, targetId, {
        onSuccess: resolve,
        onError: reject
      });
    });

    return promise;
  }

  /**
   * 获取总的未读数
   */
  static getTotalUnreadCount() {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().getTotalUnreadCount({
        onSuccess: resolve,
        onError: reject
      });
    });

    return promise;
  }

  /**
   * 获取会话列表
   * @param {Array} types 会话类型，获取所有会话传null
   * @param {Number} limit 会话数量
   */
  static getConversationList(types = null, limit = 50) {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().getConversationList(
        {
          onSuccess(data) {
            resolve(data);
          },
          onError(error) {
            reject(error);
          }
        },
        types,
        limit
      );
    });

    return promise;
  }

  /**
   * 删除会话（服务器）
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   */
  static removeConversation(type, targetId) {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().removeConversation(type, targetId, {
        onSuccess(data) {
          resolve(data);
        },
        onError(error) {
          reject(error);
        }
      });
    });
    return promise;
  }

  /**
   * 创建会话
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   * @param {String} title 会话标题
   */
  static createConversation(type, targetId, title) {
    // let result = IMSDKServer.getInstance().createConversation(
    //   type,
    //   targetId,
    //   title
    // );
  }

  /**
   * 获取会话信息
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   */
  static getConversation(type, targetId) {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().getConversation(type, targetId, {
        onSuccess(data) {
          resolve(data);
        },
        onError(error) {
          reject(error);
        }
      });
    });

    return promise;
  }

  /**
   * 获取会话对应草稿
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   */
  static getDraft(type, targetId) {
    return IMSDKServer.getInstance().getTextMessageDraft(type, targetId) || "";
  }

  /**
   * 保存会话对应的草稿
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   * @param {String} value 草稿内容
   */
  static setDraft(type, targetId, value) {
    return IMSDKServer.getInstance().saveTextMessageDraft(
      type,
      targetId,
      value
    );
  }

  /**
   * 删除会话对应草稿
   * @param {Number} type 会话类型
   * @param {String} targetId 会话目标id
   */
  static clearDraft(type, targetId) {
    return IMSDKServer.getInstance().clearTextMessageDraft(type, targetId);
  }

  /**
   * 获取会话对应的历史消息
   * @param {*} type 会话类型
   * @param {*} targetId 会话的目标id
   * @param {*} lastTime 最后一条消息时间
   * @param {*} num 一次查询数量，默认20
   */
  static getHistoryMessage(type, targetId, lastTime, num = 20, order = 0) {
    let promise = new Promise((resolve, reject) => {
      IMSDKServer.getInstance().getHistoryMessages(
        type,
        targetId,
        lastTime,
        num,
        {
          onSuccess(data, has) {
            // data: 消息数组，has：是否还有历史消息
            resolve({ data, has });
          },
          onError(error) {
            reject(error);
          }
        },
        null,
        order
      );
    });

    return promise;
  }

  /**
   * 关闭连接
   */
  static disconnect() {
    IMSDKServer.getInstance().disconnect();
  }

  /**
   * 登出
   */
  static logout() {
    try {
      if (RongIMLib && RongIMLib.RongIMClient && IMSDKServer.getInstance()) {
        // 解决切换用户后获取会话列表，会获取到不属于当前用户的会话
        IMSDKServer.getInstance().clearCache();
        IMSDKServer.getInstance().logout();
      }
    } catch (error) {}
  }

  /**
   * 创建讨论组
   * @param {String} name 讨论组
   * @param {Array<String>} userIdList
   */
  // static createDiscussion(name, userIdList) {
  //   let promise = new Promise((resolve, reject) => {
  //     IMSDKServer.getInstance().createDiscussion(name, userIdList, {
  //       onSuccess(data) {
  //         resolve(data);
  //       },
  //       onError(error) {
  //         reject(error);
  //       }
  //     });
  //   });

  //   return promise;
  // }

  /**
   * 讨论组添加人员
   * @param {String} discussionId
   * @param {Array<String>} userIdList
   */
  // static addMemberToDiscussion(discussionId, userIdList) {
  //   let promise = new Promise((resolve, reject) => {
  //     IMSDKServer.getInstance().addMemberToDiscussion(
  //       discussionId,
  //       userIdList,
  //       {
  //         onSuccess(data) {
  //           resolve(data);
  //         },
  //         reject(error) {
  //           reject(error);
  //         }
  //       }
  //     );
  //   });

  //   return promise;
  // }

  // static removeMemberFromDiscussion(discussionId, userId) {
  //   let promise = new Promise((resolve, reject) => {
  //     IMSDKServer.getInstance().removeMemberFromDiscussion(
  //       discussionId,
  //       userId,
  //       {
  //         onSuccess(data) {
  //           resolve(data);
  //         },
  //         onError(error) {
  //           reject(error);
  //         }
  //       }
  //     );
  //   });

  //   return promise;
  // }

  // static setDiscussionName(discussionId, name) {
  //   let promise = new Promise((resolve, reject) => {
  //     IMSDKServer.getInstance().setDiscussionName(discussionId, name, {
  //       onSuccess(data) {
  //         resolve(data);
  //       },
  //       onError(error) {
  //         reject(error);
  //       }
  //     });
  //   });

  //   return promise;
  // }

  // static getDiscussion(discussionId) {
  //   let promise = new Promise((resolve, reject) => {
  //     IMSDKServer.getInstance().getDiscussion(discussionId, {
  //       onSuccess(data) {
  //         resolve(data);
  //       },
  //       onError(error) {
  //         reject(error);
  //       }
  //     });
  //   });

  //   return promise;
  // }

  // static quitDiscussion(discussionId) {
  //   let promise = new Promise((resolve, reject) => {
  //     IMSDKServer.getInstance().quitDiscussion(discussionId, {
  //       onSuccess(data) {
  //         resolve(data);
  //       },
  //       onError(error) {
  //         reject(error);
  //       }
  //     });
  //   });

  //   return promise;
  // }

  /**
   * 注册消息类型，用于注册用户自定义的消息。
   * 内建的消息类型已经注册过，不需要再次注册。
   * 自定义消息声明需放在执行顺序最高的位置（在RongIMClient.init(appkey)之后即可）
   * @param {String} messageType
   * @param {String} objectName 消息内置名称
   * @param {any} messageTag
   * @param {any} messageContent
   */
  static registerMessageType(
    messageType,
    objectName,
    messageTag,
    messageContent
  ) {
    messageTag = new RongIMLib.MessageTag(...messageTag);
    return RongIMLib.RongIMClient.registerMessageType(
      messageType,
      objectName,
      messageTag,
      messageContent
    );
  }

  /**
   * 撤回消息
   * @param {Object} recallMessage
   */
  static setRecallMessage(recallMessage) {
    return new Promise((resolve, reject) => {
      IMSDKServer.getInstance().sendRecallMessage(recallMessage, {
        onSuccess(message) {
          resolve(message);
        },
        onError(errorCode, message) {
          reject({ message: "撤回失败", code: errorCode, data: message });
        }
      });
    });
  }

  /**
   * 清理未读消息
   * @param {Number} conversationType
   * @param {String} targetId
   */
  static clearConversitionUnreadCount(conversationType, targetId) {
    return new Promise((resolve, reject) => {
      IMSDKServer.getInstance().clearUnreadCount(conversationType, targetId, {
        onSuccess(message) {
          resolve(message);
        },
        onError(error) {
          reject({ message: "清除失败", code: errorCode, data: message });
        }
      });
    });
  }

  /**
   * 清理远程消息
   * @param {number} conversationType
   * @param {string} targetId
   * @param {Array} messages
   */
  static clearConversitionRomoteMessages(conversationType, targetId, messages) {
    return new Promise((resolve, reject) => {
      IMSDKServer.getInstance().deleteRemoteMessages(
        conversationType,
        targetId,
        messages,
        {
          onSuccess(message) {
            resolve(message);
          },
          onError(err) {
            reject({ message: "清除失败", code: errorCode, data: message });
          }
        }
      );
    });
  }
}
