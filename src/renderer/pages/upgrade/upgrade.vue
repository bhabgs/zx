<!--
 * @Author: lixiaowei
 * @Date: 2021-01-04 21:14:52
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-15 09:41:42
 * @Description: file content
 * @FilePath: /zx-client-pc/src/renderer/pages/upgrade/upgrade.vue
-->
<template>
  <section class="download-wrap">
    <div class="download-wrap-title">
      <span>系统更新</span>
      <!-- <div class="close-icon" @click="cancelUpdateHandle"></div> -->
    </div>
    <div class="progress-content">
      <a-progress
        v-if="!refresh"
        color="#4498F0"
        size="small"
        :strokeWidth="6"
        :percent="value"
      />
      <div v-else class="progress-content-warning">
        <img src="@/assets/image/warning.svg" alt="" />
        <span>下载失败！</span>
      </div>
    </div>
    <div class="download-wrap-footer">
      <a-button @click="cancelUpdateHandle">取消</a-button>
      <a-button type="primary" @click="openItemInfolder">{{
        refresh ? "重新下载" : "打开文件所在位置"
      }}</a-button>
    </div>
  </section>
</template>

<script>
import { ipcRenderer, shell } from "electron";
const remote = require('@electron/remote');
import path from "path";
import os, { platform } from "os";
const fs = require("fs");
import { spawn } from "child_process";

import { download } from "../../plugin/file-manage/file-manage-tool";

export default {
  name: "Upgrade",
  data() {
    return {
      url: "",
      value: 0,
      filePath: "",
      cancelHandle: {},
      refresh: false
    };
  },
  created() {
    ipcRenderer.on("download", (e, url) => {
      this.url = url;
      this.downloadPackage();
    });
  },
  methods: {
    async downloadPackage() {
      this.refresh = false;
      let self = this;
      try {
        this.filePath = path.join(
          os.tmpdir(),
          decodeURIComponent(path.basename(this.url))
        );
        await download({
          url: this.url,
          filePath: this.filePath,
          progress({ percent, transferred, total }) {
            const progress = Math.floor(percent * 100);
            self.value = progress;
          },
          cancel: this.cancelHandle
        });
        fs.access(this.filePath, fs.constants.F_OK, noExist => {
          if (!noExist) {
            if (platform() === "darwin") {
              shell.openPath(this.filePath);
            } else {
              spawn(this.filePath, { detached: true });
            }
            const app = remote.app;
            setTimeout(() => {
              app.quit();
            }, 1000);
          }
        });
      } catch (e) {
        // 下载失败删除本地缓存文件
        console.error("文件操作失败", e);
        this.refresh = true;
      }
    },
    openItemInfolder() {
      if (this.refresh) {
        this.value = 0;
        this.downloadPackage();
      } else {
        shell.showItemInFolder(this.filePath);
      }
    },
    async cancelUpdateHandle() {
      try {
        // 取消下载
        this.cancelHandle.cancel && this.cancelHandle.cancel();
        //删除未下载完的文件先判断文文件是否存在
        fs.access(this.filePath, fs.constants.F_OK, noExist => {
          if (!noExist) {
            fs.unlinkSync(this.filePath);
          }
        });
        //关闭当前提示弹窗
        ipcRenderer.send("upgrade-close");
      } catch (error) {
        console.log("取消下载失败", error);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
::v-deep * {
  user-select: none;
}
.download-wrap {
  width: 100%;
  height: 160px;
  display: flex;
  border-radius: 4px;
  flex-direction: column;
  .download-wrap-title {
    height: 50px;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 15px;
    color: #1f2329;
    font-size: 18px;
    font-family: PingFangSC-Medium, PingFang SC;
    font-weight: 500;
    -webkit-app-region: drag;
    .close-icon {
      width: 16px;
      height: 16px;
      cursor: pointer;
      background-repeat: no-repeat;
      background-position: center center;
      background-size: 100% 100%;
      background-image: url(~@/assets/image/close.svg);
      &:hover {
        background-image: url(~@/assets/image/close_blue.svg);
      }
    }
  }
  .progress-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 20px;
    -webkit-app-region: drag;
    .progress-content-warning {
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #333333;
      flex: 1;
      display: flex;
      align-items: center;
      img {
        width: 20px;
        height: 20px;
        margin-right: 10px;
      }
    }
  }
  .download-wrap-footer {
    height: 64px;
    flex-shrink: 0;
    align-items: center;
    display: flex;
    justify-content: flex-end;
    padding: 0 10px;
    > button {
      height: 32px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      margin-right: 10px;
    }
  }
}
</style>
