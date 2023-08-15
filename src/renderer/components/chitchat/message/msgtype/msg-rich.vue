<template>
  <div
    class="msg-rich"
    :style="{
      'min-height': IsLoad ? '500px' : 'auto'
    }"
  >
    <img
      :src="`data:image/png;base64,${imgData}`"
      @click="showImg()"
      @load="loadHandle($event)"
      @error="errorHandle($event)"
      alt="加载失败"
    />
    <p>来自{{ text }}</p>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { MessageModel } from '../../../../WebIM';
export default {
  name: "MessageRich",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number }
  },
  data() {
    return {
      IsLoad: true
    };
  },
  mounted() {
    if (!this.message.bySelf && this.message.sentStatus === MessageModel.SendStatus.SENT) {
      this.$emit("read", [this.message, this.index]); // 发送已读状态
    }
  },
  computed: {
    text() {
      let text = "";
      if (this.message.content) {
        text = this.message.content.operatorName;
      }
      return text;
    },
    imgData() {
      let data = "";
      if (this.message.content) {
        data = this.message.content.thumbnailImage;
      }
      return data;
    }
  },
  watch: {},
  methods: {
    showImg() {
      this.$emit("showimg", this.message);
    },
    loadHandle() {
      this.IsLoad = false;
      this.$emit("childloaded");
    },
    errorHandle() {
      this.IsLoad = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.msg-rich {
  padding: 10px 15px;
  max-width: 250px;
  word-break: break-word;
  word-wrap: break-word;
  p {
    padding: 10px 0;
  }
  img {
    width: 100%;
    max-width: 400px;
    cursor: pointer;
  }
}
</style>
