<template>
  <div
    class="msg-audio"
    :style="`width: ${boxWidth}px;`"
    :class="{ playing: playState, 'msg-audio-self': message.bySelf }"
  >
    <span
      class="audio-icon iconfont"
      :class="{
        'icon-play-circle': !playState,
        'icon-pause-circle': playState
      }"
      @click="playAudioHandle()"
    ></span>
    <span class="duration">{{ message.content.duration | formatDuration }}</span>
    <span
      v-show="playState"
      class="play-bg"
      :style="`width: ${bgWidth}%`"
    ></span>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { IMVoice } from "@/WebIM";

export default {
  name: "MessageAudio",
  props: { message: { type: Object, default: () => ({}) }, index: {} },
  data() {
    return {
      playState: false,
      progress: 0,
      audio: null
    };
  },
  created() {},
  computed: {
    ...mapGetters(["GetMsgFocusID"]),
    boxWidth() {
      let w = 80;
      if (this.message.content) {
        w += this.message.content.duration;
      }
      w = w > 250 ? 250 : w;
      return w;
    },
    bgWidth() {
      let bgw = Math.floor(
        (this.progress / this.message.content.duration) * 100
      );
      return bgw;
    }
  },
  watch: {
    GetMsgFocusID(value) {
      // 监测用户点击的消息ID，关闭非点击消息的播放动态
      if (this.message.id !== value) {
        this.stopAudio();
      }
    }
  },
  methods: {
    ...mapActions({ SetMsgID: "SetMsgIDAction" }),
    playAudioHandle() {
      if (this.playState) {
        this.pauseAudio();
      } else {
        this.playAudio();
      }
    },
    playAudio() {
      // 播放语音
      let _this = this; // 保存this
      if (!this.message.bySelf && this.message.sentStatus === 30) {
        this.$emit("read", [this.message, this.index]); // 发送已读状态
      }

      this.SetMsgID(this.message.messageUId); // 设置点击消息的ID
      let audioFile = this.message.content.content;
      IMVoice.preLoaded(audioFile).then(res => {
        _this.playState = true; // 更改播放状态
        let audio = IMVoice.play(audioFile);
        _this.audio = audio;
        audio.onerror = function() {
          _this.$Message.error("语音播放失败，请重新播放！");
          _this.playState = false;
          _this.progress = 0;
        };
        audio.onended = function() {
          _this.playState = false;
          _this.progress = 0;
        };
        audio.ontimeupdate = _this.playingHandle;
      });
    },
    pauseAudio() {
      let self = this;
      if (this.audio) {
        this.audio.pause();
        this.audio.onpause = function() {
          self.playState = false;
        };
      }
    },
    stopAudio() {
      this.progress = 0;
      this.playState = false;
      if (this.audio) {
        this.audio.currentTime = 0;
      }
    },
    playingHandle(e) {
      this.progress = e.target.currentTime;
    }
  },
  filters: {
    formatDuration(val) {
      let duration = "";
      if (val <= 60) {
        duration = `${val}"`;
      } else {
        let minute = Math.floor(val / 60);
        let sec = val % 60;
        duration = `${minute}' ${sec}"`;
      }
      return duration;
    }
  }
};
</script>

<style lang="scss" scoped>
.msg-audio {
  position: relative;
  padding: 0 15px;
  width: 100px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .audio-icon {
    font-size: 22px;
    color: #d1d1d1;
    cursor: pointer;
    z-index: 9;
  }
  .duration {
    z-index: 9;
  }

  .play-bg {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: #dfedfa;
    z-index: 1;
  }

  &.msg-audio-self {
    .audio-icon {
      color: #53a1f1;
    }
    .play-bg {
      background-color: #bedcf8;
    }
  }
}
</style>
