<template>
  <aside class="aside-container">
    <div
      class="logo-wrapper"
      :class="{ swappable: companyList.length > 1 }"
      :title="currentCorp.name"
    >
      <Dropdown
        placement="bottom-start"
        trigger="click"
        transfer
        transfer-class-name="corp-list-menu"
        :visible.sync="dropCorpMenu"
        @on-click="selectCorpHandler"
      >
        <div class="img-bg">
          <img
            v-if="currentCorp.logo && !isShowDefault"
            class="logo"
            :src="currentCorp.logo"
            @error="errorHandler($event)"
            alt="logo"
          />
          <img class="logo" v-else src="~@/assets/image/login/logo.png" alt />
        </div>
        <i
          v-if="companyList.length > 1"
          class="switch-btn iconfont icon-arrow-bottom"
        ></i>
        <DropdownMenu slot="list">
          <DropdownItem
            v-for="item of companyList"
            :key="item.corpId"
            divided
            :name="item.corpId"
            :selected="item.corpId === currentCorp.id"
          >
            <i class="selected-icon iconfont icon-xuanze"></i>
            <span v-text="item.corp.name"></span>
          </DropdownItem>
          <div class="no-company" v-if="companyList.length < 1">
            <img src="~@/assets/visitor/no-data.png" alt />
            <p>您还没有任何企业</p>
          </div>
          <div class="add-company-btn">
            <el-button type="primary" @click="createCompany"
              >创建企业/团队</el-button
            >
          </div>
        </DropdownMenu>
      </Dropdown>
    </div>
    <ul class="menu-container">
      <li
        class="menu-item position"
        v-show="net_type != 2"
        :class="{ 'is-active': activeIndex === menuOptions.chat.name }"
        @click="selectMenuHandleClick($event, menuOptions.chat)"
      >
        <button type="button" class="btn-chat"></button>
        <span class="btn-text">对话</span>
        <Badge
          class="info-num hint-sign"
          v-if="msgReminderCount.total"
          :class="{
            scale: !msgReminderCount.isDot,
            'low-color': hintType == 1,
            'mid-color': hintType == 2,
            'hot-color': hintType == 3,
          }"
          :dot="msgReminderCount.isDot"
          :count="msgReminderCount.total"
        ></Badge>
      </li>
      <div class="mail-group" v-if="showMail && net_type != 2">
        <li
          class="menu-item position"
          :class="{ 'is-active': activeIndex === menuOptions.mail.name }"
          @click="selectMenuHandle($event, menuOptions.mail)"
        >
          <button type="button" class="btn-mail"></button>
          <span class="btn-text">智邮</span>
          <Badge
            class="info-num hint-sign num-red"
            v-if="mailUnRead.mailUnreadNum || mailUnRead.mailUnreadPot"
            :class="{
              scale: !!mailUnRead.mailUnreadNum,
              'low-color': $myUtils.hintType(mailUnRead.mailUnreadPot) == 1,
              'mid-color': $myUtils.hintType(mailUnRead.mailUnreadPot) == 2,
              'hot-color': $myUtils.hintType(mailUnRead.mailUnreadPot) == 3,
            }"
            :dot="!mailUnRead.mailUnreadNum"
            :count="mailUnRead.mailUnreadNum || mailUnRead.mailUnreadPot"
          ></Badge>
        </li>
        <li
          class="menu-item position"
          :class="{ 'is-active': activeIndex === menuOptions.task.name }"
          @click="selectMenuHandle($event, menuOptions.task)"
        >
          <button type="button" class="btn-task"></button>
          <span class="btn-text">任务</span>
          <Badge
            class="info-num hint-sign num-red"
            v-if="mailUnRead.myTaskUnreadNum || mailUnRead.milestoneUnreadPot"
            :class="{
              scale: !!mailUnRead.myTaskUnreadNum,
              'low-color': $myUtils.hintType(mailUnRead.myTaskUnreadPot) == 1,
              'mid-color': $myUtils.hintType(mailUnRead.myTaskUnreadPot) == 2,
              'hot-color': $myUtils.hintType(mailUnRead.myTaskUnreadPot) == 3,
            }"
            :dot="!mailUnRead.myTaskUnreadNum"
            :count="mailUnRead.myTaskUnreadNum || mailUnRead.myTaskUnreadPot"
          ></Badge>
        </li>
        <li
          class="menu-item position"
          :class="{ 'is-active': activeIndex === menuOptions.mailstone.name }"
          @click="selectMenuHandle($event, menuOptions.mailstone)"
        >
          <button type="button" class="btn-mailstone"></button>
          <span class="btn-text">里程碑</span>
          <Badge
            class="info-num hint-sign num-red"
            v-if="
              mailUnRead.milestoneUnreadNum || mailUnRead.milestoneUnreadPot
            "
            :class="{
              scale: !!mailUnRead.milestoneUnreadNum,
              'low-color':
                $myUtils.hintType(mailUnRead.milestoneUnreadPot) == 1,
              'mid-color':
                $myUtils.hintType(mailUnRead.milestoneUnreadPot) == 2,
              'hot-color':
                $myUtils.hintType(mailUnRead.milestoneUnreadPot) == 3,
            }"
            :dot="!mailUnRead.milestoneUnreadNum"
            :count="
              mailUnRead.milestoneUnreadNum || mailUnRead.milestoneUnreadPot
            "
          ></Badge>
        </li>
      </div>
      <li
        class="menu-item"
        v-show="net_type != 2"
        :class="{ 'is-active': activeIndex === menuOptions.contact.name }"
        @click="selectMenuHandle($event, menuOptions.contact)"
      >
        <button type="button" class="btn-contact"></button>
        <span class="btn-text">名录</span>
      </li>
      <li
        class="menu-item"
        :class="{ 'is-active': activeIndex === menuOptions.open.name }"
        @click="selectMenuHandle($event, menuOptions.open)"
      >
        <button type="button" class="btn-open"></button>
        <span class="btn-text">开</span>
      </li>

      <li
        class="menu-item position"
        :class="{ 'is-active': activeIndex === menuOptions.notify.name }"
        @click="selectMenuHandle($event, menuOptions.notify)"
      >
        <button type="button" class="btn-notify"></button>
        <span class="btn-text">通知</span>
        <Badge
          class="info-num hint-sign"
          v-if="NotifyReminderCount.total"
          :class="{
            scale: !NotifyReminderCount.isDot,
            'low-color': NotifyHintType == 1,
            'mid-color': NotifyHintType == 2,
            'hot-color': NotifyHintType == 3,
          }"
          :dot="NotifyReminderCount.isDot"
          :count="NotifyReminderCount.total"
        ></Badge>
      </li>

      <!--
        智文、okrs入口
        保留代码，防止后期启用
        by lixiaowei 2019/04
      -->
      <!-- <li
        v-show="net_type != 2"
        class="menu-item"
        :class="{ 'is-active': activeIndex === menuOptions.file.name }"
        @click="selectMenuHandle($event, menuOptions.file)"
      >
        <button type="button" class="btn-file"></button>
      </li>
      <li
        v-if="GetCompany.corpId == 6 && net_type != 2"
        class="menu-item"
        :class="{ 'is-active': activeIndex === menuOptions.okrs.name }"
        @click="selectMenuHandle($event, menuOptions.okrs)"
      >-->
      <!-- <button type="button" class="btn-okrs"></button>
      </li>-->
    </ul>

    <div class="right-box">
      <header-menu
        class="menu-box"
        :IsActive.sync="IsShowHeaderMenu"
      ></header-menu>
    </div>
  </aside>
</template>
<script>
import { ipcRenderer, session } from "electron";

import { mapGetters, mapActions } from "vuex";
import headerMenu from "@/components/layouts/header/header-menu";
export default {
  name: "AsideMenu",
  components: {
    headerMenu,
  },
  props: ["mailUnreadNum", "showMail"],
  data() {
    return {
      isShowDefault: false,
      IsShowMenu: false,
      IsShowHeaderMenu: false,
      menuOptions: {
        zhiwen: {
          name: 'zhiwen',
          path: { name: 'zhiwen' },
          childRoute: []
        },
        chat: {
          name: "chitchat",
          path: { name: "chitchat" },
          childRoute: [],
        },
        contact: {
          name: "contact",
          path: {
            name: "Contacts",
            params: { id: "dept" },
          },
          childRoute: ["NotSelectChat", "GroupDetail", "DeptDetail"],
        },
        open: { name: "open", path: { name: "Open" }, childRoute: [] },
        mail: { name: "mail", path: { name: "Mail" }, childRoute: [] },
        mailstone: {
          name: "mailstone",
          path: { name: "Mailstone" },
          childRoute: [],
        },
        task: { name: "task", path: { name: "Task" }, childRoute: [] },
        notify: { name: "notify", path: { name: "notify", childRoute: [] } },
        // file: { name: "file", path: { name: "File" } },
        // okrs: { name: "okrs", path: { name: "Okrs" } }
      },
      activeIndex: "chitchat",
      dropCorpMenu: false, // 公司选择菜单
      net_type: sessionStorage.getItem("net_type"),
      oldTime: new Date().getTime(),
      isDoubleClick: false,
    };
  },
  created() {
    this.setActive();
  },
  mounted() {
    window.eventHub.$on("drop-close", this.closeAddMenu);
    window.addEventListener("click", this.closeAddMenu);
    window.eventHub.$on("change-active-mail", this.changeActiveMail);
  },
  beforeDestroy() {
    window.eventHub.$off("drop-close", this.closeAddMenu);
    window.removeEventListener("click", this.closeAddMenu);
    window.eventHub.$off("change-active-mail", this.changeActiveMail);
  },
  computed: {
    ...mapGetters({
      // reminderCount: "GetReminderCount",
      // groupReminderCount: "GetGroupReminderCount",
      userInfo: "GetUser",
      GetCompany: "GetCompany",
      NotifyUnReadCount: "GetNotifyUnReadCount",
      GetChatUnreadCount: "GetChatUnreadCount",
      GetDirectlyCompany: "GetDirectlyCompany",
      GetCompanyByRelate: "GetCompanyByRelate",
      MailUnReadCount: "GetMailUnReadCount",
      ExtCorpInfo: "GetExtCorpInfo",
      allCompany: "GetAllCompany",
    }),
    companyList() {
      let corpList = [];
      if (this.net_type == "2") {
        // 内网显示全部公司
        corpList = [...(this.allCompany || [])];
      } else {
        // 外网展示直属公司和外联平台
        corpList = [...(this.GetCompanyByRelate.direct || [])];
        // 协会平台也展示在公司切换列表内
        const outList = (this.GetCompanyByRelate.out || []).filter(
          (item) => item.corp && item.corp.canJoin == "1"
        );
        corpList.push(...outList);
      }
      return corpList;
    },
    LoginCompany() {
      let result = {};
      if (this.net_type == "1") {
        result = this.GetCompany;
      } else if (this.allCompany.length) {
        if (this.GetCompany) {
          result = this.GetCompany;
        } else {
          result = this.allCompany[0];
        }
      }
      localStorage.setItem("lastLoginCorp", result.corpId);
      return result;
    },
    currentCorp() {
      let corp = (this.LoginCompany || {}).corp || {};
      let logo = this.ExtCorpInfo.corpLogo || corp.logo;
      corp.logo = logo;
      return corp;
    },
    userDetail() {
      let info = {};
      if (this.userInfo) {
        info = this.userInfo;
      }
      return info;
    },
    hintType() {
      let type = this.$myUtils.hintType(this.msgReminderCount.total);
      return type;
    },
    NotifyHintType() {
      let type = this.$myUtils.hintType(this.NotifyReminderCount.total);
      return type;
    },
    NotifyReminderCount() {
      const { NotifyUnReadCount } = this;
      const { total, numberTotal } = NotifyUnReadCount;
      let c_n_total = numberTotal,
        isDot = numberTotal <= 0;

      return { total: isDot ? total : c_n_total, isDot };
    },
    msgReminderCount() {
      const { GetChatUnreadCount } = this;
      const ChatUnreadCount = GetChatUnreadCount.total;

      return ChatUnreadCount;
    },
    mailUnRead() {
      if (this.mailUnreadNum.hasOwnProperty("mailUnreadNum")) {
        return this.mailUnreadNum;
      }
      return this.MailUnReadCount;
    },
  },
  watch: {
    $route(val) {
      this.setActive();
    },
  },
  methods: {
    ...mapActions(["SetCorpId"]),
    // 切换智邮当前活跃图标
    changeActiveMail(type) {
      if (["mailstone", "task", "mail"].includes(this.activeIndex))
        switch (`${type}`) {
          case "4":
            this.activeIndex = "mailstone";
            break;
          case "5":
            this.activeIndex = "task";
            break;
          default:
            this.activeIndex = "mail";
            break;
        }
    },
    createCompany() {
      this.$emit("createCompany");
    },
    showCorpList() {
      // 展示公司列表
      if (this.companyList.length > 1) {
        this.dropCorpMenu = true;
      }
    },
    async selectCorpHandler(name) {
      let corpInfo = this.companyList.find((item) => item.corpId === name);
      if (this.currentCorp.id !== corpInfo.corpId) {
        this.SetCorpId(corpInfo.corpId);
        try {
          ipcRenderer.invoke("db-save-data", {
            db: "base",
            data: {
              key: `switch-corp-${this.userDetail.id}`,
              value: corpInfo.corpId,
            },
          });
        } catch (error) {
          console.error(error);
        }
      }
    },
    setActive() {
      let path = this.$route.path;
      const name = this.$route.name;
      for (const key in this.menuOptions) {
        const item = this.menuOptions[key];
        if (
          (item.path && item.path.name === name) ||
          item.childRoute.includes(name)
        ) {
          this.activeIndex = item.name;
          break;
        }
      }
    },
    selectMenuHandleClick(ev, active) {
      if (this.activeIndex === 'chitchat') {
        // 如果是对话，再次点对话，收起行动列表
        this.$root.$emit('action-list-close');
      }
      const _this = this;
      let timerHandler = setTimeout(function () {
        _this.isDoubleClick = false;
      }, 500);
      const tempTime = new Date().getTime();
      // 双击标志且与上次间隔小于300毫秒，否则认为单击
      if (this.isDoubleClick && tempTime - this.oldTime < 300) {
        if (active == this.menuOptions.chat) {
          this.scrollCornerMarker();
        }
        clearTimeout(timerHandler);
      } else {
        this.selectMenuHandle(ev, active);
      }
      this.oldTime = tempTime;
      this.isDoubleClick = !this.isDoubleClick;
    },
    selectMenuHandle(ev, active) {
      const old = this.activeIndex;
      if (active !== 6) {
        this.activeIndex = active.name;
      }
      const path = active.path;
      if (path) {
        if (active.name == "contact") {
          path.params.id =
            sessionStorage.getItem("contacts-route-id") || path.params.id;
        }
        if (["mail", "mailstone", "task"].includes(active.name)) {
          let type = 1;
          switch (active.name) {
            case "mailstone":
              type = 4;
              break;
            case "task":
              type = 5;
              break;
            default:
              type = 1;
              break;
          }
          this.$emit("changActiveMail", type);
        } else if (active.name == "chitchat") {
          const type =
            sessionStorage.getItem("chat-route-type") || "organization";
          this.$router.push({ name: path.name, query: { type } });
          this.$emit("changActiveMail", null);
        } else {
          this.$router.push(path);
          this.$emit("changActiveMail", null);
        }
      }
    },
    scrollCornerMarker() {
      window.eventHub.$emit("scroll-corner-marker-handler");
    },
    selectAdd(index) {},
    closeAddMenu() {
      if (this.IsShowMenu) {
        this.IsShowMenu = false;
      }
    },
    showDropMenu(e) {
      if (!this.IsShowHeaderMenu) {
        window.eventHub.$emit("drop-close");
        this.IsShowHeaderMenu = true;
      }
    },
    errorHandler(e) {
      this.isShowDefault = true;
    },
  },
};
</script>
<style lang="scss" scoped>
.aside-container {
  .menu-container {
    .menu-item {
      .info-num {
        ::v-deep .ivu-badge-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          height: 16px;
          min-width: 16px;
          font-family: inherit;
        }
        ::v-deep .ivu-badge-dot {
          top: 5px;
          right: -2px;
        }
      }
    }
  }
}
</style>

<style lang="scss">
@import "~@/assets/styles/constant";

/* 侧边菜单 */
.aside-container {
  position: relative;
  width: $--aside-width;
  flex-basis: $--aside-width;
  flex-shrink: 0;
  height: 100%;
  background: rgba(47, 50, 59, 1);
  user-select: none;
  -webkit-app-region: drag;
  // border-right: $--aside-border-right-width solid $--default-theme-color;
  position: relative;

  .logo-wrapper {
    -webkit-app-region: no-drag;
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;

    &.swappable {
      cursor: pointer;
    }
    .img-bg {
      width: 40px !important;
      height: 40px !important;
      background: #fff;
      border-radius: 8px;
      align-items: center;
      display: flex;
      .logo {
        width: 40px !important;
        max-height: 40px !important;
        border-radius: 8px;
      }
    }

    .switch-btn {
      display: block;
      width: 10px;
      margin: 5px auto 0;
      opacity: 0.3;
      color: #fff;
      font-size: 10px;
      line-height: 1;
    }
  }

  .menu-container {
    -webkit-app-region: no-drag;
    position: absolute;
    top: 86px;
    width: 100%;
    .position {
      position: relative;
    }
    .menu-item {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;
      .info-num {
        position: absolute;
        top: -5px;
        right: 10px;
        color: #fff;
        font-size: 12px;
        .ivu-badge-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          height: 16px;
          min-width: 16px;
          font-family: inherit;
        }
        .ivu-badge-dot {
          top: 5px;
          right: -2px;
        }
      }
      .btn-text {
        font-size: 12px;
        color: #848995;
        margin-top: 2px;
      }
      > button {
        width: 24px;
        height: 24px;
        background-color: transparent;
        color: #b6b7ba;
        font-size: 26px;
        transition: all 0.15s linear;
        background-repeat: no-repeat;
        background-position: center center;
        background-size: 100%;
      }
      .btn-chat {
        background-image: url("~@/assets/image/menu/chitchat.png");
      }
      .btn-notify {
        background-image: url("~@/assets/image/menu/notify.png");
      }
      .btn-contact {
        background-image: url("~@/assets/image/menu/contact.png");
      }
      .btn-open {
        background-image: url("~@/assets/image/menu/open.png");
      }
      .btn-mail {
        background-image: url("~@/assets/image/menu/mail.png");
      }
      .btn-mailstone {
        background-image: url("~@/assets/image/menu/mailstone.png");
      }
      .btn-task {
        background-image: url("~@/assets/image/menu/task.png");
      }
      .btn-file {
        background-image: url("~@/assets/image/menu/file.png");
      }
      .btn-okrs {
        background-image: url("~@/assets/image/menu/okrs.png");
      }
      &:hover {
        .btn-chat {
          background-image: url("~@/assets/image/menu/chitchat_hover.png");
        }
        .btn-notify {
          background-image: url("~@/assets/image/menu/notify_hover.png");
        }
        .btn-contact {
          background-image: url("~@/assets/image/menu/contact_hover.png");
        }
        .btn-open {
          background-image: url("~@/assets/image/menu/open_hover.png");
        }
        .btn-mail {
          background-image: url("~@/assets/image/menu/mail_hover.png");
        }
        .btn-mailstone {
          background-image: url("~@/assets/image/menu/mailstone_hover.png");
        }
        .btn-task {
          background-image: url("~@/assets/image/menu/task_hover.png");
        }
        .btn-file {
          background-image: url("~@/assets/image/menu/file_hover.png");
        }
        .btn-okrs {
          background-image: url("~@/assets/image/menu/okrs_hover.png");
        }
        .btn-text {
          color: #c2c9d9;
        }
      }
      &.is-active {
        .btn-chat {
          background-image: url("~@/assets/image/menu/chitchat_active.png") !important;
        }
        .btn-notify {
          background-image: url("~@/assets/image/menu/notify_active.png") !important;
        }
        .btn-contact {
          background-image: url("~@/assets/image/menu/contact_active.png") !important;
        }
        .btn-open {
          background-image: url("~@/assets/image/menu/open_active.png") !important;
        }
        .btn-mail {
          background-image: url("~@/assets/image/menu/mail_active.png") !important;
        }
        .btn-mailstone {
          background-image: url("~@/assets/image/menu/mailstone_active.png");
        }
        .btn-task {
          background-image: url("~@/assets/image/menu/task_active.png");
        }
        .btn-file {
          background-image: url("~@/assets/image/menu/file_active.png") !important;
        }
        .btn-okrs {
          background-image: url("~@/assets/image/menu/okrs_active.png") !important;
        }
        .btn-text {
          color: #6ab3ff;
        }
      }
    }
    .mail-group {
      width: 50px;
      background: #3b3e4d;
      border-radius: 8px;
      border: 1px solid #5d616b;
      padding: 10px 0;
      margin: 0 auto;
      margin-bottom: 16px;
      > .menu-item {
        margin: 0;
        &:nth-child(2) {
          margin: 10px 0;
        }
        .info-num {
          right: 5px;
        }
      }
    }
    .drop-menu {
      position: absolute;
      width: 132px;
      transform: translate(18px, 10px);
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      z-index: 999;
      .drop-menu-item {
        width: 100%;
        height: 48px;
        transition: background-color 0.15s ease-in;
        &:not(:first-of-type) {
          border-top: 1px solid #e7e7e7;
        }
        &:hover {
          background-color: $--menu-hover-bgcolor;
        }
        .item-button {
          padding: {
            left: 14px;
          }
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          background-color: transparent;
          color: #ccc;
          font-size: 18px;
        }
        .item-text {
          margin: {
            left: 15px;
          }
          color: #000;
          font-size: 14px;
        }
      }
    }
  }

  .right-box {
    -webkit-app-region: no-drag;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    cursor: pointer;
    .user-img {
      width: 40px;
      height: 40px;
      border-radius: 100%;
    }
    .drop-menu {
      left: 64px;
      bottom: 24px;
      z-index: 99999;
    }
  }
}
.ivu-select-dropdown {
  &.corp-list-menu {
    padding: 0;
    z-index: 9999 !important;

    .ivu-dropdown-item {
      margin: 0;
      font-size: 14px !important;
    }

    .selected-icon {
      margin-right: 10px;
      font-size: 12px;
      opacity: 0;
    }

    .ivu-dropdown-item-selected {
      background-color: #fff;
      .selected-icon {
        opacity: 1;
      }
    }
  }
  .no-company {
    padding: 7px 16px;
    width: 220px;
    height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    > img {
      width: 120px;
      height: 78px;
      margin: 8px;
    }
    > p {
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #8f959e;
    }
  }
  .add-company-btn {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: auto;
    padding: 0 16px;
    .el-button {
      width: 208px;
      height: 26px;
      background: #3e7eff;
      border: none;
      border-radius: 4px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px 0;
      span {
        font-size: 10px;
        font-family: MicrosoftYaHeiUI;
        color: #ffffff;
      }
    }
  }
}
</style>
