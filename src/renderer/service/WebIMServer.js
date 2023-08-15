import { IMSDKServer } from "@/WebIM";
import Vue from "vue";
import store from "../store";

export default {
  // 获取融云秘钥
  getSecretKey(config = {}) {
    return this.$http
      .post(`${this.$apipath.chatPath}/users/getSecretKey`, {}, config)
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      });
  },
  // 登录IM
  async loginWebIM({ AppKey, token, flag = 1 }) {
    let instance = new IMSDKServer({ AppKey });
    try {
      let login = await instance.connect({ token });
    } catch (error) {
      if (error && error.code === "im_token_invalid" && flag < 4) {
        let user = store.getters.GetSendUser;
        let newtoken = await Vue.prototype.$service.updateImToken({
          accountId: user.id,
          name: user.name,
          avatar: user.avatar
        });
        let result = newtoken.data
          ? Vue.prototype.$service.loginWebIM({
              AppKey,
              token: newtoken.data,
              flag: ++flag
            })
          : Promise.reject(error);
        return result;
      } else {
        return Promise.reject(error);
      }
    }
  },
  // 刷新用户融云IMtoken
  updateImToken({ accountId, name, avatar }, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/users/updateImtoken`,
        {
          accountId,
          name,
          avatar
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      });
  }
};
