<template>
  <section class="show-media-container" @mouseleave.stop="mouseleaveHandler">
    <header class="show-media-header">
      <div class="header-titile-container" v-if="currentShowData.title">
        <img
          v-if="type === 'video'"
          class="show-media-avatar"
          src="~@/assets/image/common/mark@2x.png"
          alt
        />
        <img
          v-else-if="currentShowData.avatar"
          v-show="!editImage"
          class="show-media-avatar"
          :src="currentShowData.avatar"
          alt
        />
        <img
          v-else
          v-show="!editImage"
          class="show-media-avatar"
          src="~@/assets/image/common/mark.png"
          alt
        />
        <div class="title-detail">
          <p class="show-media-title" :title="currentShowData.title">
            {{ editImage ? currentShowData.groupTitle : currentShowData.title }}
          </p>
          <p class="show-media-describe" v-show="!editImage">
            <span class="time" v-if="currentShowData.time / 1">
              {{ $moment(currentShowData.time / 1).format("YYYY/MM/DD HH:mm") }}
            </span>
            <template v-for="(item, idx) of currentShowData.describe">
              <span
                v-if="typeof item === 'string'"
                :key="idx"
                v-text="item"
              ></span>
              <a-tooltip
                v-show="item.hasOwnProperty('title')"
                :key="`tooltip-${idx}`"
                placement="bottom"
              >
                <template slot="title">
                  <span v-html="item.title"></span>
                </template>
                <span v-text="item.text" class="receiver"></span>
              </a-tooltip>
            </template>
          </p>
        </div>
      </div>
      <div class="header-titile-container" v-else></div>
      <edit-img-box
        v-show="editImage"
        :canvasHasChange="canvasHasChange"
        :editImage="editImage"
        :operate="operate"
        :showSendCurrent="
          currentShowData.transpondData &&
          currentShowData.transpondData.messageId
        "
        @eventHandle="eventHandle"
      ></edit-img-box>
      <div class="operate-container" v-show="!editImage">
        <div class="button-container" v-show="type === 'image'">
          <button
            class="iconfont edit-fangda"
            @click="ZoominHandler()"
            title="放大"
          ></button>
          <button
            class="iconfont icon-button edit-suoxiao"
            @click="ZoomoutHandler()"
            title="缩小"
          ></button>
          <button
            class="iconfont icon-button edit-xuanzhuan"
            @click="RotateHandler()"
            title="旋转"
          ></button>
          <button
            class="iconfont icon-button edit-xiazai"
            @click="downloadFile()"
            title="下载"
          ></button>
          <button
            v-if="operate.includes('transpond')"
            class="iconfont icon-button edit-zhuanfa"
            @click="transpond()"
            title="转发"
          ></button>
          <button
            class="iconfont icon-button edit-image"
            @click="edit($event)"
            title="编辑"
          ></button>
        </div>
        <system-menu class="system-menu" @close="closeHandler"></system-menu>
      </div>
    </header>
    <!-- <edit-img v-show="editImage" :editImage="editImage" :src="fullImage" :editOptions="editImageOptions"></edit-img> -->
    <edit-canvas
      v-show="editImage"
      :editImage="editImage"
      :src="fullImage"
      :editOptions="editImageOptions"
      @editImageHandle="editImageHandle"
      @canvasChange="canvasChange"
    ></edit-canvas>
    <!-- <tui-img-editor v-show="editImage" :editImage="editImage" :src="fullImage" :editOptions="editImageOptions"></tui-img-editor> -->
    <div v-show="!editImage" class="show-media-body">
      <div
        v-show="type === 'image'"
        class="show-img-body"
        @mouseenter="mouseHandler($event, 'enter')"
        @mouseleave="mouseHandler($event, 'leave')"
      >
        <div
          id="imgbox"
          ref="imgbox"
          @contextmenu.prevent.stop="contextMenu($event)"
        >
          <div
            v-loading="loading"
            element-loading-background="rgba(0, 0, 0, 0)"
            class="drag-page"
            :style="`transform: translate3d(${left}px, ${top}px, 0px);`"
          >
            <img
              :src="fullImage"
              ref="img"
              :key="fullImage"
              @DOMMouseScroll.stop="wheelImgHandle($event)"
              @mousewheel.stop="wheelImgHandle($event)"
              @mousedown.stop="mousedownHandler"
              @mousemove.stop="mousemoveHandler"
              @mouseup.stop="mouseupHandler"
              @mouseleave="mouseupHandler"
              @dragstart="dragstartHandler"
              @click.stop.prevent
              @error="loadErrorHandle"
              :style="`transform: scale(${scale}, ${scale}) rotateZ(${rotate}deg);`"
            />
          </div>
        </div>
        <div
          class="switch-btn switch-btn-left iconfont icon-left"
          @click="prevHandle"
          v-show="index && moveLock && isShowSwitchBtn"
        ></div>
        <div
          class="switch-btn switch-btn-right iconfont icon-right"
          @click="nextHandle"
          v-show="index !== showList.length - 1 && moveLock && isShowSwitchBtn"
        ></div>
      </div>
      <div
        v-show="type === 'video'"
        ref="videoPlayerBox"
        class="show-video-body"
        element-loading-background="rgba(0, 0, 0, 0)"
      >
        <div
          v-show="loading"
          v-loading="loading"
          class="loading-box"
          element-loading-background="rgba(0, 0, 0, 0)"
        ></div>
        <video id="video-player" ref="videoPlayer" class="video-js"></video>
      </div>
    </div>
    <transition name="fade">
      <ul
        v-if="IsMenu"
        class="menu-container"
        :style="`top: ${menuTop}px; left: ${menuLeft}px;`"
      >
        <li>
          <button @click="selectMenuHandle('copy')">复制</button>
        </li>
      </ul>
    </transition>
  </section>
</template>

<script>
import { promises as fsPromises } from "fs";
import { ipcRenderer, clipboard, nativeImage } from "electron";
import { MessageModel } from "../../WebIM";
// import videojs from "video.js";
import { localImgToThumbnail } from "../../../lib/utils";
import utils from "../../plugin/utils";
import FileManager from "../../plugin/file-manage";
import path from "path";
import EditImg from "./edit-img";
import EditImgBox from "./edit-img-box";
import EditCanvas from "./edit-canvas";
import FileType from "file-type";
import moment from "moment";
import SystemMenu from "@/components/common/system-menu";
const convert = require('heic-convert');
export default {
  name: "ShowMedia",
  components: {
    SystemMenu,
    EditImg,
    EditImgBox,
    EditCanvas,
  },
  data: () => ({
    cancel: null,
    fullImage: "",
    blobURL: "",
    loading: true,
    moveLock: true, // mousemove锁止
    scale: 1, // 放大倍数
    rotate: 0, // 旋转角度
    left: 0, // 图片定位
    top: 0, // 图片定位
    X: 0, // 鼠标状态
    Y: 0, // 鼠标状态
    mousemoveDebounce: null,
    isShowSwitchBtn: false, // 是否显示切换按钮
    type: "", // 展示类型，video、image
    player: null,
    showList: [],
    currentShowData: {},
    index: 0,
    operate: [],
    editImage: false, // 是否正在编辑图片
    editImageOptions: {
      type: "",
    }, // 编辑的图片参数
    IsMenu: false,
    menuTop: 0,
    menuLeft: 0,
    changeImageData: {}, // 编辑后图片上传后信息
    canvasHasChange: false,
  }),
  created() {
    window.onkeydown = this.windowKeydownHandle;
    // this.mousemoveDebounce = utils.Debounce(this.mousemoveDebounceHandler, 5);
    this.mousemoveDebounce = this.mousemoveDebounceHandler;

    /**
     * data 参数说明
     * @param {string} type 预览媒体类型，暂时支持图片--image，视频--video
     * @param {number} index 首次展示列表第几个，视频类型预览时默认只展示一个不支持切换，设置无效
     * @param {Array<object>} 展示数据列表，每项包含以下字段
     *  avatar -- 头像
     *  title -- 标题/文件名
     *  time -- 时间
     *  url -- 预览地址
     *  isPub -- 是否为公共区链接，非公共区链接会做oss token处理
     *  isEncrypt -- 是否为加密文件
     *  describe -- 描述，数组，每项包含：text--描述内容，title-鼠标悬停时展示内容
     *  fileName -- 文件名
     *  thumb -- 缩略图
     */
    ipcRenderer.on("send-message", (event, data) => {
      this.editImage = false;
      this.disposePlayer();
      const { type, operate, list, index = 0 } = data;
      this.index = index;
      this.type = type;
      this.showList = list || [];
      if (operate && Array.isArray(operate)) {
        this.operate = operate;
      } else {
        this.operate = [];
      }
      this.$nextTick(() => {
        if (type === "video") {
          let url = list[0].url;
          if (url) {
            this.currentShowData = list[0];
            this.disposeVideo(list[0]);
          }
        } else if (type === "image") {
          let current = list[index];
          this.disposeImage(current, index);
        }
        setTimeout(() => {
          ipcRenderer.send("setOpacity")
        }, 100);
      });
    });
  },
  mounted() {
    window.addEventListener("click", this.closeMenu);
    window.addEventListener("resize", this.closeMenu);
    window.addEventListener("resize", () => this.left = this.top = 0);
  },
  beforeDestroy() {
    this.disposePlayer();
  },
  computed: {},
  watch: {
    index() {
      this.disposeImage(this.showList[this.index], this.index);
    },
    blobURL(val, old) {
      if (val !== old) {
        window.URL.revokeObjectURL(old);
      }
    },
  },
  methods: {
    $moment: moment,
    canvasChange(result) {
      this.canvasHasChange = result;
    },
    async editImageHandle(data) {
      // this.$message.destroy();
      this.editImage = false;
      if (data) {
        const { url, type } = data;
        if (url) {
          this.fullImage = url;
        }
        try {
          let type = utils.getFileTypeByName(this.currentShowData.url);
          const fileData = new Buffer(
            url.replace("data:image/jpeg;base64,", ""),
            "base64"
          );
          const uploadResult = await this.$service.ossUploadAli(fileData, {
            type,
            isPub: false,
          });
          this.changeImageData = { ...uploadResult, buffer: fileData };
        } catch (error) {
          console.log("上传图片失败");
        }
        if (type === "copy") {
          ipcRenderer.send("closeWin", type);
        } else if (type === "trans") {
          this.transpond();
        } else if (type === "download") {
          await this.downloadFile();
          ipcRenderer.send("closeWin");
        } else if (type === "send") {
          ipcRenderer.send("closeWin");
          this.sendHandle();
        }
      }
    },
    sendHandle() {
      this.transpond("sendEditImage");
    },
    signUrl(url, type) {
      const postData = { url };
      if (type === "image") {
        postData.process = "image/auto-orient,1";
      }
      return this.$service.getSignedUrlByOss(postData).then((result) => {
        return result;
      });
    },
    prevHandle() {
      if (this.index > 0) {
        this.index -= 1;
      }
    },
    nextHandle() {
      if (this.index < this.showList.length - 1) {
        this.index += 1;
      }
    },
    wheelImgHandle(e) {
      const type = e.type;
      if (type === "DOMMouseScroll") {
        if (e.detail > 0) {
          this.ZoomoutHandler();
        } else if (e.detail < 0) {
          this.ZoominHandler();
        }
      } else {
        if (e.wheelDelta < 0) {
          this.ZoomoutHandler();
        } else if (e.wheelDelta > 0) {
          this.ZoominHandler();
        }
      }
    },
    ZoominHandler() {
      /**
       * 放大
       */
      if (this.scale > 10) {
        return false;
      }
      this.scale += 0.1;
    },
    ZoomoutHandler() {
      /**
       * 缩小
       */
      if (this.scale < 0.3) {
        return false;
      }
      this.scale -= 0.1;
    },
    RotateHandler() {
      this.rotate += 45;
      this.top = 0;
      this.left = 0;
    },
    downloadFile() {
      const { showList, index } = this;
      let data = showList[index];
      let name = data.fileName || path.basename(data.url);
      FileManager.downloadFile({
        url: this.changeImageData.url || data.url,
        isEncrypt: data.isEncrypt,
        name,
        sign: true,
      });
    },
    async transpond(type = "transpond") {
      const data = { ...this.currentShowData };
      if (this.type === "image" && this.changeImageData.buffer) {
        // url替换为编辑后的图片
        const buffer = this.changeImageData.buffer;
        let base64Res = await localImgToThumbnail(Buffer.from(buffer), 10000);
        let type = await FileType.fromBuffer(buffer);
        data.transpondData = {
          ...data.transpondData,
          isEdit: true, // 图片已经被编辑过
          isLocal: true,
          buffer: buffer,
          base64: base64Res,
          showOssUrl: this.changeImageData.url,
          showUrl: base64Res.base64,
          type: type.ext,
          mime: type.mime,
          size: buffer.length,
        };
      }
      ipcRenderer.send("event-transfr", {
        channel: type,
        data,
      });
    },
    eventHandle(options) {
      this.editImageOptions = { ...options };
    },
    edit() {
      this.editImage = true;
    },
    mousedownHandler(e) {
      if (e.button !== 0) {
        return;
      }
      this.closeMenu();
      const evt = e || window.event;
      this.X = evt.x;
      this.Y = evt.y;
      this.moveLock = false;
    },
    mousemoveDebounceHandler(e) {
      /**
       * 移动
       * 计算鼠标移动距离
       * 更改图片位置
       */
      const { moveLock } = this;
      const evt = e || window.event;
      if (moveLock || (evt.x === 0 && evt.y === 0)) {
        return false;
      }

      const moveTop = evt.y - this.Y < 0; // false: 向下移  true: 向上移
      const moveRight = evt.x - this.X > 0; // false: 向左移  true: 向右移

      const { width, height, top, left } = this.$refs.img.getClientRects()[0];

      if (
        height < document.body.clientHeight - 50
          ? // 比窗口矮
            (moveTop && top > 50) ||
            (!moveTop && top + height < document.body.clientHeight)
          : // 比窗口高
            (moveTop && top + height > document.body.clientHeight) ||
            (!moveTop && top < 50)
      ) {
        this.top += evt.y - this.Y;
      }
      if (
        width < document.body.clientWidth
          ? // 比窗口窄
            (!moveRight && left > 0) ||
            (moveRight && left + width < document.body.clientWidth)
          : // 比窗口宽
            (!moveRight && left + width > document.body.clientWidth) ||
            (moveRight && left < 0)
      ) {
        this.left += evt.x - this.X;
      }

      this.Y = evt.y;
      this.X = evt.x;
    },
    mousemoveHandler(e) {
      this.mousemoveDebounce(e);
    },
    dragstartHandler(e) {
      e.preventDefault();
      this.$refs.img.style.cursor = 'grabbing';
    },
    mouseupHandler(e) {
      /**
       * 鼠标释放时
       * 重置鼠标状态
       */
      this.$refs.img.style.cursor = '';
      const evt = e || window.event;
      this.moveLock = true;
      this.X = 0;
      this.Y = 0;
    },
    mouseleaveHandler(e) {
      /**
       * 鼠标离开窗口时
       * 重置鼠标状态
       */
      const evt = e || window.event;
      this.moveLock = true;
      this.X = 0;
      this.Y = 0;
    },
    closeHandler() {
      this.showList.splice(0);
      this.index = 0;
      this.fullImage = "";
      this.disposePlayer();
    },
    mouseHandler(e, type) {
      switch (type) {
        case "enter":
          this.isShowSwitchBtn = true;
          break;
        case "leave":
          this.isShowSwitchBtn = false;
          break;
      }
    },
    loadErrorHandle(e) {
      console.error(e);
    },
    async initVideoPlay(url, thumb) {
      const playSource = { src: url, type: "video/mp4" };
      if (this.player && !this.player.isDisposed()) {
        if (thumb) this.player.poster(thumb);
        this.player.src(playSource);
        this.player.ready(() => {
          this.player.play();
        });
        return;
      }
      const option = {
        controls: true,
        preload: "auto",
        autoplay: true,
        language: "zh_CN",
        muted: false,
        notSupportedMessage: "媒体资源加载错误，请重试",
        controlBar: {
          children: [
            "playToggle",
            "volumePanel",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "progressControl",
            "fullscreenToggle",
          ],
        },
        sources: [playSource],
      };

      if (thumb) option.poster = thumb;

      let video = document.getElementById("video-player");
      if (!video) {
        video = document.createElement("video");
        video.id = "video-player";
        video.className = "video-js";
        this.$refs.videoPlayerBox.appendChild(video);
      }

      const { default: videojs } = await import("video.js");
      this.player = videojs(video, option, () => {
        setTimeout(() => {
          this.player.play();
        }, 30);
      });

      await this.getDownloadVideoButton();
      this.player.getChild("controlBar").addChild("DownloadButton", {}, 10);
    },
    disposePlayer() {
      if (this.player) {
        this.player.dispose();
        this.player = null;
      }
    },
    async disposeVideo(data) {
      this.loading = true;
      try {
        let { url, isPub, isEncrypt } = data;
        this.blobURL = await this.getFileBlobURL(
          url,
          isEncrypt,
          isPub,
          "video/mp4"
        );
        let thumb;
        if (data.thumb) {
          thumb = data.thumb;
          if (
            !thumb.includes("http") &&
            !thumb.includes("data:image/jpeg;base64,")
          ) {
            thumb = "data:image/jpeg;base64," + thumb;
          }
        }
        this.disposePlayer();
        this.initVideoPlay(this.blobURL, thumb);
      } catch (error) {
        console.dir(error);
        this.$message.error("获取数据失败");
      } finally {
        this.loading = false;
      }
    },
    async getFileBlobURL(url, isEncrypt, isPub, type = "image/jpg", local) {
      let result = {};
      if (!local) {
        if (!isPub) {
          url = await this.signUrl(url);
        }
        const progressHandle = (...args) => {
          console.log("args: ", args);
        };
        result = await FileManager.cacheFile({
          url,
          isEncrypt,
          progress: progressHandle,
        });
      } else {
        result.localPath = url;
      }
      let buf = await fsPromises.readFile(result.localPath);
      const fileType = await FileType.fromBuffer(buf);
      let blob = "";
      if(["heic","heif"].includes(fileType.ext)) {
        buf = await convert({
          buffer: buf, // the HEIC file buffer
          format: 'JPEG',      // output format
          quality: 1           // the jpeg compression quality, between 0 and 1
        });
      }
      blob = new Blob([buf], { type });
      let blobURL = window.URL.createObjectURL(blob);
      return blobURL;
    },
    async disposeImage(data, index) {
      this.resetImagePreviewHandle();
      if (data) {
        this.loading = true;
        if (data.thumb) {
          let thumb = data.thumb;
          if (
            !thumb.includes("http") &&
            !thumb.includes("data:image/jpeg;base64,")
          ) {
            thumb = "data:image/jpeg;base64," + thumb;
          }
          this.fullImage = thumb;
        }
        this.currentShowData = data;
        if (data) {
          try {
            let { url, isPub, isEncrypt, path, local } = data;
            let relUrl = local && path ? path : url;
            if (relUrl) {
              this.blobURL = await this.getFileBlobURL(
                relUrl,
                isEncrypt,
                isPub,
                undefined,
                local
              );
              this.index === index && (this.fullImage = this.blobURL);
            }
          } catch (error) {
            console.log(error);
            this.$message.error("获取数据失败");
          }
        }
        this.loading = false;
      }
    },
    async getDownloadVideoButton() {
      const { default: videojs } = await import("video.js");
      let Button = videojs.getComponent("Button");
      let RandomButton = videojs.extend(Button, {
        constructor: function (player, options) {
          Button.apply(this, arguments);
        },
        //自定义组件被点击后的事件
        handleClick: () => {
          this.downloadFile();
        },
        // 创建一个DOM元素
        createEl: function () {
          //这个类名在css中要用到，很重要
          var divObj = videojs.dom.createEl("div", {
            className: "download-button",
          });
          videojs.dom.appendContent(divObj);
          return divObj;
        },
      });
      //注册视频中随机位置滚动的组件
      videojs.registerComponent("DownloadButton", RandomButton);
    },
    resetImagePreviewHandle() {
      this.scale = 1; // 放大倍数
      this.rotate = 0; // 旋转角度
      this.left = 0; // 图片定位
      this.top = 0; // 图片定位
      this.X = 0; // 鼠标状态
      this.Y = 0; // 鼠标状态
      this.changeImageData = {};
    },
    windowKeydownHandle(e) {
      this.closeMenu();
      const { altKey, ctrlKey, keyCode, metaKey, shiftKey } = e;
      if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
        switch (keyCode) {
          case 27:
            // esc
            ipcRenderer.send("closeWin");
            break;
          case 37:
            // 方向键 ←
            this.prevHandle();
            break;
          case 39:
            // 方向键 →
            this.nextHandle();
            break;
        }
      }
    },
    contextMenu(ev) {
      this.IsMenu = false;
      const image = this.showList[this.index];
      if (image.messageType === MessageModel.MessageType.ZXGIFMsg) {
        return;
      }
      let e = ev || window.event;
      this.menuTop = e.clientY;
      this.menuLeft = e.clientX;
      this.IsMenu = true;
    },
    closeMenu() {
      this.IsMenu = false;
    },
    selectMenuHandle(type) {
      this.closeMenu();
      switch (type) {
        case "copy":
          this.setCopyData(this.showList[this.index]);
          break;
        default:
          break;
      }
    },
    async setCopyData(data) {
      let { url, isPub, isEncrypt } = data;
      const progressHandle = (...args) => {
        console.log("args: ", args);
      };
      if (!isPub) {
        url = await this.signUrl(url);
      }
      let result = await FileManager.cacheFile({
        url,
        isEncrypt,
        progress: progressHandle,
      });
      clipboard.writeImage(nativeImage.createFromPath(result.localPath));
      this.$Message.success("复制成功");
    },
  },
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/constant.scss";
.show-media-container {
  .show-media-header {
    ::v-deep .system-menu {
      position: static !important;

      > button {
        color: #333 !important;
        &:hover {
          color: $--default-theme-color !important;
        }
      }
    }
  }
}
</style>
<style lang="scss">
@import "~@/assets/styles/constant.scss";
.show-media-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;

  .show-media-header {
    flex: 0 0 50px;
    padding: 0 10px;
    height: 50px;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #f5f5f5;
    -webkit-app-region: drag;
    > div {
      height: 100%;
    }

    .system-menu {
      position: static !important;

      > button {
        color: #333 !important;
        &:hover {
          color: $--default-theme-color !important;
        }
      }
    }

    .header-titile-container {
      display: flex;
      align-content: center;
      align-items: center;
      flex: 1;
      overflow: hidden;

      .show-media-avatar {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        margin-right: 10px;
        border-radius: 50%;
      }

      .title-detail {
        display: flex;
        flex-direction: column;
        line-height: 1;
        flex: 1;
        overflow: hidden;
        .show-media-describe {
          -webkit-app-region: none;
          user-select: text;
          display: flex;
        }
      }

      .show-media-title {
        max-width: 90%;
        margin-bottom: 2px;
        line-height: 20px;
        height: 20px;
        font-size: 14px;
        color: #333;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .show-media-describe {
        font-size: 0;

        > span {
          display: inline-block;
          height: 16px;
          line-height: 16px;
          font-size: 12px;
          color: #999;

          &:not(:first-of-type) {
            border-left: 1px solid #999;
            margin-left: 5px;
            padding-left: 5px;
          }
          &.time {
            flex-shrink: 0;
          }
          &.receiver {
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  .operate-container {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    justify-content: flex-end;
  }

  .button-container {
    margin: {
      right: 20px;
    }
    display: flex;
    align-items: center;
    justify-content: center;
    > button {
      margin: 0 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: transparent;
      font-size: 14px;
      color: #4e4e4e;
      // &::before {
      //   font-size: 20px;
      // }

      // &:hover {
      //   color: $--default-theme-color !important;
      // }
      width: 20px;
      height: 30px;
      background-position: center center;
      background-size: 100% 66.66%;
      background-repeat: no-repeat;
      &.edit-image {
        background-image: url(~@/assets/image/imgedit/edit_img.svg);
        &:hover {
          background-image: url(~@/assets/image/imgedit/edit_img_blue.svg);
        }
      }
      &.edit-fangda {
        background-image: url(~@/assets/image/imgedit/fangda.svg);
        &:hover {
          background-image: url(~@/assets/image/imgedit/fangda_blue.svg);
        }
      }
      &.edit-suoxiao {
        background-image: url(~@/assets/image/imgedit/suoxiao.svg);
        &:hover {
          background-image: url(~@/assets/image/imgedit/suoxiao_blue.svg);
        }
      }
      &.edit-xuanzhuan {
        background-image: url(~@/assets/image/imgedit/xuanzhuan.svg);
        &:hover {
          background-image: url(~@/assets/image/imgedit/xuanzhuan_blue.svg);
        }
      }
      &.edit-zhuanfa {
        background-image: url(~@/assets/image/imgedit/zhuanfa.svg);
        &:hover {
          background-image: url(~@/assets/image/imgedit/zhuanfa_blue.svg);
        }
      }
      &.edit-xiazai {
        background-image: url(~@/assets/image/imgedit/xiazai.svg);
        &:hover {
          background-image: url(~@/assets/image/imgedit/xiazai_blue.svg);
        }
      }
    }
  }

  .show-media-body {
    flex: 1;
    overflow: hidden;
    > div {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
  }

  .show-video-body {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #222222;
    position: relative;
    .loading-box {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
    > video {
      width: 100%;
      max-width: 100%;
    }

    .video-js {
      max-width: 100%;
      max-height: 100%;
      background-color: #222;
      .vjs-control-bar {
        position: fixed;
      }
      .vjs-current-time {
        display: block;
      }

      .vjs-time-control {
        display: block;
        min-width: auto;
        width: auto;
        padding-left: 2px;
        padding-right: 2px;
      }

      .vjs-duration {
        display: block;
      }

      .download-button {
        width: 28px;
        cursor: pointer;
        background: url("~@/assets/image/common/下载@2x.png") no-repeat center
          center/14px;
      }

      .vjs-big-play-button {
        display: none;
      }
    }
  }

  .show-img-body {
    #imgbox {
      text-align: center;
      overflow: hidden;
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
    }

    .drag-page {
      img {
        max-width: calc(100vw - 110px);
        max-height: calc(100vh - 50px);
        box-shadow: 0 0 15px 0px rgba($color: #000000, $alpha: 0.25);
        cursor: grab;
        transition: 0.5s all cubic-bezier(0.075, 0.82, 0.165, 1);
        backface-visibility: hidden;
        border-style: none;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        background-color: transparent;
        vertical-align: middle;
        image-orientation: 0deg;
      }
    }

    .switch-btn {
      position: absolute;
      top: 50%;
      width: 40px;
      height: 40px;
      z-index: 7;
      font-size: 40px;
      color: rgba(8, 8, 10, 0.4);
      cursor: pointer;
      transform: translateY(-50%);
      overflow: hidden;
      line-height: 1;
      border-radius: 50%;

      &.switch-btn-left {
        left: 15px;
      }
      &.switch-btn-right {
        right: 15px;
      }
    }
  }
  .path {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
    animation: dash 1.5s ease-in-out infinite, color 6s ease-in-out infinite;
    stroke-linecap: round;
  }

  .menu-container {
    // 右键菜单
    position: fixed;
    top: 0;
    z-index: 9999;
    width: 100px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba($color: #000, $alpha: 0.3);
    user-select: none;
    > li {
      width: 100%;
      &:not(:last-of-type) {
        border-bottom: 1px solid #e7e7e7;
      }
      &:hover {
        background-color: $--menu-hover-bgcolor;
      }
      > button {
        width: 100%;
        height: 48px;
        background-color: transparent;
        user-select: none;
      }
    }
  }

  @keyframes rotate {
    to {
      -webkit-transform: rotate(1turn);
      transform: rotate(1turn);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35;
    }
    to {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -124;
    }
  }

  @keyframes color {
    0%,
    to {
      stroke: #d62d20;
    }
    40% {
      stroke: #0057e7;
    }
    66% {
      stroke: #008744;
    }
    80%,
    90% {
      stroke: #ffa700;
    }
  }
}
</style>
