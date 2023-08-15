<template>
  <div id="qrcode-login">
    <div class="qrcode-login-left">
      <el-carousel
        trigger="click"
        height="640px"
        arrow="never"
        :indicator-position="showImageList.length > 1 ? '' : 'none'"
      >
        <el-carousel-item v-for="item in showImageList" :key="item">
          <img :src="item" alt="" />
        </el-carousel-item>
      </el-carousel>
    </div>
    <div class="qrcode-login-right">
      <system-menu
        :options.sync="systemMenuOpt"
        class="qrcode-login-system-button"
      ></system-menu>
      <div class="qrcode-login-right-outside" v-show="!showNetworkSetting">
        <div class="qrcode-login-right-greeting">
          <div class="qrcode-login-right-greeting-default">
            <img :src="defaultGreeting" alt="" />
          </div>
          <p class="qrcode-login-right-greeting-custom">{{ customGreeting }}</p>
        </div>
        <div
          class="qrcode-login-right-content"
          v-show="loginType == 2 && !loginStatus"
        >
          <div class="qrcode-login-right-content-code" v-show="showCode">
            <div
              class="refresh-code"
              v-if="showRefresh"
              @click="getLoginType(true)"
            >
              <img src="@/assets/image/login/refresh.png" alt="" />
              <p>{{ isRequesting ? "加载中…" : "刷新二维码" }}</p>
            </div>
            <canvas id="qrcode"></canvas>
            <p>打开<font color="#3E7EFF">手机智信</font>扫一扫</p>
          </div>
          <div
            class="qrcode-login-right-content-form"
            v-loading="IsLogin"
            v-show="!showCode"
          >
            <login-pwd
              :IsLogin="IsLogin"
              @loginHandle="loginHandle"
            ></login-pwd>
          </div>
          <div
            class="qrcode-login-right-content-change-type"
            @click="changeLoginType"
          >
            <img src="@/assets/image/login/change.png" alt="" />
            <p>点击切换{{ showCode ? "密码" : "二维码" }}登录</p>
          </div>
        </div>
        <div
          class="qrcode-login-right-login"
          v-show="loginType == 1 || ['1', '3'].includes(`${loginStatus}`)"
        >
          <img
            :src="loginUserInfo.avatar || defaultHeader"
            alt=""
            class="login-user-avatar"
          />
          <p class="login-name">
            {{ loginType == 1 ? loginUserInfo.name : "扫码成功" }}
          </p>
          <p v-if="loginStatus != 0" class="login-tip">
            {{ loginStatus == 3 ? "登录中..." : "请在智信手机端点击登录" }}
          </p>
          <el-button
            class="login-button"
            @click="loginAgain"
            :disabled="loginStatus == 1"
            v-if="loginType == 1 && loginStatus != 3"
            >登录</el-button
          >
          <el-button
            class="change-account"
            @click="changeAccount"
            type="text"
            v-if="loginType == 1 && loginStatus != 3"
            >切换账号</el-button
          >
          <el-button
            type="text"
            @click="cancelAccount"
            class="cancel-loagin change-account"
            v-if="loginStatus == 3"
            ><img
              src="@/assets/image/login/cancel.png"
              alt=""
            />取消登录</el-button
          >
        </div>
        <div
          class="qrcode-login-right-bottom"
          @click="changeNetworkProxy"
          v-show="loginType == 2 && loginStatus != 3"
        >
          <img src="@/assets/image/login/setting.png" alt="" />
          <p>网络设置</p>
        </div>
      </div>
      <login-network-proxy
        v-show="showNetworkSetting"
        @loginHandle="loginHandle"
        @backToLogin="backToLogin"
      ></login-network-proxy>
    </div>
  </div>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import { ipcRenderer, app } from "electron";
import apiPathConfig from "@/config/api.path.config";
import Vue from "vue";
import { PollingNotify, PollingOutSideNotify } from "../plugin/polling-notice";
import QRCode from "qrcode";
import LoginPwd from "@/components/login/login-pwd";
import loginNetworkProxy from "../components/login/login-network-proxy";
export default {
  name: "QrcodeLogin",
  components: {
    LoginPwd,
    loginNetworkProxy
  },
  data() {
    return {
      systemMenuOpt: {
        showBtn: ["mini", "close"]
      }, // 系统按钮
      imageList: [], // 轮播图列表
      qrcode: null, // 生成二维码
      showCode: true, // 是否展示二维码
      IsLogin: false, // 是否正在登录中
      showNetworkSetting: false, // 是否展示内网登录
      loginInfo: {}, // 账号密码
      loginUserInfo: {}, // 上次登录的账号密码
      loginStatus: 0, // 0初始状态，1手机端扫码或者已经发送登录请求 3登录成功
      greetingList: [], // 问候语列表
      defaultGreetingList: [], // 默认问候语列表
      zxAuthUiqueCode: "", // 唯一授权码
      qrUrl: "", // 二维码地址
      isRequesting: false, // 是否正在登录
      timer: null, // 轮询接口定时器
      showRefresh: false, //展示刷新二维码
      loginType: 2, // 1按钮登录/2二维码登陆/
      defaultHeader: require("@/assets/image/login/default.png"),
      hasSendLogin: false,
      sendLoginTimeout: null
    };
  },
  beforeRouteEnter(to, from, next) {
    ipcRenderer.send("gologin");
    next(vm => {
      vm.backToLogin();
    });
  },
  computed: {
    defaultGreeting() {
      let result = "";
      const currentTime = this.$moment().format("HH:mm:ss");
      switch (true) {
        case currentTime >= "06" && currentTime < "10":
          result = "morning";
          break;
        case currentTime >= "10" && currentTime < "14":
          result = "midday";
          break;
        case currentTime >= "14" && currentTime < "21":
          result = "afternoon";
          break;
        case (currentTime >= "21" && currentTime < "24") ||
          (currentTime >= "00" && currentTime < "06"):
          result = "night";
          break;
        default:
          result = "morning";
          break;
      }
      return require(`@/assets/image/login/${result}.png`);
    },
    customGreeting() {
      let result = "欢迎登录智信";
      // 如果设置的公司时间段中没找到问候语则从默认平台问候语中寻找
      const currentTip =
        this.findGreeting(this.greetingList) ||
        this.findGreeting(this.defaultGreetingList);
      if (currentTip) {
        result = currentTip.tipsText;
      }
      return result;
    },
    showImageList() {
      if (this.imageList && this.imageList.length) {
        return this.imageList;
      } else {
        return [require("@/assets/image/login/login-rotation.png")];
      }
    }
  },
  created() {},
  mounted() {
    const loginSetting = JSON.parse(localStorage.getItem("loginSetting"));
    const lastLoginCorp = localStorage.getItem("lastLoginCorp");
    if (loginSetting) {
      const settingValue = loginSetting[lastLoginCorp || "default"] || {};
      const defaultSetting = loginSetting["default"] || {};
      this.imageList =
        settingValue.imageList && settingValue.imageList.length
          ? settingValue.imageList
          : defaultSetting.imageList;
      this.greetingList = settingValue.greetingList || [];
      this.defaultGreetingList = (loginSetting["default"] || {}).greetingList;
    } else {
      this.initLoginSetting();
    }
    // this.getLoginType();
  },
  methods: {
    ...mapActions([
      "SaveAttribute",
      "setAllUser",
      "SetCorpId",
      "PushGroup",
      "SetRobotList"
    ]),
    // 寻找当前时间对应的问候语
    findGreeting(greetingList) {
      const currentTime = this.$moment().format("HH:mm");
      const currentTip = (greetingList || []).find(item => {
        let timeRange = item.timeRange.split("-");
        let flag = true;
        if (timeRange[0] > timeRange[1]) {
          // 跨天
          flag =
            (currentTime >= timeRange[0] && currentTime < "24:00") ||
            (currentTime >= "00:00" && currentTime < timeRange[1]);
        } else {
          flag = currentTime >= timeRange[0] && currentTime < timeRange[1];
        }
        return flag;
      });
      return currentTip;
    },
    // 获取当前登录用户对应的所有的公司登录设置
    async getAllCorpLoginSetting() {
      const loginSetting =
        JSON.parse(localStorage.getItem("loginSetting")) || {};
      const newLoginSetting = {
        default: loginSetting["default"]
      };
      try {
        const resList = (await this.$service.getAllLoginClientSetting()) || [];
        resList.forEach(res => {
          this.$set(newLoginSetting, res.corpId, {
            imageList: (res.loginImage || []).map(item => item.imageUrl),
            greetingList: res.loginTimeTips || []
          });
        });
        localStorage.setItem("loginSetting", JSON.stringify(newLoginSetting));
      } catch (error) {}
    },
    // 初始化登录设置
    async initLoginSetting(isChangeValue = true) {
      try {
        const loginSetting =
          JSON.parse(localStorage.getItem("loginSetting")) || {};
        const res = (await this.$service.getLoginDefaultSetting()) || {};
        let imageList = (res.loginImage || []).map(item => item.imageUrl);
        let greetingList = res.loginTimeTips || [];
        if (isChangeValue) {
          this.imageList = [...imageList];
          this.greetingList = [...greetingList];
        }
        this.$set(loginSetting, "default", {
          imageList: imageList,
          greetingList: greetingList
        });
        localStorage.setItem("loginSetting", JSON.stringify(loginSetting));
      } catch (error) {
        this.imageList = [require(`@/assets/image/login/login-rotation.png`)];
      }
    },
    // 获取登录类型
    async getLoginType(qrFlag) {
      if (this.isRequesting) {
        return;
      }
      this.loginStatus = 0;
      this.hasSendLogin = false;
      ipcRenderer.send("del-token", { type: 3 });
      try {
        this.isRequesting = true;
        const res = await this.$service.getLoginType(qrFlag);
        this.loginType = res.loginType;
        this.loginUserInfo = {
          avatar: res.headerImage,
          name: res.accountName,
          accountId: res.accountId
        };
        this.zxAuthUiqueCode = res.zxAuthUiqueCode;
        this.qrUrl = res.qrUrl || "";
        this.showRefresh = false;
      } catch (error) {
        this.zxAuthUiqueCode = "";
        if (error.message != "Network Error") {
          this.$message.error(error.msg || "初始化失败");
        } else {
          this.getLoginType(true);
        }
      } finally {
        this.isRequesting = false;
        if (this.loginType == 2) {
          this.makeCode();
        }
      }
    },
    // 从内网返回至外网
    async backToLogin() {
      this.showNetworkSetting = false;
      this.IsLogin = false;
      this.isRequesting = false;
      if (this.showCode) {
        this.getLoginType();
      }
      this.formInline = { ...this.loginInfo };
      Vue.prototype.$apipath = apiPathConfig();
    },
    // 切换内网登录
    changeNetworkProxy() {
      if (this.IsLogin) {
        this.$message.info("正在登录中");
        return;
      }
      this.cancelAllAxios();
      this.timer && clearInterval(this.timer);
      this.loginInfo = { ...this.formInline };
      this.showNetworkSetting = true;
    },
    async loginAgainHandle() {
      try {
        ipcRenderer.send("del-token", { type: 3 });
        const res = await this.$service.sendLogin(this.zxAuthUiqueCode);
        if (res && res.code == "O_S_001") {
          clearInterval(this.timer);
          await this.getLoginType();
          this.loginAgainHandle();
        } else {
          this.loginStatus = 1;
          if (!this.hasSendLogin) {
            this.setTimer();
          }
          this.sendLoginTimeout = setTimeout(() => {
            this.loginStatus = 0;
          }, 10000);
        }
      } catch (error) {
        this.$message.error(error.msg || "登录失败，请重试");
      }
    },
    // 扫码后再次登录
    async loginAgain() {
      if (this.zxAuthUiqueCode) {
        this.loginAgainHandle();
      } else {
        await this.getLoginType();
        this.loginAgainHandle();
      }
    },
    // 设置定时器轮询扫码结果
    async setTimer() {
      await this.getLoginStatus();
      this.timer && clearInterval(this.timer);
      this.timer = setInterval(async () => {
        await this.getLoginStatus();
      }, 3000);
    },
    resetLoginHandle() {
      if (this.loginType == 1) {
        this.getLoginType();
      } else {
        this.loginStatus = 0;
        this.zxAuthUiqueCode = "";
        this.showRefresh = true;
      }
    },
    // 轮询接口结果处理
    async getLoginStatus() {
      try {
        const response = await this.$service.getAuthentication(
          this.zxAuthUiqueCode
        );
        const res = response.data || {};
        if (res.code === "O_S_007") {
          // 扫码成功
          this.loginStatus = 1;
          let uerInfo = res.userInfo || {};
          this.loginUserInfo = {
            avatar: uerInfo.headerImage,
            name: uerInfo.name
          };
        }
        if (
          ["O_S_001", "O_S_002 ", "O_S_003", "O_S_004"].includes(res.code) ||
          res.access_token
        ) {
          if (res.code === "O_S_001") {
            // 授权码已过期
            this.resetLoginHandle();
          } else if (res.code === "O_S_004") {
            this.$message.info("手机端取消登录");
            this.getLoginType(true);
          } else if (["O_S_002", "O_S_003"].includes(res.code)) {
            // 002 无权限，003唯一编码不存在
            this.$message.info(
              res.code == "O_S_002" ? "无权限授权登录" : "授权唯一编码不存在"
            );
            this.resetLoginHandle();
          }
          if (res.access_token) {
            this.sendLoginTimeout && clearTimeout(this.sendLoginTimeout);
            await this.initLoginSetting(false);
            ipcRenderer.send("save-token", {
              type: 1,
              token: res["access_token"]
            });
            ipcRenderer.send("save-token", {
              type: 2,
              token: res["refresh_token"]
            });
            this.loginStatus = 3;
            let name = this.loginUserInfo.name || res.name;
            this.loginUserInfo = {
              avatar: res.headerImage,
              name: name,
              accountId: res.accountId
            };
            this.handleAfterLogin("1");
          }
          clearInterval(this.timer);
        }
      } catch (error) {
        clearInterval(this.timer);
        if (error.message != "Network Error") {
          this.$message.error("登录失败，请重试！");
          if (this.loginType == 2 && this.showCode) {
            this.zxAuthUiqueCode = "";
            this.getLoginType(true);
          }
        } else {
          this.resetLoginHandle();
        }
      }
    },
    // 切换账号展示二维码
    changeAccount() {
      this.cancelAccount();
    },
    // 取消所有接口调用
    cancelAllAxios() {
      let evt = new Event("logout", { bubbles: true, cancelable: false });
      document.dispatchEvent(evt);
    },
    // 取消登陆展示二维码
    async cancelAccount() {
      // 清除token
      await this.$service.logout();
      this.cancelAllAxios();
      // 取消登录强制二维码
      this.getLoginType(true);
    },
    // 切换登录方式
    changeLoginType() {
      this.cancelAllAxios();
      this.timer && clearInterval(this.timer);
      this.IsLogin = false;
      this.isRequesting = false;
      this.showCode = !this.showCode;
      if (this.showCode) {
        // 二维码界面
        this.getLoginType();
      }
    },
    // 生成二维码
    makeCode() {
      this.$nextTick(() => {
        const qrcode = document.getElementById("qrcode");
        if (qrcode) {
          QRCode.toCanvas(
            qrcode,
            `${this.qrUrl ||
              "https://zhixin.zhiguaniot.com/downloads/"}?ZX-AUTH-UNIQUE-CODE=${
              this.zxAuthUiqueCode
            }`,
            {
              width: 140,
              height: 140,
              margin: 0
            },
            error => {
              if (error) console.error(error);
              console.log("success!");
            }
          );
          if (this.zxAuthUiqueCode) {
            // 返回正确的授权码才轮询
            this.setTimer();
          } else {
            this.showRefresh = true;
          }
        }
      });
    },
    // 登录处理
    async loginHandle(formInline) {
      // const net_type = formInline.type; // 网络类型
      // sessionStorage.setItem("net_type", net_type);
      // Vue.prototype.net_type = net_type;
      try {
        this.IsLogin = true;
        const account = formInline.user;
        const password = formInline.password;
        // this.handleBeforeLogin(formInline.user);
        try {
          let loginResult = await this.$service.loginByPwd.call(
            this,
            account,
            password
          );
        } catch (error) {
          // 登录出错时清空用户名
          localStorage.removeItem("remember_pwd");
          throw error;
        }
        await this.initLoginSetting(false);
        this.handleAfterLogin(formInline.type, formInline);
      } catch (error) {
        if (error) {
          let errorText = "登录出错，请重试";
          if (error.response && error.response.statusText) {
            errorText = "服务器连接失败";
          } else if (error.message && error.message.includes("Network Error")) {
            errorText = "网络错误";
          } else if (error.message) {
            errorText = error.message;
          }
          this.$Message.error(errorText);
        }
        this.IsLogin = false;
        sessionStorage.clear();
      }
    },
    // 登录后处理缓存
    async handleBeforeLogin(account) {
      const lastUser = localStorage.getItem("login_key");
      Vue.prototype.sqlite_update_time = {
        account: {},
        group: null
      }; //用于全局记录各个接口的增量更新时间
      // 之前未存用户信息或者当前登录人和之前用户信息不一致时清空数据库
      if (!lastUser || (lastUser && lastUser != account)) {
        let clear = await ipcRenderer.invoke("db-clear-data-all", {});
        localStorage.setItem(
          "isClearDb",
          JSON.stringify({ type: "3.0.3", isClear: true })
        );
      }
    },
    // 登陆后一些接口调用
    async handleAfterLogin(net_type, formInline) {
      sessionStorage.setItem("net_type", net_type);
      Vue.prototype.net_type = net_type;
      try {
        let userInfo = {};
        if (net_type == "1") {
          userInfo = await this.$service.getUserInfoByLogin.call(this);
        } else {
          userInfo = await this.$service.getUserInfo.call(this);
        }
        const account = userInfo.data.mobile; // 账号
        this.handleBeforeLogin(account);
        const pollTimestamp = userInfo.ctime; // 保存后台返回时间戳用于增量轮询使用
        sessionStorage.setItem("login-time", pollTimestamp);
        // 多账号的逻辑
        let sqliteUpdateTime = { account: null, group: null, storage: null }; //记录sqlite增量更新时间（account,group,storage），为null表示首次
        if (pollTimestamp) {
          await ipcRenderer.invoke("sqlite-connect", {
            name: account
          });
          // 查询sqlite上次保存成功时，存下的ctime时间（分别是account,group,storage）
          sqliteUpdateTime = await ipcRenderer.invoke("sqlite-query", {
            key: "indbTime",
            input: { id: "" }
          });
          console.log("sqliteUpdateTime=", sqliteUpdateTime); //获取成功入库的更新时间
        }
        const accountId = userInfo.data.id;
        try {
          // 神策埋点绑定账号信息
          sensors.login(accountId);
        } catch (e) {
          console.error("sensors load error");
        }
        // 获取APPKey
        if (net_type == "1") {
          let AppKey = await this.$service.getSecretKey.call(this);
          // 获取用户数据
          let corpList = userInfo.data.corpUsers || []; // 登陆用户所属公司
          let corpIds = corpList.map(corp => {
            const data = {};
            data.corpId = corp.corpId;
            data.corpType = corp.corp.corpTypeEnums || corp.corp.corpType;
            return data;
          }); // 所属公司id列表
          this.getAllCorpLoginSetting();
          let allUser = []; // 所在公司下所有人员信息
          if (!sqliteUpdateTime.account) {
            // 为初始化过数据进行数据初始化
            allUser = await this.getAllUserList(corpIds);
          } else {
            let data = await ipcRenderer.invoke("sqlite-query", {
              key: "getAllAccount"
            });
            allUser = data;
            this.getUpdateUser(net_type);
          }
          if (allUser.length) {
            this.setAllUser({ users: allUser, needClear: true });
          }

          await this.initRobotList(corpList, account, sqliteUpdateTime.robot);

          // 获取群组信息
          let groupList;
          if (sqliteUpdateTime.group) {
            let groupListPrev = await ipcRenderer.invoke("sqlite-query", {
              key: "getAllGroup"
            });
            this.PushGroup(groupListPrev);
            groupList = await this.$service.getGroupVo.call(this, {
              accountId,
              updateTime: sqliteUpdateTime.group
            });
            ipcRenderer.invoke("sqlite-url", {
              key: "saveIncreaseGroup",
              data: { list: groupList, ctime: this.getGroupListTime() }
            });
          } else {
            groupList = await this.$service.getGroup.call(this, {
              accountId
            });
            ipcRenderer.invoke("sqlite-url", {
              key: "saveAllGroup",
              data: { list: groupList, ctime: this.getGroupListTime() }
            });
          }

          this.$service.getStorage.call(this, {
            startTime: (sqliteUpdateTime && sqliteUpdateTime.storage) || 0
          });
          // 登录IM
          let loginIMResult = await this.$service.loginWebIM.call(this, {
            AppKey: AppKey.data.appKey,
            token: userInfo.data.imToken
          });
        }

        setTimeout(async () => {
          try {
            let switchKey = `switch-corp-${accountId}`;
            let switchCorpId = await ipcRenderer.invoke("db-get-data", {
              db: "base",
              key: switchKey
            });
            switchCorpId &&
              switchCorpId.data &&
              this.SetCorpId(switchCorpId.data);
          } catch (error) {
            console.error(error);
          }
          if (net_type == "1") {
            if (formInline && formInline.rempwd) {
              localStorage.setItem("remember_pwd", formInline.password);
            } else {
              localStorage.removeItem("remember_pwd");
            }
            // 二维码登录切状态为3或账号密码登录时才到首页
            if (this.loginStatus == 3 || formInline) {
              this.$router.push({ name: "chitchat" });
              PollingOutSideNotify.startPulling(pollTimestamp);
            }
            localStorage.setItem(
              "remember_state",
              JSON.stringify(formInline.rempwd)
            );
          } else {
            if (formInline) {
              localStorage.setItem("net_address", formInline.address);
              localStorage.setItem("net_port", formInline.port);
            }
            this.$router.push({ name: "notify" });
            PollingNotify.startPulling(pollTimestamp); // 内网进行固定弹框的轮询
          }
          localStorage.setItem("login_key", account);
        }, 500);
      } catch (error) {
        if (error && (this.loginStatus == 3 || formInline)) {
          let errorText = "登录出错，请重试";
          if (error.response && error.response.statusText) {
            errorText = "服务器连接失败";
          } else if (error.message && error.message.includes("Network Error")) {
            errorText = "网络错误";
          } else if (error.message) {
            errorText = error.message;
          }
          this.$Message.error(errorText);
        }
        this.IsLogin = false;
        await this.$service.logout();
        sessionStorage.clear();
        this.cancelAccount();
      }
    },
    // 获取上次增量更新的时间
    getGroupListTime() {
      return Vue.prototype.sqlite_update_time.group;
    },
    // 获取全部人员
    async getAllUserList(corpIds) {
      let userList = await Promise.all(
        corpIds.map(({ corpId, corpType }, index) => {
          let list = this.$service.getCorpAllUser.call(this, {
            corpId,
            corpType
          });
          return list;
        })
      );
      if (userList.length) {
        // 本地数据库存储用户数据
        userList = userList.reduce((userList, current) => {
          return userList.concat(current);
        });
        // const dbData = userList.map((item) => ({
        //   key: `${item.accountId}#${item.corpId}`,
        //   value: item,
        // }));
        // ipcRenderer
        //   .invoke("db-save-data", { db: "contact", data: dbData })
        //   .then((e) => console.log("db-save-data contact then ", e))
        //   .catch((e) => console.log("db-save-data contact catch ", e));
        ipcRenderer.invoke("sqlite-url", {
          key: "saveAllAccount",
          data: { list: userList, ctime: this.getUserListTime() }
        });
      }
      return userList;
    },
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
    getGroupListTime() {
      return Vue.prototype.sqlite_update_time.group;
    },
    // 获取增量更新人员
    async getUpdateUser(net_type) {
      if (net_type == 1) {
        await this.$service.getChangeResultData();
      } else {
        await this.$service.getListIuUser();
      }
    },
    async initRobotList(corpList, accountId, lastPostTime) {
      try {
        // 只取直属公司
        const res = await this.$service.getRobotList.call(this, {
          corpIdList: corpList
            .filter(
              item =>
                item.corp &&
                item.corp.corpTypeEnums === 0 &&
                item.corp.canJoin == 0
            )
            .map(item => item.corpId),
          accountId,
          lastPostTime
        });
        let robots = [...(res.data || [])];
        if (lastPostTime) {
          let robotListPrev = await ipcRenderer.invoke("sqlite-query", {
            key: "queryAllRobot"
          });
          if (robotListPrev && robotListPrev.length) {
            robots = robots.map(item => {
              const node =
                robotListPrev.find(a => a.accountId === item.accountId) || {};
              return {
                ...item,
                isDelinConversation: node.isDelinConversation || 0
              };
            });
          }
          await ipcRenderer.invoke("sqlite-url", {
            key: "saveIncreaseRobot",
            data: { ...res, data: robots }
          });
          robots = [...(robotListPrev || []), ...robots];
        } else {
          await ipcRenderer.invoke("sqlite-url", {
            key: "saveAllRobot",
            data: res
          });
          // console.log("群助手", res);
        }
        let robotList = await ipcRenderer.invoke("sqlite-query", {
          key: "queryAllRobot"
        });
        // 删除的机器人不在展示
        robotList = robotList.filter(item => item.isDel != 1);
        this.SetRobotList(robotList);
      } catch (error) {
        console.log(error);
      }
    }
  }
};
</script>
<style lang="scss" scoped>
#qrcode-login {
  width: 100%;
  height: 100%;
  display: flex;
  .qrcode-login-left {
    width: 370px;
    ::v-deep .el-carousel__indicators {
      bottom: 60px !important;
      .el-carousel__indicator {
        .el-carousel__button {
          background: #c9cfd8;
        }
        &.is-active {
          .el-carousel__button {
            width: 14px !important;
            background: #528eff;
            border-radius: 4px;
          }
        }
      }
    }
  }
  .qrcode-login-right {
    flex: 1;
    -webkit-app-region: drag;
    .qrcode-login-right-outside {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    ::v-deep .qrcode-login-system-button {
      button {
        color: #bfc2c8;
        font-size: 14px;
      }
    }
    .qrcode-login-right-greeting {
      margin-top: 95px;
      margin-left: 60px;
      flex-shrink: 0;
      &-default {
        width: 198px;
        height: 30px;
        img {
          width: 100%;
          height: 100%;
        }
      }
      &-custom {
        font-size: 24px;
        font-family: PingFangSC-Medium, PingFang SC;
        font-weight: 500;
        color: #333333;
        margin-top: 10px;
      }
    }
    &-content {
      flex: 1;
      margin-top: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-app-region: no-drag;
      &-code {
        position: relative;
        .refresh-code {
          width: 140px;
          height: 140px;
          position: absolute;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          img {
            width: 32px;
            height: 32px;
          }
          p {
            font-size: 14px;
            font-family: MicrosoftYaHei;
            color: #ffffff;
            margin-top: 8px;
          }
        }
        p {
          font-size: 16px;
          font-family: MicrosoftYaHei;
          color: #091933;
          margin-top: 20px;
        }
      }
      &-change-type {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-top: auto;
        img {
          width: 16px;
          height: 16px;
        }
        p {
          font-size: 16px;
          font-family: SourceHanSansCN-Regular, SourceHanSansCN;
          font-weight: 400;
          color: #5d616b;
          margin-left: 8px;
        }
      }
    }
    &-login {
      flex: 1;
      margin-top: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      -webkit-app-region: no-drag;
      .login-user-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 20px;
        letter-spacing: 2px;
      }
      .login-name {
        font-size: 20px;
        font-family: PingFangSC-Medium, PingFang SC;
        font-weight: 500;
        color: #3e7eff;
        margin-top: 24px;
      }
      .login-tip {
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #8f959e;
        margin-top: 8px;
      }
      .el-button {
        padding: 0;
        span {
          width: 100%;
          height: 100%;
          display: flex;
          align-content: center;
          justify-content: center;
        }
      }
      .login-button {
        margin-top: 60px;
        width: 200px;
        height: 44px;
        background: #3e7eff;
        border-radius: 4px;
        font-size: 18px;
        font-family: MicrosoftYaHei-Bold, MicrosoftYaHei;
        font-weight: bold;
        color: #ffffff;
        letter-spacing: 2px;
        border: none;
        &:active {
          border: none;
        }
      }
      .change-account {
        margin-top: 24px;
        width: 66px;
        height: 18px;
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #5d616b;
      }
      .cancel-loagin {
        margin-top: 60px;
        img {
          width: 16px;
          height: 16px;
          margin-right: 8px;
        }
      }
    }
    &-bottom {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      margin-top: 60px;
      -webkit-app-region: no-drag;
      img {
        width: 20px;
        height: 20px;
      }
      p {
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
        margin-left: 4px;
        cursor: pointer;
      }
    }
  }
}
</style>
