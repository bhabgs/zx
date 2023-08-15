<template>
  <all-screen-cut v-if="alive" :key="key" />
</template>
<script>
// const remote = require('@electron/remote')
import { ipcRenderer } from "electron";
import AllScreenCut from "./all-screen-cut.vue";
export default {
  components: {
    AllScreenCut,
  },
  data() {
    return {
      key: 0,
      alive: false,
    };
  },
  mounted() {
    ipcRenderer.on("hide", () => {
      this.alive = false;
    });

    ipcRenderer.on("show", () => {
      this.key ++;
      this.alive = true;
    });
  }
};
</script>
