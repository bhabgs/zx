<template>
  <div class="tag-panel">
    <div class="title">命名标签</div>
    <div class="container">
      <img
        v-for="key in imgList"
        :src="assetsMap[key]"
        class="item"
        @click="$emit('select', key)"
      />
    </div>
  </div>
</template>
<script setup>
import { assetsMap, imgList } from "./useStorageName";
</script>
<style lang="scss" scoped>
.tag-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.title {
  font-size: 12px;
  line-height: 1;
  color: #8f959e;
}
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  .item {
    width: 22px;
    height: 22px;
    cursor: pointer;
  }
}
</style>
