<!-- 选择更多表情含义 -->
<template>
  <section class="select-more-meaning">
    <el-popover
      v-model="showMoreMeaning"
      popper-class="select-more-meaning-popover"
      placement="right"
      trigger="manual"
      :visible-arrow="false"
    >
      <div
        class="meaning"
        v-for="(item, index) of moreMeaning[emojidata]"
        :key="index"
        @click="selectMeaning(item)"
      >
        {{item}}
      </div>
      <!-- 打开更多表情含义触发按钮 -->
      <div slot="reference" @contextmenu.prevent.stop="rightClick()">
        <slot name="moremeaning"></slot>
      </div>
    </el-popover>
  </section>
</template>

<script>
import { Emoji } from "@/WebIM";

export default {
  data() {
    return {
      list: { path: "", map: {}, abandonedList: [], haveMoreMeaning: [], moreMeaning: {} },
      showMoreMeaning: false
    };
  },
  props: {
    emojidata: { type: String, default: "" },
    emojicode: { type: String, default: "" },
    type: {type: String, default: ""}
  },
  computed: {
    haveMoreMeaning() {
      return this.list.haveMoreMeaning;
    },
    moreMeaning() {
      return this.list.moreMeaning;
    },
  },
  watch: {
    //监听点击事件 关闭表情快捷含义框
    showMoreMeaning(val) {
      this.$emit("rightSelected", val, this.type, this.emojidata);
      if (val) {
        window.addEventListener("click", this.closeSelectEmoji);
      } else {
        window.removeEventListener("click", this.closeSelectEmoji);
      }
    },
  },
  created() {
    this.list = Emoji.getEmojiMap();
  },
  mounted() {
    this.$root.$on("closeMoreMeaning", this.closeSelectEmoji);
  },
  beforeDestroy() {
    this.$root.$off("closeMoreMeaning", this.closeSelectEmoji);
  },
  methods: {
    //右击打开表情快捷含义选项列表
    rightClick() {
      this.$root.$emit("closeMoreMeaning");
      // if (this.haveMoreMeaning.includes(this.emojidata)) {
        this.showMoreMeaning = true;
      // }
    },
    //关闭表情快捷含义框
    closeSelectEmoji() {
      this.showMoreMeaning = false;
    },
    //选中表情快捷含义
    selectMeaning(msg) {
      const obj = {
        content: this.emojicode,
        path: this.list.path + this.emojidata,
        msg: msg
      };
      this.$emit("selectMeaning", this.emojicode, obj);
      this.showMoreMeaning = false;
    }
  }
};
</script>

<style lang="scss">
</style>

