<template>
  <section class="load-error-wrapper">
    <img src="~@/assets/image/error_load.png" alt="" />
    <p v-text="hint"></p>
    <button @click="$emit('reload')">立即刷新</button>
  </section>
</template>

<script>
export default {
  name: "LoadError",
  props: {
    hint: { type: String, default: "加载失败，请刷新重试" }
  },
  data() {
    return {};
  }
};
</script>

<style lang="scss">
.load-error-wrapper {
  padding: {
    top: 120px;
  }
  text-align: center;
  background-color: #f7f7f7;
  > img {
    width: 186px;
    height: 120px;
  }

  > p {
    color: #666;
    margin: 5px 0px 8px 0;
  }

  > button {
    color: #4498f0;
    &:hover {
      color: rgba($color: #4498f0, $alpha: 0.8);
    }
  }
}
</style>
