<template>
  <section id="webview-wrapper" v-loading="loading">
    <webview
      class="webview"
      ref="webview"
      v-if="url"
      :src="url"
      :useragent="customUserAgent"
      :preload="preloadFile"
      :key="option.id"
      allowpopups
      webpreferences="contextIsolation=0"
      disablewebsecurity
      @load="loadHandle"
      @did-finish-load="didFinishLoadHandler"
      @did-fail-load="didFailLoadHandler"
      @did-start-loading="didStartLoading"
      @did-stop-loading="didStopLoading"
      @dom-ready="domReadyHandle"
      @load-commit="loadCommit"
      @did-frame-finish-load="didFrameFinishLoad"
      @page-title-updated="pageTitleUpdated"
      @page-favicon-updated="pageFaviconUpdated"
      @enter-html-full-screen="enterHtmlFullScreen"
      @leave-html-full-screen="leaveHtmlFullScreen"
      @ipc-message="ipcMessageHandler"
      @new-window="newWinHandler"
      @context-menu="contextMenuHandler"
      @close="closeHandler"
      @crashed="crashedHandle"
      @plugin-crashed="pluginCrashedHandle"
      @destroyed="destroyedHandle"
      @devtools-opened="devtoolsOpenedHandle"
      @devtools-closed="devtoolsClosedHandle"
      @devtools-focused="devtoolsFocusedHandle"
      @console-message="consoleMessageHandle"
      @error="errorHandler"
    ></webview>
    <load-error
      class="load-error"
      :hint="errorText"
      v-show="isLoadError"
      @reload="reloadHandler"
    ></load-error>
  </section>
</template>
<script>
import { mapGetters } from "vuex";
import { ipcRenderer, shell } from "electron";
import path from "path";
import MD5 from "js-md5";
import moment from "moment";
import fs from "fs";
import ClipboardJS from "../../plugin/clipboard";
import OldFileManager from "../../plugin/fileManager";
import FileManager from "../../plugin/file-manage";
const remote = require("@electron/remote");

const appInfo = remote.getGlobal("appInfo");
const wjAppKey = "wj5N0ht7gSeRTjkl1o";
const wjAppSecret = "7PoITRXZiGaHr2CNsYDLeuV9WnE8AhQ3";

const longEventRegister = {};

export default {
  name: "WebviewControl",
  components: {},
  props: {
    option: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      lastURL: "",
      userCode: null,
      url: null,
      loading: false,
      webview: null,
      isLoadError: false, // 是否加载失败
      originUrl: "", // 原始路径
      errorText: "", // 错误提示
      isFullScreen: false,
      isDebugMode: remote.getGlobal("debugMode"),
    };
  },
  created() {
    ipcRenderer.on("maximize-change", (event, { status }) => {
      if (!status && this.webview && this.isFullScreen) {
        try {
          this.webview.executeJavaScript("document.exitFullscreen();");
        } catch (error) {}
      }
    });
    window.addEventListener("dispath-app-push", this.appPushHandle);
  },
  mounted() {
    if (this.option.loadPCUrl) {
      this.loadUrl();
    }
    this.$root.$on("refreshAvatar", this.refreshZhiyouInfo);
  },
  activated() {
    if (this.option.loadPCUrl) {
      this.loadUrl();
    }
  },
  beforeDestroy() {
    window.removeEventListener("dispath-app-push", this.appPushHandle);
    this.$root.$off("refreshAvatar", this.refreshZhiyouInfo);
  },
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany",
      GetUser: "GetUser",
      allCompany: "GetAllCompany",
    }),
    LoginCompany() {
      let result = {};
      if (this.net_type == "1") {
        result = this.GetCompany;
      } else if (this.allCompany.length) {
        if (this.GetCompany) {
          result = this.GetCompany;
        } else {
          result = this.allCompany[0];
        }
      }
      return result;
    },
    customUserAgent() {
      let userAgent = navigator.userAgent;
      userAgent += ` ZhiXinPC/${appInfo.version} ${appInfo.appTypeName}`;
      return userAgent;
    },
    preloadFile() {
      // 北森人事系统不加载preload
      if (this.url.includes("/api/beisen/v1")) return null;
      let fileUrl = `file://${path.resolve(
        __dirname,
        "static/plugin/webview.js"
      )}`;

      if (process.env.NODE_ENV === "development") {
        fileUrl = `file://${path.resolve("static/plugin/webview.js")}`;
      }
      return fileUrl;
    },
  },
  watch: {},
  methods: {
    loadHandle(...data) {
      this.loading = false;
      this.$emit("domready");
    },
    /**
     * @description 资源加载成功
     */
    didFinishLoadHandler(...data) {
      this.loading = false;
      const webview = this.$refs.webview;
      this.webview = webview;
      // webview && webview.openDevTools();
      if (this.isDebugMode) {
        this.$refs.webview.openDevTools();
      }
    },
    /**
     * @description 资源加载失败
     */
    didFailLoadHandler(...data) {
      this.showPageErrorHande();
    },
    /**
     * @description 开始加载url
     */
    didStartLoading(...data) {
      this.isLoadError = false;
      // const webview = this.$refs.webview;
      // this.webview = webview;
      // webview && webview.openDevTools();
    },
    /**
     * 停止加载
     */
    didStopLoading(...data) {
      this.$emit("did-stop-loading");
    },
    domReadyHandle() {
      this.loading = false;
    },
    loadCommit(...data) {},
    didFrameFinishLoad(...data) {
      console.log("didFrameFinishLoad", data);
    },
    pageTitleUpdated(...data) {
      console.log("pageTitleUpdated", data);
    },
    pageFaviconUpdated(...data) {},
    enterHtmlFullScreen(...data) {
      this.isFullScreen = true;
      window.dispatchEvent(
        new CustomEvent("webview-fullscreen", { detail: { status: true } })
      );
    },
    leaveHtmlFullScreen(...data) {
      this.isFullScreen = false;
      window.dispatchEvent(
        new CustomEvent("webview-fullscreen", { detail: { status: false } })
      );
    },
    consoleMessageHandle(e) {
      console.log("consoleMessageHandle", e);
    },
    /**
     * 页面崩溃
     */
    crashedHandle(...data) {
      console.log("crashedHandle", data);
      this.showPageErrorHande(2);
    },
    pluginCrashedHandle(...data) {},
    destroyedHandle(...data) {
      console.log("destroyedHandle", data);
    },
    devtoolsOpenedHandle(...data) {},
    devtoolsClosedHandle(...data) {},
    devtoolsFocusedHandle(...data) {},
    errorHandler(e) {
      console.log("errorHandler", e);
    },
    newWinHandler(e) {
      // webview 执行window.open
      // window.open(e.url);
      console.log("new window", e);
    },
    loadUrl(url = this.option.loadPCUrl) {
      this.lastURL = url;
      if (url.includes("sobot.com/chat")) {
        this.disposeZhiChi(url);
      } else if (url.includes("wj_appkey=")) {
        this.getWenjuanUrl(url);
      } else {
        this.loading = true;
        this.url = "";
        this.originUrl = url;
        const data = {
          corpId: this.LoginCompany.corpId,
        };
        if (!this.option.noStatis) {
          data.appId = this.option.id;
        }
        this.$service.getUserCode
          .call(this, data)
          .then((res) => {
            this.userCode = res.data;
            let format = this.formatURL(url);
            if (this.option.pcIsOpenByOuter) {
              shell.openPath(format);
              this.$emit("close");
            } else {
              this.url = format;
            }
          })
          .catch((err) => {
            this.showPageErrorHande();
          });
      }
    },
    //问卷网url参数修改
    getWenjuanUrl(url) {
      const { accountId, corpId } = this.LoginCompany;
      let wj_timestamp = Math.floor(Date.now() / 1000) + "";
      let wj_signature = MD5(wjAppKey + wj_timestamp + accountId + wjAppSecret);
      let formatUrl =
        url.indexOf("?") > 0 ? url.substr(0, url.indexOf("?")) : url;
      formatUrl = `${formatUrl}?wj_appkey=${wjAppKey}&wj_user=${accountId}&wj_timestamp=${wj_timestamp}&wj_signature=${wj_signature}`;
      this.url = formatUrl;
    },
    formatURL(url) {
      let result = url;
      if (result.includes("userCode=_userCode")) {
        result = result.replace("_userCode", this.userCode);
      } else if (url.includes("?")) {
        result = `${url}&userCode=${this.userCode}`;
      } else {
        result = `${url}?userCode=${this.userCode}`;
      }

      result += `&corpId=${this.LoginCompany.corpId}&netType=${
        this.net_type || 1
      }&clientType=${this.$apipath.clientType}`;
      if (this.option && this.option.id) {
        result += `&appId=${this.option.id}`;
      }

      return result;
    },
    async ipcMessageHandler(event) {
      const _this = this;
      const channel = event.channel;
      const data = event.args[0];
      const uuid = event.args[1];
      const { $Message } = this;
      let retrunData;
      const sendToWebContents = data.webcontentsId
        ? ipcRenderer.sendTo.bind(ipcRenderer, data.webcontentsId)
        : this.webview && this.webview.send.bind(this.webview);
      switch (channel) {
        case "ManageView": // 打开新的页面
          this.$emit("manageView", data);
          break;

        case "OpenFile":
          if (data && data.url) {
            let result = await FileManager.openRemoteFile(data);
            retrunData = result;
          } else {
            retrunData = { code: 0, type: "OpenError", message: "url为空" };
          }
          sendToWebContents("trigger-result", {
            type: "OpenFile",
            data: retrunData,
            uuid,
          });
          break;
        case "OpenLocalPath":
          if (data && data.localPath) {
            let result = await FileManager.openLocalPath(data);
            retrunData = {
              code: 1,
              type: "success",
              message: "success",
              ...result,
            };
          } else {
            retrunData = { code: 0, type: "NullPath", message: "path为空" };
          }
          sendToWebContents("trigger-result", {
            type: "OpenLocalPath",
            data: retrunData,
            uuid,
          });
          break;
        case "Download":
          // 下载
          if (Array.isArray(data.url)) {
            this.oldDownloadFile(data, uuid);
          } else {
            if (data && data.url) {
              let result = await FileManager.downloadFile(data);
              retrunData = { ...result, localPath: result.filePath };
            } else {
              retrunData = { code: 0, type: "NullURL", message: "url为空" };
            }
            sendToWebContents("trigger-result", {
              type: "Download",
              data: retrunData,
              uuid,
            });
          }
          break;
        case "DownloadBatch":
          // 批量下载
          let fileList = [];
          let name = ""; //文件重命名
          let allowCancel; //是否允许取消
          let downloadType; //下载类型，zip表示批量下载后的文件打成压缩包；folder表示批量下载后文件保持不变
          let showAsOneFile; // true表示进度条只展示最终文件夹或压缩文件的名称；false表示逐一展示下载文件的名称
          if (Array.isArray(data.data)) {
            fileList = data.data;
          } else {
            fileList = (data.data && data.data.fileList) || [];
            name = (data.data && data.data.name) || "";
            allowCancel = data.data && data.data.allowCancel;
            downloadType = data.data && data.data.downloadType;
            showAsOneFile = data.data && data.data.showAsOneFile;
          }
          if (allowCancel == null) {
            allowCancel = true;
          }
          if (downloadType == null) {
            downloadType = "zip";
          }
          if (showAsOneFile == null) {
            showAsOneFile = false;
          }
          if (Array.isArray(fileList)) {
            const errorFile = fileList.find((item) => !item.url);
            if (errorFile && Object.keys(errorFile).length) {
              retrunData = {
                code: 0,
                type: "NullURL",
                message: `${errorFile.name}的url为空，无法下载`,
              };
            } else {
              let result = await FileManager.downloadFileBatch({
                fileList,
                name,
                allowCancel,
                downloadType,
                showAsOneFile,
              });
              retrunData = { code: 1 };
            }
          }
          sendToWebContents("trigger-result", {
            type: "DownloadBatch",
            data: retrunData,
            uuid,
          });
          break;
        case "closeApp":
          this.$emit("close");
          break;

        case "Refresh":
          this.$emit("refresh", data);
          break;

        case "ChangeSystemButton":
          this.$emit("ChangeSystemButton", data);
          break;

        case "printToPDF":
          retrunData = await this.printToPDFHandle(data);
          this.webview.send("trigger-result", {
            type: "printToPDF",
            data: retrunData,
            uuid,
          });
          break;

        case "UploadFile":
          if (data && data.localPath) {
            try {
              let result = await FileManager.uploadFile(data);
              retrunData = { code: 1, ...result };
            } catch (error) {
              retrunData = { code: 0, error };
            }
          } else {
            retrunData = { code: 0, type: "NullPath", message: "path为空" };
          }
          sendToWebContents("trigger-result", {
            type: "UploadFile",
            data: retrunData,
            uuid,
          });
          break;
        case "get-clipboard":
          retrunData = {};
          retrunData.data = await ClipboardJS.readData(data);
          retrunData.code = 1;
          sendToWebContents("trigger-result", {
            type: "get-clipboard",
            data: retrunData,
            uuid,
          });

        case "long-event":
          // 长监听事件
          longEventRegister[data.event] = true;
          break;

        case "refresh-info":
          // 长监听事件
          longEventRegister[data.event] = true;
          break;
        case "change-mail-router":
          // 长监听事件
          longEventRegister[data.event] = true;
          break;
        case "change-theme-bg":
          // 长监听事件
          longEventRegister[data.event] = true;
          break;

        case "set-systemMenu-position":
          this.$emit("setSystemMenuPosition", data);
          break;
        case "set-dragbox-position":
          window.eventHub.$emit("setDragBoxPositionWay", data);
          break;
        case "open-my-info":
          window.eventHub.$emit("change-user-dialog", {
            show: data.isOpen,
            evt: data,
            user: data.user,
            isTarget: data.isTarget,
          });
          break;
        case "open-my-info-by-origin-rect":
          const { x: xOffset, y: yOffset } =
            this.$refs.webview.getBoundingClientRect();
          window.eventHub.$emit("change-user-dialog", {
            show: true,
            evt: {
              ...data,
              x: data.x + xOffset,
              left: data.x + xOffset,
              right: data.right + xOffset,
              y: data.y + yOffset,
              top: data.y + yOffset,
            },
            user: data.user,
            isTarget: data.isTarget,
          });
          break;
        case "refresh-app-to-host":
          ipcRenderer.invoke(
            "close-app-popups",
            event.target.getWebContentsId()
          );
          this.loadUrl(this.option.loadPCUrl || this.lastURL);
          break;
        case "transimit-message-app":
          window.eventHub.$emit("transimit-message-app", data);
          break;
        case "change-active-mail":
          window.eventHub.$emit("change-active-mail", data);
          break;
        default:
          break;
      }
    },
    contextMenuHandler(event) {
      const { params, target: webview } = event;
      const { x, y, selectionText, isEditable, editFlags } = params;
      const { canCopy, canPaste, canDelete, canSelectAll } = editFlags;
      let template = [];
      canCopy && template.push({ label: "复制", click: () => webview.copy() }); // 复制
      canPaste &&
        template.push({ label: "粘贴", click: () => webview.paste() }); // 粘贴
      if (isEditable) {
        canDelete &&
          template.push({ label: "删除", click: () => webview.delete() }); // 可编辑状态下删除
        canSelectAll &&
          template.push({ label: "全选", click: () => webview.selectAll() }); // 可编辑状态下全选
      }
      if (template.length) {
        const menu = remote.Menu.buildFromTemplate(template);
        menu.popup({ x, y });
      }
    },
    closeHandler(e) {
      this.$emit("close", e);
    },
    clearUrl() {
      const webview = this.$refs.webview;
      webview.src = "";
      this.url = "";
      this.originUrl = "";
    },
    /**
     * @description 重新加载
     */
    reloadHandler() {
      this.loadUrl(this.originUrl);
    },
    /**
     * 显示错误页面
     * @param type 错误类型 1-加载错误，2-页面崩溃
     */
    showPageErrorHande(type = 1) {
      this.loading = false;
      this.isLoadError = true;
      this.errorText =
        type === 2 ? "页面崩溃，请重新加载" : "加载失败，请刷新重试";
    },
    /**
     * 智齿客服处理
     */
    disposeZhiChi(url) {
      const { accountId, corpId } = this.LoginCompany;
      let formatURL = url.replace("_accountId", accountId);
      this.url = formatURL;
    },
    /**
     * 将当前页面保存为PDF
     * @param {string} name
     */
    async printToPDFHandle({
      name,
      isSelect = false,
      landscape = false,
      printBackground = true,
      printSelectionOnly = false,
      pageSize,
      marginsType,
      webcontentsId,
    } = {}) {
      let result = { code: 0, canceled: false };
      let filePath;
      name = name || moment().format("YYYYMMDDHHmmss");
      if (name.substr(-4).toLocaleLowerCase() !== ".pdf") {
        name += ".pdf";
      }
      if (isSelect) {
        let selected = await ipcRenderer.invoke("save-dialog", {
          name,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        if (selected.canceled) {
          result = { code: 0, canceled: selected.canceled };
        } else {
          filePath = selected.filePath;
        }
      } else {
        filePath = await ipcRenderer.invoke("app-get-path", "downloads");
        filePath = FileManager.getDefaultFilePath(filePath, name);
      }
      result.filePath = filePath;
      if (filePath) {
        try {
          let option = {
            landscape,
            printBackground,
            printSelectionOnly,
          };
          [0, 1, 2].includes(marginsType) && (option.marginsType = marginsType);
          pageSize && (option.pageSize = pageSize);
          const ctx = webcontentsId
            ? remote.webContents.fromId(webcontentsId)
            : this.webview;
          let buf = await ctx.printToPDF(option);
          await fs.promises.writeFile(filePath, buf, { encoding: "utf8" });
          result.code = 1;
        } catch (error) {
          console.error(error);
          result.code = 0;
          result.type = "SaveError";
        }
      }
      return result;
    },
    oldDownloadFile(data, uuid) {
      const _this = this;
      OldFileManager.download({
        ...data,
        success(mes, chosedPath) {
          $Message.success({
            content: mes,
          });
          const data = { code: 1, type: "success", localPath: chosedPath };
          _this.webview.send("trigger-result", {
            type: "Download",
            data,
            uuid,
          });
        },
        error() {
          $Message.warning({
            content: "下载失败",
          });
          const data = { code: 0, type: "error" };
          _this.webview.send("trigger-result", {
            type: "Download",
            data,
            uuid,
          });
        },
        cancel() {
          $Message.info({
            content: "取消下载",
          });
          const data = { code: 1, type: "cancel" };
          _this.webview.send("trigger-result", {
            type: "Download",
            data,
            uuid,
          });
        },
      });
    },
    /**
     * 处理推送数据
     */
    appPushHandle(e) {
      const { detail } = e;
      if (this.LoginCompany.corpId !== detail.corpId) {
        return;
      }
      if (detail.type === 8 && this.option.id === "Mail") {
        // 智邮推送
        if (longEventRegister.pushEvent) {
          this.webview.send("trigger-long-event", {
            event: "pushEvent",
            data: detail.extraJson,
          });
        }
      }
    },
    /**
     * 通知智邮更新用户信息
     */
    refreshZhiyouInfo() {
      if (longEventRegister.refreshZhiyouInfo) {
        this.webview.send("refresh-zhiyou-info", {
          event: "refreshZhiyouInfo",
        });
      }
    },
    /**
     *
     */
    changeMailRouter(type) {
      if (longEventRegister.changeMailRouter) {
        if (this.webview) {
          this.webview.send("trigger-long-event", {
            event: "changeMailRouter",
            data: { type },
          });
        }
      }
    },

    setThemeHeaderColor(color) {
      if (longEventRegister.changeThemeBg) {
        if (this.webview) {
          this.webview.send("trigger-long-event", {
            event: "changeThemeBg",
            data: { color },
          });
        }
      }
    }
  },
};
</script>
<style lang="scss">
#webview-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  border: 0;
  overflow: hidden;
  .webview {
    width: 100%;
    height: 100%;
    border: 0;
    overflow: hidden;
    user-select: none;
  }

  .load-error {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
