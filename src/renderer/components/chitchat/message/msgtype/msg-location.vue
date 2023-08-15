<template>
  <div class="msg-location">
    <p>{{ text }}</p>
    <img
      :src="`data:image/png;base64,${imgData}`"
      :alt="message.content.poi"
      @load="loadHandle($event)"
      @error="errorHandle($event)"
    />
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { MessageModel } from '../../../../WebIM';
export default {
  name: "MessageLocation",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number }
  },
  data() {
    return {};
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
        text = this.message.content.poi;
      }
      return text;
    },
    imgData() {
      let data = "";
      if (this.message.content) {
        data = this.message.content.content || this.message.content.extra;
      }
      return data;
    }
  },
  watch: {},
  methods: {
    loadHandle() {
      this.$emit("childloaded");
    },
    errorHandle() {}
  }
};
</script>

<style lang="scss" scoped>
.msg-location {
  padding: 10px 15px;
  max-width: 250px;
  word-break: break-word;
  word-wrap: break-word;
  p {
    padding: 10px 0;
  }
  img {
    width: 100%;
    max-width: 100%;
  }
}
</style>
