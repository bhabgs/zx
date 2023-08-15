import Vue from "vue";
import {Loading, Message, Popover,Button} from 'element-ui'
import "element-ui/lib/theme-chalk/reset.css";
import { Tooltip } from 'ant-design-vue'
import ShowImg from "./show-media.vue";

// import config from "@/config";
import Service from "@/service";
import apiPathConfig from "@/config/api.path.config";
import axios from "@/config/axios.config";
import Logger from "../../../modules/logger";
import "video.js/dist/video-js.css";
import "@/assets/iconfont/iconfont.css";
import "@/assets/styles/reset.scss"
// Vue.use(config.VueConfig);

window.Logger = Logger;
Vue.use(Button)
Vue.use(Popover)
Vue.use(Tooltip)
Vue.use(Loading.directive);
Vue.use(axios);
Vue.prototype.$message = Message;
Vue.prototype.$service = Service;
Vue.prototype.$apipath = apiPathConfig();

new Vue({
  render: h => h(ShowImg)
}).$mount("#app");
