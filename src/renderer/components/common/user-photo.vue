<template>
  <div class="user-photo" @click="showDetailHandle">
    <img
      class="user-sign"
      v-if="userInfo.avatar"
      :src="getThumbnail(userInfo.avatar)"
      alt
    />
    <p
      v-else-if="userName"
      class="user-sign-name"
      v-randombgcolor="{
        val: userInfo.accountId ? userInfo.accountId.slice(-1) : '',
      }"
    >
      {{ filterName(userName) }}
    </p>
    <img
      class="user-sign"
      v-if="hasDefault && !userInfo.avatar && !userName"
      src="@/assets/image/search/default_people.png"
      alt=""
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import globalConfig from "@/global.config";

const robot = globalConfig.robot;

export default {
  name: "UserPhoto",
  props: {
    user: {},
    length: {
      type: Number,
      default: 2,
    },
    hasInfo: {
      type: Boolean,
      default: false,
    },
    hasDefault: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      userInfo: {},
      flag: 0,
      timeout: null,
    };
  },
  mounted() {
    this.flag = 0;
    this.setUserInfo();
    this.$root.$on("refreshAvatar", this.setUserInfo);
  },
  beforeDestroy() {
    this.$root.$off("refreshAvatar", this.setUserInfo);
  },
  watch: {
    user(val) {
      this.setUserInfo();
    },
  },
  computed: {
    ...mapGetters({
      AllUserMap: "GetAllUserMap",
      LoginCompany: "GetCompany",
      GetNotCorpUsers: "GetNotCorpUsers",
      GetNoRelateUser: "GetNoRelateUser",
      loginUser: "GetUser",
    }),
    userName() {
      let name = this.userInfo.name || this.userInfo.nickName;
      return name;
    },
  },
  methods: {
    ...mapActions(["setAllUser"]),
    /**
     * 获取缩略图，仅用于 OSS， 替换存储需要更新该方法
     */
    getThumbnail(url) {
      return `${url}@!100x100`;
    },
    /**
     * userId: 非必须
     * 当传userId 表明只需更新当前人的信息
     */
    setUserInfo(userId) {
      if (userId) {
        if (typeof this.user !== "object" && userId === this.user) {
          this.getCurrentUser();
        }
      } else {
        clearTimeout(this.timeout);
        if (typeof this.user === "object") {
          //判断当前登录人头像是否更换
          if (
            this.loginUser.id === this.user.id &&
            this.loginUser.avatar !== this.user.avatar &&
            this.user.name !== "个人文件管理"
          ) {
            this.setLoginUserAvatar();
            this.user.avatar = this.loginUser.avatar;
          }
          this.userInfo = this.user;
          let portrait = this.user.portrait || this.user.portraitUri;
          portrait && !this.user.avatar && (this.userInfo.avatar = portrait);
        } else {
          let currentUser = this.AllUserMap[this.user];
          //判断当前登录人头像是否更换
          if (
            currentUser &&
            this.loginUser.id === currentUser.accountId &&
            this.loginUser.avatar !== currentUser.avatar
          ) {
            this.setLoginUserAvatar();
          }
          this.getCurrentUser();
        }
      }
    },
    getCurrentUser() {
      let user =
        this.AllUserMap[this.user] ||
        this.GetNotCorpUsers[this.user] ||
        this.GetNoRelateUser[this.user] ||
        robot[this.user];
      if (user) {
        this.userInfo = user;
      } else if (!this.hasDefault) {
        ++this.flag;
        if (this.flag < 20) {
          this.timeout = setTimeout(() => {
            this.setUserInfo();
          }, 200);
        } else {
          this.getUserInfo();
        }
      }
    },
    //更换当前登录人的头像为最新头像
    setLoginUserAvatar() {
      let user = this.AllUserMap[this.loginUser.id];
      user.avatar = this.loginUser.avatar;
      this.setAllUser({
        users: [user],
        needClear: false,
      });
    },
    getUserInfo() {
      if (this.LoginCompany.corpId) {
        const accountId = this.user;
        this.$service.getAccountInformationOrganization
          .call(this, { id: accountId })
          .then((res) => {
            if (res) {
              this.userInfo = res;
            }
          })
          .catch((error) => {});
      } else {
        this.userInfo = { name: this.user };
      }
    },
    filterName(val) {
      if (val) {
        return val.substr(-this.length);
      }
    },
    showDetailHandle(e) {
      if (this.hasInfo) {
        window.eventHub.$emit("change-user-dialog", {
          show: true,
          evt: e,
          user: this.userInfo,
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/_functions.scss";

.user-photo {
  -webkit-app-region: no-drag;
  margin: 0 10px;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 100%;
  overflow: hidden;
  .user-sign {
    width: 100% !important;
    height: 100% !important;
    vertical-align: baseline;
  }
  .user-sign-name {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
