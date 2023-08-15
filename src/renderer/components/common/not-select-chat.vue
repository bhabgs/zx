<template>
  <div class="not-select-chat">
    <div class="logo" v-if="showLogo"></div>
    <p class="hint-text" v-if="showTitle" v-text="title"></p>
  </div>
</template>

<script>
export default {
  name: "NotSelectChat",
  props: {
    showTitle: { type: Boolean, default: true },
    showLogo: { type: Boolean, default: true },
    title: { type: String, default: "未选择聊天" }
  },
  data() {
    return {};
  }
};
</script>

<style lang="scss" scoped>
.not-select-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  .logo {
    width: 110px;
    height: 110px;
    background: url("~@/assets/image/common/iot.png") 100%/100% no-repeat;
  }
  .hint-text {
    margin-top: 20px;
    color: #bbb;
    font-size: 16px;
  }
}
</style>
