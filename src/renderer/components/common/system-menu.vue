<template>
  <div id="system-menu">
    <button
      class="iconfont"
      v-for="(i, key) in btns"
      :disabled="!i.type"
      :key="key"
      :class="i.icon"
      v-show="mergeOption.showBtn.includes(i.status)"
      @click="changeWin(i.status)"
    ></button>
  </div>
</template>
<script>
import electron, { ipcRenderer } from "electron";
const remote = require('@electron/remote');

export default {
  name: "SystemMenu",
  components: {},
  props: {
    options: {
      type: Object,
      default: () => ({ showBtn: ["mini", "maximize", "close"] })
    }
  },
  data() {
    return {
      isMaximizable: false
    };
  },
  created() {
    ipcRenderer.on("maximize-change", this.changeSize);
    window.addEventListener("webview-fullscreen", evt => {
      const { status } = evt.detail;
      this.setCurrentMax();
    });
  },
  mounted() {
    this.setCurrentMax();
  },
  updata() {},
  destroyed() {},
  computed: {
    btns() {
      let list = [
        {
          icon: "icon-jiantou",
          status: "select",
          type: true
        },
        {
          icon: "icon-sub",
          status: "mini",
          type: true
        },
        {
          icon: "icon-zuidahua",
          status: "maximize",
          type: true
        },
        {
          icon: "icon-close",
          status: "close",
          type: true
        }
      ];
      this.isMaximizable &&
        (list = list.map(item => {
          switch (item.status) {
            case "maximize":
              item.icon = "icon-zuixiaohua";
              break;
          }
          return item;
        }));
      return list;
    },
    mergeOption() {
      let result = {
        ...this.options
      };
      return result;
    }
  },
  watch: {
    options: {
      handler(newVal) {
        return newVal;
      },
      deep: true
    }
  },
  methods: {
    setCurrentMax() {
      const currentWin = remote.getCurrentWindow();
      const isMaximizable = currentWin && currentWin.isMaximized();
      this.isMaximizable = isMaximizable;
    },
    changeWin(type) {
      this.$emit(type);
      switch (type) {
        case "select":
          this.$emit("showNetwork");
          break;
        case "mini":
          ipcRenderer.send("minimize");
          break;
        case "maximize":
          ipcRenderer.send("maximize");
          break;
        case "close":
          this.close();
      }
    },
    changeSize(event, { status }) {
      this.isMaximizable = status;
    },
    close() {
      ipcRenderer.send("closeWin");
    }
  },
  filter: {}
};
</script>
<style lang="scss">
@import "~@/assets/styles/constant";

#system-menu {
  position: absolute;
  right: 5px;
  top: 10px;
  flex-shrink: 0;
  button {
    background: none;
    padding: 6px;
    margin: 0 6px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    &:hover {
      color: #ddd;
    }
    &.icon-jiantou {
      transform: rotate(270deg);
    }
  }
}
</style>
