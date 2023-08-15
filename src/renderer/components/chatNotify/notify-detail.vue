<template>
  <section class="notify-detail-wrapper">
    <div class="notify-detail-header">
      <div class="breadcrumb">
        <span
          v-for="(row, index) of titleList"
          :key="index"
          @click="titleClickHandle(row, index)"
          v-text="row.name"
        ></span>
      </div>
    </div>
    <webview-control
      class="webview-control"
      :class="checkMicroApps(app)"
      ref="webviewControl"
      :option="app"
      @close="$emit('close')"
    ></webview-control>
    <!-- @did-stop-loading="domreadyHandler" -->
  </section>
</template>

<script>
//import..
import { mapGetters, mapActions } from "vuex";
import { miniViewApp } from "../../config/micro-app-config";
import { PollingReadState } from "../../plugin/polling-notice";

export default {
  name: "NotifyDetail",
  components: {},
  props: {
    app: { type: Object, required: true }
  },
  data() {
    //这里存放数据
    return {
      titleList: [] // 头部面包屑
    };
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() {
    const { GetActiveNotifyApp, app } = this;
    /**
     * 确定面包屑展示信息
     */
    let title = { name: `${GetActiveNotifyApp.name}通知详情`, path: "" };
    if (app.loadPCUrl.includes("zxApp/addReport")) {
      // 对新建汇报做特殊处理
      title.name = "新建汇报";
    }
    this.titleList.push(
      { name: `${GetActiveNotifyApp.name}通知列表`, path: "list" },
      title
    );
  },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  beforeDestroy() {}, //生命周期 - 销毁之前
  activated() {}, //如果页面有keep-alive缓存功能，这个函数会触发
  //监听属性 类似于data概念
  computed: {
    ...mapGetters(["GetActiveNotifyApp"])
  },
  //监控data中的数据变化
  watch: {},
  //方法集合
  methods: {
    titleClickHandle(item, index) {
      // 通过面包屑返回通知列表
      const { titleList } = this;
      const length = titleList.length;
      if (length - 1 > index) {
        switch (item.path) {
          case "list":
            this.$emit("close");
            break;
        }
      }
    },
    /**
     * 检测微应用适应尺寸
     */
    checkMicroApps(app) {
      let smallSizeApps = miniViewApp;
      let className = "";
      try {
        let url = app.homePageUrl || app.pcHomePageUrl || "";
        let list = smallSizeApps.filter(
          item => url.toLowerCase().includes(item) || url.includes(item)
        );
        if (list.length > 0) {
          className = "mini-view";
        }
      } catch (error) {}
      return className;
    },
    domreadyHandler() {
      setTimeout(() => {
        window.eventHub.$emit("refreshNotice", { isOnlyGet: true });
        PollingReadState.triggerPolling();
      }, 5000);
    }
  }
};
</script>
<style lang="scss" scoped>
.notify-detail-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;

  .notify-detail-header {
    flex-shrink: 0;
    padding: 0 10px;
    width: 100%;
    height: 40px;
    background-color: #fff;
    border-bottom: 1px solid #e7e7e7;

    .breadcrumb {
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      > span {
        font-size: 14px;
        color: #999;
        &:last-of-type {
          color: #333;
        }
        &:not(:last-of-type) {
          cursor: pointer;
          &::after {
            content: "/";
            display: inline;
            padding: 0 5px;
          }
        }
      }
    }
  }

  .webview-control {
    flex: 1;
    margin: 0 auto;
    box-shadow: 0 0 20px 0px rgba(0, 0, 0, 0.07);

    &.mini-view {
      max-width: 800px;
    }
  }
  ::v-deep .el-loading-mask {
    z-index: 990 !important;
  }
}
</style>
