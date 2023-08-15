<!--
 * 内网登录
-->
<template>
  <div class="login-network-proxy">
    <div class="networkTab" @click="backToLogin">
      <button class="iconfont icon-jiantou"></button>
      <span>返回</span>
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
          <Button type="primary" @click="handleSubmit" :disabled="isRequesting"
            >确定</Button
          >
        </FormItem>
      </Form>
    </div>
  </div>
</template>
<script>
import apiPathConfig from "@/config/api.path.config";
import Vue from "vue";
export default {
  name: "LoginNetworkProxy",
  data() {
    return {
      networkSetting: {
        type: "1",
        address: "",
        port: "",
        userName: "",
        password: "",
      }, // 网络设置
      isRequesting: false,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.networkSetting.type = "2"; // 切换网络设置默认内网登陆
      this.networkSetting.userName = localStorage.getItem("login_key") || "";
      this.networkSetting.address = localStorage.getItem("net_address") || "";
      this.networkSetting.port = localStorage.getItem("net_port") || "";
    });
  },
  methods: {
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
    // 退出网络设置
    backToLogin() {
      this.networkSetting = {
        type: "1",
        address: "",
        port: "",
        userName: localStorage.getItem("login_key") || "",
        password: "",
      };
      this.$emit("backToLogin");
    },
    // 测试网络代理
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
    // 检测网络IP地址是否格式正确
    checkIPAddress(str) {
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
    // 检测端口号格式是否正式
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
    // 测试表单是否填写完整
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
    // 确定
    handleSubmit() {
      if (this.checkForm(this.networkSetting.type)) {
        if (this.networkSetting.type == "1") {
          this.$emit("loginHandle", {
            user: this.networkSetting.userName,
            password: this.networkSetting.password,
            type: this.networkSetting.type,
          });
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
                this.$emit("loginHandle", {
                  user: this.networkSetting.userName,
                  password: this.networkSetting.password,
                  ...this.networkSetting,
                });
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
  },
};
</script>
<style lang="scss" scoped>
.login-network-proxy {
  padding: 40px 40px 30px 40px;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  -webkit-app-region: no-drag;
  .networkTab {
    width: 100%;
    margin-top: 20px;
    flex-shrink: 0;
    font-size: 16px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #5d616b;
    display: flex;
    align-items: center;
    > button {
      background: none;
      margin-right: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: #5d616b;
    }
  }

  .networkContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    margin-top: 20px;
    padding-left: 20px;
  }
  .setForm {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .ivu-form-item {
      margin-bottom: 16px;
      ::v-deep .ivu-form-item-label {
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #1f2329;
      }
      ::v-deep .ivu-select-selection,
      ::v-deep .ivu-input {
        width: 370px;
        height: 44px;
        background: #f6f6f6;
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #333333;
        border: none;
        &:focus {
          box-shadow: none;
        }
        > div {
          .ivu-select-selected-value {
            width: 100%;
            height: 100%;
            font-size: 16px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            line-height: 44px;
            color: #333333;
          }
        }
      }
      ::v-deep .ivu-select-dropdown {
        width: 370px !important;
        min-width: 370px !important;
        left: 2px !important;
      }
    }
    .operationButton {
      margin-top: auto;
      width: 370px;
      margin-bottom: 0;
      ::v-deep .ivu-form-item-content {
        display: flex;
        align-items: center;
        justify-content: center;
        button {
          width: 60px;
          height: 34px;
          font-size: 14px;
          padding: 0;
          &.ivu-btn:focus {
            box-shadow: none;
          }
          &:nth-child(1) {
            margin-right: auto;
            color: rgba(68, 152, 240, 1);
            display: flex;
            justify-content: flex-start;
          }
          &:nth-child(2) {
            margin-right: 14px;
          }
          &.ivu-btn-primary {
            background-color: #3f7eff;
            border-color: #3f7eff;
          }
        }
      }
    }
  }
}
</style>
