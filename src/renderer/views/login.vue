<template>
  <div id="login">
    <div class="login-tab" v-if="!showNetworkSetting">
      <div class="login-tab-btns">
        <!-- <span class="tab-btn btn-scan" @click="tabHandle(1)" :class="{'is-active': activeIndex === 1}">扫码登录</span> -->
        <!-- <span class="tab-btn btn-pwd" @click="tabHandle(2)" :class="{'is-active': activeIndex === 2}">密码登录</span> -->
        <span class="tab-btn btn-pwd" style="width: 100%">密码登录</span>
      </div>
      <transition>
        <!-- <div v-if="activeIndex === 1" class="login-qr-code">
          <img id="code-img" class="qr-code" :src="codeSrc" alt="">
          <div class="qr-info">
            <span class="qr-hint">使用手机智信扫码登录</span>
            <button class="refresh-btn iconfont icon-refresh" @click="refreshCode">刷新</button>
          </div>
        </div>-->
        <!-- <div v-if="activeIndex === 2" class="login-pwd-box"> -->
        <div class="login-pwd-box" v-loading="IsLogin">
          <div class="logo"></div>
          <Form
            ref="formInline"
            :model="formInline"
            :rules="ruleInline"
            class="login-form"
          >
            <FormItem prop="user" class="login-form-item">
              <Input
                type="text"
                id="mobile"
                v-model.trim="formInline.user"
                @on-enter="loginHandle()"
                placeholder="手机号码"
              />
            </FormItem>
            <FormItem prop="password" class="login-form-item">
              <Input
                type="password"
                id="password"
                v-model.trim="formInline.password"
                @on-enter="loginHandle()"
                placeholder="用户密码"
              />
            </FormItem>
            <FormItem class="checkgroup">
              <Checkbox v-model="rempwd">记住密码</Checkbox>
            </FormItem>
            <FormItem>
              <button
                :class="{ 'is-disable': IsDisabled }"
                :disabled="IsDisabled"
                id="loginBtn"
                class="login-btn"
                type="button"
                @click="loginHandle()"
              >
                登录
              </button>
            </FormItem>
          </Form>
        </div>
      </transition>
    </div>
    <div class="login-tab" v-else>
      <div class="networkTab">
        <button class="iconfont icon-jiantou" @click="backToLogin"></button>
        <span>网络设置</span>
      </div>
      <div class="networkContent">
        <Form
          ref="networkSetting"
          class="setForm"
          v-model="networkSetting"
          label-position="top"
        >
          <FormItem label="类型" prop="type">
            <Select v-model="networkSetting.type" @on-change="changeNetType">
              <Option value="1">外网</Option>
              <Option value="2">内网</Option>
            </Select>
          </FormItem>
          <FormItem label="地址" prop="address">
            <Input
              :disabled="networkSetting.type == '1'"
              v-model.trim="networkSetting.address"
            />
          </FormItem>
          <FormItem label="端口" prop="port">
            <Input
              :disabled="networkSetting.type == '1'"
              v-model.trim="networkSetting.port"
            />
          </FormItem>
          <FormItem label="用户名" prop="userName">
            <Input v-model.trim="networkSetting.userName" />
          </FormItem>
          <FormItem label="密码" prop="password">
            <Input type="password" v-model.trim="networkSetting.password" />
          </FormItem>
          <FormItem class="operationButton">
            <Button
              type="text"
              @click="testNetwork"
              :disabled="networkSetting.type == 1 || isRequesting"
              >测试</Button
            >
            <Button @click="backToLogin" :disabled="isRequesting">取消</Button>
            <Button
              type="primary"
              @click="handleSubmit"
              :disabled="isRequesting"
              >确定</Button
            >
          </FormItem>
        </Form>
      </div>
    </div>
    <system-menu
      :options.sync="systemMenuOpt"
      class="systemButton"
      @showNetwork="showNetwork"
    ></system-menu>
  </div>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import { ipcRenderer, app } from "electron";
import apiPathConfig from "@/config/api.path.config";
import Vue from "vue";
import { PollingNotify, PollingOutSideNotify } from "../plugin/polling-notice";

export default {
  data() {
    return {
      IsLogin: false,
      activeIndex: 1,
      codeSrc: "",
      formInline: {
        user: "",
        password: "",
      },
      rempwd: true,
      systemMenuOpt: {
        showBtn: ["mini", "close", "select"],
      },
      ruleInline: {
        user: [
          {
            required: true,
            message: "请填写手机号码",
            trigger: "blur",
          },
        ],
        password: [
          {
            required: true,
            message: "请填写密码",
            trigger: "blur",
          },
        ],
      },
      showNetworkSetting: false,
      networkSetting: {
        type: "1",
        address: "",
        port: "",
        userName: "",
        password: "",
      },
      loginInfo: {},
      isRequesting: false,
    };
  },
  created() {},
  async mounted() {
    const clearList = JSON.parse(localStorage.getItem("isClearDb") || "null");
    let isClear = false;
    if (clearList && clearList.type == "3.0.3") {
      isClear = clearList.isClear;
    }
    if (!isClear) {
      // 版本号变更时清除缓存
      let clear = await ipcRenderer.invoke("db-clear-data-all", {});
      localStorage.setItem(
        "isClearDb",
        JSON.stringify({ type: "3.0.3", isClear: true })
      );
    }
    if (this.$myUtils.browser.IE) {
      document.execCommand("ClearAuthenticationCache", "false");
    }
    let pwd = localStorage.getItem("remember_pwd");
    pwd && this.$set(this.formInline, "password", pwd);
    const user = localStorage.getItem("login_key");
    if (user) {
      this.$set(this.formInline, "user", user);
      this.$set(this.networkSetting, "userName", user);
    }
    this.loginInfo = { ...this.formInline };
  },
  beforeRouteEnter(to, from, next) {
    ipcRenderer.send("gologin");
    next((vm) => {
      vm.backToLogin();
    });
  },
  beforeDestroy() {},
  computed: {
    ...mapGetters(["GetSendUser"]),
    IsDisabled() {
      return this.IsLogin;
    },
  },
  watch: {},
  methods: {
    ...mapActions(["SaveAttribute", "setAllUser", "SetCorpId", "PushGroup"]),
    /**
     * 切换网络类型
     */
    changeNetType(type) {
      if (type == "1") {
        this.networkSetting.address = "";
        this.networkSetting.port = "";
      } else {
        this.networkSetting.address = localStorage.getItem("net_address") || "";
        this.networkSetting.port = localStorage.getItem("net_port") || "";
      }
    },
    /**
     * 展示网络设置
     */
    showNetwork() {
      this.loginInfo = { ...this.formInline };
      this.showNetworkSetting = true;
      this.networkSetting.type = "2";
      this.changeNetType("2");
      this.systemMenuOpt = {
        showBtn: ["mini", "close"],
      };
    },
    backToLogin() {
      this.formInline = { ...this.loginInfo };
      this.showNetworkSetting = false;
      this.networkSetting = {
        type: "1",
        address: "",
        port: "",
        userName: localStorage.getItem("login_key") || "",
        password: "",
      };
      Vue.prototype.$apipath = apiPathConfig();
      this.systemMenuOpt = {
        showBtn: ["mini", "close", "select"],
      };
    },
    checkIPAddress(str) {
      // ^((25[0-5]|2[0-4]\\d|[1]{1}\\d{1}\\d{1}|[1-9]{1}\\d{1}|\\d{1})($|(?!\\.$)\\.)){4}$
      let flag = false;
      let reg = new RegExp(
        "^((https?):\/\/)?((25[0-5]|2[0-4]\\d|[1]{1}\\d{1}\\d{1}|[1-9]{1}\\d{1}|\\d{1})($|(?!\\.$)\\.)){4}$"
      );
      let reg_2 = /^((https?):\/\/)?[\w\-]+(\.[\w\-]+)+/;
      if (reg.test(str) || reg_2.test(str)) {
        flag = true;
      }
      return flag;
    },
    checkPort(str) {
      let flag = false;
      let reg = new RegExp(
        "^[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5]$"
      );
      if (str == "" || reg.test(str)) {
        flag = true;
      }
      return flag;
    },
    checkForm(type) {
      let flag = false;
      if (
        (type === "2" && this.checkIPAddress(this.networkSetting.address)) ||
        type === "1"
      ) {
        flag = true;
      } else {
        this.$Message.info("请输入正确的IP地址！");
        return false;
      }
      if (
        (type === "2" && this.checkPort(this.networkSetting.port)) ||
        type === "1"
      ) {
        flag = true;
      } else {
        this.$Message.info("请输入正确的端口号！");
        return false;
      }
      if (!!this.networkSetting.userName) {
        flag = true;
      } else {
        this.$Message.info("请输入用户名！");
        return false;
      }
      if (!!this.networkSetting.password) {
        flag = true;
      } else {
        this.$Message.info("请输入密码！");
        return false;
      }
      return flag;
    },
    testNetwork() {
      let flag = false;
      if (this.checkIPAddress(this.networkSetting.address)) {
        flag = true;
      } else {
        this.$Message.info("请输入正确的IP地址！");
        flag = false;
        return;
      }
      if (this.checkPort(this.networkSetting.port)) {
        flag = true;
      } else {
        this.$Message.info("请输入正确的端口号！");
        flag = false;
      }
      if (flag) {
        this.$Message.info("正在测试代理服务器");
        this.isRequesting = true;
        let address = `${this.networkSetting.address}${
          this.networkSetting.port ? ":" + this.networkSetting.port : ""
        }`;
        this.$myUtils
          .pingSimulate(address)
          .then((canConnect) => {
            this.$Message.destroy();
            if (!canConnect) {
              this.isRequesting = false;
              this.$Message.error("无法连接到代理服务器！");
            } else {
              setTimeout(() => {
                this.$Message.success("代理服务器可连接！");
                this.isRequesting = false;
              }, 300);
            }
          })
          .catch((error) => {
            this.$Message.destroy();
            this.isRequesting = false;
            this.$Message.error("无法连接到代理服务器！");
          });
      }
    },
    handleSubmit() {
      if (this.checkForm(this.networkSetting.type)) {
        if (this.networkSetting.type == "1") {
          this.formInline = {
            user: this.networkSetting.userName,
            password: this.networkSetting.password,
          };
          this.loginHandle(true);
        } else {
          this.isRequesting = true;
          let address = this.networkSetting.address;
          let port = this.networkSetting.port;
          port !== "" &&
            port !== undefined &&
            port !== null &&
            (address += `:${port}`); // 如果输入端口号，拼接上

          !address.includes("http") && (address = `http://${address}`); // 如果输入的地址没有http或https，则拼接上http

          this.$myUtils
            .pingSimulate(address)
            .then((canConnect) => {
              if (canConnect) {
                Vue.prototype.$apipath = apiPathConfig(2, `${address}/api`);
                this.formInline = {
                  user: this.networkSetting.userName,
                  password: this.networkSetting.password,
                };
                this.loginHandle(true);
              } else {
                this.$Message.error("无法连接到代理服务器！");
              }
              this.isRequesting = false;
            })
            .catch((error) => {
              this.isRequesting = false;
              this.$Message.error("无法连接到代理服务器！");
            });
        }
      }
    },
    tabHandle(index) {
      this.activeIndex = index;
    },
    refreshCode() {
      this.codeSrc = `//placeimg.com/294/294/nature?t=${Math.random()}`;
    },
    async loginHandle(value = false) {
      let valid = false;
      const net_type = this.networkSetting.type; // 网络类型
      sessionStorage.setItem("net_type", net_type);
      Vue.prototype.net_type = net_type;
      if (value) {
        valid = value;
      } else {
        valid = await this.$refs["formInline"].validate();
      }
      if (valid) {
        try {
          this.IsLogin = true;
          const account = this.formInline.user;
          const password = this.formInline.password;
          const lastUser = localStorage.getItem("login_key");
          Vue.prototype.sqlite_update_time = {
            account: {},
            group: null,
          }; //用于全局记录各个接口的增量更新时间
          // 之前未存用户信息或者当前登录人和之前用户信息不一致时清空数据库
          if (!lastUser || (lastUser && lastUser != this.formInline.user)) {
            let clear = await ipcRenderer.invoke("db-clear-data-all", {});
            localStorage.setItem(
              "isClearDb",
              JSON.stringify({ type: "3.0.3", isClear: true })
            );
          }
          let loginResult = await this.$service.loginByPwd.call(
            this,
            account,
            password
          );

          const pollTimestamp = loginResult.ctime; // 保存后台返回时间戳用于增量轮询使用
          sessionStorage.setItem("login-time", pollTimestamp);
          let sqliteUpdateTime = { account: null, group: null, storage: null }; //记录sqlite增量更新时间（account,group,storage），为null表示首次
          // 多账号的逻辑
          if (pollTimestamp) {
            await ipcRenderer.invoke("sqlite-connect", {
              name: account,
            });
            // 查询sqlite上次保存成功时，存下的ctime时间（分别是account,group,storage）
            sqliteUpdateTime = await ipcRenderer.invoke("sqlite-query", {
              key: "indbTime",
              input: { id: "" },
            });
            console.log("sqliteUpdateTime=", sqliteUpdateTime); //获取成功入库的更新时间
          }

          // 获取用户信息
          let userInfo = await this.$service.getUserInfo.call(this);
          const accountId = userInfo.data.id;
          try {
            // 神策埋点绑定账号信息
            sensors.login(accountId);
          } catch (e) {
            console.error("sensors load error");
          }

          // 获取APPKey
          if (net_type === "1") {
            let AppKey = await this.$service.getSecretKey.call(this);
            // 获取用户数据
            let corpList = userInfo.data.corpUsers || []; // 登陆用户所属公司
            let corpIds = corpList.map((corp) => {
              const data = {};
              data.corpId = corp.corpId;
              data.corpType = corp.corp.corpTypeEnums || corp.corp.corpType;

              return data;
            }); // 所属公司id列表
            let allUser = []; // 所在公司下所有人员信息
            if (!sqliteUpdateTime.account) {
              // 为初始化过数据进行数据初始化
              allUser = await this.getAllUserList(corpIds);
            } else {
              let data = await ipcRenderer.invoke("sqlite-query", {
                key: "getAllAccount",
              });
              allUser = data;
              this.getUpdateUser(net_type);
            }
            if (allUser.length) {
              this.setAllUser({ users: allUser, needClear: true });
            }

            // 获取群组信息
            let groupList;
            if (sqliteUpdateTime.group) {
              let groupListPrev = await ipcRenderer.invoke("sqlite-query", {
                key: "getAllGroup",
              });
              this.PushGroup(groupListPrev);
              groupList = await this.$service.getGroupVo.call(this, {
                accountId,
                updateTime: sqliteUpdateTime.group,
              });
              ipcRenderer.invoke("sqlite-url", {
                key: "saveIncreaseGroup",
                data: { list: groupList, ctime: this.getGroupListTime() },
              });
            } else {
              groupList = await this.$service.getGroup.call(this, {
                accountId,
              });
              ipcRenderer.invoke("sqlite-url", {
                key: "saveAllGroup",
                data: { list: groupList, ctime: this.getGroupListTime() },
              });
            }

            this.$service.getStorage.call(this, {
              startTime: (sqliteUpdateTime && sqliteUpdateTime.storage) || 0,
            });

            // 登录IM
            let loginIMResult = await this.$service.loginWebIM.call(this, {
              AppKey: AppKey.data.appKey,
              token: userInfo.data.imToken,
            });
          }
          setTimeout(async () => {
            try {
              let switchKey = `switch-corp-${accountId}`;
              let switchCorpId = await ipcRenderer.invoke("db-get-data", {
                db: "base",
                key: switchKey,
              });
              switchCorpId &&
                switchCorpId.data &&
                this.SetCorpId(switchCorpId.data);
            } catch (error) {
              console.error(error);
            }
            if (net_type == "1") {
              this.$router.push({ name: "chitchat" });
              PollingOutSideNotify.startPulling(pollTimestamp);
            } else {
              localStorage.setItem("net_address", this.networkSetting.address);
              localStorage.setItem("net_port", this.networkSetting.port);
              this.$router.push({ name: "notify" });
              PollingNotify.startPulling(pollTimestamp); // 内网进行固定弹框的轮询
            }

            if (this.rempwd) {
              localStorage.setItem("remember_pwd", this.formInline.password);
            } else {
              localStorage.removeItem("remember_pwd", this.formInline.password);
            }
            localStorage.setItem("login_key", this.formInline.user);
          }, 500);
        } catch (error) {
          if (error) {
            let errorText = "登录出错，请重试";
            if (error.response && error.response.statusText) {
              errorText = "服务器连接失败";
            } else if (
              error.message &&
              error.message.includes("Network Error")
            ) {
              errorText = "网络错误";
            } else if (error.message) {
              errorText = error.message;
            }
            this.$Message.error(errorText);
          }
          this.IsLogin = false;
          sessionStorage.clear();
        }
      }
    },
    async getAllUserList(corpIds) {
      let userList = await Promise.all(
        corpIds.map(({ corpId, corpType }, index) => {
          let list = this.$service.getCorpAllUser.call(this, {
            corpId,
            corpType,
          });
          return list;
        })
      );
      if (userList.length) {
        // 本地数据库存储用户数据
        userList = userList.reduce((userList, current) => {
          return userList.concat(current);
        });
        // const dbData = userList.map(item => ({
        //   key: `${item.accountId}#${item.corpId}`,
        //   value: item
        // }));
        // ipcRenderer
        //   .invoke("db-save-data", { db: "contact", data: dbData })
        //   .then(e => console.log("db-save-data contact then ", e))
        //   .catch(e => console.log("db-save-data contact catch ", e));

        ipcRenderer.invoke("sqlite-url", {
          key: "saveAllAccount",
          data: { list: userList, ctime: this.getUserListTime() },
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
    async getUpdateUser(net_type) {
      if (net_type == 1) {
        await this.$service.getChangeResultData();
      } else {
        await this.$service.getListIuUser();
      }
    },
    errorHint(error) {
      this.$Message.error("登录出错，请重试");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

#login {
  width: 400px;
  height: 550px;
  display: flex;
  align-items: center;
  justify-content: center;
  .systemButton {
    top: 16px;
  }
  > * {
    user-select: none;
  }

  /* 登录主题tab */
  .login-tab {
    overflow: hidden;
    width: 400px;
    height: 550px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 0 20px rgba(139, 145, 139, 0.35);
  }
  .login-tab-btns {
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;
    .tab-btn {
      width: 49.9999%;
      height: 60px;
      line-height: 60px;
      // background: rgba(68, 152, 240, 1);
      background: #3e7eff;
      text-align: center;
      font-size: 20px;
      color: #fff;
      transition: all 0.2s linear;
      &.is-active {
        background: rgba(247, 247, 247, 1);
        color: #000;
      }
    }
  }
  /* 密码登录 */
  .login-pwd-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: calc(100% - 60px);
    border: 1px solid #d6d6d6 {
      top: 0;
    }
    .logo {
      margin-top: 60px;
      width: 82px;
      height: 82px;
      background: url("~@/assets/image/login/logo.png") no-repeat;
      background-size: 100% 100%;
      background-position: center center;
    }

    .login-form {
      margin-top: 60px;

      .checkgroup {
        margin-bottom: 0;
        ::v-deep input {
          height: 20px;
        }
        ::v-deep .ivu-checkbox-checked .ivu-checkbox-inner {
          border-color: #3e7eff;
          background-color: #3e7eff;
        }
      }

      ::v-deep input {
        padding: 0 25px;
        width: 340px;
        height: 50px;
        background: #fff;
        border-radius: 25px;
        transition: all 0.2s linear;
        font-size: 14px;
        &:focus {
          background: rgba(62, 126, 255, 0.05);
          border-color: #3e7eff;
          box-shadow: none;
        }
      }
      ::v-deep .ivu-input-icon-clear {
        height: 50px;
        line-height: 50px;
        right: 5px;
        color: #bbb;
      }

      ::v-deep .ivu-form-item-error-tip {
        padding-left: 25px;
      }
      .login-btn {
        margin-top: 30px;
        width: 340px;
        height: 50px;
        background: #3e7eff;
        border-radius: 25px;
        color: #fff;
        font-size: 20px;
        transition: all 0.2s linear;
        &.is-disable {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  /* 扫码登录 */
  .login-qr-code {
    display: flex;
    flex-direction: column;
    align-items: center;
    .qr-code {
      margin-top: 60px;
      margin-bottom: 28px;
      width: 294px;
      height: 294px;
      transition: all 0.2s linear;
    }
    .qr-info {
      width: 294px;
      display: flex;
      .qr-hint {
        margin-right: 20px;
        font-size: 20px;
      }
      .refresh-btn {
        color: $--default-theme-color;
        font-size: 20px;
        background-color: transparent;
        &::before {
          margin-right: 10px;
        }
      }
    }
  }

  .networkTab {
    -webkit-app-region: drag;
    width: 100%;
    height: 60px;
    background: rgba(68, 152, 240, 1);
    font-size: 20px;
    color: #fff;
    display: flex;
    align-items: center;
    > button {
      background: none;
      padding: 0 6px;
      margin: 0 6px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      color: #fff;
    }
  }

  .networkContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: calc(100% - 60px);
    padding: 20px 30px;
    border: 1px solid #d6d6d6 {
      top: 0;
    }
  }
  .setForm {
    width: 100%;
    height: 100%;
    overflow: hidden;
    ::v-deep .ivu-form-item {
      margin-bottom: 20px;
      .ivu-form-item-label {
        font-size: 14px;
        color: #333;
        font-weight: 400;
      }
      ::v-deep .ivu-select-selection,
      .ivu-input {
        height: 34px;
      }
    }
    ::v-deep .operationButton {
      .ivu-form-item-content {
        display: flex;
        align-items: center;
        justify-content: center;
        button {
          width: 80px;
          height: 34px;
          font-size: 14px;
          padding: 0;
          &.ivu-btn:focus {
            box-shadow: none;
          }
          &:nth-child(1) {
            margin-right: auto;
            color: rgba(68, 152, 240, 1);
          }
          &:nth-child(2) {
            margin-right: 14px;
          }
        }
      }
    }
  }
}
</style>
