<template>
  <section class="iscroll-view">
    <div
      class="iscroll-view-container"
      ref="iscroll-view-container"
      @scroll="throttleScrollHandler($event)"
    >
      <slot></slot>
    </div>
  </section>
</template>
<script>
export default {
  name: "IscrollView",
  components: {},
  props: {
    option: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isLoad: false,
      throttleScrollHandler: null,
      scrollDistance: 0 // 滚动距离
    };
  },
  created() {},
  mounted() {
    this.scrollDistance = 0;
    this.initView();
    this.throttleScrollHandler = this.throttle(this.scrollHandler);
  },
  computed: {
    mergeOpt() {
      const opt = {
        direction: "bottom", // 视图滚动方向，top：向上滚动，bottom：向下滚动
        offset: 50, // 偏移量，小于这个值时触发数据加载
        ...this.option
      };

      return opt;
    }
  },
  watch: {},
  methods: {
    initView() {
      this.$nextTick(() => {
        if (this.mergeOpt.direction === "top") {
          const container = this.$refs["iscroll-view-container"];
          container && (container.scrollTop = container.scrollHeight);
        }
      });
    },
    scrollInto(site) {
      this.$nextTick(() => {
        if (site) {
          const container = this.$refs["iscroll-view-container"];
          container && (container.scrollTop = site);
        }
      });
    },
    scrollHandler(e) {
      this.$emit("scroll", e);
      window.eventHub.$emit("native-scroll");
      const offsetTop = e.target.offsetTop,
        scrollHeight = e.target.scrollHeight,
        scrollTop = e.target.scrollTop,
        clientHeight = e.target.clientHeight;

      this.scrollDistance = scrollHeight - scrollTop;

      switch (this.mergeOpt.direction) {
        case "bottom":
          const diff = scrollHeight - scrollTop - clientHeight;
          if (diff < this.mergeOpt.offset && !this.isLoad) {
            this.$emit("loadNext");
            this.isLoad = true;
          }
          if (scrollTop < this.mergeOpt.offset && !this.isLoad) {
            this.$emit("loadUp");
            this.isLoad = true;
          }

          if (diff > this.mergeOpt.offset && scrollTop > this.mergeOpt.offset) {
            this.isLoad = false;
          }

          break;
        case "top":
          if (scrollTop < this.mergeOpt.offset && !this.isLoad) {
            this.$emit("loadNext");
            this.isLoad = true;
          }

          if (scrollTop > this.mergeOpt.offset) {
            this.isLoad = false;
          }

          break;

        default:
          break;
      }
    },
    scrollChange({ isBottom = false } = {}) {
      this.$nextTick(() => {
        const container = this.$refs["iscroll-view-container"];
        if (isBottom) {
          if (scrollBody) {
            scrollBody.scrollIntoView(false);
          }
        } else {
          container.scrollTo(0, container.scrollHeight - this.scrollDistance);
        }
      });
    },
    throttle(fn, delay = 160) {
      let timeout;
      let start = Date.now();
      return function() {
        let context = this,
          args = arguments,
          current = Date.now() - 0;
        clearTimeout(timeout);
        if (current - start >= delay) {
          fn.apply(context, args);
          start = current;
        } else {
          timeout = setTimeout(() => {
            fn.apply(context, args);
          }, delay);
        }
      };
    }
  }
};
</script>
<style lang="scss" scoped>
.iscroll-view {
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: hidden;
  display: flex;

  .iscroll-view-container {
    width: 100%;
    height: 100%;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
