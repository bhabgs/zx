<template>
  <section class="drop-container">
    <div class="drop-down">
      <button
        @click="showDropMenu($event)"
        class="drop-btn iconfont icon-gengduo"
      ></button>
    </div>
    <transition name="fade" mode="in-out">
      <ul class="drop-menu hidden group-[:hover]-block">
        <li 
          class="drop-menu-item" 
          v-for="row of menuList" 
          :key="row.type"   
          @click="select(row.type)"
        >
          <button
            class="item-button"
            :class="[row.icon ? row.icon : '']"
          >
            <img v-if="row.img" :src="row.img" alt="" />
            <span class="item-text" v-text="row.title"></span>
          </button>
        </li>
        <!-- <li class="drop-menu-item">
          <button
            class="item-button iconfont icon-guanyuzhixin"
            @click="select('about')"
          >
            <span class="item-text">关于{{ shortcutName }}</span>
          </button>
        </li>
        <li class="drop-menu-item">
          <button
            class="item-button iconfont icon-tuichudenglu"
            @click="select('help')"
          >
            <span class="item-text">帮助中心</span>
          </button>
        </li>
        <li class="drop-menu-item">
          <button class="item-button" @click="select('clear')">
            <img src="~@/assets/image/chitchat/clear.png" alt="" />
            <span class="item-text">清理缓存</span>
          </button>
        </li>
        <li class="drop-menu-item">
          <button
            class="item-button iconfont icon-tuichudenglu"
            @click="select('quit')"
          >
            <span class="item-text">退出登录</span>
          </button>
        </li> -->
      </ul>
    </transition>
  </section>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import { ipcRenderer } from "electron";
const remote = require("@electron/remote");
import {
  PollingReadState,
  PollingNotify,
  PollingOutSideNotify,
  PollingMailUnRead,
} from "../../../plugin/polling-notice";
import { PushNotice } from "../../../plugin/push-dispose";
const { shortcutName } = remote.getGlobal("appInfo");
export default {
  name: "HeaderMenu",
  data() {
    return {
      IsActive: false,
      shortcutName,
    };
  },
  mounted() {
    window.eventHub.$on("logout", this.quitHandle);
    window.eventHub.$on("drop-close", this.close);
    window.addEventListener("click", this.close);
  },
  beforeDestroy() {
    window.eventHub.$off("logout", this.quitHandle);
    window.eventHub.$off("drop-close", this.close);
    window.removeEventListener("click", this.close);
  },
  computed: {
    ...mapGetters(["GetMicroApps"]),
    CCChat() {
      let apps = this.GetMicroApps.listAppDTO || [];
      let temp =
        apps.find(
          (item) => item.name.includes("同事圈") && item.status === 1
        ) || {};
      return temp;
    },
    menuList() {
      const { CCChat, shortcutName } = this;
      const menus = [
        {
          title: `关于${shortcutName}`,
          type: "about",
          img: require("@/assets/image/about.png"),
        },
        {
          title: "帮助中心",
          type: "help",
          img: require("@/assets/image/help.png"),
        },
        {
          title: "设置",
          type: "setting",
          img: require("@/assets/image/setting.png"),
        },
        {
          title: "修复联系人",
          type: "fix",
          img: require("@/assets/image/contacts/fix-contact.png"),
        },
        {
          title: "清理缓存",
          type: "clear",
          img: require("@/assets/image/chitchat/clear.png"),
        },
        {
          title: "登录日志",
          type: "log",
          img: require("@/assets/image/login/login-log.png"),
        },
        {
          title: "退出登录",
          type: "quit",
          img: require("@/assets/image/login/logout.png"),
        },
      ];
      if (CCChat.name) {
        menus.unshift({
          title: CCChat.name,
          type: "co",
          icon: "iconfont icon-tongshiquan",
        });
      }

      return menus;
    },
  },
  methods: {
    ...mapActions(["LogOutAction"]),
    showDropMenu(e) {
      if (!this.IsActive) {
        e.stopPropagation();
        window.eventHub.$emit("drop-close");
        this.IsActive = true;
      }
    },
    close() {
      if (this.IsActive) {
        this.IsActive = false;
      }
    },
    select(type) {
      // 用户点击选择处理
      const { CCChat } = this;
      switch (type) {
        case "about":
          window.eventHub.$emit("show-about");
          break;
        case "clear":
          window.eventHub.$emit("show-clear");
          break;
        case "log":
          window.eventHub.$emit("show-login-log");
          break;
        case "co":
          // 同事圈
          window.eventHub.$emit("openApp", CCChat);
          break;
        case "help":
          window.open(this.$apipath.appUrl.help);
          break;
        case 3:
        case "setting":
          ipcRenderer.send("open-setting-panel");
          break;
        case "fix":
          window.eventHub.$emit("fix-contact");
          break;
        case "quit":
          this.quitHandle();
          break;
        default:
          break;
      }
      this.IsActive = false;
    },
    async quitHandle() {
      // 退出智信
      try {
        let evt = new Event("logout", { bubbles: true, cancelable: false });
        document.dispatchEvent(evt);
        await this.$service.logout();
        this.LogOutAction();
        sessionStorage.clear();
        ipcRenderer.send("gologin");
        this.$router.push("/");
        clearTimeout(window.refreshNotify);
        PollingNotify.stopPulling();
        PollingOutSideNotify.stopPulling();
        PollingReadState.stopPulling();
        PollingMailUnRead.stopPulling();
        PushNotice.reset();
        await ipcRenderer.invoke("sqlite-close");
      } catch (error) {}
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.drop-container {
  .drop-down {
    line-height: 1;
    margin-bottom: 20px;
    .drop-btn {
      text-align: center;
      font-size: 20px;
      color: rgba(255,255,255,0.6);
      background-color: transparent;
    }
    &:hover {
      .drop-btn {
        color: rgba(255,255,255,0.8);
      }
    }
  }
  .drop-menu {
    position: absolute;
    transform: translate(0, 7px);
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    z-index: 999;
    padding: 8px;
    .drop-menu-item {
      width: 100%;
      transition: background-color 0.15s ease-in;
      margin-bottom: 4px;
      &:hover {
        background-color: $--menu-hover-bgcolor;
      }
      .item-button {
        padding: 0 8px;
        word-break: keep-all;
        display: flex;
        align-items: center;
        background-color: transparent;
        color: #5d616b;
        font-size: 14px;
        font-weight: 400;
        color: #999;
        > img {
          width: 16px;
          height: 16px;
        }
      }
      .item-text {
        padding-left: 8px;
        color: #333;
        font-size: 14px;
        line-height: 22px;
        margin: 5px auto;
      }
    }
  }
}
</style>
