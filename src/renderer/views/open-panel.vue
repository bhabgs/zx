<template>
  <section id="open-panel">
    <open-header
      :show-detail="showApp"
      :show-app-list="openAppList"
      :apps="showAppList"
      @showApp="openActiveApp"
      :current-app="currentShowApp"
      @closeApp="closeApp"
      @backTorigin="backTorigin"
    ></open-header>
    <div class="highFrequency" v-if="isShowHighUse">
      <div class="lable">
        <span class="icon">
          <i class="iconfont icon-close" @click="closeHighUse($event)"></i>
        </span>
        <span>高频使用：</span>
      </div>
      <div
        class="highUseApps"
        v-for="app in highUseApps"
        :key="app.id"
        :title="app.name"
        @click="openActiveApp(app)"
      >{{ app.name }}</div>
    </div>
    <div
      class="micro-container"
      v-if="showOrigin"
      :style="{ backgroundImage: `url(${ExtCorpInfo.pcFootImage})` }"
    >
      <div>
        <swipe class="ad-swipe"></swipe>
        <micro-apps class="micro-apps" :apps="showAppListAndType" @showApp="openActiveApp"></micro-apps>
      </div>
    </div>
    <div class="webviews" v-show="showApp && !showOrigin">
      <webview-control
        v-for="app in openAppList"
        :class="checkMicroApps(app)"
        :option="app"
        :key="app.id"
        @manageView="openAppView"
        @close="closeApp(app)"
        v-show="app.id == currentShowApp.id"
      ></webview-control>
    </div>
  </section>
</template>
<script>
import { mapGetters } from "vuex";
import layouts from "@/components/layouts";
import microApps from "@/components/open/micro-apps";
import { NotInOpenApp, miniViewApp } from "../config/micro-app-config";
import Swipe from "@/components/swipe/swipe";
import { ipcRenderer } from "electron";
import moment from "moment";
import { Util } from "@/plugin";
import FileRW from "../../modules/FileRW";
import utils from "../plugin/utils";
export default {
  name: "OpenPanel",
  components: {
    OpenHeader: layouts.OpenHeader,
    microApps,
    Swipe
  },
  data() {
    return {
      microAppList: [], //微应用列表
      showAppListAndType: [], // 附带类型区分的微应用类列表
      userCode: null, //用户
      showApp: false, //是否展示微应用
      currentShowApp: {}, //当前展示的微应用
      openAppList: [], //当前打开的微应用
      highUseApps: [], //高频应用
      showOrigin: true, //是否展示初始界面
      isShowHighUse: true, // 是否展示高频使用
      openOptions: {}, // 打开微应用时的配置
      openedMicroApps: new Map(), //统计-记录微应用开始时间
      goLogin: true, //统计-退出至登录页
      throttleRecord: null,
      openedMicroAppsList: [],
      fileRW: null
    };
  },
  created() {
    window.eventHub.$on("openApp", this.openActiveApp);
    //显示-隐藏窗口
    ipcRenderer.on("main-win-visible", this.mainVisible);
    //退出至登录页
    ipcRenderer.on("go-login", this.exitToLogin);
    //获取焦点
    ipcRenderer.on("on-focus", this.mainFocus);
    //失去焦点
    ipcRenderer.on("on-blur", this.mainBlur);
    //托盘退出
    ipcRenderer.on("before-quit", this.mainQuit);
  },
  mounted() {
    this.fileRW = new FileRW();
    this.initRecord();
    const { LoginCompany, getAllmic } = this;
    if (LoginCompany && LoginCompany.corpId) {
      getAllmic("companyChange");
    } else {
      let watcher = this.$watch("LoginCompany", newVal => {
        LoginCompany &&
          LoginCompany.corpId &&
          (getAllmic("companyChange"), watcher());
      });
    }
    if (this.$route.name == "Open") {
      this.getAllmic();
    }
  },
  computed: {
    ...mapGetters({
      LoginCompany: "GetCompany",
      GetUser: "GetUser",
      ExtCorpInfo: "GetExtCorpInfo"
    }),
    showAppList() {
      let list = [];
      this.microAppList.forEach(item => {
        item.status === 1 && list.push(item);
      });

      return list;
    },
    appids() {
      let appids = this.openAppList.map(app => {
        return app.id;
      });

      return appids;
    }
  },
  watch: {
    LoginCompany: {
      deep: true,
      handler(val, old) {
        if (old.corpId !== val.corpId) {
          this.getAllmic("companyChange");
          this.openAppList.splice(0);
          this.showApp = false;
          this.showOrigin = true;
        }
      }
    },
    $route(route) {
      if (route.name === "Open") {
        this.getAllmic();
        //访问开始-3.切换左侧menu
        this.recordMicroAppsBegin(this.currentShowApp);
      } else {
        //访问结束-3.切换左侧menu
        this.recordMicroAppsEnd(this.currentShowApp);
      }
    }
  },
  methods: {
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
          className = "microAppView";
        }
      } catch (error) { }
      return className;
    },
    openAppView(data, option) {
      for (let i = 0; i < this.openAppList.length; i++) {
        const app = this.openAppList[i];
        if (app.id === data.from) {
          this.openAppList.splice(i, 1);
          break;
        }
      }
      setTimeout(() => {
        this.openActiveApp(
          {
            id: data.from, // 微应用id
            logo: data.logo, // 微应用logo
            name: data.name, // 微应用名称
            pcHomePageUrl: data.url, // 微应用链接
            noStatis: true // 是否不统计使用次数
          },
          option
        );
      }, 100);
    },
    closeHighUse(e) {
      this.isShowHighUse = false;
    },
    getAllmic(type = "normal") {
      this.$service.getAllMicroAppAndType
        .call(this, {
          corpId: this.LoginCompany.corpId,
          userId: this.LoginCompany.id
        })
        .then(res => {
          let appList = [],
            typeList = [];
          if (res.data) {
            appList = res.data.listAppDTO || [];
            typeList = res.data.appType || [];
          }
          appList = appList.filter(app => {
            const name = app.name;
            let result = !NotInOpenApp.includes(name);
            return result;
          });
          typeList = typeList.reverse().map(type => {
            type.apps = appList.filter(app => app.openType === type.typeCode);
            return type;
          });
          this.microAppList.splice(0, this.microAppList.length, ...appList);
          this.showAppListAndType.splice(
            0,
            this.showAppListAndType.length,
            ...typeList
          );
          this.highUseApps = this.microAppList.slice(0, 5);
          this.$emit("refreshApps", type);
        });
    },
    async openActiveApp(app, option = {}) {
      this.openOptions = option;
      if (this.$route.name !== "Open") {
        this.$router.push({ name: "Open" });
      }
      if (app.id && app.pcHomePageUrl) {
        //访问结束-2.切换微应用(微应用间切换)
        this.recordMicroAppsEnd(this.currentShowApp);
        app.loadPCUrl = app.pcHomePageUrl;
        this.showApp = true;
        this.showOrigin = false;
        this.currentShowApp = app;
        if (!this.appids.includes(app.id)) {
          this.openAppList.push(app);
        } else if (option.from === "notice") {
          this.closeApp(app, true);
          this.$nextTick(() => {
            this.openAppList.push(app);
          });
        }
        //访问开始-1.打开微应用、访问开始-2.切换微应用
        this.recordMicroAppsBegin(app);
      } else {
        this.$message.info("此微应用链接无效，请联系后台管理员");
      }
    },
    async closeApp(app, isOnlyClose = false) {
      //访问结束-1.关闭微应用
      this.recordMicroAppsEnd(app);
      let temp = [];
      let closeIndex = 0;
      for (let i = 0; i < this.openAppList.length; i++) {
        let item = this.openAppList[i];
        if (item.id !== app.id) {
          temp.push(item);
        } else {
          closeIndex = i;
        }
      }
      if (!isOnlyClose) {
        if (temp.length > 0) {
          if (this.currentShowApp.id == app.id) {
            if (closeIndex == this.openAppList.length - 1) {
              this.currentShowApp = temp[temp.length - 1];
            } else {
              this.currentShowApp = temp[closeIndex];
            }
            this.recordMicroAppsBegin(this.currentShowApp);
          }
        } else {
          this.showApp = false;
          this.showOrigin = true;
        }

        if (this.openOptions.from === "notice" && this.openOptions.isBack) {
          this.$router.push({ name: "notify" });
        }
      }
      this.openAppList = [...temp];
    },
    backTorigin(msg) {
      if (msg) {
        //切换至开tab
        this.recordMicroAppsEnd(this.currentShowApp);
        this.openedMicroApps = new Map();
        this.currentShowApp = {};
        this.showOrigin = true;
      }
    },
    /**
     * @description 微应用访问次数统计
     * 访问开始：1.打开微应用、2.切换微应用（切入）、3.切换左侧menu（切入）、4.智信由最小化变为最大化、5.智信获取焦点微应用可见
     * 访问结束：1.关闭微应用、2.切换微应用（切出）、3.切换左侧menu（切出）、4.智信最小化、右上角关闭（同最小化）、 5.退出至登录页、6.托盘退出、7.失去焦点
     */
    /**
     * @description 智信应用获取焦点
     */
    mainFocus() {
      //访问开始-5.智信应用获取焦点
      this.recordMicroAppsBegin(this.currentShowApp);
    },
    /**
     * @description 智信应用失去焦点
     */
    mainBlur() {
      //访问结束-7.智信应用失去焦点
      this.recordMicroAppsEnd(this.currentShowApp);
    },
    /**
     * @description 托盘退出
     */
    mainQuit() {
      //访问结束-6.托盘退出
      this.recordMicroAppsEnd(this.currentShowApp);
    },
    /**
     * @description 智信显示/隐藏/右上角关闭
     */
    mainVisible(event, status) {
      if (status) {
        //访问结束-4.智信最小化、右上角关闭（同最小化）
        //会触发失去焦点事件
      } else {
        //访问开始-4.智信由最小化变为最大化
        this.recordMicroAppsBegin(this.currentShowApp);
      }
    },
    /**
     * @description 退出至login页面
     */
    async exitToLogin() {
      if (this.goLogin) {
        //解决调用两遍问题
        this.goLogin = false;
        //访问结束-5.退出至登录页
        await this.recordMicroAppsEnd(this.currentShowApp);
        this.currentShowApp = {};
      }
    },
    /**
     * @description 访问开始
     */
    recordMicroAppsBegin(app) {
      if (this.net_type == "2") return; //内网不进行统计
      return; // 暂时屏蔽统计
      if (app && app.id) {
        this.openedMicroApps.set(app.id, this.getNowTime());
      }
    },
    /**
     * @description 访问结束
     */
    async recordMicroAppsEnd(app) {
      if (this.net_type == "2") return; //内网不进行统计
      return; // 暂时屏蔽统计
      if (app && app.id && this.showApp && !this.showOrigin) {
        if (this.openedMicroApps.has(app.id)) {
          let params = {
            corpId: this.LoginCompany.corpId,
            userId: this.LoginCompany.id,
            appId: app.id,
            appType: app.type,
            startTime: "",
            endTime: this.getNowTime()
          };
          params.startTime = this.openedMicroApps.get(app.id);
          this.openedMicroApps.delete(app.id);
          //写入文件
          this.fileRW.write(JSON.stringify(params) + "|");
          //加入内存
          this.openedMicroAppsList.push(params);
        }
        if (!this.throttleRecord) {
          this.throttleRecord = Util.throttle(
            this.recordMicroAppsEndThrottle,
            60 * 1000
          );
          this.throttleRecord(this.openedMicroAppsList);
        } else {
          this.throttleRecord(this.openedMicroAppsList);
        }
      }
    },
    /**
     * @description 节流调用接口
     */
    async recordMicroAppsEndThrottle(list) {
      this.throttleRecord = null;
      try {
        if (list.length > 0) {
          let userAppOperations = list;
          let res = await this.$service.recordMicroApps({ userAppOperations });
          //清空内存
          this.openedMicroAppsList = [];
          //清空文件
          this.fileRW.clear();
        }
      } catch (error) { }
    },
    /**
     * @description 初期化接口调用
     */
    initRecord() {
      return; // 暂时屏蔽统计
      this.fileRW.read().then(res => {
        if (res) {
          let list = res
            .split("|")
            .filter(item => item)
            .map(item => JSON.parse(item));
          if (list.length > 0) {
            this.recordMicroAppsEndThrottle(list);
          }
        }
      });
    },
    /**
     * @description 获取当前时间
     */
    getNowTime() {
      return moment().valueOf();
    }
  }
};
</script>
<style lang="scss" scoped>
#open-panel {
  // -webkit-app-region: drag;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .highFrequency {
    height: 24px;
    flex: 0 0 24px;
    font-size: 12px;
    color: #333333;
    display: flex;
    align-items: center;
    background-color: #eef1f6;
    line-height: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    .lable {
      display: flex;
      .icon {
        display: flex;
        width: 12px;
        height: 12px;
        background-color: #999;
        border-radius: 50%;
        margin: 0 10px;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        .iconfont {
          color: #fff;
          font-size: 6px;
        }
      }
    }
    .highUseApps {
      padding: 0 10px;
      box-sizing: border-box;
      position: relative;
      max-width: 140px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
      &::after {
        content: "";
        height: 13px;
        background-color: #333333;
        position: absolute;
        width: 1px;
        left: 0;
        top: 0;
      }
      &:nth-child(2) {
        &::after {
          display: none;
        }
      }
    }
  }
  .app-list-wrapper {
    display: flex;
    flex-wrap: wrap;
    .app-item {
      margin: 5px;
      cursor: pointer;
      img {
        width: 40px;
        height: 40px;
      }
      p {
        text-align: center;
      }
    }
  }
  .micro-container {
    // background-image: url("~@/assets/image/open_panel_bg.png");
    background-repeat: no-repeat;
    background-size: 100% auto;
    background-position: left bottom;
    position: relative;
    overflow: hidden;
    flex: 1;

    & > div {
      overflow-y: auto;
      width: 100%;
      height: 100%;
      position: relative;
    }

    &::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        180deg,
        #fff,
        rgba(255, 255, 255, 1) 50%,
        rgba(255, 255, 255, 0.7)
      );
    }
  }
  .ad-swipe {
    margin: 0;
    padding: 14px 20px;
    background-color: #fff;
  }
  .micro-apps {
    flex: 1;
    position: relative;
  }
  .webviews {
    width: 100%;
    flex: 1;
    overflow: hidden;
    .microAppView {
      max-width: 800px;
      margin: 0 auto;
      box-shadow: 0 0 20px 0px rgba(0, 0, 0, 0.07);
    }
  }
}
</style>
