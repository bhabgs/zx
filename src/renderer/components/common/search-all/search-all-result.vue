<!-- 全文检索搜索结果框 -->
<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="search-all-result-wrapper"
      v-loading="isRequesting"
      :style="{
        height: `${searchHeightValue}px`,
        width: `${searchWidthValue}px`
      }"
    >
      <el-tabs v-model="activeName" @tab-click="handleClick">
        <el-tab-pane
          v-for="tab in tabList"
          :key="tab.type"
          :label="tab.name"
          :name="tab.type"
        >
          <component
            :localHistory="localHistory"
            :search="search"
            :people="peopleResultList"
            :group="groupResultList"
            :recordInfo="recordResultInfo"
            :is="tab.component"
            :isRequesting="isRequesting"
            :defaultCheckType="defaultCheckType"
            @selectHandle="selectHandle"
            @changeSearch="changeSearch"
            @changeTabHandle="changeTabHandle"
            @changeLocal="initLocalHistory"
          ></component>
        </el-tab-pane>
      </el-tabs>
      <!-- <div class="search-key-button-operate">
        <img src="@/assets/image/search/key-button.png" alt="" />
      </div> -->
      <div
        class="chat-trigger-con chat-trigger-con-bottom"
        @mousedown="e => handleMousedown(e, 'bottom')"
      ></div>
      <div
        class="chat-trigger-con chat-trigger-con-right"
        @mousedown="e => handleMousedown(e, 'right')"
      ></div>
      <div
        class="chat-trigger-con chat-trigger-con-bottom-right"
        @mousedown="e => handleMousedown(e, 'all')"
      >
        <img src="@/assets/image/search/scale.png" />
      </div>
    </div>
  </transition>
</template>

<script>
import { ipcRenderer } from "electron";
import { pinyin } from "pinyin-pro";
import { mapActions, mapGetters } from "vuex";
export default {
  name: "SearchAllResult",
  props: {
    search: { type: String, require: true },
    visible: { type: Boolean }
  },
  data() {
    return {
      tabList: [
        { name: "全部", type: "all", component: "TabPaneAll" },
        { name: "联系人", type: "contact", component: "TabPaneContact" },
        { name: "群组", type: "group", component: "TabPaneGroup" },
        { name: "聊天记录", type: "record", component: "TabPaneRecord" }
        // { name: "应用", type: "app", component: "TabPaneApp" },
        // { name: "通知", type: "notify", component: "TabPaneNotify" }
      ], // tab标签列表
      activeName: "all", // 当前活跃的tab
      searchHandle: null, // 检索方法
      isRequesting: false,
      peopleResultList: [], // 搜索到的联系人列表
      groupResultList: [], // 搜索到的群组列表
      recordResultInfo: {}, // 搜索到的聊天记录其他信息条目等
      localHistory: [],
      defaultCheckType: "organization",
      canMove: false, // 是否可以移动
      searchHeightValue: 420,
      searchWidthValue: 360,
      isMoving: false,
      moveDirection: "all"
    };
  },
  computed: {
    ...mapGetters({
      AllUserMapByCorp: "GetAllUserMapByCorp",
      companyUser: "GetCompany",
      GroupInfoMap: "GetGroups",
      GetDialogues: "GetDialogues"
    }),
    // 将用户信息聚合，一个用户对应多公司
    allUserGather() {
      const allUsers = this.AllUserMapByCorp;
      let allUser = [];
      for (const key in allUsers) {
        const userAccountId = key.split("#")[0];
        const index = allUser.findIndex(
          user => user.accountId === userAccountId
        );
        if (index >= 0) {
          let corpIndex = allUser[index].corpUsers.findIndex(
            item => item.corpId == allUsers[key].corpId
          );
          if (corpIndex < 0) {
            allUser[index].corpUsers.push(allUsers[key]);
          }
        } else {
          if (allUsers[key].corpUsers) {
            allUser.push({
              ...allUsers[key],
              corpUsers: [...(allUsers[key].corpUsers || [])]
            });
          } else {
            allUser.push({ ...allUsers[key], corpUsers: [allUsers[key]] });
          }
        }
      }
      return allUser;
    },
    // 是否存在历史搜索
    hasLocalHistory() {
      return localHistory.length > 0;
    }
  },
  watch: {
    visible(newVal, oldVal) {
      if (!newVal && !this.search) {
        this.clearSearchHandle();
      }
      if (newVal && this.search) {
        // 再次聚焦时执行搜索
        this.searchHandle();
      }
      this.activeName = ["chitchat", "notify"].includes(this.$route.name)
        ? "all"
        : "contact";
    },
    search(newVal, oldVal) {
      if (newVal) {
        // 避免出现一开始缺省页面
        this.isRequesting = true;
      }
      if (newVal != oldVal && !!newVal && this.visible) {
        this.searchHandle();
      }
    },
    $route: {
      deep: true,
      handler(value) {
        if (value.name === "chitchat") {
          // 会话
          this.defaultCheckType =
            sessionStorage.getItem("chat-route-type") ||
            value.query.type ||
            "organization";
          this.activeName = "all";
        } else if (value.name == "notify") {
          //  通知
          this.defaultCheckType = "organization";
          this.activeName = "all";
        } else {
          // 名录
          this.defaultCheckType =
            sessionStorage.getItem("contacts-route-id") ||
            value.params.id ||
            "organization";
          this.activeName = "contact";
        }
      }
    }
  },
  async mounted() {
    this.searchHandle = this.$myUtils.Debounce(this.searchAll, 1000);
    await this.initLocalHistory();
    window.eventHub.$on("resize", this.checkPaneHandle);
  },
  methods: {
    // 清空搜索记录
    clearSearchHandle() {
      this.peopleResultList = [];
      this.groupResultList = [];
      this.recordResultInfo = {};
    },
    // 初始化历史搜索
    async initLocalHistory() {
      // const localStorageName = `${this.companyUser.accountId}_localSearchHistory`;
      // let temp = localStorage.getItem(localStorageName);
      // let result = [];
      // if (temp) {
      //   result = JSON.parse(temp);
      // }
      let result =
        (await ipcRenderer.invoke("sqlite-query", {
          key: "getLocalSearchHistory",
          input: { type: "" }
        })) || [];
      this.localHistory = [...result];
    },
    handleClick(tab, event) {
      console.log(tab, event);
    },
    // 改变tab页，全部页签更多跳转
    changeTabHandle(tab) {
      this.activeName = tab;
    },
    selectHandle(item) {
      this.$emit("selectresult", item);
    },
    changeSearch(item) {
      this.$emit("changeSearch", item);
    },
    /**
     * 搜索方法
     */
    async searchAll() {
      this.isRequesting = true;
      const searchVal = this.formatSearchVal(this.search);
      this.searchPeopleHandle(searchVal);
      this.searchGroupHandle(searchVal);
      await this.searchRecordHandle();
      this.isRequesting = false;
    },
    formatSearchVal(searchVal) {
      const searchTypeList = {
        char: [], // 字母
        number: [], // 数字
        chinese: [] // 汉字
      };
      const result = {
        name: [],
        mobile: ""
      };
      if (searchVal.trim()) {
        searchTypeList.char = searchVal
          .replace(/[^a-zA-Z]/g, " ")
          .split(" ")
          .filter(item => item);
        searchTypeList.number = searchVal
          .replace(/[^\d]/g, " ")
          .split(" ")
          .filter(item => item);
        searchTypeList.chinese = searchVal
          .replace(/[^\u4E00-\u9FA5]/g, " ")
          .split(" ")
          .filter(item => item);
        if (searchTypeList.number.length) {
          if (
            searchTypeList.number.length > 1 ||
            (searchTypeList.number.length &&
              searchTypeList.number[0].length > 9)
          ) {
            result.mobile = searchTypeList.number;
          } else {
            result.name.push(...searchTypeList.number);
          }
        }
        if (searchTypeList.chinese.length) {
          result.name.push(...searchTypeList.chinese);
        }
        if (searchTypeList.char.length) {
          result.name.push(...searchTypeList.char);
        }
      }
      return result;
    },
    /**
     * 搜索联系人
     */
    async searchPeopleHandle(searchVal) {
      // 从sqlite数据库中查询
      if (this.search.trim()) {
        let globalContactList = await ipcRenderer.invoke("sqlite-query", {
          key: "globalContact",
          input: { search: searchVal }
        });

        let globalContactRobotList = await ipcRenderer.invoke("sqlite-query", {
          key: "globalRobot",
          input: { search: searchVal }
        });
        // 转化成需要的格式
        globalContactList = [
          ...globalContactList,
          ...globalContactRobotList
        ].map(item => {
          let searchResult = {
            type: []
          };
          if (item._isName || item.accountId.includes("robot_")) {
            searchResult.type.push("name");
            searchResult.name = (item.name || item.nickName || "").replaceAll(
              new RegExp(`(${searchVal.name.join("|")})`, "g"),
              `<font color='#4281FE'>$1</font>`
            );
          }
          if (item._isMobile) {
            searchResult.type.push("mobile");
            searchResult.mobile = (item.mobile || "").replaceAll(
              this.search,
              `<font color='#4281FE'>${searchVal.mobile}</font>`
            );
          }
          return {
            ...item,
            searchResult
          };
        });

        // 搜索到的联系人排序
        this.peopleResultList = [...globalContactList].sort((a, b) => {
          // 改成按联系人汉字首字母排序
          let apinyin = pinyin(a.name, { toneType: "none" });
          let bpinyin = pinyin(b.name, { toneType: "none" });
          return apinyin.localeCompare(bpinyin);
        });
      } else {
        this.peopleResultList = [];
      }
    },
    /**
     * 搜索群组
     */
    async searchGroupHandle(searchVal) {
      // 从本地sqlite库读取
      if (this.search.trim()) {
        let globalGroupList = await ipcRenderer.invoke("sqlite-query", {
          key: "globalGroup",
          input: { search: searchVal }
        });
        // 整理程需要的searchResult格式
        globalGroupList = globalGroupList.map(item => {
          let searchResult = {
            type: []
          };
          if (searchVal.name && searchVal.mobile) {
            searchVal.name.push(searchVal.mobile);
          }
          if (item._isName) {
            searchResult.type.push("name");
            searchResult.name = item.name.replaceAll(
              new RegExp(`(${searchVal.name.join("|")})`, "g"),
              `<font color='#4281FE'>$1</font>`
            );
          }
          if (item._isGroupMemberNames) {
            searchResult.type.push("member");
            searchResult.member = item._groupMemberNames.replaceAll(
              new RegExp(`(${searchVal.name.join("|")})`, "g"),
              `<font color='#4281FE'>$1</font>`
            );
          }
          return {
            ...item,
            searchResult
          };
        });
        // 返回取值
        this.groupResultList = [...globalGroupList]; //result
      } else {
        this.groupResultList = [];
      }
    },
    /**
     * 搜索聊天记录
     */
    async searchRecordHandle() {
      try {
        const postData = {
          corpId: this.companyUser.corpId,
          accountId: this.companyUser.accountId,
          corpUserId: this.companyUser.id,
          requestType: 1,
          pageNum: 1,
          typeSize: 10,
          searchContent: this.search
        };
        const res = await this.$service.searchRecordAll.call(this, postData);
        if (res && res.code === "M0000") {
          this.recordResultInfo = {
            ...(res.data || []),
            esSearchTime: res.ctime
          };
        } else {
          throw (res && res.msg) || "";
        }
      } catch (error) {
        console.log(error);
        this.$message.error("聊天记录搜索结果异常，请稍后重试");
      }
    },

    // 拖拽底部变高
    handleMousedown(event, direction) {
      this.moveDirection = direction;
      document.addEventListener("mousemove", this.handleMousemove);
      document.addEventListener("mouseup", this.handleMouseup, true);
      this.canMove = true;
      this.isMoving = true;
    },
    handleMousemove(event) {
      if (!this.canMove) return;
      const outerRect = document.querySelector(".split-pane-wrapper");
      if (this.moveDirection == "bottom" || this.moveDirection == "all") {
        let height = event.pageY - 48; // 鼠标位置减去头部高度
        if (height <= 420) {
          height = 420;
        } else if (
          outerRect &&
          outerRect.clientHeight * 0.8 > 420 &&
          height > outerRect.clientHeight * 0.8
        ) {
          height = outerRect.clientHeight * 0.8;
        }
        this.searchHeightValue = height;
      }
      if (this.moveDirection == "right" || this.moveDirection == "all") {
        let width = event.pageX - 75; // 鼠标位置减去侧边栏以及定位左侧位置高度
        if (width <= 360) {
          width = 360;
        } else if (width > outerRect.clientWidth * 0.5) {
          width = outerRect.clientWidth * 0.5;
        }
        this.searchWidthValue = width;
      }
    },
    handleMouseup() {
      this.canMove = false;
      document.removeEventListener("mousemove", this.handleMousemove);
      document.removeEventListener("mouseup", this.handleMouseup);
      setTimeout(() => {
        this.$nextTick(() => {
          this.isMoving = false;
        });
      }, 2000);
    },
    checkPaneHandle() {
      this.$nextTick(() => {
        const outerRect = document.querySelector(".split-pane-wrapper");
        const panel = document.querySelector("#search-container");
        if (outerRect && panel) {
          if (panel.clientHeight > outerRect.clientHeight * 0.8) {
            this.searchHeightValue = outerRect.clientHeight * 0.8;
          }
          if (panel.clientWidth > outerRect.clientWidth * 0.5) {
            this.searchWidthValue = outerRect.clientWidth * 0.5;
          }
        }
      });
    }
  }
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/constant";
.search-all-result-wrapper {
  width: 360px;
  height: 420px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  ::v-deep .el-tabs {
    flex: 1;
    overflow: hidden;
    .el-tabs__header {
      margin-bottom: 0;
    }
    .el-tabs__nav {
      display: flex;
      width: 100%;
      .el-tabs__item {
        padding: 0 20px !important;
        @include flexCenter;
        height: 43px;
        font-weight: 400;
        color: #8f959e;
        font-size: 14px;
        width: 25%;
        &.is-active {
          color: #3e7eff;
        }
      }
    }
    .el-tabs__content {
      height: calc(100% - 43px);
      overflow: hidden;
      .el-tab-pane {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    }
    .el-tabs__active-bar {
      background-color: #3e7eff;
    }
    .el-tabs__nav-wrap::after {
      height: 1px;
    }
  }
  .search-key-button-operate {
    height: 40px;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .chat-trigger-con {
    background: transparent;
    opacity: 0;
    position: absolute;

    z-index: 10;
    user-select: none;
    &.chat-trigger-con-bottom {
      cursor: n-resize;
      height: 8px;
      width: 100%;
      left: 0;
      bottom: 0;
    }
    &.chat-trigger-con-right {
      cursor: w-resize;
      height: 100%;
      width: 8px;
      right: 0;
      top: 0;
    }
    &.chat-trigger-con-bottom-right {
      cursor: nw-resize;
      height: 8px;
      width: 8px;
      z-index: 20;
      right: 0;
      bottom: 0;
      opacity: 1;
      img {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
      }
    }
  }
}
</style>
