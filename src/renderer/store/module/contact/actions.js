const Actions = {
  SetSelectDept({ commit }, data) {
    commit("SelectDept", data || {});
  },
  SetNoRelateUser({ commit }, data) {
    commit("NoRelateUser", data);
  },
  SetRobotList({ commit }, data) {
    commit("SetRobotList", data);
  }
};

export default Actions;
