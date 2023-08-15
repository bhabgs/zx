<template>
  <div class="msg-file">
    <div class="file-info-wrapper">
      <div class="file-icon" :class="fileClass"></div>
      <div class="file-info">
        <p class="file-name" :title="fileName">{{ fileName }}</p>
        <p class="file-size">{{ fileSize }}</p>
      </div>
    </div>
    <div class="file-handle" v-show="!isLoading">
      <button
        class="down-button"
        @click="showFileHandle"
        v-loading="showLoading"
      >
        查看
      </button>
      <button class="down-button" @click="dowloadFile()">
        {{ localPath ? "打开文件夹" : "下载文件" }}
      </button>
    </div>
  </div>
</template>

<script>
import { ipcRenderer, shell } from "electron";
import { MessageModel } from "../../../../WebIM";
import utils from "../../../../plugin/utils";
import { getHashUrl, fileExists } from "../../../../../modules/utils";
const { MessageType } = MessageModel;
import FileManage from "../../../../plugin/file-manage";

export default {
  name: "MessageFile",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number },
    isLoading: { type: Boolean }
  },
  data() {
    return {
      showLoading: false,
      localPath: ""
    };
  },
  created() {},
  mounted() {
    this.checkDownload();
  },
  computed: {
    fileName() {
      let name = "";
      if (this.message.content) {
        name = this.message.content.name;
      }
      return name;
    },
    fileType() {
      let type = "";
      if (this.message.content) {
        if (this.message.content.type) {
          type = this.message.content.type;
        } else {
          const len = this.fileName.lastIndexOf(".");
          type = this.fileName.substr(len + 1);
        }
      }
      return type;
    },
    fileSize() {
      let size = 0;
      if (this.message.content) {
        size = this.message.content.size;
      }
      switch (true) {
        case size < 1000:
          size = `${size} bytes`;
          break;
        case size < 1000000:
          size = `${(size / 1024).toFixed(2)} KB`;
          break;
        case size >= 1000000:
          size = `${(size / (1024 * 1024)).toFixed(2)} MB`;
          break;

        default:
          break;
      }

      return size;
    },
    fileClass() {
      const type = utils.getFileTypeByName(this.fileName);
      let iconClass = utils.getFileIconClass(type);
      if (this.isEncrypt) iconClass = "crypto-file";
      return iconClass;
    },
    isEncrypt() {
      const isEncrypt = [MessageType.ZXEncryptFileMsg].includes(
        this.message.messageType
      );

      return isEncrypt;
    }
  },
  watch: {},
  methods: {
    dowloadFile() {
      if (this.localPath) {
        if (fileExists(this.localPath)) {
          const result = shell.showItemInFolder(this.localPath);
        } else {
          this.$message.error("下载后的文件被移动或删除，请重新下载");
          this.localPath = "";
          const url = this.message.content.fileUrl;
          const key = getHashUrl(url);
          ipcRenderer.invoke("db-del-data", { db: "fileDown", key });
        }
      } else {
        this.$emit("download", this.message, (key, localPath) => {
          this.localPath = localPath;
        });
      }
      if (
        !this.message.bySelf &&
        this.message.sentStatus === MessageModel.SendStatus.SENT
      ) {
        this.$emit("read", [this.message, this.index]); // 发送已读状态
      }
    },
    async showFileHandle() {
      this.showLoading = true;
      try {
        let url = this.message.content.fileUrl;
        let result = await this.$service.getSignedUrlByOss({ url });
        let open = await FileManage.openRemoteFile({
          url: result,
          name: this.message.content.name,
          isEncrypt: this.isEncrypt
        });
        if (open.code === 0 && open.type !== "opening") {
          let text = "文件打开失败";
          if (open.type && open.type === "DownloadErr") {
            text = "文件缓存失败";
          }
          this.$message.error(text);
        }
        this.showLoading = false;
      } catch (error) {
        console.error(error);
      }
    },
    async checkDownload() {
      const url = this.message.content.fileUrl;
      if (url) {
        const key = getHashUrl(url);

        try {
          const result = await ipcRenderer.invoke("db-get-data", {
            db: "fileDown",
            key
          });
          if (result.code === 1 && result.data) {
            this.localPath = result.data;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.msg-file {
  display: flex;
  flex-direction: column;
  width: 244px;

  .file-info-wrapper {
    display: flex;
    padding: 10px {
      right: 20px;
    }
  }

  .file-icon {
    $--width: 30px;
    $--height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 $--width;
    width: $--width;
    height: $--height;
  }
  .file-info {
    flex: 1;
    padding-left: 10px;
    overflow: hidden;
    font-size: 14px;
    .file-name {
      width: 100%;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .file-size {
      color: #999;
      font-size: 12px;
    }
  }
  .file-handle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    border-top: 1px solid #e7e7e7;
    .down-button {
      flex: 1;
      padding: 5px 0;
      background-color: transparent;
      color: $--default-theme-color;
      text-align: center;

      &:first-of-type {
        border-right: 1px solid #e7e7e7;
      }
    }
  }

  ::v-deep .el-loading-mask {
    background-color: transparent;

    .el-loading-spinner {
      margin-top: -13px;
    }

    .circular {
      height: 25px;
      width: 25px;
    }
  }
}
</style>
