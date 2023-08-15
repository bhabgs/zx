import Vue from "vue";
import { Util } from "@/plugin";
const { deepClone } = Util;
import { ConversationModel } from "../../../WebIM";

import stateTemplate from "@/store/stateTemplate";

const Mutations = {
  UPMICROAPPS(state, data) {
    state.microApp = data;
  },
  RESETSTATE(state) {
    const resetState = deepClone(stateTemplate("microAppState"));
    for (const key in resetState) {
      if (resetState.hasOwnProperty(key)) {
        Vue.set(state, key, resetState[key]);
      }
    }
  }
};

export default Mutations;
