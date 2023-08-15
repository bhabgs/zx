import Vue from "vue";
// import config from "@/config";
import { Popover, Tooltip } from "element-ui";
import ScreenCut from "./screen-cut.vue";
// Vue.use(config.VueConfig);

Vue.use(Popover);
Vue.use(Tooltip);
new Vue({
  render: h => h(ScreenCut)
}).$mount("#app");
