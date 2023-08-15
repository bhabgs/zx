///// <reference path="../../static/libs/RongIMLib-2.10.1.d.ts" />

/**
 * 引入IM
 */
//  require("./../../static/libs/RongIMLib-2.5.6.js");
// require("./../../static/libs/RongIMLib-2.10.5.prod.js");
require("./../../static/libs/RongIMLib-v2-Adapter-5.3.3.prod");
require("./../../static/libs/protobuf-2.3.7.min.js");
require("./../../static/libs/RongEmoji-2.2.7.js");

require(`@/assets/styles/outsource-theme.scss`);
import Vue from "vue";
import router from "./router";
import store from "./store";
import App from "./App.vue";
import config from "./config";
import Logger from "../modules/logger";
import './components/popwin';
import 'uno.css'

Vue.use(config.VueConfig);
// require("../modules/crash-reporter").init();

const info = console.info;

console.info = (...args) => {
  // Logger.info(...args);
  info(...args);
};

window.Logger = Logger;

/* eslint-disable no-new */
if (process.env.NODE_ENV !== "production") {
  Vue.config.performance = true;
}

Vue.config.errorHandler = function(err, vm, info) {
  let {
    message, // 异常信息
    name, // 异常名称
    stack // 异常堆栈信息
  } = err;
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
    console.dir(vm);
    console.dir(info);
  }
  // vm 为抛出异常的 Vue 实例
  // info 为 Vue 特定的错误信息，比如错误所在的生命周期钩子
};

Vue.prototype._winboxMap = {};

window.addEventListener("unhandledrejection", e => {
  if (e && e.reason) {
    try {
      if (typeof e.reason === "object" && e.reason.config) {
        e.reason.config.headers && delete e.reason.config.headers;
        e.reason.config.params && delete e.reason.config.params;
        e.reason.config.data && delete e.reason.config.data;
        e.reason.request && delete e.reason.request;
      }
    } catch (error) {}
    Logger.error({
      type: "global listener unhandledrejection",
      reason: e.reason
    });
    e.preventDefault();
  }
});

// 禁用浏览器的前进后退
window.addEventListener('popstate', function() {
  history.pushState(null, null, document.URL)
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
