import Vue from "vue";
import TopNotice from "./top-notice.vue";
import { Button, Badge, Dropdown, Menu, Icon } from "ant-design-vue";
import 'ant-design-vue/dist/antd.css';
import "@/assets/styles/reset.scss";

Vue.use(Icon);
Vue.use(Button);
Vue.use(Badge);
Vue.use(Dropdown);
Vue.use(Menu);

new Vue({
  render: h => h(TopNotice)
}).$mount("#app");
