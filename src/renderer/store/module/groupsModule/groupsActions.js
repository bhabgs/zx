const ACTIONS = {
  PushGroup({ commit }, data) {
    if (data instanceof Array) {
      data.forEach(group => {
        group.isgroup = true;
        commit("PUSHGROUP", group);
      });
    } else if (data) {
      data.isgroup = true;
      commit("PUSHGROUP", data);
    }
  },
  DeleteGroup({ commit, dispatch, getters }, id) {
    commit("DELETEGROUP", { id });
    const dialog = getters.GetDialogues.group[id];
    if (dialog) {
      dispatch("DeleteDialog", {
        data: dialog,
        isToast: false
      });
    }
  },
  RenameGroup({ commit, dispatch }, data) {
    commit("RENAMEGROUP", data);
    dispatch("UpdateDialog", {
      key: data.id,
      type: data.conversationType,
      data: { name: data.newName }
    });
  },
  SetSelectCompanyList({ commit }, data) {
    commit("SETSELECTCOMPANYLIST", data);
  }
};

export default ACTIONS;
