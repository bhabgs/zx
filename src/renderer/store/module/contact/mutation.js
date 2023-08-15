import Vue from "vue";
import { Util } from "@/plugin";
const { deepClone } = Util;
import { ConversationModel } from "../../../WebIM";

import stateTemplate from "@/store/stateTemplate";

const Mutations = {
  SelectDept(state, data) {
    state.selectDept = data;
  },
  NoRelateUser(state, { user, del = false }) {
    if (!user || !user.id) return;
    if (del) {
      Vue.delete(state.noRelateUser, user.id);
    } else {
      Vue.set(state.noRelateUser, user.id, user);
    }
  },
  RESETSTATE(state) {
    const resetState = deepClone(stateTemplate("contactState"));
    for (const key in resetState) {
      if (resetState.hasOwnProperty(key)) {
        Vue.set(state, key, resetState[key]);
      }
    }
  },
  SetRobotList(state, data) {
    state.robotList = data;
  }
};

export default Mutations;
