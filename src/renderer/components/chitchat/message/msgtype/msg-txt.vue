<template>
  <div class="msg-txt" ref="messageText">
    <!-- 判断单个表情做放大效果 -->
    <template
      v-if="
        textContent.emojiContent &&
        textContent.emojiContent.length === 2 &&
        textContent.emojiContent[0].type == 'txt' &&
        textContent.emojiContent[0].content == '' &&
        textContent.emojiContent[1].type == 'emoji'
      "
    >
      <template v-for="(row, index) of textContent.emojiContent">
        <template v-if="row.type === 'txt'">{{ row.content }}</template>
        <img class="big-emoji" :key="index" v-else :src="row.content" :[codeKey]="row.code" />
      </template>
    </template>
    <template v-else-if="textContent.emoji">
      <template v-for="(row, index) of textContent.emojiContent">
        <br
          :key="index"
          v-if="
            row.type === 'txt' && (row.content == '\n' || row.content == '\r' || row.content == '\r\n')
          "
        />
        <template v-else-if="row.type === 'txt'">{{ row.content }}</template>
        <img :key="index" v-else :src="row.content" :[codeKey]="row.code" />
      </template>
    </template>
    <template v-else>{{ textContent.content }}</template>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { Emoji } from "@/WebIM";
import { MessageModel } from "../../../../WebIM";
import utils from "@/plugin/utils";
export default {
  name: "MessageTxt",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number }
  },
  data() {
    return {
      codeKey: Emoji.getCodeKey()
    };
  },
  created() {},
  mounted() {
    if (
      !this.message.bySelf &&
      this.message.sentStatus === MessageModel.SendStatus.SENT
    ) {
      this.$emit("read", [this.message, this.index]); // 发送已读状态
    }
    this.$nextTick(() => {
      this.$refs.messageText.innerHTML = utils.linkTest(
        this.$refs.messageText.innerHTML
      );
    });
  },
  computed: {
    textContent() {
      let text = {};
      if (this.message.content) {
        text = this.message.content;
      }
      return text;
    }
  },
  watch: {},
  methods: {
    ...mapActions(["UpSendStatus"])
  }
};
</script>

<style lang="scss" scoped>
.msg-txt {
  font-size: 13px;
  padding: 10px 15px;
  max-width: 100%;
  min-width: 56px;
  word-break: break-word;
  word-wrap: break-word;
  white-space: pre-wrap;
  image-rendering: -webkit-optimize-contrast;
  .big-emoji {
    width: 44px !important;
    height: 44px !important;
  }
}
</style>
