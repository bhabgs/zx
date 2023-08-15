<template>
  <section class="about-info">
    <div class="about-info-mask" @click.stop="closeHandler"></div>
    <div class="about-info-body">
      <button
        class="close-button"
        type="button"
        @click.stop="closeHandler"
      ></button>
      <img
        class="logo"
        src="@/assets/image/login/logo.png"
        :alt="appInfo.shortcutName"
      />
      <h6>
        {{ appInfo.shortcutName }}&nbsp;for&nbsp;{{
          appInfo.platform.win32 ? "Win" : "Mac"
        }}
      </h6>
      <p class="version">版本：<span v-text="appInfo.version"></span></p>
      <button
        class="check-button"
        :disabled="isDisable"
        @click.stop="checkHandler"
        v-text="buttonText"
      ></button>
      <p class="download-link" @click="openDownloadLinkHandle" v-text="downloadUrl"></p>
    </div>
  </section>
</template>

<script>
import { dialog, ipcRenderer, shell } from "electron";
const remote = require('@electron/remote');
const appInfo = remote.getGlobal("appInfo");
import semver from "semver";
export default {
  name: "AboutInfo",
  data() {
    return {
      appInfo,
      isDisable: false, // 是否禁用按钮
      isLoading: false, // 是否正在请求版本信息
      versionInfo: {}, // 接口返回的版本信息
      isUpdate: 0, // 是否有新版本可供更新，0：未进行检查，1：有更新，2：无更新
      cacheSize: "", //缓存大小
      downloadUrl: "https://zhixin.zhiguaniot.com/downloads"
    };
  },
  mounted() {
    this.isDisable = false;
  },
  computed: {
    buttonText() {
      const { isLoading, isUpdate } = this;
      let text = "检查更新";
      switch (true) {
        case isLoading:
          text = "检查中...";
          break;

        case isUpdate === 1:
          text = "下载更新";
          break;

        case isUpdate === 2:
          text = "暂无更新";
          break;

        default:
          text = "检查更新";
          break;
      }
      return text;
    }
  },
  methods: {
    closeHandler() {
      this.$emit("close");
      window.eventHub.$emit("native-click");
    },
    async checkHandler() {
      const { $service, appInfo, isUpdate, versionInfo } = this;
      if (isUpdate === 0) {
        this.isDisable = true;
        this.isLoading = true;
        let appVersion = await $service.getAppVersion({}, false);
        this.isLoading = false;
        if (appVersion) {
          this.versionInfo = appVersion;
          this.isUpdate = semver.lt(appInfo.version, appVersion.code) ? 1 : 2;
          this.isUpdate === 1 && (this.isDisable = false);
        }
      } else if (isUpdate === 1) {
        // shell.openExternal(versionInfo.url);
        ipcRenderer.invoke("upgrade-version", {
          url: versionInfo.url,
          closeOther: false
        });
      }
    },
    openDownloadLinkHandle() {
      shell.openExternal(this.downloadUrl);
    }
  }
};
</script>

<style lang="scss">
@import "../../assets/styles/constant.scss";
.about-info {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;

  .about-info-body {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 100000;
    width: 240px;
    height: 320px;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    background-color: #f6f6f6;
    border-radius: 4px;
    box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.24);

    > * {
      flex-shrink: 0;
    }

    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 16px;
      height: 16px;
      background-image: url("~@/assets/image/close_icon.png");
      background-repeat: no-repeat;
      background-size: 10px 10px;
      background-position: center center;
    }

    .logo {
      margin: {
        top: 64px;
        bottom: 25px;
      }
      width: 72px;
      height: 72px;
    }

    h6 {
      font-size: 18px;
      font-weight: 600;
      line-height: 25px;
    }
    .version {
      margin: {
        top: 8px;
        bottom: 24px;
      }
      font-size: 12px;
      line-height: 17px;
    }

    .check-button {
      width: 96px;
      height: 24px;
      line-height: 22px;
      border: 0.5px solid #ccc;
      background-color: #fff;
      border-radius: 2px;
      font-size: 12px;
    }

    .download-link {
      width: 100%;
      padding: 0 25px;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 16px;
      color: $--default-theme-color;
      margin-top: 15px;

      &:hover {
        text-decoration: underline solid $--default-theme-color;
        cursor: pointer;
      }
    }
  }

  .about-info-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
  }
}
</style>
