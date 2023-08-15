<!-- 通知左侧列表 -->
<template>
  <div class="notifyList">
    <div class="tabs" v-if="isShowBtnTab">
      <div
        v-for="(item, index) in btnlist"
        :key="index"
        @click="selectChange(index)"
        :class="activeIndex == index ? `active-${activeIndex}` : ''"
      >
        <img
          :src="activeIndex == index ? item.activeImgPath : item.imgPath"
          :alt="item.name"
        />
        <span>{{ item.name }}</span>
        <Badge
          v-if="item.numberTotal > 0"
          class="hint-sign number-sign type-sign"
          :class="{
            'low-color': item.numberType == 1,
            'mid-color': item.numberType == 2,
            'hot-color': item.numberType == 3,
          }"
          :count="+item.numberTotal"
        ></Badge>
        <Badge
          v-else-if="item.total > 0"
          class="hint-sign type-hint-sign"
          :class="{
            'low-color': item.hintType == 1,
            'mid-color': item.hintType == 2,
            'hot-color': item.hintType == 3,
          }"
          :count="+item.total"
          dot
        ></Badge>
      </div>
    </div>
    <div class="tabContent">
      <ul>
        <li
          v-for="item in showList"
          :key="item.id"
          :class="{ active: activeApp.id == item.id }"
          @click="selectNoticeHandler(item)"
          :id="activeApp.id == item.id ? activeApp.id : ''"
        >
          <div class="logo avatar-box">
            <img v-show="item.notificationLogo" :src="item.notificationLogo" />
            <Badge
              v-if="item.unReadNumberCount > 0"
              class="hint-sign number-sign"
              :class="{
                'low-color': $myUtils.getHintType(item.unReadNumberCount) == 1,
                'mid-color': $myUtils.getHintType(item.unReadNumberCount) == 2,
                'hot-color': $myUtils.getHintType(item.unReadNumberCount) == 3,
              }"
              :count="+item.unReadNumberCount"
            ></Badge>
            <Badge
              v-else-if="item.unReadCounts > 0"
              class="hint-sign"
              :class="{
                'low-color': $myUtils.getHintType(item.unReadCounts) == 1,
                'mid-color': $myUtils.getHintType(item.unReadCounts) == 2,
                'hot-color': $myUtils.getHintType(item.unReadCounts) == 3,
              }"
              :count="+item.unReadCounts"
              dot
            ></Badge>
          </div>
          <div class="name">{{ item.name }}通知</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
//import..
import { mapGetters, mapActions } from "vuex";
import utils from "../../plugin/utils";

const { throttle, hintType } = utils;

export default {
  name: "notify-list",
  components: {},
  props: {},
  data() {
    //这里存放数据
    return {
      hasVisited: false,
      activeApp: {}, // 选中app
      activeIndex: 0, // tab切换
      tempAppData: [], // 存储请求的原始数据
      unReadCountByAppType: {
        iot: {},
        work: {},
      },
      isLoading: false,
      haveActiveItem: false, //有选中的item 重强提醒进入通知 默认有选中的item
    };
  },
  created() {
    this.refresh();
    window.eventHub.$on("refreshNotice", this.initList);
    window.addEventListener("show-notify", (event) =>
      this.showNotifyHandle(event)
    );
  },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {
    this.initList();
  },
  activated() {
    this.initList();
  },
  //监听属性 类似于data概念
  computed: {
    ...mapGetters(["GetUser", "GetCompany", "GetNotifyList"]),
    btnlist() {
      const btn = [
        {
          name: "IOT",
          imgPath: require("@/assets/image/notify/iot.png"),
          activeImgPath: require("@/assets/image/notify/iotActive.png"),
          type: "iot",
          total: this.unReadCountByAppType.iot.total,
          numberTotal: this.unReadCountByAppType.iot.numberTotal,
          hintType: this.unReadCountByAppType.iot.hintType,
          numberType: this.unReadCountByAppType.iot.numberType,
        },
        {
          name: "办公",
          imgPath: require("@/assets/image/notify/office.png"),
          activeImgPath: require("@/assets/image/notify/officeActive.png"),
          type: "work",
          total: this.unReadCountByAppType.work.total,
          numberTotal: this.unReadCountByAppType.work.numberTotal,
          hintType: this.unReadCountByAppType.work.hintType,
          numberType: this.unReadCountByAppType.work.numberType,
        },
      ];
      return btn;
    },
    appList() {
      // 应用通知列表
      let list = {
        iot: [], // iot类
        work: [], // 办公类
      };
      const { tempAppData } = this;
      // openType 应用分类，1：办公应用，2：IOT应用
      tempAppData.forEach((app) => {
        if (app.openType == 1) {
          list.work.push(app);
        } else if (app.openType == 2) {
          list.iot.push(app);
        }
      });

      return list;
    },
    showList() {
      let list = [];
      list = this.activeIndex === 1 ? this.appList.work : this.appList.iot;
      return list;
    },
    isShowBtnTab() {
      return this.appList.iot.length && this.appList.work.length;
    },
  },
  //监控data中的数据变化
  watch: {
    GetCompany: {
      deep: true,
      handler(val, old) {
        if (old.corpId != val.corpId) {
          this.activeIndex = 0;
          this.initList();
        }
      },
    },
    activeIndex(newVal, oldVal) {
      if (newVal != oldVal) {
        if (!this.haveActiveItem) {
          this.activeApp = {};
        }
        this.haveActiveItem = false;
        this.initList();
      }
    },
    $route: {
      handler(to, from) {
        if (to.name == "notify" && (!from || from.name !== "notify")) {
          if (this.hasVisited) {
            this.initList({ isOnlyGet: true });
          } else {
            this.hasVisited = true;
            this.initList();
          }
        }
      },
      immediate: true
    },
  },
  //方法集合
  methods: {
    ...mapActions(["SetNotifyList", "SetActiveNotifyApp", "SetNotifyUnRead"]),
    selectChange(index) {
      // iot与办公切换
      this.activeIndex = index;
    },
    selectNoticeHandler(item, isInit = false) {
      // 选择通知查看列表
      const { SetActiveNotifyApp } = this;
      SetActiveNotifyApp(item);
      this.activeApp = item;
      if (!isInit) {
        this.initList({ isOnlyGet: true });
      }
    },
    refresh() {
      clearTimeout(window.refreshNotify);
      window.refreshNotify = setTimeout(() => {
        this.initList({ isOnlyGet: true });
      }, 30000);
    },
    /**
     * 获取通知应用列表&&未读数
     */
    initList: throttle(function ({ isOnlyGet = false } = {}) {
      if (!this.hasVisited) {
        return;
      }
      if (this.isLoading && isOnlyGet) {
        return;
      }
      const { id, corpId } = this.GetCompany;
      if (id) {
        if (isOnlyGet) {
          this.isLoading = true;
        }
        return this.$service.getAllMicroApp
          .call(this, {
            corpId,
            userId: id,
            type: 2,
            filterNull: true,
            isShowErr: !isOnlyGet,
          })
          .then((res) => {
            if (res.data) {
              let list = res.data || [];
              this.tempAppData = list;
              this.SetNotifyList(list);
              this.setUnRead(list);

              if (this.appList.iot.length || this.appList.work.length) {
                let appIds = list.map((app) => app.id);
                // 根据更新后的数据确定IOT应用和办公应用的选中状态
                if (this.activeIndex === 1) {
                  !this.appList.work.length && (this.activeIndex = 0);
                } else {
                  !this.appList.iot.length && (this.activeIndex = 1);
                }
                if (this.activeApp) {
                  const activeItem = document.getElementById(this.activeApp.id);
                  activeItem && activeItem.scrollIntoView();
                }
                if (!isOnlyGet) {
                  // 处理默认选中应用
                  if (
                    Object.keys(this.activeApp).length > 0 &&
                    appIds.includes(this.activeApp.id)
                  ) {
                    this.selectNoticeHandler(this.activeApp, true);
                  } else if (this.appList.iot.length && this.activeIndex == 0) {
                    this.selectNoticeHandler(this.appList.iot[0], true);
                  } else if (
                    this.appList.work.length &&
                    this.activeIndex == 1
                  ) {
                    this.selectNoticeHandler(this.appList.work[0], true);
                  }
                }
              } else {
                this.selectNoticeHandler({}, true);
              }
            }
          })
          .finally(() => {
            if (isOnlyGet) {
              // this.isLoading = false;
            }
            this.refresh();
          });
      }
    }, 1000),
    /**
     * @description 保存未读数据
     */
    setUnRead(list) {
      let total = 0,
        numberTotal = 0;
      let iotNumber = { total: 0, numberTotal: 0 }; // iot 类型未读
      let workNumber = { total: 0, numberTotal: 0 }; // 办公类型未读
      list.forEach((app) => {
        // openType 应用分类，1：办公应用，2：IOT应用
        if (app.openType == 1) {
          app.unReadCounts > 0 && (workNumber.total += 1 * app.unReadCounts);
          app.unReadNumberCount > 0 &&
            (workNumber.numberTotal += 1 * app.unReadNumberCount);
        } else if (app.openType == 2) {
          app.unReadCounts > 0 && (iotNumber.total += 1 * app.unReadCounts);
          app.unReadNumberCount > 0 &&
            (iotNumber.numberTotal += 1 * app.unReadNumberCount);
        }
      });
      total = iotNumber.total + workNumber.total;
      numberTotal = iotNumber.numberTotal + workNumber.numberTotal;
      iotNumber.hintType = hintType(iotNumber.total);
      iotNumber.numberType = hintType(iotNumber.numberTotal);
      workNumber.hintType = hintType(workNumber.total);
      workNumber.numberType = hintType(workNumber.numberTotal);

      let type = hintType(total);
      let numberType = hintType(numberTotal);
      let data = { total, hintType: type, numberTotal, numberType };

      this.SetNotifyUnRead(data);
      this.$set(this.unReadCountByAppType, "iot", iotNumber);
      this.$set(this.unReadCountByAppType, "work", workNumber);
    },
    showNotifyHandle(data) {
      if (this.$route.name !== "notify") {
        // 如果不在当前路由，跳转到通知
        this.$router.push({ name: "notify" });
      }

      if (data.detail.appId && data.detail.notificationType) {
        // 如果传入了AppID，则根据AppID选中App通知
        let item = {};
        this.haveActiveItem = true;
        if (data.detail.notificationType == 1) {
          item = this.appList.work.find((item) => item.id == data.detail.appId);
          this.activeIndex = 1;
        } else {
          item = this.appList.iot.find((item) => item.id == data.detail.appId);
          this.activeIndex = 0;
        }
        console.log("这是要去的通知", item);
        if (item) {
          this.selectNoticeHandler(item);
        }
      }
    },
  },
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/constant";
.notifyList {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  background-color: #fff;
  .tabs {
    height: 40px;
    display: flex;
    border-bottom: 1px solid #e7e7e7;
    > div {
      position: relative;
      width: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      color: #999999;
      cursor: pointer;
      &:nth-child(1) {
        border-right: 1px solid #e7e7e7;
      }
      img {
        width: 18px;
        height: 18px;
        margin-right: 10px;
      }
      @for $i from 0 through 1 {
        &.active-#{$i} {
          color: #4598f0;
        }
      }

      .type-hint-sign {
        top: 6px;
        right: 32px;
        position: absolute;
      }

      .type-sign {
        top: -2px !important;
        right: 22px !important;
        position: absolute;

        ::v-deep .ivu-badge-count {
          font-size: 8px;
          height: 14px;
          padding: 0 3px;
          min-width: auto;
          line-height: normal;
        }
      }
    }
  }
  .tabContent {
    flex: 1;
    overflow-y: auto;
    ul {
      width: 100%;
      height: 100%;
      transform: translateZ(0);
      li {
        position: relative;
        height: 60px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        color: #333333;
        font-weight: 400;
        font-size: 14px;
        cursor: pointer;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 0;
          border-bottom: 1px solid #e7e7e7;
        }

        &:hover {
          background-color: $--menu-hover-bgcolor;
        }
        &.active {
          @include menu-select-style;
        }
        .logo {
          box-sizing: border-box;
          position: relative;
          overflow: visible;
          transform: translateZ(0);
          img {
            width: 100% !important;
            height: 100% !important;
            vertical-align: baseline;
          }
          .hint-sign {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            top: 5px;
            right: 0px;
            background-color: transparent;
            transform: translateZ(0);
            .ivu-badge-dot {
              top: 0;
              right: 0;
              transform: translateZ(0);
            }
          }
        }
      }
    }
  }

  .number-sign {
    top: -5px !important;
  }
}
</style>
