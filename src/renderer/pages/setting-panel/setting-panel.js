/*
 * @Author: lixiaowei
 * @Date: 2021-04-15 16:27:38
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-17 14:24:54
 * @Description: 设置
 * @FilePath: /zx-client-pc/src/renderer/pages/setting-panel/setting-panel.js
 */
import Vue from "vue";
import { Menu, Input, Button } from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
import "@/assets/iconfont/iconfont.css";
import SettingPanel from "./setting-panel.vue";
import 'uno.css'

Vue.use(Menu);
Vue.use(Input);
Vue.use(Button);

new Vue({
  render: h => h(SettingPanel)
}).$mount("#app");
