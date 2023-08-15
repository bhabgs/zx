<template>
  <div id="app">
    <router-view class="router-view"></router-view>
    <transition name="fade" mode="in-out">
      <about-info v-if="isShowAbout" @close="isShowAbout = false"></about-info>
      <clear-cache v-if="isShowClear" @close="closeClear"></clear-cache>
      <fix-contact v-if="isShowFix" @close="closeFix"></fix-contact>
      <login-log v-if="isShowLog" @close="closeLog"></login-log>
      <section
        id="user-info-dialog-container"
        v-if="showUserInfoOpt.show"
        :style="{
          left: `${showUserInfoOpt.x}px`,
          top: `${showUserInfoOpt.y}px`,
          width: `${showUserInfoOpt.width}px`,
          height: `${showUserInfoOpt.height}px`,
        }"
      >
        <user-pop-info
          :user="showUserInfoOpt.user"
          :isStopEvent="true"
          :showChangeHead="true"
          @hidePop="showUserHandle({ show: false })"
        ></user-pop-info>
      </section>
    </transition>
  </div>
</template>
<script>
import os from "os";
import { remote, ipcRenderer } from "electron";
import { mapActions, mapGetters } from "vuex";
import AudioNotify from "./plugin/audio-notify";
import LoginLog from "@/components/login/login-log";
// const { clipboard } = require('electron');

AudioNotify.init();

export default {
  data() {
    return {
      isShowAbout: false, //关于智信
      isShowClear: false, //清除缓存
      isShowFix: false, // 修复联系人
      isShowLog: false, // 登录日志
      showUserInfoOpt: {
        show: false,
        x: 0,
        y: 0,
        user: {},
        width: 320,
        height: 440,
      }, // 展示用户信息配置
    };
  },
  components: {
    LoginLog,
  },
  created() {
    // 勿删 此方法用于发出去的消息到微信保持格式
    // document.addEventListener("copy", (e) => {
    //   //做兼容
    //   e = window.event || e;
    //   //阻止默认事件行为（复制文本）
    //   e.preventDefault();
    //   //获取拖蓝区内容
    //   let selection =  window.getSelection().toString();
    //   let range = window.getSelection().getRangeAt(0);
    //   let container = document.createElement('div');
    //   container.appendChild(range.cloneContents());
    //   console.log("zhuqi innerHTML", container.innerHTML);
    //   console.log("zhuqi innerText", container.innerText);
    //   console.log("zhuqi selectiontostring ", selection);
    //   //指定添加数据
    //   clipboard.write({
    //     text: selection,
    //     html: container.innerHTML
    //   })
    // });
    this.$service.getAppVersion();
    window.eventHub.$on("logout", () => {
      this.isShowAbout = false;
      this.isShowClear = false;
      this.isShowFix = false;
      this.isShowLog = false;
    });
    window.eventHub.$on("show-about", () => {
      this.isShowAbout = true;
    });
    window.eventHub.$on("fix-contact", () => {
      this.isShowFix = true;
    });
    window.eventHub.$on("show-clear", () => {
      this.isShowClear = true;
    });

    window.eventHub.$on("show-login-log", () => {
      this.isShowLog = true;
      // this.showLogout();
    });
    window.addEventListener("dispath-logout", this.showLogout);
    window.onresize = (event) => {
      window.eventHub.$emit("resize", event);
      this.showUserHandle({ show: false });
    };
    window.addEventListener("scroll", () => {
      this.showUserHandle({ show: false });
    });

    const client_uuid = localStorage.getItem("pc_client_uuid");
    if (!client_uuid) {
      let uuid = this.$myUtils.getRandomId("-");
      localStorage.setItem("pc_client_uuid", uuid);
    }

    /* 主窗口显示隐藏状态变更 */
    ipcRenderer.on("main-win-visible", this.visibleChangeHander);
    ipcRenderer.on("close-win", (event, data) => {
      if (data === "copy") {
        this.$message.info("已复制到剪贴板");
      }
    });

    /* 展示用户信息事件监听处理 */
    window.eventHub.$on("change-user-dialog", this.showUserHandle);
    /* 展示用户信息事件监听处理 END */
    window.eventHub.$on("native-click", () => {
      this.showUserHandle({ show: false });
    });
    window.eventHub.$on("native-scroll", () => {
      this.showUserHandle({ show: false });
    });

    // 神策埋点获取企业信息
    let that = this;
    sensors.registerPage({
      corp_id: function () {
        let corp = (that.GetCompany || {}).corp;
        if (corp) {
          return corp.id;
        }
        return "";
      },
      corp_name: function () {
        let corp = (that.GetCompany || {}).corp;
        if (corp) {
          return corp.name;
        }
        return "";
      },
    });

    // 处理行动中心iframe消息
    window.addEventListener('message', (e) => {
      const { data, source, ...args } = e
      if (data === 'getToken') {
        const access_token = ipcRenderer.sendSync("get-token", 1);
        const refresh_token = ipcRenderer.sendSync("get-token", 2);
        source.postMessage({ type: 'setToken', data: { access_token, refresh_token } }, '*')
      } else if (typeof data === 'object' && data.to === 'operation') {
        if (data.extra) {
          const extra = JSON.parse(data.extra);
          if (extra && extra.type === 'create-empty') {
            // 创建行动前，没有人或者群
            window.eventHub.$emit("open-organize-modal", data.data);
            return;
          }
        }
        ipcRenderer.invoke('open-operation-page', data);
      } else if (typeof data === 'object' && data.type === 'ac-state-msg') {
        window.eventHub.$emit("acStateChanged", data.data);
      } 
    })
  },
  computed: {
    ...mapGetters(["GetCompany"]),
  },
  watch: {
    $route(val) {
      this.$service.getAppVersion();
    },
  },
  methods: {
    ...mapActions(["SetMainWinVisible"]),
    visibleChangeHander(event, { status }) {
      this.SetMainWinVisible(status);
    },
    showLogout({ detail }) {
      const h = this.$createElement;
      let text = "您的智信已退出。";
      if (detail.pcOutType == 1) {
        text = `您的智信于${
          detail.time
            ? this.$moment(detail.outTime).format("HH:mm")
            : this.$moment().format("HH:mm")
        }在其他电脑上登录，此桌面端已退出登录。`;
      }
      this.$msgbox({
        title: "温馨提示",
        message: h("div", null, [h("p", null, text)]),
        type: "warning",
        customClass: "logout-confirm",
        showCancelButton: false,
        confirmButtonText: "知道了",
      })
        .then(() => {
          console.log("退出登录");
        })
        .catch((error) => {
          console.log(error);
        });
    },
    closeClear() {
      this.isShowClear = false;
    },
    closeFix() {
      this.isShowFix = false;
    },
    closeLog() {
      this.isShowLog = false;
    },
    showUserHandle({ show = false, evt, user, isTarget = true } = {}) {
      window.removeEventListener("click", this.showUserHandle);
      if (this.showUserInfoOpt.show) {
        this.showUserInfoOpt.show = false;
      }
      if (show) {
        let target;
        if (isTarget) {
          target = evt.target;
        } else {
          target = evt;
        }
        const { width, height } = this.showUserInfoOpt;
        const { x, y } = this.calcDialogPosition(
          target,
          { width, height },
          isTarget
        );
        this.showUserInfoOpt.x = x;
        this.showUserInfoOpt.y = y;
        this.$set(this.showUserInfoOpt, "user", user);
      }
      setTimeout(() => {
        if (show) {
          window.addEventListener("click", this.showUserHandle);
        }
        this.showUserInfoOpt.show = show;
      }, 100);
    },
    /**
     * 计算弹框位置
     */
    calcDialogPosition(target, { width, height }, isTarget) {
      const { innerHeight, innerWidth } = window;
      let left, top, right;
      if (isTarget) {
        left = target.getBoundingClientRect().left;
        top = target.getBoundingClientRect().top;
        right = target.getBoundingClientRect().right;
      } else {
        left = target.left;
        top = target.top;
        right = target.right;
      }
      let x = 0;
      let y = 0;
      let halfW = width / 2;
      let halfH = height / 2;

      x = right + 15;
      y = top + 15 - halfH;
      if (x + width >= innerWidth) {
        x = left - width - 15 >= width ? left - width - 15 : innerWidth - width;
      }

      if (y + height > innerHeight) {
        y = innerHeight - height;
      }
      if (y < 0) {
        y = 0;
      }
      return { x, y };
    },
  },
};
</script>
<style lang="scss">
@import "~@/assets/styles/common.scss";
.router-view {
  overflow: hidden;
}

#user-info-dialog-container {
  position: fixed;
  z-index: 9999;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}
</style>
<style lang="scss">
.logout-confirm {
  .el-message-box__container {
    .el-message-box__status {
      top: 10px;
    }
  }
  .el-button--primary {
    width: 74px;
    height: 34px;
    background: #3e7eff;
    border-color: #3e7eff;
    border-radius: 4px;
    font-size: 14px;
  }
}
</style>
