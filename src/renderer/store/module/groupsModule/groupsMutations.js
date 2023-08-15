import Vue from "vue";
// import { Util } from "@/plugin";
import Util from "@/plugin/utils";
const { deepClone } = Util;

import stateTemplate from "@/store/stateTemplate";

const MUTATIONS = {
  PUSHGROUP(state, data) {
    Vue.set(state.GroupsMap, data.id, data);
  },
  DELETEGROUP(state, { id, data }) {
    const group = state.GroupsMap[id];
    if (group) {
      Vue.delete(state.GroupsMap, id);
    }
  },
  RENAMEGROUP(state, { id, newName }) {
    const group = state.GroupsMap[id];
    if (group) {
      group.name = newName;
      Vue.set(state.GroupsMap, id, group);
    }
  },
  RESETSTATE(state) {
    const resetState = deepClone(stateTemplate("groupState"));
    for (const key in resetState) {
      if (resetState.hasOwnProperty(key)) {
        Vue.set(state, key, resetState[key]);
      }
    }
  },
  SETSELECTCOMPANYLIST(state, data) {
    state.selectCompanyList = {
      ...(data || {
        organization: [],
        outsource: []
      })
    };
  }
};

export default MUTATIONS;
