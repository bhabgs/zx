<template>
  <div class="operate-dialog" :class="openDialog ? 'open' : ''">
    <button
      class="close-btn iconfont icon-close"
      @click="$emit('close')"
    ></button>
    <slot name="title">
      <div class="operate-dialog-title">{{ title }}</div>
    </slot>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "OperateDialog",
  props: ["openDialog", "title"]
};
</script>

<style lang="scss">
.operate-dialog {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 0;
  height: calc(100% - 40px);
  bottom: 0;
  position: absolute;
  right: 0;
  transition: width 0.3s;
  z-index: 18;
  background: #fff;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.2);
  &.open {
    width: 400px;
  }
  .operate-dialog-title {
    color: #000;
    margin: 10px 20px;
    flex-shrink: 0;
  }

  .close-btn {
    position: absolute;
    right: 20px;
    top: 10px;
    padding: 2px;
    font-size: 12px;
    color: #999;
    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
