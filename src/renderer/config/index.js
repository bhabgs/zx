import mainConfig from "./main.config";
import Directives from "@/directives";
import Filters from '@/filters';

export default {
  VueConfig(Vue) {
    Vue.use(mainConfig);
    Vue.use(Directives);
    Vue.use(Filters);
  }
};
