import getters from "./getters";
import actions from "./actions";
import mutations from "./mutation";
import { Util } from "@/plugin";
const { deepClone } = Util;

import stateTemplate from "@/store/stateTemplate";

const state = deepClone(stateTemplate("microAppState"));
export default {
  state,
  getters,
  actions,
  mutations
};
