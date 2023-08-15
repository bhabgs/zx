/*
 * @Author: lixiaowei
 * @Date: 2021-01-04 21:14:42
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-01-04 22:42:23
 * @Description: file content
 * @FilePath: /zx-client-pc/src/renderer/pages/upgrade/upgrade.js
 */
import Vue from "vue";
import upgrade from "./upgrade.vue";
import { Progress, Button } from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
import "@/assets/styles/reset.scss";

import Logger from "../../../modules/logger";

Vue.use(Progress);
Vue.use(Button);

window.Logger = Logger;
new Vue({
  render: h => h(upgrade)
}).$mount("#app");
