const Actions = {
  SetMicroApps({ commit }, data) {
    if (data) {
      commit("UPMICROAPPS", data);
    }
  }
};

export default Actions;
