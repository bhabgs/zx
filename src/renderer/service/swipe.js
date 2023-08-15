import Vue from "vue";

export default {
  // 获取轮播图图片
  getSwipeImage({ corpId,adverSpace }, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.platform}/adver/select`,
        { corpId ,adverSpace},
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
