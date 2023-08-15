<template>
  <div class="msg-img clear">
    <img
      ref="img"
      v-show="url"
      :src="url"
      @load="loadHandle($event)"
      @error="errorHandle($event)"
      @loadstart="loadstartHandle"
      @loadeddata="loadeddataHandle"
      alt="加载失败"
      @click="showImg()"
    />
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { MessageModel } from "../../../../WebIM";
const { MessageType } = MessageModel;
import axios from "axios";

export default {
  name: "TransmitMsgImg",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number }
  },
  data() {
    return {
      IsLoad: true,
      FileSizeProgress: {
        loaded: 0,
        total: 0
      },
      isSend: false,
      url: ""
    };
  },
  created() {},
  mounted() {
    this.setThumb();
  },
  beforeDestroy() {
    if (this.url && this.url.includes("blob:")) {
      window.URL.revokeObjectURL(this.url);
    }
  },
  computed: {
    isEncrypt() {
      const isEncrypt = [MessageType.ZXEncryptImgMsg].includes(
        this.message.messageType
      );

      return isEncrypt;
    }
  },
  watch: {},
  methods: {
    loadHandle() {
      this.$emit("childloaded");
      this.IsLoad = false;
    },
    loadeddataHandle() {
      console.log("loadeddata");
    },
    errorHandle() {
      this.IsLoad = false;
      let content = "";
      if(this.message.isEdit) {
        content = this.message.showUrl;
      } else {
        content = this.message.content.content;
      }
      if (content && content.search("http") !== 0) {
        if(content.includes("data:image/jpeg;base64,")) {
          this.url = content;
        } else {
          this.url = "data:image/jpeg;base64," + content;
        }
      }
    },
    loadstartHandle(e) {
      console.log("loadstartHandle image", e);
    },
    showImg() {
      this.$emit("showimg", this.message);
    },
    async setThumb() {
      let content = "";
      if(this.message.isEdit) {
        content = this.message.showUrl;
      } else {
        content = this.message.content.content;
      }
      if (this.url && this.url.includes("blob:")) {
        window.URL.revokeObjectURL(this.url);
      }
      try {
        if (content && content.search("http") !== 0) {
          this.url = "data:image/jpeg;base64," + content;
        }
        if (
          this.message.content.imageUri &&
          this.message.messageType === MessageType.ZXGIFMsg
        ) {
          const ossurl = await this.$service.getSignedUrlByOss({
            url: this.message.content.imageUri
          });
          let result = await axios.get(ossurl, { responseType: "blob" });
          const tmpUrl = window.URL.createObjectURL(result.data);
          result = null;
          this.url = tmpUrl;
        }
      } catch (error) {
      } finally {
        if (!this.url && content && content.search("http") !== 0) {
          if(content.includes("data:image/jpeg;base64,")) {
            this.url = content;
          } else {
            this.url = "data:image/jpeg;base64," + content;
          }
        }
      }
      return url;
    }
  }
};
</script>

<style lang="scss" scoped>
.msg-img {
  position: relative;
  line-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    min-width: 40px;
    min-height: 20px;
    max-height: 158px;
    cursor: zoom-in;
  }
  .loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .loader {
    width: 15px;
    height: 15px;
  }
  .circular {
    margin: auto;
    width: 100%;
    height: 100%;
    animation: rotate 2s linear infinite;
    transform-origin: center center;
  }
  .path {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
    animation: dash 1.5s ease-in-out infinite, color 6s ease-in-out infinite;
    stroke-linecap: round;
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
