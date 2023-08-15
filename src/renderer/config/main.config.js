require("../plugin/RongFromCodePoint");
import "ant-design-vue/dist/antd.css";
import "iview/dist/styles/iview.css";
import "element-ui/lib/theme-chalk/index.css";
import "@/assets/styles/reset.scss";
import "@/assets/styles/animation.scss";
import "@/assets/iconfont/iconfont.css";

import moment from "moment";
import iView from "iview";
import ElementUI from "element-ui/lib/element-ui.common.js";
import Antd from "ant-design-vue/es";
import { notification } from "ant-design-vue";
import apiPathConfig from "./api.path.config";
import axios from "./axios.config";
import Components from "./components";
import Service from "@/service";
import SessionStorageName from "./session_storage_name";

import { Util } from "@/plugin";
const { formatDateFilter } = Util;

window.ondragstart = function(e) {
  if (e.target.tagName === "IMG") {
    return false;
  }
};
document.body.ondrop = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

notification.config({
  top: "40px"
});

export default Vue => {
  window.eventHub = new Vue();
  Vue.prototype.$apipath = apiPathConfig();
  Vue.use(ElementUI);
  Vue.use(iView);
  Vue.use(Antd);
  Vue.use(axios);
  Vue.prototype.$service = Service;
  Vue.prototype.$myUtils = Util;
  Vue.prototype.$moment = moment;
  Vue.prototype.$SessionStorageName = SessionStorageName;

  Vue.use(Components);
};
