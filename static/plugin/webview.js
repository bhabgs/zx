/**
 * WebView 交互方法注册
 */
const { ipcRenderer } = require("electron");
const remote = require("@electron/remote");

const registerCallback = {};
const longCallback = {};

window.registerCallback = registerCallback;

/**
 * 向 webview / 指定webContentsId 窗口发送信息
 */
const sendToHost = (...args) => {
  if (window.ipcTargetWebContentsId) {
    if (["ChangeSystemButton"].includes(args[0])) return;
    if (window.ipcTargetIsWin) {
      ipcRenderer.sendTo(window.ipcTargetWebContentsId, ...args);
      return
    }
    // ipcRenderer.sendTo(window.ipcTargetWebContentsId, args[0], { ...args[1], webContentsId: window.myWebContentsId }, ...args.slice(2));
    ipcRenderer.sendTo(window.ipcTargetWebContentsId, "send-by-popup", ...args);
  } else {
    ipcRenderer.sendToHost(...args);
  }
};
/**
 * 生成唯一标记
 * @param {*} zwj
 * @param {*} size
 */
const getRandomId = (zwj = "", size = 4) => {
  const S4 = () =>
    (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  const result = Array.from(new Array(size)).map((a) => S4());

  return result.join(zwj);
};

ipcRenderer.on("send-by-popup", (e, ...args) => {
  sendToHost(...args);
});

ipcRenderer.on("trigger-result", (evt, { type, data, uuid }) => {
  console.log("trigger-result", type, data, uuid, registerCallback);
  let resolve, reject;
  if (uuid && registerCallback[uuid]) {
    resolve = registerCallback[uuid].resolve;
    reject = registerCallback[uuid].reject;
  }
  switch (type) {
    case "todo":
      registerCallback.todoResource &&
        registerCallback.todoResource.resolve &&
        registerCallback.todoResource.resolve(data);
      break;
    case "get-clipboard":
      ipcRenderer.send("get-focus");
      if (Array.isArray(data.data) && data.data.length) {
        data.data = data.data.map((item) => {
          if (item.type === "image") {
            // File类型数据不能通过序列化传递，在此处进行生成
            let content = item.content;
            item.content.file = new File([content.buffer], content.name, {
              type: content.mime,
            });
            delete item.content.buffer;
          }
          return item;
        });
      }
      if (data.code === 0) {
        reject && reject(data.data);
      } else {
        resolve && resolve(data.data);
      }
      break;
    case "OpenFile":
    case "Download":
    case "UploadFile":
    case "DownloadBatch":
    default:
      if (data.code === 0) {
        reject && reject(data);
      } else {
        resolve && resolve(data);
      }
      break;
  }
});

const webview = {
  /**
   *
   * @param {Object} data { url }
   * @argument {String} url  微应用的url
   */
  ManageView(data) {
    sendToHost("ManageView", data);
  },
  /**
   * openFile
   * 预览远程文件
   * @param {Object} data { name, url }
   * @param {string} url 文件远程链接
   * @param {string} name 文件名称，非必传
   * @param {boolean} isEncrypt 是否为加密文件
   * @param {boolean} sign 是否需要oss token签名处理，默认 false不需要
   * @returns {Promise} {code}, code 1, 成功，0失败
   */
  openFile(data) {
    console.log("openFile ", data);
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };
      sendToHost(
        "OpenFile",
        { ...data, webcontentsId: window.myWebContentsId },
        uuid
      );
    });
  },
  /**
   * openLocalPath
   * 打开本地路径
   * @param {string} localPath 本地路径
   * @param {number} operate 操作方式，1--打开文件，2--打开文件所在文件夹
   * @returns {Promise} {code}, code 1, 成功，0失败
   */
  openLocalPath(localPath, operate) {
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };
      sendToHost(
        "OpenLocalPath",
        { localPath, operate, webcontentsId: window.myWebContentsId },
        uuid
      );
    });
  },
  /**
   * download
   * 下载文件
   * @param {Object} data { name, url }
   * @param {String} name 文件名
   * @param {String} url 下载地址
   * @param {boolean} isEncrypt 是否为加密文件
   * @param {boolean} sign 是否需要oss token签名处理，默认 false不需要
   * @returns {Promise} {code}, code 1, 成功，0失败
   */
  download(data) {
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };
      sendToHost(
        "Download",
        { ...data, webcontentsId: window.myWebContentsId },
        uuid
      );
    });
  },
  /**
   * 批量下载
   * @param {*} data
   * @returns
   */
  downloadBatch(data) {
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };
      sendToHost(
        "DownloadBatch",
        { data: data, webcontentsId: window.myWebContentsId },
        uuid
      );
    });
  },
  /**
   *
   * @param {Object} data { type, position }
   * @param {string} type 刷新的类型，data：数据，page：页面
   * @param {string} position 需要刷新的模块，notice：通知
   */
  refreshData(data) {
    sendToHost("Refresh", data);
  },
  /**
   * 关闭当前微应用
   */
  closeApp() {
    sendToHost({ type: "closeApp" });
  },
  /**
   * 修改系统菜单显示隐藏的状态
   * @param {Object} data 参数 { status： }
   * @param {Boolean} status 状态，true：显示，false：隐藏
   */
  changeSystemButton(data) {
    sendToHost("ChangeSystemButton", data);
  },
  /**
   * 将页面输出成PDF
   * @param {string} name 非必传，默认保存时间 文件名,
   * @param {boolean} isSelect 非必传，默认 false，是否让用户选择保存位置
   * @param {number} marginsType 非必传，边距大小，可选值：0--默认边距，1--无边距，2--最小边距
   * @param {string|object} pageSize 非必传，纸张大小，可选值：A3、A4、A5、Legal、Letter、Tabloid、{ width: number, height: number }
   * @param {boolean} printBackground 非必传，默认 true，是否输出css背景
   * @param {boolean} printSelectionOnly 非必传，默认 false，是否只输出用户选择内容
   * @param {boolean} landscape 非必传，默认 false，是否横屏输出
   * @returns {promise} {code, filePath, canceled}, code 1, 成功，0失败，filePath--本地保存文件路径，canceled--是否被取消保存
   */
  printToPDF({
    name,
    isSelect,
    pageSize,
    marginsType,
    printBackground,
    printSelectionOnly,
    landscape,
  } = {}) {
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };
      sendToHost(
        "printToPDF",
        {
          name,
          isSelect,
          pageSize,
          marginsType,
          printBackground,
          printSelectionOnly,
          landscape,
          webcontentsId: window.myWebContentsId,
        },
        uuid
      );
    });
  },
  /**
   * 获取剪切板内容
   * @param {object} data 配置 { selectImgOrText } selectImgOrText--非必传，默认false，遇到内容可选图片或文字时，是否进行选择 ，true进行选择，false不进行选择同时返回两种格式
   * @returns {Promise<object[]>} 返回值为数组，每项 {type, content}, type可能值：text、html、image、File
   */
  getClipboard(data) {
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };
      sendToHost("get-clipboard", data, uuid);
    });
  },
  /**
   * 文件上传
   * @param {string} localPath 文件本地路径，必传
   * @param {boolean} isPub 是否上传公开区(公开区可直接通过链接访问，无需增加token认证)，非必传，默认 false
   * @param {string} folder 上传文件夹，非必传，默认智信聊天上传文件夹
   * @param {boolean} isEncrypt 文件是否加密上传，必传
   *
   * @returns {Object} result 结果，包含 url
   */
  uploadFile({ localPath, isPub = false, folder, isEncrypt }) {
    return new Promise((resolve, reject) => {
      const uuid = getRandomId();
      registerCallback[uuid] = { resolve, reject };

      const data = {
        localPath,
        isPub,
        folder,
        isEncrypt,
        webcontentsId: window.myWebContentsId,
      };
      sendToHost(
        "UploadFile",
        { ...data, webcontentsId: window.myWebContentsId },
        uuid
      );
    });
  },
  /**
   * 图片预览
   * data 参数说明
   * @param {string} type 预览媒体类型，暂时支持图片--image，视频--video
   * @param {number} index 首次展示列表第几个，视频类型预览时默认只展示一个不支持切换，设置无效
   * @param {Array<object>} list 展示数据列表，每项包含以下字段
   *  avatar -- 头像
   *  title -- 标题/文件名
   *  time -- 时间
   *  url -- 预览地址
   *  isPub -- 是否为公共区链接，非公共区链接会做oss token处理
   *  isEncrypt -- 是否为加密文件
   *  describe -- 描述，数组，每项包含：text--描述内容，title-鼠标悬停时展示内容
   *
   */
  async mediaPreview(data) {
    return ipcRenderer.invoke("show-media", data);
  },

  addPushEventListener({ data, success, error }) {
    const event = "pushEvent";
    longCallback[event] = { success, error };
    sendToHost("long-event", { event });
  },
  addRefreshInfoListener({ data, success, error }) {
    const event = "refreshZhiyouInfo";
    longCallback[event] = { success, error };
    sendToHost("refresh-info", { event });
  },
  addRefreshInfoListener({ data, success, error }) {
    const event = "refreshZhiyouInfo";
    longCallback[event] = { success, error };
    sendToHost("refresh-info", { event });
  },
  addChangeRouterListener({ data, success, error }) {
    const event = "changeMailRouter";
    longCallback[event] = { success, error };
    sendToHost("change-mail-router", { event });
  },
  addThemeBgListener({ data, success, error }) {
    const event = "changeThemeBg";
    longCallback[event] = { success, error };
    sendToHost("change-theme-bg", { event });
  },
  //设置智信系统按钮的位置
  setSystemMenuPosition(data) {
    if (data.right && data.top) {
      return sendToHost("set-systemMenu-position", data);
    } else {
      throw new Error("请传入规定的参数");
    }
  },
  /**
   * 设置可拖拽智信窗口区域的位置
   * @param {object} data
   * 以下参数都为必传参数
   * type-标识哪个应用用到 left-距窗口左侧距离 width-可拖拽智信窗口区域的宽度
   */
  setDragBoxPosition(data) {
    if (data.type && data.left && data.width) {
      return sendToHost("set-dragbox-position", data);
    } else {
      throw new Error("请传入规定的参数");
    }
  },
  /**
   * 从其他应用打开查看个人详情界面
   * @param {object} data
   * isOpen必须 true-打开 false-关闭(false时不需要别的参数)
   * isOpen为true时 left、top、right必须-用于打开的位置 user必须-用户信息
   */
  openPersonInfo(data) {
    if (data && !data.isOpen) {
      return sendToHost("open-my-info", data);
    } else if (
      data &&
      data.isOpen &&
      data.left &&
      data.top &&
      data.right &&
      data.user
    ) {
      data.isTarget = false; //与PC端本身打开详情区分
      return sendToHost("open-my-info", data);
    } else {
      throw new Error("请传入规定的参数");
    }
  },
  /**
   * 从其他应用打开查看个人详情界面 (传入webview内页面rect信息)
   * @param {object} data
   * isOpen必须 true-打开 false-关闭(false时不需要别的参数)
   * isOpen为true时 left、top、right必须-用于打开的位置 user必须-用户信息
   */
  openPersonInfoByOriginRect(data) {
    if (data && !data.isOpen) {
      return sendToHost("open-my-info", data);
    } else if (
      data &&
      data.isOpen &&
      data.left &&
      data.top &&
      data.right &&
      data.user
    ) {
      data.isTarget = false; //与PC端本身打开详情区分
      return sendToHost("open-my-info-by-origin-rect", data);
    } else {
      throw new Error("请传入规定的参数");
    }
  },

  /**
   * 图片预览
   * data 参数说明
   * @param {string} type 预览媒体类型，暂时支持图片--image，视频--video
   * @param {number} index 首次展示列表第几个，视频类型预览时默认只展示一个不支持切换，设置无效
   * @param {Array<object>} list 展示数据列表，每项包含以下字段
   *  avatar -- 头像
   *  title -- 标题/文件名
   *  time -- 时间
   *  url -- 预览地址
   *  isPub -- 是否为公共区链接，非公共区链接会做oss token处理
   *  isEncrypt -- 是否为加密文件
   *  describe -- 描述，数组，每项包含：text--描述内容，title-鼠标悬停时展示内容
   *
   */
  transmitMessageFromApp(data) {
    let messageList = [];
    if (Array.isArray(data) && data.length) {
      messageList = [...data];
    } else if (Object.keys(data).length) {
      messageList = [data];
    } else {
      throw new Error("智信暂不支持转发该消息类型");
    }
    // 判断从微应用转发的消息是否为文件、图片或者文本，
    let flag = false;
    flag =
      messageList.findIndex(
        (item) => !["file", "iamge", "text", "applink"].includes(item.transmitType)
      ) < 0;
    if (flag) {
      return sendToHost("transimit-message-app", messageList);
    } else {
      throw new Error("智信暂不支持转发该消息类型");
    }
  },
  /*
   * 弹出无边框窗口
   */
  async popup(url, key, data, options) {
    return await ipcRenderer.invoke("popup", url, key, data, options);
  },
  /**
   * 检查能否弹出窗口
   */
  canPopup() {
    return ipcRenderer.invoke("can-popup");
  },
  /**
   * 获取独立窗口数据
   */
  getMyPopupData() {
    return ipcRenderer.invoke("get-my-popup-data");
  },
  /**
   * 设置独立窗口URL预加载
   */
  setMailPopupURL(url) {
    ipcRenderer.invoke("set-mail-popup-url", url);
  },
  /**
   * 刷新当前微应用
   */
  refreshApp() {
    sendToHost("refresh-app-to-host", {});
  },
  changeActiveMail(type) {
    sendToHost("change-active-mail", type);
  },
  ipcRenderer,
};
window.webview = webview;

ipcRenderer.on("trigger-long-event", (e, { event, data }) => {
  if (longCallback[event] && longCallback[event].success) {
    longCallback[event].success(data);
  }
});
ipcRenderer.on("refresh-zhiyou-info", (e, { event }) => {
  if (longCallback[event] && longCallback[event].success) {
    longCallback[event].success();
  }
});
