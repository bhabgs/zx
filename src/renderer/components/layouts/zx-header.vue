<template>
  <header class="header-container chat-header-container">
    <div class="search-box" :id="`searchBox_${name}`">
      <i class="search-icon iconfont icon-sousuo"></i>
      <input
        :id="`pte1_${name}`"
        class="search-input"
        v-model="searchVal"
        @focus="searchFocusHandle"
        type="text"
        :placeholder="getInputPlaceholder"
      />
      <img
        class="search-input-clear"
        v-show="!!searchVal && IsSearch"
        @click="clearSearchValHandle"
        src="@/assets/image/search/close.png"
        alt=""
      />
      <!-- <search-result
        :visible.sync="IsSearch"
        class="search-result"
        :search="searchVal"
        @selectresult="selectSearchHandle"
      ></search-result> -->
      <search-all-result
        ref="searchAllResult"
        id="search-container"
        :visible.sync="IsSearch"
        class="search-result"
        :search="searchVal"
        @click.native="
          e => {
            e.preventDefault();
          }
        "
        @changeSearch="changeSearchHandle"
        @selectresult="selectSearchHandle"
      ></search-all-result>
      <common-button :groupDefault="groupDefult"></common-button>
    </div>
    <div class="right-box">
      <user-photo
        class="self-avatar"
        :user="userInfo"
        :hasInfo="true"
      ></user-photo>
      <system-menu class="system-menu"></system-menu>
    </div>
  </header>
</template>
<script>
import { ipcRenderer } from "electron";

import { mapGetters, mapActions } from "vuex";
import { ConversationModel } from "@/WebIM";
import SearchAllResult from "../common/search-all/search-all-result";
const remote = require("@electron/remote");
const appInfo = remote.getGlobal("appInfo");
export default {
  name: "ZxHeader",
  components: { SearchAllResult },
  data() {
    return {
      ConversationModel,
      IsSearch: false,
      searchVal: ""
    };
  },
  props: {
    name: {
      type: String,
      default: ""
    }
  },
  created() {
    window.addEventListener("keydown", this.handleKeyPress, true);
    window.addEventListener("click", this.hideSearchHandle, true);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener("click", this.hideSearchHandle);
  },
  computed: {
    ...mapGetters({
      userInfo: "GetUser",
      OpenDialog: "GetOpenDialog",
      Groups: "GetGroups",
      GetCompany: "GetCompany",
      AllUserMap: "GetAllUserMap"
    }),
    operateBtns() {
      let list = {
        group: {
          key: "group",
          // icon: "icon-tubiaoku_huabanfuben",
          show: true,
          describe: "建群"
        },
        file: {
          key: "file",
          icon: "icon-wenjianjia1",
          show: false,
          describe: "文件传输"
        },
        backstage: {
          key: "backstage",
          icon: "icon-houtai",
          show: true,
          describe: "管理后台"
        }
      };

      return list;
    },
    groupDefult() {
      return {
        users: [this.GetCompany],
        disDel: [this.GetCompany]
      };
    },
    getInputPlaceholder() {
      let result = "";
      if (appInfo.platform.win32) {
        result = "搜索（ctrl+F）";
      } else {
        result = "搜索（command+F）";
      }
      return result;
    }
  },
  methods: {
    ...mapActions(["PushDialogue", "SetOpenDialog"]),
    clearSearchValHandle() {
      this.searchVal = "";
    },
    searchFocusHandle(e) {
      this.IsSearch = true;
      if (e && e.currentTarget) {
        e.currentTarget.select();
      }
    },
    searchBlurHandle() {
      this.IsSearch = false;
      let element = document.getElementById(`pte1_${this.name}`);
      element && element.blur();
    },
    hideSearchHandle(event) {
      if (this.$refs.searchAllResult && this.$refs.searchAllResult.isMoving) {
        return;
      }
      const input = document.getElementById(`searchBox_${this.name}`); // 输入框
      const searchContainer = document.getElementById("search-container"); // 搜索结果面板
      const dialog = document.querySelector(".warningDialog"); // 删除历史搜索时弹窗
      const poppver = document.querySelector(".search-filter-company"); // 选择公司
      const selectChatType = document.querySelector(".select-chat-type"); // 选择聊天方式
      const selectGroupType = document.querySelector(".select-group-type"); // 筛选群组排序类型
      const userTab = document.getElementById("user-info-tab"); // 用户详情信息切换
      if (
        (!input || (input && !input.contains(event.target))) &&
        (!searchContainer ||
          (searchContainer && !searchContainer.contains(event.target))) &&
        (!dialog || (dialog && !dialog.contains(event.target))) &&
        (!poppver || (poppver && !poppver.contains(event.target))) &&
        (!selectChatType ||
          (selectChatType && !selectChatType.contains(event.target))) &&
        (!selectGroupType ||
          (selectGroupType && !selectGroupType.contains(event.target))) &&
        (!userTab || (userTab && !userTab.contains(event.target)))
      ) {
        this.searchBlurHandle();
      }
    },
    handleKeyPress(ev) {
      let e = ev || event || window.event;
      const { keyCode, ctrlKey, altKey, metaKey } = e;
      if (keyCode == 27) {
        // esc退出搜索弹窗
        this.searchBlurHandle();
      } else if (keyCode == 70 && (ctrlKey || metaKey)) {
        // ctrl + f 或command+F展示搜索弹窗
        document.getElementById(`pte1_${this.name}`).focus();
      }
    },
    selectSearchHandle(item) {
      this.searchBlurHandle();
      let dialogue = null,
        converType = null,
        id = "";
      let groupType = 0;

      if (item.isUser) {
        const type = item.type || item.form || 0;
        groupType = type == 0 ? 0 : 10;
      } else {
        groupType = item.type || item.form || 0;
      }
      if (item.isgroup) {
        converType = ConversationModel.IMConversationEnum.GROUP;
        id = item.id;
      } else {
        converType = ConversationModel.IMConversationEnum.PRIVATE;
        id = item.accountId;
      }
      if (id && id.includes("robot_")) {
        groupType = 0;
        ipcRenderer.invoke("sqlite-url", {
          key: "saveIncreaseRobot",
          data: { data: [{ ...item, isDelinConversation: 0 }] }
        });
      }
      dialogue = new ConversationModel.IMConversation(
        {
          id,
          avatar: item.avatar || item.iconUrl,
          name: item.name || item.nickName,
          corpId: item.corpId,
          groupType: groupType >= 10 ? 10 : 0,
          creator: item.creator,
          createAt: item.createAt,
          count: item.groupNumber
        },
        converType
      );
      this.PushDialogue(dialogue);
      this.SetOpenDialog(dialogue);
      this.searchVal = "";
      this.$router.push({
        name: "chitchat",
        query: { type: groupType >= 10 ? "outsource" : "organization" }
      });
      setTimeout(() => {
        window.eventHub.$emit("scroll-current-dialog-handler", {
          id: dialogue.id,
          conversationType: dialogue.conversationType
        });
      }, 200);
    },
    changeSearchHandle(item) {
      this.searchVal = item.value;
    }
  },
  filters: {}
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/layout/header";

.chat-header-container {
  /* 搜索结果 */
  .search-result {
    position: absolute;
    top: 45px;
    left: 15px;
    z-index: 999;
    box-shadow: 0 0 10px rgba($color: #000, $alpha: 0.3);
    border-radius: 4px;
  }
}
</style>
