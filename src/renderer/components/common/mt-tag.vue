<!--
 * @Author: lixiaowei
 * @Date: 2021-04-25 13:33:40
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-25 17:27:45
 * @Description: file content
 * @FilePath: /zx-client-pc/src/renderer/components/common/mt-tag.vue
-->

<template>
  <div
    class="mt-tag-box"
    :class="{
      'disable-del': disable
    }"
  >
    <slot></slot>
    <span class="only-line" v-text="text"></span>
    <button
      @click="closeTag()"
      class="iconfont icon-_huabanfuben2"
      v-if="closable"
    ></button>
  </div>
</template>

<script>
export default {
  name: "MtTag",
  props: {
    text: { type: String, default: "" },
    closable: { type: Boolean, default: true },
    disable: { type: Boolean, default: false }
  },
  methods: {
    closeTag() {
      this.$emit("close");
    }
  }
};
</script>

<style lang="scss">
.mt-tag-box {
  padding: 0 {
    left: 12px;
    right: 10px;
  }
  height: 30px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  border-radius: 16px;
  background-color: #f7f7f9;
  color: #1f2329;
  user-select: none;

  &.disable-del {
    padding-right: 16px;
    background-color: #fff;
    button {
      display: none;
    }
  }

  > span {
    flex: 1;
  }
  > button {
    margin-left: 10px;
    width: 14px;
    height: 14px;
    line-height: 14px;
    text-align: center;
    color: #fff;
    font-size: 6px;
    border-radius: 50%;
    background-color: #c9cfd8;
    transition: all 0.15s linear;
    &:hover {
      background-color: #4498f0;
    }
  }
}
</style>
