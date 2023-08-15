<template>
  <header class="open-header header-container">
    <div class="title-box">{{ ExtCorpInfo.showName || currentCorpName }}</div>
    <div class="nav-box">
      <div class="nav-buttons">
        <el-popover
          v-model="showPopper"
          v-if="showDetail"
          @blur="showPopper = false"
          placement="bottom"
          popper-class="all-apps"
          :visible-arrow="true"
          width="335"
          trigger="hover"
        >
          <template solt="content" class="apps">
            <div class="app" v-for="app in apps" :key="app.id" @click="goToPage(app)">
              <div class="appLogo">
                <img :src="app.logo" :alt="app.name" />
              </div>
              <div class="appName" :title="app.name">{{ app.name }}</div>
            </div>
          </template>
          <div slot="reference" class="img-button whitespace-nowrap" @click.stop="backTorigin">
            <!-- <i class="open-icon iconfont icon-_huabanfuben3"></i> -->
            <SvgIcon name="app" class="w-4 h-4 mb-1" />
            <div class="name">应用</div>
          </div>
        </el-popover>
        <div class="apps-content" v-if="showDetail">
          <div class="left-arrow">
            <i
              @click="movePrevious"
              v-if="showarrow && showLeft"
              class="iconfont icon-arrow-bottom"
            ></i>
          </div>
          <div class="show-apps" id="showApps" v-horwheel>
            <div
              class="show-app"
              v-for="app in appsBtn"
              :class="app.id == currentApp.id ? 'clickApp' : ''"
              :key="app.id"
              :title="app.name"
              @click="clickApp($event, app)"
            >
              <div class="closeApp !flex !items-center !justify-center" @click.stop="closeApp(app)">
                <i class="iconfont icon-close"></i>
              </div>
              <div class="logo">
                <img :src="app.logo" />
              </div>
              <div class="name">{{ app.name | cutString(6) }}</div>
            </div>
          </div>
          <div class="right-arrow">
            <i @click="moveNext" v-if="showarrow && showRight" class="iconfont icon-arrow-bottom"></i>
          </div>
        </div>
      </div>
      <div class="search-box mini-search" :class="showBtn ? '' : 'large-search'" @click="showInput">
        <i class="search-icon iconfont icon-sousuo"></i>
        <input
          v-if="!showBtn"
          id="pte2"
          class="search-input"
          v-model.trim="searchVal"
          @focus="searchFocusHandle()"
          @blur="searchBlurHandle()"
          type="text"
          placeholder="搜索"
        />
        <div class="searchApps" v-if="IsSearch" @click.stop v-loading="isSearching">
          <ul class="searchContent" v-if="searchList.length > 0">
            <li v-for="app in searchList" :key="app.id" @mousedown.stop="searchGoToPage(app)">
              <img :src="app.logo" alt />
              <div v-text="app.name"></div>
            </li>
          </ul>
          <div
            v-if="searchHistory.length > 0"
            class="clearable"
            @mousedown.stop="clearHistory"
          >清空历史记录</div>
          <div v-if="isNothingSearch" class="nothing">
            <img src="~@/assets/image/common/noData.png" alt />
            <p>暂无搜索结果</p>
          </div>
        </div>
      </div>
    </div>
    <div class="right-box">
      <user-photo class="self-avatar" :user="userInfo" :hasInfo="true"></user-photo>
      <system-menu class="system-menu"></system-menu>
    </div>
  </header>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { NotInOpenApp } from "../../config/micro-app-config";

export default {
  name: "OpenHeader",
  components: {},
  props: {
    showDetail: {
      type: Boolean,
      default: false
    },
    showAppList: {
      type: Array
    },
    apps: {
      type: Array
    },
    currentApp: {
      type: Object
    }
  },
  data() {
    return {
      IsSearch: false,
      searchVal: "",
      showPopper: false,
      appsBtn: [],
      scrollwidth: 0,
      showarrow: false,
      timeoutObj: null, // 滚动位置处理定时任务实例
      timeoutBtn: null, // 窗口变化监听任务实例
      showBtn: true, //是否展示按钮
      interval: null,
      searchList: [], //搜索列表
      showLeft: false, //左侧箭头
      showRight: false, //右侧箭头
      searchHistory: [], //搜索历史
      isNothingSearch: false, // 是否搜索到数据，true为没有数据
      isSearching: false // 是否正在搜索
    };
  },
  created() { },
  beforeDestroy() {
    window.eventHub.$off("reszie", this.handlerResize);
  },
  mounted() {
    this.interval = this.$myUtils.Debounce(this.searchApp, 1000);
    window.eventHub.$on("resize", this.handlerResize);
  },
  computed: {
    ...mapGetters({
      userInfo: "GetUser",
      OpenDialog: "GetOpenDialog",
      Groups: "GetGroups",
      GetCompany: "GetCompany",
      AllUserMap: "GetAllUserMap",
      ExtCorpInfo: "GetExtCorpInfo"
    }),
    currentCorpName() {
      let name = "";
      if (this.GetCompany && this.GetCompany.corp) {
        name =
          this.GetCompany.corp.name || this.GetCompany.corp.shortName || "";
      }
      return name;
    }
  },
  watch: {
    currentApp: {
      handler(newVal, oldVal) {
        this.init();
      },
      deep: true
    },
    showAppList: {
      handler(newVal, oldVal) {
        this.init();
      },
      deep: true
    },
    searchVal(newVal, oldVal) {
      if (newVal != oldVal && this.IsSearch) {
        this.interval();
      }
    }
  },
  methods: {
    // 窗口变化时一些处理
    handlerResize() {
      this.timeoutBtn && clearTimeout(this.timeoutBtn);
      this.timeoutBtn = setTimeout(() => {
        this.init();
        let screenWidth = document.body.clientWidth;
        if (screenWidth >= 1440) {
          let searchElemnt = document.getElementsByClassName("search-box")[0];
          searchElemnt.classList.add("large-search");
          this.showBtn = false;
        } else {
          this.showBtn = true;
        }
        return this.showBtn;
      }, 50);
    },
    /**
     *搜索
     */
    searchApp() {
      this.isNothingSearch = false;
      this.isSearching = true;
      this.$service.getAllMicroApp
        .call(this, {
          corpId: this.GetCompany.corpId,
          userId: this.GetCompany.id,
          name: this.searchVal
        })
        .then(res => {
          let appList = [];
          if (res.data) {
            appList = res.data || [];
          }
          appList = appList.filter(app => {
            const pcHomePageUrl = app.pcHomePageUrl;
            const name = app.name;
            if (
              !pcHomePageUrl.includes("ftp:/") &&
              pcHomePageUrl &&
              !NotInOpenApp.includes(name) &&
              [1, 2].includes(+app.openType)
            ) {
              return true;
            } else {
              return false;
            }
          });
          this.closeLoading();
          !appList.length && (this.isNothingSearch = true);
          this.searchHistory = [];
          this.searchList.splice(0, this.searchList.length, ...appList);
        })
        .catch(err => {
          this.closeLoading();
        });
    },
    /**
     * 关闭搜索中的loading
     */
    closeLoading() {
      setTimeout(() => {
        this.isSearching = false;
      }, 200);
    },
    /**
     * 初始化头部列表以及添加初始类名
     */
    init() {
      this.timeoutObj && clearTimeout(this.timeoutObj);

      this.timeoutObj = setTimeout(() => {
        this.appsBtn = [...this.showAppList];
        this.$nextTick(() => {
          let element = document.getElementById("showApps");
          let scrollwidth = element ? element.scrollWidth : 0;
          let width = element ? element.offsetWidth || element.clientWidth : 0;
          this.scrollwidth = scrollwidth - width;
          if (this.scrollwidth > 0) {
            this.showarrow = true;
            this.showLeft = true;
            this.showRight = true;
          } else {
            this.showarrow = false;
          }
          let appElement = document.getElementsByClassName("clickApp");
          if (appElement.length > 0) {
            appElement[0].scrollIntoView(false);
          }
        });
      }, 50);
    },

    searchFocusHandle() {
      this.IsSearch = true;
      this.isNothingSearch = false;
      this.searchHistory =
        JSON.parse(
          localStorage.getItem(`${this.GetCompany.id}_searchHistory`)
        ) || [];
      this.searchList = [...this.searchHistory];
    },
    searchBlurHandle() {
      this.closeSearch();
      this.IsSearch = false;
    },
    closeSearch() {
      this.searchList = [];
      this.searchVal = "";
      if (document.body.clientWidth <= 1440) {
        this.showBtn = true;
      }
    },
    /**
     * 点击打开微应用
     */
    goToPage(app) {
      this.$emit("showApp", app);
    },
    /**
     * 搜索后添加搜索历史
     */
    searchGoToPage(app) {
      this.searchHistory =
        JSON.parse(
          localStorage.getItem(`${this.GetCompany.id}_searchHistory`)
        ) || [];
      let appIds = this.searchHistory.map(app => app.id);
      if (!appIds.includes(app.id)) {
        this.searchHistory.push(app);
      }
      localStorage.setItem(
        `${this.GetCompany.id}_searchHistory`,
        JSON.stringify(this.searchHistory)
      );
      this.goToPage(app);
    },
    /**
     * 清空搜索历史
     */
    clearHistory() {
      this.searchHistory = [];
      localStorage.setItem(
        `${this.GetCompany.id}_searchHistory`,
        JSON.stringify(this.searchHistory)
      );
      this.searchList = [];
    },
    /**
     * 关闭已打开的微应用
     */
    closeApp(app) {
      this.$emit("closeApp", app);
    },
    /**
     * 点击激活头部微应用
     */
    clickApp(e, app) {
      this.showPopper = false;
      this.$emit("showApp", app);
    },
    /**
     * 左边箭头
     */
    moveNext() {
      let element = document.getElementById("showApps");
      if (element.scrollLeft < this.scrollwidth) {
        element.scrollLeft += 52;
        this.showLeft = true;
      } else {
        this.showRight = false;
      }
    },
    /**
     * 右边箭头事件
     */
    movePrevious() {
      let element = document.getElementById("showApps");
      if (element.scrollLeft > 0) {
        element.scrollLeft -= 52;
        this.showRight = true;
      } else {
        this.showLeft = false;
      }
    },
    /**
     * 展示输入框
     */
    showInput() {
      this.showBtn = false;
      this.$nextTick(() => {
        document.getElementById("pte2").focus();
      });
    },
    backTorigin() {
      this.$emit("backTorigin", true);
    }
  },
  filters: {
    cutString(str, len = 6) {
      if (str && typeof str === "string") {
        str = str.length > len ? `${str.substring(0, len - 1)}...` : str;
      }
      return str;
    }
  }
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/layout/header";
$--title-box-width: 180px;
.open-header {
  -webkit-app-region: drag;
  border: 0;
  flex-shrink: 0;
  .title-box {
    flex-shrink: 0;
    min-width: $--title-box-width !important;
    padding: {
      left: 14px;
      right: 14px;
    }
    max-width: 300px;
    font-size: 20px;
    color: #fff;
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right-box {
    flex-shrink: 0;
    box-sizing: border-box;
    flex-shrink: 0;
    flex: unset;
    padding: 0;
    padding-right: 20px;
    .self-avatar {
      margin-left: 40px;
    }
  }

  .nav-box {
    flex: 1;
    height: 100%;
    width: 0;
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .nav-buttons {
      flex: 1;
      display: flex;
      overflow: hidden;
      height: 100%;
      .el-popover__reference {
        -webkit-app-region: no-drag;
        width: 36px;
        height: 100%;
        border: none;
        position: relative;
        &::after {
          position: absolute;
          right: 0;
          content: "";
          display: block;
          height: 100%;
          width: 2px;
          // background: linear-gradient(
          //   0deg,
          //   rgba($color: #2d83df, $alpha: 0),
          //   rgba($color: #2d83df, $alpha: 1),
          //   rgba($color: #2d83df, $alpha: 0)
          // );
        }
        &.img-button {
          cursor: pointer;
          padding: 0;
          background: transparent;
          color: #fff;
          font-size: 12px;
          opacity: 0.5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          .open-icon {
            width: 16px;
            height: 16px;
            margin: {
              bottom: 7px;
            }
            border: 1.5px solid #fff;
            border-radius: 50%;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .name {
            // width: 16px;
            text-align: center;
            line-height: 1;
            color: #ffffff;
            font-size: 12px;
            font-weight: 500;
            opacity: 0.7;
          }
        }
      }
      .apps-content {
        flex: 1;
        display: flex;
        align-items: center;
        overflow: hidden;
        .left-arrow {
          -webkit-app-region: no-drag;
          width: 42px;
          transform: rotate(90deg);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0.5;
          flex-shrink: 0;
          i {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            color: #fff;
            font-size: 12px;
            cursor: pointer;
          }
        }
        .right-arrow {
          @extend .left-arrow;
          transform: rotate(-90deg);
        }
        .show-apps {
          -webkit-app-region: no-drag;
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          overflow: hidden;
          overflow-x: auto;
          height: 100%;
          padding: 4px 0;
          &::-webkit-scrollbar {
            display: none;
          }
          .show-app {
            // width: 42px;
            height: 100%;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            border-radius: 4px;
            position: relative;
            margin-right: 10px;
            cursor: pointer;
            // &:nth-last-child() {
            //   margin: 0;
            // }
            .closeApp {
              width: 14px;
              height: 14px;
              line-height: 4.9px;
              position: absolute;
              top: 0;
              right: -7px;
              border-radius: 50%;
              cursor: pointer;
              display: none;
              text-align: center;
              background: rgba(255, 255, 255, 0.5);
              border-radius: 50%;
              border: 2px solid var(--theme-bg);
              .iconfont {
                font-size: 6px;
                color: #000;
                opacity: 0.5;
              }
            }
            &:hover,
            &.clickApp {
              background: rgba(255, 255, 255, 0.2);
              .closeApp {
                display: block;
              }
            }
            .logo {
              flex-shrink: 0;
              width: 14px;
              height: 14px;
              overflow: hidden;
              display: flex;
              margin: {
                top: 5px;
                bottom: 5px;
              }
              img {
                width: 100%;
                height: 100%;
              }
            }
            .name {
              width: 100%;
              line-height: 1;
              padding: 0 6px;
              color: #ffffff;
              font-size: 12px;
              font-weight: 500;
              opacity: 0.7;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              text-align: center;
            }
          }
        }
      }
    }
  }

  .mini-search {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
    background: rgba($color: #fff, $alpha: 0.16);
    cursor: pointer;
    border-radius: 40px;
    .search-icon {
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .search-input {
      width: 100%;
      height: 100%;
      margin: 0;
      background-color: transparent;
      &::placeholder {
        display: none;
        color: transparent;
      }
    }
    &.large-search {
      max-width: 270px;
      flex-basis: 270px;
      position: relative;
      .search-icon {
        left: 20px;
      }
    }
    .searchApps {
      position: absolute;
      flex-direction: column;
      background-color: #fff;
      top: 45px;
      left: 0;
      width: 270px;
      height: 345px;
      overflow: hidden;
      z-index: 9999;
      box-shadow: 0 0 10px rgba($color: #000, $alpha: 0.3);
      border-radius: 12px;
      display: flex;
      .nothing {
        width: 100%;
        height: 100%;
        padding-top: 38px;
        text-align: center;
        img {
          width: 140px;
          display: block;
          margin: auto;
          height: 138px;
        }
        p {
          margin-top: 19px;
          display: inline-block;
          font-size: 14px;
          font-family: PingFang-SC-Medium;
          font-weight: 500;
          color: #999;
        }
      }
      .searchContent {
        width: 100%;
        flex: 1;
        overflow: hidden;
        overflow-y: auto;
        > li {
          width: 100%;
          display: flex;
          height: 60px;
          justify-content: flex-start;
          align-items: center;
          border-bottom: 1px solid #e7e7e7;
          img {
            width: 46px;
            height: 46px;
            margin: 0 10px;
          }
          div {
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 14px;
            font-weight: 500;
            color: #383838;
          }
        }
      }
      .clearable {
        width: 100%;
        height: 40px;
        display: flex;
        border-top: 1px solid #e7e7e7;
        justify-content: center;
        align-items: center;
        color: #4498f0;
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
}
</style>
<style lang="scss">
.all-apps {
  width: 335px;
  height: 339px;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  justify-content: flex-start;
  box-sizing: border-box;
  padding: 0 11px !important;
  top: 50px !important;
  left: 90px !important;
  .app {
    width: 76px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    margin-bottom: 10px;
    border-bottom: 1px solid #e7e7e7;
    padding-bottom: 20px;
    cursor: pointer;
    .appLogo {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      img {
        width: 46px;
        height: 46px;
      }
    }
    .appName {
      font-size: 14px;
      color: #383838;
      font-weight: 500;
      width: 100%;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>
