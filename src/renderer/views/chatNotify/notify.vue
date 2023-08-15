<!--  -->
<template>
  <section class="notify-wrapper">
    <!-- 通知列表 -->
    <webview-control
      v-show="isShowList"
      ref="webviewControl"
      :option="GetActiveNotifyApp"
      @refresh="refreshHandler"
      @manageView="openDetail"
    ></webview-control>
    <not-select-chat v-show="!isShowList" :showTitle="false"></not-select-chat>
    <!-- 通知详情 -->
    <notify-detail
      v-if="isShowDetail"
      class="notify-detail"
      :app="openDetailApp"
      @close="isShowDetail = false"
    ></notify-detail>
  </section>
</template>

<script>
//import..
import { mapGetters, mapActions } from "vuex";
import NotifyDetail from "../../components/chatNotify/notify-detail";
import { PollingReadState } from "../../plugin/polling-notice";

export default {
  name: "Notify",
  components: { NotifyDetail },
  props: {},
  data() {
    //这里存放数据
    return {
      isShowDetail: false, // 是否展示通知详情
      openDetailApp: {}, // 打开详情的APP
      isShowList: true // 是否显示列表
    };
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() {},
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  beforeDestroy() {}, //生命周期 - 销毁之前
  activated() {}, //如果页面有keep-alive缓存功能，这个函数会触发
  //监听属性 类似于data概念
  computed: {
    ...mapGetters(["GetActiveNotifyApp"])
  },
  //监控data中的数据变化
  watch: {
    GetActiveNotifyApp(app, oldApp) {
      this.isShowDetail = false;
      this.isShowList = true;
      if (app.notificationUrl) {
        let url = app.notificationUrl;
        // url = url.replace(/^http.*[/]/gi, "http://localhost:8081/"); // 调试代码

        const appType = app.openType == 1 ? "oa" : "iot";
        if (!url.includes("appType")) {
          if (url.includes("?")) {
            url = `${url}&appType=${appType}`;
          } else {
            url = `${url}?appType=${appType}`;
          }
        }
        const webviewControl = this.$refs.webviewControl;
        if (webviewControl && webviewControl.loadUrl) {
          webviewControl.loadUrl(url);
        }
      } else {
        this.isShowList = false;
      }
    }
  },
  //方法集合
  methods: {
    openDetail(data) {
      this.openDetailApp = {
        id: this.GetActiveNotifyApp.id,
        logo: this.GetActiveNotifyApp.logo,
        name: this.GetActiveNotifyApp.name,
        pcHomePageUrl: data.url,
        loadPCUrl: data.url,
        noStatis: true // 是否不统计使用次数
      };
      this.isShowDetail = true;
      /*  window.eventHub.$emit(
        "openApp",
        {
          id: this.GetActiveNotifyApp.id,
          logo: this.GetActiveNotifyApp.logo,
          name: this.GetActiveNotifyApp.name,
          pcHomePageUrl: data.url,
          noStatis: true // 是否不统计使用次数
        },
        { from: "notice", isBack: true }
      );
      this.$router.push({ name: "Open" }); */
    },
    refreshHandler(data) {
      const { type, position } = data;
      if (type === "data" && position === "notice") {
        setTimeout(() => {
          window.eventHub.$emit("refreshNotice", { isOnlyGet: true });
          PollingReadState.triggerPolling(); // 触发通知状态的查询
        }, 1000);
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.notify-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  .notify-detail {
    position: absolute;
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #fff;
  }
  ::v-deep .el-loading-mask {
    z-index: 990 !important;
  }
}
</style>
