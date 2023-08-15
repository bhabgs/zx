import Vue from "vue";
import store from "../../store";
import router from "../../router";
import Wrapper from "./winbox-wrapper.vue";

const WinboxWrapperConstructor = Vue.extend(Wrapper);

const showCombineMsg = (options) => {
  const instance = new WinboxWrapperConstructor({
    router,
    store,
    propsData: options,
  });
  instance.$mount();
  // document.body.appendChild(instance.$el);
  return instance;
};

Vue.prototype.$showCombineMsg = showCombineMsg;

export { showCombineMsg };
