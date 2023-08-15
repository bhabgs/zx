<template>
  <section class="error-refresh">
    <button @click="reloadHandler">刷新</button>
  </section>
</template>
<script>
export default {
  name: "ErrorRefresh",
  props: {
    refresh: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    reloadHandler() {
      try {
        this.refresh();
      } catch (error) {}
    }
  }
};
</script>
<style lang="scss" scoped>
.error-refresh {
  width: 100%;
  height: 100%;
}
</style>
