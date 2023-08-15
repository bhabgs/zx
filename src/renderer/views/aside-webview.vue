<template>
  <section class="show-view-container">
    <base-header
      v-if="titleOpt && titleOpt.show"
      :title="titleOpt"
    ></base-header>
    <webview-control
      ref="webviewControl"
      :option="options"
      @ChangeSystemButton="ChangeSystemButtonHandler"
      @refresh="refreshHandle"
      @setSystemMenuPosition="setSystemMenuPosition"
    ></webview-control>
    <drag-box
      v-if="!isZhiwen"
      :style="{
        left: dragBoxPosition.left,
        width: dragBoxPosition.width,
      }"
    ></drag-box>
    <system-menu
      class="system-menu"
      v-if="showSys && isShowSys && !isZhiwen"
      :style="{
        right: position.right,
        top: position.top,
      }"
    ></system-menu>
  </section>
</template>
<script>
import { mapGetters } from "vuex";
import { PollingMailUnRead } from "../plugin/polling-notice";
import utils from "../plugin/utils";

export default {
  name: "ShowView",
  props: {
    url: { type: String | null, required: true },
    type: { type: Number | null, required: true },
    name: { type: String, required: true },
    showSys: { type: Boolean, required: false, default: true },
    isZhiwen: { type: Boolean, required: false, default: false },
    titleOpt: { type: Object, default: null },
  },
  data() {
    return {
      isOpen: false,
      isShowSys: true, // 控制系统按钮显示隐藏
      options: {
        url: null,
        showMenu: true,
      },
      position: {
        top: "15px",
      },
      dragBoxPosition: {
        left: 0,
        width: 0,
      },
    };
  },
  created() {
    window.eventHub.$on("setDragBoxPositionWay", this.setDragBoxPosition);
  },
  beforeDestroy() {
    window.eventHub.$off("setDragBoxPositionWay", this.setDragBoxPosition);
  },
  mounted() {
    this.options.id = this.name;
  },
  activated() {},
  computed: {
    ...mapGetters({
      LoginCompany: "GetCompany",
      GetUser: "GetUser",
    }),
  },
  watch: {
    LoginCompany: {
      deep: true,
      handler(val, old) {
        if (old.corpId !== val.corpId) {
          this.isOpen = false;
          this.init();
        }
      },
    },
    url() {
      this.init();
    },
  },
  methods: {
    sendMailType(type) {
      if (
        this.$refs.webviewControl &&
        this.$refs.webviewControl.changeMailRouter
      )
        this.$refs.webviewControl.changeMailRouter(type);
    },
    changeThemeBg(color) {
      if (
        this.$refs.webviewControl &&
        this.$refs.webviewControl.setThemeHeaderColor
      )
        this.$refs.webviewControl.setThemeHeaderColor(color);
    },
    init() {
      if (!this.isOpen) {
        this.isOpen = true;
        if (this.url) {
          this.$refs.webviewControl.loadUrl(this.url);
        }
      }
    },
    ChangeSystemButtonHandler(data) {
      if (utils.dataType(data) === "object") {
        this.isShowSys = data.status;
      }
    },
    setThemeHeaderColor(color) {
      this.$refs.webviewControl.setThemeHeaderColor(color)
    },
    refreshHandle({ type, position, counts }) {
      switch (position) {
        case "mail":
          if (type === "data") {
            // PollingMailUnRead.triggerPolling();
            this.$emit("refreshMailRead", counts);
          } else if (type === "page") {
            this.url.includes(this.$apipath.appUrl.mail) &&
              this.$refs.webviewControl.loadUrl(this.url);
          }
          break;

        default:
          break;
      }
    },
    setSystemMenuPosition(data) {
      this.position = data;
    },
    setDragBoxPosition(data) {
      if (data.type === "zhiyou") {
        this.dragBoxPosition = data;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.show-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  .system-menu {
    button {
      color: rgb(185, 167, 167);
      &:hover {
        color: #4498f0;
      }
    }
  }
}
</style>
