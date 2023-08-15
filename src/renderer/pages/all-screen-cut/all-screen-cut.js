import Vue from "vue";
import { Popover, Tooltip } from "element-ui";
// import AllScreenCut from "./all-screen-cut.vue";
import CutWrapper from './cut-wrapper.vue'

Vue.use(Popover);
Vue.use(Tooltip);
new Vue({
  render: (h) => h(CutWrapper),
}).$mount("#app");
