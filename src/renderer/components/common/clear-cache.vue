<template>
  <section class="clear-cache">
    <div class="clear-cache-mask" @click.stop="closeHandler"></div>
    <div class="clear-cache-body">
      <div class="clear-cache-body-header">
        <div class="clear-cache-body-title">清理缓存</div>
        <button
          class="close-button"
          type="button"
          @click.stop="closeHandler"
        ></button>
      </div>
      <div class="cache-size">{{ cacheSize }} <span class="unit">MB</span></div>
      <p class="cache-describe">
        本地缓存的图片、视频、文件等会被清理，但云端同步内容不受影响，您仍可在对话聊天记录中找到。
      </p>
      <button
        class="clear-button"
        type="button"
        @click.stop="clearCache"
        v-if="!isDeleting && Number(cacheSize) > 0"
      >
        一键清理
      </button>
      <button class="clear-button loading" v-if="isDeleting" type="button">
        <i class="el-icon-loading"></i>正在清理
      </button>
      <span class="clear-button clear-text" v-if="isNullOrogin">无需清理</span>
      <span
        class="clear-button clear-text"
        v-if="!isNullOrogin && !isDeleting && Number(cacheSize) === 0"
        >清理完成！</span
      >
    </div>
  </section>
</template>

<script>
import utils from "../../../modules/utils";
import path from "path";
import { log } from "util";
import { promises, writeFileSync, renameSync, unlink, unlinkSync } from "fs";
const remote = require("@electron/remote");
import { ipcRenderer } from "electron";

export default {
  name: "ClearCache",
  data() {
    return {
      cacheSize: "",
      isDeleting: false,
      isNullOrogin: false, //初始化时没有无需清理
    };
  },
  mounted() {
    let ignoreList = localStorage.getItem("ignoreList") || []; //从localstorage中读取不能删除的文件名称
    this.getCacheSize(ignoreList, "start");
  },
  methods: {
    closeHandler() {
      this.$emit("close");
    },
    /**
     * 清除缓存时清除登录相关的storage
     */
    removeAboutLogin() {
      ["login_key", "remember_pwd", "net_address", "net_port"].forEach(
        (item) => {
          localStorage.removeItem(item);
        }
      );
    },
    async clearCache() {
      this.removeAboutLogin();
      this.isDeleting = true;
      const codeCachePath = path.join(utils.appDataDir, "Code Cache");
      let ignoreCodeCache = [];
      try {
        ignoreCodeCache = await utils.delDir(codeCachePath, false); //删除代码缓存保存不能删除的文件
        await remote.session.defaultSession.clearCache(); //删除文件缓存保存不能删除的文件
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => {
          this.isDeleting = false;
          this.getCacheSize(ignoreCodeCache, "clear");
        }, 300);
      }

      try {
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => {
          this.isDeleting = false;
          this.getCacheSize();
          ipcRenderer.invoke("sqlite-clear");
        }, 300);
      }
    },
    /**
     * 获取文件尺寸
     */
    async getCacheSize(ignoreList = [], type) {
      try {
        this.isNullOrogin = false;

        localStorage.setItem("ignoreList", JSON.stringify(ignoreList)); //将不能删除的文件保存到localstorage下次获取缓存文件时排除不能删除文件
        const codeCachePath = path.join(utils.appDataDir, "Code Cache");
        let codeCachePathFiles = utils.getDirSize(codeCachePath, ignoreList);
        let fileList = codeCachePathFiles;
        let res = fileList.reduce((total, file) => {
          return total + file.size;
        }, 0);
        let size = await remote.session.defaultSession.getCacheSize();
        size = size + res;
        size = (size / 1024 / 1024).toFixed(2);
        this.cacheSize = size;
        if (type == "start") {
          if (Number(this.cacheSize) === 0) {
            this.isNullOrogin = true;
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>

<style lang="scss">
.clear-cache {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  &-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
  }
  > * {
    flex-shrink: 0;
  }
  &-body {
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
    &-title {
      margin: 8px auto;
      font-size: 12px;
      color: #333;
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
    .cache-size {
      margin-top: 50px;
      margin-bottom: 30px;
      font-size: 26px;
      color: #333;
      .unit {
        font-size: 14px;
      }
    }
    .cache-describe {
      text-indent: 2em;
      padding: 0 20px;
      text-align: center;
      font-size: 10px;
      color: #999999;
    }
    .clear-button {
      margin-top: 45px;
      width: 96px;
      height: 24px;
      background: #fff;
      border-radius: 2px;
      border: 1px solid rgba(204, 204, 204, 1);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      color: #333;
      &.loading {
        background: transparent;
        border: none;
        .el-icon-loading {
          margin-right: 5px;
        }
      }
      &.clear-text {
        background: transparent;
        border: none;
        color: #999999;
      }
    }
  }
}
</style>
