<template>
  <div
    class="msg-emoji"
    ref="messageEmoji"
  >
    <template v-for="(row, i) in msgInfo">
      <span
        v-if="row.type === 'txt'"
        :key="i"
      >{{ row.data }}</span>
      <img
        draggable="false"
        v-if="row.type === 'emoji'"
        data-zhixin-emoji-text
        :src="row.data"
        :key="i"
      />
    </template>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { MessageModel } from '../../../../WebIM';
export default {
  name: "MessageEmoji",
  props: { message: { type: Object, default: () => ({}) }, index: {} },
  data() {
    return {};
  },
  mounted() {
    if (!this.message.bySelf && this.message.sentStatus === MessageModel.SendStatus.SENT) {
      this.$emit("read", [this.message, this.index]); // 发送已读状态
    }
    this.$nextTick(() => {
      this.$refs.messageEmoji.innerHTML = this.linkTest(
        this.$refs.messageEmoji.innerHTML
      );
    });
  },
  computed: {
    msgInfo() {
      let info = [];
      if (this.message.body) {
        info = this.message.body.data;
      }
      return info;
    }
  },
  methods: {
    // ...mapActions(),
    linkTest(val) {
      const regex = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
      val = val.replace(regex, e => {
        return `<a target="_blank" href="${e}">${e}</a>`;
      });
      return val;
    }
  }
};
</script>

<style lang="scss" scoped>
.msg-emoji {
  padding: 10px 15px;
  max-width: 100%;
  word-break: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 0;
  span {
    font-size: 13px;
  }
  img {
    width: 24px;
    vertical-align: top;
  }
}
</style>
