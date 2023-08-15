<template>
  <section class="fix-contact">
    <div class="fix-contact-mask" @click.stop="closeHandler(false)"></div>
    <div class="fix-contact-body">
      <div class="fix-contact-body-title">
        <img :src="titleImg" class="title-img" alt="" />
        <span v-show="status === 1">{{ fixContent }} </span>
        <span v-show="status !== 1">{{ titleContent }} </span>
      </div>
      <el-progress
        :text-inside="true"
        :stroke-width="15"
        :percentage="parseInt(fixPercent) || 0"
        color="#3E7EFF"
        class="fix-contact-body-progress"
        v-if="status === 1"
      />
      <div>
        <p class="fix-contact-body-desc">{{ contentDesc }}</p>
      </div>
      <div
        class="fix-contact-body-operation"
        :style="status === 1 && !showCancelFix ? 'padding-bottom:32px' : ''"
      >
        <button
          class="btn danger-btn"
          v-show="status === 1 && showCancelFix"
          @click.stop="closeHandler(true)"
        >
          取消修复
        </button>
        <button
          class="btn cancel-btn"
          v-show="status === 0"
          @click.stop="closeHandler(false)"
        >
          取消
        </button>
        <button
          class="btn confirm-btn"
          v-show="[0, 2, 3, 4].includes(status)"
          @click="handleConfirm"
        >
          确定
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import fix from "@/assets/image/contacts/fix.png";
import checked from "@/assets/image/contacts/checked_outsource.png";
import danger from "@/assets/image/contacts/danger-close.png";
import warning from "@/assets/image/contacts/warning.png";
import Vue from "vue";
// import {
//   PollingReadState,
//   PollingNotify,
//   PollingOutSideNotify,
//   PollingMailUnRead,
// } from "@/plugin/polling-notice";
// import { PushNotice } from "@/plugin/push-dispose";
import { mapGetters, mapActions } from "vuex";
import { ipcRenderer } from "electron";
export default {
  name: "FixContact",
  data() {
    return {
      // 当前页面状态  0-未开始  1-修复中  2-修复完成   3-修复异常  4-修复次数达到上线
      status: 0,
      // 修复中文案有...，单独出
      fixContent: "修复中",
      // 请求结束后不再展示
      showCancelFix: true,
      // 修复百分比
      fixPercent: 0,
      // 定时任务id
      intervalId: 0,
      // 添加标志位取消后续操作
      forceStop: false,
    };
  },
  computed: {
    // title的图片
    titleImg() {
      switch (this.status) {
        case 2:
          return checked;
        case 3:
          return danger;
        case 4:
          return warning;
        default:
          return fix;
      }
    },
    // title的文字
    titleContent() {
      switch (this.status) {
        case 1:
          this.startContentChange(1);
          return "";
        case 2:
          return "修复完成";
        case 3:
          return "修复异常";
        case 4:
          return "修复提示";
        default:
          return "修复联系人";
      }
    },
    // 描述文字
    contentDesc() {
      switch (this.status) {
        case 1:
          return "努力修复中，为保证修复效果，请停留在此页面。";
        case 2:
          return "您的联系人已修复完成。";
        case 3:
          return "修复异常，请稍后重试。";
        case 4:
          return "每天最多可修复2次，请明天再修复吧";
        default:
          return "针对：对话中出现联系人丢失、信息显示（昵称缺失、组织外联显示、头像显示）等问题，可尝试修复";
      }
    },
    // vuex中获取所有公司
    ...mapGetters({
      allCompany: "GetAllCompany",
      account: "GetUser",
    }),
  },
  mounted() {
    Vue.prototype.sqlite_update_time = {
      account: {},
    }; //用于全局记录各个接口的增量更新时间
  },
  methods: {
    ...mapActions(["LogOutAction", "setAllUser"]),
    // 关闭弹窗
    closeHandler(force = false) {
      // 添加标志位取消后续操作
      if (force) {
        this.forceStop = true;
      }
      // 修复完成不可点击mask关闭
      if (force || ![1].includes(this.status)) {
        this.$emit("close");
      }
    },
    // 暂停定时任务
    closeInterval() {
      if (this.intervalId !== 0) {
        clearInterval(this.intervalId);
        this.intervalId = 0;
      }
    },
    // 开始进行fixContent的修改工作
    startContentChange(num) {
      setTimeout(() => {
        const addStr = ".".repeat(num % 4);
        this.fixContent = "修复中" + addStr;
        this.startContentChange(++num);
      }, 500);
    },
    // 修复联系人
    async startFix() {
      // 每天最多修复两次
      if (
        localStorage.getItem("fix_contact_num") == 2 &&
        localStorage.getItem("last_fix_date") ===
          this.$moment(new Date()).format("YYYY-MM-DD")
      ) {
        this.status = 4;
        return;
      }
      this.status = 1;
      // 每个公司的百分比，最后百分之十是本地sqlite的
      const step = parseInt(90 / this.allCompany.length);
      let userList = [];
      try {
        for ({ corpId, corpType } of this.allCompany) {
          if (this.forceStop) {
            break;
          }
          let list = await this.$service.getCorpAllUser.call(this, {
            corpId,
            corpType,
          });
          if (!list) {
            this.status = 3;
            break;
          } else {
            this.fixPercent = this.fixPercent + step;
            userList.push(list);
          }
        }
      } catch (err) {
        this.status = 3;
        throw new Error("修复失败");
      }
      this.showCancelFix = false;
      if (this.forceStop) {
        return;
      }
      if (userList.length) {
        // 本地数据库存储用户数据
        userList = userList.reduce((userList, current) => {
          return userList.concat(current);
        });
        try {
          // 修复联系人
          await ipcRenderer.invoke("sqlite-url", {
            key: "fixContact",
            data: { list: userList, ctime: this.getUserListTime() },
          });
        } catch (err) {
          this.status = 3;
        }
      }
      // 若当前状态为修复中，则设置进度为100%，1秒后状态置为已完成
      if (this.status === 1) {
        this.fixPercent = 100;
        setTimeout(async () => {
          // 修改vuex数据
          this.setAllUser({ users: userList, needClear: true });
          // 插入数据后搜索框搜索异常，数据库重连解决
          await ipcRenderer.invoke("sqlite-close");
          await ipcRenderer.invoke("sqlite-connect", {
            name: this.account.mobile,
          });
          this.status = 2;
          this.setFixNum();
        }, 1000);
      }
    },
    // 确定按钮点击事件
    handleConfirm() {
      switch (this.status) {
        case 0:
          this.startFix();
          break;
        // case 2:
        //   this.quitHandle();
        //   break;
        default:
          this.closeHandler();
      }
    },
    // 获取最新的ctime
    getUserListTime() {
      try {
        let leastTime;
        let accountMap = Vue.prototype.sqlite_update_time.account;
        for (let key in accountMap) {
          if (leastTime == null) {
            leastTime = accountMap[key];
          } else if (leastTime > accountMap[key]) {
            leastTime = accountMap[key];
          }
        }
        return leastTime;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    // 设置今天修复的次数
    setFixNum() {
      // 今天的日期
      const today = this.$moment(new Date()).format("YYYY-MM-DD");
      // 上次修复的时间
      const lastDate = localStorage.getItem("last_fix_date");
      if (today !== lastDate) {
        localStorage.setItem("fix_contact_num", 1);
        localStorage.setItem("last_fix_date", today);
      } else {
        localStorage.setItem("fix_contact_num", 2);
      }
    },
    // 退出智信
    // async quitHandle() {
    //   // 退出智信
    //   try {
    //     let evt = new Event("logout", { bubbles: true, cancelable: false });
    //     document.dispatchEvent(evt);
    //     await this.$service.logout();
    //     this.LogOutAction();
    //     sessionStorage.clear();
    //     ipcRenderer.send("gologin");
    //     this.$router.push("/");
    //     clearTimeout(window.refreshNotify);
    //     PollingNotify.stopPulling();
    //     PollingOutSideNotify.stopPulling();
    //     PollingReadState.stopPulling();
    //     PollingMailUnRead.stopPulling();
    //     PushNotice.reset();
    //     await ipcRenderer.invoke("sqlite-close");
    //   } catch (error) {
    //   } finally {
    //     this.$emit("close");
    //   }
    // },
  },
};
</script>

<style lang="scss" scoped>
.fix-contact {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  &-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
  }
  > * {
    flex-shrink: 0;
  }
  &-body {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 100000;
    width: 400px;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 4px;
    padding: 32px 32px 24px;
    box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.24);
    &-title {
      font-size: 16px;
      color: #1f2329;
      height: 24px;
      line-height: 24px;
      font-weight: 500;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      .title-img {
        width: 18px;
        height: 18px;
        margin-right: 8px;
      }
    }
    &-progress {
      margin-top: 4px;
      margin-bottom: 4px;
    }
    &-desc {
      font-size: 14px;
      color: #5d616b;
      line-height: 22px;
      font-weight: 400;
      margin-bottom: 24px;
    }
    &-operation {
      text-align: right;
      .btn {
        padding: 5px 16px;
        border-radius: 3px;
        line-height: 22px;
        font-size: 14px;
        font-weight: 400;
        margin-left: 8px;
        &.cancel-btn {
          color: #5d616b;
          border: 1px solid #c9cfd8;
          &:hover {
            border-color: #3e7eff;
            color: #3e7eff;
          }
        }
        &.confirm-btn {
          color: #ffffff;
          background-color: #3e7eff;
          &:hover {
            background-color: #2e6be6;
          }
        }
        &.danger-btn {
          color: #fa4141;
          border: 1px solid #fa4141;
          &:hover {
            background-color: #feecec;
          }
        }
      }
    }
  }
}
</style>
