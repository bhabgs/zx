<template>
  <transition name="fade">
    <ul
      class="search-result-container"
      v-show="visible"
      v-loading="isLoading"
      @mousedown="mousedownHandler($event)"
    >
      <li
        class="show-item"
        v-for="(item, index) in searchResult.users"
        :key="item.id"
        @click="selectHandle(item, 'user')"
        :class="{ activeSelect: activeIndex === index }"
      >
        <user-photo :user="item" :key="item.id"></user-photo>
        <div class="item-info">
          <span
            class="name"
            :class="item.accountId.includes('robot_') ? 'my-12px' : ''"
            v-html="
              item.name.replace(
                search,
                `<font color='#3E7EFF'>${search}</font>`
              )
            "
          ></span>
          <div
            v-if="item.corpList"
            class="corp-list"
            v-for="corp in (item.corpList || []).slice(0, 3)"
            :key="corp.id"
          >
            <p class="corp-name" :title="corp.name">{{ corp.name }}</p>
            <div
              class="corp-dept-list"
              v-for="dept in (corp.deptLabelNameList || []).slice(0, 3)"
              v-show="item.isHide != '1'"
              :title="dept"
              :key="dept"
            >
              {{ dept }}
            </div>
            <div
              class="corp-dept-list"
              v-if="corp.deptLabelNameList && corp.deptLabelNameList.length > 3"
            >
              ......
            </div>
          </div>
          <div
            class="corp-list"
            v-if="item.corpList && item.corpList.length > 3"
          >
            等{{ item.corpList.length }}家企业…
          </div>
        </div>
      </li>
      <li
        class="show-item"
        v-for="(item, index) in searchResult.groups"
        :key="item.id"
        @click="selectHandle(item, 'group')"
        :class="{
          activeSelect: activeIndex === index + searchResult.users.length
        }"
      >
        <group-photo :group="item" :key="item.id"></group-photo>
        <span class="name">{{ item.name }}</span>
      </li>
      <li class="nothing no-data" v-show="IsNothing">
        <img src="@/assets/image/approval/no-data.png" />
        <span>未搜索到相关结果</span>
      </li>
      <li class="nothing search-error" v-if="isError">
        <span>搜索失败，请刷新重试</span>
        <button class="iconfont icon-refresh" @click="searchHandle"></button>
      </li>
    </ul>
  </transition>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "SearchResult",
  props: {
    search: { type: String },
    visible: { type: Boolean },
    needRobot: { type: Boolean, default: false }
  },
  data() {
    return {
      activeIndex: -1,
      timeout: "",
      searchResult: {
        users: [],
        groups: []
      }, // 搜索结果
      isLoading: false, // 是否正在搜索
      isError: false // 是否搜索失败
    };
  },
  mounted() {
    this.searchHandle();
    this.isError = false;
  },
  beforeDestroy() {
    this.$set(this.searchResult, "users", []);
    this.$set(this.searchResult, "groups", []);
  },
  computed: {
    ...mapGetters({
      UserInfo: "GetUser",
      GetCompany: "GetCompany",
      RobotList: "GetRobotList"
    }),
    IsNothing() {
      return (
        !this.searchResult.users.length &&
        !this.searchResult.groups.length &&
        !this.isLoading &&
        !this.isError
      );
    },
    resultLength() {
      let length =
        this.searchResult.users.length + this.searchResult.groups.length;
      return length;
    },
    loginUserId() {
      let id = "";
      if (this.UserInfo) {
        id = this.UserInfo.id;
      }
      return id;
    },
    corpList() {
      let corpUsers = this.UserInfo.corpUsers || [];
      return corpUsers.map(corpUser => corpUser.corp || {});
    }
  },
  watch: {
    search(val, oldVal) {
      clearTimeout(this.timeout);
      if (val) {
        this.timeout = setTimeout(() => {
          this.searchHandle();
        }, 300);
      } else {
        this.$set(this.searchResult, "users", []);
        this.$set(this.searchResult, "groups", []);
      }
    },
    visible(val) {
      if (val) {
        window.addEventListener("keydown", this.winKeyupHandle);
      } else {
        window.removeEventListener("keydown", this.winKeyupHandle);
      }
    }
  },
  methods: {
    searchHandle() {
      this.isError = false;
      if (this.search === "" || this.search === undefined) {
        return false;
      }
      this.isLoading = true;
      const search = this.search;
      let resultUsers = [];
      let resultGroups = [];

      Promise.all([
        this.$service.getAccountSearchByUserName.call(this, {
          search
        }),
        this.$service.getGroupBySearch.call(this, {
          search,
          accountId: this.UserInfo.id
        })
      ])
        .then(result => {
          if (result) {
            let user = result[0] || [];
            let group = result[1] || [];
            user = user.map(user => {
              if (!user.name && user.userName) {
                user.name = user.userName;
              }
              return user;
            });
            if ("个人文件管理".includes(search)) {
              console.log(this.GetCompany);
              user.push({
                name: "个人文件管理",
                // avatar: require("@/assets/image/common/ZX_FileManager_Default@3x.jpg"),
                avatar:
                  "https://zx-zgiot-002.oss-cn-qingdao.aliyuncs.com/image/8dc83647909b4cc792f1f78390e07db0.jpg",
                accountId: this.UserInfo.id,
                corpList: this.corpList || [],
                type: 0
              });
            }
            if (this.needRobot) {
              const searchRobotList = this.RobotList.filter(item =>
                item.name.includes(search)
              );
              if (searchRobotList.length) {
                user.push(
                  ...[
                    ...searchRobotList.map(item => {
                      return {
                        ...item,
                        avatar: item.iconUrl,
                        type: 0
                      };
                    })
                  ]
                );
              }
            }

            group = group.map(item => {
              item.isgroup = true;
              return item;
            });
            this.$set(this.searchResult, "users", user);
            this.$set(this.searchResult, "groups", group);
          }
          this.closeLoading();
        })
        .catch(err => {
          this.isError = true;
          this.closeLoading();
        })
        .finally(() => {
          setTimeout(() => {
            this.isLoading = false;
          }, 300);
        });
    },
    selectHandle(item, type) {
      if (!item) {
        const usersLength = this.searchResult.users.length;
        if (this.activeIndex < usersLength) {
          item = { ...this.searchResult.users[this.activeIndex], isUser: true };
        } else {
          item = {
            ...this.searchResult.groups[this.activeIndex - usersLength],
            isUser: false
          };
        }
      }
      if (item) {
        this.$emit("selectresult", { ...item, isUser: type === "user" });
        this.close();
      }
    },
    winKeyupHandle(e) {
      const ev = e || window.event;
      if (!ev.altKey && !ev.shiftKey && this.search) {
        switch (ev.code) {
          case "ArrowDown":
            this.nextSelect();
            break;
          case "ArrowUp":
            this.prevSelect();
            break;
          case "Enter":
            e.preventDefault();
            this.enterHandler();
            break;
        }
      }
    },
    enterHandler() {
      const { activeIndex, searchResult } = this;
      const usersLength = searchResult.users.length;
      if (activeIndex < usersLength) {
        this.selectHandle(searchResult.users[activeIndex], "user");
      } else {
        const index = activeIndex - usersLength;
        this.selectHandle(searchResult.groups[index], "group");
      }
    },
    nextSelect() {
      if (this.activeIndex < this.resultLength - 1) {
        this.activeIndex += 1;
        this.intoView();
      }
    },
    prevSelect() {
      if (this.activeIndex > 0) {
        this.activeIndex -= 1;
        this.intoView();
      }
    },
    intoView(type = true) {
      this.$nextTick(() => {
        let targetEle = document.querySelector(".activeSelect");
        if (targetEle) {
          targetEle.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    },
    close() {
      this.$emit("update:visible", false);
    },
    mousedownHandler(e) {
      //现代浏览器阻止默认事件
      if (e && e.preventDefault) {
        e.preventDefault();
      } else {
        //IE阻止默认事件
        window.event.returnValue = false;
      }
      return false;
    },
    closeLoading() {
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.search-result-container {
  width: 320px;
  height: 400px;
  background-color: #fff;
  overflow-y: auto;
  > li {
    display: flex;
    align-items: flex-start;
    padding: 5px 10px;
    // height: 50px;
    &:not(:last-of-type) {
      // border-bottom: 1px solid #e7e7e7;
      box-shadow: 0px -1px 0px 0px #f4f6f8;
    }

    &:not(.nothing) {
      &:hover {
        background-color: $--menu-hover-bgcolor;
      }
    }

    &.show-item {
      cursor: pointer;
    }

    .item-info {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .name {
      font-size: 14px;
      color: #000;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .corp-list {
      margin-bottom: 10px;
      .corp-name {
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #1f2329;
        margin: 4px 0;
        overflow: hidden;
        width: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .corp-dept-list {
        font-size: 10px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
        overflow: hidden;
        width: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    &.nothing {
      justify-content: center;
      color: #999;
      height: 100%;
      display: flex;
      align-items: center;
      &.no-data {
        display: flex;
        flex-direction: column;
        img {
          width: 160px;
          height: 160px;
        }
        span {
          color: #999;
          font-size: 14px;
        }
      }
    }

    &.search-error {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-bottom: 40%;
      > span {
        color: #999;
        font-size: 14px;
      }

      > button {
        font-size: 20px;
        margin-top: 10px;
        color: #666;
        &:hover {
          color: $--default-theme-color;
        }
      }

      &:hover {
        background-color: inherit !important;
      }
    }

    &.activeSelect {
      background-color: $--menu-hover-bgcolor;
    }
  }
}
</style>
