<template>
  <div ref="msg-video" class="msg-video">
    <img :src="thumbnailUrl" alt="" srcset="" v-if="!playVideoState" />
    <i
      class="play-btn iconfont icon-play-circle"
      @click="playVideo()"
      v-if="!playVideoState"
    ></i>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { mapActions, mapGetters } from "vuex";
import { MessageModel } from "../../../../WebIM";
import utils from "../../../../plugin/utils";

const { MessageType } = MessageModel;

export default {
  name: "MessageVideo",
  props: {
    message: { type: Object, default: () => ({}) },
    index: {}
  },
  data() {
    return {
      playVideoState: false,
      videoUrl: ""
    };
  },
  created() {},
  mounted() {},
  computed: {
    ...mapGetters(["GetMsgFocusID"]),
    url() {
      let url = "";
      if (this.message.content) {
        url = this.message.content.videoUrl;
      }
      return url;
    },
    thumbnailUrl() {
      let url = "";
      if (this.message.content) {
        url = `data:image/jpeg;base64,${this.message.content.thumbnailImage}`;
      }
      return url;
    },
    isEncrypt() {
      const isEncrypt = [MessageType.ZXEncryptVideoMsg].includes(
        this.message.messageType
      );

      return isEncrypt;
    }
  },
  watch: {
    GetMsgFocusID(value) {
      // 监测用户点击的消息ID，关闭非点击消息的播放动态
      if (this.message.id !== value) {
        if (this.$refs.video) {
          this.$refs.video.pause();
          this.$refs.video.currentTime = 0;
        }
      }
    }
  },
  methods: {
    ...mapActions({ SetMsgID: "SetMsgIDAction" }),
    playVideo() {
      // 视频播放
      this.SetMsgID(this.message.id);
      if (
        !this.message.bySelf &&
        this.message.sentStatus === MessageModel.SendStatus.SENT
      ) {
        this.$emit("read", [this.message, this.index]); // 发送已读状态
      }
      const { messageTime: time, content } = this.message;
      let { name: title, size } = content;
      size = utils.getFileSize(size);
      const data = {
        type: "video",
        list: [
          {
            title,
            time,
            url: this.url,
            isEncrypt: this.isEncrypt,
            describe: [size],
            isPub: false,
            thumb: this.thumbnailUrl
          }
        ]
      };
      ipcRenderer.invoke("show-media", data);
    },
    loadHandle() {},
    playHandle() {
      this.$refs.video.scrollIntoViewIfNeeded(false);
    }
  }
};
</script>

<style lang="scss">
.msg-video {
  position: relative;
  video {
    position: relative;
    max-height: 200px;
    max-width: 200px;
    vertical-align: middle;
    &:focus {
      z-index: 0;
    }
  }
  img {
    max-height: 200px;
    max-width: 200px;
    min-height: 100px;
    min-width: 100px;
    filter: blur(3px);
  }

  .play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 50px;
    color: #fff;
    cursor: pointer;
    &:hover {
      color: #eee;
    }
  }
}
</style>
