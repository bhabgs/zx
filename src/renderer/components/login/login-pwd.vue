<!--
 * 账号密码登录
-->
<template>
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
        placeholder="请输入手机号"
      />
    </FormItem>
    <FormItem prop="password" class="login-form-item">
      <Input
        type="password"
        id="password"
        v-model.trim="formInline.password"
        @on-enter="loginHandle()"
        placeholder="请输入密码"
      />
    </FormItem>
    <FormItem class="checkgroup">
      <Checkbox v-model="rempwd">记住密码</Checkbox>
    </FormItem>
    <FormItem>
      <button
        :class="{
          'is-disable': IsLogin || !formInline.password || !formInline.user,
        }"
        :disabled="IsLogin || !formInline.password || !formInline.user"
        id="loginBtn"
        class="login-btn"
        type="button"
        @click="loginHandle()"
      >
        登录
      </button>
    </FormItem>
  </Form>
</template>
<script>
export default {
  name: "LoginPwd",
  props: {
    IsLogin: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      formInline: {
        user: "",
        password: "",
      }, //账号密码
      ruleInline: {
        user: [
          {
            required: true,
            message: "  ",
            trigger: "blur",
          },
        ],
        password: [
          {
            required: true,
            message: "  ",
            trigger: "blur",
          },
        ],
      }, //账号密码非空校验
      rempwd: true, // 记住密码
    };
  },
  mounted() {
    let pwd = localStorage.getItem("remember_pwd");
    pwd && this.$set(this.formInline, "password", pwd);
    const user = localStorage.getItem("login_key");
    user && this.$set(this.formInline, "user", user);
    const remember_state = localStorage.getItem("remember_state");
    remember_state && this.$set(this, "rempwd", JSON.parse(remember_state));
  },
  methods: {
    async loginHandle() {
      let valid = await this.$refs["formInline"].validate();
      if (valid) {
        this.$emit("loginHandle", {
          ...this.formInline,
          rempwd: this.rempwd,
          type: 1,
        });
      } else {
        this.$message.info("请认真填写表单！");
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.login-form {
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
  ::v-deep .ivu-form-item {
    margin-bottom: 16px;
  }
  ::v-deep input {
    padding: 0 25px;
    width: 370px;
    height: 44px;
    background: #f6f6f6;
    border-radius: 4px;
    transition: all 0.2s linear;
    font-size: 14px;
    border: none;
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
    margin-top: 24px;
    width: 370px;
    height: 44px;
    background: #3e7eff;
    border-radius: 4px;
    color: #fff;
    font-size: 20px;
    transition: all 0.2s linear;
    &.is-disable {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
