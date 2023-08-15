<template>
  <section class="drag-box">
  </section>
</template>

<script>
export default {
  name: "DragBox",
};
</script>
<style lang="scss">
@import "~@/assets/styles/constant";
.drag-box {
  -webkit-app-region: drag;
  height: 48px;
  position: fixed;
}
</style>
