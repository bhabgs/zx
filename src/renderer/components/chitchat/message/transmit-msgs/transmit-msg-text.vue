<template>
  <a-tooltip
    placement="top"
    trigger="click"
    @visibleChange="visibleChangeHandle"
    :getPopupContainer="
      triggerNode => {
        return triggerNode.parentNode || document.body;
      }
    "
  >
    <template slot="title">
      <div class="tooltipTitle" ref="tooltipTitle"></div>
    </template>
    <div class="msg-txt" ref="messageText">
      <div class="msg-txt-inner" ref="msgtxtInner">
        <div class="msg-txt-content" v-if="textContent.emoji">
          <template v-for="(row, index) of textContent.emojiContent">
            <span
              :key="index"
              v-if="row.type === 'txt'"
              v-text="row.content"
            ></span>
            <img :key="index" v-else :src="row.content" :[codeKey]="row.code" />
          </template>
        </div>
        <div v-else class="msg-txt-content" >{{ textContent.content }}</div>
      </div>
      <div class="msg-txt-right">
        <i class="icon iconfont icon-jiantou-right"></i>
      </div>
    </div>
  </a-tooltip>
</template>

<script>
import { Emoji } from "@/WebIM";
import utils from "@/plugin/utils";
export default {
  name: "TransmitMsgText",
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
  mounted() {},
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
    visibleChangeHandle(visible) {
      if (visible) {
        this.$nextTick(() => {
          this.$refs.tooltipTitle.innerHTML = utils.linkTest(
            this.$refs.msgtxtInner.innerHTML
          );
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.msg-txt {
  font-size: 14px;
  padding: 0 10px;
  max-width: 100%;
  height: 46px;
  background: #f3f4f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: MicrosoftYaHei;
  color: #8f959e;
  border-radius: 4px;
  .tooltipTitle {
    font-size: 14px;
    padding: 10px 15px;
    max-width: 100%;
    word-break: break-all;
    word-wrap: break-word;
    white-space: pre-wrap;
    background: #fff;
  }
  .msg-txt-inner {
    width: 100%;
    overflow: hidden;
  }
  .msg-txt-content {
    cursor: pointer;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    img {
      width: 14px;
      height: 14px;
    }
  }
  .msg-txt-right {
    cursor: pointer;
    margin: 0 5px;
    flex-shrink: 0;
    i {
      color: #c9cfd8;
      font-size: 12px;
    }
  }
}
</style>
